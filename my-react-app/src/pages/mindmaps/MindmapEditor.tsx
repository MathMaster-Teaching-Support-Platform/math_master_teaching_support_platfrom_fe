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
  const mindInstanceRef = useRef<MindElixirInstance | null>(null);
  const nodeLookupRef = useRef<Map<string, MindmapNode>>(new Map());

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('DRAG');
  const interactionModeRef = useRef<InteractionMode>('DRAG');
  const [editForm, setEditForm] = useState({
    content: '',
    color: '#667eea',
    icon: 'lightbulb',
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
      setMindmapNodes(response.result.nodes);
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
      const allNodes = flattenNodes(nodes);
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
  }, [selectedNodeId]);

  const handleSaveNode = async () => {
    if (!selectedNodeId || !mindmap) return;

    try {
      setSaving(true);
      const mindmapNode = nodeLookupRef.current.get(selectedNodeId);
      if (!mindmapNode) return;

      await MindmapService.updateNode(mindmap.id, mindmapNode.id, {
        content: editForm.content,
        color: editForm.color,
        icon: editForm.icon,
      });

      if (id) await loadMindmap(id);
      setSelectedNodeId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update node');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNode = async () => {
    if (!selectedNodeId || !mindmap) return;
    if (!confirm('Bạn có chắc chắn muốn xóa node này?')) return;

    try {
      const mindmapNode = nodeLookupRef.current.get(selectedNodeId);
      if (!mindmapNode) return;

      await MindmapService.deleteNode(mindmap.id, mindmapNode.id);

      if (id) await loadMindmap(id);
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
            <div className="edit-panel">
              <h3>Chỉnh sửa Node</h3>
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
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
