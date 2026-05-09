import { useEffect, useMemo, useState } from 'react';
import { Link2, RefreshCw } from 'lucide-react';
import MathText from '../../common/MathText';
import Pagination from '../../common/Pagination';
import { useBatchAssignQuestionsToBank, useSearchQuestions } from '../../../hooks/useQuestion';
import { questionBankService } from '../../../services/questionBankService';
import type {
  CognitiveLevelVi,
  QuestionBankTreeChapterNode,
} from '../../../types/questionBank';
import type { QuestionResponse } from '../../../types/question';
import { QbInlineNotice } from './QbStates';
import { QbModal } from './QbModal';
import {
  QB_COGNITIVE_OPTIONS,
  QbCognitiveBadge,
  QbQuestionStatusBadge,
} from './QbBadges';
import { QbSearchInput } from './QbToolbar';
import './QbAddQuestionsModal.css';

interface BucketContext {
  chapterId: string;
  chapterTitle?: string;
  level: CognitiveLevelVi;
}

interface QbAddQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankId: string;
  bucketContext: BucketContext | null;
  onClearBucket: () => void;
  /** Called after a successful batch assign so the parent can refresh tree/list. */
  onAssigned: (count: number) => void;
}

const PAGE_SIZE = 10;

const QUESTION_TYPE_LABEL: Record<string, string> = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  MCQ: 'Trắc nghiệm',
  TRUE_FALSE: 'Đúng/Sai',
  SHORT_ANSWER: 'Trả lời ngắn',
  FILL_BLANK: 'Điền khuyết',
  ESSAY: 'Tự luận',
  CODING: 'Lập trình',
};

const COGNITIVE_FULL: Record<CognitiveLevelVi, string> = {
  NHAN_BIET: 'Nhận biết',
  THONG_HIEU: 'Thông hiểu',
  VAN_DUNG: 'Vận dụng',
  VAN_DUNG_CAO: 'Vận dụng cao',
};

export function QbAddQuestionsModal({
  isOpen,
  onClose,
  bankId,
  bucketContext,
  onClearBucket,
  onAssigned,
}: QbAddQuestionsModalProps) {
  const [keyword, setKeyword] = useState('');
  const [chapterFilter, setChapterFilter] = useState('');
  const [cognitiveFilter, setCognitiveFilter] = useState<'' | CognitiveLevelVi>('');
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Chapter list scoped to this bank's grade (loaded from the bank tree once
  // per open) so the chapter dropdown only shows relevant options.
  const [chapters, setChapters] = useState<QuestionBankTreeChapterNode[]>([]);

  const batchAssign = useBatchAssignQuestionsToBank();

  // Reset state on open / when the matrix-driven bucket context changes.
  useEffect(() => {
    if (!isOpen) return;
    setKeyword('');
    setPage(0);
    setSelectedIds(new Set());
    setErrorMsg(null);
    if (bucketContext) {
      // Bucket-driven open: filter dropdowns mirror the bucket so the user can
      // see/override (Bỏ lọc clears bucket back to free filter mode).
      setChapterFilter(bucketContext.chapterId);
      setCognitiveFilter(bucketContext.level);
    } else {
      setChapterFilter('');
      setCognitiveFilter('');
    }
  }, [isOpen, bucketContext?.chapterId, bucketContext?.level]);

  // Load chapter list for the bank once on open.
  useEffect(() => {
    if (!isOpen || !bankId) return;
    let cancelled = false;
    questionBankService
      .getBankTree(bankId)
      .then((res) => {
        if (cancelled) return;
        setChapters(res.result?.chapters ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setChapters([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, bankId]);

  // Effective filters: bucket overrides UI filter so the matrix flow is strict.
  const effectiveChapterId = bucketContext?.chapterId ?? chapterFilter;
  const effectiveCognitive = bucketContext?.level ?? cognitiveFilter;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useSearchQuestions(
    {
      keyword,
      chapterId: effectiveChapterId || undefined,
      cognitiveLevel: effectiveCognitive || undefined,
      page,
      size: PAGE_SIZE,
    },
    isOpen && !!bankId
  );

  const questions = useMemo<QuestionResponse[]>(
    () => data?.result?.content ?? [],
    [data]
  );

  const totalPages =
    data?.result?.totalPages ??
    (data?.result as { page?: { totalPages?: number } } | undefined)?.page?.totalPages ??
    0;
  const totalElements =
    data?.result?.totalElements ??
    (data?.result as { page?: { totalElements?: number } } | undefined)?.page?.totalElements ??
    questions.length;

  const selectableIds = questions
    .filter((q) => q.questionBankId !== bankId)
    .map((q) => q.id);

  const allSelectableSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));

  function toggleOne(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(selectableIds));
  }

  function clearAllFilters() {
    setKeyword('');
    setChapterFilter('');
    setCognitiveFilter('');
    setPage(0);
  }

  async function handleAssign() {
    if (selectedIds.size === 0) return;
    setErrorMsg(null);
    try {
      const ids = Array.from(selectedIds);
      const response = await batchAssign.mutateAsync({ bankId, questionIds: ids });
      const updated = response.result ?? ids.length;
      onAssigned(updated);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể thêm câu hỏi vào ngân hàng.');
    }
  }

  const hasActiveFilter = !!keyword || !!chapterFilter || !!cognitiveFilter;

  return (
    <QbModal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title="Thêm câu hỏi vào ngân hàng"
      description="Lọc theo chương / mức độ rồi chọn câu hỏi để gán vào ngân hàng hiện tại."
      footer={
        <>
          <span className="qb-add-q-modal__count">
            Đã chọn <strong>{selectedIds.size}</strong> câu
          </span>
          <button type="button" className="qb-btn qb-btn--secondary" onClick={onClose}>
            Đóng
          </button>
          <button
            type="button"
            className="qb-btn qb-btn--primary"
            onClick={() => void handleAssign()}
            disabled={selectedIds.size === 0 || batchAssign.isPending}
          >
            <Link2 size={14} />
            {batchAssign.isPending
              ? 'Đang thêm…'
              : `Thêm vào ngân hàng (${selectedIds.size})`}
          </button>
        </>
      }
    >
      <div className="qb-add-q-modal qb-scope">
        {bucketContext && (
          <QbInlineNotice tone="info">
            Đang lọc cho{' '}
            <strong>
              {bucketContext.chapterTitle ?? 'chương'} · {COGNITIVE_FULL[bucketContext.level]}
            </strong>
            . Chỉ hiển thị câu khớp chương + mức độ.{' '}
            <button type="button" className="qb-add-q-modal__clear-link" onClick={onClearBucket}>
              Bỏ lọc
            </button>
          </QbInlineNotice>
        )}

        {errorMsg && <QbInlineNotice tone="danger">{errorMsg}</QbInlineNotice>}

        <div className="qb-add-q-modal__filters">
          <QbSearchInput
            value={keyword}
            onChange={(v) => {
              setKeyword(v);
              setPage(0);
            }}
            placeholder="Từ khóa nội dung câu hỏi..."
          />

          <select
            className="qb-select qb-add-q-modal__select"
            value={chapterFilter}
            onChange={(e) => {
              setChapterFilter(e.target.value);
              setPage(0);
            }}
            disabled={!!bucketContext}
            aria-label="Lọc theo chương"
          >
            <option value="">Tất cả chương</option>
            {chapters.map((c) => (
              <option key={c.chapterId} value={c.chapterId}>
                {c.orderIndex != null ? `Chương ${c.orderIndex}. ` : ''}
                {c.title}
              </option>
            ))}
          </select>

          <select
            className="qb-select qb-add-q-modal__select"
            value={cognitiveFilter}
            onChange={(e) => {
              setCognitiveFilter(e.target.value as '' | CognitiveLevelVi);
              setPage(0);
            }}
            disabled={!!bucketContext}
            aria-label="Lọc theo mức độ"
          >
            <option value="">Tất cả mức độ</option>
            {QB_COGNITIVE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {hasActiveFilter && !bucketContext && (
            <button
              type="button"
              className="qb-btn qb-btn--ghost qb-btn--sm"
              onClick={clearAllFilters}
            >
              Xóa bộ lọc
            </button>
          )}

          <button
            type="button"
            className="qb-btn qb-btn--secondary qb-btn--sm"
            onClick={() => void refetch()}
            disabled={isLoading}
          >
            <RefreshCw size={13} />
            Làm mới
          </button>
        </div>

        {isLoading && <p className="qb-text-muted">Đang tìm câu hỏi…</p>}

        {isError && (
          <QbInlineNotice tone="danger">
            {error instanceof Error ? error.message : 'Không thể tải danh sách câu hỏi.'}
          </QbInlineNotice>
        )}

        {!isLoading && !isError && questions.length === 0 && (
          <p className="qb-add-q-modal__empty">
            {bucketContext
              ? 'Không có câu hỏi nào khớp với chương + mức độ. Thử đổi từ khóa hoặc bỏ lọc.'
              : hasActiveFilter
                ? 'Không tìm thấy câu hỏi phù hợp. Thử bỏ bộ lọc.'
                : 'Bạn chưa có câu hỏi nào. Hãy tạo câu hỏi trước.'}
          </p>
        )}

        {!isLoading && !isError && questions.length > 0 && (
          <div className="qb-add-q-table">
            <div className="qb-add-q-table__head">
              <label className="qb-add-q-table__select-all">
                <input
                  type="checkbox"
                  checked={allSelectableSelected}
                  onChange={(e) => toggleAll(e.target.checked)}
                  disabled={selectableIds.length === 0}
                />
                Chọn tất cả ({selectableIds.length})
              </label>
            </div>
            <ul className="qb-add-q-table__list">
              {questions.map((question) => {
                const inThisBank = question.questionBankId === bankId;
                const checked = selectedIds.has(question.id);
                return (
                  <li
                    key={question.id}
                    className={`qb-add-q-row ${inThisBank ? 'qb-add-q-row--in' : ''} ${checked ? 'qb-add-q-row--checked' : ''}`}
                  >
                    <input
                      type="checkbox"
                      className="qb-add-q-row__check"
                      disabled={inThisBank}
                      checked={checked}
                      onChange={(e) => toggleOne(question.id, e.target.checked)}
                    />
                    <div className="qb-add-q-row__main">
                      <div className="qb-add-q-row__text">
                        <MathText text={question.questionText} />
                      </div>
                      <div className="qb-add-q-row__meta">
                        <span className="qb-add-q-row__chip">
                          {QUESTION_TYPE_LABEL[question.questionType] ??
                            question.questionType}
                        </span>
                        <QbCognitiveBadge level={question.cognitiveLevel} variant="long" />
                        <QbQuestionStatusBadge status={question.questionStatus} />
                        <span className="qb-add-q-row__chip qb-add-q-row__chip--muted">
                          {inThisBank
                            ? 'Đã có trong ngân hàng'
                            : question.questionBankName ?? 'Chưa gán ngân hàng'}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {totalPages > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        )}
      </div>
    </QbModal>
  );
}
