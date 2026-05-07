import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  BookMarked,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Network,
  Search,
  Sparkles,
  WandSparkles,
  Workflow,
  X,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockTeacher } from '../../data/mockData';
import { LessonSlideService } from '../../services/api/lesson-slide.service';
import { MindmapService } from '../../services/api/mindmap.service';
import { notifySubscriptionUpdated } from '../../services/api/subscription-plan.service';
import type { Mindmap } from '../../types';
import type {
  ChapterBySubject,
  LessonByChapter,
  SchoolGrade,
  SubjectByGrade,
} from '../../types/lessonSlide.types';

const coverGradients = [
  'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
  'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
  'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
  'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
  'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
] as const;

const coverAccents = ['#1d4ed8', '#047857', '#6d28d9', '#c2410c', '#be185d', '#0f766e'] as const;

const LoadingSpinner = ({ label }: { label: string }) => (
  <span
    className="inline-flex items-center gap-2 font-[Be_Vietnam_Pro] text-[13px] text-[#87867F]"
    role="status"
    aria-live="polite"
  >
    <span
      className="w-3.5 h-3.5 rounded-full border-2 border-[#E8E6DC] border-t-[#C96442] animate-spin flex-shrink-0"
      aria-hidden="true"
    />
    {label}
  </span>
);

type ModalConfig = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: 'info' | 'warning' | 'danger';
};

function MindmapConfirmModal({
  modal,
  onClose,
}: Readonly<{ modal: ModalConfig; onClose: () => void }>) {
  const styles: Record<
    NonNullable<ModalConfig['variant']>,
    { iconBg: string; icon: React.ReactNode; btn: string }
  > = {
    danger: {
      iconBg: 'bg-red-50 text-red-500',
      icon: <AlertCircle className="w-7 h-7" />,
      btn: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      iconBg: 'bg-amber-50 text-amber-500',
      icon: <Sparkles className="w-7 h-7" />,
      btn: 'bg-amber-500 hover:bg-amber-600 text-white',
    },
    info: {
      iconBg: 'bg-blue-50 text-blue-500',
      icon: <CheckCircle2 className="w-7 h-7" />,
      btn: 'bg-[#141413] hover:bg-[#30302E] text-[#FAF9F5]',
    },
  };
  const s = styles[modal.variant ?? 'info'];

  return (
    <div className="fixed inset-0 z-50 bg-[#141413]/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-[rgba(0,0,0,0.20)_0px_20px_60px] w-full max-w-sm p-6 flex flex-col gap-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mm-modal-title"
      >
        <div
          className={`w-12 h-12 rounded-2xl ${s.iconBg} flex items-center justify-center mx-auto`}
        >
          {s.icon}
        </div>
        <div className="text-center">
          <h3
            id="mm-modal-title"
            className="font-[Playfair_Display] text-[18px] font-medium text-[#141413]"
          >
            {modal.title}
          </h3>
          <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-2">{modal.message}</p>
        </div>
        <div className="flex gap-2">
          {modal.cancelLabel && (
            <button
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
              onClick={onClose}
            >
              {modal.cancelLabel}
            </button>
          )}
          <button
            className={`flex-1 px-4 py-2.5 rounded-xl ${s.btn} font-[Be_Vietnam_Pro] text-[13px] font-semibold transition-colors`}
            onClick={() => {
              modal.onConfirm();
              onClose();
            }}
          >
            {modal.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeacherMindmaps() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mindmaps, setMindmaps] = useState<Mindmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<'DRAFT' | 'PUBLISHED' | 'ALL'>('ALL');

  const [generatorForm, setGeneratorForm] = useState({ title: '', prompt: '', levels: 3 });
  const [activeGeneratorStep, setActiveGeneratorStep] = useState(1);
  const [schoolGrades, setSchoolGrades] = useState<SchoolGrade[]>([]);
  const [subjects, setSubjects] = useState<SubjectByGrade[]>([]);
  const [chapters, setChapters] = useState<ChapterBySubject[]>([]);
  const [lessons, setLessons] = useState<LessonByChapter[]>([]);
  const [schoolGradeId, setSchoolGradeId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [generatorError, setGeneratorError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const [modal, setModal] = useState<ModalConfig | null>(null);
  const showConfirm = (opts: ModalConfig) => setModal(opts);
  const closeModal = () => setModal(null);

  const canProceedStep2 = Boolean(lessonId);
  const selectedLesson = lessons.find((l) => l.id === lessonId) || null;
  const generatorSteps = ['Chọn bài dạy', 'Cấu hình AI'];
  const visualGeneratorStep = Math.max(1, Math.min(activeGeneratorStep, generatorSteps.length));

  const visibleMindmaps = useMemo(
    () => mindmaps.filter((m) => m.status === 'DRAFT' || m.status === 'PUBLISHED'),
    [mindmaps]
  );

  const stats = useMemo(
    () => ({
      total: visibleMindmaps.length,
      published: visibleMindmaps.filter((m) => m.status === 'PUBLISHED').length,
      draft: visibleMindmaps.filter((m) => m.status === 'DRAFT').length,
      aiGenerated: visibleMindmaps.filter((m) => m.aiGenerated).length,
    }),
    [visibleMindmaps]
  );

  const filteredMindmaps = useMemo(
    () =>
      visibleMindmaps.filter((m) => {
        const statusMatch = statusFilter === 'ALL' || m.status === statusFilter;
        const searchMatch = m.title.toLowerCase().includes(search.toLowerCase());
        return statusMatch && searchMatch;
      }),
    [visibleMindmaps, statusFilter, search]
  );

  const filterTabs = [
    { id: 'ALL' as const, label: `Tất cả (${stats.total})` },
    { id: 'PUBLISHED' as const, label: `Đã công khai (${stats.published})` },
    { id: 'DRAFT' as const, label: `Nháp (${stats.draft})` },
  ];

  useEffect(() => {
    loadMindmaps();
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMindmaps = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: {
        page?: number;
        size?: number;
        status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
        sortBy?: string;
        direction?: 'ASC' | 'DESC';
      } = { page: 0, size: 10, sortBy: 'createdAt', direction: 'DESC' };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const response = await MindmapService.getMyMindmaps(params);
      setMindmaps(response.result.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mindmaps');
    } finally {
      setLoading(false);
    }
  };

  const loadSchoolGrades = async () => {
    try {
      setLoadingGrades(true);
      const response = await LessonSlideService.getSchoolGrades(true);
      setSchoolGrades(response.result || []);
    } catch (err) {
      setGeneratorError(err instanceof Error ? err.message : 'Không thể tải danh sách lớp');
    } finally {
      setLoadingGrades(false);
    }
  };

  const resetGeneratorSelection = () => {
    setActiveGeneratorStep(1);
    setSchoolGradeId('');
    setSubjectId('');
    setChapterId('');
    setLessonId('');
    setSubjects([]);
    setChapters([]);
    setLessons([]);
    setGeneratorError(null);
    setGeneratorForm({ title: '', prompt: '', levels: 3 });
  };

  const toggleGenerator = () => {
    const next = !showGenerator;
    setShowGenerator(next);
    if (next) {
      resetGeneratorSelection();
      if (!schoolGrades.length) void loadSchoolGrades();
    }
  };

  const handleSchoolGradeChange = async (value: string) => {
    setSchoolGradeId(value);
    setSubjectId('');
    setChapterId('');
    setLessonId('');
    setSubjects([]);
    setChapters([]);
    setLessons([]);
    setGeneratorError(null);
    if (!value) return;
    try {
      setLoadingSubjects(true);
      const r = await LessonSlideService.getSubjectsBySchoolGrade(value);
      setSubjects(r.result || []);
    } catch (err) {
      setGeneratorError(err instanceof Error ? err.message : 'Không thể tải danh sách môn học');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleSubjectChange = async (value: string) => {
    setSubjectId(value);
    setChapterId('');
    setLessonId('');
    setChapters([]);
    setLessons([]);
    setGeneratorError(null);
    if (!value) return;
    try {
      setLoadingChapters(true);
      const r = await LessonSlideService.getChaptersBySubject(value);
      setChapters(r.result || []);
    } catch (err) {
      setGeneratorError(err instanceof Error ? err.message : 'Không thể tải danh sách chương');
    } finally {
      setLoadingChapters(false);
    }
  };

  const handleChapterChange = async (value: string) => {
    setChapterId(value);
    setLessonId('');
    setLessons([]);
    setGeneratorError(null);
    if (!value) return;
    try {
      setLoadingLessons(true);
      const r = await LessonSlideService.getLessonsByChapter(value);
      setLessons(r.result || []);
    } catch (err) {
      setGeneratorError(err instanceof Error ? err.message : 'Không thể tải danh sách bài học');
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleGenerateMindmap = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!lessonId) {
      setGeneratorError('Vui lòng chọn đầy đủ Lớp, Môn, Chương và Bài học trước khi tạo mindmap.');
      setActiveGeneratorStep(1);
      return;
    }
    if (!generatorForm.title.trim() || !generatorForm.prompt.trim()) {
      setGeneratorError('Vui lòng nhập đầy đủ thông tin (tiêu đề và mô tả).');
      return;
    }
    try {
      setGenerating(true);
      setGeneratorError(null);
      const response = await MindmapService.generateMindmap({
        title: generatorForm.title,
        prompt: generatorForm.prompt,
        lessonId,
        levels: generatorForm.levels,
      });
      notifySubscriptionUpdated();
      navigate(`/teacher/mindmaps/${response.result.mindmap.id}`);
    } catch (err) {
      const apiError = err as Error & { code?: number };
      if (apiError.code === 1164) {
        setGeneratorError('Bạn chưa có gói active. Vui lòng mua gói trước khi dùng AI Mindmap.');
        showConfirm({
          title: 'Chưa có gói active',
          message:
            'Bạn chưa đăng ký gói dịch vụ nào. Mua gói ngay để sử dụng tính năng tạo Mindmap bằng AI.',
          confirmLabel: 'Mua gói ngay',
          cancelLabel: 'Để sau',
          variant: 'warning',
          onConfirm: () => navigate('/pricing'),
        });
      } else if (apiError.code === 1165) {
        setGeneratorError('Token không đủ để tạo mindmap. Vui lòng mua gói hoặc nạp thêm ví.');
        showConfirm({
          title: 'Token không đủ',
          message:
            'Số dư token trong ví của bạn không đủ để tạo Mindmap. Vui lòng nạp thêm tiền vào ví.',
          confirmLabel: 'Nạp tiền vào ví',
          cancelLabel: 'Để sau',
          variant: 'warning',
          onConfirm: () => navigate('/teacher/wallet'),
        });
      } else if (apiError.code === 1166) {
        setGeneratorError('Bạn không đủ token để thanh toán dịch vụ, vui lòng mua gói.');
        showConfirm({
          title: 'Không đủ token',
          message:
            'Bạn không đủ token để thanh toán dịch vụ. Vui lòng mua gói để tiếp tục sử dụng AI Mindmap.',
          confirmLabel: 'Mua gói ngay',
          cancelLabel: 'Để sau',
          variant: 'warning',
          onConfirm: () => navigate('/pricing'),
        });
      } else {
        setGeneratorError(
          err instanceof Error ? err.message : 'Không thể tạo mindmap. Vui lòng thử lại.'
        );
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = (id: string) => {
    showConfirm({
      title: 'Xóa mindmap',
      message: 'Bạn có chắc chắn muốn xóa mindmap này? Hành động này không thể hoàn tác.',
      confirmLabel: 'Xóa',
      cancelLabel: 'Hủy',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await MindmapService.deleteMindmap(id);
          await queryClient.invalidateQueries({ queryKey: ['mindmaps'] });
          loadMindmaps();
        } catch (err) {
          setGeneratorError(err instanceof Error ? err.message : 'Không thể xóa mindmap.');
        }
      },
    });
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const selectCls =
    'w-full border border-[#E8E6DC] rounded-lg px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442] bg-white transition-colors disabled:bg-[#F5F4ED] disabled:text-[#87867F]';

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: mockTeacher.name, avatar: mockTeacher.avatar ?? '', role: 'teacher' }}
      notificationCount={5}
      contentClassName="dashboard-content--flush-bleed"
    >
      <div className="px-6 py-8 lg:px-8">
        <div className="space-y-6">
          {/* ── Page header ── */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59]">
                <Workflow className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413]">
                    Mindmap
                  </h1>
                  {!loading && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E8E6DC] font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59]">
                      {mindmaps.length}
                    </span>
                  )}
                </div>
                <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5">
                  {stats.published} đã công khai • {stats.aiGenerated} AI tạo
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleGenerator}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C96442] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:brightness-95 active:scale-[0.98] transition-all duration-150"
            >
              Tạo mindmap <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {(
              [
                {
                  label: 'Tổng mindmap',
                  value: stats.total,
                  Icon: Network,
                  bg: 'bg-[#EEF2FF]',
                  color: 'text-[#4F7EF7]',
                },
                {
                  label: 'Đã công khai',
                  value: stats.published,
                  Icon: CheckCircle2,
                  bg: 'bg-[#ECFDF5]',
                  color: 'text-[#2EAD7A]',
                },
                {
                  label: 'Bản nháp',
                  value: stats.draft,
                  Icon: FileText,
                  bg: 'bg-[#FFF7ED]',
                  color: 'text-[#E07B39]',
                },
                {
                  label: 'AI tạo',
                  value: stats.aiGenerated,
                  Icon: Sparkles,
                  bg: 'bg-[#F5F3FF]',
                  color: 'text-[#9B6FE0]',
                },
              ] as const
            ).map(({ label, value, Icon, bg, color }) => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-[#E8E6DC] p-4 flex items-center gap-3"
              >
                <div
                  className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className="font-[Playfair_Display] text-[22px] font-medium text-[#141413] leading-none">
                    {value}
                  </p>
                  <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Generator panel ── */}
          {showGenerator && (
            <div className="bg-white rounded-2xl border border-[#E8E6DC] overflow-hidden">
              <form onSubmit={handleGenerateMindmap}>
                {/* Panel header */}
                <div className="px-6 py-4 border-b border-[#F0EEE6] bg-[#FAF9F5] flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#141413] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <WandSparkles className="w-4 h-4 text-[#FAF9F5]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-[Playfair_Display] text-[16px] font-medium text-[#141413]">
                      Tạo Mindmap với AI
                    </h3>
                    <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-0.5">
                      Hoàn thành Bước 1 để chọn đúng bài dạy, sau đó cấu hình AI ở Bước 2.
                    </p>
                    {/* Stepper */}
                    <div className="flex items-center gap-1 mt-3">
                      {generatorSteps.map((stepLabel, index) => {
                        const n = index + 1;
                        const isDone = visualGeneratorStep > n;
                        const isActive = visualGeneratorStep === n;
                        return (
                          <div key={stepLabel} className="flex items-center gap-1.5">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-[Be_Vietnam_Pro] transition-all ${
                                isDone
                                  ? 'bg-[#2EAD7A] text-white'
                                  : isActive
                                    ? 'bg-[#141413] text-[#FAF9F5]'
                                    : 'bg-[#E8E6DC] text-[#87867F]'
                              }`}
                            >
                              {isDone ? '✓' : n}
                            </div>
                            <span
                              className={`font-[Be_Vietnam_Pro] text-[12px] ${isActive ? 'text-[#141413] font-semibold' : isDone ? 'text-[#5E5D59]' : 'text-[#B0AEA5]'}`}
                            >
                              {stepLabel}
                            </span>
                            {index < generatorSteps.length - 1 && (
                              <div className="w-8 h-px bg-[#E8E6DC] mx-1" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Step 1 */}
                {activeGeneratorStep === 1 && (
                  <div className="p-6 space-y-4">
                    <p className="font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59] uppercase tracking-wide">
                      Bước 1: Chọn dữ liệu bài dạy
                    </p>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mb-1.5">
                          <GraduationCap className="w-3.5 h-3.5" /> Lớp
                        </label>
                        <select
                          className={selectCls}
                          value={schoolGradeId}
                          onChange={(e) => void handleSchoolGradeChange(e.target.value)}
                          disabled={loadingGrades}
                        >
                          <option value="">-- Chọn lớp --</option>
                          {schoolGrades.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mb-1.5">
                          <BookOpen className="w-3.5 h-3.5" /> Môn học
                        </label>
                        <select
                          className={selectCls}
                          value={subjectId}
                          onChange={(e) => void handleSubjectChange(e.target.value)}
                          disabled={!schoolGradeId || loadingSubjects}
                        >
                          <option value="">
                            {schoolGradeId ? '-- Chọn môn học --' : 'Chọn lớp trước'}
                          </option>
                          {subjects.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mb-1.5">
                          <BookMarked className="w-3.5 h-3.5" /> Chương
                        </label>
                        <select
                          className={selectCls}
                          value={chapterId}
                          onChange={(e) => void handleChapterChange(e.target.value)}
                          disabled={!subjectId || loadingChapters}
                        >
                          <option value="">
                            {subjectId ? '-- Chọn chương --' : 'Chọn môn trước'}
                          </option>
                          {chapters.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mb-1.5">
                          <Network className="w-3.5 h-3.5" /> Bài học
                        </label>
                        <select
                          className={selectCls}
                          value={lessonId}
                          onChange={(e) => setLessonId(e.target.value)}
                          disabled={!chapterId || loadingLessons}
                        >
                          <option value="">
                            {chapterId ? '-- Chọn bài học --' : 'Chọn chương trước'}
                          </option>
                          {lessons.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {(loadingGrades || loadingSubjects || loadingChapters || loadingLessons) && (
                      <LoadingSpinner label="Đang tải dữ liệu bài dạy..." />
                    )}

                    {selectedLesson && (
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#FAF9F5] border border-[#E8E6DC]">
                        <Network className="w-4 h-4 text-[#87867F] flex-shrink-0" />
                        <span className="font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59]">
                          Bài học đã chọn:{' '}
                          <strong className="text-[#141413]">{selectedLesson.title}</strong>
                        </span>
                      </div>
                    )}

                    {generatorError && (
                      <p className="font-[Be_Vietnam_Pro] text-[13px] text-red-600">
                        {generatorError}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                        onClick={() => setShowGenerator(false)}
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#30302E] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150"
                        onClick={() => setActiveGeneratorStep(2)}
                        disabled={!canProceedStep2}
                      >
                        Tiếp tục <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2 */}
                {activeGeneratorStep === 2 && (
                  <div className="p-6 space-y-4">
                    <p className="font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59] uppercase tracking-wide">
                      Bước 2: Cấu hình AI tạo mindmap
                    </p>

                    {selectedLesson && (
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#FAF9F5] border border-[#E8E6DC]">
                        <Network className="w-4 h-4 text-[#87867F] flex-shrink-0" />
                        <span className="font-[Be_Vietnam_Pro] text-[13px] text-[#5E5D59]">
                          Bài học:{' '}
                          <strong className="text-[#141413]">{selectedLesson.title}</strong>
                        </span>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mb-1.5 block">
                          Tiêu đề
                        </label>
                        <input
                          type="text"
                          className="w-full border border-[#E8E6DC] rounded-lg px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442] bg-white transition-colors"
                          value={generatorForm.title}
                          onChange={(e) =>
                            setGeneratorForm({ ...generatorForm, title: e.target.value })
                          }
                          placeholder="VD: Hình học lớp 9"
                          required
                        />
                      </div>
                      <div>
                        <label className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mb-1.5 block">
                          Mô tả nội dung
                        </label>
                        <textarea
                          className="w-full border border-[#E8E6DC] rounded-lg px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442] bg-white transition-colors resize-none"
                          value={generatorForm.prompt}
                          onChange={(e) =>
                            setGeneratorForm({ ...generatorForm, prompt: e.target.value })
                          }
                          placeholder="VD: Tạo mindmap về Hình học lớp 9, bao gồm các chủ đề: tam giác, tứ giác, đường tròn..."
                          rows={4}
                          required
                        />
                      </div>
                      <div className="w-40">
                        <label className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mb-1.5 block">
                          Số cấp độ
                        </label>
                        <input
                          type="number"
                          min="2"
                          max="5"
                          className="w-full border border-[#E8E6DC] rounded-lg px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#141413] outline-none focus:border-[#C96442] focus:ring-1 focus:ring-[#C96442] bg-white transition-colors"
                          value={generatorForm.levels}
                          onChange={(e) =>
                            setGeneratorForm({ ...generatorForm, levels: Number(e.target.value) })
                          }
                        />
                      </div>
                    </div>

                    {generatorError && (
                      <p className="font-[Be_Vietnam_Pro] text-[13px] text-red-600">
                        {generatorError}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                        onClick={() => setActiveGeneratorStep(1)}
                      >
                        ← Quay lại Bước 1
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#30302E] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150"
                        disabled={generating}
                      >
                        {generating ? (
                          <LoadingSpinner label="Đang tạo mindmap..." />
                        ) : (
                          <>
                            <WandSparkles className="w-3.5 h-3.5" /> Tạo Mindmap
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}

          {!showGenerator && (
            <>
              {/* ── Toolbar ── */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="flex-1 w-full flex items-center gap-3 bg-[#FAF9F5] border border-[#E8E6DC] rounded-xl px-4 py-2.5 focus-within:border-[#3898EC] focus-within:shadow-[0_0_0_3px_rgba(56,152,236,0.12)] transition-all duration-150">
                  <Search className="text-[#87867F] w-4 h-4 flex-shrink-0" />
                  <input
                    className="flex-1 font-[Be_Vietnam_Pro] text-[14px] text-[#141413] placeholder:text-[#87867F] bg-transparent outline-none"
                    placeholder="Tìm kiếm mindmap..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      type="button"
                      aria-label="Xóa tìm kiếm"
                      onClick={() => setSearch('')}
                      className="text-[#87867F] hover:text-[#141413] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </label>

                <div className="flex items-center gap-1 p-1 bg-[#F5F4ED] rounded-xl flex-shrink-0">
                  {filterTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-lg font-[Be_Vietnam_Pro] text-[12px] font-medium transition-all duration-150 whitespace-nowrap ${
                        statusFilter === tab.id
                          ? 'bg-white text-[#141413] shadow-sm'
                          : 'text-[#87867F] hover:text-[#5E5D59]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {mindmaps.length > 0 && (
                  <div className="flex items-center gap-1 p-1 bg-[#F5F4ED] rounded-xl flex-shrink-0">
                    <button
                      onClick={() => setViewMode('grid')}
                      aria-label="Hiển thị lưới"
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 ${
                        viewMode === 'grid'
                          ? 'bg-white shadow-md text-[#141413]'
                          : 'bg-[#E8E6DC] border-2 border-[#D1CFC5] text-[#141413] hover:bg-[#DDD9CC]'
                      }`}
                      title="Lưới"
                    >
                      ⊞
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      aria-label="Hiển thị danh sách"
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 ${
                        viewMode === 'list'
                          ? 'bg-white shadow-md text-[#141413]'
                          : 'bg-[#E8E6DC] border-2 border-[#D1CFC5] text-[#141413] hover:bg-[#DDD9CC]'
                      }`}
                      title="Danh sách"
                    >
                      ≡
                    </button>
                  </div>
                )}
              </div>

              {/* ── Summary bar ── */}
              {!loading && !error && mindmaps.length > 0 && (
                <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-[#FAF9F5] border border-[#E8E6DC]">
                  <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] uppercase tracking-wide">
                    Hiển thị
                  </span>
                  <strong className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#141413]">
                    {filteredMindmaps.length} / {visibleMindmaps.length}
                  </strong>
                  <div className="w-px h-4 bg-[#E8E6DC]" />
                  <span className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Đã công khai{' '}
                    <strong className="text-[#141413] font-semibold">{stats.published}</strong>
                  </span>
                  <span className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                    Nháp <strong className="text-[#141413] font-semibold">{stats.draft}</strong>
                  </span>
                </div>
              )}

              {/* ── Loading skeleton ── */}
              {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] h-52 animate-pulse"
                    />
                  ))}
                </div>
              )}

              {/* ── Error ── */}
              {error && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-400">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#B53333]">
                    Không thể tải mindmap. Vui lòng thử lại.
                  </p>
                </div>
              )}

              {/* ── Grid view ── */}
              {!loading && !error && filteredMindmaps.length > 0 && viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMindmaps.map((mindmap, idx) => (
                    <article
                      key={mindmap.id}
                      className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] shadow-[rgba(0,0,0,0.05)_0px_4px_24px] overflow-hidden group hover:shadow-[0px_0px_0px_1px_#D1CFC5,rgba(0,0,0,0.08)_0px_8px_30px] hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div
                        className="h-[140px] relative flex items-end p-4 overflow-hidden"
                        style={{ background: coverGradients[idx % coverGradients.length] }}
                      >
                        <span
                          className="absolute top-3 left-3 font-[Playfair_Display] text-[12px] font-medium opacity-40"
                          style={{ color: coverAccents[idx % coverAccents.length] }}
                        >
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="absolute top-3 right-3">
                          {mindmap.status === 'PUBLISHED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 font-[Be_Vietnam_Pro] text-[11px] font-semibold text-emerald-700">
                              <Eye className="w-3 h-3" /> Đã công khai
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 font-[Be_Vietnam_Pro] text-[11px] font-semibold text-[#87867F]">
                              <EyeOff className="w-3 h-3" /> Nháp
                            </span>
                          )}
                        </div>
                        <h3
                          className="relative font-[Playfair_Display] text-[15px] font-medium leading-[1.3] line-clamp-2"
                          style={{ color: coverAccents[idx % coverAccents.length] }}
                        >
                          {mindmap.title}
                        </h3>
                      </div>

                      <div className="p-4 flex flex-col gap-2">
                        <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] leading-[1.5] line-clamp-2">
                          {mindmap.description || 'Chưa có mô tả cho mindmap này.'}
                        </p>
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="flex items-center gap-1 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                            <Network className="w-3.5 h-3.5" />
                            {mindmap.nodeCount} nodes
                          </span>
                          {mindmap.aiGenerated && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 font-[Be_Vietnam_Pro] text-[11px] font-medium text-violet-600">
                              <Sparkles className="w-3 h-3" /> AI
                            </span>
                          )}
                          {mindmap.lessonTitle && (
                            <span className="flex items-center gap-1 font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] min-w-0">
                              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate max-w-[130px]">{mindmap.lessonTitle}</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-[#F0EEE6] mt-1">
                          <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#B0AEA5]">
                            {formatDate(mindmap.createdAt)}
                          </span>
                          <div className="flex gap-2">
                            <button
                              className="px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                              onClick={() => navigate(`/teacher/mindmaps/${mindmap.id}`)}
                            >
                              Chỉnh sửa
                            </button>
                            <button
                              className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 font-[Be_Vietnam_Pro] text-[12px] font-medium text-red-600 hover:bg-red-100 transition-colors"
                              onClick={() => handleDelete(mindmap.id)}
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* ── List view ── */}
              {!loading && !error && filteredMindmaps.length > 0 && viewMode === 'list' && (
                <div className="flex flex-col gap-2">
                  {filteredMindmaps.map((mindmap, idx) => (
                    <article
                      key={mindmap.id}
                      className="bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] p-4 flex items-center gap-4 hover:bg-white hover:shadow-[rgba(0,0,0,0.06)_0px_4px_16px] transition-all duration-150"
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center"
                        style={{
                          background: coverGradients[idx % coverGradients.length],
                          color: coverAccents[idx % coverAccents.length],
                        }}
                      >
                        <Workflow className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-[Be_Vietnam_Pro] text-[14px] font-semibold text-[#141413] truncate">
                            {mindmap.title}
                          </h3>
                          {mindmap.status === 'PUBLISHED' ? (
                            <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 font-[Be_Vietnam_Pro] text-[11px] font-medium text-emerald-700">
                              <Eye className="w-3 h-3" /> Công khai
                            </span>
                          ) : (
                            <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F5F4ED] font-[Be_Vietnam_Pro] text-[11px] font-medium text-[#87867F]">
                              <EyeOff className="w-3 h-3" /> Nháp
                            </span>
                          )}
                          {mindmap.aiGenerated && (
                            <span className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 font-[Be_Vietnam_Pro] text-[11px] font-medium text-violet-600">
                              <Sparkles className="w-3 h-3" /> AI
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F]">
                            {mindmap.nodeCount} nodes
                          </span>
                          <span className="font-[Be_Vietnam_Pro] text-[12px] text-[#B0AEA5]">
                            {formatDate(mindmap.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          className="px-3 py-1.5 rounded-lg border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[12px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
                          onClick={() => navigate(`/teacher/mindmaps/${mindmap.id}`)}
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 font-[Be_Vietnam_Pro] text-[12px] font-medium text-red-600 hover:bg-red-100 transition-colors"
                          onClick={() => handleDelete(mindmap.id)}
                        >
                          Xóa
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* ── Empty: filtered ── */}
              {!loading && !error && filteredMindmaps.length === 0 && mindmaps.length > 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#E8E6DC] flex items-center justify-center text-[#B0AEA5]">
                    <Search className="w-6 h-6" />
                  </div>
                  <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F]">
                    Không tìm thấy mindmap nào phù hợp với bộ lọc.
                  </p>
                </div>
              )}

              {/* ── Empty: no mindmaps ── */}
              {!loading && !error && mindmaps.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#E8E6DC] flex items-center justify-center text-[#B0AEA5]">
                    <Workflow className="w-6 h-6" />
                  </div>
                  <p className="font-[Be_Vietnam_Pro] text-[14px] text-[#87867F]">
                    Bạn chưa có mindmap nào. Hãy tạo mindmap đầu tiên bằng AI.
                  </p>
                  <button
                    type="button"
                    onClick={toggleGenerator}
                    className="mt-1 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:bg-[#30302E] active:scale-[0.98] transition-all duration-150"
                  >
                    Tạo mindmap <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {modal && <MindmapConfirmModal modal={modal} onClose={closeModal} />}
    </DashboardLayout>
  );
}
