import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
type NodePanelMode = 'EDIT_NODE' | 'ADD_NODE';

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

const normalizeNode = (node: Partial<MindmapNode>): MindmapNode => ({
  id: String(node.id ?? ''),
  mindmapId: String(node.mindmapId ?? ''),
  parentId: node.parentId ?? null,
  content: String(node.content ?? ''),
  color: node.color || '#667eea',
  icon: node.icon || 'lightbulb',
  displayOrder: Number.isFinite(node.displayOrder) ? Number(node.displayOrder) : 0,
  children: Array.isArray(node.children) ? node.children : [],
  createdAt: node.createdAt || '',
  updatedAt: node.updatedAt || '',
});

const normalizeNodes = (nodes: MindmapNode[]): MindmapNode[] => {
  const deduped = new Map<string, MindmapNode>();
  flattenNodes(nodes).forEach((node) => {
    const normalized = normalizeNode(node);
    if (normalized.id) {
      deduped.set(normalized.id, { ...normalized, children: [] });
    }
  });
  return Array.from(deduped.values());
};

const removeNodeAndDescendants = (nodes: MindmapNode[], nodeId: string): MindmapNode[] => {
  const toRemove = new Set<string>([nodeId]);
  let changed = true;

  while (changed) {
    changed = false;
    nodes.forEach((node) => {
      if (node.parentId && toRemove.has(node.parentId) && !toRemove.has(node.id)) {
        toRemove.add(node.id);
        changed = true;
      }
    });
  }

  return nodes.filter((node) => !toRemove.has(node.id));
};

export default function MindmapEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [mindmap, setMindmap] = useState<Mindmap | null>(null);
  const [mindmapNodes, setMindmapNodes] = useState<MindmapNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [slowLoading, setSlowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const mindContainerRef = useRef<HTMLDivElement | null>(null);
  const editPanelRef = useRef<HTMLDivElement | null>(null);
  const mindInstanceRef = useRef<MindElixirInstance | null>(null);
  const nodeLookupRef = useRef<Map<string, MindmapNode>>(new Map());

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodePanelMode, setNodePanelMode] = useState<NodePanelMode>('EDIT_NODE');
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
      setMindmapNodes(normalizeNodes(response.result.nodes || []));
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
      const allNodes = normalizeNodes(nodes);
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

      const buildNode = (node: MindmapNode, visited = new Set<string>()): MindElixirNodeData => {
        if (visited.has(node.id)) {
          return {
            id: node.id,
            topic: `${getIconSymbol(node.icon)} ${(node.content || '').trim() || 'Node'}`,
            expanded: true,
            style: {
              color: '#ffffff',
              background: node.color || '#64748b',
            },
            children: [],
          };
        }

        const nextVisited = new Set(visited);
        nextVisited.add(node.id);

        return {
          id: node.id,
          topic: `${getIconSymbol(node.icon)} ${(node.content || '').trim() || 'Node'}`,
          expanded: true,
          style: {
            color: '#ffffff',
            background: node.color || '#64748b',
          },
          children: (childrenMap.get(node.id) || []).map((child) => buildNode(child, nextVisited)),
        };
      };

      const rootCandidates = allNodes.filter(
        (node) => !node.parentId || !nodeMap.has(node.parentId)
      );

      if (!rootCandidates.length) {
        return {
          nodeData: {
            id: 'fallback-root',
            topic: mindmap?.title?.trim() || 'Mindmap mới',
            expanded: true,
            style: {
              color: '#ffffff',
              background: '#475569',
            },
            children: [],
          },
        };
      }

      const primaryRoot = rootCandidates[0];
      const primaryNode = buildNode(primaryRoot);
      const extraRoots = rootCandidates.slice(1).map((node) => buildNode(node));

      return {
        nodeData: {
          ...primaryNode,
          children: [...(primaryNode.children || []), ...extraRoots],
        },
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
    if (!selectedNodeId || interactionMode !== 'EDIT') return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (editPanelRef.current?.contains(target)) return;

      // Keep panel open while interacting with the mindmap canvas so node selection still works.
      if (mindContainerRef.current?.contains(target)) return;

      setSelectedNodeId(null);
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [selectedNodeId, interactionMode]);

  useEffect(() => {
    if (!mindContainerRef.current || !mindmap) return;

    const data = toMindElixirData(mindmapNodes);

    if (!mindInstanceRef.current) {
      const mind = new MindElixir({
        el: mindContainerRef.current,
        direction: MindElixir.SIDE,
        draggable: true,
        contextMenu: true,
        toolBar: true,
        keypress: true,
        locale: 'en',
      });

      mind.init(data);

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

      mindInstanceRef.current = mind as MindElixirInstance;
    } else {
      mindInstanceRef.current.refresh(data);
    }

    setSelectedNodeId((prev) => {
      if (!prev) return null;
      return nodeLookupRef.current.has(prev) ? prev : null;
    });
  }, [mindmap, mindmapNodes, toMindElixirData]);

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

    setNodePanelMode('EDIT_NODE');
  }, [selectedNodeId]);

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

      const prevNodes = mindmapNodes;
      const optimisticNodes = prevNodes.map((node) =>
        node.id === mindmapNode.id
          ? {
              ...node,
              content: nextContent,
              color: editForm.color || node.color,
              icon: editForm.icon || node.icon,
            }
          : node
      );
      setMindmapNodes(optimisticNodes);

      await MindmapService.updateNode(mindmapNode.id, {
        content: nextContent,
        color: editForm.color,
        icon: editForm.icon,
      });

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

    const parentNode = nodeLookupRef.current.get(selectedNodeId);
    const siblingCount = mindmapNodes.filter((node) => node.parentId === selectedNodeId).length;

    try {
      setCreatingNode(true);
      const response = await MindmapService.createNode({
        mindmapId: mindmap.id,
        parentId: selectedNodeId,
        content,
        color: newNodeForm.color,
        icon: newNodeForm.icon,
        displayOrder: siblingCount + 1,
      });

      const createdNode = normalizeNode({
        ...response.result,
        mindmapId: response.result?.mindmapId || mindmap.id,
        parentId: response.result?.parentId ?? selectedNodeId,
        content: response.result?.content || content,
        color: response.result?.color || newNodeForm.color || parentNode?.color || '#2563eb',
        icon: response.result?.icon || newNodeForm.icon || 'book',
        displayOrder: response.result?.displayOrder ?? siblingCount + 1,
      });

      setMindmapNodes((prev) => [...prev, createdNode]);

      setNewNodeForm((prev) => ({ ...prev, content: '' }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create node');
    } finally {
      setCreatingNode(false);
    }
  };

  const handleDeleteNode = async () => {
    if (!selectedNodeId || !mindmap) return;
    if (!confirm('Bạn có chắc chắn muốn xóa node này?')) return;

    try {
      const mindmapNode = nodeLookupRef.current.get(selectedNodeId);
      if (!mindmapNode) return;

      await MindmapService.deleteNode(mindmap.id, mindmapNode.id);

      setMindmapNodes((prev) => removeNodeAndDescendants(prev, mindmapNode.id));
      setSelectedNodeId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete node');
    }
  };

  const handleUpdateStatus = async (status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') => {
    if (!mindmap) return;

    try {
      await MindmapService.updateMindmap(mindmap.id, { status });
      setMindmap({ ...mindmap, status });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  if (loading) {
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
              <h3>{nodePanelMode === 'EDIT_NODE' ? 'Chỉnh sửa Node' : 'Thêm node con'}</h3>

              <div className="panel-mode-toggle" role="tablist" aria-label="Tùy chọn thao tác node">
                <button
                  type="button"
                  role="tab"
                  aria-selected={nodePanelMode === 'EDIT_NODE'}
                  className={`panel-mode-btn ${nodePanelMode === 'EDIT_NODE' ? 'active' : ''}`}
                  onClick={() => setNodePanelMode('EDIT_NODE')}
                >
                  Edit
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={nodePanelMode === 'ADD_NODE'}
                  className={`panel-mode-btn ${nodePanelMode === 'ADD_NODE' ? 'active' : ''}`}
                  onClick={() => setNodePanelMode('ADD_NODE')}
                >
                  Thêm node
                </button>
              </div>

              {nodePanelMode === 'EDIT_NODE' ? (
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
                    <button onClick={handleDeleteNode} className="btn-delete">
                      Xóa
                    </button>
                    <button onClick={handleSaveNode} disabled={saving} className="btn-save">
                      {saving ? 'Đang lưu...' : 'Lưu'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="add-node-block standalone">
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
      </div>
    </DashboardLayout>
  );
}
