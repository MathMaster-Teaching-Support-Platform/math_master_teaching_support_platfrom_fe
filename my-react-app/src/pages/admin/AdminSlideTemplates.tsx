import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  EyeOff,
  FileSliders,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AuthService } from '../../services/api/auth.service';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin } from '../../data/mockData';
import {
  AdminSlideTemplateService,
  type AdminSlideTemplateCreatePayload,
  type AdminSlideTemplateUpdatePayload,
} from '../../services/api/admin-slide-template.service';
import type { LessonSlideTemplate } from '../../types/lessonSlide.types';
import '../../styles/module-refactor.css';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// ─── sub-components ──────────────────────────────────────────────────────────

interface StatusBadgeProps {
  active: boolean;
}
const StatusBadge: React.FC<StatusBadgeProps> = ({ active }) =>
  active ? (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: '#dcfce7',
        color: '#16a34a',
      }}
    >
      <CheckCircle2 size={12} /> Đang hoạt động
    </span>
  ) : (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: '#f3f4f6',
        color: '#6b7280',
      }}
    >
      <EyeOff size={12} /> Vô hiệu
    </span>
  );

// ─── Modal for create / edit ──────────────────────────────────────────────────

interface TemplateModalProps {
  mode: 'create' | 'edit';
  initial?: LessonSlideTemplate;
  onClose: () => void;
  onSaved: () => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ mode, initial, onClose, onSaved }) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [pptxFile, setPptxFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pptxRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLInputElement>(null);

  const isCreate = mode === 'create';

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) {
        setError('Tên template không được để trống.');
        return;
      }
      if (isCreate && !pptxFile) {
        setError('Vui lòng chọn file PPTX.');
        return;
      }

      setSaving(true);
      setError(null);

      try {
        if (isCreate) {
          const payload: AdminSlideTemplateCreatePayload = {
            name: name.trim(),
            description: description.trim() || undefined,
            pptxFile: pptxFile!,
            previewImageFile: previewFile ?? undefined,
          };
          await AdminSlideTemplateService.createTemplate(payload);
        } else {
          const payload: AdminSlideTemplateUpdatePayload = {};
          if (name.trim() !== (initial?.name ?? '')) payload.name = name.trim();
          if (description.trim() !== (initial?.description ?? ''))
            payload.description = description.trim();
          if (pptxFile) payload.pptxFile = pptxFile;
          if (previewFile) payload.previewImageFile = previewFile;
          await AdminSlideTemplateService.updateTemplate(initial!.id, payload);
        }
        onSaved();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra.');
      } finally {
        setSaving(false);
      }
    },
    [name, description, pptxFile, previewFile, isCreate, initial, onSaved, onClose]
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 28,
          width: '100%',
          maxWidth: 520,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
            {isCreate ? 'Thêm Template mới' : 'Chỉnh sửa Template'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              color: '#6b7280',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 16,
              color: '#dc2626',
              fontSize: 14,
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            {error}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)}>
          {/* Name */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
                color: '#374151',
              }}
            >
              Tên template <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Template Toán cơ bản"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
                color: '#374151',
              }}
            >
              Mô tả
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về template này..."
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* PPTX file */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
                color: '#374151',
              }}
            >
              File PPTX {isCreate && <span style={{ color: '#dc2626' }}>*</span>}
              {!isCreate && (
                <span style={{ color: '#9ca3af', fontWeight: 400 }}> (để trống nếu không đổi)</span>
              )}
            </label>
            <div
              onClick={() => pptxRef.current?.click()}
              style={{
                border: '1.5px dashed #d1d5db',
                borderRadius: 8,
                padding: '14px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: '#f9fafb',
                transition: 'border-color 0.15s',
              }}
            >
              <Upload size={18} color="#6b7280" />
              <span style={{ fontSize: 13, color: pptxFile ? '#111827' : '#9ca3af' }}>
                {pptxFile ? pptxFile.name : (initial?.originalFileName ?? 'Chọn file .pptx')}
              </span>
              {pptxFile && (
                <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 'auto' }}>
                  {formatFileSize(pptxFile.size)}
                </span>
              )}
            </div>
            <input
              ref={pptxRef}
              type="file"
              accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setPptxFile(f);
              }}
            />
          </div>

          {/* Preview image */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
                color: '#374151',
              }}
            >
              Ảnh preview{' '}
              <span style={{ color: '#9ca3af', fontWeight: 400 }}>(để trống nếu không đổi)</span>
            </label>
            <div
              onClick={() => previewRef.current?.click()}
              style={{
                border: '1.5px dashed #d1d5db',
                borderRadius: 8,
                padding: '14px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: '#f9fafb',
              }}
            >
              <Upload size={18} color="#6b7280" />
              <span style={{ fontSize: 13, color: previewFile ? '#111827' : '#9ca3af' }}>
                {previewFile ? previewFile.name : 'Chọn file ảnh (.png, .jpg, .webp)'}
              </span>
            </div>
            <input
              ref={previewRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setPreviewFile(f);
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                background: '#fff',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                color: '#374151',
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '8px 22px',
                borderRadius: 8,
                border: 'none',
                background: saving ? '#93c5fd' : '#3b82f6',
                color: '#fff',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {saving && <Loader2 size={14} className="spin" />}
              {isCreate ? 'Tải lên' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Preview modal ────────────────────────────────────────────────────────────

interface PreviewModalProps {
  template: LessonSlideTemplate;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ template, onClose }) => {
  const token = AuthService.getToken();
  const hasPreview = Boolean(template.previewImage) && Boolean(token);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadingImg, setLoadingImg] = useState(hasPreview);
  const [imgError, setImgError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasPreview) return;

    let objectUrl: string | null = null;

    fetch(AdminSlideTemplateService.getPreviewImageUrl(template.id), {
      headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { message?: string };
          throw new Error(body.message ?? `Lỗi ${res.status}`);
        }
        return res.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch((err: unknown) => {
        setImgError(err instanceof Error ? err.message : 'Không thể tải ảnh preview.');
      })
      .finally(() => setLoadingImg(false));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [hasPreview, template.id, token]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 16,
          maxWidth: 700,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{template.name}</span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              color: '#6b7280',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {!template.previewImage ? (
          <div
            style={{
              height: 200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f9fafb',
              borderRadius: 8,
              color: '#9ca3af',
              gap: 8,
            }}
          >
            <FileSliders size={36} style={{ opacity: 0.4 }} />
            <span style={{ fontSize: 14 }}>Chưa có ảnh preview cho template này.</span>
          </div>
        ) : loadingImg ? (
          <div
            style={{
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: '#6b7280',
            }}
          >
            <Loader2 size={20} className="ast-spin" /> Đang tải ảnh...
          </div>
        ) : imgError ? (
          <div
            style={{
              height: 200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fef2f2',
              borderRadius: 8,
              color: '#dc2626',
              gap: 8,
              fontSize: 14,
            }}
          >
            <AlertCircle size={24} />
            {imgError}
          </div>
        ) : blobUrl ? (
          <img
            src={blobUrl}
            alt={`Preview: ${template.name}`}
            style={{
              width: '100%',
              borderRadius: 8,
              objectFit: 'contain',
              maxHeight: 500,
              background: '#f3f4f6',
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminSlideTemplates() {
  const [templates, setTemplates] = useState<LessonSlideTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortField, setSortField] = useState<'name' | 'createdAt'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [showModal, setShowModal] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<LessonSlideTemplate | null>(null);
  const [previewTarget, setPreviewTarget] = useState<LessonSlideTemplate | null>(null);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    const id = globalThis.setTimeout(() => setToast(null), 3500);
    return id;
  }, []);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AdminSlideTemplateService.listTemplates(false);
      const data = Array.isArray(res.result) ? res.result : [];
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách template.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const handleToggleActive = useCallback(
    async (t: LessonSlideTemplate) => {
      setActionLoading(t.id);
      try {
        if (t.active) {
          await AdminSlideTemplateService.deactivateTemplate(t.id);
          showToast(`Đã vô hiệu hóa "${t.name}"`);
        } else {
          await AdminSlideTemplateService.activateTemplate(t.id);
          showToast(`Đã kích hoạt "${t.name}"`);
        }
        await loadTemplates();
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Thao tác thất bại.', 'error');
      } finally {
        setActionLoading(null);
      }
    },
    [loadTemplates, showToast]
  );

  const handleDelete = useCallback(
    async (t: LessonSlideTemplate) => {
      if (!globalThis.confirm(`Xóa template "${t.name}"? Hành động này không thể hoàn tác.`))
        return;
      setActionLoading(t.id);
      try {
        await AdminSlideTemplateService.deleteTemplate(t.id);
        showToast(`Đã xóa "${t.name}"`);
        await loadTemplates();
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Xóa thất bại.', 'error');
      } finally {
        setActionLoading(null);
      }
    },
    [loadTemplates, showToast]
  );

  const handleDownload = useCallback(
    async (t: LessonSlideTemplate) => {
      setActionLoading(`dl-${t.id}`);
      try {
        const { blob, filename } = await AdminSlideTemplateService.downloadTemplate(t.id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Đang tải "${filename}"`);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Tải file thất bại.', 'error');
      } finally {
        setActionLoading(null);
      }
    },
    [showToast]
  );

  const toggleSort = useCallback(
    (field: 'name' | 'createdAt') => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir('asc');
      }
    },
    [sortField]
  );

  const filtered = templates
    .filter((t) => {
      if (filterActive === 'active' && !t.active) return false;
      if (filterActive === 'inactive' && t.active) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          (t.description ?? '').toLowerCase().includes(q) ||
          t.originalFileName.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name, 'vi');
      else cmp = (a.createdAt ?? '') < (b.createdAt ?? '') ? -1 : 1;
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const SortIcon = ({ field }: { field: 'name' | 'createdAt' }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? (
      <ChevronUp size={14} style={{ marginLeft: 2 }} />
    ) : (
      <ChevronDown size={14} style={{ marginLeft: 2 }} />
    );
  };

  return (
    <DashboardLayout role="admin" user={mockAdmin}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 2000,
            background: toast.type === 'success' ? '#166534' : '#991b1b',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 500,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      {/* Modals */}
      {showModal === 'create' && (
        <TemplateModal
          mode="create"
          onClose={() => setShowModal(null)}
          onSaved={() => void loadTemplates()}
        />
      )}
      {showModal === 'edit' && editTarget && (
        <TemplateModal
          mode="edit"
          initial={editTarget}
          onClose={() => {
            setShowModal(null);
            setEditTarget(null);
          }}
          onSaved={() => void loadTemplates()}
        />
      )}
      {previewTarget && (
        <PreviewModal template={previewTarget} onClose={() => setPreviewTarget(null)} />
      )}

      <style>{`
        .ast-spin { animation: ast-spin 0.8s linear infinite; }
        @keyframes ast-spin { to { transform: rotate(360deg); } }
        .ast-btn-icon {
          background: none; border: none; cursor: pointer;
          padding: 6px; border-radius: 6px;
          display: flex; align-items: center;
          transition: background 0.15s;
          color: #6b7280;
        }
        .ast-btn-icon:hover { background: #f3f4f6; color: #111827; }
        .ast-btn-icon:disabled { opacity: 0.4; cursor: not-allowed; }
        .ast-row:hover { background: #f9fafb; }
      `}</style>

      <div style={{ padding: '28px 28px 40px', maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileSliders size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827' }}>
                Quản lý Slide Template
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                {templates.length} template • {templates.filter((t) => t.active).length} đang hoạt
                động
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowModal('create')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 18px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            <Plus size={16} /> Thêm Template
          </button>
        </div>

        {/* Filters */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 20,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 340 }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
              }}
            />
            <input
              type="text"
              placeholder="Tìm kiếm tên, file..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px 8px 32px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Status filter */}
          {(['all', 'active', 'inactive'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setFilterActive(v)}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: '1px solid',
                borderColor: filterActive === v ? '#3b82f6' : '#e5e7eb',
                background: filterActive === v ? '#eff6ff' : '#fff',
                color: filterActive === v ? '#1d4ed8' : '#374151',
                fontWeight: filterActive === v ? 600 : 400,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {v === 'all' ? 'Tất cả' : v === 'active' ? 'Đang hoạt động' : 'Vô hiệu'}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 200,
              color: '#6b7280',
              gap: 10,
            }}
          >
            <Loader2 size={20} className="ast-spin" /> Đang tải...
          </div>
        ) : error ? (
          <div
            style={{
              display: 'flex',
              gap: 8,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 10,
              padding: '14px 18px',
              color: '#dc2626',
              alignItems: 'center',
            }}
          >
            <AlertCircle size={18} />
            {error}
            <button
              onClick={() => void loadTemplates()}
              style={{
                marginLeft: 'auto',
                padding: '4px 12px',
                borderRadius: 6,
                border: '1px solid #fecaca',
                background: '#fff',
                color: '#dc2626',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Thử lại
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 0',
              color: '#9ca3af',
            }}
          >
            <FileSliders size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: 15 }}>Chưa có template nào.</p>
            <button
              onClick={() => setShowModal('create')}
              style={{
                marginTop: 16,
                padding: '8px 18px',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Thêm Template đầu tiên
            </button>
          </div>
        ) : (
          <div
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#374151',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => toggleSort('name')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Template <SortIcon field="name" />
                    </div>
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    File
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    Trạng thái
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#374151',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => toggleSort('createdAt')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Ngày tạo <SortIcon field="createdAt" />
                    </div>
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, idx) => {
                  const isActionLoading = actionLoading === t.id;
                  const isDownloading = actionLoading === `dl-${t.id}`;
                  return (
                    <tr
                      key={t.id}
                      className="ast-row"
                      style={{
                        borderBottom: idx < filtered.length - 1 ? '1px solid #f3f4f6' : 'none',
                        transition: 'background 0.1s',
                      }}
                    >
                      {/* Name + description */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          {/* Preview thumbnail */}
                          <div
                            onClick={() => setPreviewTarget(t)}
                            title="Xem ảnh preview"
                            style={{
                              width: 52,
                              height: 38,
                              borderRadius: 6,
                              background: '#f3f4f6',
                              flexShrink: 0,
                              cursor: 'pointer',
                              overflow: 'hidden',
                              border: '1px solid #e5e7eb',
                            }}
                          >
                            {t.previewImage ? (
                              <img
                                src={AdminSlideTemplateService.getPreviewImageUrl(t.id)}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <FileSliders size={16} color="#9ca3af" />
                              </div>
                            )}
                          </div>

                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>
                              {t.name}
                            </div>
                            {t.description && (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: '#6b7280',
                                  marginTop: 2,
                                  maxWidth: 260,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {t.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* File */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            fontSize: 12,
                            color: '#374151',
                            fontFamily: 'monospace',
                            background: '#f3f4f6',
                            padding: '2px 6px',
                            borderRadius: 4,
                          }}
                        >
                          {t.originalFileName}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <StatusBadge active={t.active} />
                      </td>

                      {/* Created at */}
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#6b7280' }}>
                        {formatDate(t.createdAt)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            justifyContent: 'flex-end',
                          }}
                        >
                          {/* Preview */}
                          <button
                            className="ast-btn-icon"
                            title="Xem preview"
                            onClick={() => setPreviewTarget(t)}
                          >
                            <Eye size={16} />
                          </button>

                          {/* Download */}
                          <button
                            className="ast-btn-icon"
                            title="Tải PPTX"
                            disabled={isDownloading}
                            onClick={() => void handleDownload(t)}
                          >
                            {isDownloading ? (
                              <Loader2 size={16} className="ast-spin" />
                            ) : (
                              <Download size={16} />
                            )}
                          </button>

                          {/* Edit */}
                          <button
                            className="ast-btn-icon"
                            title="Chỉnh sửa"
                            onClick={() => {
                              setEditTarget(t);
                              setShowModal('edit');
                            }}
                          >
                            <Pencil size={16} />
                          </button>

                          {/* Activate / Deactivate */}
                          <button
                            className="ast-btn-icon"
                            title={t.active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                            disabled={isActionLoading}
                            onClick={() => void handleToggleActive(t)}
                            style={{ color: t.active ? '#f59e0b' : '#16a34a' }}
                          >
                            {isActionLoading ? (
                              <Loader2 size={16} className="ast-spin" />
                            ) : t.active ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            className="ast-btn-icon"
                            title="Xóa"
                            disabled={isActionLoading}
                            onClick={() => void handleDelete(t)}
                            style={{ color: '#ef4444' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
