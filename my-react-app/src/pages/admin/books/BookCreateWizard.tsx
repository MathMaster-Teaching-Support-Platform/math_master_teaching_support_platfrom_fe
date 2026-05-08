import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  ListTree,
  Rocket,
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin } from '../../../data/mockData';
import { useBook } from '../../../hooks/useBooks';
import { BookVerifyContent } from './BookVerifyPage';
import BookUploadStep from './steps/BookUploadStep';
import PageMappingStep from './steps/PageMappingStep';
import OcrTriggerStep from './steps/OcrTriggerStep';

type StepIdx = 0 | 1 | 2 | 3;

const STEPS: Array<{ key: StepIdx; title: string; icon: React.ReactNode }> = [
  { key: 0, title: 'Thông tin & Upload PDF', icon: <FileText size={16} /> },
  { key: 1, title: 'Mapping bài học → trang', icon: <ListTree size={16} /> },
  { key: 2, title: 'Chạy OCR', icon: <Rocket size={16} /> },
  { key: 3, title: 'Xác minh nội dung', icon: <ClipboardCheck size={16} /> },
];

const BookCreateWizard: React.FC = () => {
  const { bookId: paramBookId } = useParams<{ bookId?: string }>();
  const navigate = useNavigate();
  const [bookId, setBookId] = useState<string | undefined>(paramBookId);
  const [stepIdx, setStepIdx] = useState<StepIdx>(0);

  const { data: bookData } = useBook(bookId);
  const book = bookData?.result;

  const canGoNext = useMemo(() => {
    if (stepIdx === 0) return Boolean(book?.pdfPath);
    if (stepIdx === 1) return (book?.mappedLessonCount ?? 0) > 0;
    if (stepIdx === 2) return book?.status === 'OCR_DONE';
    return false;
  }, [stepIdx, book]);

  const canAccessStep = (targetStep: StepIdx) => {
    if (targetStep === 0) return true;
    if (!bookId || !book) return false;
    if (targetStep >= 1 && !book.pdfPath) return false;
    if (targetStep >= 2 && (book.mappedLessonCount ?? 0) <= 0) return false;
    if (targetStep >= 3 && book.status !== 'OCR_DONE') return false;
    return true;
  };

  useEffect(() => {
    if (stepIdx > 0 && !book?.pdfPath) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStepIdx(0);
      return;
    }
    if (stepIdx > 1 && (book?.mappedLessonCount ?? 0) <= 0) {
      setStepIdx(1);
      return;
    }
    if (stepIdx > 2 && book?.status !== 'OCR_DONE') {
      setStepIdx(2);
    }
  }, [book, stepIdx]);

  const handleBookCreated = (newId: string) => {
    setBookId(newId);
    navigate(`/admin/books/${newId}/wizard`, { replace: true });
  };

  const handleSelectBook = (selectedId: string) => {
    setBookId(selectedId);
    navigate(`/admin/books/${selectedId}/wizard`, { replace: true });
  };

  const handleSwitchToNew = () => {
    setBookId(undefined);
    setStepIdx(0);
    navigate('/admin/books/new', { replace: true });
  };

  return (
    <DashboardLayout role="admin" user={mockAdmin} contentClassName="dashboard-content--flush-bleed">
      <div className="px-6 py-8 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate('/admin/books')}
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={16} /> Quay lại danh sách
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59]">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413]">
              {paramBookId ? 'Tiếp tục thiết lập sách' : 'Thêm sách giáo khoa mới'}
            </h1>
            <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5">
              Quy trình 4 bước: nhập metadata + upload PDF, mapping bài học, chạy OCR, sau đó xác
              minh nội dung.
            </p>
          </div>
        </div>

        {/* Stepper */}
        <ol className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const completed = i < stepIdx;
            const active = i === stepIdx;
            let stepBadgeClass = 'bg-slate-200 text-slate-700';
            if (active) {
              stepBadgeClass = 'bg-blue-500 text-white';
            } else if (completed) {
              stepBadgeClass = 'bg-emerald-500 text-white';
            }
            return (
              <li key={s.key} className="flex-1 flex items-center gap-2">
                <button
                  type="button"
                  disabled={!canAccessStep(s.key)}
                  onClick={() => {
                    if (!canAccessStep(s.key)) return;
                    setStepIdx(s.key);
                  }}
                  className={[
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border w-full transition',
                    active
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : completed
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-500',
                    !canAccessStep(s.key) ? 'opacity-50 cursor-not-allowed' : '',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'w-6 h-6 rounded-full inline-flex items-center justify-center text-xs',
                      stepBadgeClass,
                    ].join(' ')}
                  >
                    {completed ? <Check size={12} /> : i + 1}
                  </span>
                  {s.icon}
                  {s.title}
                </button>
                {i < STEPS.length - 1 && <ArrowRight size={14} className="text-slate-400 hidden md:block" />}
              </li>
            );
          })}
        </ol>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          {stepIdx === 0 && (
            <BookUploadStep
              key={book?.id ?? 'new-book'}
              book={book}
              onCreated={handleBookCreated}
              onSelectBook={handleSelectBook}
              onSwitchToNew={handleSwitchToNew}
              onUploaded={() => setStepIdx(1)}
            />
          )}
          {stepIdx === 1 && bookId && book && (
            <PageMappingStep book={book} />
          )}
          {stepIdx === 2 && bookId && book && (
            <OcrTriggerStep
              book={book}
              onComplete={() => setStepIdx(3)}
            />
          )}
          {stepIdx === 3 && bookId && book && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 size={18} /> Bước 4 · Xác minh nội dung
                </h2>
                <p className="text-sm text-slate-500">
                  Xác minh trực tiếp tại đây: kiểm tra/chỉnh sửa block và đánh dấu theo từng trang.
                </p>
              </div>
              <BookVerifyContent bookId={bookId} embedded />
            </div>
          )}
        </div>

        {stepIdx === 1 && (
          <div className="flex justify-between items-center mt-6">
            <button
              type="button"
              onClick={() => setStepIdx(0)}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
            >
              <ArrowLeft size={14} /> Quay lại
            </button>
            <button
              type="button"
              disabled={!canGoNext}
              onClick={() => setStepIdx(2)}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Tiếp tục <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BookCreateWizard;
