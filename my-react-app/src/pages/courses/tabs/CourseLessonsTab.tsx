import {
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
  Video,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  useAddMaterial,
  useCourseLessons,
  useCreateSection,
  useCustomCourseSections,
  useDeleteCourseLesson,
  useDeleteSection,
  useRemoveMaterial,
} from '../../../hooks/useCourses';
import { CourseService } from '../../../services/api/course.service';
import { LessonSlideService } from '../../../services/api/lesson-slide.service';
import { VideoUploadService } from '../../../services/api/videoUpload.service';
import '../../../styles/module-refactor.css';
import type { CourseLessonResponse, CourseResponse } from '../../../types';
import type { ChapterBySubject, LessonByChapter } from '../../../types/lessonSlide.types';

interface CourseLessonsTabProps {
  courseId: string;
  course: CourseResponse;
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

  useState(() => {
    if (provider === 'MINISTRY' && course.subjectId) {
      setLoadingChapters(true);
      LessonSlideService.getChaptersBySubject(course.subjectId)
        .then((r) => setChapters(r.result || []))
        .catch(() => setError('Không thể tải danh sách chương'))
        .finally(() => setLoadingChapters(false));
    } else if (provider === 'CUSTOM') {
      // Mock fetch sections or from real API
      CourseService.listSections(courseId)
        .then((res) => setSections(res.result || []))
        .catch(() => setError('Không thể tải danh sách phần'));
    }
  });

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
    <div className="modal-layer" onClick={onClose}>
      <div
        className="modal-card"
        style={{ width: 'min(640px, 100%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3>📹 Thêm bài học video</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              Chọn bài học và upload video giảng dạy của bạn
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} disabled={uploading}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {provider === 'MINISTRY' ? (
            <>
              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Chương <span style={{ color: 'red' }}>*</span>
                </p>
                <select
                  className="select"
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

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Bài học <span style={{ color: 'red' }}>*</span>
                </p>
                <select
                  className="select"
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
              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Phần (Section) <span style={{ color: 'red' }}>*</span>
                </p>
                <select
                  className="select"
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  disabled={uploading}
                >
                  <option value="">-- Chọn phần --</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      Phần {s.orderIndex}: {s.title}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Tên bài học <span style={{ color: 'red' }}>*</span>
                </p>
                <input
                  className="input"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Ví dụ: Bài 1: Giới thiệu..."
                  disabled={uploading}
                  required
                />
              </label>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Mô tả ngắn (tùy chọn)
                </p>
                <textarea
                  className="input"
                  rows={2}
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Mô tả nội dung bài học..."
                  disabled={uploading}
                />
              </label>
            </>
          )}

          <label>
            <p className="muted" style={{ marginBottom: 6 }}>
              File video <span style={{ color: 'red' }}>*</span>
            </p>
            <div
              style={{
                position: 'relative',
                border: '2px dashed #dbe4f0',
                borderRadius: 12,
                padding: '1.5rem',
                textAlign: 'center',
                background: '#f8fafc',
                cursor: 'pointer',
              }}
              onClick={() => document.getElementById('video-input')?.click()}
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
                  <div style={{ color: '#2d7be7', fontWeight: 600, marginBottom: 4 }}>
                    ✅ {file.name}
                  </div>
                  <div className="muted" style={{ fontSize: '0.82rem' }}>
                    {fileSizeMB} MB{' '}
                    {durationSeconds
                      ? `• ${Math.floor(durationSeconds / 60)} phút ${durationSeconds % 60} giây`
                      : ''}
                  </div>
                </div>
              ) : (
                <div className="muted">
                  <Video size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <p>Kéo thả hoặc click để chọn file video</p>
                  <p style={{ fontSize: '0.75rem', marginTop: 4 }}>MP4, WebM hoặc OGG</p>
                </div>
              )}
            </div>
          </label>

          <label>
            <p className="muted" style={{ marginBottom: 6 }}>
              Tiêu đề video
            </p>
            <input
              className="input"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Tên hiển thị cho bài học này"
              disabled={uploading}
            />
          </label>

          <div className="row" style={{ gap: '1rem' }}>
            <label className="row" style={{ alignItems: 'center', gap: 8, paddingTop: 10 }}>
              <input
                type="checkbox"
                checked={isFreePreview}
                onChange={(e) => setIsFreePreview(e.target.checked)}
                disabled={uploading}
              />
              <span style={{ fontSize: '0.9rem' }}>Xem thử miễn phí</span>
            </label>
          </div>

          {uploading && (
            <div>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Đang upload...</span>
                <span style={{ fontSize: '0.88rem', color: '#2563eb' }}>{progress}%</span>
              </div>
              <div
                style={{ height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #2563eb, #60a5fa)',
                    borderRadius: 999,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              {chunkInfo && (
                <p className="muted" style={{ fontSize: '0.78rem', marginTop: 4 }}>
                  {chunkInfo}
                </p>
              )}
            </div>
          )}

          {error && (
            <p style={{ color: '#dc2626', fontSize: '0.88rem', fontWeight: 600 }}>{error}</p>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn secondary" onClick={onClose} disabled={uploading}>
            Hủy
          </button>
          <button
            className="btn"
            disabled={
              uploading ||
              !file ||
              (provider === 'MINISTRY' && !lessonId) ||
              (provider === 'CUSTOM' && (!sectionId || !customTitle))
            }
            onClick={() => void handleUpload()}
          >
            {uploading ? `Đang upload ${progress}%...` : 'Upload video'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Lesson Row Component
function LessonRow({
  lesson,
  onDelete,
  deletePending,
  courseId,
}: {
  courseId: string;
  lesson: CourseLessonResponse;
  onDelete: () => void;
  deletePending: boolean;
}) {
  const [showMaterials, setShowMaterials] = useState(false);
  const addMaterialMutation = useAddMaterial();
  const removeMaterialMutation = useRemoveMaterial();

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
        <td>
          {lesson.isFreePreview ? (
            <span className="badge published">
              <Eye size={11} style={{ marginRight: 3 }} />
              Miễn phí
            </span>
          ) : (
            <span className="badge draft">
              <EyeOff size={11} style={{ marginRight: 3 }} />
              Khóa
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
            >
              <Pencil size={13} />
            </button>
            <button
              className="btn danger"
              style={{ padding: '0.35rem 0.6rem' }}
              disabled={deletePending}
              onClick={onDelete}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </td>
      </tr>
      {showMaterials && (
        <tr style={{ background: '#f8fafc' }}>
          <td colSpan={7} style={{ padding: '1rem 2rem' }}>
            <div style={{ borderLeft: '4px solid #e2e8f0', paddingLeft: '1.5rem' }}>
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
                        onClick={() => {
                          if (confirm(`Xóa tài liệu ${m.name}?`)) {
                            removeMaterialMutation.mutate({
                              courseId,
                              lessonId: lesson.id,
                              materialId: m.id,
                            });
                          }
                        }}
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

// Main Component
const CourseLessonsTab: React.FC<CourseLessonsTabProps> = ({ courseId, course }) => {
  const [showUpload, setShowUpload] = useState(false);
  const { data: lessonsData, isLoading, refetch } = useCourseLessons(courseId);
  const { data: sectionsData } = useCustomCourseSections(courseId);
  const deleteMutation = useDeleteCourseLesson();

  const createSectionMutation = useCreateSection();
  const deleteSectionMutation = useDeleteSection();

  const lessons: CourseLessonResponse[] = lessonsData?.result ?? [];
  const sections = sectionsData?.result ?? [];

  const handleCreateSection = () => {
    const title = window.prompt('Nhập tên phần mới:');
    if (title) {
      createSectionMutation.mutate({ courseId, data: { title, orderIndex: sections.length + 1 } });
    }
  };

  return (
    <div className="lessons-tab">
      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <p>Tổng bài học</p>
          <h3>{lessons.length}</h3>
          <span>đã upload</span>
        </div>
        <div className="stat-card">
          <p>Xem thử miễn phí</p>
          <h3>{lessons.filter((l) => l.isFreePreview).length}</h3>
          <span>bài học</span>
        </div>
        <div className="stat-card">
          <p>Có video</p>
          <h3>{lessons.filter((l) => l.videoUrl).length}</h3>
          <span>bài học</span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="toolbar" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        {course.provider === 'CUSTOM' && (
          <button className="btn secondary" onClick={handleCreateSection}>
            <Plus size={14} />
            Thêm phần
          </button>
        )}
        <button className="btn" onClick={() => setShowUpload(true)}>
          <Plus size={14} />
          Thêm bài học
        </button>
      </div>

      {/* Loading */}
      {isLoading && <div className="empty">Đang tải danh sách bài học...</div>}

      {/* Empty State */}
      {!isLoading && lessons.length === 0 && (
        <div className="empty">
          <Video size={40} strokeWidth={1.5} style={{ marginBottom: 12, color: '#94a3b8' }} />
          <p>Chưa có bài học nào. Hãy thêm bài học đầu tiên!</p>
          <button className="btn" style={{ marginTop: 12 }} onClick={() => setShowUpload(true)}>
            <Plus size={14} />
            Thêm bài học
          </button>
        </div>
      )}

      {/* Lesson Table */}
      {!isLoading && lessons.length > 0 && course.provider === 'MINISTRY' && (
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
              {lessons
                .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                .map((lesson) => (
                  <LessonRow
                    key={lesson.id}
                    courseId={courseId}
                    lesson={lesson}
                    onDelete={() => {
                      if (confirm('Xóa bài học này?')) {
                        deleteMutation.mutate(
                          { courseId, lessonId: lesson.id },
                          { onSuccess: () => void refetch() }
                        );
                      }
                    }}
                    deletePending={deleteMutation.isPending}
                  />
                ))}
            </tbody>
          </table>
        </div>
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
                <div
                  key={section.id}
                  className="data-card section-card"
                  style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem',
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>
                      Phần {section.orderIndex}: {section.title}
                    </h3>
                    <div className="row" style={{ gap: '0.5rem' }}>
                      <button
                        className="btn secondary"
                        style={{ padding: '0.35rem 0.6rem' }}
                        title="Chỉnh sửa phần"
                        onClick={() => {
                          const newTitle = window.prompt('Đổi tên phần:', section.title);
                          if (newTitle) {
                            alert('Chức năng sửa tên đang được cập nhật...');
                          }
                        }}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        className="btn danger"
                        style={{ padding: '0.35rem 0.6rem' }}
                        title="Xóa phần"
                        onClick={() => {
                          if (
                            confirm(
                              'Bạn có chắc muốn xóa phần này? (Các bài học bên trong sẽ không bị xóa)'
                            )
                          ) {
                            deleteSectionMutation.mutate({ courseId, sectionId: section.id });
                          }
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

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
                              onDelete={() => {
                                if (confirm('Xóa bài học này?')) {
                                  deleteMutation.mutate(
                                    { courseId, lessonId: lesson.id },
                                    { onSuccess: () => void refetch() }
                                  );
                                }
                              }}
                              deletePending={deleteMutation.isPending}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty" style={{ padding: '1.5rem', background: '#f8fafc' }}>
                      <p style={{ margin: 0, color: '#64748b' }}>
                        Chưa có bài học nào trong phần này.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          {sections.length === 0 && (
            <div className="empty" style={{ padding: '2rem' }}>
              <p style={{ margin: 0, color: '#64748b' }}>
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
    </div>
  );
};

export default CourseLessonsTab;
