import { useMemo } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useCourseProgress, useCourseLessons, useCustomCourseSections } from '../../../hooks/useCourses';
import type { EnrollmentResponse } from '../../../types';
import './StudentProgressTab.css';

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

    return orderedGroups.flatMap((group) =>
      [...group.lessons].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    );
  }, [lessons, sections]);

  const stats = useMemo(() => {
    if (!progress) return null;

    const completedLessons = progress.lessons.filter((l) => l.isCompleted);
    const recentlyCompleted = completedLessons
      .filter((l) => l.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0, 5);

    const avgLessonDuration = 30;
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
        remainingLessons <= 0
          ? '—'
          : estimatedHours > 0
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

  const nextLesson = useMemo(() => {
    if (!progress) return null;
    const incompleteLessons = curriculumLessons.filter(
      (lesson) => !progress.lessons.find((l) => l.courseLessonId === lesson.id && l.isCompleted)
    );
    return incompleteLessons[0] ?? null;
  }, [progress, curriculumLessons]);

  const barPct = stats ? Math.min(100, Math.max(0, stats.completionRate)) : 0;

  return (
    <div className="spt-root">
      {isLoading ? (
        <div className="spt-empty">Đang tải thông tin tiến độ...</div>
      ) : null}

      {!isLoading && !stats ? (
        <div className="spt-empty">Chưa có dữ liệu tiến độ cho khóa học này.</div>
      ) : null}

      {!isLoading && stats ? (
        <>
          <section className="spt-card" aria-labelledby="spt-progress-heading">
            <h3 id="spt-progress-heading" className="spt-card-title">
              Tiến độ học tập
            </h3>

            <div className="spt-progress-head">
              <div className="spt-pct-wrap">
                <span className="spt-pct">{stats.completionRate.toFixed(0)}%</span>
                <span className="spt-pct-label">hoàn thành</span>
              </div>
              <span className="spt-fraction">
                {stats.completedLessons}/{stats.totalLessons} bài
              </span>
            </div>

            <div
              className="spt-bar-track"
              role="progressbar"
              aria-valuenow={Math.round(barPct)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="spt-bar-fill" style={{ transform: `scaleX(${barPct / 100})` }} />
            </div>

            <div className="spt-rows">
              <div className="spt-row">
                <span className="spt-row-label">
                  <CheckCircle size={15} strokeWidth={2} aria-hidden />
                  Đã hoàn thành
                </span>
                <span className="spt-row-value">
                  {stats.completedLessons}/{stats.totalLessons} bài học
                </span>
              </div>
              <div className="spt-row">
                <span className="spt-row-label">
                  <BookOpen size={15} strokeWidth={2} aria-hidden />
                  Còn lại
                </span>
                <span className="spt-row-value">{stats.remainingLessons} bài học</span>
              </div>
              <div className="spt-row">
                <span className="spt-row-label">
                  <Clock size={15} strokeWidth={2} aria-hidden />
                  Thời gian ước tính
                </span>
                <span className="spt-row-value">{stats.estimatedTime}</span>
              </div>
              <div className="spt-row">
                <span className="spt-row-label">
                  <Calendar size={15} strokeWidth={2} aria-hidden />
                  Ngày đăng ký
                </span>
                <span className="spt-row-value">{formatDate(enrollment.enrolledAt)}</span>
              </div>
            </div>
          </section>

          {nextLesson ? (
            <section className="spt-next" aria-labelledby="spt-next-heading">
              <div className="spt-next-head">
                <TrendingUp size={16} strokeWidth={2} aria-hidden />
                <h4 id="spt-next-heading" className="spt-next-title">
                  Bài học tiếp theo
                </h4>
              </div>
              <p className="spt-next-lesson">
                {nextLesson.videoTitle ?? nextLesson.lessonTitle ?? 'Bài học'}
              </p>
              {nextLesson.durationSeconds ? (
                <p className="spt-next-meta">
                  <Clock size={13} strokeWidth={2} aria-hidden />
                  Khoảng {Math.round(nextLesson.durationSeconds / 60)} phút
                </p>
              ) : null}
            </section>
          ) : null}

          {stats.recentlyCompleted.length > 0 ? (
            <section className="spt-card">
              <h4 className="spt-recent-title">
                <Award size={17} strokeWidth={2} aria-hidden />
                Hoàn thành gần đây
              </h4>
              <ul className="spt-recent-list">
                {stats.recentlyCompleted.map((lesson) => {
                  const lessonDetail = lessons.find((l) => l.id === lesson.courseLessonId);
                  const title =
                    lessonDetail?.videoTitle ??
                    lessonDetail?.lessonTitle ??
                    lesson.videoTitle ??
                    'Bài học';
                  return (
                    <li key={lesson.courseLessonId} className="spt-recent-item">
                      <div className="spt-recent-icon" aria-hidden>
                        <CheckCircle size={14} strokeWidth={2.5} />
                      </div>
                      <div className="spt-recent-text">
                        <div className="spt-recent-name">{title}</div>
                        {lesson.completedAt ? (
                          <div className="spt-recent-date">{formatDate(lesson.completedAt)}</div>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {stats.totalLessons > 0 && stats.completedLessons >= stats.totalLessons ? (
            <section className="spt-complete">
              <div className="spt-complete-icon" aria-hidden>
                <Sparkles size={22} strokeWidth={2} />
              </div>
              <h3>Chúc mừng!</h3>
              <p>Bạn đã hoàn thành tất cả bài học trong khóa học này.</p>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

export default StudentProgressTab;
