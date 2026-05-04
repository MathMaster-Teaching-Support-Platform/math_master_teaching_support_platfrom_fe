import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Edit3,
  FileJson,
  FileText,
  History,
  Image,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin } from '../../data/mockData';
import { OcrService } from '../../services/api/ocr.service';
import type {
  OcrBook,
  OcrChapter,
  OcrChapterCreateRequest,
  OcrContentCreateRequest,
  OcrContentItem,
  OcrContentItemType,
  OcrContentUpdateRequest,
  OcrHistoryEntry,
  OcrLesson,
  OcrLessonContent,
  OcrLessonCreateRequest,
} from '../../types/ocr.types';
import './AdminOCRContent.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

// Fields that are system metadata — excluded from diff view
const SYSTEM_FIELDS = new Set([
  'id', '_id', 'updated_at', 'updated_by', 'created_at',
  'book_id', 'chapter_id', 'lesson_id', 'order',
  'lesson_index', 'chapter_index', 'roman_index',
]);

const FIELD_LABELS: Record<string, string> = {
  title: 'Tiêu đề',
  content: 'Nội dung',
  latex: 'LaTeX',
  caption: 'Chú thích',
  label: 'Nhãn',
  image_url: 'URL ảnh',
  type: 'Loại',
  exercise_type: 'Loại bài tập',
  publisher: 'Nhà xuất bản',
  grade: 'Lớp',
};

const ENTITY_LABEL: Record<string, string> = {
  chapter: 'Chương',
  lesson: 'Bài học',
  content: 'Nội dung',
};

function getInitial(email: string): string {
  return email ? email[0].toUpperCase() : '?';
}

function truncateVal(v: unknown, max = 200): string {
  if (v === null || v === undefined) return '—';
  const s = String(v);
  return s.length > max ? s.slice(0, max) + '…' : s || '—';
}

// ─── Inline LaTeX parser ─────────────────────────────────────────────────────
// Splits text on $...$ boundaries and renders each LaTeX segment with InlineMath.
function renderMixedContent(text: string | undefined): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/\$([^$]+)\$/g);
  return parts.map((part, i) => {
    // odd indices are the captured LaTeX groups
    if (i % 2 === 1) {
      const key = `math-${i}-${part.slice(0, 8)}`;
      try {
        return <InlineMath key={key} math={part} />;
      } catch {
        return <code key={key}>{part}</code>;
      }
    }
    return part;
  });
}

// Python static base URL for /static/... assets served by FastAPI
const OCR_PYTHON_BASE: string =
  globalThis.window?.location.hostname === 'localhost'
    ? ((import.meta.env.VITE_OCR_PROXY_TARGET as string | undefined) ?? 'http://localhost:8001')
    : '';

function buildStaticUrl(path: string): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${OCR_PYTHON_BASE}${path}`;
}

// ─── Content Item Renderer ────────────────────────────────────────────────────

const ContentItemView: React.FC<{ item: OcrContentItem }> = ({ item }) => {

  switch (item.type) {
    case 'text':
      return <p className="cnt-item-text">{renderMixedContent(item.content)}</p>;

    case 'heading':
      return <h3 className="cnt-item-heading">{renderMixedContent(item.content)}</h3>;

    case 'formula': {
      const latexSrc = item.latex ?? item.content;
      if (!latexSrc) return null;
      try {
        return (
          <div className="cnt-item-formula">
            <BlockMath math={latexSrc} />
          </div>
        );
      } catch {
        return (
          <div className="cnt-item-formula">
            <code className="cnt-formula-raw">{latexSrc}</code>
          </div>
        );
      }
    }

    case 'definition':
      return (
        <div className="cnt-item-definition">
          <p className="cnt-item-box-label">{renderMixedContent(item.label ?? 'Định nghĩa')}</p>
          <p className="cnt-item-box-content">{renderMixedContent(item.content)}</p>
        </div>
      );

    case 'example':
      return (
        <div className="cnt-item-example">
          <p className="cnt-item-box-label">{renderMixedContent(item.label ?? 'Ví dụ')}</p>
          <p className="cnt-item-box-content">{renderMixedContent(item.content)}</p>
        </div>
      );

    case 'exercise':
      return (
        <div className="cnt-item-exercise">
          <p className="cnt-item-box-label">{renderMixedContent(item.label ?? 'Bài tập')}</p>
          <p className="cnt-item-box-content">{renderMixedContent(item.content)}</p>
        </div>
      );

    case 'note':
      return <p className="cnt-item-note">{renderMixedContent(item.content)}</p>;

    case 'image': {
      const imgPath = item.image_url ?? item.image_path;
      if (!imgPath) return null;
      const caption = item.caption ?? item.label;
      const normalizedPath = imgPath.startsWith('/') ? imgPath : `/static/${imgPath}`;
      const src = buildStaticUrl(normalizedPath);
      return (
        <div className="cnt-item-image">
          <img
            src={src}
            alt={caption ?? 'Hình minh họa'}
            onError={(e) => {
              // Fallback: show placeholder
              (e.currentTarget as HTMLImageElement).style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
              if (fallback) fallback.style.display = 'inline-flex';
            }}
          />
          <span className="cnt-item-image-placeholder" style={{ display: 'none' }}>
            <Image size={14} />
            {caption ?? imgPath}
          </span>
          {caption && <p className="cnt-item-image-caption">{caption}</p>}
        </div>
      );
    }

    default:
      return <p className="cnt-item-text">{item.content}</p>;
  }
};

// ─── Chapter + Lessons sidebar item ──────────────────────────────────────────

const ChapterItem: React.FC<{
  chapter: OcrChapter;
  bookId: string;
  editMode: boolean;
  selectedLessonId: string | null;
  onSelectLesson: (lesson: OcrLesson) => void;
}> = ({ chapter, bookId, editMode, selectedLessonId, onSelectLesson }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Chapter edit state
  const [editingChapter, setEditingChapter] = useState(false);
  const [chapterTitle, setChapterTitle] = useState(chapter.title);
  const chapterInputRef = useRef<HTMLInputElement>(null);

  // Lesson edit state
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');

  const { data: lessons = [], isFetching } = useQuery({
    queryKey: ['ocr-lessons', chapter.id],
    queryFn: () => OcrService.getChapterLessons(chapter.id),
    enabled: open,
    staleTime: 5 * 60_000,
  });

  const hasActive = lessons.some((l) => l.id === selectedLessonId);

  const updateChapterMut = useMutation({
    mutationFn: (title: string) => OcrService.updateChapter(chapter.id, { title }),
    onSuccess: () => {
      setEditingChapter(false);
      void queryClient.invalidateQueries({ queryKey: ['ocr-chapters', bookId] });
    },
  });

  const deleteChapterMut = useMutation({
    mutationFn: () => OcrService.deleteChapter(chapter.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ocr-chapters', bookId] });
    },
  });

  const createLessonMut = useMutation({
    mutationFn: (payload: OcrLessonCreateRequest) => OcrService.createLesson(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ocr-lessons', chapter.id] });
      setNewLessonTitle('');
      setAddingLesson(false);
    },
  });

  const [addingLesson, setAddingLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');

  const updateLessonMut = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      OcrService.updateLesson(id, { title }),
    onSuccess: () => {
      setEditingLessonId(null);
      void queryClient.invalidateQueries({ queryKey: ['ocr-lessons', chapter.id] });
    },
  });

  const deleteLessonMut = useMutation({
    mutationFn: (lessonId: string) => OcrService.deleteLesson(lessonId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ocr-lessons', chapter.id] });
    },
  });

  const startEditChapter = (e: React.MouseEvent) => {
    e.stopPropagation();
    setChapterTitle(chapter.title);
    setEditingChapter(true);
    setTimeout(() => chapterInputRef.current?.focus(), 50);
  };

  const saveChapter = () => {
    const t = chapterTitle.trim();
    if (t && t !== chapter.title) updateChapterMut.mutate(t);
    else setEditingChapter(false);
  };

  const handleDeleteChapter = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (globalThis.confirm(`Xóa chương "${chapter.title}"? Tất cả bài học trong chương sẽ bị xóa.`)) {
      deleteChapterMut.mutate();
    }
  };

  const startEditLesson = (lesson: OcrLesson, e: React.MouseEvent) => {
    e.stopPropagation();
    setLessonTitle(lesson.title);
    setEditingLessonId(lesson.id);
  };

  const handleDeleteLesson = (lesson: OcrLesson, e: React.MouseEvent) => {
    e.stopPropagation();
    if (globalThis.confirm(`Xóa bài "${lesson.title}"?`)) {
      deleteLessonMut.mutate(lesson.id);
    }
  };

  return (
    <div className="cnt-chapter">
      {editingChapter ? (
        <div className="cnt-chapter-edit-row">
          <input
            ref={chapterInputRef}
            className="cnt-inline-input"
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveChapter();
              if (e.key === 'Escape') setEditingChapter(false);
            }}
          />
          <button
            className="cnt-inline-action cnt-inline-action--save"
            title="Lưu"
            disabled={updateChapterMut.isPending}
            onClick={saveChapter}
          >
            <Check size={13} />
          </button>
          <button
            className="cnt-inline-action cnt-inline-action--cancel"
            title="Hủy"
            onClick={() => setEditingChapter(false)}
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <>
        <div className={`cnt-chapter-btn-row${hasActive ? ' cnt-chapter-btn-row--active' : ''}`}>
          <button
            className="cnt-chapter-btn"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="cnt-chapter-num">
              {chapter.roman_index || String(chapter.chapter_index)}
            </span>
            <span className="cnt-chapter-title">{chapter.title}</span>
            <ChevronDown
              size={13}
              className={`cnt-chapter-chevron${open ? ' cnt-chapter-chevron--open' : ''}`}
            />
          </button>
          {editMode && (
            <>
              <button
                className="cnt-item-action cnt-item-action--edit"
                title="Đổi tên chương"
                onClick={startEditChapter}
              >
                <Pencil size={14} />
              </button>
              <button
                className="cnt-item-action cnt-item-action--delete"
                title="Xóa chương"
                disabled={deleteChapterMut.isPending}
                onClick={handleDeleteChapter}
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
        {chapter.updated_by && (
          <div className="cnt-meta-info">
            <Clock size={10} />
            {chapter.updated_by} · {formatRelativeTime(chapter.updated_at)}
          </div>
        )}
        </>
      )}

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="cnt-lessons-list">
              {isFetching && (
                <div className="cnt-sidebar-loading">
                  <div className="cnt-spinner" />
                  Đang tải…
                </div>
              )}
              {lessons.map((lesson) =>
                editingLessonId === lesson.id ? (
                  <div
                    key={lesson.id}
                    className="cnt-lesson-edit-row"
                  >
                    <input
                      className="cnt-inline-input cnt-inline-input--lesson"
                      value={lessonTitle}
                      autoFocus
                      onChange={(e) => setLessonTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const t = lessonTitle.trim();
                          if (t) updateLessonMut.mutate({ id: lesson.id, title: t });
                          else setEditingLessonId(null);
                        }
                        if (e.key === 'Escape') setEditingLessonId(null);
                      }}
                    />
                    <button
                      className="cnt-inline-action cnt-inline-action--save"
                      title="Lưu"
                      disabled={updateLessonMut.isPending}
                      onClick={() => {
                        const t = lessonTitle.trim();
                        if (t) updateLessonMut.mutate({ id: lesson.id, title: t });
                        else setEditingLessonId(null);
                      }}
                    >
                      <Check size={11} />
                    </button>
                    <button
                      className="cnt-inline-action cnt-inline-action--cancel"
                      title="Hủy"
                      onClick={() => setEditingLessonId(null)}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <div key={lesson.id} className="cnt-lesson-row">
                    <button
                      className={`cnt-lesson-btn${selectedLessonId === lesson.id ? ' cnt-lesson-btn--active' : ''}`}
                      onClick={() => onSelectLesson(lesson)}
                    >
                      <ChevronRight size={11} style={{ flexShrink: 0, marginTop: 2 }} />
                      {lesson.title}
                    </button>
                    {editMode && (
                      <>
                        <button
                          className="cnt-item-action cnt-item-action--edit"
                          title="Đổi tên bài"
                          onClick={(e) => startEditLesson(lesson, e)}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          className="cnt-item-action cnt-item-action--delete"
                          title="Xóa bài"
                          disabled={deleteLessonMut.isPending}
                          onClick={(e) => handleDeleteLesson(lesson, e)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                )
              )}
              {!isFetching && lessons.length === 0 && (
                <div className="cnt-sidebar-loading">Không có bài học</div>
              )}
              {editMode && (
                addingLesson ? (
                  <div className="cnt-lesson-edit-row">
                    <input
                      className="cnt-inline-input cnt-inline-input--lesson"
                      placeholder="Tên bài học mới…"
                      value={newLessonTitle}
                      autoFocus
                      onChange={(e) => setNewLessonTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const t = newLessonTitle.trim();
                          if (t) createLessonMut.mutate({ chapter_id: chapter.id, title: t });
                        }
                        if (e.key === 'Escape') { setAddingLesson(false); setNewLessonTitle(''); }
                      }}
                    />
                    <button
                      className="cnt-inline-action cnt-inline-action--save"
                      disabled={createLessonMut.isPending}
                      onClick={() => {
                        const t = newLessonTitle.trim();
                        if (t) createLessonMut.mutate({ chapter_id: chapter.id, title: t });
                      }}
                    >
                      <Check size={11} />
                    </button>
                    <button
                      className="cnt-inline-action cnt-inline-action--cancel"
                      onClick={() => { setAddingLesson(false); setNewLessonTitle(''); }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <button
                    className="cnt-add-lesson-btn"
                    onClick={() => { setOpen(true); setAddingLesson(true); }}
                  >
                    <Plus size={11} />
                    Thêm bài
                  </button>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── History Modal ────────────────────────────────────────────────────────────

const HISTORY_ACTION_LABEL: Record<string, string> = {
  create: 'Tạo mới',
  update: 'Cập nhật',
  delete: 'Xóa',
};

const DiffView: React.FC<{ before?: Record<string, unknown>; after?: Record<string, unknown> }> = ({ before, after }) => {
  const allKeys = Array.from(new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]));
  const changed = allKeys
    .filter((k) => !SYSTEM_FIELDS.has(k))
    .filter((k) => JSON.stringify((before ?? {})[k]) !== JSON.stringify((after ?? {})[k]));
  if (changed.length === 0) return <p className="cnt-diff-no-change">Không có thay đổi nội dung</p>;
  return (
    <div className="cnt-diff-cards">
      <div className="cnt-diff-side cnt-diff-side--before">
        <div className="cnt-diff-side-header">Trước</div>
        {changed.map((k) => (
          <div key={k} className="cnt-diff-field">
            <span className="cnt-diff-key">{FIELD_LABELS[k] ?? k}</span>
            <span className="cnt-diff-val">{truncateVal((before ?? {})[k])}</span>
          </div>
        ))}
      </div>
      <div className="cnt-diff-side cnt-diff-side--after">
        <div className="cnt-diff-side-header">Sau</div>
        {changed.map((k) => (
          <div key={k} className="cnt-diff-field">
            <span className="cnt-diff-key">{FIELD_LABELS[k] ?? k}</span>
            <span className="cnt-diff-val">{truncateVal((after ?? {})[k])}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const HistoryModal: React.FC<{
  title: string;
  entries: OcrHistoryEntry[];
  onClose: () => void;
}> = ({ title, entries, onClose }) => {
  const [expanded, setExpanded] = useState<string | null>(entries[0]?.id ?? null);
  return (
    <div className="cnt-modal-overlay" onClick={onClose}>
      <div className="cnt-modal cnt-modal--history" onClick={(e) => e.stopPropagation()}>
        <div className="cnt-modal-header">
          <div className="cnt-modal-title">
            <History size={16} />
            Lịch sử · {title}
          </div>
          <button className="cnt-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="cnt-modal-body">
          {entries.length === 0 && <p className="cnt-history-empty">Chưa có lịch sử thay đổi</p>}
          {entries.map((e) => (
            <div key={e.id} className={`cnt-history-entry${expanded === e.id ? ' cnt-history-entry--expanded' : ''}`}>
              <div className="cnt-history-meta">
                <div className="cnt-history-avatar">{getInitial(e.changed_by)}</div>
                <div className="cnt-history-info">
                  <div className="cnt-history-info-row">
                    <span className="cnt-history-by">{e.changed_by}</span>
                    <span className={`cnt-history-action cnt-history-action--${e.action}`}>
                      {HISTORY_ACTION_LABEL[e.action] ?? e.action}
                    </span>
                    {e.entity_type && (
                      <span className={`cnt-history-entity cnt-history-entity--${e.entity_type}`}>
                        {ENTITY_LABEL[e.entity_type] ?? e.entity_type}
                      </span>
                    )}
                  </div>
                  <span className="cnt-history-at">
                    <Clock size={10} />
                    {new Date(e.changed_at).toLocaleString('vi-VN')}
                  </span>
                  {e.summary && <p className="cnt-history-summary">{e.summary}</p>}
                  {(e.before ?? e.after) && (
                    <button
                      className="cnt-history-diff-toggle"
                      onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                    >
                      {expanded === e.id ? '▲ Ẩn chi tiết' : '▼ Xem thay đổi'}
                    </button>
                  )}
                  {expanded === e.id && <DiffView before={e.before} after={e.after} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Content Item Editor ──────────────────────────────────────────────────────

const ContentItemEditor: React.FC<{
  item: OcrContentItem;
  onSave: (payload: OcrContentUpdateRequest) => void;
  onCancel: () => void;
  isPending: boolean;
}> = ({ item, onSave, onCancel, isPending }) => {
  const [content, setContent] = useState(item.content ?? '');
  const [label, setLabel] = useState(item.label ?? '');
  const [latex, setLatex] = useState(item.latex ?? '');
  const [imageUrl, setImageUrl] = useState(item.image_url ?? '');
  const [caption, setCaption] = useState(item.caption ?? '');
  const [imgUploading, setImgUploading] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const handleImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImgUploading(true);
    try {
      const res = await OcrService.uploadContentImage(f);
      setImageUrl(res.image_url);
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setImgUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = () => {
    const payload: OcrContentUpdateRequest = {};
    if (content !== item.content) payload.content = content;
    if (label !== (item.label ?? '')) payload.label = label;
    if (latex !== (item.latex ?? '')) payload.latex = latex;
    if (imageUrl !== (item.image_url ?? '')) payload.image_url = imageUrl;
    if (caption !== (item.caption ?? '')) payload.caption = caption;
    onSave(payload);
  };

  return (
    <div className="cnt-item-editor">
      {['text', 'heading', 'note'].includes(item.type) && (
        <textarea
          className="cnt-editor-textarea"
          value={content}
          rows={4}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nội dung…"
        />
      )}
      {['definition', 'example', 'exercise'].includes(item.type) && (
        <>
          <input
            className="cnt-editor-input"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Nhãn (vd: Định nghĩa 1)…"
          />
          <textarea
            className="cnt-editor-textarea"
            value={content}
            rows={4}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nội dung…"
          />
        </>
      )}
      {item.type === 'formula' && (
        <textarea
          className="cnt-editor-textarea cnt-editor-textarea--mono"
          value={latex}
          rows={3}
          onChange={(e) => setLatex(e.target.value)}
          placeholder="LaTeX…"
        />
      )}
      {item.type === 'image' && (
        <>
          <div className="cnt-img-upload-row">
            <input
              className="cnt-editor-input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="URL hình ảnh…"
            />
            <button
              type="button"
              className="cnt-img-upload-btn"
              title="Upload ảnh từ máy"
              disabled={imgUploading}
              onClick={() => imgInputRef.current?.click()}
            >
              {imgUploading ? <Loader2 size={13} className="cnt-spin" /> : <Upload size={13} />}
              Upload
            </button>
            <input
              ref={imgInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleImgUpload}
            />
          </div>
          {imageUrl && (
            <img
              src={buildStaticUrl(imageUrl)}
              alt="preview"
              className="cnt-img-preview"
            />
          )}
          <input
            className="cnt-editor-input"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Chú thích…"
          />
        </>
      )}
      <div className="cnt-editor-actions">
        <button className="cnt-editor-save" onClick={handleSave} disabled={isPending}>
          <Check size={13} /> Lưu
        </button>
        <button className="cnt-editor-cancel" onClick={onCancel}>
          <X size={13} /> Hủy
        </button>
      </div>
    </div>
  );
};

// ─── Add Content Modal ────────────────────────────────────────────────────────

const CONTENT_TYPES: { value: OcrContentItemType; label: string }[] = [
  { value: 'text', label: 'Văn bản' },
  { value: 'heading', label: 'Tiêu đề' },
  { value: 'formula', label: 'Công thức' },
  { value: 'definition', label: 'Định nghĩa' },
  { value: 'example', label: 'Ví dụ' },
  { value: 'exercise', label: 'Bài tập' },
  { value: 'note', label: 'Ghi chú' },
  { value: 'image', label: 'Hình ảnh' },
];

const AddContentModal: React.FC<{
  lessonId: string;
  onSave: (payload: OcrContentCreateRequest) => void;
  onClose: () => void;
  isPending: boolean;
}> = ({ lessonId, onSave, onClose, isPending }) => {
  const [type, setType] = useState<OcrContentItemType>('text');
  const [content, setContent] = useState('');
  const [label, setLabel] = useState('');
  const [latex, setLatex] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [imgUploading, setImgUploading] = useState(false);
  const addImgInputRef = useRef<HTMLInputElement>(null);

  const handleAddImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImgUploading(true);
    try {
      const res = await OcrService.uploadContentImage(f);
      setImageUrl(res.image_url);
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setImgUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = () => {
    onSave({ lesson_id: lessonId, type, content, label, latex, image_url: imageUrl, caption });
  };

  return (
    <div className="cnt-modal-overlay" onClick={onClose}>
      <div className="cnt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cnt-modal-header">
          <div className="cnt-modal-title"><Plus size={15} /> Thêm nội dung</div>
          <button className="cnt-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="cnt-modal-body">
          <label className="cnt-editor-label">Loại nội dung</label>
          <select
            className="cnt-editor-select"
            value={type}
            onChange={(e) => setType(e.target.value as OcrContentItemType)}
          >
            {CONTENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {['text', 'heading', 'note', 'definition', 'example', 'exercise'].includes(type) && (
            <>
              {['definition', 'example', 'exercise'].includes(type) && (
                <input
                  className="cnt-editor-input"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Nhãn…"
                />
              )}
              <textarea
                className="cnt-editor-textarea"
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nội dung…"
              />
            </>
          )}
          {type === 'formula' && (
            <textarea
              className="cnt-editor-textarea cnt-editor-textarea--mono"
              rows={3}
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              placeholder="LaTeX công thức…"
            />
          )}
          {type === 'image' && (
            <>
              <div className="cnt-img-upload-row">
                <input
                  className="cnt-editor-input"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="URL hình ảnh…"
                />
                <button
                  type="button"
                  className="cnt-img-upload-btn"
                  title="Upload ảnh từ máy"
                  disabled={imgUploading}
                  onClick={() => addImgInputRef.current?.click()}
                >
                  {imgUploading ? <Loader2 size={13} className="cnt-spin" /> : <Upload size={13} />}
                  Upload
                </button>
                <input
                  ref={addImgInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleAddImgUpload}
                />
              </div>
              {imageUrl && (
                <img
                  src={buildStaticUrl(imageUrl)}
                  alt="preview"
                  className="cnt-img-preview"
                />
              )}
              <input
                className="cnt-editor-input"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Chú thích…"
              />
            </>
          )}
        </div>
        <div className="cnt-modal-footer">
          <button className="cnt-editor-cancel" onClick={onClose}>Hủy</button>
          <button className="cnt-editor-save" onClick={handleSave} disabled={isPending}>
            <Check size={13} /> Thêm
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Content Panel ────────────────────────────────────────────────────────────

const ContentPanel: React.FC<{
  lesson: OcrLesson | null;
  editMode: boolean;
}> = ({ lesson, editMode }) => {
  const queryClient = useQueryClient();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: content, isFetching } = useQuery<OcrLessonContent>({
    queryKey: ['ocr-lesson-content', lesson?.id],
    queryFn: () => OcrService.getLessonContent(lesson!.id),
    enabled: !!lesson,
    staleTime: 10 * 60_000,
  });

  const updateContentMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: OcrContentUpdateRequest }) =>
      OcrService.updateContent(id, payload),
    onSuccess: () => {
      setEditingItemId(null);
      void queryClient.invalidateQueries({ queryKey: ['ocr-lesson-content', lesson?.id] });
    },
  });

  const deleteContentMut = useMutation({
    mutationFn: (id: string) => OcrService.deleteContent(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ocr-lesson-content', lesson?.id] });
    },
  });

  const createContentMut = useMutation({
    mutationFn: (payload: OcrContentCreateRequest) => OcrService.createContent(payload),
    onSuccess: () => {
      setShowAddModal(false);
      void queryClient.invalidateQueries({ queryKey: ['ocr-lesson-content', lesson?.id] });
    },
  });

  if (!lesson) {
    return (
      <div className="cnt-panel-placeholder">
        <BookOpen size={48} className="cnt-panel-placeholder-icon" />
        <p className="cnt-panel-placeholder-text">
          Chọn một bài học từ danh sách bên trái để xem nội dung OCR
        </p>
      </div>
    );
  }

  if (isFetching) {
    return (
      <div className="cnt-panel-placeholder">
        <div className="cnt-spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
        <p className="cnt-panel-placeholder-text">Đang tải nội dung…</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="cnt-empty-state">
        <p>Không có nội dung cho bài học này</p>
      </div>
    );
  }

  return (
    <div>
      {showAddModal && lesson && (
        <AddContentModal
          lessonId={lesson.id}
          onSave={(p) => createContentMut.mutate(p)}
          onClose={() => setShowAddModal(false)}
          isPending={createContentMut.isPending}
        />
      )}
      <div className="cnt-lesson-header">
        <div>
          <h2 className="cnt-lesson-title">{content?.title || lesson.title}</h2>
          {lesson.updated_by && (
            <div className="cnt-meta-info">
              <Clock size={10} />
              Sửa bởi {lesson.updated_by} · {formatRelativeTime(lesson.updated_at)}
            </div>
          )}
        </div>
        <div className="cnt-lesson-header-actions">
          {lesson.page_start && (
            <p className="cnt-lesson-meta">Trang {lesson.page_start}</p>
          )}
          {editMode && (
            <button
              className="cnt-add-content-btn"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={13} />
              Thêm block
            </button>
          )}
        </div>
      </div>
      <div className="cnt-content-items">
        {(content?.items ?? []).map((item, idx) =>
          editingItemId === item.id ? (
            <div key={item.id} className="cnt-content-item-wrap cnt-content-item-wrap--editing">
              <ContentItemEditor
                item={item}
                isPending={updateContentMut.isPending}
                onSave={(payload) => updateContentMut.mutate({ id: item.id, payload })}
                onCancel={() => setEditingItemId(null)}
              />
            </div>
          ) : (
            <motion.div
              key={`${item.type ?? 'item'}-${item.order ?? idx}`}
              className="cnt-content-item-wrap"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.03, 0.3) }}
            >
              <ContentItemView item={item} />
              {item.updated_by && editMode && (
                <div className="cnt-meta-info cnt-meta-info--item">
                  <Clock size={10} />
                  {item.updated_by} · {formatRelativeTime(item.updated_at)}
                </div>
              )}
              {editMode && (
                <div className="cnt-content-item-actions">
                  <button
                    className="cnt-item-action cnt-item-action--edit"
                    title="Chỉnh sửa"
                    onClick={() => setEditingItemId(item.id)}
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    className="cnt-item-action cnt-item-action--delete"
                    title="Xóa"
                    disabled={deleteContentMut.isPending}
                    onClick={() => {
                      if (globalThis.confirm('Xóa nội dung này?')) deleteContentMut.mutate(item.id);
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </motion.div>
          )
        )}
        {(content?.items ?? []).length === 0 && (
          <p className="cnt-item-text" style={{ color: 'var(--cnt-text-muted)' }}>
            Bài học này chưa có nội dung OCR được trích xuất.
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const AdminOCRContent: React.FC = () => {
  const { bookId: paramBookId } = useParams<{ bookId?: string }>();
  const [selectedBookId, setSelectedBookId] = useState<string>(paramBookId ?? '');
  const [selectedLesson, setSelectedLesson] = useState<OcrLesson | null>(null);
  const [chapterSearch, setChapterSearch] = useState('');
  const [bookDropOpen, setBookDropOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const queryClient = useQueryClient();
  const dropRef = useRef<HTMLDivElement>(null);

  // Sync URL param → state
  useEffect(() => {
    if (paramBookId) setSelectedBookId(paramBookId);
  }, [paramBookId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setBookDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Books list for the selector
  const { data: booksData } = useQuery({
    queryKey: ['ocr-books'],
    queryFn: () => OcrService.getBooks(),
    staleTime: 30_000,
  });

  const allBooks: OcrBook[] = booksData?.books ?? (Array.isArray(booksData) ? (booksData as OcrBook[]) : []);
  const doneBooks = allBooks.filter((b) => b.status === 'done');

  // Selected book info
  const selectedBook = doneBooks.find((b) => b.id === selectedBookId) ?? null;

  // Chapters for selected book
  const { data: chapters = [], isFetching: chaptersLoading } = useQuery({
    queryKey: ['ocr-chapters', selectedBookId],
    queryFn: () => OcrService.getBookChapters(selectedBookId),
    enabled: !!selectedBookId,
    staleTime: 5 * 60_000,
  });

  const filteredChapters = chapterSearch
    ? chapters.filter((c) =>
        c.title.toLowerCase().includes(chapterSearch.toLowerCase())
      )
    : chapters;

  const [showBookHistory, setShowBookHistory] = useState(false);

  const { data: bookHistoryEntries = [] } = useQuery<OcrHistoryEntry[]>({
    queryKey: ['ocr-book-history', selectedBookId],
    queryFn: () => OcrService.getBookHistory(selectedBookId),
    enabled: !!selectedBookId && showBookHistory,
    staleTime: 60_000,
  });

  const [addingChapter, setAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const createChapterMut = useMutation({
    mutationFn: (payload: OcrChapterCreateRequest) => OcrService.createChapter(payload),
    onSuccess: () => {
      setAddingChapter(false);
      setNewChapterTitle('');
      void queryClient.invalidateQueries({ queryKey: ['ocr-chapters', selectedBookId] });
    },
  });

  const bookLabel = selectedBook
    ? `Lớp ${selectedBook.grade} — ${selectedBook.title}`
    : '— Chọn sách —';

  return (
    <DashboardLayout
      role="admin"
      user={{ name: mockAdmin.name, avatar: mockAdmin.avatar, role: 'admin' }}
      contentClassName="full-bleed"
    >
      <div className="ocr-content-page">
        {/* Top bar */}
        <div className="cnt-topbar">
          <Link to="/admin/ocr/books" className="cnt-back-btn">
            <ArrowLeft size={13} />
            Thư viện
          </Link>
          <h1 className="cnt-topbar-title">Kho nội dung OCR</h1>

          {/* Styled book selector */}
          <div className="cnt-book-select-wrap" ref={dropRef}>
            <span className="cnt-book-select-label">Sách:</span>
            <div className="cnt-book-dropdown">
              <button
                className={`cnt-book-dropdown-btn${bookDropOpen ? ' cnt-book-dropdown-btn--open' : ''}`}
                onClick={() => setBookDropOpen((v) => !v)}
              >
                <span className="cnt-book-dropdown-label">{bookLabel}</span>
                <ChevronDown size={13} className={`cnt-dropdown-chevron${bookDropOpen ? ' cnt-dropdown-chevron--open' : ''}`} />
              </button>
              {bookDropOpen && (
                <div className="cnt-book-dropdown-menu">
                  {doneBooks.length === 0 && (
                    <div className="cnt-dropdown-empty">Chưa có sách nào xử lý xong</div>
                  )}
                  {doneBooks.map((b) => (
                    <button
                      key={b.id}
                      className={`cnt-dropdown-option${b.id === selectedBookId ? ' cnt-dropdown-option--active' : ''}`}
                      onClick={() => {
                        setSelectedBookId(b.id);
                        setSelectedLesson(null);
                        setBookDropOpen(false);
                      }}
                    >
                      <span className="cnt-dropdown-option-grade">Lớp {b.grade}</span>
                      {b.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedBookId && (
            <div className="cnt-export-group">
              <button
                className={`cnt-edit-toggle-btn${editMode ? ' cnt-edit-toggle-btn--active' : ''}`}
                onClick={() => setEditMode((v) => !v)}
                title={editMode ? 'Thoát chế độ chỉnh sửa' : 'Chỉnh sửa nội dung'}
              >
                {editMode ? (
                  <><Save size={13} /> Lưu</>
                ) : (
                  <><Pencil size={13} /> Chỉnh sửa</>
                )}
              </button>
              <button
                className="cnt-history-btn"
                title="Lịch sử thay đổi"
                onClick={() => setShowBookHistory(true)}
              >
                <History size={13} />
                Lịch sử
              </button>
              <button
                className="cnt-export-btn"
                title="Export JSON"
                onClick={() => OcrService.exportJson(selectedBookId)}
              >
                <FileJson size={13} />
                JSON
              </button>
              <button
                className="cnt-export-btn"
                title="Export Markdown"
                onClick={() => OcrService.exportMarkdown(selectedBookId)}
              >
                <FileText size={13} />
                MD
              </button>
              <button
                className="cnt-export-btn"
                title="Export RAG Chunks"
                onClick={() => OcrService.exportChunks(selectedBookId)}
              >
                <Download size={13} />
                Chunks
              </button>
            </div>
          )}
        </div>

        {/* Book info banner */}
        {selectedBook && (
          <div className="cnt-book-banner">
            <span className="cnt-book-banner-grade">Lớp {selectedBook.grade}</span>
            <h2 className="cnt-book-banner-title">{selectedBook.title}</h2>
            <span className="cnt-book-banner-meta">
              {selectedBook.publisher && `${selectedBook.publisher} · `}
              {selectedBook.chapter_count ?? chapters.length} chương ·{' '}
              {selectedBook.lesson_count ?? 0} bài
            </span>
          </div>
        )}

        {/* Content body or empty state */}
        {!selectedBookId && (
          <div className="cnt-no-book">
            <Layers size={48} style={{ color: '#e8e6dc' }} />
            <h2>Chọn sách để xem nội dung</h2>
            <p>
              Chọn sách giáo khoa đã OCR xong từ danh sách trên, hoặc{' '}
              <Link to="/admin/ocr/books" style={{ color: 'var(--cnt-primary)', textDecoration: 'none', fontWeight: 600 }}>
                upload sách mới
              </Link>
            </p>
          </div>
        )}
        {showBookHistory && selectedBook && (
          <HistoryModal
            title={selectedBook.title}
            entries={bookHistoryEntries}
            onClose={() => setShowBookHistory(false)}
          />
        )}

        {selectedBookId && (
          <div className="cnt-body">
            {/* Left sidebar */}
            <aside className="cnt-sidebar">
              <div className="cnt-sidebar-header">
                <p className="cnt-sidebar-heading">Chương · Bài học</p>
              </div>

              <div className="cnt-search-wrap">
                <input
                  className="cnt-search-input"
                  placeholder="Tìm chương…"
                  value={chapterSearch}
                  onChange={(e) => setChapterSearch(e.target.value)}
                />
              </div>

              {chaptersLoading && (
                <div className="cnt-sidebar-loading">
                  <div className="cnt-spinner" />
                  Đang tải chương…
                </div>
              )}
              {!chaptersLoading && filteredChapters.length === 0 && (
                <div className="cnt-sidebar-loading">Không tìm thấy chương</div>
              )}
              {!chaptersLoading && filteredChapters.length > 0 && filteredChapters.map((chapter) => (
                  <ChapterItem
                    key={chapter.id}
                    chapter={chapter}
                    bookId={selectedBookId}
                    editMode={editMode}
                    selectedLessonId={selectedLesson?.id ?? null}
                    onSelectLesson={setSelectedLesson}
                  />
              ))}
              {editMode && (
                addingChapter ? (
                  <div className="cnt-lesson-edit-row" style={{ padding: '4px 8px' }}>
                    <input
                      className="cnt-inline-input"
                      placeholder="Tên chương mới…"
                      value={newChapterTitle}
                      autoFocus
                      onChange={(e) => setNewChapterTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const t = newChapterTitle.trim();
                          if (t) createChapterMut.mutate({ book_id: selectedBookId, title: t });
                        }
                        if (e.key === 'Escape') { setAddingChapter(false); setNewChapterTitle(''); }
                      }}
                    />
                    <button
                      className="cnt-inline-action cnt-inline-action--save"
                      disabled={createChapterMut.isPending}
                      onClick={() => {
                        const t = newChapterTitle.trim();
                        if (t) createChapterMut.mutate({ book_id: selectedBookId, title: t });
                      }}
                    >
                      <Check size={11} />
                    </button>
                    <button
                      className="cnt-inline-action cnt-inline-action--cancel"
                      onClick={() => { setAddingChapter(false); setNewChapterTitle(''); }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <button
                    className="cnt-add-lesson-btn"
                    style={{ margin: '6px 8px' }}
                    onClick={() => setAddingChapter(true)}
                  >
                    <Plus size={11} />
                    Thêm chương
                  </button>
                )
              )}
            </aside>

            {/* Right content panel */}
            <main className="cnt-panel">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedLesson?.id ?? 'empty'}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  <ContentPanel lesson={selectedLesson} editMode={editMode} />
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminOCRContent;
