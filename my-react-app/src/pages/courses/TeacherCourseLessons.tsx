import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, Clock, Eye, EyeOff,
  Pencil, Plus, Trash2, Upload, Video, X,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { useCourseLessons, useDeleteCourseLesson, useCourseDetail } from '../../hooks/useCourses';
import { VideoUploadService } from '../../services/api/videoUpload.service';
import { LessonSlideService } from '../../services/api/lesson-slide.service';
import type { CourseLessonResponse } from '../../types/course.types';
import type { ChapterBySubject, LessonByChapter } from '../../types/lessonSlide.types';
import '../../styles/module-refactor.css';

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadVideoModal({
  courseId,
  subjectId,
  onClose,
  onSuccess,
}: {
  courseId: string;
  subjectId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
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

  // Load chapters on mount
  useState(() => {
    if (!subjectId) return;
    setLoadingChapters(true);
    LessonSlideService.getChaptersBySubject(subjectId)
      .then((r) => setChapters(r.result || []))
      .catch(() => setError('Không thể tải danh sách chương'))
      .finally(() => setLoadingChapters(false));
  });

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (!videoTitle) setVideoTitle(f.name.replace(/\.[^.]+$/, ''));
  };

  const handleUpload = async () => {
    if (!file || !lessonId) return;
    setUploading(true);
    setError('');
    setProgress(0);
    try {
      await VideoUploadService.uploadVideo(
        courseId,
        file,
        { lessonId, videoTitle, orderIndex, isFreePreview },
        {
          onProgress: (pct) => setProgress(pct),
          onChunkComplete: (done, total) =>
            setChunkInfo(`Đã upload ${done}/${total} phần`),
        }
      );
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
    <div className="modal-layer">
      <div className="modal-card" style={{ width: 'min(640px, 100%)' }}>
        <div className="modal-header">
          <div>
            <h3>📹 Thêm bài học video</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              Chọn bài học và upload video giảng dạy của bạn
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} disabled={uploading}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Chapter */}
          <label>
            <p className="muted" style={{ marginBottom: 6 }}>Chương <span style={{ color: 'red' }}>*</span></p>
            <select
              className="select"
              value={chapterId}
              onChange={(e) => void handleChapterChange(e.target.value)}
              disabled={loadingChapters || uploading}
            >
              <option value="">{loadingChapters ? 'Đang tải...' : '-- Chọn chương --'}</option>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>{c.orderIndex}. {c.title}</option>
              ))}
            </select>
          </label>

          {/* Lesson */}
          <label>
            <p className="muted" style={{ marginBottom: 6 }}>Bài học <span style={{ color: 'red' }}>*</span></p>
            <select
              className="select"
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
              disabled={!chapterId || loadingLessons || uploading}
            >
              <option value="">
                {!chapterId ? 'Chọn chương trước' : loadingLessons ? 'Đang tải...' : '-- Chọn bài học --'}
              </option>
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>{l.orderIndex}. {l.title}</option>
              ))}
            </select>
          </label>

          {/* Video file */}
          <label>
            <p className="muted" style={{ marginBottom: 6 }}>File video <span style={{ color: 'red' }}>*</span></p>
            <div
              style={{
                border: '2px dashed #dbe4f0',
                borderRadius: 10,
                padding: '1.25rem',
                textAlign: 'center',
                background: file ? '#f0fdf4' : '#f8fbff',
                cursor: 'pointer',
              }}
              onClick={() => document.getElementById('video-file-input')?.click()}
            >
              {file ? (
                <div>
                  <Video size={24} style={{ color: '#059669', marginBottom: 6 }} />
                  <p style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>{file.name}</p>
                  <p className="muted" style={{ fontSize: '0.82rem', marginTop: 4 }}>
                    {fileSizeMB} MB • {file.type}
                  </p>
                </div>
              ) : (
                <div>
                  <Upload size={24} style={{ color: '#94a3b8', marginBottom: 6 }} />
                  <p style={{ color: '#64748b', margin: 0 }}>Click để chọn file video</p>
                  <p className="muted" style={{ fontSize: '0.8rem', marginTop: 4 }}>
                    MP4, MOV, AVI, MKV — không giới hạn dung lượng
                  </p>
                </div>
              )}
            </div>
            <input
              id="video-file-input"
              type="file"
              accept="video/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>

          {/* Video title */}
          <label>
            <p className="muted" style={{ marginBottom: 6 }}>Tiêu đề video</p>
            <input
              className="input"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Tên hiển thị cho bài học này"
              disabled={uploading}
            />
          </label>

          <div className="row" style={{ gap: '1rem' }}>
            <label style={{ flex: 1 }}>
              <p className="muted" style={{ marginBottom: 6 }}>Thứ tự</p>
              <input
                className="input"
                type="number"
                min={1}
                value={orderIndex}
                onChange={(e) => setOrderIndex(Number(e.target.value))}
                disabled={uploading}
              />
            </label>
            <label className="row" style={{ alignItems: 'center', gap: 8, paddingTop: 24 }}>
              <input
                type="checkbox"
                checked={isFreePreview}
                onChange={(e) => setIsFreePreview(e.target.checked)}
                disabled={uploading}
              />
              <span style={{ fontSize: '0.9rem' }}>Xem thử miễn phí</span>
            </label>
          </div>

          {/* Upload progress */}
          {uploading && (
            <div>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Đang upload...</span>
                <span style={{ fontSize: '0.88rem', color: '#2563eb' }}>{progress}%</span>
              </div>
              <div style={{ height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
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
                <p className="muted" style={{ fontSize: '0.78rem', marginTop: 4 }}>{chunkInfo}</p>
              )}
            </div>
          )}

          {error && (
            <p style={{ color: '#dc2626', fontSize: '0.88rem', fontWeight: 600 }}>{error}</p>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn secondary" onClick={onClose} disabled={uploading}>Hủy</button>
          <button
            className="btn"
            disabled={!file || !lessonId || uploading}
            onClick={() => void handleUpload()}
          >
            {uploading ? `Đang upload ${progress}%...` : 'Upload video'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function TeacherCourseLessons() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [showUpload, setShowUpload] = useState(false);

  const { data: courseData } = useCourseDetail(courseId!);
  const { data: lessonsData, isLoading, refetch } = useCourseLessons(courseId!);
  const deleteMutation = useDeleteCourseLesson();

  const course = courseData?.result;
  const lessons: CourseLessonResponse[] = lessonsData?.result ?? [];

  const fmtDuration = (secs?: number | null) => {
    if (!secs) return null;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <DashboardLayout role="teacher" user={{ name: 'Giáo viên', avatar: '', role: 'teacher' }}>
      <div className="module-layout-container">
        <section className="module-page">
          {/* Header */}
          <header className="page-header">
            <div>
              <button
                className="btn secondary"
                style={{ marginBottom: 8 }}
                onClick={() => navigate('/teacher/courses')}
              >
                <ArrowLeft size={14} />
                Quay lại
              </button>
              <h2>📹 Bài học — {course?.title ?? '...'}</h2>
              <p>
                {course?.subjectName} • Khối {course?.gradeLevel} •{' '}
                {lessons.length} bài học đã upload
              </p>
            </div>
            <button className="btn" onClick={() => setShowUpload(true)}>
              <Plus size={14} />
              Thêm bài học
            </button>
          </header>

          {/* Stats */}
          <div className="stats-grid">
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

          {/* Lesson list */}
          {isLoading && <div className="empty">Đang tải danh sách bài học...</div>}

          {!isLoading && lessons.length === 0 && (
            <div className="empty">
              <Video size={40} strokeWidth={1.5} style={{ marginBottom: 12, color: '#94a3b8' }} />
              <p>Chưa có bài học nào. Hãy thêm bài học đầu tiên!</p>
            </div>
          )}

          {!isLoading && lessons.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Bài học</th>
                    <th>Tiêu đề video</th>
                    <th>Thời lượng</th>
                    <th>Xem thử</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons
                    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                    .map((lesson) => (
                      <tr key={lesson.id}>
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
                              Yêu cầu đăng ký
                            </span>
                          )}
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
                              disabled={deleteMutation.isPending}
                              onClick={() => {
                                if (confirm('Xóa bài học này?')) {
                                  deleteMutation.mutate(
                                    { courseId: courseId!, lessonId: lesson.id },
                                    { onSuccess: () => void refetch() }
                                  );
                                }
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {showUpload && course && (
        <UploadVideoModal
          courseId={courseId!}
          subjectId={course.subjectId}
          onClose={() => setShowUpload(false)}
          onSuccess={() => void refetch()}
        />
      )}
    </DashboardLayout>
  );
}
