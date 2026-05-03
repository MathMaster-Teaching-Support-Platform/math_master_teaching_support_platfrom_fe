import type { LucideIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownToLine,
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  Bot,
  ChevronDown,
  ChevronLeft,
  ClipboardList,
  CreditCard,
  Database,
  DollarSign,
  FileCheck2,
  FileQuestion,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Library,
  LineChart,
  LogOut,
  Presentation,
  Ruler,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Workflow,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthService } from '../../../services/api/auth.service';
import { LessonSlideService } from '../../../services/api/lesson-slide.service';
import { MindmapService } from '../../../services/api/mindmap.service';
import { SubscriptionPlanService } from '../../../services/api/subscription-plan.service';
import { TeacherProfileService } from '../../../services/api/teacher-profile.service';
import { WalletService } from '../../../services/api/wallet.service';
import './Sidebar.css';

interface SidebarProps {
  role: 'teacher' | 'student' | 'admin';
  collapsed: boolean;
  onToggle: () => void;
}

interface MenuItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

interface MenuGroup {
  label: string | null;
  items: MenuItem[];
}

const teacherGroups: MenuGroup[] = [
  {
    label: 'Học liệu giảng dạy',
    items: [
      { path: '/teacher/courses', icon: BookOpen, label: 'Khóa học' },
      { path: '/teacher/lesson-plans', icon: ClipboardList, label: 'Giáo Án' },
      { path: '/teacher/materials', icon: FolderKanban, label: 'Tài liệu' },
    ],
  },
  {
    label: 'Đề thi và đánh giá',
    items: [
      { path: '/teacher/exam-matrices', icon: Ruler, label: 'Ma trận đề' },
      { path: '/teacher/question-templates', icon: FileQuestion, label: 'Mẫu câu hỏi' },
      { path: '/teacher/question-banks', icon: Database, label: 'Ngân hàng câu hỏi' },
      { path: '/teacher/questions', icon: ClipboardList, label: 'Câu hỏi của tôi' },
      { path: '/teacher/assessment-builder', icon: Sparkles, label: 'Trình tạo đề' },
      { path: '/teacher/assessments', icon: FileCheck2, label: 'Kiểm tra' },
    ],
  },
  {
    label: 'Công cụ AI và trực quan',
    items: [
      { path: '/teacher/mindmaps', icon: Workflow, label: 'Mindmap' },
      { path: '/teacher/ai-assistant', icon: Bot, label: 'AI Trợ lý' },
      { path: '/teacher/ai-slide-generator', icon: Presentation, label: 'AI Slide Gen' },
    ],
  },
  {
    label: 'Tài chính',
    items: [
      { path: '/teacher/wallet', icon: Wallet, label: 'Ví của tôi' },
      { path: '/pricing', icon: CreditCard, label: 'Gói đăng ký' },
    ],
  },
];

const studentGroups: MenuGroup[] = [
  {
    label: 'Học tập',
    items: [
      { path: '/student/courses', icon: GraduationCap, label: 'Khóa học' },
      { path: '/student/public-slides', icon: Library, label: 'Slide' },
      { path: '/student/public-mindmaps', icon: Workflow, label: 'Mindmap' },
      { path: '/student/assessments', icon: FileCheck2, label: 'Bài kiểm tra' },
      { path: '/student/roadmap', icon: Workflow, label: 'Lộ trình' },
    ],
  },
  {
    label: 'Tài chính',
    items: [
      { path: '/student/wallet', icon: Wallet, label: 'Ví của tôi' },
      { path: '/pricing', icon: CreditCard, label: 'Gói đăng ký' },
    ],
  },
  {
    label: 'Công cụ',
    items: [{ path: '/student/ai-assistant', icon: Bot, label: 'AI Trợ lý' }],
  },
  {
    label: 'Nâng cấp',
    items: [{ path: '/submit-teacher-profile', icon: ShieldCheck, label: 'Đăng ký Giáo viên' }],
  },
];

const adminGroups: MenuGroup[] = [
  {
    label: 'Tổng quan',
    items: [{ path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'Người dùng',
    items: [
      { path: '/admin/users', icon: Users, label: 'Người dùng' },
      { path: '/admin/review-profiles', icon: FileCheck2, label: 'Duyệt Profile' },
    ],
  },
  {
    label: 'Tài chính',
    items: [
      { path: '/admin/financial-overview', icon: DollarSign, label: 'Tổng quan Tài chính' },
      { path: '/admin/revenue-breakdown', icon: BarChart3, label: 'Phân tích Doanh thu' },
      { path: '/admin/marketplace-analytics', icon: TrendingUp, label: 'Phân tích Thị trường' },
      { path: '/admin/transactions', icon: ArrowLeftRight, label: 'Giao dịch' },
      { path: '/admin/withdrawals', icon: ArrowDownToLine, label: 'Duyệt Rút tiền' },
      { path: '/admin/subscriptions', icon: CreditCard, label: 'Gói đăng ký' },
    ],
  },
  {
    label: 'Nội dung',
    items: [
      { path: '/admin/courses/review', icon: BookOpen, label: 'Duyệt khóa học' },
      { path: '/admin/roadmaps', icon: Workflow, label: 'Lộ trình' },
      { path: '/admin/slide-templates', icon: Presentation, label: 'Slide Template' },
    ],
  },
  {
    label: 'Hệ thống',
    items: [
      { path: '/admin/analytics', icon: LineChart, label: 'Thống kê' },
      { path: '/admin/cash-flow', icon: Wallet, label: 'Dòng tiền' },
    ],
  },
];

const getGroupsByRole = (role: SidebarProps['role']): MenuGroup[] => {
  if (role === 'teacher') return teacherGroups;
  if (role === 'student') return studentGroups;
  return adminGroups;
};

const Sidebar: React.FC<SidebarProps> = ({ role, collapsed, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const navRef = useRef<HTMLElement | null>(null);
  const prefetchedPathsRef = useRef<Set<string>>(new Set());
  const groups = useMemo(() => getGroupsByRole(role), [role]);
  const navScrollStorageKey = useMemo(() => `mm.sidebar.scrollTop.${role}`, [role]);
  const groupExpandStorageKey = useMemo(() => `mm.sidebar.expandedGroups.${role}`, [role]);
  const navId = useMemo(() => `sidebar-nav-${role}`, [role]);
  const getGroupKey = (group: MenuGroup, index: number) => group.label ?? `__group_${index}`;

  const readExpandedGroups = (inputGroups: MenuGroup[]): Record<string, boolean> => {
    const defaults = inputGroups.reduce<Record<string, boolean>>((acc, group, index) => {
      acc[getGroupKey(group, index)] = true;
      return acc;
    }, {});

    if (globalThis.window === undefined) return defaults;

    try {
      const raw = globalThis.sessionStorage.getItem(groupExpandStorageKey);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw) as Record<string, boolean>;
      return { ...defaults, ...parsed };
    } catch {
      return defaults;
    }
  };

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    return readExpandedGroups(groups);
  });

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const savedScroll = Number(globalThis.sessionStorage.getItem(navScrollStorageKey) ?? '0');
    nav.scrollTop = Number.isFinite(savedScroll) ? savedScroll : 0;
  }, [navScrollStorageKey]);

  useEffect(() => {
    setExpandedGroups(readExpandedGroups(groups));
  }, [groupExpandStorageKey, groups]);

  useEffect(() => {
    globalThis.sessionStorage.setItem(groupExpandStorageKey, JSON.stringify(expandedGroups));
  }, [expandedGroups, groupExpandStorageKey]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const handleScroll = () => {
      globalThis.sessionStorage.setItem(navScrollStorageKey, String(nav.scrollTop));
    };

    nav.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      nav.removeEventListener('scroll', handleScroll);
    };
  }, [navScrollStorageKey]);

  const handleLogout = () => {
    AuthService.removeToken();
    navigate('/login');
  };

  const settingsPath = `/${role}/settings`;

  const isActive = (path: string) => {
    if (path.endsWith('/dashboard')) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const showSubmenus = !collapsed;

  const prefetchByPath = async (path: string) => {
    if (prefetchedPathsRef.current.has(path)) return;
    prefetchedPathsRef.current.add(path);

    try {
      if (path === '/student/wallet') {
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: ['wallet', 'my-summary'],
            queryFn: () => WalletService.getMyWallet(),
            staleTime: 30_000,
          }),
          queryClient.prefetchQuery({
            queryKey: ['wallet', 'transactions', 'all'],
            queryFn: () => WalletService.getTransactions({ page: 0, size: 20 }),
            staleTime: 15_000,
          }),
        ]);
        return;
      }

      if (path === '/pricing' && AuthService.isAuthenticated()) {
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: ['pricing', 'user-plans'],
            queryFn: () => SubscriptionPlanService.getUserPlans(),
            staleTime: 30_000,
          }),
          queryClient.prefetchQuery({
            queryKey: ['pricing', 'wallet-summary'],
            queryFn: () => WalletService.getMyWallet(),
            staleTime: 30_000,
          }),
          queryClient.prefetchQuery({
            queryKey: ['pricing', 'my-subscription'],
            queryFn: () => SubscriptionPlanService.getMySubscription(),
            staleTime: 30_000,
          }),
        ]);
        return;
      }

      if (path === '/submit-teacher-profile') {
        await queryClient.prefetchQuery({
          queryKey: ['teacher-profile', 'my-profile'],
          queryFn: () => TeacherProfileService.getMyProfile(),
          staleTime: 60_000,
        });
        return;
      }

      if (path === '/student/public-slides') {
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: ['school-grades', 'active'],
            queryFn: () => LessonSlideService.getSchoolGrades(true),
            staleTime: 5 * 60 * 1000,
          }),
          queryClient.prefetchQuery({
            queryKey: [
              'public-slides',
              {
                lessonId: '',
                keyword: '',
                page: 0,
                size: 9,
                sortBy: 'createdAt',
                direction: 'DESC',
              },
            ],
            queryFn: () =>
              LessonSlideService.getAllPublicGeneratedFiles({
                page: 0,
                size: 9,
                sortBy: 'createdAt',
                direction: 'DESC',
              }),
            staleTime: 30_000,
          }),
        ]);
        return;
      }

      if (path === '/student/public-mindmaps') {
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: ['school-grades', 'active'],
            queryFn: () => LessonSlideService.getSchoolGrades(true),
            staleTime: 5 * 60 * 1000,
          }),
          queryClient.prefetchQuery({
            queryKey: [
              'public-mindmaps',
              { lessonId: '', name: '', page: 0, size: 9, sortBy: 'createdAt', direction: 'DESC' },
            ],
            queryFn: () =>
              MindmapService.getPublicMindmaps({
                page: 0,
                size: 9,
                sortBy: 'createdAt',
                direction: 'DESC',
              }),
            staleTime: 30_000,
          }),
        ]);
      }
    } catch {
      // Prefetch is best-effort; page can still fetch normally.
    }
  };

  return (
    <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <Link to={AuthService.getDashboardUrl()} className="sidebar-logo">
          <span className="sb-logo-icon">∑π</span>
          {!collapsed && <span className="sb-logo-text">MathMaster</span>}
        </Link>
      </div>

      {/* Collapse toggle — floating on right edge */}
      <button
        className="sb-toggle"
        onClick={onToggle}
        aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
        aria-expanded={!collapsed}
        aria-controls={navId}
      >
        <ChevronLeft size={13} strokeWidth={2.5} />
        <ChevronLeft size={13} strokeWidth={2.5} />
      </button>

      {/* Nav */}
      <nav ref={navRef} id={navId} className="sidebar-nav" aria-label="Điều hướng chính">
        {groups.map((group, groupIndex) => {
          const groupKey = getGroupKey(group, groupIndex);
          const isGroupExpanded = showSubmenus ? (expandedGroups[groupKey] ?? true) : true;

          return (
            <div key={groupKey} className="sb-group">
              {group.label &&
                !collapsed &&
                (showSubmenus ? (
                  <button
                    type="button"
                    className="sb-group-toggle"
                    onClick={() => {
                      setExpandedGroups((prev) => ({
                        ...prev,
                        [groupKey]: !(prev[groupKey] ?? true),
                      }));
                    }}
                    aria-expanded={isGroupExpanded}
                  >
                    <span className="sb-group-toggle-label">{group.label}</span>
                    <ChevronDown
                      size={14}
                      className={`sb-group-toggle-icon${isGroupExpanded ? ' is-open' : ''}`}
                    />
                  </button>
                ) : (
                  <p className="sb-group-label">{group.label}</p>
                ))}
              <div
                className={`sb-group-items${showSubmenus && !isGroupExpanded ? ' is-hidden' : ''}`}
              >
                {group.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`sb-item${isActive(item.path) ? ' active' : ''}`}
                    onMouseEnter={() => {
                      void prefetchByPath(item.path);
                    }}
                    onFocus={() => {
                      void prefetchByPath(item.path);
                    }}
                    onTouchStart={() => {
                      void prefetchByPath(item.path);
                    }}
                  >
                    <span className="sb-icon">
                      <item.icon size={16} strokeWidth={2} />
                    </span>
                    {!collapsed && <span className="sb-label">{item.label}</span>}
                    {collapsed && <span className="sb-tooltip">{item.label}</span>}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <Link to={settingsPath} className={`sb-item${isActive(settingsPath) ? ' active' : ''}`}>
          <span className="sb-icon">
            <Settings size={16} strokeWidth={2} />
          </span>
          {!collapsed && <span className="sb-label">Cài đặt</span>}
          {collapsed && <span className="sb-tooltip">Cài đặt</span>}
        </Link>
        <button
          onClick={handleLogout}
          className="sb-item sb-item--logout"
          aria-label="Đăng xuất khỏi tài khoản"
        >
          <span className="sb-icon">
            <LogOut size={16} strokeWidth={2} />
          </span>
          {!collapsed && <span className="sb-label">Đăng xuất</span>}
          {collapsed && <span className="sb-tooltip">Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
