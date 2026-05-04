import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  CheckCircle,
  ChevronDown,
  Clock,
  Download,
  FileText,
  Paperclip,
  Play,
} from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';
import { UI_TEXT } from '../../../constants/uiText';
import { useToast } from '../../../context/ToastContext';
import {
  useCourseLessons,
  useCourseProgress,
  useCustomCourseSections,
  useMarkLessonComplete,
  useUpdateProgress,
} from '../../../hooks/useCourses';
import { useChaptersBySubject } from '../../../hooks/useChapters';
import { VideoUploadService } from '../../../services/api/videoUpload.service';
import type { CourseLessonResponse } from '../../../types';
import { extractChapterNumber, sortCurriculumGroups } from '../../../utils/curriculum';
import {
  downloadAllCourseMaterials,
  downloadCourseMaterial,
  formatBytes,
  inferFileKind,
  parseLessonMaterials,
  type LessonMaterial,
} from '../../../utils/materialDownload';
import './StudentLessonsTab.css';

interface StudentLessonsTabProps {
  enrollmentId: string;
  courseId: string;
  enrollmentStatus: string;
}

// Inline Video Player Component
const InlinePlayer: React.FC<{
  courseId: string;
  courseLessonId: string;
  title: string;
  initialTime?: number;
  onTimeUpdate?: (time: number) => void;
  onLessonComplete: () => void;
}> = ({ courseId, courseLessonId, title, initialTime = 0, onTimeUpdate, onLessonComplete }) => {
  const videoUrlQuery = useQuery({
    queryKey: ['course-lesson-video', 'student', courseId, courseLessonId],
    queryFn: () => VideoUploadService.getVideoUrl(courseId, courseLessonId),
    staleTime: 5 * 60_000,
    enabled: !!courseId && !!courseLessonId,
  });
  const videoUrl = videoUrlQuery.data?.result ?? null;
  const loading = videoUrlQuery.isLoading || videoUrlQuery.isFetching;
  const error = videoUrlQuery.error instanceof Error ? videoUrlQuery.error.message : '';

  return (
    <div
      style={{
        background: '#000',
        borderRadius: '18px',
        overflow: 'hidden',
        width: '100%',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      }}
    >
      <div
        style={{
          aspectRatio: '16/9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {loading && <p style={{ color: '#94a3b8', fontWeight: 600 }}>Đang tải video...</p>}
        {error && <p style={{ color: '#f87171', fontWeight: 600 }}>{error}</p>}
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
      <div
        style={{ padding: '1.25rem 1.5rem', background: '#fff', borderBottom: '1px solid #f0eee6' }}
      >
        <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#141413' }}>
          {title}
        </h3>
      </div>
    </div>
  );
};

const StudentLessonsTab: React.FC<StudentLessonsTabProps> = ({
  enrollmentId,
  courseId,
  enrollmentStatus,
}) => {
  const { showToast } = useToast();
  const { data: lessonsData, isLoading: loadingLessons } = useCourseLessons(courseId);
  const { data: sectionsData } = useCustomCourseSections(courseId);
  const { data: progressData } = useCourseProgress(enrollmentId);
  const markComplete = useMarkLessonComplete();
  const updateProgress = useUpdateProgress();
  const [playingLessonId, setPlayingLessonId] = useState<string | null>(null);
  const [showResources, setShowResources] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Throttle updates to avoid spamming the backend
  const lastUpdateTimeRef = useRef(0);

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
        lessons: CourseLessonResponse[];
        type: 'SECTION' | 'CHAPTER' | 'OTHER';
        firstSeenIndex: number;
        orderIndex?: number;
      }
    > = {};

    const sectionOrderMap = new Map(
      sections.map((section, index) => [section.id, section.orderIndex ?? index + 1] as const)
    );

    lessons.forEach((lesson, index) => {
      const section = sections.find((s) => s.id === lesson.sectionId);
      const groupId = lesson.sectionId || lesson.chapterId || 'no-group';
      const groupTitle =
        section?.title ||
        lesson.chapterTitle ||
        (lesson.sectionId ? 'Mục chưa đặt tên' : lesson.chapterId ? 'Chương chưa đặt tên' : 'Khác');
      const groupType = lesson.sectionId ? 'SECTION' : lesson.chapterId ? 'CHAPTER' : 'OTHER';

      if (!groupsMap[groupId]) {
        groupsMap[groupId] = {
          id: groupId,
          title: groupTitle,
          lessons: [],
          type: groupType,
          firstSeenIndex: index,
          orderIndex: groupType === 'SECTION' ? sectionOrderMap.get(groupId) : undefined,
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
  }, [lessons, sections]);

  const progress = progressData?.result;
  const currentLesson = lessons.find((l) => l.id === playingLessonId);

  const completedCount = progress?.completedLessons ?? 0;
  const totalCount = lessons.length;

  const toggleSection = (sId: string) => {
    setCollapsedSections((prev) => ({ ...prev, [sId]: !prev[sId] }));
  };

  const handleDownloadMaterial = async (lesson: CourseLessonResponse, material: LessonMaterial) => {
    const result = await downloadCourseMaterial(courseId, lesson.id, material);
    if (!result.ok) {
      showToast({ type: 'error', message: result.message });
    }
  };

  const handleDownloadAll = async (lesson: CourseLessonResponse) => {
    const result = await downloadAllCourseMaterials(courseId, lesson.id);
    if (!result.ok) {
      showToast({ type: 'error', message: result.message });
    }
  };

  const handleLessonSelect = (lesson: CourseLessonResponse) => {
    setPlayingLessonId(lesson.id);
    document.querySelector('.course-tabs')?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderCurriculum = (isSidebar = false) => {
    if (curriculumHierarchy.length === 0) {
      return isSidebar ? null : (
        <div className="slt-empty">
          <BookOpen size={48} strokeWidth={1} style={{ marginBottom: 8 }} />
          <p>Chưa có bài học nào.</p>
        </div>
      );
    }

    return curriculumHierarchy.map((group, idx) => (
      <div key={group.id}>
        <div className="slt-section-header" onClick={() => toggleSection(group.id)}>
          <div className="slt-section-title-area">
            <ChevronDown
              size={18}
              style={{
                transform: collapsedSections[group.id] ? 'rotate(-90deg)' : 'none',
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
            <span className="slt-section-label">
              {group.type === 'CHAPTER'
                ? (() => {
                    const num = extractChapterNumber(group.title) ?? extractChapterNumber(group.id);
                    return num !== null ? `Chương ${num}` : `Chương ${idx + 1}`;
                  })()
                : group.type === 'SECTION'
                  ? `Phần ${idx + 1}`
                  : 'Khác'}
            </span>
            <span className="slt-section-title">{group.title}</span>
          </div>
          {!isSidebar && (
            <div className="slt-section-meta">
              <span>{group.lessons.length} bài học</span>
            </div>
          )}
        </div>
        <div className={`slt-lessons-group ${collapsedSections[group.id] ? 'collapsed' : ''}`}>
          {group.lessons.map((l) => renderLessonItem(l, isSidebar))}
        </div>
      </div>
    ));
  };

  const renderLessonItem = (lesson: CourseLessonResponse, isSidebar = false) => {
    const lessonProgress = progress?.lessons.find((l) => l.courseLessonId === lesson.id);
    const progressPercent = lessonProgress?.progressPercent ?? 0;
    const isCompleted = (lessonProgress?.isCompleted ?? false) || progressPercent >= 90;
    const isInProgress = !isCompleted && progressPercent > 0;
    const isPlaying = lesson.id === playingLessonId;

    const materialsList = parseLessonMaterials(lesson.materials);

    const statusClass = isCompleted
      ? 'completed'
      : isPlaying
        ? 'playing'
        : isInProgress
          ? 'in-progress'
          : 'default';

    return (
      <div key={lesson.id}>
        <div
          className={`slt-lesson-item ${statusClass}`}
          onClick={() => handleLessonSelect(lesson)}
        >
          <div className="slt-lesson-icon">
            {isCompleted ? (
              <CheckCircle size={18} />
            ) : isInProgress && !isPlaying ? (
              <Clock size={18} />
            ) : (
              <Play size={18} />
            )}
          </div>

          <div className="slt-lesson-content">
            <div className="slt-lesson-title-row">
              <span className="slt-lesson-title" title={lesson.lessonTitle ?? 'Bài học'}>
                {lesson.lessonTitle ?? 'Bài học'}
              </span>
              {isCompleted && <span className="slt-lesson-badge completed">Hoàn thành</span>}
              {isInProgress && !isCompleted && (
                <span className="slt-lesson-badge progress">
                  Đang học {Math.round(progressPercent)}%
                </span>
              )}
            </div>

            {lesson.videoTitle && lesson.videoTitle !== lesson.lessonTitle && (
              <div className="slt-lesson-subtitle" title={lesson.videoTitle}>
                {lesson.videoTitle}
              </div>
            )}

            {!isSidebar && (
              <div className="slt-lesson-meta">
                {lesson.durationSeconds && (
                  <div className="slt-lesson-meta-item">
                    <Clock size={12} />
                    {Math.floor(lesson.durationSeconds / 60)} phút
                  </div>
                )}
                {materialsList.length > 0 && (
                  <div
                    className="slt-lesson-meta-item slt-materials-toggle"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowResources(showResources === lesson.id ? null : lesson.id);
                    }}
                  >
                    <Paperclip size={12} /> {materialsList.length} tài liệu
                  </div>
                )}
              </div>
            )}
          </div>

          {!isSidebar && (
            <div style={{ flexShrink: 0 }}>
              {!isCompleted && enrollmentStatus === 'ACTIVE' && (
                <button
                  className="slt-btn-small"
                  onClick={(e) => {
                    e.stopPropagation();
                    markComplete.mutate({ enrollmentId, courseLessonId: lesson.id });
                  }}
                  disabled={markComplete.isPending}
                >
                  Đánh dấu Xong
                </button>
              )}
            </div>
          )}
        </div>

        {/* Materials List */}
        {!isSidebar && showResources === lesson.id && materialsList.length > 0 && (
          <div className="slt-materials-drawer">
            {materialsList.map((m: LessonMaterial) => (
              <button
                key={m.id ?? m.url}
                type="button"
                className="slt-material-btn"
                onClick={() => void handleDownloadMaterial(lesson, m)}
                title={m.name}
              >
                <FileText size={16} style={{ color: '#3b82f6', flexShrink: 0 }} />
                <span className="slt-material-kind">{inferFileKind(m)}</span>
                <span className="slt-material-name">{m.name}</span>
                <span className="slt-material-size">{formatBytes(m.size)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="slt-container">
      {playingLessonId && currentLesson ? (
        /* Integrated Player Layout */
        <div className="slt-player-container">
          {/* Main Player Area */}
          <div className="slt-player-main">
            <InlinePlayer
              courseId={courseId}
              courseLessonId={playingLessonId}
              title={
                currentLesson.lessonTitle &&
                currentLesson.videoTitle &&
                currentLesson.lessonTitle !== currentLesson.videoTitle
                  ? `${currentLesson.lessonTitle} - ${currentLesson.videoTitle}`
                  : (currentLesson.lessonTitle ?? currentLesson.videoTitle ?? 'Bài học')
              }
              initialTime={
                progress?.lessons.find((l) => l.courseLessonId === playingLessonId)
                  ?.watchedSeconds ?? 0
              }
              onTimeUpdate={(time) => {
                const now = Date.now();
                // Update roughly every 5 seconds
                if (now - lastUpdateTimeRef.current > 5000) {
                  lastUpdateTimeRef.current = now;
                  updateProgress.mutate({
                    enrollmentId,
                    courseLessonId: playingLessonId,
                    watchedSeconds: time,
                  });
                }
              }}
              onLessonComplete={() => {
                const lp = progress?.lessons.find((l) => l.courseLessonId === playingLessonId);
                // 1. Mark current as complete if not already
                if (!lp?.isCompleted) {
                  markComplete.mutate({ enrollmentId, courseLessonId: playingLessonId });
                }

                // Make sure we save the final duration as progress too
                if (currentLesson.durationSeconds) {
                  updateProgress.mutate({
                    enrollmentId,
                    courseLessonId: playingLessonId,
                    watchedSeconds: currentLesson.durationSeconds,
                  });
                }

                // 2. Auto-play next lesson
                const currentIndex = lessons.findIndex((l) => l.id === playingLessonId);
                if (currentIndex !== -1 && currentIndex < lessons.length - 1) {
                  const nextLesson = lessons[currentIndex + 1];
                  setPlayingLessonId(nextLesson.id);
                }
              }}
            />

            {/* Resources Tab below video */}
            <div className="slt-resources-card">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  margin: '0 0 1.25rem',
                  flexWrap: 'wrap',
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '1.2rem',
                    color: '#141413',
                  }}
                >
                  <Paperclip size={20} color="#3b82f6" /> Tài liệu đính kèm
                </h4>
                {parseLessonMaterials(currentLesson.materials).length > 1 && (
                  <button
                    type="button"
                    className="slt-btn-small"
                    onClick={() => void handleDownloadAll(currentLesson)}
                  >
                    <Download size={14} /> Tải tất cả (zip)
                  </button>
                )}
              </div>
              {(() => {
                const items = parseLessonMaterials(currentLesson.materials);
                if (items.length === 0) {
                  return (
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#87867f', fontStyle: 'italic' }}>
                      Bài học này chưa có tài liệu đính kèm.
                    </p>
                  );
                }
                return (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                      gap: '0.75rem',
                    }}
                  >
                    {items.map((m: LessonMaterial) => (
                      <button
                        key={m.id ?? m.url}
                        type="button"
                        className="slt-material-card"
                        onClick={() => void handleDownloadMaterial(currentLesson, m)}
                        title={m.name}
                      >
                        <span className="slt-material-card-kind">{inferFileKind(m)}</span>
                        <span className="slt-material-card-name">{m.name}</span>
                        <span className="slt-material-card-meta">
                          {formatBytes(m.size)}
                          {m.uploadedAt
                            ? ` • ${new Date(m.uploadedAt).toLocaleDateString('vi-VN')}`
                            : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>

            <button
              className="slt-btn secondary"
              onClick={() => setPlayingLessonId(null)}
              style={{ alignSelf: 'flex-start' }}
            >
              Thoát chế độ học
            </button>
          </div>

          {/* Sidebar Curriculum */}
          <div className="slt-player-sidebar slt-sidebar-override">
            <div className="slt-sidebar-header">
              <h4>Nội dung khóa học</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                {completedCount}/{totalCount} bài học hoàn thành
              </p>
            </div>
            <div className="slt-sidebar-content">{renderCurriculum(true)}</div>
          </div>
        </div>
      ) : (
        /* Regular Dashboard List Layout */
        <>
          <div className="slt-stats-grid">
            <div className="slt-stat-card slt-stat-blue">
              <div className="slt-stat-icon">
                <BookOpen size={24} strokeWidth={2.5} />
              </div>
              <div className="slt-stat-content">
                <h3>{totalCount}</h3>
                <p>{UI_TEXT.TOTAL_LESSONS}</p>
              </div>
            </div>
            <div className="slt-stat-card slt-stat-emerald">
              <div className="slt-stat-icon">
                <CheckCircle size={24} strokeWidth={2.5} />
              </div>
              <div className="slt-stat-content">
                <h3>{completedCount}</h3>
                <p>Đã hoàn thành</p>
              </div>
            </div>
          </div>

          {loadingLessons ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: '80px',
                    background: '#f1f5f9',
                    borderRadius: '12px',
                    animation: 'pulse 2s infinite',
                  }}
                />
              ))}
            </div>
          ) : lessons.length === 0 ? (
            <div className="slt-empty">
              <BookOpen size={56} strokeWidth={1} style={{ marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 500 }}>
                Chưa có bài học nào trong khóa học này.
              </p>
            </div>
          ) : (
            <div className="slt-curriculum-card">
              <div className="slt-curriculum-header">
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#141413' }}>
                  {UI_TEXT.COURSE_CONTENT}
                </h4>
              </div>
              <div>{renderCurriculum()}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentLessonsTab;
