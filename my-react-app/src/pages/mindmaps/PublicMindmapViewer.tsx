import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import MindElixir from 'mind-elixir';
import 'mind-elixir/style.css';
import { MindmapService } from '../../services/api/mindmap.service';
import type { Mindmap, MindmapNode } from '../../types';
import './PublicMindmapViewer.css';

interface MindElixirNodeData {
  id: string;
  topic: string;
  expanded?: boolean;
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

const ICON_SYMBOLS: Record<string, string> = {
  lightbulb: '💡',
  bookmark: '🔖',
  'check-circle': '✅',
  'info-circle': 'ℹ️',
  book: '📚',
  target: '🎯',
  star: '⭐',
  flag: '🚩',
  heart: '❤️',
  link: '🔗',
  sparkles: '✨',
  fire: '🔥',
  rocket: '🚀',
  trophy: '🏆',
  medal: '🏅',
  brain: '🧠',
  bulb: '💡',
  pencil: '✏️',
  chart: '📊',
  dna: '🧬',
};

const getIconSymbol = (icon: string): string => ICON_SYMBOLS[icon] || '📌';

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

    const buildNode = (node: MindmapNode): MindElixirNodeData => ({
      id: node.id,
      topic: `${getIconSymbol(node.icon)} ${node.content}`,
      expanded: true,
      style: {
        color: '#ffffff',
        background: node.color,
      },
      children: (childrenMap.get(node.id) || []).map(buildNode),
    });

    return {
      nodeData: buildNode(rootNode),
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
