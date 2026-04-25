import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardList,
  Clock3,
  Flame,
  GraduationCap,
  LoaderCircle,
  Map,
  PencilLine,
  Star,
  Target,
  Trophy,
  Wallet,
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout/DashboardLayout';
import { useRoadmaps } from '../../../hooks/useRoadmaps';
<<<<<<< HEAD
import { AuthService } from '../../../services/api/auth.service';
import {
  StudentDashboardService,
  type StudentDashboardPayload,
} from '../../../services/api/student-dashboard.service';
import { TeacherProfileService } from '../../../services/api/teacher-profile.service';
=======
>>>>>>> 0f0f0fad8a5687050b023f12a297616edef2a506
import type { RoadmapCatalogItem } from '../../../types';

function normalizeRoadmaps(
  result:
    | RoadmapCatalogItem[]
    | { content?: RoadmapCatalogItem[]; items?: RoadmapCatalogItem[] }
    | undefined
): RoadmapCatalogItem[] {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.content)) return result.content;
  if (Array.isArray(result?.items)) return result.items;
  return [];
}

function getDaysRemaining(dueDate: string | null): number {
  if (!dueDate) return 0;
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86_400_000);
}

function getUrgencyInfo(days: number): { color: string; label: string } {
  if (days <= 3) return { color: '#B53333', label: `${Math.max(days, 0)}d` };
  if (days <= 7) return { color: '#C96442', label: `${days}d` };
  return { color: '#5E5D59', label: `${days}d` };
}

<<<<<<< HEAD
const ROADMAP_PAGE_SIZE = 9;
=======
// ─── SVG Icons ────────────────────────────────────────────────
const IBook = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
  </svg>
);
const ICheck = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const IStar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const ITarget = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);
const IBrain = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9.5 2A2.5 2.5 0 007 4.5v0A2.5 2.5 0 004.5 7h0a2.5 2.5 0 000 5h0A2.5 2.5 0 007 14.5v0A2.5 2.5 0 009.5 17" />
    <path d="M14.5 2A2.5 2.5 0 0117 4.5v0A2.5 2.5 0 0119.5 7h0a2.5 2.5 0 000 5h0A2.5 2.5 0 0117 14.5v0A2.5 2.5 0 0114.5 17" />
    <path d="M12 17v5M9 22h6" />
  </svg>
);
const IMap = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" y1="3" x2="9" y2="18" />
    <line x1="15" y1="6" x2="15" y2="21" />
  </svg>
);
const IWallet = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
    <circle cx="16" cy="13" r="2" fill="currentColor" stroke="none" />
  </svg>
);
const IGrade = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
  </svg>
);
const ITrophy = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0012 0V2z" />
  </svg>
);
const IClock = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const IChevron = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IEdit = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IFire = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5 0.67z" />
  </svg>
);
>>>>>>> 0f0f0fad8a5687050b023f12a297616edef2a506

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const roadmapsQuery = useRoadmaps();
<<<<<<< HEAD
  const [dashboardData, setDashboardData] = useState<StudentDashboardPayload | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [isTeacherApproved, setIsTeacherApproved] = useState(false);
=======

>>>>>>> 0f0f0fad8a5687050b023f12a297616edef2a506
  const [loading, setLoading] = useState(true);
  const [navigatingTaskId, setNavigatingTaskId] = useState<string | null>(null);
  const [roadmapPage, setRoadmapPage] = useState(1);

  useEffect(() => {
    let active = true;

    const fetchDashboard = async () => {
      setLoading(true);
      setDashboardError(null);
      try {
        const response = await StudentDashboardService.getDashboard();
        if (active) setDashboardData(response.result);
      } catch (error) {
        if (active) {
          setDashboardError(error instanceof Error ? error.message : 'Không thể tải dữ liệu');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDashboard();
    return () => {
      active = false;
    };
  }, []);



  const roadmapResult = roadmapsQuery.data?.result as
    | RoadmapCatalogItem[]
    | { content?: RoadmapCatalogItem[]; items?: RoadmapCatalogItem[] }
    | undefined;
  const roadmapList = normalizeRoadmaps(roadmapResult);
  const roadmapTotalPages = Math.max(1, Math.ceil(roadmapList.length / ROADMAP_PAGE_SIZE));
  const safeRoadmapPage = Math.min(roadmapPage, roadmapTotalPages);
  const paginatedRoadmaps = useMemo(() => {
    const start = (safeRoadmapPage - 1) * ROADMAP_PAGE_SIZE;
    return roadmapList.slice(start, start + ROADMAP_PAGE_SIZE);
  }, [roadmapList, safeRoadmapPage]);

  const summary = dashboardData?.summary;
  const weeklyActivity = dashboardData?.weeklyActivity;
  const recentGrades = dashboardData?.recentGrades ?? [];
  const upcomingTasks = dashboardData?.upcomingTasks ?? [];
  const learningProgress = dashboardData?.learningProgress ?? [];
  const streak = dashboardData?.streak;

  const statsCards = useMemo(
    () => [
      { icon: BookOpen, label: 'Giáo trình đang học', value: summary?.stats.enrolledCourses ?? 0 },
      {
        icon: CheckCircle2,
        label: 'Bài tập hoàn thành',
        value: summary?.stats.completedAssignments ?? 0,
      },
      { icon: Star, label: 'Điểm trung bình', value: summary?.stats.averageScore ?? 0 },
      { icon: Target, label: 'Bài tập cần làm', value: summary?.stats.pendingAssignments ?? 0 },
    ],
    [summary]
  );

  const quickActions = [
    { icon: GraduationCap, label: 'Học bài mới', path: '/student/courses' },
    { icon: Bot, label: 'Hỏi AI', path: '/ai/chat' },
    { icon: Map, label: 'Lộ trình', path: '/student/roadmap' },
    { icon: Wallet, label: 'Ví của tôi', path: '/student/wallet' },
  ];

  const hour = new Date().getHours();
  let greeting = 'Chào buổi tối';
  if (hour < 12) greeting = 'Chào buổi sáng';
  else if (hour < 18) greeting = 'Chào buổi chiều';

  return (
    <DashboardLayout
      role="student"
      contentClassName="dashboard-content--flush-bleed"
      user={{
        name: summary?.student.name ?? 'Học viên',
        avatar: summary?.student.avatar ?? '',
        role: 'student',
      }}
      notificationCount={summary?.notificationCount ?? 0}
    >
<<<<<<< HEAD
      <div className="flex-1 bg-[#F5F4ED] p-4 font-[Be_Vietnam_Pro] text-[#141413] md:p-6 lg:p-8">
        {isTeacherApproved && (
          <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl bg-[#FAF9F5] p-5 shadow-[0px_0px_0px_1px_#D1CFC5] transition-all duration-150 hover:shadow-[0px_0px_0px_1px_#C2C0B6] md:flex-row md:items-center">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-[#E8E6DC] p-2 text-[#5E5D59]">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <h3
                  className="font-[Playfair_Display] text-[25px] font-medium leading-[1.2]"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 500 }}
                >
                  Bạn đã được duyệt làm Giáo viên!
                </h3>
                <p className="mt-1 text-[15px] leading-[1.6] text-[#5E5D59]">
                  Bắt đầu tạo nội dung và quản lý lớp học ngay hôm nay.
                </p>
              </div>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-[#C96442] px-4 py-2.5 font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#FAF9F5] shadow-[0px_0px_0px_1px_#C96442] transition-all duration-150 hover:brightness-95 focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2 active:scale-[0.98]"
              onClick={() => navigate('/teacher/dashboard')}
              aria-label="Chuyển sang giao diện Giáo viên"
            >
              Chuyển vai trò <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
=======
      <div className="sd-page">

>>>>>>> 0f0f0fad8a5687050b023f12a297616edef2a506

        <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl bg-[#FAF9F5] p-5 shadow-[0px_0px_0px_1px_#F0EEE6] md:flex-row md:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#E8E6DC] px-3 py-1 text-[12px] font-medium text-[#4D4C48]">
              <Clock3 className="h-3.5 w-3.5" /> {greeting}
            </div>
            <h1
              className="font-[Playfair_Display] text-[36px] font-medium leading-[1.2] text-[#141413]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 500 }}
            >
              {summary?.student.name ?? 'Học viên'}
            </h1>
            <p className="mt-1 text-[16px] leading-[1.6] text-[#5E5D59]">
              Hôm nay bạn có <strong>{summary?.todayTaskCount ?? 0} bài tập</strong> cần hoàn thành.
              Hãy cùng chinh phục nào!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-[#141413] px-4 py-2.5 font-[Be_Vietnam_Pro] text-[14px] font-medium text-[#B0AEA5] transition-colors duration-150 hover:bg-[#30302E] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2 active:scale-[0.98]"
              onClick={() => navigate('/ai/chat')}
              aria-label="Chat với AI"
            >
              <Brain className="h-4 w-4" /> <span>Hỏi AI</span>
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-[#E8E6DC] px-4 py-2.5 font-[Be_Vietnam_Pro] text-[14px] font-medium text-[#4D4C48] shadow-[0px_0px_0px_1px_#D1CFC5] transition-all duration-150 hover:shadow-[0px_0px_0px_1px_#C2C0B6] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2 active:scale-[0.98]"
              onClick={() => navigate('/student/courses')}
              aria-label="Học bài mới"
            >
              <BookOpen className="h-4 w-4" /> <span>Học bài mới</span>
            </button>
          </div>
        </div>

        {dashboardError && (
          <p className="mb-4 rounded-xl bg-[#FAF9F5] p-3 text-[14px] text-[#B53333] shadow-[0px_0px_0px_1px_#E8E6DC]">
            Không thể tải dữ liệu bảng tổng quan.
          </p>
        )}

        <ul
          className="mb-6 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 xl:grid-cols-4"
          aria-label="Thống kê học tập"
        >
          {loading
            ? ['stat-a', 'stat-b', 'stat-c', 'stat-d'].map((s) => (
                <li
                  key={s}
                  className="h-[132px] animate-pulse rounded-2xl bg-[#FAF9F5] shadow-[0px_0px_0px_1px_#F0EEE6]"
                />
              ))
            : statsCards.map((item) => {
                const Icon = item.icon;
                return (
                  <li
                    key={item.label}
                    className="rounded-2xl bg-[#FAF9F5] p-5 shadow-[0px_0px_0px_1px_#F0EEE6] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0px_0px_0px_1px_#D1CFC5]"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <span className="rounded-xl bg-[#E8E6DC] p-2 text-[#5E5D59]">
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                    <p className="text-[30px] font-bold tabular-nums text-[#141413]">
                      {item.label === 'Điểm trung bình' ? item.value.toFixed(1) : item.value}
                    </p>
                    <p className="mt-1 text-[12px] uppercase tracking-[0.5px] text-[#87867F]">
                      {item.label}
                    </p>
                  </li>
                );
              })}
        </ul>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            <div className="rounded-2xl bg-[#FAF9F5] p-5 shadow-[0px_0px_0px_1px_#F0EEE6]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2
                  className="flex items-center gap-2 font-[Playfair_Display] text-[25px] font-medium"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 500 }}
                >
                  <PencilLine className="h-5 w-5 text-[#5E5D59]" /> Bài tập sắp tới
                </h2>
                <Link
                  to="/student/assessments"
                  className="inline-flex items-center gap-1 font-[Be_Vietnam_Pro] text-[14px] font-medium text-[#3D3D3A] transition-colors duration-150 hover:text-[#C96442] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2 active:scale-[0.98]"
                  aria-label="Xem tất cả bài kiểm tra"
                >
                  Xem tất cả <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {upcomingTasks.map((task) => {
                  const days = getDaysRemaining(task.dueDate);
                  const urg = getUrgencyInfo(days);
                  return (
                    <div
                      key={task.id}
                      className="rounded-xl border border-[#E8E6DC] bg-[#FAF9F5] p-3 transition-all duration-150 hover:shadow-[0px_0px_0px_1px_#D1CFC5]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-[#141413]">{task.title}</p>
                          <div className="mt-1 flex items-center gap-2 text-[13px] text-[#87867F]">
                            <span className="rounded-full bg-[#F0EEE6] px-2 py-0.5 text-[#4D4C48]">
                              {task.subject}
                            </span>
                            <span>
                              Hạn:{' '}
                              {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString('vi-VN')
                                : 'Chưa có'}
                            </span>
                          </div>
                        </div>
                        <div
                          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-medium"
                          style={{ background: `${urg.color}1A`, color: urg.color }}
                        >
                          <Clock3 className="h-3.5 w-3.5" />
                          {urg.label}
                        </div>
                      </div>
                      {task.progressPercent > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E8E6DC]">
                            <div
                              className="h-full rounded-full bg-[#C96442] transition-all duration-500"
                              style={{ width: `${task.progressPercent}%` }}
                            />
                          </div>
                          <span className="text-[12px] font-semibold text-[#C96442]">
                            {task.progressPercent}%
                          </span>
                        </div>
                      )}
                      <button
                        className="mt-3 inline-flex items-center gap-1 rounded-xl bg-[#E8E6DC] px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#4D4C48] shadow-[0px_0px_0px_1px_#D1CFC5] transition-all duration-150 hover:shadow-[0px_0px_0px_1px_#C2C0B6] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2 active:scale-[0.98]"
                        onClick={() => {
                          setNavigatingTaskId(task.id);
                          navigate('/student/assessments');
                        }}
                        aria-label={`Làm bài: ${task.title}`}
                        disabled={navigatingTaskId === task.id}
                      >
                        {navigatingTaskId === task.id ? (
                          <>
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Đang mở...
                          </>
                        ) : (
                          'Làm bài'
                        )}
                      </button>
                    </div>
                  );
                })}
                {upcomingTasks.length === 0 && (
                  <p className="text-[14px] text-[#87867F]">
                    Hiện chưa có bài tập nào đang chờ làm.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-[#FAF9F5] p-5 shadow-[0px_0px_0px_1px_#F0EEE6]">
              <h2
                className="mb-4 flex items-center gap-2 font-[Playfair_Display] text-[25px] font-medium"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 500 }}
              >
                <ClipboardList className="h-5 w-5 text-[#5E5D59]" /> Tiến độ học tập
              </h2>
              <div className="space-y-3">
                {learningProgress.map((lp) => (
                  <div key={lp.subject}>
                    <div className="mb-1 flex items-center justify-between text-[14px]">
                      <span className="font-medium text-[#141413]">{lp.subject}</span>
                      <span className="text-[#87867F]">
                        {lp.doneLessons}/{lp.totalLessons} bài · <strong>{lp.percent}%</strong>
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#E8E6DC]">
                      <div
                        className="h-full rounded-full bg-[#C96442] transition-all duration-500"
                        style={{ width: `${lp.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
                {learningProgress.length === 0 && (
                  <p className="text-[14px] text-[#87867F]">Chưa có dữ liệu tiến độ học tập.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-[#FAF9F5] p-5 shadow-[0px_0px_0px_1px_#F0EEE6]">
              <div className="mb-2 inline-flex rounded-xl bg-[#E8E6DC] p-2 text-[#5E5D59]">
                <Trophy className="h-5 w-5" />
              </div>
              <p className="text-[16px] text-[#5E5D59]">
                Còn <strong>{summary?.motivation.remainingAssignments ?? 0} bài</strong> nữa là đạt
                mục tiêu tháng!
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E8E6DC]">
                <div
                  className="h-full rounded-full bg-[#C96442] transition-all duration-500"
                  style={{ width: `${summary?.motivation.progressPercent ?? 0}%` }}
                />
              </div>
              <p className="mt-2 text-[13px] text-[#87867F]">
                Mục tiêu: {summary?.motivation.goalAssignments ?? 0} bài tập · Đã hoàn thành:{' '}
                {summary?.motivation.completedAssignments ?? 0}
              </p>
            </div>

            <div className="rounded-2xl bg-[#FAF9F5] p-5 shadow-[0px_0px_0px_1px_#F0EEE6]">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2
                  className="flex items-center gap-2 font-[Playfair_Display] text-[25px] font-medium"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 500 }}
                >
                  <Star className="h-5 w-5 text-[#5E5D59]" /> Điểm số gần đây
                </h2>
                <Link
                  to="/student/assessments"
                  className="inline-flex items-center gap-1 font-[Be_Vietnam_Pro] text-[14px] font-medium text-[#3D3D3A] transition-colors duration-150 hover:text-[#C96442] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2 active:scale-[0.98]"
                  aria-label="Xem tất cả điểm số"
                >
                  Xem tất cả <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="space-y-2">
                {recentGrades.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between rounded-xl border border-[#E8E6DC] p-3"
                  >
                    <div>
                      <p className="text-[14px] font-medium text-[#141413]">{g.title}</p>
                      <p className="text-[12px] text-[#87867F]">
                        {g.subject} · {new Date(g.gradedAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#F0EEE6] px-2.5 py-1 text-[12px] font-semibold text-[#4D4C48]">
                      {g.score.toFixed(1)}
                    </span>
                  </div>
                ))}
                {recentGrades.length === 0 && (
                  <p className="text-[14px] text-[#87867F]">Chưa có điểm số nào gần đây.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-[#FAF9F5] p-5 shadow-[0px_0px_0px_1px_#F0EEE6]">
              <div className="mb-3 flex items-center justify-between">
                <h2
                  className="flex items-center gap-2 font-[Playfair_Display] text-[25px] font-medium"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 500 }}
                >
                  <Flame className="h-5 w-5 text-[#C96442]" /> Chuỗi học tập
                </h2>
                <span className="text-[13px] font-medium text-[#4D4C48]">
                  <strong>{streak?.currentStreakDays ?? 0}</strong> ngày
                </span>
              </div>
              <ul className="mb-2 flex list-none items-center justify-between gap-2 p-0">
                {(streak?.days ?? []).map((day) => (
                  <li key={day.dayLabel} className="flex flex-col items-center gap-1">
                    <Circle
                      className={`h-3.5 w-3.5 ${
                        day.active
                          ? 'fill-[#C96442] text-[#C96442]'
                          : 'fill-[#E8E6DC] text-[#E8E6DC]'
                      }`}
                    />
                    <span className="text-[11px] text-[#87867F]">{day.dayLabel}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[13px] text-[#5E5D59]">
                {streak?.message ?? 'Hãy duy trì nhịp học đều mỗi ngày.'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-[#FAF9F5] p-5 shadow-[0px_0px_0px_1px_#F0EEE6]">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2
              className="font-[Playfair_Display] text-[25px] font-medium"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 500 }}
            >
              Hoạt động học tập tuần này
            </h2>
            <span className="text-[12px] text-[#87867F]">
              {weeklyActivity
                ? `${new Date(weeklyActivity.range.from).toLocaleDateString('vi-VN')} – ${new Date(weeklyActivity.range.to).toLocaleDateString('vi-VN')}`
                : '—'}
            </span>
          </div>
          <div className="flex h-40 items-end gap-2" role="img" aria-label="Biểu đồ hoạt động tuần">
            {(weeklyActivity?.days ?? []).map((d) => {
              const max = Math.max(...(weeklyActivity?.days ?? []).map((x) => x.hours), 1);
              const h = (d.hours / max) * 100;
              return (
                <div key={d.dayLabel} className="flex flex-1 flex-col items-center gap-1">
                  <div className="h-28 w-full rounded-lg bg-[#E8E6DC] p-1">
                    <div
                      className="w-full rounded-md bg-[#C96442] transition-all duration-300"
                      style={{ height: `${h}%`, marginTop: `${100 - h}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-[#87867F]">{d.dayLabel}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[13px] text-[#5E5D59]">
            <strong>{weeklyActivity?.totalHours ?? 0}h</strong> tổng tuần này ·{' '}
            <strong>{weeklyActivity?.deltaPercentVsPreviousWeek ?? 0}%</strong> so tuần trước
          </p>
        </div>

        <div className="mt-4 rounded-2xl bg-[#FAF9F5] p-5 shadow-[0px_0px_0px_1px_#F0EEE6]">
          <h2
            className="mb-3 font-[Playfair_Display] text-[25px] font-medium"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 500 }}
          >
            Truy cập nhanh
          </h2>
          <ul className="grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((qa) => {
              const Icon = qa.icon;
              return (
                <li key={qa.label}>
                  <button
                    className="flex w-full items-center gap-2 rounded-xl bg-[#E8E6DC] px-3 py-2.5 text-left font-[Be_Vietnam_Pro] text-[14px] font-medium text-[#4D4C48] shadow-[0px_0px_0px_1px_#D1CFC5] transition-all duration-150 hover:shadow-[0px_0px_0px_1px_#C2C0B6] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2 active:scale-[0.98]"
                    onClick={() => navigate(qa.path)}
                    aria-label={qa.label}
                  >
                    <Icon className="h-4 w-4 text-[#5E5D59]" />
                    {qa.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-4 rounded-2xl bg-[#FAF9F5] p-5 shadow-[0px_0px_0px_1px_#F0EEE6]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2
              className="flex items-center gap-2 font-[Playfair_Display] text-[25px] font-medium"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 500 }}
            >
              <Map className="h-5 w-5 text-[#5E5D59]" /> Lộ trình học tập
            </h2>
            <Link
              to="/roadmaps"
              className="inline-flex items-center gap-1 font-[Be_Vietnam_Pro] text-[14px] font-medium text-[#3D3D3A] transition-colors duration-150 hover:text-[#C96442] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2 active:scale-[0.98]"
              aria-label="Xem tất cả lộ trình"
            >
              Xem tất cả <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {roadmapsQuery.isLoading && (
            <div className="rounded-xl border border-[#E8E6DC] bg-[#F5F4ED] p-4">
              <div className="mb-2 flex items-center gap-2 text-[14px] text-[#5E5D59]">
                <LoaderCircle className="h-4 w-4 animate-spin text-[#C96442]" />
                Đang tải lộ trình học...
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#E8E6DC]">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-[#C96442]" />
              </div>
            </div>
          )}
          {roadmapsQuery.error && (
            <p className="text-[14px] text-[#B53333]">Không thể tải danh sách lộ trình.</p>
          )}
          {!roadmapsQuery.isLoading && !roadmapsQuery.error && (
            <div className="space-y-2">
              {paginatedRoadmaps.map((rm) => (
                <Link
                  key={rm.id}
                  to={`/roadmaps/${rm.id}`}
                  className="flex items-center justify-between rounded-xl border border-[#E8E6DC] p-3 transition-all duration-150 hover:shadow-[0px_0px_0px_1px_#D1CFC5] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2 active:scale-[0.98]"
                  aria-label={rm.name}
                >
                  <div>
                    <strong className="text-[14px] text-[#141413]">{rm.name}</strong>
                    <p className="text-[12px] text-[#87867F]">{rm.subject}</p>
                  </div>
                  <span className="text-[12px] text-[#5E5D59]">{rm.totalTopicsCount} chủ đề</span>
                </Link>
              ))}
              {roadmapList.length > ROADMAP_PAGE_SIZE && (
                <div className="mt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-xl bg-[#E8E6DC] px-3 py-2 text-[13px] font-medium text-[#4D4C48] shadow-[0px_0px_0px_1px_#D1CFC5] transition-all duration-150 hover:shadow-[0px_0px_0px_1px_#C2C0B6] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50"
                    onClick={() => setRoadmapPage((p) => Math.max(1, p - 1))}
                    disabled={safeRoadmapPage === 1}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Trước
                  </button>
                  <span className="text-[13px] text-[#5E5D59]">
                    Trang <strong>{safeRoadmapPage}</strong> / {roadmapTotalPages}
                  </span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-xl bg-[#E8E6DC] px-3 py-2 text-[13px] font-medium text-[#4D4C48] shadow-[0px_0px_0px_1px_#D1CFC5] transition-all duration-150 hover:shadow-[0px_0px_0px_1px_#C2C0B6] focus-visible:ring-2 focus-visible:ring-[#3898EC] focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50"
                    onClick={() => setRoadmapPage((p) => Math.min(roadmapTotalPages, p + 1))}
                    disabled={safeRoadmapPage === roadmapTotalPages}
                  >
                    Sau <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {roadmapList.length === 0 && (
                <p className="text-[14px] text-[#87867F]">Chưa có lộ trình nào.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
