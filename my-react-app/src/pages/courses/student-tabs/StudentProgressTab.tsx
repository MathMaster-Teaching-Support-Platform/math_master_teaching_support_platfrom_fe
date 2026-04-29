import { useMemo } from 'react';
import { Award, BookOpen, Calendar, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useCourseProgress, useCourseLessons, useCustomCourseSections } from '../../../hooks/useCourses';
import type { EnrollmentResponse } from '../../../types';
import '../../../styles/module-refactor.css';

interface StudentProgressTabProps {
  enrollmentId: string;
  enrollment: EnrollmentResponse;
}

const StudentProgressTab: React.FC<StudentProgressTabProps> = ({ enrollmentId, enrollment }) => {
  const { data: progressData, isLoading } = useCourseProgress(enrollmentId);
  const { data: lessonsData } = useCourseLessons(enrollment.courseId);
  const { data: sectionsData } = useCustomCourseSections(enrollment.courseId);

  const progress = progressData?.result;
  const lessons = lessonsData?.result ?? [];
  const sections = sectionsData?.result ?? [];

  const curriculumLessons = useMemo(() => {
    const sectionOrderMap = new Map(
      sections.map((section, index) => [section.id, section.orderIndex ?? index + 1] as const)
    );

    const groupsMap: Record<
      string,
      { id: string; type: 'SECTION' | 'CHAPTER' | 'OTHER'; firstSeenIndex: number; lessons: typeof lessons }
    > = {};

    lessons.forEach((lesson, index) => {
      const groupId = lesson.sectionId || lesson.chapterId || 'no-group';
      const groupType = lesson.sectionId ? 'SECTION' : lesson.chapterId ? 'CHAPTER' : 'OTHER';

      if (!groupsMap[groupId]) {
        groupsMap[groupId] = { id: groupId, type: groupType, firstSeenIndex: index, lessons: [] };
      }
      groupsMap[groupId].lessons.push(lesson);
    });

    const orderedGroups = Object.values(groupsMap).sort((a, b) => {
      const orderA = a.type === 'SECTION' ? sectionOrderMap.get(a.id) ?? a.firstSeenIndex : a.firstSeenIndex;
      const orderB = b.type === 'SECTION' ? sectionOrderMap.get(b.id) ?? b.firstSeenIndex : b.firstSeenIndex;
      if (orderA !== orderB) return orderA - orderB;
      return a.id.localeCompare(b.id);
    });

    return orderedGroups.flatMap((group) => [...group.lessons].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)));
  }, [lessons, sections]);

  const stats = useMemo(() => {
    if (!progress) return null;

    const completedLessons = progress.lessons.filter((l) => l.isCompleted);
    const recentlyCompleted = completedLessons
      .filter((l) => l.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0, 5);

    // Calculate estimated time remaining
    const avgLessonDuration = 30; // minutes (estimate)
    const remainingLessons = progress.totalLessons - progress.completedLessons;
    const estimatedMinutes = remainingLessons * avgLessonDuration;
    const estimatedHours = Math.floor(estimatedMinutes / 60);
    const estimatedMins = estimatedMinutes % 60;

    return {
      completionRate: progress.completionRate,
      completedLessons: progress.completedLessons,
      totalLessons: progress.totalLessons,
      remainingLessons,
      recentlyCompleted,
      estimatedTime:
        estimatedHours > 0
          ? `${estimatedHours} giờ ${estimatedMins} phút`
          : `${estimatedMins} phút`,
    };
  }, [progress]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNextLesson = () => {
    if (!progress) return null;
    const incompleteLessons = curriculumLessons.filter(
      (lesson) => !progress.lessons.find((l) => l.courseLessonId === lesson.id && l.isCompleted)
    );
    return incompleteLessons[0];
  };

  const nextLesson = getNextLesson();

  return (
    <div className="progress-tab">
      {/* Loading */}
      {isLoading && <div className="empty">Đang tải thông tin tiến độ...</div>}

      {/* Content */}
      {!isLoading && stats && (
        <>
          {/* Overall Progress Card */}
          <div className="data-card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700 }}>
              Tiến độ tổng quan
            </h3>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: 180,
                  height: 180,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Progress Circle */}
                <svg width="180" height="180" style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    cx="90"
                    cy="90"
                    r="75"
                    fill="none"
                    stroke="#e8eef8"
                    strokeWidth="12"
                  />
                  <circle
                    cx="90"
                    cy="90"
                    r="75"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="12"
                    strokeDasharray={`${(stats.completionRate / 100) * 471} 471`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#1f5eff" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Percentage Text */}
                <div
                  style={{
                    position: 'absolute',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '2.5rem',
                      fontWeight: 800,
                      color: '#1f5eff',
                      lineHeight: 1,
                    }}
                  >
                    {stats.completionRate.toFixed(0)}%
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>
                    Hoàn thành
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div className="info-row">
                <span className="info-label">
                  <CheckCircle size={16} />
                  Đã hoàn thành
                </span>
                <span className="info-value">
                  {stats.completedLessons}/{stats.totalLessons} bài học
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">
                  <BookOpen size={16} />
                  Còn lại
                </span>
                <span className="info-value">{stats.remainingLessons} bài học</span>
              </div>

              <div className="info-row">
                <span className="info-label">
                  <Clock size={16} />
                  Thời gian ước tính
                </span>
                <span className="info-value">{stats.estimatedTime}</span>
              </div>

              <div className="info-row">
                <span className="info-label">
                  <Calendar size={16} />
                  Ngày đăng ký
                </span>
                <span className="info-value">{formatDate(enrollment.enrolledAt)}</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card stat-blue">
              <div className="stat-icon-wrap">
                <TrendingUp size={20} />
              </div>
              <div>
                <h3>{stats.completionRate.toFixed(1)}%</h3>
                <p>Tiến độ</p>
              </div>
            </div>
            <div className="stat-card stat-emerald">
              <div className="stat-icon-wrap">
                <CheckCircle size={20} />
              </div>
              <div>
                <h3>{stats.completedLessons}</h3>
                <p>Đã hoàn thành</p>
              </div>
            </div>
            <div className="stat-card stat-amber">
              <div className="stat-icon-wrap">
                <BookOpen size={20} />
              </div>
              <div>
                <h3>{stats.remainingLessons}</h3>
                <p>Còn lại</p>
              </div>
            </div>
          </div>

          {/* Next Lesson Recommendation */}
          {nextLesson && (
            <div
              className="data-card"
              style={{
                marginBottom: '1.5rem',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '2px solid #3b82f6',
              }}
            >
              <div className="row" style={{ gap: 8, marginBottom: 8 }}>
                <TrendingUp size={18} style={{ color: '#1e40af' }} />
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e40af' }}>
                  Bài học tiếp theo
                </h4>
              </div>
              <p style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 600 }}>
                {nextLesson.videoTitle ?? nextLesson.lessonTitle ?? 'Bài học'}
              </p>
              {nextLesson.durationSeconds && (
                <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
                  ⏱ Thời lượng: {Math.round(nextLesson.durationSeconds / 60)} phút
                </p>
              )}
            </div>
          )}

          {/* Recently Completed */}
          {stats.recentlyCompleted.length > 0 && (
            <div className="data-card">
              <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700 }}>
                <Award size={16} style={{ marginRight: 6 }} />
                Hoàn thành gần đây
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stats.recentlyCompleted.map((lesson) => {
                  const lessonDetail = lessons.find((l) => l.id === lesson.courseLessonId);
                  return (
                    <div
                      key={lesson.courseLessonId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        background: '#f0fdf4',
                        borderRadius: 8,
                        border: '1px solid #dcfce7',
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: '#dcfce7',
                          color: '#15803d',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <CheckCircle size={16} strokeWidth={2.5} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: '#0f172a',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {lessonDetail?.videoTitle ??
                            lessonDetail?.lessonTitle ??
                            lesson.videoTitle ??
                            'Bài học'}
                        </div>
                        {lesson.completedAt && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                            {formatDate(lesson.completedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completion Message */}
          {stats.completionRate === 100 && (
            <div
              className="data-card"
              style={{
                marginTop: '1.5rem',
                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                border: '2px solid #10b981',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.3rem', fontWeight: 800, color: '#065f46' }}>
                Chúc mừng!
              </h3>
              <p style={{ margin: 0, color: '#047857', fontSize: '0.95rem' }}>
                Bạn đã hoàn thành tất cả bài học trong khóa học này!
              </p>
            </div>
          )}
        </>
      )}

      <style>{`
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: #64748b;
          font-weight: 500;
        }

        .info-value {
          font-size: 0.95rem;
          color: #0f172a;
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .info-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.35rem;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentProgressTab;
