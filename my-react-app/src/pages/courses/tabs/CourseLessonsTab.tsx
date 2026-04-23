import type { DragEndEvent } from '@dnd-kit/core';
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  Paperclip,
  Pencil,
  PlayCircle,
  Plus,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../../../context/ToastContext';
import {
  useAddMaterial,
  useCourseLessons,
  useCreateSection,
  useCustomCourseSections,
  useDeleteCourseLesson,
  useDeleteSection,
  useRemoveMaterial,
  useReorderCourseLessons,
  useUpdateCourseLesson,
  useUpdateSection,
} from '../../../hooks/useCourses';
import { CourseService } from '../../../services/api/course.service';
import { LessonSlideService } from '../../../services/api/lesson-slide.service';
import { VideoUploadService } from '../../../services/api/videoUpload.service';
import '../../../styles/module-refactor.css';
import './course-detail-tabs.css';
import './CourseLessonsTab.css';
import type { CourseLessonResponse, CourseResponse } from '../../../types';
import type { ChapterBySubject, LessonByChapter } from '../../../types/lessonSlide.types';

interface CourseLessonsTabProps {
  courseId: string;
  course: CourseResponse;
}

type CltDeleteTarget =
  | { k: 'lesson'; lessonId: string }
  | { k: 'material'; lessonId: string; materialId: string; name: string }
  | { k: 'section'; sectionId: string; title: string };

function CltConfirmDeleteModal({
  onClose,
  onConfirm,
  title,
  message,
  extraHint,
  confirmLabel,
  danger,
  isPending,
}: {
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  extraHint?: string;
  confirmLabel: string;
  danger?: boolean;
  isPending?: boolean;
}) {
  return (
    <div className="clt-warm-overlay" role="presentation" onClick={onClose}>
      <div
        className="clt-warm-dialog clt-warm-dialog--sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clt-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="clt-warm-dialog__header">
          <div>
            <h3 id="clt-confirm-title">{title}</h3>
          </div>
          <button type="button" className="clt-warm-icon-btn" onClick={onClose} disabled={isPending}>
            <X size={18} aria-hidden />
          </button>
        </div>
        <div className="clt-warm-dialog__body">
          <p className="clt-warm-confirm-text">{message}</p>
          {extraHint ? <p className="clt-warm-confirm-hint">{extraHint}</p> : null}
        </div>
        <div className="clt-warm-dialog__footer">
          <button type="button" className="btn secondary" onClick={onClose} disabled={isPending}>
            Hủy
          </button>
          <button
            type="button"
            className={danger ? 'btn danger' : 'btn cdt-btn-primary'}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function CltTextSectionModal({
  open,
  onClose,
  title,
  description,
  label,
  value,
  onChange,
  onSubmit,
  submitLabel,
  isPending,
  placeholder,
  submitDisabled,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  submitLabel: string;
  isPending: boolean;
  placeholder?: string;
  submitDisabled?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="clt-warm-overlay" role="presentation" onClick={onClose}>
      <div
        className="clt-warm-dialog clt-warm-dialog--sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clt-text-section-title"
        lang="vi"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="clt-warm-dialog__header">
          <div>
            <h3 id="clt-text-section-title">{title}</h3>
            {description ? <p>{description}</p> : null}
          </div>
          <button type="button" className="clt-warm-icon-btn" onClick={onClose} disabled={isPending}>
            <X size={18} aria-hidden />
          </button>
        </div>
        <div className="clt-warm-dialog__body">
          <label className="clt-warm-form-field">
            <span className="clt-warm-form-label">{label}</span>
            <input
              className="clt-warm-input"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              disabled={isPending}
              autoFocus
            />
          </label>
        </div>
        <div className="clt-warm-dialog__footer">
          <button type="button" className="btn secondary" onClick={onClose} disabled={isPending}>
            Hủy
          </button>
          <button
            type="button"
            className="btn cdt-btn-primary"
            onClick={onSubmit}
            disabled={isPending || submitDisabled}
          >
            {isPending ? 'Đang lưu...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Upload Modal Component
function UploadVideoModal({
  courseId,
  course,
  onClose,
  onSuccess,
  existingLessons,
}: {
  courseId: string;
  course: CourseResponse;
  onClose: () => void;
  onSuccess: () => void;
  existingLessons: CourseLessonResponse[];
}) {
  const provider = course.provider;
  const [chapters, setChapters] = useState<ChapterBySubject[]>([]);
  const [lessons, setLessons] = useState<LessonByChapter[]>([]);
  const [chapterId, setChapterId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [orderIndex, setOrderIndex] = useState(1);
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [chunkInfo, setChunkInfo] = useState('');
  const [error, setError] = useState('');

  const [sections, setSections] = useState<any[]>([]); // for CUSTOM
  const [sectionId, setSectionId] = useState(''); // for CUSTOM
  const [customTitle, setCustomTitle] = useState(''); // for CUSTOM
  const [customDescription, setCustomDescription] = useState(''); // for CUSTOM
  const [durationSeconds, setDurationSeconds] = useState<number | undefined>(undefined);
  const [loadingSections, setLoadingSections] = useState(false);

  useEffect(() => {
    const id = globalThis.setTimeout(() => {
      if (provider === 'MINISTRY' && course.subjectId) {
        setLoadingChapters(true);
        LessonSlideService.getChaptersBySubject(course.subjectId)
          .then((r) => {
            setChapters(r.result || []);
            setError('');
          })
          .catch(() => setError('Không thể tải danh sách chương'))
          .finally(() => setLoadingChapters(false));
      } else if (provider === 'CUSTOM') {
        setLoadingSections(true);
        CourseService.listSections(courseId)
          .then((res) => {
            setSections(res.result || []);
            setError('');
          })
          .catch(() => setError('Không thể tải danh sách phần'))
          .finally(() => setLoadingSections(false));
      } else {
        setChapters([]);
        setSections([]);
      }
    }, 0);
    return () => globalThis.clearTimeout(id);
  }, [provider, course.subjectId, courseId]);

  // Auto-calculate orderIndex
  useEffect(() => {
    if (provider === 'CUSTOM') {
      if (sectionId) {
        const count = existingLessons.filter((l) => l.sectionId === sectionId).length;
        setOrderIndex(count + 1);
      }
    } else {
      setOrderIndex(existingLessons.length + 1);
    }
  }, [sectionId, existingLessons, provider]);

  const handleChapterChange = async (val: string) => {
    setChapterId(val);
    setLessonId('');
    setLessons([]);
    if (!val) return;
    setLoadingLessons(true);
    try {
      const r = await LessonSlideService.getLessonsByChapter(val);
      setLessons(r.result || []);
    } finally {
      setLoadingLessons(false);
    }
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.round(video.duration));
      };
      video.onerror = () => {
        resolve(0);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (!videoTitle) setVideoTitle(f.name.replace(/\.[^.]+$/, ''));

    // Auto-extract duration
    const dur = await getVideoDuration(f);
    if (dur > 0) setDurationSeconds(dur);
  };

  const handleUpload = async () => {
    if (provider === 'MINISTRY' && (!file || !lessonId)) return;
    if (provider === 'CUSTOM' && (!file || !sectionId || !customTitle)) return;

    setUploading(true);
    setError('');
    setProgress(0);
    try {
      const extraData =
        provider === 'MINISTRY'
          ? { lessonId, videoTitle, orderIndex, isFreePreview, durationSeconds }
          : {
              sectionId,
              customTitle,
              customDescription,
              videoTitle,
              orderIndex,
              isFreePreview,
              durationSeconds,
            };

      await VideoUploadService.uploadVideo(courseId, file!, extraData, {
        onProgress: (pct) => setProgress(pct),
        onChunkComplete: (done, total) => setChunkInfo(`Đã upload ${done}/${total} phần`),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload thất bại');
    } finally {
      setUploading(false);
    }
  };

  const fileSizeMB = file ? (file.size / 1024 / 1024).toFixed(1) : null;

  return (
    <div className="clt-warm-overlay" role="presentation" onClick={onClose}>
      <div
        className="clt-warm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clt-upload-lesson-title"
        lang="vi"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="clt-warm-dialog__header">
          <div>
            <h3 id="clt-upload-lesson-title">Thêm bài học video</h3>
            <p>
              Chọn bài học (hoặc phần nội dung) và tải lên video giảng dạy.
            </p>
          </div>
          <button
            type="button"
            className="clt-warm-icon-btn"
            onClick={onClose}
            disabled={uploading}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="clt-warm-dialog__body">
          {provider === 'MINISTRY' ? (
            <>
              <label className="clt-warm-form-field">
                <span className="clt-warm-form-label">
                  Chương <span className="clt-warm-req">*</span>
                </span>
                <select
                  className="clt-warm-select"
                  value={chapterId}
                  onChange={(e) => void handleChapterChange(e.target.value)}
                  disabled={loadingChapters || uploading}
                >
                  <option value="">{loadingChapters ? 'Đang tải...' : '-- Chọn chương --'}</option>
                  {chapters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.orderIndex}. {c.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="clt-warm-form-field">
                <span className="clt-warm-form-label">
                  Bài học <span className="clt-warm-req">*</span>
                </span>
                <select
                  className="clt-warm-select"
                  value={lessonId}
                  onChange={(e) => setLessonId(e.target.value)}
                  disabled={!chapterId || loadingLessons || uploading}
                >
                  <option value="">
                    {!chapterId
                      ? 'Chọn chương trước'
                      : loadingLessons
                        ? 'Đang tải...'
                        : '-- Chọn bài học --'}
                  </option>
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.orderIndex}. {l.title}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <>
              <label className="clt-warm-form-field">
                <span className="clt-warm-form-label">
                  Phần nội dung <span className="clt-warm-req">*</span>
                </span>
                <select
                  className="clt-warm-select"
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  disabled={uploading || loadingSections}
                >
                  <option value="">{loadingSections ? 'Đang tải...' : '-- Chọn phần --'}</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      Phần {s.orderIndex}: {s.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="clt-warm-form-field">
                <span className="clt-warm-form-label">
                  Tên bài học <span className="clt-warm-req">*</span>
                </span>
                <input
                  className="clt-warm-input"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Ví dụ: Bài 1 — Giới thiệu"
                  disabled={uploading}
                  required
                />
              </label>

              <label className="clt-warm-form-field">
                <span className="clt-warm-form-label">Mô tả ngắn (tuỳ chọn)</span>
                <textarea
                  className="clt-warm-textarea"
                  rows={2}
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Ghi chú ngắn về nội dung bài học..."
                  disabled={uploading}
                />
              </label>
            </>
          )}

          <label className="clt-warm-form-field">
            <span className="clt-warm-form-label">
              File video <span className="clt-warm-req">*</span>
            </span>
            <div
              className="clt-warm-dropzone"
              onClick={() => document.getElementById('video-input')?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  document.getElementById('video-input')?.click();
                }
              }}
              role="button"
              tabIndex={0}
            >
              <input
                id="video-input"
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={(e) => void handleFileChange(e)}
                disabled={uploading}
              />
              {file ? (
                <div>
                  <div className="clt-warm-dropzone__file">{file.name}</div>
                  <div className="clt-warm-muted">
                    {fileSizeMB} MB
                    {durationSeconds
                      ? ` · ${Math.floor(durationSeconds / 60)} phút ${durationSeconds % 60} giây`
                      : ''}
                  </div>
                </div>
              ) : (
                <div className="clt-warm-muted">
                  <Video size={32} style={{ marginBottom: 8, opacity: 0.55 }} aria-hidden />
                  <p style={{ margin: 0 }}>Kéo thả hoặc chọn file video</p>
                  <p style={{ fontSize: '0.75rem', marginTop: 6, marginBottom: 0 }}>
                    MP4, WebM hoặc OGG
                  </p>
                </div>
              )}
            </div>
          </label>

          <label className="clt-warm-form-field">
            <span className="clt-warm-form-label">Tiêu đề video</span>
            <input
              className="clt-warm-input"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Tên hiển thị khi học viên xem bài"
              disabled={uploading}
            />
          </label>

          <div className="row" style={{ gap: '1rem' }}>
            <label className="row" style={{ alignItems: 'center', gap: 8, paddingTop: 4 }}>
              <input
                type="checkbox"
                checked={isFreePreview}
                onChange={(e) => setIsFreePreview(e.target.checked)}
                disabled={uploading}
              />
              <span style={{ fontSize: '0.9rem' }}>Cho phép xem thử miễn phí</span>
            </label>
          </div>

          {uploading && (
            <div style={{ marginTop: '0.5rem' }}>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Đang tải lên...</span>
                <span style={{ fontSize: '0.88rem', color: '#b45435', fontWeight: 600 }}>
                  {progress}%
                </span>
              </div>
              <div className="clt-warm-progress">
                <div
                  className="clt-warm-progress__bar"
                  style={{ transform: `scaleX(${progress / 100})` }}
                />
              </div>
              {chunkInfo ? (
                <p className="clt-warm-muted" style={{ fontSize: '0.78rem', marginTop: 6 }}>
                  {chunkInfo}
                </p>
              ) : null}
            </div>
          )}

          {error ? <p className="clt-warm-err">{error}</p> : null}
        </div>

        <div className="clt-warm-dialog__footer">
          <button type="button" className="btn secondary" onClick={onClose} disabled={uploading}>
            Hủy
          </button>
          <button
            type="button"
            className="btn cdt-btn-primary"
            disabled={
              uploading ||
              !file ||
              (provider === 'MINISTRY' && !lessonId) ||
              (provider === 'CUSTOM' && (!sectionId || !customTitle))
            }
            onClick={() => void handleUpload()}
          >
            {uploading ? `Đang tải ${progress}%...` : 'Tải video lên'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit Modal Component
function EditLessonModal({
  courseId,
  lesson,
  onClose,
  onSuccess,
}: {
  courseId: string;
  lesson: CourseLessonResponse;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [videoTitle, setVideoTitle] = useState(lesson.videoTitle || '');
  const [orderIndex, setOrderIndex] = useState(lesson.orderIndex || 1);
  const [isFreePreview, setIsFreePreview] = useState(lesson.isFreePreview);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const updateMutation = useUpdateCourseLesson();

  const handleUpdate = async () => {
    setUpdating(true);
    setError('');
    updateMutation.mutate(
      {
        courseId,
        lessonId: lesson.id,
        request: {
          videoTitle,
          orderIndex,
          isFreePreview,
        },
      },
      {
        onSuccess: () => {
          onSuccess();
          onClose();
        },
        onError: (err: any) => {
          setError(err?.response?.data?.message || 'Cập nhật thất bại');
          setUpdating(false);
        },
      }
    );
  };

  return (
    <div className="clt-warm-overlay" role="presentation" onClick={onClose}>
      <div
        className="clt-warm-dialog clt-warm-dialog--sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clt-edit-lesson-title"
        lang="vi"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="clt-warm-dialog__header">
          <div>
            <h3 id="clt-edit-lesson-title">Chỉnh sửa bài học</h3>
            <p>Bài: {lesson.lessonTitle}</p>
          </div>
          <button
            type="button"
            className="clt-warm-icon-btn"
            onClick={onClose}
            disabled={updating}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="clt-warm-dialog__body">
          <label className="clt-warm-form-field">
            <span className="clt-warm-form-label">Tiêu đề hiển thị</span>
            <input
              className="clt-warm-input"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Tên hiển thị trên trình phát"
              disabled={updating}
            />
          </label>

          <label className="clt-warm-form-field">
            <span className="clt-warm-form-label">Thứ tự</span>
            <input
              type="number"
              className="clt-warm-input"
              value={orderIndex}
              onChange={(e) => setOrderIndex(parseInt(e.target.value, 10) || 1)}
              disabled={updating}
              min={1}
            />
          </label>

          <div className="row" style={{ gap: '1rem', marginTop: '0.15rem' }}>
            <label className="row" style={{ alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={isFreePreview}
                onChange={(e) => setIsFreePreview(e.target.checked)}
                disabled={updating}
              />
              <span style={{ fontSize: '0.9rem' }}>Cho phép xem thử (không cần đăng ký)</span>
            </label>
          </div>

          {error ? <p className="clt-warm-err" style={{ marginTop: 12 }}>{error}</p> : null}
        </div>

        <div className="clt-warm-dialog__footer">
          <button type="button" className="btn secondary" onClick={onClose} disabled={updating}>
            Hủy
          </button>
          <button
            type="button"
            className="btn cdt-btn-primary"
            disabled={updating}
            onClick={() => void handleUpdate()}
          >
            {updating ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Lesson Row Component
function LessonRow({
  lesson,
  onRequestDeleteLesson,
  onRequestDeleteMaterial,
  onEdit,
  deletePending,
  courseId,
}: {
  courseId: string;
  lesson: CourseLessonResponse;
  onRequestDeleteLesson: () => void;
  onRequestDeleteMaterial: (materialId: string, materialName: string) => void;
  onEdit: () => void;
  deletePending: boolean;
}) {
  const [showMaterials, setShowMaterials] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const addMaterialMutation = useAddMaterial();
  const updateMutation = useUpdateCourseLesson();

  const handleToggleFreePreview = () => {
    updateMutation.mutate({
      courseId,
      lessonId: lesson.id,
      request: {
        isFreePreview: !lesson.isFreePreview,
      },
    });
  };

  const materialsList = useMemo(() => {
    if (!lesson.materials) return [];
    try {
      return JSON.parse(lesson.materials);
    } catch {
      return [];
    }
  }, [lesson.materials]);

  const fmtDuration = (secs?: number | null) => {
    if (!secs) return null;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <>
      <tr>
        <td className="muted">{lesson.orderIndex ?? '—'}</td>
        <td>
          <div style={{ fontWeight: 600 }}>{lesson.lessonTitle ?? '—'}</div>
        </td>
        <td>
          {lesson.videoUrl ? (
            <div className="row" style={{ gap: 6 }}>
              <CheckCircle2 size={14} style={{ color: '#059669' }} />
              <span>{lesson.videoTitle ?? 'Đã upload'}</span>
              <button
                className="btn secondary"
                style={{ padding: '0.2rem 0.45rem', marginLeft: 4 }}
                title="Xem lại video"
                onClick={() => setShowPlayer((p) => !p)}
              >
                <PlayCircle size={13} style={{ color: showPlayer ? '#2563eb' : '#475569' }} />
              </button>
            </div>
          ) : (
            <span className="muted">Chưa có video</span>
          )}
        </td>
        <td>
          {lesson.durationSeconds ? (
            <div className="row" style={{ gap: 4 }}>
              <Clock size={13} />
              <span>{fmtDuration(lesson.durationSeconds)}</span>
            </div>
          ) : (
            <span className="muted">—</span>
          )}
        </td>
        <td
          onClick={handleToggleFreePreview}
          style={{ cursor: updateMutation.isPending ? 'wait' : 'pointer' }}
          title={
            lesson.isFreePreview
              ? 'Click to lock this lesson'
              : 'Click to make this lesson free for preview'
          }
        >
          {lesson.isFreePreview ? (
            <span
              className="badge published"
              style={{ display: 'inline-flex', alignItems: 'center', transition: 'all 0.2s' }}
            >
              <Eye size={11} style={{ marginRight: 4 }} />
              Xem trước
            </span>
          ) : (
            <span
              className="badge draft"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                opacity: 0.7,
                transition: 'all 0.2s',
              }}
            >
              <EyeOff size={11} style={{ marginRight: 4 }} />
              Đăng ký để xem
            </span>
          )}
        </td>
        <td>
          <div
            className={`row ${showMaterials ? 'active' : ''}`}
            style={{
              gap: 6,
              cursor: 'pointer',
              color: materialsList.length > 0 ? '#2563eb' : '#64748b',
            }}
            onClick={() => setShowMaterials(!showMaterials)}
          >
            <Paperclip size={14} />
            <span style={{ fontWeight: materialsList.length > 0 ? 600 : 400 }}>
              {materialsList.length} tài liệu
            </span>
          </div>
        </td>
        <td>
          <div className="row" style={{ gap: 6 }}>
            <button
              className="btn secondary"
              style={{ padding: '0.35rem 0.6rem' }}
              title="Chỉnh sửa"
              onClick={onEdit}
            >
              <Pencil size={13} />
            </button>
            <button
              className="btn danger"
              style={{ padding: '0.35rem 0.6rem' }}
              disabled={deletePending}
              onClick={onRequestDeleteLesson}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </td>
      </tr>
      {showPlayer && lesson.videoUrl && (
        <tr style={{ background: '#f0f7ff' }}>
          <td colSpan={7} style={{ padding: '0.75rem 2rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
              <Video size={14} style={{ color: '#2563eb' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a5f' }}>
                {lesson.videoTitle ?? lesson.lessonTitle ?? 'Video bài học'}
              </span>
              <button
                className="btn secondary"
                style={{ padding: '0.15rem 0.4rem', fontSize: '0.75rem', marginLeft: 'auto' }}
                onClick={() => setShowPlayer(false)}
              >
                Đóng
              </button>
            </div>
            <video
              key={lesson.videoUrl}
              controls
              style={{
                width: '100%',
                maxHeight: '360px',
                borderRadius: '8px',
                background: '#000',
                display: 'block',
              }}
            >
              <source src={lesson.videoUrl} />
              Trình duyệt của bạn không hỗ trợ phát video.
            </video>
          </td>
        </tr>
      )}
      {showMaterials && (
        <tr style={{ background: '#f8fafc' }}>
          <td colSpan={7} style={{ padding: '1rem 2rem' }}>
            <div style={{ boxShadow: 'inset 2px 0 0 #e2e8f0', paddingLeft: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
                  Tài liệu đính kèm
                </h4>
                <label
                  className="btn secondary"
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  <Plus size={12} style={{ marginRight: 4 }} />
                  Tải lên tài liệu
                  <input
                    type="file"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        addMaterialMutation.mutate({ courseId, lessonId: lesson.id, file });
                      }
                    }}
                  />
                </label>
              </div>

              {materialsList.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {materialsList.map((m: any) => (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'white',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div className="row" style={{ gap: 8 }}>
                        <FileText size={14} style={{ color: '#64748b' }} />
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '0.85rem', color: '#1e293b', textDecoration: 'none' }}
                          onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                          onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
                        >
                          {m.name}
                        </a>
                        <span className="muted" style={{ fontSize: '0.75rem' }}>
                          ({(m.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        className="btn-icon"
                        style={{ color: '#ef4444' }}
                        onClick={() => onRequestDeleteMaterial(m.id, m.name)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted" style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>
                  Chưa có tài liệu nào.
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function SortableLessonChip({ lesson }: { lesson: CourseLessonResponse }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="data-card" {...attributes} {...listeners}>
      <div className="row" style={{ gap: 10, alignItems: 'center' }}>
        <GripVertical size={16} style={{ color: '#94a3b8', cursor: 'grab' }} />
        <span style={{ minWidth: 28, fontWeight: 700, color: '#2563eb' }}>
          #{lesson.orderIndex ?? '-'}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{lesson.lessonTitle ?? 'Untitled lesson'}</div>
          <div className="muted" style={{ fontSize: '0.8rem' }}>
            {lesson.videoTitle || 'No video title'}
          </div>
        </div>
        {lesson.isFreePreview && <span className="badge published">Xem trước</span>}
      </div>
    </div>
  );
}

function LessonReorderStrip({
  lessons,
  title,
  disabled,
  onReordered,
}: {
  lessons: CourseLessonResponse[];
  title: string;
  disabled?: boolean;
  onReordered: (ordered: CourseLessonResponse[]) => void;
}) {
  const [items, setItems] = useState<CourseLessonResponse[]>(lessons);

  useEffect(() => {
    setItems(lessons);
  }, [lessons]);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    if (disabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((l) => l.id === String(active.id));
    const newIndex = items.findIndex((l) => l.id === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const moved = arrayMove(items, oldIndex, newIndex).map((lesson, idx) => ({
      ...lesson,
      orderIndex: idx + 1,
    }));
    setItems(moved);
    onReordered(moved);
  };

  return (
    <div
      className="data-card"
      style={{
        marginBottom: '1rem',
        opacity: disabled ? 0.7 : 1,
        transition: 'opacity 0.2s ease',
      }}
    >
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <h4 style={{ margin: 0 }}>{title}</h4>
        <span className="muted" style={{ fontSize: '0.82rem' }}>
          {disabled ? 'Đang lưu thứ tự...' : 'Kéo thả để đổi thứ tự'}
        </span>
      </div>
      <div style={{ pointerEvents: disabled ? 'none' : 'auto' }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {items.map((lesson) => (
                <SortableLessonChip key={lesson.id} lesson={lesson} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
      {disabled && (
        <div className="muted" style={{ marginTop: '0.6rem', fontSize: '0.78rem' }}>
          Vui lòng chờ lưu xong trước khi tiếp tục kéo thả.
        </div>
      )}
    </div>
  );
}

// Main Component
const CourseLessonsTab: React.FC<CourseLessonsTabProps> = ({ courseId, course }) => {
  const { showToast } = useToast();
  const [showUpload, setShowUpload] = useState(false);
  const [editingLesson, setEditingLesson] = useState<CourseLessonResponse | null>(null);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CltDeleteTarget | null>(null);
  const [renameTarget, setRenameTarget] = useState<null | { id: string; value: string }>(null);

  const { data: lessonsData, isLoading, refetch } = useCourseLessons(courseId);
  const { data: sectionsData } = useCustomCourseSections(courseId);
  const deleteMutation = useDeleteCourseLesson();
  const reorderMutation = useReorderCourseLessons();
  const removeMaterialMutation = useRemoveMaterial();

  const createSectionMutation = useCreateSection();
  const updateSectionMutation = useUpdateSection();
  const deleteSectionMutation = useDeleteSection();

  const lessons: CourseLessonResponse[] = lessonsData?.result ?? [];
  const sections = sectionsData?.result ?? [];

  const persistReorder = (orderedLessons: CourseLessonResponse[]) => {
    reorderMutation.mutate(
      {
        courseId,
        data: {
          orders: orderedLessons.map((lesson, idx) => ({
            lessonId: lesson.id,
            orderIndex: idx + 1,
          })),
        },
      },
      {
        onSuccess: () => {
          showToast({
            type: 'success',
            message: 'Đã lưu thứ tự bài học.',
            duration: 1500,
          });
        },
        onError: () => {
          showToast({
            type: 'error',
            message: 'Không thể lưu thứ tự. Đã khôi phục dữ liệu từ máy chủ.',
          });
          void refetch();
        },
      }
    );
  };

  const deleteBusy =
    deleteMutation.isPending || removeMaterialMutation.isPending || deleteSectionMutation.isPending;

  const submitAddSection = () => {
    const t = newSectionTitle.trim();
    if (!t) {
      showToast({ type: 'error', message: 'Vui lòng nhập tên phần.' });
      return;
    }
    createSectionMutation.mutate(
      { courseId, data: { title: t, orderIndex: sections.length + 1 } },
      {
        onSuccess: () => {
          showToast({ type: 'success', message: 'Đã tạo phần mới.' });
          setAddSectionOpen(false);
          setNewSectionTitle('');
        },
        onError: () => {
          showToast({ type: 'error', message: 'Không thể tạo phần.' });
        },
      }
    );
  };

  const submitRenameSection = () => {
    if (!renameTarget) return;
    const t = renameTarget.value.trim();
    if (!t) {
      showToast({ type: 'error', message: 'Tên phần không được để trống.' });
      return;
    }
    updateSectionMutation.mutate(
      { courseId, sectionId: renameTarget.id, data: { title: t } },
      {
        onSuccess: () => {
          showToast({ type: 'success', message: 'Đã cập nhật tên phần.' });
          setRenameTarget(null);
        },
        onError: () => {
          showToast({ type: 'error', message: 'Không thể đổi tên phần.' });
        },
      }
    );
  };

  return (
    <div className="course-detail-tab lessons-tab">
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <div className="stat-icon-wrap" aria-hidden>
            <FileText size={20} />
          </div>
          <div className="stat-card__text">
            <h3>{lessons.length}</h3>
            <p>Tổng bài học</p>
            <span className="stat-card__sub">đã upload</span>
          </div>
        </div>
        <div className="stat-card stat-amber">
          <div className="stat-icon-wrap" aria-hidden>
            <Eye size={20} />
          </div>
          <div className="stat-card__text">
            <h3>{lessons.filter((l) => l.isFreePreview).length}</h3>
            <p>Xem thử miễn phí</p>
            <span className="stat-card__sub">bài học</span>
          </div>
        </div>
        <div className="stat-card stat-emerald">
          <div className="stat-icon-wrap" aria-hidden>
            <Video size={20} />
          </div>
          <div className="stat-card__text">
            <h3>{lessons.filter((l) => l.videoUrl).length}</h3>
            <p>Có video</p>
            <span className="stat-card__sub">bài học</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="cdt-toolbar">
        {course.provider === 'CUSTOM' && (
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              setNewSectionTitle('');
              setAddSectionOpen(true);
            }}
          >
            <Plus size={14} />
            Thêm phần
          </button>
        )}
        <button type="button" className="btn cdt-btn-primary" onClick={() => setShowUpload(true)}>
          <Plus size={14} />
          Thêm bài học
        </button>
      </div>

      {/* Loading */}
      {isLoading && <div className="cdt-loading">Đang tải danh sách bài học...</div>}

      {/* Empty State */}
      {!isLoading && lessons.length === 0 && (
        <div className="cdt-empty">
          <Video size={40} strokeWidth={1.5} style={{ marginBottom: 12 }} />
          <p>Chưa có bài học nào. Hãy thêm bài học đầu tiên!</p>
          <button type="button" className="btn cdt-btn-primary" style={{ marginTop: 12 }} onClick={() => setShowUpload(true)}>
            <Plus size={14} />
            Thêm bài học
          </button>
        </div>
      )}

      {/* Lesson Table */}
      {!isLoading && lessons.length > 0 && course.provider === 'MINISTRY' && (
        <>
          <LessonReorderStrip
            title="Sắp xếp bài học"
            lessons={[...lessons].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))}
            disabled={reorderMutation.isPending}
            onReordered={persistReorder}
          />
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Bài học</th>
                  <th>Tiêu đề video</th>
                  <th>Thời lượng</th>
                  <th>Xem thử</th>
                  <th>Tài liệu</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {[...lessons]
                  .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                  .map((lesson) => (
                    <LessonRow
                      key={lesson.id}
                      courseId={courseId}
                      lesson={lesson}
                      onEdit={() => setEditingLesson(lesson)}
                      onRequestDeleteLesson={() => setDeleteTarget({ k: 'lesson', lessonId: lesson.id })}
                      onRequestDeleteMaterial={(materialId, name) =>
                        setDeleteTarget({ k: 'material', lessonId: lesson.id, materialId, name })
                      }
                      deletePending={deleteMutation.isPending}
                    />
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {editingLesson && (
        <EditLessonModal
          courseId={courseId}
          lesson={editingLesson}
          onClose={() => setEditingLesson(null)}
          onSuccess={() => void refetch()}
        />
      )}

      {/* Custom Sections and Lessons */}
      {!isLoading && course.provider === 'CUSTOM' && (
        <div
          className="sections-container"
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          {sections
            .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
            .map((section) => {
              const sectionLessons = lessons
                .filter((l) => l.sectionId === section.id)
                .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
              return (
                <div key={section.id} className="data-card section-card cdt-section-card">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem',
                    }}
                  >
                    <h3 className="cdt-section-title">
                      Phần {section.orderIndex}: {section.title}
                    </h3>
                    <div className="row" style={{ gap: '0.5rem' }}>
                      <button
                        className="btn secondary"
                        style={{ padding: '0.35rem 0.6rem' }}
                        title="Chỉnh sửa phần"
                        onClick={() => setRenameTarget({ id: section.id, value: section.title ?? '' })}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        className="btn danger"
                        style={{ padding: '0.35rem 0.6rem' }}
                        title="Xóa phần"
                        onClick={() =>
                          setDeleteTarget({ k: 'section', sectionId: section.id, title: section.title })
                        }
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {sectionLessons.length > 1 && (
                    <LessonReorderStrip
                      title="Sắp xếp bài học trong phần"
                      lessons={sectionLessons}
                      disabled={reorderMutation.isPending}
                      onReordered={persistReorder}
                    />
                  )}

                  {sectionLessons.length > 0 ? (
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Bài học</th>
                            <th>Tiêu đề video</th>
                            <th>Thời lượng</th>
                            <th>Xem thử</th>
                            <th>Tài liệu</th>
                            <th>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sectionLessons.map((lesson) => (
                            <LessonRow
                              key={lesson.id}
                              courseId={courseId}
                              lesson={lesson}
                              onEdit={() => setEditingLesson(lesson)}
                              onRequestDeleteLesson={() =>
                                setDeleteTarget({ k: 'lesson', lessonId: lesson.id })
                              }
                              onRequestDeleteMaterial={(materialId, name) =>
                                setDeleteTarget({
                                  k: 'material',
                                  lessonId: lesson.id,
                                  materialId,
                                  name,
                                })
                              }
                              deletePending={deleteMutation.isPending}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="cdt-empty" style={{ padding: '1.5rem' }}>
                      <p style={{ margin: 0 }}>
                        Chưa có bài học nào trong phần này.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          {sections.length === 0 && (
            <div className="cdt-empty" style={{ padding: '2rem' }}>
              <p style={{ margin: 0 }}>
                Khóa học này chưa có phần nào. Hãy thêm phần trước khi upload video.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && course && (
        <UploadVideoModal
          courseId={courseId}
          course={course}
          existingLessons={lessons}
          onClose={() => setShowUpload(false)}
          onSuccess={() => void refetch()}
        />
      )}

      {deleteTarget && (
        <CltConfirmDeleteModal
          title={
            deleteTarget.k === 'lesson'
              ? 'Xóa bài học?'
              : deleteTarget.k === 'material'
                ? 'Xóa tài liệu?'
                : 'Xóa phần nội dung?'
          }
          message={
            deleteTarget.k === 'lesson'
              ? 'Bài học sẽ bị gỡ khỏi khóa học. Bạn có chắc chắn muốn xóa?'
              : deleteTarget.k === 'material'
                ? `Bạn sắp xóa tài liệu «${deleteTarget.name}».`
                : `Bạn sắp xóa phần «${deleteTarget.title}».`
          }
          extraHint={
            deleteTarget.k === 'section'
              ? 'Các bài học thuộc phần này sẽ không bị xóa theo cấu hình hiện tại.'
              : deleteTarget.k === 'material'
                ? 'Thao tác này không thể hoàn tác sau khi xóa.'
                : undefined
          }
          confirmLabel={
            deleteTarget.k === 'lesson'
              ? 'Xóa bài học'
              : deleteTarget.k === 'material'
                ? 'Xóa tài liệu'
                : 'Xóa phần'
          }
          danger
          isPending={deleteBusy}
          onClose={() => {
            if (!deleteBusy) setDeleteTarget(null);
          }}
          onConfirm={() => {
            const t = deleteTarget;
            if (t.k === 'lesson') {
              deleteMutation.mutate(
                { courseId, lessonId: t.lessonId },
                {
                  onSuccess: () => {
                    setDeleteTarget(null);
                    void refetch();
                    showToast({ type: 'success', message: 'Đã xóa bài học.' });
                  },
                  onError: () => {
                    showToast({ type: 'error', message: 'Không thể xóa bài học.' });
                  },
                }
              );
            } else if (t.k === 'material') {
              removeMaterialMutation.mutate(
                { courseId, lessonId: t.lessonId, materialId: t.materialId },
                {
                  onSuccess: () => {
                    setDeleteTarget(null);
                    void refetch();
                    showToast({ type: 'success', message: 'Đã xóa tài liệu.' });
                  },
                  onError: () => {
                    showToast({ type: 'error', message: 'Không thể xóa tài liệu.' });
                  },
                }
              );
            } else {
              deleteSectionMutation.mutate(
                { courseId, sectionId: t.sectionId },
                {
                  onSuccess: () => {
                    setDeleteTarget(null);
                    void refetch();
                    showToast({ type: 'success', message: 'Đã xóa phần.' });
                  },
                  onError: () => {
                    showToast({ type: 'error', message: 'Không thể xóa phần.' });
                  },
                }
              );
            }
          }}
        />
      )}

      <CltTextSectionModal
        open={addSectionOpen}
        onClose={() => {
          if (createSectionMutation.isPending) return;
          setAddSectionOpen(false);
        }}
        title="Thêm phần mới"
        description="Mỗi phần nhóm các bài học liên quan, giúp lộ trình dễ theo dõi."
        label="Tên phần"
        value={newSectionTitle}
        onChange={setNewSectionTitle}
        placeholder="Ví dụ: Phần 1 — Nền tảng"
        submitLabel="Tạo phần"
        isPending={createSectionMutation.isPending}
        submitDisabled={!newSectionTitle.trim()}
        onSubmit={submitAddSection}
      />

      {renameTarget && (
        <CltTextSectionModal
          open
          onClose={() => {
            if (updateSectionMutation.isPending) return;
            setRenameTarget(null);
          }}
          title="Đổi tên phần"
          label="Tên phần"
          value={renameTarget.value}
          onChange={(v) => setRenameTarget((prev) => (prev ? { ...prev, value: v } : prev))}
          placeholder="Nhập tên phần"
          submitLabel="Lưu tên"
          isPending={updateSectionMutation.isPending}
          submitDisabled={!renameTarget.value.trim()}
          onSubmit={submitRenameSection}
        />
      )}
    </div>
  );
};

export default CourseLessonsTab;
