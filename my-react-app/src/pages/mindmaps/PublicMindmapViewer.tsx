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

    const width = Math.max(renderedMap.scrollWidth, renderedMap.clientWidth, 1);
    const height = Math.max(renderedMap.scrollHeight, renderedMap.clientHeight, 1);
    renderedMap.setAttribute('data-mindmap-export-root', '1');

    const canvas = await html2canvas(renderedMap, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      scrollX: 0,
      scrollY: 0,
      onclone: (doc) => {
        const cloneRoot = doc.querySelector('[data-mindmap-export-root="1"]') as HTMLElement | null;
        if (cloneRoot) {
          cloneRoot.style.overflow = 'visible';
        }
      },
    });

    renderedMap.removeAttribute('data-mindmap-export-root');
    return canvas.toDataURL('image/png');
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
