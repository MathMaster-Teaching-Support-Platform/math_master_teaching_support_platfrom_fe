import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Clock, Play } from 'lucide-react';
import {
  useCourseLessons,
  useCourseProgress,
  useMarkLessonComplete,
} from '../../../hooks/useCourses';
import { VideoUploadService } from '../../../services/api/videoUpload.service';
import type { CourseLessonResponse } from '../../../types';
import '../../../styles/module-refactor.css';

interface StudentLessonsTabProps {
  enrollmentId: string;
  courseId: string;
  enrollmentStatus: string;
}

// Video Player Component
const VideoPlayer: React.FC<{
  courseId: string;
  courseLessonId: string;
  title: string;
  onClose: () => void;
}> = ({ courseId, courseLessonId, title, onClose }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    VideoUploadService.getVideoUrl(courseId, courseLessonId)
      .then((r) => setVideoUrl(r.result))
      .catch((e) => setError(e instanceof Error ? e.message : 'Không thể tải video'))
      .finally(() => setLoading(false));
  }, [courseId, courseLessonId]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div style={{ width: '100%', maxWidth: 900 }} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h3 style={{ color: '#fff', margin: 0, fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              padding: '0.4rem 0.7rem',
              cursor: 'pointer',
              fontSize: '0.88rem',
            }}
          >
            ✕ Đóng
          </button>
        </div>

        <div
          style={{
            background: '#000',
            borderRadius: 12,
            overflow: 'hidden',
            aspectRatio: '16/9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {loading && <p style={{ color: '#94a3b8' }}>Đang tải video...</p>}
          {error && <p style={{ color: '#f87171' }}>{error}</p>}
          {videoUrl && !loading && (
            <video
              src={videoUrl}
              controls
              autoPlay
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={() => setError('Không thể phát video. Vui lòng thử lại.')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const StudentLessonsTab: React.FC<StudentLessonsTabProps> = ({
  enrollmentId,
  courseId,
  enrollmentStatus,
}) => {
  const { data: lessonsData, isLoading: loadingLessons } = useCourseLessons(courseId);
  const { data: progressData } = useCourseProgress(enrollmentId);
  const markComplete = useMarkLessonComplete();
  const [playingLesson, setPlayingLesson] = useState<{ id: string; title: string } | null>(null);

  const lessons: CourseLessonResponse[] = lessonsData?.result ?? [];
  const progress = progressData?.result;

  const completedCount = progress?.completedLessons ?? 0;
  const totalCount = lessons.length;

  return (
    <div className="lessons-tab">
      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card stat-blue">
          <div className="stat-icon-wrap">
            <BookOpen size={20} />
          </div>
          <div>
            <h3>{totalCount}</h3>
            <p>Tổng bài học</p>
          </div>
        </div>
        <div className="stat-card stat-emerald">
          <div className="stat-icon-wrap">
            <CheckCircle size={20} />
          </div>
          <div>
            <h3>{completedCount}</h3>
            <p>Đã hoàn thành</p>
          </div>
        </div>
        <div className="stat-card stat-amber">
          <div className="stat-icon-wrap">
            <Clock size={20} />
          </div>
          <div>
            <h3>{totalCount - completedCount}</h3>
            <p>Còn lại</p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loadingLessons && (
        <div className="skeleton-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loadingLessons && lessons.length === 0 && (
        <div className="empty">
          <BookOpen size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
          <p>Chưa có bài học nào trong khóa học này.</p>
        </div>
      )}

      {/* Lesson List */}
      {!loadingLessons && lessons.length > 0 && (
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
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--mod-ink)' }}>
              Danh sách bài học
            </h4>
            <span className="badge">
              {completedCount}/{totalCount} bài học
            </span>
          </div>

          {lessons
            .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
            .map((lesson) => {
              const lessonProgress = progress?.lessons.find((l) => l.courseLessonId === lesson.id);
              const isCompleted = lessonProgress?.isCompleted ?? false;

              return (
                <div
                  key={lesson.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.85rem 1.2rem',
                    borderBottom: '1px solid #f3f7fd',
                    background: isCompleted ? '#f0fdf4' : '#fff',
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isCompleted ? '#dcfce7' : '#e8eef8',
                      color: isCompleted ? '#15803d' : '#60748f',
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircle size={17} strokeWidth={2} />
                    ) : (
                      <Play size={17} strokeWidth={2} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        color: 'var(--mod-ink)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {lesson.videoTitle ?? lesson.lessonTitle ?? 'Bài học'}
                    </div>
                    {lesson.durationSeconds && (
                      <div style={{ fontSize: '0.76rem', color: '#60748f', marginTop: '0.15rem' }}>
                        ⏱ {Math.round(lesson.durationSeconds / 60)} phút • Video
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    {lesson.videoUrl && (
                      <button
                        className="action-primary"
                        style={{ padding: '0.42rem 0.75rem', fontSize: '0.78rem' }}
                        onClick={() =>
                          setPlayingLesson({
                            id: lesson.id,
                            title: lesson.videoTitle ?? lesson.lessonTitle ?? 'Bài học',
                          })
                        }
                      >
                        <Play size={12} strokeWidth={2.5} /> Xem video
                      </button>
                    )}
                    {!isCompleted && enrollmentStatus === 'ACTIVE' && (
                      <button
                        className="action-toggle"
                        style={{ padding: '0.42rem 0.75rem', fontSize: '0.78rem' }}
                        onClick={() =>
                          markComplete.mutate({
                            enrollmentId,
                            courseLessonId: lesson.id,
                          })
                        }
                        disabled={markComplete.isPending}
                      >
                        <CheckCircle size={12} strokeWidth={2.5} /> Hoàn thành
                      </button>
                    )}
                    {isCompleted && (
                      <span
                        style={{
                          fontSize: '0.78rem',
                          color: '#15803d',
                          fontWeight: 700,
                          alignSelf: 'center',
                        }}
                      >
                        ✓ Đã xong
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Video Player Modal */}
      {playingLesson && (
        <VideoPlayer
          courseId={courseId}
          courseLessonId={playingLesson.id}
          title={playingLesson.title}
          onClose={() => setPlayingLesson(null)}
        />
      )}
    </div>
  );
};

export default StudentLessonsTab;
