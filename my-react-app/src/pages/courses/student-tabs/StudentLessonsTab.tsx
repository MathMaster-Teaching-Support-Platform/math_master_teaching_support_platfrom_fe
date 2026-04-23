import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  CheckCircle,
  Clock,
  Play,
  Paperclip,
  FileText,
  Layout,
  ChevronDown,
} from 'lucide-react';
import {
  useCourseLessons,
  useCourseProgress,
  useMarkLessonComplete,
  useUpdateProgress,
  useCustomCourseSections,
} from '../../../hooks/useCourses';
import { CourseService } from '../../../services/api/course.service';
import { VideoUploadService } from '../../../services/api/videoUpload.service';
import type { CourseLessonResponse } from '../../../types';
import '../../../styles/module-refactor.css';
import '../StudentCourses.css';

interface StudentLessonsTabProps {
  enrollmentId: string;
  courseId: string;
  enrollmentStatus: string;
}

type LessonMaterial = {
  id?: string;
  name?: string;
  url?: string;
  size?: number;
};

const parseLessonMaterials = (materials?: string | null): LessonMaterial[] => {
  if (!materials) return [];

  try {
    const parsed = JSON.parse(materials);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const triggerFileDownload = (url: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.rel = 'noopener noreferrer';
  link.target = '_self';
  document.body.appendChild(link);
  link.click();
  link.remove();
};

// Inline Video Player Component
const InlinePlayer: React.FC<{
  courseId: string;
  courseLessonId: string;
  title: string;
  initialTime?: number;
  onTimeUpdate?: (time: number) => void;
  onLessonComplete: () => void;
}> = ({ courseId, courseLessonId, title, initialTime = 0, onTimeUpdate, onLessonComplete }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    VideoUploadService.getVideoUrl(courseId, courseLessonId)
      .then((r) => setVideoUrl(r.result))
      .catch((e) => setError(e instanceof Error ? e.message : 'Không thể tải video'))
      .finally(() => setLoading(false));
  }, [courseId, courseLessonId]);

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
            onError={() => setError('Không thể phát video. Vui lòng thử lại.')}
          />
        )}
      </div>
      <div style={{ padding: '1rem', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--mod-ink)' }}>
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

  // Group lessons by section OR chapter
  const curriculumHierarchy = useMemo(() => {
    const groups: Array<{
      id: string;
      title: string;
      lessons: CourseLessonResponse[];
      type: 'SECTION' | 'CHAPTER' | 'OTHER';
    }> = [];

    lessons.forEach((lesson) => {
      const section = sections.find((s) => s.id === lesson.sectionId);
      const groupId = lesson.sectionId || lesson.chapterId || 'no-group';
      const groupTitle =
        section?.title ||
        lesson.chapterTitle ||
        (lesson.sectionId ? 'Mục chưa đặt tên' : lesson.chapterId ? 'Chương chưa đặt tên' : 'Khác');
      const groupType = lesson.sectionId ? 'SECTION' : lesson.chapterId ? 'CHAPTER' : 'OTHER';

      let group = groups.find((g) => g.id === groupId);
      if (!group) {
        group = { id: groupId, title: groupTitle, lessons: [], type: groupType };
        groups.push(group);
      }
      group.lessons.push(lesson);
    });

    return groups;
  }, [lessons, sections]);

  const progress = progressData?.result;
  const currentLesson = lessons.find((l) => l.id === playingLessonId);

  const completedCount = progress?.completedLessons ?? 0;
  const totalCount = lessons.length;

  const toggleSection = (sId: string) => {
    setCollapsedSections((prev) => ({ ...prev, [sId]: !prev[sId] }));
  };

  const handleDownloadMaterial = async (lesson: CourseLessonResponse, material: LessonMaterial) => {
    if (!material.id) {
      if (material.url) {
        triggerFileDownload(material.url);
      }
      return;
    }

    try {
      const response = await CourseService.getMaterialDownloadUrl(courseId, lesson.id, material.id);
      if (response.result) {
        triggerFileDownload(response.result);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể tải tài liệu.';
      window.alert(message);
    }
  };

  const handleLessonSelect = (lesson: CourseLessonResponse) => {
    setPlayingLessonId(lesson.id);
    document.querySelector('.course-tabs')?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderCurriculum = (isSidebar = false) => {
    if (curriculumHierarchy.length === 0) {
      return isSidebar ? null : (
        <div className="empty">
          <BookOpen size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
          <p>Chưa có bài học nào.</p>
        </div>
      );
    }

    return curriculumHierarchy.map((group, idx) => (
      <div key={group.id}>
        <div
          className="section-header"
          onClick={() => toggleSection(group.id)}
          style={isSidebar ? { padding: '0.65rem 1rem', background: '#f8fafc' } : {}}
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
                ? `Chương ${idx + 1}`
                : group.type === 'SECTION'
                  ? `Mục ${idx + 1}`
                  : 'Khác'}
            </span>
            <span className="section-title" style={isSidebar ? { fontSize: '0.82rem' } : {}}>
              {group.title}
            </span>
          </div>
          {!isSidebar && (
            <div className="section-meta">
              <span>{group.lessons.length} bài học</span>
            </div>
          )}
        </div>
        <div className={`lessons-group ${collapsedSections[group.id] ? 'collapsed' : ''}`}>
          {group.lessons.map((l) => renderLessonItem(l, isSidebar))}
        </div>
      </div>
    ));
  };

  const renderLessonItem = (lesson: CourseLessonResponse, isSidebar = false) => {
    const lessonProgress = progress?.lessons.find((l) => l.courseLessonId === lesson.id);
    const isCompleted = lessonProgress?.isCompleted ?? false;
    const isPlaying = lesson.id === playingLessonId;

    const materialsList = parseLessonMaterials(lesson.materials);

    return (
      <div key={lesson.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
        <div
          onClick={() => handleLessonSelect(lesson)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: isSidebar ? '0.65rem 1rem' : '0.85rem 1.2rem',
            background: isPlaying ? '#eff6ff' : isCompleted ? '#f0fdf4' : '#fff',
            cursor: 'pointer',
            borderLeft: isPlaying ? '4px solid #1f5eff' : '4px solid transparent',
            transition: 'all 0.2s ease',
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isCompleted ? '#dcfce7' : isPlaying ? '#1f5eff' : '#e8eef8',
              color: isCompleted ? '#15803d' : isPlaying ? '#fff' : '#60748f',
            }}
          >
            {isCompleted ? <CheckCircle size={16} /> : <Play size={16} />}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: isSidebar ? '0.8rem' : '0.88rem',
                fontWeight: isPlaying || isCompleted ? 700 : 600,
                color: isPlaying ? '#1e40af' : 'var(--mod-ink)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {lesson.videoTitle ?? lesson.lessonTitle ?? 'Bài học'}
            </div>
            {!isSidebar && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
                {lesson.durationSeconds && (
                  <span className="muted" style={{ fontSize: '0.75rem' }}>
                    <Clock size={11} style={{ marginRight: 3 }} />
                    {Math.floor(lesson.durationSeconds / 60)} phút
                  </span>
                )}
                {materialsList.length > 0 && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: '#6366f1',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowResources(showResources === lesson.id ? null : lesson.id);
                    }}
                  >
                    <Paperclip size={11} /> {materialsList.length} tài liệu
                  </span>
                )}
              </div>
            )}
          </div>

          {!isSidebar && (
            <div style={{ flexShrink: 0 }}>
              {!isCompleted && enrollmentStatus === 'ACTIVE' && (
                <button
                  className="btn secondary"
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', height: 'fit-content' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    markComplete.mutate({ enrollmentId, courseLessonId: lesson.id });
                  }}
                  disabled={markComplete.isPending}
                >
                  Xong
                </button>
              )}
            </div>
          )}
        </div>

        {/* Materials List */}
        {!isSidebar && showResources === lesson.id && materialsList.length > 0 && (
          <div style={{ padding: '0.5rem 1.25rem 1rem 3.5rem', background: '#f8fafc' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {materialsList.map((m: LessonMaterial) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => void handleDownloadMaterial(lesson, m)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '0.8rem',
                    color: '#475569',
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <FileText size={13} style={{ color: '#1f5eff' }} />
                  <span>{m.name}</span>
                  <span className="muted" style={{ fontSize: '0.7rem' }}>
                    ({((m.size || 0) / 1024).toFixed(1)} KB)
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="lessons-tab">
      {playingLessonId && currentLesson ? (
        /* Integrated Player Layout */
        <div className="player-container">
          {/* Main Player Area */}
          <div className="player-main">
            <InlinePlayer
              courseId={courseId}
              courseLessonId={playingLessonId}
              title={currentLesson.videoTitle ?? currentLesson.lessonTitle ?? 'Bài học'}
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
            <div className="data-card" style={{ padding: '1.25rem' }}>
              <h4 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Paperclip size={18} color="#1f5eff" /> Tài liệu bài học
              </h4>
              {currentLesson.materials ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {parseLessonMaterials(currentLesson.materials).map((m: LessonMaterial) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => void handleDownloadMaterial(currentLesson, m)}
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
              Thoát chế độ học
            </button>
          </div>

          {/* Sidebar Curriculum */}
          <div className="data-card player-sidebar">
            <div
              style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', background: '#f8fbff' }}
            >
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>Nội dung khóa học</h4>
              <p className="muted" style={{ fontSize: '0.75rem', marginTop: 4 }}>
                {completedCount}/{totalCount} bài học hoàn thành
              </p>
            </div>
            <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
              {renderCurriculum(true)}
            </div>
          </div>
        </div>
      ) : (
        /* Regular Dashboard List Layout */
        <>
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
          </div>

          {loadingLessons ? (
            <div className="skeleton-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-card" />
              ))}
            </div>
          ) : lessons.length === 0 ? (
            <div className="empty">
              <BookOpen size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p>Chưa có bài học nào.</p>
            </div>
          ) : (
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
                  Giáo trình học tập
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
    </div>
  );
};

export default StudentLessonsTab;
