import type { DragEndEvent } from '@dnd-kit/core';
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  ChevronDown,
  Clock,
  Eye,
  FileText,
  GripVertical,
  Layout,
  Paperclip,
  Pencil,
  Play,
  Plus,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { UI_TEXT } from '../../../constants/uiText';
import { useToast } from '../../../context/ToastContext';
import {
  useAddMaterial,
  useCourseDetail,
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
import { useChaptersBySubject } from '../../../hooks/useChapters';
import { AuthService } from '../../../services/api/auth.service';
import { CourseService } from '../../../services/api/course.service';
import { LessonSlideService } from '../../../services/api/lesson-slide.service';
import { VideoUploadService } from '../../../services/api/videoUpload.service';
import '../../../styles/module-refactor.css';
import type { CourseLessonResponse, CourseResponse } from '../../../types';
import type { ChapterBySubject, LessonByChapter } from '../../../types/lessonSlide.types';
import { extractChapterNumber, sortCurriculumGroups } from '../../../utils/curriculum';
import '../StudentCourses.css';
import './course-detail-tabs.css';
import './CourseLessonsTab.css';

type LessonMaterial = {
  id?: string;
  name?: string;
  url?: string;
  size?: number;
  key?: string;
};

const toSafeMaterial = (raw: any): LessonMaterial | null => {
  if (!raw || typeof raw !== 'object') return null;

  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;
  const name =
    (typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : undefined) ||
    (typeof raw.fileName === 'string' && raw.fileName.trim() ? raw.fileName.trim() : undefined);
  const key = typeof raw.key === 'string' && raw.key.trim() ? raw.key.trim() : undefined;

  const rawUrl = typeof raw.url === 'string' ? raw.url.trim() : '';
  const hasAbsoluteUrl = /^https?:\/\//i.test(rawUrl);
  const url = hasAbsoluteUrl ? rawUrl : undefined;
  const size = typeof raw.size === 'number' && Number.isFinite(raw.size) ? raw.size : undefined;

  if (!id && !url) {
    return null;
  }

  return { id, name, key, url, size };
};

const parseLessonMaterials = (materials?: string | null): LessonMaterial[] => {
  if (!materials) return [];

  try {
    const parsed = JSON.parse(materials);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(toSafeMaterial).filter((item): item is LessonMaterial => Boolean(item));
  } catch {
    return [];
  }
};

const triggerBlobDownload = (blob: Blob, filename?: string) => {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  if (filename) {
    link.download = filename;
  }
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};

// Inline Video Player Component
const InlinePlayer: React.FC<{
  courseId: string;
  courseLessonId: string;
  title: string;
  initialTime?: number;
  onTimeUpdate?: (time: number) => void;
  onLessonComplete?: () => void;
}> = ({ courseId, courseLessonId, title, initialTime = 0, onTimeUpdate, onLessonComplete }) => {
  const videoUrlQuery = useQuery({
    queryKey: ['course-lesson-video', courseId, courseLessonId],
    queryFn: () => VideoUploadService.getVideoUrl(courseId, courseLessonId),
    staleTime: 5 * 60_000,
    enabled: !!courseId && !!courseLessonId,
  });
  const videoUrl = videoUrlQuery.data?.result ?? null;
  const loading = videoUrlQuery.isLoading || videoUrlQuery.isFetching;
  const error = videoUrlQuery.error instanceof Error ? videoUrlQuery.error.message : '';

  return (
    <div style={{ background: '#000', borderRadius: 12, overflow: 'hidden', width: '100%' }}>
      <div
        style={{
          aspectRatio: '16/9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {loading && <p style={{ color: '#94a3b8' }}>Đang tải video...</p>}
        {error && <p style={{ color: '#f87171' }}>{error}</p>}
        {videoUrl && !loading && (
          <video
            key={videoUrl}
            src={videoUrl}
            controls
            autoPlay
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onLoadedMetadata={(e) => {
              if (initialTime > 0) {
                (e.target as HTMLVideoElement).currentTime = initialTime;
              }
            }}
            onTimeUpdate={(e) => {
              if (onTimeUpdate) {
                onTimeUpdate((e.target as HTMLVideoElement).currentTime);
              }
            }}
            onEnded={onLessonComplete}
          />
        )}
      </div>
      <div style={{ padding: '1rem', background: '#faf9f5', borderBottom: '1px solid #f0eee6' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--mod-ink)' }}>
          {title}
        </h3>
      </div>
    </div>
  );
};

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
    <div className="clt-modal-layer" role="presentation" onClick={onClose}>
      <div
        className="clt-modal-card clt-modal-card--sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clt-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="clt-modal-header">
          <div>
            <h3 id="clt-confirm-title">{title}</h3>
          </div>
          <button type="button" className="clt-icon-btn" onClick={onClose} disabled={isPending}>
            <X size={18} aria-hidden />
          </button>
        </div>
        <div className="clt-modal-body">
          <p className="clt-muted">{message}</p>
          {extraHint ? <p className="clt-muted">{extraHint}</p> : null}
        </div>
        <div className="clt-modal-footer">
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
    <div className="clt-modal-layer" role="presentation" onClick={onClose}>
      <div
        className="clt-modal-card clt-modal-card--sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clt-text-section-title"
        lang="vi"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="clt-modal-header">
          <div>
            <h3 id="clt-text-section-title">{title}</h3>
            {description ? <p>{description}</p> : null}
          </div>
          <button type="button" className="clt-icon-btn" onClick={onClose} disabled={isPending}>
            <X size={18} aria-hidden />
          </button>
        </div>
        <div className="clt-modal-body">
          <label className="clt-form-field">
            <span className="clt-form-label">{label}</span>
            <input
              className="clt-input"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              disabled={isPending}
              autoFocus
            />
          </label>
        </div>
        <div className="clt-modal-footer">
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
  const [chapterId, setChapterId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [orderIndex, setOrderIndex] = useState(1);
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [chunkInfo, setChunkInfo] = useState('');
  const [error, setError] = useState('');

  const [sectionId, setSectionId] = useState(''); // for CUSTOM
  const [customTitle, setCustomTitle] = useState(''); // for CUSTOM
  const [customDescription, setCustomDescription] = useState(''); // for CUSTOM
  const [durationSeconds, setDurationSeconds] = useState<number | undefined>(undefined);
  const chaptersQuery = useQuery({
    queryKey: ['lesson-slide', 'chapters-by-subject', course.subjectId, 'course-lessons-tab'],
    queryFn: () => LessonSlideService.getChaptersBySubject(course.subjectId as string),
    enabled: provider === 'MINISTRY' && !!course.subjectId,
    staleTime: 5 * 60_000,
  });
  const lessonsQuery = useQuery({
    queryKey: ['lesson-slide', 'lessons-by-chapter', chapterId, 'course-lessons-tab'],
    queryFn: () => LessonSlideService.getLessonsByChapter(chapterId),
    enabled: provider === 'MINISTRY' && !!chapterId,
    staleTime: 5 * 60_000,
  });
  const sectionsQuery = useQuery({
    queryKey: ['course-sections', courseId, 'course-lessons-tab'],
    queryFn: () => CourseService.listSections(courseId),
    enabled: provider === 'CUSTOM',
    staleTime: 30_000,
  });
  const chapters: ChapterBySubject[] = chaptersQuery.data?.result || [];
  const lessons: LessonByChapter[] = lessonsQuery.data?.result || [];
  const loadingChapters = chaptersQuery.isLoading || chaptersQuery.isFetching;
  const loadingLessons = lessonsQuery.isLoading || lessonsQuery.isFetching;
  const loadingSections = sectionsQuery.isLoading || sectionsQuery.isFetching;
  const sectionOptions = useMemo(() => sectionsQuery.data?.result || [], [sectionsQuery.data]);

  useEffect(() => {
    if (chaptersQuery.error instanceof Error) {
      setError('Không thể tải danh sách chương');
    }
  }, [chaptersQuery.error]);

  useEffect(() => {
    if (sectionsQuery.error instanceof Error) {
      setError('Không thể tải danh sách phần');
    }
  }, [sectionsQuery.error]);

  // Auto-calculate orderIndex
  useEffect(() => {
    if (provider === 'CUSTOM') {
      if (sectionId) {
        const count = existingLessons.filter((l) => l.sectionId === sectionId).length;
        setOrderIndex(count + 1);
      }
    } else {
      if (chapterId) {
        const countInChapter = existingLessons.filter((l) => l.chapterId === chapterId).length;
        setOrderIndex(countInChapter + 1);
      } else {
        setOrderIndex(existingLessons.length + 1);
      }
    }
  }, [sectionId, existingLessons, provider]);

  const handleChapterChange = (val: string) => {
    setChapterId(val);
    setLessonId('');
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
    <div className="clt-modal-layer" role="presentation" onClick={onClose}>
      <div
        className="clt-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clt-upload-lesson-title"
        lang="vi"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="clt-modal-header">
          <div>
            <h3 id="clt-upload-lesson-title">Thêm bài học video</h3>
            <p>Chọn bài học (hoặc phần nội dung) và tải lên video giảng dạy.</p>
          </div>
          <button
            type="button"
            className="clt-icon-btn"
            onClick={onClose}
            disabled={uploading}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="clt-modal-body">
          {provider === 'MINISTRY' ? (
            <>
              <div className="clt-provider-banner ministry">
                <BookOpen size={20} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 0.2rem', fontSize: '0.9rem', fontWeight: 800 }}>
                    Chương trình của Bộ GD&ĐT
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem' }}>
                    Chọn <strong>Chương</strong> và <strong>Bài học</strong> có sẵn theo chuẩn của
                    Bộ Giáo Dục.
                  </p>
                </div>
              </div>
              <label className="clt-form-field">
                <span className="clt-form-label">
                  Chương <span className="clt-req">*</span>
                </span>
                <select
                  className="clt-select"
                  value={chapterId}
                  onChange={(e) => handleChapterChange(e.target.value)}
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

              <label className="clt-form-field">
                <span className="clt-form-label">
                  Bài học <span className="clt-req">*</span>
                </span>
                <select
                  className="clt-select"
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
              <div className="clt-provider-banner custom">
                <BookOpen size={20} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 0.2rem', fontSize: '0.9rem', fontWeight: 800 }}>
                    Chương trình mở rộng
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem' }}>
                    Tạo <strong>Phần</strong> và nhập tên cho <strong>Bài học tự do</strong> của
                    riêng bạn.
                  </p>
                </div>
              </div>
              <label className="clt-form-field">
                <span className="clt-form-label">
                  Phần nội dung <span className="clt-req">*</span>
                </span>
                <select
                  className="clt-select"
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  disabled={uploading || loadingSections}
                >
                  <option value="">{loadingSections ? 'Đang tải...' : '-- Chọn phần --'}</option>
                  {sectionOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      Phần {s.orderIndex}: {s.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="clt-form-field">
                <span className="clt-form-label">
                  Tên bài học <span className="clt-req">*</span>
                </span>
                <input
                  className="clt-input"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Ví dụ: Bài 1 — Giới thiệu"
                  disabled={uploading}
                  required
                />
              </label>

              <label className="clt-form-field">
                <span className="clt-form-label">Mô tả ngắn (tuỳ chọn)</span>
                <textarea
                  className="clt-textarea"
                  rows={2}
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Ghi chú ngắn về nội dung bài học..."
                  disabled={uploading}
                />
              </label>
            </>
          )}

          <div className="clt-form-field">
            <span className="clt-form-label">
              File video <span className="clt-req">*</span>
            </span>
            <div
              className="clt-dropzone"
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
                  <div className="clt-dropzone__file">{file.name}</div>
                  <div className="clt-muted">
                    {fileSizeMB} MB
                    {durationSeconds
                      ? ` · ${Math.floor(durationSeconds / 60)} phút ${durationSeconds % 60} giây`
                      : ''}
                  </div>
                </div>
              ) : (
                <div className="clt-muted">
                  <Video size={32} style={{ marginBottom: 8, opacity: 0.55 }} aria-hidden />
                  <p style={{ margin: 0 }}>Kéo thả hoặc chọn file video</p>
                  <p style={{ fontSize: '0.75rem', marginTop: 6, marginBottom: 0 }}>
                    MP4, WebM hoặc OGG
                  </p>
                </div>
              )}
            </div>
          </div>

          <label className="clt-form-field">
            <span className="clt-form-label">Tiêu đề video</span>
            <input
              className="clt-input"
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
              <div className="clt-progress">
                <div
                  className="clt-progress__bar"
                  style={{ transform: `scaleX(${progress / 100})` }}
                />
              </div>
              {chunkInfo ? (
                <p className="clt-muted" style={{ fontSize: '0.78rem', marginTop: 6 }}>
                  {chunkInfo}
                </p>
              ) : null}
            </div>
          )}

          {error ? <p className="clt-err">{error}</p> : null}
        </div>

        <div className="clt-modal-footer">
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
    <div className="clt-modal-layer" role="presentation" onClick={onClose}>
      <div
        className="clt-modal-card clt-modal-card--sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clt-edit-lesson-title"
        lang="vi"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="clt-modal-header">
          <div>
            <h3 id="clt-edit-lesson-title">Chỉnh sửa bài học</h3>
            <p>Bài: {lesson.lessonTitle}</p>
          </div>
          <button
            type="button"
            className="clt-icon-btn"
            onClick={onClose}
            disabled={updating}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="clt-modal-body">
          <label className="clt-form-field">
            <span className="clt-form-label">Tiêu đề hiển thị</span>
            <input
              className="clt-input"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Tên hiển thị trên trình phát"
              disabled={updating}
            />
          </label>

          <label className="clt-form-field">
            <span className="clt-form-label">Thứ tự</span>
            <input
              type="number"
              className="clt-input"
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

          {error ? (
            <p className="clt-err" style={{ marginTop: 12 }}>
              {error}
            </p>
          ) : null}
        </div>

        <div className="clt-modal-footer">
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
    <div
      ref={setNodeRef}
      style={style}
      className={`clt-list-card ${isDragging ? 'is-dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="clt-drag-handle">
        <GripVertical size={18} />
      </div>
      <span style={{ minWidth: 28, fontWeight: 800, color: '#3b82f6', fontSize: '0.9rem' }}>
        #{lesson.orderIndex ?? '-'}
      </span>
      <div className="clt-lesson-info">
        <div className="clt-lesson-title">{lesson.lessonTitle ?? 'Untitled lesson'}</div>
        <div className="clt-lesson-subtitle">{lesson.videoTitle || 'No video title'}</div>
      </div>
      {lesson.isFreePreview && (
        <span className="badge published" style={{ fontSize: '0.7rem' }}>
          Xem trước
        </span>
      )}
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
  const isAdmin = useMemo(() => AuthService.getUserRole() === 'admin', []);
  const [playingLessonId, setPlayingLessonId] = useState<string | null>(null);
  const [showResources, setShowResources] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const [showUpload, setShowUpload] = useState(false);
  const [editingLesson, setEditingLesson] = useState<CourseLessonResponse | null>(null);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CltDeleteTarget | null>(null);
  const [renameTarget, setRenameTarget] = useState<null | { id: string; value: string }>(null);

  const { data: courseData } = useCourseDetail(courseId);
  const { data: lessonsData, isLoading, refetch } = useCourseLessons(courseId);
  const { data: sectionsData } = useCustomCourseSections(courseId);

  const subjectId = courseData?.result?.subjectId || '';
  const { data: chaptersData } = useChaptersBySubject(subjectId, !!subjectId);
  const deleteMutation = useDeleteCourseLesson();
  const updateMutation = useUpdateCourseLesson();
  const reorderMutation = useReorderCourseLessons();
  const addMaterialMutation = useAddMaterial();
  const removeMaterialMutation = useRemoveMaterial();

  const createSectionMutation = useCreateSection();
  const updateSectionMutation = useUpdateSection();
  const deleteSectionMutation = useDeleteSection();

  const lessons: CourseLessonResponse[] = useMemo(() => {
    return (lessonsData?.result ?? []).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  }, [lessonsData]);

  const sections = useMemo(() => {
    return (sectionsData?.result ?? []).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  }, [sectionsData]);

  const curriculumHierarchy = useMemo(() => {
    const groupsMap: Record<
      string,
      {
        id: string;
        title: string;
        description: string | null;
        lessons: CourseLessonResponse[];
        type: 'SECTION' | 'CHAPTER' | 'OTHER';
        firstSeenIndex: number;
        orderIndex?: number;
      }
    > = {};

    const sectionOrderMap = new Map(
      sections.map((section, index) => [section.id, section.orderIndex ?? index + 1] as const)
    );

    const chapters = chaptersData?.result ?? [];
    const chapterMap = new Map(chapters.map((c) => [c.id, c]));

    lessons.forEach((lesson, index) => {
      const section = sections.find((s) => s.id === lesson.sectionId);
      const groupId = lesson.sectionId || lesson.chapterId || 'no-group';

      const groupTitle =
        section?.title ||
        lesson.chapterTitle ||
        (lesson.sectionId ? 'Mục chưa đặt tên' : lesson.chapterId ? 'Chương chưa đặt tên' : 'Khác');

      const groupDescription = section?.description || (lesson as any).chapterDescription || null;
      const groupType = lesson.sectionId ? 'SECTION' : lesson.chapterId ? 'CHAPTER' : 'OTHER';

      if (!groupsMap[groupId]) {
        const dbChapter = lesson.chapterId ? chapterMap.get(lesson.chapterId) : null;

        groupsMap[groupId] = {
          id: groupId,
          title: groupTitle,
          description: groupDescription || dbChapter?.description || null,
          lessons: [],
          type: groupType,
          firstSeenIndex: index,
          orderIndex: groupType === 'SECTION'
            ? sectionOrderMap.get(groupId)
            : (groupType === 'CHAPTER' ? dbChapter?.orderIndex : undefined),
        };
      }
      groupsMap[groupId].lessons.push(lesson);
    });

    return Object.values(groupsMap)
      .sort(sortCurriculumGroups)
      .map((group) => ({
        ...group,
        lessons: [...group.lessons].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)),
      }));
  }, [lessons, sections, chaptersData]);

  const toggleSection = (sId: string) => {
    setCollapsedSections((prev) => ({ ...prev, [sId]: !prev[sId] }));
  };

  const handleLessonSelect = (lesson: CourseLessonResponse) => {
    setPlayingLessonId(lesson.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const handleDownloadMaterial = async (lesson: CourseLessonResponse, material: LessonMaterial) => {
    if (!material.id) {
      showToast({
        type: 'error',
        message: 'Tài liệu chưa có mã định danh hợp lệ để tải.',
      });
      return;
    }

    try {
      const { blob, filename } = await CourseService.downloadMaterial(
        courseId,
        lesson.id,
        material.id
      );
      triggerBlobDownload(blob, filename || material.name || 'tai-lieu');
    } catch (e) {
      showToast({
        type: 'error',
        message: e instanceof Error ? e.message : 'Không thể tải tài liệu.',
      });
    }
  };

  const renderCurriculum = (isSidebar = false) => {
    if (curriculumHierarchy.length === 0) {
      return isSidebar ? null : (
        <div className="cdt-empty">
          <BookOpen size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
          <p>Chưa có bài học nào.</p>
        </div>
      );
    }

    return curriculumHierarchy.map((group, idx) => (
      <div key={group.id} className="curriculum-group">
        <div
          className="section-header"
          onClick={() => toggleSection(group.id)}
          style={isSidebar ? { padding: '0.65rem 1rem', background: '#f5f4ed' } : {}}
        >
          <div className="section-title-area">
            <ChevronDown
              size={isSidebar ? 14 : 18}
              style={{
                transform: collapsedSections[group.id] ? 'rotate(-90deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            />
            <span className="section-label" style={isSidebar ? { fontSize: '0.65rem' } : {}}>
              {group.type === 'CHAPTER'
                ? (() => {
                  const num = group.orderIndex ?? extractChapterNumber(group.title) ?? extractChapterNumber(group.id);
                  if (num === undefined || num === null) return `Chương ${idx + 1}`;
                  const hasLabel = new RegExp(`chương\\s*${num}`, 'i').test(group.title);
                  return hasLabel ? '' : `Chương ${num}`;
                })()
                : group.type === 'SECTION'
                  ? (() => {
                    const num = group.orderIndex ?? idx + 1;
                    const hasLabel = new RegExp(`(mục|phần)\\s*${num}`, 'i').test(group.title);
                    return hasLabel ? '' : `Mục ${num}`;
                  })()
                  : ''}
            </span>
            <div className="section-title-wrapper">
              <span className="section-title" style={isSidebar ? { fontSize: '0.82rem' } : {}}>
                {group.title}
              </span>
              {group.description && (
                <p className="section-description">{group.description}</p>
              )}
            </div>
          </div>
          {!isSidebar && (
            <div className="section-meta">
              <span>{group.lessons.length} bài học</span>
              {group.type === 'SECTION' && (
                <div className="row" style={{ gap: '0.5rem', marginLeft: '1rem' }}>
                  <button
                    className="btn secondary"
                    style={{ padding: '0.2rem 0.4rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameTarget({ id: group.id, value: group.title });
                    }}
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    className="btn danger"
                    style={{ padding: '0.2rem 0.4rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget({ k: 'section', sectionId: group.id, title: group.title });
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          )}
          {!isSidebar && isAdmin && (
            <div className="section-meta">
              <span>{group.lessons.length} bài học</span>
            </div>
          )}
        </div>
        <div className={`lessons-group ${collapsedSections[group.id] ? 'collapsed' : ''}`}>
          <div className="lessons-inner">
            {!isSidebar && group.lessons.length > 1 && (
              <div style={{ padding: '1rem 1.25rem 0.5rem' }}>
                <LessonReorderStrip
                  title="Sắp xếp bài học trong phần"
                  lessons={group.lessons}
                  disabled={reorderMutation.isPending}
                  onReordered={persistReorder}
                />
              </div>
            )}
            {group.lessons.map((l) => renderLessonItem(l, isSidebar))}
          </div>
        </div>
      </div>
    ));
  };

  const renderLessonItem = (lesson: CourseLessonResponse, isSidebar = false) => {
    const isPlaying = lesson.id === playingLessonId;
    const materialsList = parseLessonMaterials(lesson.materials);

    return (
      <div key={lesson.id} style={{ marginBottom: 0 }}>
        <div
          className={isSidebar ? '' : 'clt-list-card'}
          onClick={() => handleLessonSelect(lesson)}
          style={
            isSidebar
              ? {
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: isPlaying ? '#fdf4f0' : '#ffffff',
                cursor: 'pointer',
                borderLeft: isPlaying ? '3px solid #C96442' : '3px solid transparent',
                borderBottom: '1px solid #f0eee6',
                transition: 'all 0.2s ease',
              }
              : {
                cursor: 'pointer',
                borderColor: isPlaying ? '#C96442' : undefined,
                boxShadow: isPlaying ? '0 4px 12px rgba(201, 100, 66, 0.15)' : undefined,
              }
          }
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isPlaying ? '#C96442' : '#e8e6dc',
              color: isPlaying ? '#fff' : '#5e5d59',
            }}
          >
            <Play size={16} style={{ marginLeft: 2 }} />
          </div>

          <div className="clt-lesson-info">
            <div
              className="clt-lesson-title"
              style={{ color: isPlaying ? '#C96442' : isSidebar ? '#141413' : undefined }}
              title={lesson.lessonTitle ?? 'Bài học'}
            >
              {lesson.lessonTitle ?? 'Bài học'}
            </div>
            {lesson.videoTitle && lesson.videoTitle !== lesson.lessonTitle && (
              <div className="clt-lesson-subtitle" title={lesson.videoTitle}>
                {lesson.videoTitle}
              </div>
            )}
            {!isSidebar && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 6 }}>
                {lesson.durationSeconds && (
                  <span
                    className="clt-muted"
                    style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Clock size={12} />
                    {Math.floor(lesson.durationSeconds / 60)} phút
                  </span>
                )}
                {true && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: '#6366f1',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowResources(showResources === lesson.id ? null : lesson.id);
                    }}
                  >
                    <Paperclip size={12} /> {materialsList.length} tài liệu
                  </span>
                )}
                <span
                  className={`badge ${lesson.isFreePreview ? 'published' : 'draft'}`}
                  style={{
                    fontSize: '0.65rem',
                    padding: '2px 8px',
                    cursor: 'pointer',
                    opacity: lesson.isFreePreview ? 1 : 0.6,
                  }}
                  onClick={(e) => {
                    if (isAdmin) return;
                    e.stopPropagation();
                    updateMutation.mutate({
                      courseId,
                      lessonId: lesson.id,
                      request: { isFreePreview: !lesson.isFreePreview },
                    });
                  }}
                  title={
                    isAdmin
                      ? undefined
                      : lesson.isFreePreview
                        ? 'Click để khóa bài học'
                        : 'Click để mở xem thử miễn phí'
                  }
                >
                  {lesson.isFreePreview ? 'Xem trước' : 'Đã khóa'}
                </span>
              </div>
            )}
          </div>

          {!isSidebar && (
            <div className="clt-actions">
              <button
                className="clt-action-btn"
                title="Sửa bài học"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingLesson(lesson);
                }}
              >
                <Pencil size={14} />
              </button>
              <button
                className="clt-action-btn danger"
                title="Xóa bài học"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget({ k: 'lesson', lessonId: lesson.id });
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Materials List */}
        {!isSidebar && showResources === lesson.id && (
          <div style={{ padding: '0.5rem 1.25rem 1rem 3.5rem', background: '#f8fafc' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {materialsList.map((m: LessonMaterial) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => void handleDownloadMaterial(lesson, m)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: '0.8rem',
                      color: '#475569',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      flex: 1,
                      textAlign: 'left',
                    }}
                  >
                    <FileText size={13} style={{ color: '#1f5eff' }} />
                    <span>{m.name}</span>
                    <span className="muted" style={{ fontSize: '0.7rem' }}>
                      ({((m.size || 0) / 1024).toFixed(1)} KB)
                    </span>
                  </button>
                  {true && (
                    <button
                      className="btn-icon"
                      style={{ color: '#ef4444' }}
                      onClick={() =>
                        m.id &&
                        setDeleteTarget({
                          k: 'material',
                          lessonId: lesson.id,
                          materialId: m.id,
                          name: m.name || 'Tài liệu',
                        })
                      }
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
              {materialsList.length === 0 && (
                <p className="muted" style={{ fontSize: '0.8rem', fontStyle: 'italic', margin: '0 0 8px' }}>
                  Chưa có tài liệu đính kèm cho bài học này.
                </p>
              )}
              {true && (
                <label
                  className="btn secondary"
                  style={{
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    width: 'fit-content',
                    marginTop: 4,
                  }}
                >
                  <Plus size={12} style={{ marginRight: 4 }} />
                  Thêm tài liệu
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
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

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
      {playingLessonId && lessons.find((l) => l.id === playingLessonId) ? (
        /* Integrated Player Layout */
        <div className="player-container">
          {/* Main Player Area */}
          <div className="player-main">
            <InlinePlayer
              courseId={courseId}
              courseLessonId={playingLessonId}
              title={(() => {
                const l = lessons.find((x) => x.id === playingLessonId);
                if (!l) return 'Bài học';
                if (l.lessonTitle && l.videoTitle && l.lessonTitle !== l.videoTitle) {
                  return `${l.lessonTitle} - ${l.videoTitle}`;
                }
                return l.lessonTitle ?? l.videoTitle ?? 'Bài học';
              })()}
              onLessonComplete={() => {
                const currentIndex = lessons.findIndex((l) => l.id === playingLessonId);
                if (currentIndex !== -1 && currentIndex < lessons.length - 1) {
                  const nextLesson = lessons[currentIndex + 1];
                  setPlayingLessonId(nextLesson.id);
                }
              }}
            />

            {/* Resources Tab below video */}
            <div className="data-card" style={{ padding: '1.25rem' }}>
              <h4 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Paperclip size={18} color="#C96442" /> Tài liệu bài học
              </h4>
              {lessons.find((l) => l.id === playingLessonId)?.materials ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {parseLessonMaterials(
                    lessons.find((l) => l.id === playingLessonId)?.materials
                  ).map((m: LessonMaterial) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() =>
                        void handleDownloadMaterial(
                          lessons.find((l) => l.id === playingLessonId)!,
                          m
                        )
                      }
                      className="sc-cta-btn"
                      style={{
                        fontSize: '0.82rem',
                        padding: '8px 16px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <FileText size={14} /> {m.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="muted" style={{ fontSize: '0.88rem', fontStyle: 'italic' }}>
                  Bài học này chưa có tài liệu đính kèm.
                </p>
              )}
            </div>

            <button
              className="btn secondary"
              onClick={() => setPlayingLessonId(null)}
              style={{ alignSelf: 'flex-start' }}
            >
              Thoát chế độ xem
            </button>
          </div>

          {/* Sidebar Curriculum */}
          <div className="data-card player-sidebar">
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #e8e6dc',
                background: 'linear-gradient(to right, #fdfaf6, #ffffff)',
                flexShrink: 0,
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: '#141413',
                  letterSpacing: '-0.01em',
                }}
              >
                Nội dung khóa học
              </h4>
            </div>
            <div style={{ maxHeight: 'calc(100vh - 240px)', overflowY: 'auto' }}>
              {renderCurriculum(true)}
            </div>
          </div>
        </div>
      ) : (
        /* Regular Dashboard List Layout */
        <>
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

          {true && (
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
              <button
                type="button"
                className="btn cdt-btn-primary"
                onClick={() => setShowUpload(true)}
              >
                <Plus size={14} />
                Thêm bài học
              </button>
            </div>
          )}

          {/* Loading */}
          {isLoading && <div className="cdt-loading">Đang tải danh sách bài học...</div>}

          {/* Empty State */}
          {!isLoading && lessons.length === 0 && (
            <div className="cdt-empty">
              <Video size={40} strokeWidth={1.5} style={{ marginBottom: 12 }} />
              <p>Chưa có bài học nào.</p>
              {true && (
                <button
                  type="button"
                  className="btn cdt-btn-primary"
                  style={{ marginTop: 12 }}
                  onClick={() => setShowUpload(true)}
                >
                  <Plus size={14} />
                  Thêm bài học
                </button>
              )}
            </div>
          )}

          {/* Lesson Curriculum */}
          {!isLoading && lessons.length > 0 && (
            <div className="data-card" style={{ gap: 0, padding: 0, overflow: 'hidden' }}>
              <div
                style={{
                  padding: '1rem 1.2rem',
                  borderBottom: '1px solid #e8eef8',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>
                  {UI_TEXT.COURSE_CONTENT}
                </h4>
                <div className="pill-btn active">
                  <Layout size={13} style={{ marginRight: 4 }} /> Phân cấp
                </div>
              </div>

              {renderCurriculum()}
            </div>
          )}
        </>
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

      {true && (
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
      )}

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

      {/* Edit Modal */}
      {editingLesson && (
        <EditLessonModal
          courseId={courseId}
          lesson={editingLesson}
          onClose={() => setEditingLesson(null)}
          onSuccess={() => void refetch()}
        />
      )}
    </div>
  );
};

export default CourseLessonsTab;
