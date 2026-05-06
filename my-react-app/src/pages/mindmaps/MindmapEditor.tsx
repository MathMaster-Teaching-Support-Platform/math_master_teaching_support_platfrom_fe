import { useQueryClient } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import { ArrowLeft, Download, Move, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import MindElixir, { THEME as MindElixirLightTheme } from 'mind-elixir';
import 'mind-elixir/style.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useToast } from '../../context/ToastContext';
import { mockTeacher } from '../../data/mockData';
import { MindmapService } from '../../services/api/mindmap.service';
import type { Mindmap, MindmapNode } from '../../types';
import './MindmapEditor.css';

// ── Visual theme (mirrors PublicMindmapViewer) ─────────────────────────────
const MINDMAP_THEME = {
  ...MindElixirLightTheme,
  background: '#F0EEE6',
  color: '#141413',
  cssVar: {
    ...((MindElixirLightTheme as { cssVar?: Record<string, string> }).cssVar ?? {}),
    '--bgcolor': '#F0EEE6',
    '--main-bgcolor': '#ffffff',
    '--main-color': 'transparent',
    '--color': '#444',
    '--root-radius': '16px',
    '--main-radius': '100px',
    '--root-border-color': 'rgba(0,0,0,0)',
    '--selected': 'rgba(79,126,247,0.18)',
    '--node-gap-x': '32px',
    '--node-gap-y': '8px',
    '--main-gap-x': '80px',
    '--main-gap-y': '30px',
    '--topic-padding': '5px 18px',
  },
};

const BRANCH_COLORS = [
  '#7AA5FA',
  '#55C49A',
  '#E8975E',
  '#B38EE8',
  '#64C0D5',
  '#DE9F8A',
  '#7BB887',
  '#D696C4',
] as const;

const LEAF_BG = [
  '#EEF3FF',
  '#E0F7EF',
  '#FDF1E5',
  '#F3EDFB',
  '#E4F6FA',
  '#FCF0EA',
  '#E8F5EC',
  '#FAF0F8',
] as const;

const LEAF_FG = [
  '#1E3A8A',
  '#064E3B',
  '#7C2D12',
  '#3B0764',
  '#0C4A6E',
  '#431407',
  '#14532D',
  '#500724',
] as const;
// ─────────────────────────────────────────────────────────────────────────────

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
  refresh: (data: MindElixirData) => void;
  destroy?: () => void;
  bus: {
    addListener: (event: string, handler: (nodes: Array<{ id: string }>) => void) => void;
  };
}

type InteractionMode = 'DRAG' | 'EDIT';
type NodePanelMode = 'EDIT' | 'ADD';

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

const removeNodeAndDescendants = (nodes: MindmapNode[], nodeId: string): MindmapNode[] => {
  const all = uniqueFlatNodes(nodes);
  const toRemove = new Set<string>([nodeId]);
  let changed = true;

  while (changed) {
    changed = false;
    all.forEach((node) => {
      if (node.parentId && toRemove.has(node.parentId) && !toRemove.has(node.id)) {
        toRemove.add(node.id);
        changed = true;
      }
    });
  }

  return all.filter((node) => !toRemove.has(node.id));
};

const getSubtreeDeleteOrder = (nodes: MindmapNode[], rootId: string): string[] => {
  const all = uniqueFlatNodes(nodes);
  const childrenMap = new Map<string, string[]>();

  all.forEach((node) => {
    if (!node.parentId) return;
    const children = childrenMap.get(node.parentId) || [];
    children.push(node.id);
    childrenMap.set(node.parentId, children);
  });

  const ordered: string[] = [];
  const visit = (nodeId: string) => {
    const children = childrenMap.get(nodeId) || [];
    children.forEach(visit);
    ordered.push(nodeId);
  };

  visit(rootId);
  return ordered;
};

export default function MindmapEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const isEmbedPreview = searchParams.get('embedPreview') === '1';

  const [mindmap, setMindmap] = useState<Mindmap | null>(null);
  const [mindmapNodes, setMindmapNodes] = useState<MindmapNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [slowLoading, setSlowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [exportingImage, setExportingImage] = useState(false);

  const mindContainerRef = useRef<HTMLDivElement | null>(null);
  const editPanelRef = useRef<HTMLDivElement | null>(null);
  const mindInstanceRef = useRef<MindElixirInstance | null>(null);
  const nodeLookupRef = useRef<Map<string, MindmapNode>>(new Map());

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodePanelMode, setNodePanelMode] = useState<NodePanelMode>('EDIT');
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('DRAG');
  const interactionModeRef = useRef<InteractionMode>('DRAG');
  const [editForm, setEditForm] = useState({
    content: '',
    color: '#667eea',
    icon: 'lightbulb',
  });
  const [newNodeForm, setNewNodeForm] = useState({
    content: '',
    color: '#2563eb',
    icon: 'book',
  });
  const [creatingNode, setCreatingNode] = useState(false);
  const [deletingNode, setDeletingNode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    nodeId: string | null;
    nodeLabel: string;
    totalNodes: number;
  }>({
    open: false,
    nodeId: null,
    nodeLabel: '',
    totalNodes: 0,
  });
  useEffect(() => {
    if (!id) {
      setError('Không tìm thấy ID mindmap');
      setLoading(false);
      return;
    }

    loadMindmap(id);
  }, [id]);

  const loadMindmap = async (mindmapId: string) => {
    const timeoutMs = 120000;

    try {
      setLoading(true);
      setSlowLoading(false);
      setError(null);

      const slowTimer = setTimeout(() => setSlowLoading(true), 15000);

      const response = await Promise.race([
        MindmapService.getMindmapById(mindmapId),
        new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error('Timeout khi tải mindmap, vui lòng thử lại.')),
            timeoutMs
          );
        }),
      ]);

      clearTimeout(slowTimer);
      setMindmap(response.result.mindmap);
      setMindmapNodes(uniqueFlatNodes(response.result.nodes));
      setSelectedNodeId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mindmap');
    } finally {
      setLoading(false);
      setSlowLoading(false);
    }
  };

  const toMindElixirData = useCallback(
    (nodes: MindmapNode[]): MindElixirData => {
      const allNodes = uniqueFlatNodes(nodes);
      const nodeMap = new Map<string, MindmapNode>();
      allNodes.forEach((node) => nodeMap.set(node.id, node));
      nodeLookupRef.current = nodeMap;

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
        return MindElixir.new(mindmap?.title || 'Mindmap mới') as MindElixirData;
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
    },
    [mindmap?.title]
  );

  useEffect(() => {
    interactionModeRef.current = interactionMode;
    if (interactionMode === 'DRAG') {
      setSelectedNodeId(null);
    }
  }, [interactionMode]);

  useEffect(() => {
    if (isEmbedPreview) return;
    if (interactionMode !== 'EDIT' || !selectedNodeId || deleteConfirm.open) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (editPanelRef.current?.contains(target)) return;

      // Ignore clicks inside delete confirmation modal so confirm/cancel can run.
      if (target instanceof HTMLElement && target.closest('.delete-modal-backdrop')) return;

      // Do not close when clicking inside the mindmap canvas; this allows selecting another node.
      if (mindContainerRef.current?.contains(target)) return;

      setSelectedNodeId(null);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [interactionMode, selectedNodeId, deleteConfirm.open, isEmbedPreview]);

  useEffect(() => {
    if (!mindContainerRef.current || !mindmap) return;

    const data = toMindElixirData(mindmapNodes);

    if (!mindInstanceRef.current) {
      const mind = new MindElixir({
        el: mindContainerRef.current,
        direction: MindElixir.SIDE,
        draggable: true,
        contextMenu: !isEmbedPreview,
        toolBar: !isEmbedPreview,
        keypress: !isEmbedPreview,
        locale: 'en',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        theme: MINDMAP_THEME as any,
      });

      mind.init(data);

      if (!isEmbedPreview) {
        mind.bus.addListener('selectNodes', (nodes: Array<{ id: string }>) => {
          if (interactionModeRef.current !== 'EDIT') {
            setSelectedNodeId(null);
            return;
          }

          const targetNode = nodes?.[0];
          if (!targetNode?.id) {
            setSelectedNodeId(null);
            return;
          }
          setSelectedNodeId(targetNode.id);
        });
      }

      mindInstanceRef.current = mind as MindElixirInstance;
    } else {
      mindInstanceRef.current.refresh(data);
    }

    setSelectedNodeId((prev) => {
      if (!prev) return null;
      return nodeLookupRef.current.has(prev) ? prev : null;
    });
  }, [mindmap, mindmapNodes, toMindElixirData, isEmbedPreview]);

  useEffect(() => {
    return () => {
      if (mindInstanceRef.current?.destroy) {
        mindInstanceRef.current.destroy();
      }
      mindInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!selectedNodeId) return;

    const mindmapNode = nodeLookupRef.current.get(selectedNodeId);
    if (!mindmapNode) {
      setSelectedNodeId(null);
      return;
    }

    setEditForm({
      content: mindmapNode.content,
      color: mindmapNode.color,
      icon: mindmapNode.icon,
    });

    setNewNodeForm((prev) => ({
      ...prev,
      color: mindmapNode.color || prev.color,
    }));

    setNodePanelMode('EDIT');
  }, [selectedNodeId]);

  useEffect(() => {
    if (!selectedNodeId && deleteConfirm.open) {
      setDeleteConfirm({ open: false, nodeId: null, nodeLabel: '', totalNodes: 0 });
    }
  }, [selectedNodeId, deleteConfirm.open]);

  const handleSaveNode = async () => {
    if (!selectedNodeId || !mindmap) return;

    try {
      setSaving(true);
      const mindmapNode = nodeLookupRef.current.get(selectedNodeId);
      if (!mindmapNode) return;

      const nextContent = editForm.content.trim();
      if (!nextContent) {
        showToast({ type: 'warning', message: 'Nội dung node không được để trống' });
        return;
      }

      const previousNodes = uniqueFlatNodes(mindmapNodes);
      const optimisticNodes = previousNodes.map((node) =>
        node.id === mindmapNode.id
          ? {
              ...node,
              content: nextContent,
              color: editForm.color,
              icon: editForm.icon,
            }
          : node
      );

      setMindmapNodes(optimisticNodes);

      await MindmapService.updateNode(mindmap.id, mindmapNode.id, {
        content: nextContent,
        color: editForm.color,
        icon: editForm.icon,
      });
      await queryClient.invalidateQueries({ queryKey: ['mindmaps'] });
      setSelectedNodeId(null);
    } catch (err) {
      if (id) await loadMindmap(id);
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Không thể cập nhật node',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateChildNode = async () => {
    if (!selectedNodeId || !mindmap) return;

    const content = newNodeForm.content.trim();
    if (!content) {
      showToast({ type: 'warning', message: 'Vui lòng nhập nội dung node mới' });
      return;
    }

    const siblingCount = uniqueFlatNodes(mindmapNodes).filter(
      (node) => node.parentId === selectedNodeId
    ).length;

    try {
      setCreatingNode(true);

      const tempId = `temp-${Date.now()}`;
      const tempNode: MindmapNode = {
        id: tempId,
        mindmapId: mindmap.id,
        parentId: selectedNodeId,
        content,
        color: newNodeForm.color,
        icon: newNodeForm.icon,
        displayOrder: siblingCount + 1,
        children: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setMindmapNodes((prev) => [...uniqueFlatNodes(prev), tempNode]);

      const response = await MindmapService.createNode({
        mindmapId: mindmap.id,
        parentId: selectedNodeId,
        content,
        color: newNodeForm.color,
        icon: newNodeForm.icon,
        displayOrder: siblingCount + 1,
      });

      setMindmapNodes((prev) =>
        uniqueFlatNodes(prev).map((node) =>
          node.id === tempId ? { ...response.result, children: [] } : node
        )
      );
      await queryClient.invalidateQueries({ queryKey: ['mindmaps'] });
      setNewNodeForm((prev) => ({ ...prev, content: '' }));
      setNodePanelMode('EDIT');
    } catch (err) {
      setMindmapNodes((prev) =>
        uniqueFlatNodes(prev).filter((node) => !node.id.startsWith('temp-'))
      );
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Không thể tạo node mới',
      });
    } finally {
      setCreatingNode(false);
    }
  };

  const handleRequestDeleteNode = () => {
    if (!selectedNodeId) return;

    const mindmapNode = nodeLookupRef.current.get(selectedNodeId);
    if (!mindmapNode) return;

    const deleteOrder = getSubtreeDeleteOrder(mindmapNodes, mindmapNode.id);
    setDeleteConfirm({
      open: true,
      nodeId: mindmapNode.id,
      nodeLabel: mindmapNode.content || 'Node không tên',
      totalNodes: deleteOrder.length,
    });
  };

  const closeDeleteConfirm = () => {
    if (deletingNode) return;
    setDeleteConfirm({ open: false, nodeId: null, nodeLabel: '', totalNodes: 0 });
  };

  const handleDeleteNode = async () => {
    if (!mindmap || !deleteConfirm.nodeId) return;

    const targetNodeId = deleteConfirm.nodeId;
    const previousNodes = uniqueFlatNodes(mindmapNodes);
    const targetNode = previousNodes.find((node) => node.id === targetNodeId);

    if (!targetNode) {
      setDeleteConfirm({ open: false, nodeId: null, nodeLabel: '', totalNodes: 0 });
      showToast({ type: 'warning', message: 'Không tìm thấy node để xóa, vui lòng thử lại.' });
      return;
    }

    try {
      // Close modal and update UI immediately so users see instant feedback.
      setDeleteConfirm({ open: false, nodeId: null, nodeLabel: '', totalNodes: 0 });
      setDeletingNode(true);
      setMindmapNodes(removeNodeAndDescendants(previousNodes, targetNodeId));
      setSelectedNodeId(null);

      const deleteOrder = getSubtreeDeleteOrder(previousNodes, targetNodeId);
      for (const nodeId of deleteOrder) {
        await MindmapService.deleteNode(nodeId);
      }
      await queryClient.invalidateQueries({ queryKey: ['mindmaps'] });
    } catch (err) {
      if (id) await loadMindmap(id);
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Không thể xóa node',
      });
    } finally {
      setDeletingNode(false);
    }
  };

  const handleUpdateStatus = async (status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') => {
    if (!mindmap) return;

    try {
      if (status === 'PUBLISHED') {
        await MindmapService.publishMindmap(mindmap.id);
      } else if (status === 'DRAFT') {
        await MindmapService.unpublishMindmap(mindmap.id);
      } else {
        await MindmapService.updateMindmap(mindmap.id, {
          title: mindmap.title,
          description: mindmap.description,
          status,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['mindmaps'] });
      setMindmap({ ...mindmap, status });
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update status',
      });
    }
  };

  const handleExportImage = useCallback(async () => {
    if (!mindmap) return;
    if (!mindContainerRef.current) return;

    try {
      setExportingImage(true);
      const container = mindContainerRef.current;
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

      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      wrapper.style.transformOrigin = 'top left';

      const originalChildren = Array.from(renderedMap.childNodes);
      const previousPosition = renderedMap.style.position;
      const previousWidth = renderedMap.style.width;
      const previousHeight = renderedMap.style.height;
      const previousOverflow = renderedMap.style.overflow;
      const previousMinHeight = renderedMap.style.minHeight;

      let canvas: HTMLCanvasElement;
      try {
        originalChildren.forEach((node) => wrapper.appendChild(node));
        renderedMap.appendChild(wrapper);

        renderedMap.style.position = 'relative';
        renderedMap.style.width = `${captureWidth}px`;
        renderedMap.style.height = `${captureHeight}px`;
        renderedMap.style.overflow = 'hidden';
        renderedMap.style.minHeight = '0';

        canvas = await html2canvas(renderedMap, {
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

      const reservedCharacters = new Set(['<', '>', ':', '"', '/', '\\', '|', '?', '*']);
      const safeTitle = Array.from((mindmap.title || 'mindmap').trim())
        .filter((char) => char.charCodeAt(0) >= 32 && !reservedCharacters.has(char))
        .join('')
        .replace(/\s+/g, '-')
        .toLowerCase();
      const fallbackName = `${safeTitle || 'mindmap'}-${new Date().toISOString().slice(0, 10)}.png`;

      const downloadLink = document.createElement('a');
      downloadLink.href = canvas.toDataURL('image/png');
      downloadLink.download = fallbackName;
      downloadLink.click();
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Không thể xuất ảnh mindmap',
      });
    } finally {
      setExportingImage(false);
    }
  }, [mindmap]);

  if (loading) {
    if (isEmbedPreview) {
      return (
        <div className="mindmap-editor-loading mindmap-editor-loading-embedded">
          <div className="loader"></div>
          <p>Đang tải mindmap...</p>
        </div>
      );
    }

    return (
      <DashboardLayout
        role="teacher"
        user={{ name: mockTeacher.name, avatar: mockTeacher.avatar!, role: 'teacher' }}
        notificationCount={5}
      >
        <div className="mindmap-editor-loading">
          <div className="loader"></div>
          <p>Đang tải mindmap...</p>
          {slowLoading && (
            <p className="loading-slow-hint">Server đang xử lý dữ liệu lớn, vui lòng đợi thêm...</p>
          )}
        </div>
      </DashboardLayout>
    );
  }

  if (error || !mindmap) {
    if (isEmbedPreview) {
      return (
        <div className="mindmap-editor-error mindmap-editor-error-embedded">
          <h2>Lỗi</h2>
          <p>{error || 'Không tìm thấy mindmap'}</p>
        </div>
      );
    }

    return (
      <DashboardLayout
        role="teacher"
        user={{ name: mockTeacher.name, avatar: mockTeacher.avatar!, role: 'teacher' }}
        notificationCount={5}
      >
        <div className="mindmap-editor-error">
          <h2>Lỗi</h2>
          <p>{error || 'Không tìm thấy mindmap'}</p>
          <div className="error-actions">
            {id && (
              <button onClick={() => loadMindmap(id)} className="btn-retry">
                Thử lại
              </button>
            )}
            <button onClick={() => navigate('/teacher/mindmaps')}>Quay lại</button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isEmbedPreview) {
    return (
      <div className="mindmap-editor-page mindmap-editor-embedded">
        <div className="editor-content">
          <div className="flow-container">
            <div ref={mindContainerRef} className="mind-elixir-host" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: mockTeacher.name, avatar: mockTeacher.avatar!, role: 'teacher' }}
      notificationCount={5}
    >
      <div className="mindmap-editor-page">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="bg-[#FAF9F5] border-b border-[#E8E6DC] px-5 py-3 flex items-center justify-between gap-4 flex-wrap flex-shrink-0">
          {/* Left: back + title */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] active:scale-[0.98] transition-all duration-150 flex-shrink-0"
              onClick={() => navigate('/teacher/mindmaps')}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Quay lại
            </button>
            <div className="min-w-0">
              <h1 className="font-[Playfair_Display] text-[17px] font-medium text-[#141413] leading-tight truncate">
                {mindmap.title}
              </h1>
              {mindmap.description && (
                <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-0.5 truncate">
                  {mindmap.description}
                </p>
              )}
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Mode toggle */}
            <div
              className="flex items-center gap-0.5 p-0.5 bg-[#F5F4ED] rounded-xl border border-[#E8E6DC]"
              role="group"
              aria-label="Chế độ thao tác"
            >
              <button
                type="button"
                onClick={() => setInteractionMode('DRAG')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-[Be_Vietnam_Pro] text-[12px] font-semibold transition-all duration-150 ${
                  interactionMode === 'DRAG'
                    ? 'bg-white text-[#141413] shadow-[rgba(0,0,0,0.06)_0px_2px_8px]'
                    : 'text-[#87867F] hover:text-[#5E5D59]'
                }`}
              >
                <Move className="w-3.5 h-3.5" />
                Kéo thả
              </button>
              <button
                type="button"
                onClick={() => setInteractionMode('EDIT')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-[Be_Vietnam_Pro] text-[12px] font-semibold transition-all duration-150 ${
                  interactionMode === 'EDIT'
                    ? 'bg-white text-[#141413] shadow-[rgba(0,0,0,0.06)_0px_2px_8px]'
                    : 'text-[#87867F] hover:text-[#5E5D59]'
                }`}
              >
                <Pencil className="w-3.5 h-3.5" />
                Chỉnh sửa
              </button>
            </div>

            {/* Export button */}
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
              onClick={handleExportImage}
              disabled={exportingImage}
            >
              <Download className="w-3.5 h-3.5" />
              {exportingImage ? 'Đang xuất...' : 'Xuất ảnh'}
            </button>

            {/* Status select */}
            <select
              value={mindmap.status === 'ARCHIVED' ? 'DRAFT' : mindmap.status}
              onChange={(e) => handleUpdateStatus(e.target.value as 'DRAFT' | 'PUBLISHED')}
              className="border border-[#E8E6DC] rounded-xl px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413] bg-white outline-none focus:border-[#3898EC] focus:ring-2 focus:ring-[#3898EC]/20 cursor-pointer transition-all duration-150"
            >
              <option value="DRAFT">Bản nháp</option>
              <option value="PUBLISHED">Công khai</option>
            </select>
          </div>
        </div>

        {/* ── Canvas area ────────────────────────────────────────── */}
        <div className="editor-content">
          <div className="flow-container">
            {/* Mode hint chip */}
            <div className="absolute top-3 left-3 z-[3] bg-[#141413]/70 text-[#FAF9F5] px-3 py-1.5 rounded-lg font-[Be_Vietnam_Pro] text-[11px] pointer-events-none max-w-[90%]">
              {interactionMode === 'DRAG'
                ? 'Chế độ kéo thả — kéo node để thay đổi cấu trúc mindmap.'
                : 'Chế độ chỉnh sửa — bấm node để mở bảng chỉnh sửa.'}
            </div>
            <div ref={mindContainerRef} className="mind-elixir-host" />
          </div>

          {/* ── Edit panel ───────────────────────────────────────── */}
          {interactionMode === 'EDIT' && selectedNodeId && (
            <div
              ref={editPanelRef}
              className="absolute top-4 right-4 w-[296px] bg-[#FAF9F5] rounded-2xl border border-[#E8E6DC] shadow-[rgba(0,0,0,0.12)_0px_8px_32px,0px_0px_0px_1px_#D1CFC5] z-10 max-h-[calc(100vh-200px)] overflow-y-auto"
              style={{ animation: 'panelSlideIn 0.25s cubic-bezier(0.22,1,0.36,1) both' }}
            >
              {/* Panel header with tabs */}
              <div className="px-4 pt-4 pb-3 border-b border-[#F0EEE6] flex items-center justify-between gap-2">
                <h3 className="font-[Playfair_Display] text-[15px] font-medium text-[#141413] leading-tight">
                  {nodePanelMode === 'EDIT' ? 'Chỉnh sửa node' : 'Thêm node con'}
                </h3>
                <div
                  className="flex items-center gap-0.5 p-0.5 bg-[#F0EEE6] rounded-lg"
                  role="tablist"
                  aria-label="Node actions"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={nodePanelMode === 'EDIT'}
                    onClick={() => setNodePanelMode('EDIT')}
                    className={`px-2.5 py-1 rounded-md font-[Be_Vietnam_Pro] text-[11px] font-semibold transition-all duration-150 ${
                      nodePanelMode === 'EDIT'
                        ? 'bg-white text-[#141413] shadow-sm'
                        : 'text-[#87867F] hover:text-[#5E5D59]'
                    }`}
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={nodePanelMode === 'ADD'}
                    onClick={() => setNodePanelMode('ADD')}
                    className={`px-2.5 py-1 rounded-md font-[Be_Vietnam_Pro] text-[11px] font-semibold transition-all duration-150 ${
                      nodePanelMode === 'ADD'
                        ? 'bg-white text-[#141413] shadow-sm'
                        : 'text-[#87867F] hover:text-[#5E5D59]'
                    }`}
                  >
                    Thêm
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {nodePanelMode === 'EDIT' ? (
                  <>
                    {/* Content */}
                    <div>
                      <label
                        htmlFor="edit-content"
                        className="block font-[Be_Vietnam_Pro] text-[11px] font-medium text-[#87867F] uppercase tracking-[0.4px] mb-1.5"
                      >
                        Nội dung
                      </label>
                      <input
                        id="edit-content"
                        type="text"
                        className="w-full border border-[#E8E6DC] rounded-xl px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] bg-white outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442]/20 transition-colors"
                        value={editForm.content}
                        onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      />
                    </div>
                    {/* Color + Icon row */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label
                          htmlFor="edit-color"
                          className="block font-[Be_Vietnam_Pro] text-[11px] font-medium text-[#87867F] uppercase tracking-[0.4px] mb-1.5"
                        >
                          Màu sắc
                        </label>
                        <input
                          id="edit-color"
                          type="color"
                          className="w-full h-[38px] border border-[#E8E6DC] rounded-xl cursor-pointer bg-white p-0.5 transition-colors"
                          value={editForm.color}
                          onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="edit-icon"
                          className="block font-[Be_Vietnam_Pro] text-[11px] font-medium text-[#87867F] uppercase tracking-[0.4px] mb-1.5"
                        >
                          Icon
                        </label>
                        <select
                          id="edit-icon"
                          className="w-full border border-[#E8E6DC] rounded-xl px-2 py-2 font-[Be_Vietnam_Pro] text-[12px] text-[#141413] bg-white outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442]/20 transition-colors"
                          value={editForm.icon}
                          onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                        >
                          <option value="lightbulb">💡 Ý tưởng</option>
                          <option value="brain">🧠 Não bộ</option>
                          <option value="bookmark">🔖 Đánh dấu</option>
                          <option value="check-circle">✅ Hoàn thành</option>
                          <option value="info-circle">ℹ️ Thông tin</option>
                          <option value="book">📚 Sách</option>
                          <option value="target">🎯 Mục tiêu</option>
                          <option value="star">⭐ Nổi bật</option>
                          <option value="sparkles">✨ Sáng tạo</option>
                          <option value="fire">🔥 Quan trọng</option>
                          <option value="rocket">🚀 Tiến lên</option>
                          <option value="trophy">🏆 Thành tích</option>
                          <option value="medal">🏅 Giải thưởng</option>
                          <option value="pencil">✏️ Ghi chú</option>
                          <option value="chart">📊 Biểu đồ</option>
                          <option value="flag">🚩 Đánh dấu</option>
                          <option value="heart">❤️ Yêu thích</option>
                          <option value="link">🔗 Liên kết</option>
                        </select>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        className="flex-1 px-3 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] active:scale-[0.98] transition-all duration-150"
                        onClick={() => setSelectedNodeId(null)}
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        className="flex items-center justify-center px-3 py-2 rounded-xl border border-red-200 bg-red-50 font-[Be_Vietnam_Pro] text-[12px] font-medium text-red-600 hover:bg-red-100 active:scale-[0.98] transition-all duration-150"
                        onClick={handleRequestDeleteNode}
                        aria-label="Xóa node"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#C96442] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[12px] font-semibold hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150"
                        onClick={handleSaveNode}
                        disabled={saving}
                      >
                        {saving ? (
                          'Đang lưu...'
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            Lưu
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Add node form */}
                    <div>
                      <label
                        htmlFor="new-content"
                        className="block font-[Be_Vietnam_Pro] text-[11px] font-medium text-[#87867F] uppercase tracking-[0.4px] mb-1.5"
                      >
                        Nội dung node mới
                      </label>
                      <input
                        id="new-content"
                        type="text"
                        className="w-full border border-[#E8E6DC] rounded-xl px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] bg-white outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442]/20 transition-colors placeholder:text-[#B0AEA5]"
                        value={newNodeForm.content}
                        onChange={(e) =>
                          setNewNodeForm({ ...newNodeForm, content: e.target.value })
                        }
                        placeholder="Nhập nội dung node con..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label
                          htmlFor="new-color"
                          className="block font-[Be_Vietnam_Pro] text-[11px] font-medium text-[#87867F] uppercase tracking-[0.4px] mb-1.5"
                        >
                          Màu
                        </label>
                        <input
                          id="new-color"
                          type="color"
                          className="w-full h-[38px] border border-[#E8E6DC] rounded-xl cursor-pointer bg-white p-0.5 transition-colors"
                          value={newNodeForm.color}
                          onChange={(e) =>
                            setNewNodeForm({ ...newNodeForm, color: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="new-icon"
                          className="block font-[Be_Vietnam_Pro] text-[11px] font-medium text-[#87867F] uppercase tracking-[0.4px] mb-1.5"
                        >
                          Icon
                        </label>
                        <select
                          id="new-icon"
                          className="w-full border border-[#E8E6DC] rounded-xl px-2 py-2 font-[Be_Vietnam_Pro] text-[12px] text-[#141413] bg-white outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442]/20 transition-colors"
                          value={newNodeForm.icon}
                          onChange={(e) => setNewNodeForm({ ...newNodeForm, icon: e.target.value })}
                        >
                          <option value="lightbulb">💡 Ý tưởng</option>
                          <option value="brain">🧠 Não bộ</option>
                          <option value="bookmark">🔖 Đánh dấu</option>
                          <option value="check-circle">✅ Hoàn thành</option>
                          <option value="info-circle">ℹ️ Thông tin</option>
                          <option value="book">📚 Sách</option>
                          <option value="target">🎯 Mục tiêu</option>
                          <option value="star">⭐ Nổi bật</option>
                          <option value="sparkles">✨ Sáng tạo</option>
                          <option value="fire">🔥 Quan trọng</option>
                          <option value="rocket">🚀 Tiến lên</option>
                          <option value="trophy">🏆 Thành tích</option>
                          <option value="medal">🏅 Giải thưởng</option>
                          <option value="pencil">✏️ Ghi chú</option>
                          <option value="chart">📊 Biểu đồ</option>
                          <option value="flag">🚩 Đánh dấu</option>
                          <option value="heart">❤️ Yêu thích</option>
                          <option value="link">🔗 Liên kết</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        className="flex-1 px-3 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] active:scale-[0.98] transition-all duration-150"
                        onClick={() => setSelectedNodeId(null)}
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[12px] font-semibold hover:bg-[#30302E] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150"
                        onClick={handleCreateChildNode}
                        disabled={creatingNode}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {creatingNode ? 'Đang thêm...' : 'Thêm node con'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Delete confirm modal ───────────────────────────────── */}
        {deleteConfirm.open && (
          <div
            className="delete-modal-backdrop absolute inset-0 bg-[#141413]/50 backdrop-blur-[2px] grid place-items-center z-30 p-4"
            onClick={closeDeleteConfirm}
          >
            <div
              className="w-full max-w-[400px] bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] shadow-[rgba(0,0,0,0.20)_0px_20px_60px,0px_0px_0px_1px_#D1CFC5] p-6 flex flex-col gap-4"
              role="dialog"
              aria-modal="true"
              aria-label="Xác nhận xóa node"
              onClick={(event) => event.stopPropagation()}
              style={{ animation: 'deleteModalIn 0.18s ease both' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-500 flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h4 className="font-[Playfair_Display] text-[17px] font-medium text-[#141413] leading-tight">
                  Xác nhận xóa node
                </h4>
              </div>
              <div className="space-y-2">
                <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59] leading-[1.6]">
                  Bạn sắp xóa node{' '}
                  <strong className="text-[#141413]">{deleteConfirm.nodeLabel}</strong>.
                </p>
                <div className="px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 font-[Be_Vietnam_Pro] text-[12px] text-red-700 leading-[1.5]">
                  Tổng số node sẽ bị xóa: <strong>{deleteConfirm.totalNodes}</strong>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] disabled:opacity-50 active:scale-[0.98] transition-all duration-150"
                  onClick={closeDeleteConfirm}
                  disabled={deletingNode}
                >
                  Hủy
                </button>
                <button
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150"
                  onClick={handleDeleteNode}
                  disabled={deletingNode}
                >
                  {deletingNode ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
