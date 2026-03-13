import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Network, Sparkles, WandSparkles } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockTeacher } from '../../data/mockData';
import { MindmapService } from '../../services/api/mindmap.service';
import type { Mindmap } from '../../types';
import './TeacherMindmaps.css';

export default function TeacherMindmaps() {
  const navigate = useNavigate();
  const [mindmaps, setMindmaps] = useState<Mindmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'ALL'>(
    'ALL'
  );

  // Generator form state
  const [generatorForm, setGeneratorForm] = useState({
    title: '',
    prompt: '',
    levels: 3,
  });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadMindmaps();
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMindmaps = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: {
        page?: number;
        size?: number;
        status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
        sortBy?: string;
        direction?: 'ASC' | 'DESC';
      } = {
        page: 0,
        size: 10,
        sortBy: 'createdAt',
        direction: 'DESC',
      };
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const response = await MindmapService.getMyMindmaps(params);
      setMindmaps(response.result.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mindmaps');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMindmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatorForm.title.trim() || !generatorForm.prompt.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      setGenerating(true);
      const response = await MindmapService.generateMindmap({
        title: generatorForm.title,
        prompt: generatorForm.prompt,
        levels: generatorForm.levels,
      });

      // Navigate to editor
      navigate(`/teacher/mindmaps/${response.result.mindmap.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate mindmap');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mindmap này?')) return;

    try {
      await MindmapService.deleteMindmap(id);
      loadMindmaps();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete mindmap');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      DRAFT: { label: 'Nháp', className: 'status-draft' },
      PUBLISHED: { label: 'Đã xuất bản', className: 'status-published' },
      ARCHIVED: { label: 'Đã lưu trữ', className: 'status-archived' },
    };
    const config = statusMap[status as keyof typeof statusMap];
    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
  };

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: mockTeacher.name, avatar: mockTeacher.avatar!, role: 'teacher' }}
      notificationCount={5}
    >
      <div className="teacher-mindmaps-page">
        <div className="mindmaps-header">
          <div className="header-copy">
            <h1>Mindmap của tôi</h1>
            <p>Tạo và quản lý mindmap trực quan cho các bài giảng toán học sinh động hơn.</p>
          </div>
          <button className="btn-generate" onClick={() => setShowGenerator(!showGenerator)}>
            <Sparkles size={18} />
            <span>Tạo Mindmap AI</span>
          </button>
        </div>

        {showGenerator && (
          <div className="generator-panel">
            <form onSubmit={handleGenerateMindmap}>
              <div className="generator-heading">
                <div className="generator-icon">
                  <WandSparkles size={18} />
                </div>
                <div>
                  <h3>Tạo Mindmap với AI</h3>
                  <p>Mô tả chủ đề, hệ thống sẽ đề xuất cấu trúc mindmap trực quan cho bạn.</p>
                </div>
              </div>
              <div className="form-group">
                <label>Tiêu đề</label>
                <input
                  type="text"
                  value={generatorForm.title}
                  onChange={(e) => setGeneratorForm({ ...generatorForm, title: e.target.value })}
                  placeholder="VD: Hình học lớp 9"
                  required
                />
              </div>
              <div className="form-group">
                <label>Mô tả nội dung</label>
                <textarea
                  value={generatorForm.prompt}
                  onChange={(e) => setGeneratorForm({ ...generatorForm, prompt: e.target.value })}
                  placeholder="VD: Tạo mindmap về Hình học lớp 9, bao gồm các chủ đề: tam giác, tứ giác, đường tròn..."
                  rows={4}
                  required
                />
              </div>
              <div className="form-group">
                <label>Số cấp độ</label>
                <input
                  type="number"
                  min="2"
                  max="5"
                  value={generatorForm.levels}
                  onChange={(e) =>
                    setGeneratorForm({ ...generatorForm, levels: Number(e.target.value) })
                  }
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowGenerator(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-submit" disabled={generating}>
                  {generating ? 'Đang tạo...' : 'Tạo Mindmap'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mindmaps-filter">
          <button
            className={`filter-tab ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            Tất cả
          </button>
          <button
            className={`filter-tab ${statusFilter === 'DRAFT' ? 'active' : ''}`}
            onClick={() => setStatusFilter('DRAFT')}
          >
            Nháp
          </button>
          <button
            className={`filter-tab ${statusFilter === 'PUBLISHED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('PUBLISHED')}
          >
            Đã xuất bản
          </button>
          <button
            className={`filter-tab ${statusFilter === 'ARCHIVED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ARCHIVED')}
          >
            Lưu trữ
          </button>
        </div>

        {loading ? (
          <div className="page-state loading">Đang tải danh sách mindmap...</div>
        ) : error ? (
          <div className="page-state error-message">{error}</div>
        ) : mindmaps.length === 0 ? (
          <div className="empty-state">
            <div className="empty-visual">
              <div className="empty-visual-ring">
                <Network size={54} strokeWidth={1.7} />
              </div>
            </div>
            <h3>Chưa có mindmap nào</h3>
            <p>
              Bắt đầu hành trình sáng tạo của bạn. Tạo mindmap đầu tiên bằng AI ngay hôm nay để hệ
              thống hóa kiến thức dễ dàng hơn.
            </p>
            <button className="empty-cta" onClick={() => setShowGenerator(true)}>
              Bắt đầu ngay
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="mindmaps-grid">
            {mindmaps.map((mindmap) => (
              <div key={mindmap.id} className="mindmap-card">
                <div className="card-header">
                  <h3>{mindmap.title}</h3>
                  {getStatusBadge(mindmap.status)}
                </div>
                <p className="card-description">{mindmap.description}</p>
                <div className="card-meta">
                  <span className="meta-item">
                    <span className="icon">●</span>
                    {mindmap.nodeCount} nodes
                  </span>
                  {mindmap.aiGenerated && (
                    <span className="meta-item ai-badge">
                      <Sparkles size={14} />
                      AI Generated
                    </span>
                  )}
                </div>
                <div className="card-footer">
                  <span className="card-date">{formatDate(mindmap.createdAt)}</span>
                  <div className="card-actions">
                    <button
                      className="btn-edit"
                      onClick={() => navigate(`/teacher/mindmaps/${mindmap.id}`)}
                    >
                      Chỉnh sửa
                    </button>
                    <button className="btn-delete" onClick={() => handleDelete(mindmap.id)}>
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
