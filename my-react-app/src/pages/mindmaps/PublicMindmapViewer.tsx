import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
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
