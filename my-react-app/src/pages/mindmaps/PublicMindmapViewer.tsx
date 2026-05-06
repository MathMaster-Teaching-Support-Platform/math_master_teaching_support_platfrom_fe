import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import MindElixir, { THEME as MindElixirLightTheme } from 'mind-elixir';
import 'mind-elixir/style.css';
import { MindmapService } from '../../services/api/mindmap.service';
import type { Mindmap, MindmapNode } from '../../types';
import './PublicMindmapViewer.css';

const MINDMAP_THEME = {
  ...MindElixirLightTheme,
  background: '#F0EEE6',
  color: '#141413',
  cssVar: {
    ...((MindElixirLightTheme as { cssVar?: Record<string, string> }).cssVar ?? {}),
    '--bgcolor': '#F0EEE6',
    '--main-bgcolor': '#ffffff',
    '--main-color': 'transparent',   // removes grey border on L1 nodes
    '--color': '#444',
    '--root-radius': '16px',
    '--main-radius': '100px',        // pill shape for L1
    '--root-border-color': 'rgba(0,0,0,0)',
    '--selected': 'rgba(79,126,247,0.18)',
    '--node-gap-x': '32px',
    '--node-gap-y': '8px',
    '--main-gap-x': '80px',
    '--main-gap-y': '30px',
    '--topic-padding': '5px 18px',
  },
};

// Depth-based color system: root → branch (rich) → leaf (light tinted)
const BRANCH_COLORS = [
  '#4F7EF7', // indigo-blue
  '#2EAD7A', // emerald
  '#E07B39', // burnt orange  (brand)
  '#9B6FE0', // violet
  '#3DAAC5', // teal
  '#D4826A', // terracotta
  '#5B9E6D', // forest green
  '#C97AB2', // mauve
] as const;

const LEAF_BG = [
  '#E8EFFE', // indigo-blue light
  '#D5F2E8', // emerald light
  '#FCEADE', // orange light
  '#EDE5FB', // violet light
  '#D8F1F7', // teal light
  '#FAE9E3', // terracotta light
  '#DDF0E4', // forest light
  '#F6E8F3', // mauve light
] as const;

const LEAF_FG = [
  '#1E3A8A', // indigo-blue dark
  '#064E3B', // emerald dark
  '#7C2D12', // orange dark
  '#3B0764', // violet dark
  '#0C4A6E', // teal dark
  '#431407', // terracotta dark
  '#14532D', // forest dark
  '#500724', // mauve dark
] as const;

interface MindElixirNodeData {
  id: string;
  topic: string;
  expanded?: boolean;
  branchColor?: string;
  style?: {
    color?: string;
    background?: string;
  };
  children?: MindElixirNodeData[];
}

interface MindElixirData {
  nodeData: MindElixirNodeData;
}

interface MindElixirInstance {
  init: (data: MindElixirData) => void;
  destroy?: () => void;
}

interface ExportRequestMessage {
  type?: string;
  requestId?: string;
  mindmapId?: string;
}

const flattenNodes = (nodes: MindmapNode[]): MindmapNode[] => {
  const result: MindmapNode[] = [];
  nodes.forEach((node) => {
    result.push(node);
    if (node.children && node.children.length > 0) {
      result.push(...flattenNodes(node.children));
    }
  });
  return result;
};

const uniqueFlatNodes = (nodes: MindmapNode[]): MindmapNode[] => {
  const byId = new Map<string, MindmapNode>();
  flattenNodes(nodes).forEach((node) => {
    byId.set(node.id, { ...node, children: [] });
  });
  return Array.from(byId.values());
};

export default function PublicMindmapViewer() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEmbedPreview = searchParams.get('embedPreview') === '1';
  const [mindmap, setMindmap] = useState<Mindmap | null>(null);
  const [mindmapNodes, setMindmapNodes] = useState<MindmapNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mindInstanceRef = useRef<MindElixirInstance | null>(null);

  const exportCurrentViewAsPngDataUrl = async (): Promise<string> => {
    const container = containerRef.current;
    if (!container) {
      throw new Error('Không tìm thấy canvas mindmap để xuất ảnh.');
    }

    const renderedMap =
      (container.querySelector('.map-container') as HTMLElement | null) ||
      (container.querySelector('.map-canvas') as HTMLElement | null) ||
      container;

    const rootRect = renderedMap.getBoundingClientRect();
    const descendants = Array.from(renderedMap.querySelectorAll<HTMLElement | SVGElement>('*'));

    let minX = 0;
    let minY = 0;
    let maxX = Math.max(renderedMap.clientWidth, 1);
    let maxY = Math.max(renderedMap.clientHeight, 1);

    descendants.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const left = rect.left - rootRect.left;
      const top = rect.top - rootRect.top;
      const right = rect.right - rootRect.left;
      const bottom = rect.bottom - rootRect.top;

      minX = Math.min(minX, left);
      minY = Math.min(minY, top);
      maxX = Math.max(maxX, right);
      maxY = Math.max(maxY, bottom);
    });

    const padding = 48;
    const captureWidth = Math.ceil(maxX - minX + padding * 2);
    const captureHeight = Math.ceil(maxY - minY + padding * 2);
    const offsetX = Math.ceil(padding - minX);
    const offsetY = Math.ceil(padding - minY);

    const originalChildren = Array.from(renderedMap.childNodes);
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    wrapper.style.transformOrigin = 'top left';

    const previousPosition = renderedMap.style.position;
    const previousWidth = renderedMap.style.width;
    const previousHeight = renderedMap.style.height;
    const previousOverflow = renderedMap.style.overflow;
    const previousMinHeight = renderedMap.style.minHeight;

    try {
      originalChildren.forEach((node) => wrapper.appendChild(node));
      renderedMap.appendChild(wrapper);

      renderedMap.style.position = 'relative';
      renderedMap.style.width = `${captureWidth}px`;
      renderedMap.style.height = `${captureHeight}px`;
      renderedMap.style.overflow = 'hidden';
      renderedMap.style.minHeight = '0';

      const canvas = await html2canvas(renderedMap, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
        width: captureWidth,
        height: captureHeight,
        windowWidth: captureWidth,
        windowHeight: captureHeight,
        scrollX: 0,
        scrollY: 0,
      });

      return canvas.toDataURL('image/png');
    } finally {
      while (wrapper.firstChild) {
        renderedMap.appendChild(wrapper.firstChild);
      }
      wrapper.remove();

      renderedMap.style.position = previousPosition;
      renderedMap.style.width = previousWidth;
      renderedMap.style.height = previousHeight;
      renderedMap.style.overflow = previousOverflow;
      renderedMap.style.minHeight = previousMinHeight;
    }
  };

  useEffect(() => {
    const loadPublicMindmap = async () => {
      if (!id) {
        setError('Không tìm thấy ID mindmap');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await MindmapService.getPublicMindmapById(id);
        setMindmap(response.result.mindmap);
        setMindmapNodes(uniqueFlatNodes(response.result.nodes));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải mindmap công khai');
      } finally {
        setLoading(false);
      }
    };

    void loadPublicMindmap();
  }, [id]);

  useEffect(() => {
    if (!isEmbedPreview || !id) return;

    const status = loading ? 'loading' : error || !mindmap ? 'error' : 'ready';

    globalThis.window.parent?.postMessage(
      {
        type: 'public-mindmap-viewer-status',
        mindmapId: id,
        status,
        message: error || null,
      },
      globalThis.window.location.origin
    );
  }, [isEmbedPreview, id, loading, error, mindmap]);

  useEffect(() => {
    if (!isEmbedPreview || !id) return;

    const handleExportRequest = async (event: MessageEvent) => {
      if (event.origin !== globalThis.window.location.origin) return;

      const payload = event.data as ExportRequestMessage | undefined;
      if (!payload || payload.type !== 'public-mindmap-export-request') return;
      if (payload.mindmapId !== id) return;

      const requestId = payload.requestId;
      if (!requestId) return;

      if (loading || error || !mindmap) {
        globalThis.window.parent?.postMessage(
          {
            type: 'public-mindmap-export-response',
            requestId,
            mindmapId: id,
            status: 'error',
            message: error || 'Mindmap chưa sẵn sàng để xuất ảnh.',
          },
          globalThis.window.location.origin
        );
        return;
      }

      try {
        const dataUrl = await exportCurrentViewAsPngDataUrl();
        globalThis.window.parent?.postMessage(
          {
            type: 'public-mindmap-export-response',
            requestId,
            mindmapId: id,
            status: 'success',
            dataUrl,
          },
          globalThis.window.location.origin
        );
      } catch (exportError) {
        globalThis.window.parent?.postMessage(
          {
            type: 'public-mindmap-export-response',
            requestId,
            mindmapId: id,
            status: 'error',
            message:
              exportError instanceof Error ? exportError.message : 'Không thể xuất ảnh mindmap.',
          },
          globalThis.window.location.origin
        );
      }
    };

    globalThis.window.addEventListener('message', handleExportRequest);
    return () => {
      globalThis.window.removeEventListener('message', handleExportRequest);
    };
  }, [isEmbedPreview, id, loading, error, mindmap]);

  const mindData = useMemo<MindElixirData | null>(() => {
    if (!mindmapNodes.length) return null;

    const allNodes = uniqueFlatNodes(mindmapNodes);
    const childrenMap = new Map<string, MindmapNode[]>();

    allNodes.forEach((node) => {
      if (!node.parentId) return;
      const siblings = childrenMap.get(node.parentId) || [];
      siblings.push(node);
      childrenMap.set(node.parentId, siblings);
    });

    childrenMap.forEach((siblings) => {
      siblings.sort((a, b) => a.displayOrder - b.displayOrder);
    });

    const rootNode = allNodes.find((node) => !node.parentId);
    if (!rootNode) {
      return null;
    }

    const buildNode = (
      node: MindmapNode,
      depth: number,
      branchIdx: number
    ): MindElixirNodeData => {
      let style: { color: string; background: string };
      let branchColor: string | undefined;

      if (depth === 0) {
        style = { color: '#FAF9F5', background: '#1C1C1A' };
      } else if (depth === 1) {
        const i = branchIdx % BRANCH_COLORS.length;
        style = { color: '#ffffff', background: BRANCH_COLORS[i] };
        // branchColor tells Mind Elixir to paint the connecting lines this color
        branchColor = BRANCH_COLORS[i];
      } else {
        const i = branchIdx % LEAF_BG.length;
        style = { color: LEAF_FG[i], background: LEAF_BG[i] };
      }

      return {
        id: node.id,
        topic: node.content,
        expanded: true,
        branchColor,
        style,
        children: (childrenMap.get(node.id) || []).map((child, childIdx) =>
          buildNode(child, depth + 1, depth === 0 ? childIdx : branchIdx)
        ),
      };
    };

    return {
      nodeData: buildNode(rootNode, 0, 0),
    };
  }, [mindmapNodes]);

  useEffect(() => {
    if (!containerRef.current || !mindData || !mindmap) return;

    if (mindInstanceRef.current?.destroy) {
      mindInstanceRef.current.destroy();
    }

    containerRef.current.innerHTML = '';

    const instance = new MindElixir({
      el: containerRef.current,
      direction: MindElixir.SIDE,
      draggable: false,
      editable: false,
      toolBar: false,
      contextMenu: false,
      keypress: false,
      theme: MINDMAP_THEME,
    }) as unknown as MindElixirInstance;

    instance.init(mindData);
    mindInstanceRef.current = instance;

    return () => {
      if (mindInstanceRef.current?.destroy) {
        mindInstanceRef.current.destroy();
      }
      mindInstanceRef.current = null;
    };
  }, [mindData, mindmap]);

  if (loading) {
    return (
      <main className={`public-mindmap-page${isEmbedPreview ? ' embed-preview' : ''}`}>
        <div className="public-mindmap-state">Đang tải mindmap...</div>
      </main>
    );
  }

  if (error || !mindmap) {
    return (
      <main className={`public-mindmap-page${isEmbedPreview ? ' embed-preview' : ''}`}>
        <div className="public-mindmap-state public-mindmap-state--error">
          {error || 'Không tìm thấy mindmap công khai'}
        </div>
      </main>
    );
  }

  return (
    <main className={`public-mindmap-page${isEmbedPreview ? ' embed-preview' : ''}`}>
      {!isEmbedPreview && (
        <header className="public-mindmap-header">
          <p className="public-mindmap-badge">Public Mindmap</p>
          <h1>{mindmap.title}</h1>
          {mindmap.description && <p>{mindmap.description}</p>}
        </header>
      )}

      <section className="public-mindmap-canvas-wrap">
        <div ref={containerRef} className="public-mindmap-canvas" />
      </section>
    </main>
  );
}
