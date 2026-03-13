import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  type Node,
  type Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  MarkerType,
  Position,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockTeacher } from '../../data/mockData';
import { MindmapService } from '../../services/api/mindmap.service';
import type { Mindmap, MindmapNode } from '../../types';
import './MindmapEditor.css';

export default function MindmapEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [mindmap, setMindmap] = useState<Mindmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [editForm, setEditForm] = useState({
    content: '',
    color: '#667eea',
    icon: 'lightbulb',
  });

  useEffect(() => {
    if (id) loadMindmap(id);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMindmap = async (mindmapId: string) => {
    try {
      setLoading(true);
      const response = await MindmapService.getMindmapById(mindmapId);
      setMindmap(response.result.mindmap);
      convertToReactFlow(response.result.nodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mindmap');
    } finally {
      setLoading(false);
    }
  };

  const convertToReactFlow = (mindmapNodes: MindmapNode[]) => {
    const reactFlowNodes: Node[] = [];
    const reactFlowEdges: Edge[] = [];

    // Flatten all nodes (including nested children)
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

    const allNodes = flattenNodes(mindmapNodes);

    // Create a map for quick lookup
    const nodeMap = new Map<string, MindmapNode>();
    allNodes.forEach((node) => nodeMap.set(node.id, node));

    // Find root node (no parent)
    const rootNode = allNodes.find((n) => !n.parentId);
    if (!rootNode) return;

    // Build tree structure to get children for each node
    const childrenMap = new Map<string, MindmapNode[]>();
    allNodes.forEach((node) => {
      if (node.parentId) {
        if (!childrenMap.has(node.parentId)) {
          childrenMap.set(node.parentId, []);
        }
        childrenMap.get(node.parentId)!.push(node);
      }
    });

    // Sort children by displayOrder
    childrenMap.forEach((children) => {
      children.sort((a, b) => a.displayOrder - b.displayOrder);
    });

    // Calculate node positions with symmetric layout
    const nodePositions = new Map<
      string,
      { x: number; y: number; side: 'left' | 'right' | 'center' }
    >();
    const verticalSpacing = 150;
    const horizontalSpacing = 350;

    // Place root node at center
    nodePositions.set(rootNode.id, { x: 0, y: 0, side: 'center' });

    // Get first level children and split them left/right
    const rootChildren = childrenMap.get(rootNode.id) || [];
    const leftChildren = rootChildren.filter((_, i) => i % 2 === 0);
    const rightChildren = rootChildren.filter((_, i) => i % 2 === 1);

    // Layout function with side parameter
    const layoutBranch = (
      nodes: MindmapNode[],
      side: 'left' | 'right',
      startY: number,
      level: number
    ): number => {
      let currentY = startY;

      nodes.forEach((node) => {
        const xMultiplier = side === 'left' ? -1 : 1;
        const x = xMultiplier * level * horizontalSpacing;
        const y = currentY;

        nodePositions.set(node.id, { x, y, side });

        const children = childrenMap.get(node.id) || [];
        if (children.length > 0) {
          const childStartY = currentY - ((children.length - 1) * verticalSpacing) / 2;
          const endY = layoutBranch(children, side, childStartY, level + 1);
          currentY = Math.max(currentY, endY);
        }

        currentY += verticalSpacing;
      });

      return currentY;
    };

    // Layout left and right branches
    const leftStartY = (-(leftChildren.length - 1) * verticalSpacing) / 2;
    const rightStartY = (-(rightChildren.length - 1) * verticalSpacing) / 2;

    layoutBranch(leftChildren, 'left', leftStartY, 1);
    layoutBranch(rightChildren, 'right', rightStartY, 1);

    // Create ReactFlow nodes with positions
    allNodes.forEach((node) => {
      const pos = nodePositions.get(node.id);
      if (!pos) return;

      const isRoot = node.id === rootNode.id;
      const sourcePos =
        pos.side === 'left'
          ? Position.Left
          : pos.side === 'right'
            ? Position.Right
            : Position.Right;
      const targetPos =
        pos.side === 'left' ? Position.Right : pos.side === 'right' ? Position.Left : Position.Left;

      reactFlowNodes.push({
        id: node.id,
        type: 'default',
        position: { x: pos.x, y: pos.y },
        data: {
          label: (
            <div className="mindmap-node-content">
              <span className="node-icon">{getIconSymbol(node.icon)}</span>
              <span className="node-text">{node.content}</span>
            </div>
          ),
          mindmapNode: node,
        },
        style: {
          background: isRoot ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : node.color,
          color: '#fff',
          border: isRoot ? '3px solid #fff' : '2px solid #fff',
          borderRadius: isRoot ? '20px' : '12px',
          padding: isRoot ? '16px 24px' : '12px 16px',
          fontSize: isRoot ? '16px' : '14px',
          fontWeight: '600',
          boxShadow: isRoot
            ? '0 8px 16px rgba(102, 126, 234, 0.3)'
            : '0 4px 6px rgba(0, 0, 0, 0.1)',
          minWidth: isRoot ? '200px' : '180px',
          textAlign: 'center' as const,
        },
        sourcePosition: sourcePos,
        targetPosition: targetPos,
      });

      if (node.parentId) {
        const parentPos = nodePositions.get(node.parentId);
        reactFlowEdges.push({
          id: `${node.parentId}-${node.id}`,
          source: node.parentId,
          target: node.id,
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: isRoot || !parentPos ? '#667eea' : '#94a3b8',
            strokeWidth: isRoot || node.parentId === rootNode.id ? 3 : 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isRoot || !parentPos ? '#667eea' : '#94a3b8',
          },
        });
      }
    });

    setNodes(reactFlowNodes);
    setEdges(reactFlowEdges);
  };

  const getIconSymbol = (icon: string): string => {
    const iconMap: Record<string, string> = {
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
    return iconMap[icon] || '📌';
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = (_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    const mindmapNode = node.data.mindmapNode as MindmapNode;
    setEditForm({
      content: mindmapNode.content,
      color: mindmapNode.color,
      icon: mindmapNode.icon,
    });
  };

  const handleSaveNode = async () => {
    if (!selectedNode || !mindmap) return;

    try {
      setSaving(true);
      const mindmapNode = selectedNode.data.mindmapNode as MindmapNode;

      await MindmapService.updateNode(mindmap.id, mindmapNode.id, {
        content: editForm.content,
        color: editForm.color,
        icon: editForm.icon,
      });

      // Reload mindmap
      if (id) await loadMindmap(id);
      setSelectedNode(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update node');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNode = async () => {
    if (!selectedNode || !mindmap) return;
    if (!confirm('Bạn có chắc chắn muốn xóa node này?')) return;

    try {
      const mindmapNode = selectedNode.data.mindmapNode as MindmapNode;
      await MindmapService.deleteNode(mindmap.id, mindmapNode.id);

      // Reload mindmap
      if (id) await loadMindmap(id);
      setSelectedNode(null);
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
          <button onClick={() => navigate('/teacher/mindmaps')}>Quay lại</button>
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
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              fitView
              fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
              attributionPosition="bottom-left"
              minZoom={0.1}
              maxZoom={2}
              defaultEdgeOptions={{
                type: 'smoothstep',
                animated: false,
              }}
            >
              <Controls showInteractive={false} />
              <Background color="#cbd5e0" gap={20} size={1} variant={BackgroundVariant.Dots} />
            </ReactFlow>
          </div>

          {/* Edit Panel */}
          {selectedNode && (
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
                <button onClick={() => setSelectedNode(null)} className="btn-cancel">
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
