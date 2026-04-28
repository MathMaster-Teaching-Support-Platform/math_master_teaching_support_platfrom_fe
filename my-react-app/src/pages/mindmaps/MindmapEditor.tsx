import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import MindElixir from 'mind-elixir';
import 'mind-elixir/style.css';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockTeacher } from '../../data/mockData';
import { MindmapService } from '../../services/api/mindmap.service';
import type { Mindmap, MindmapNode } from '../../types';
import './MindmapEditor.css';

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
  refresh: (data: MindElixirData) => void;
  destroy?: () => void;
  bus: {
    addListener: (event: string, handler: (nodes: Array<{ id: string }>) => void) => void;
  };
}

type InteractionMode = 'DRAG' | 'EDIT';
type NodePanelMode = 'EDIT' | 'ADD';

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
        alert('Nội dung node không được để trống');
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
      alert(err instanceof Error ? err.message : 'Failed to update node');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateChildNode = async () => {
    if (!selectedNodeId || !mindmap) return;

    const content = newNodeForm.content.trim();
    if (!content) {
      alert('Vui lòng nhập nội dung node mới');
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
      alert(err instanceof Error ? err.message : 'Failed to create node');
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
      alert('Không tìm thấy node để xóa, vui lòng thử lại.');
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
      alert(err instanceof Error ? err.message : 'Failed to delete node');
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
      alert(err instanceof Error ? err.message : 'Failed to update status');
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
      alert(err instanceof Error ? err.message : 'Không thể xuất ảnh mindmap');
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
        <div className="editor-header">
          <div className="header-left">
            <button className="btn-back" onClick={() => navigate('/teacher/mindmaps')}>
              ← Quay lại
            </button>
            <div>
              <h1>{mindmap.title}</h1>
              <p>{mindmap.description}</p>
            </div>
          </div>
          <div className="header-actions">
            <div className="interaction-toggle" role="group" aria-label="Chế độ thao tác">
              <button
                type="button"
                className={`interaction-btn ${interactionMode === 'DRAG' ? 'active' : ''}`}
                onClick={() => setInteractionMode('DRAG')}
              >
                Kéo thả
              </button>
              <button
                type="button"
                className={`interaction-btn ${interactionMode === 'EDIT' ? 'active' : ''}`}
                onClick={() => setInteractionMode('EDIT')}
              >
                Chỉnh sửa
              </button>
            </div>
            <button
              type="button"
              className="btn-export-image"
              onClick={handleExportImage}
              disabled={exportingImage}
            >
              {exportingImage ? 'Đang xuất ảnh...' : 'Xuất ảnh PNG'}
            </button>
            <select
              value={mindmap.status}
              onChange={(e) =>
                handleUpdateStatus(e.target.value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')
              }
              className="status-select"
            >
              <option value="DRAFT">Nháp</option>
              <option value="PUBLISHED">Xuất bản</option>
              <option value="ARCHIVED">Lưu trữ</option>
            </select>
          </div>
        </div>

        <div className="editor-content">
          <div className="flow-container">
            <div className="interaction-hint">
              {interactionMode === 'DRAG'
                ? 'Chế độ kéo thả: kéo node để thay đổi cấu trúc mindmap.'
                : 'Chế độ chỉnh sửa: bấm node để mở panel chỉnh sửa.'}
            </div>
            <div ref={mindContainerRef} className="mind-elixir-host" />
          </div>

          {interactionMode === 'EDIT' && selectedNodeId && (
            <div className="edit-panel" ref={editPanelRef}>
              <h3>{nodePanelMode === 'EDIT' ? 'Chỉnh sửa Node' : 'Thêm node con'}</h3>
              <div className="panel-tabs" role="tablist" aria-label="Node actions">
                <button
                  type="button"
                  role="tab"
                  aria-selected={nodePanelMode === 'EDIT'}
                  className={`panel-tab ${nodePanelMode === 'EDIT' ? 'active' : ''}`}
                  onClick={() => setNodePanelMode('EDIT')}
                >
                  Chỉnh sửa
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={nodePanelMode === 'ADD'}
                  className={`panel-tab ${nodePanelMode === 'ADD' ? 'active' : ''}`}
                  onClick={() => setNodePanelMode('ADD')}
                >
                  Thêm node
                </button>
              </div>

              {nodePanelMode === 'EDIT' ? (
                <>
                  <div className="form-group">
                    <label>Nội dung</label>
                    <input
                      type="text"
                      value={editForm.content}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Màu sắc</label>
                    <input
                      type="color"
                      value={editForm.color}
                      onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Icon</label>
                    <select
                      value={editForm.icon}
                      onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                    >
                      <option value="lightbulb">💡 Lightbulb</option>
                      <option value="brain">🧠 Brain</option>
                      <option value="bookmark">🔖 Bookmark</option>
                      <option value="check-circle">✅ Check</option>
                      <option value="info-circle">ℹ️ Info</option>
                      <option value="book">📚 Book</option>
                      <option value="target">🎯 Target</option>
                      <option value="star">⭐ Star</option>
                      <option value="sparkles">✨ Sparkles</option>
                      <option value="fire">🔥 Fire</option>
                      <option value="rocket">🚀 Rocket</option>
                      <option value="trophy">🏆 Trophy</option>
                      <option value="medal">🏅 Medal</option>
                      <option value="pencil">✏️ Pencil</option>
                      <option value="chart">📊 Chart</option>
                      <option value="flag">🚩 Flag</option>
                      <option value="heart">❤️ Heart</option>
                      <option value="link">🔗 Link</option>
                    </select>
                  </div>
                  <div className="panel-actions">
                    <button onClick={() => setSelectedNodeId(null)} className="btn-cancel">
                      Hủy
                    </button>
                    <button onClick={handleRequestDeleteNode} className="btn-delete">
                      Xóa
                    </button>
                    <button onClick={handleSaveNode} disabled={saving} className="btn-save">
                      {saving ? 'Đang lưu...' : 'Lưu'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="add-node-block tab-mode">
                  <div className="form-group">
                    <label>Nội dung node mới</label>
                    <input
                      type="text"
                      value={newNodeForm.content}
                      onChange={(e) => setNewNodeForm({ ...newNodeForm, content: e.target.value })}
                      placeholder="Nhập nội dung node con..."
                    />
                  </div>
                  <div className="form-group row-inline">
                    <div>
                      <label>Màu</label>
                      <input
                        type="color"
                        value={newNodeForm.color}
                        onChange={(e) => setNewNodeForm({ ...newNodeForm, color: e.target.value })}
                      />
                    </div>
                    <div>
                      <label>Icon</label>
                      <select
                        value={newNodeForm.icon}
                        onChange={(e) => setNewNodeForm({ ...newNodeForm, icon: e.target.value })}
                      >
                        <option value="lightbulb">💡 Lightbulb</option>
                        <option value="brain">🧠 Brain</option>
                        <option value="bookmark">🔖 Bookmark</option>
                        <option value="check-circle">✅ Check</option>
                        <option value="info-circle">ℹ️ Info</option>
                        <option value="book">📚 Book</option>
                        <option value="target">🎯 Target</option>
                        <option value="star">⭐ Star</option>
                        <option value="sparkles">✨ Sparkles</option>
                        <option value="fire">🔥 Fire</option>
                        <option value="rocket">🚀 Rocket</option>
                        <option value="trophy">🏆 Trophy</option>
                        <option value="medal">🏅 Medal</option>
                        <option value="pencil">✏️ Pencil</option>
                        <option value="chart">📊 Chart</option>
                        <option value="flag">🚩 Flag</option>
                        <option value="heart">❤️ Heart</option>
                        <option value="link">🔗 Link</option>
                      </select>
                    </div>
                  </div>
                  <div className="panel-actions">
                    <button onClick={() => setSelectedNodeId(null)} className="btn-cancel">
                      Hủy
                    </button>
                    <button
                      type="button"
                      className="btn-add-child"
                      onClick={handleCreateChildNode}
                      disabled={creatingNode}
                    >
                      {creatingNode ? 'Đang thêm node...' : 'Thêm node con'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {deleteConfirm.open && (
          <div className="delete-modal-backdrop" onClick={closeDeleteConfirm}>
            <div
              className="delete-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Xác nhận xóa node"
              onClick={(event) => event.stopPropagation()}
            >
              <h4>Xác nhận xóa node</h4>
              <p>
                Bạn sắp xóa node <strong>{deleteConfirm.nodeLabel}</strong>.
              </p>
              <p className="delete-modal-impact">
                Tổng số node sẽ bị xóa: <strong>{deleteConfirm.totalNodes}</strong>
              </p>
              <div className="delete-modal-actions">
                <button className="btn-cancel" onClick={closeDeleteConfirm} disabled={deletingNode}>
                  Hủy
                </button>
                <button className="btn-delete" onClick={handleDeleteNode} disabled={deletingNode}>
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
