import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, Database } from 'lucide-react';
import { questionBankService } from '../../services/questionBankService';
import type {
  CognitiveLevelVi,
  QuestionBankResponse,
  QuestionBankTreeResponse,
} from '../../types/questionBank';
import type { BankCoverageCell } from '../../types/assessment.types';
import './BankCoverageTree.css';

interface BankCoverageTreeProps {
  /** Banks chosen for this generation run. */
  banks: QuestionBankResponse[];
  /** Optional matrix-vs-banks coverage cells. When present, shortage cells
   *  surface red gap badges next to the matching (chapter, level) row. */
  gaps?: BankCoverageCell[];
}

const COG_FULL: Record<CognitiveLevelVi, string> = {
  NHAN_BIET: 'Nhận biết',
  THONG_HIEU: 'Thông hiểu',
  VAN_DUNG: 'Vận dụng',
  VAN_DUNG_CAO: 'Vận dụng cao',
};

const COG_ORDER: CognitiveLevelVi[] = [
  'NHAN_BIET',
  'THONG_HIEU',
  'VAN_DUNG',
  'VAN_DUNG_CAO',
];

const COG_BG: Record<CognitiveLevelVi, string> = {
  NHAN_BIET: 'bct-cog--nb',
  THONG_HIEU: 'bct-cog--th',
  VAN_DUNG: 'bct-cog--vd',
  VAN_DUNG_CAO: 'bct-cog--vdc',
};

const QUESTION_TYPE_LABEL: Record<string, string> = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  MCQ: 'Trắc nghiệm',
  TRUE_FALSE: 'Đúng/Sai',
  TRUE_FALSE_CLAUSES: 'Đúng/Sai',
  SHORT_ANSWER: 'Trả lời ngắn',
  FILL_BLANK: 'Điền khuyết',
  ESSAY: 'Tự luận',
};

export function BankCoverageTree({ banks, gaps }: BankCoverageTreeProps) {
  const [trees, setTrees] = useState<Record<string, QuestionBankTreeResponse | null>>(
    {}
  );
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Fetch tree for any bank that hasn't been loaded yet, when the banks prop
  // changes. We keep already-loaded trees cached across re-renders.
  useEffect(() => {
    const missing = banks.filter((b) => !(b.id in trees) && !loadingIds.has(b.id));
    if (missing.length === 0) return;

    const ids = missing.map((b) => b.id);
    setLoadingIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });

    let cancelled = false;
    Promise.all(
      missing.map((b) =>
        questionBankService
          .getBankTree(b.id)
          .then((res) => ({ id: b.id, tree: res.result ?? null }))
          .catch(() => ({ id: b.id, tree: null }))
      )
    ).then((results) => {
      if (cancelled) return;
      setTrees((prev) => {
        const next = { ...prev };
        for (const { id, tree } of results) next[id] = tree;
        return next;
      });
      setLoadingIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banks.map((b) => b.id).join(',')]);

  // Auto-expand first bank when banks change.
  useEffect(() => {
    if (banks.length > 0 && expanded.size === 0) {
      setExpanded(new Set([banks[0].id]));
    }
  }, [banks, expanded.size]);

  // Index gaps by (chapterId|level). Multiple question types at the same
  // (chapter, level) each get their own shortage chip so the user can see
  // 'thiếu Trắc nghiệm' and 'thiếu Đúng/Sai' separately when both apply.
  const gapsByChapterLevel = useMemo(() => {
    if (!gaps) return new Map<string, BankCoverageCell[]>();
    const map = new Map<string, BankCoverageCell[]>();
    for (const cell of gaps) {
      if (cell.available >= cell.required) continue;
      if (!cell.chapterId || !cell.cognitiveLevel) continue;
      // Normalise "TRUE_FALSE_CLAUSES" placeholder back to a stable label.
      const level = cell.cognitiveLevel.replace('TRUE_FALSE_CLAUSES', 'TRUE_FALSE');
      const key = `${cell.chapterId}|${level}`;
      const list = map.get(key) ?? [];
      list.push(cell);
      map.set(key, list);
    }
    return map;
  }, [gaps]);

  function toggle(bankId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(bankId)) next.delete(bankId);
      else next.add(bankId);
      return next;
    });
  }

  if (banks.length === 0) {
    return (
      <div className="bct bct--empty">Chưa chọn ngân hàng câu hỏi nào.</div>
    );
  }

  return (
    <div className="bct">
      {banks.map((bank) => {
        const isExpanded = expanded.has(bank.id);
        const tree = trees[bank.id];
        const isLoading = loadingIds.has(bank.id);
        return (
          <article key={bank.id} className="bct-bank">
            <button
              type="button"
              className="bct-bank__head"
              onClick={() => toggle(bank.id)}
              aria-expanded={isExpanded}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span className="bct-bank__icon">
                <Database size={13} />
              </span>
              <span className="bct-bank__title">{bank.name}</span>
              <span className="bct-bank__meta">
                {bank.schoolGradeName ?? (bank.gradeLevel ? `Lớp ${bank.gradeLevel}` : '—')}
                {bank.subjectName ? ` · ${bank.subjectName}` : ''}
                {' · '}
                {bank.questionCount ?? 0} câu
              </span>
            </button>

            {isExpanded && (
              <div className="bct-bank__body">
                {isLoading && (
                  <p className="bct-bank__loading">Đang tải cấu trúc ngân hàng…</p>
                )}

                {!isLoading && (!tree || tree.chapters.length === 0) && (
                  <p className="bct-bank__loading">ngân hàng chưa có chương nào.</p>
                )}

                {!isLoading && tree && tree.chapters.length > 0 && (
                  <ul className="bct-chapter-list">
                    {tree.chapters.map((ch) => (
                      <li key={ch.chapterId} className="bct-chapter">
                        <div className="bct-chapter__head">
                          <span className="bct-chapter__index">
                            {ch.orderIndex != null ? `Chương ${ch.orderIndex}` : 'Chương'}
                          </span>
                          <span className="bct-chapter__title">{ch.title}</span>
                          <span className="bct-chapter__total">
                            {ch.totalQuestions} câu
                          </span>
                        </div>
                        <ul className="bct-cog-list">
                          {COG_ORDER.map((level) => {
                            const bucket = ch.buckets[level];
                            const count = bucket?.count ?? 0;
                            const cellGaps =
                              gapsByChapterLevel.get(`${ch.chapterId}|${level}`) ?? [];
                            const hasGap = cellGaps.length > 0;
                            return (
                              <li
                                key={level}
                                className={`bct-cog ${COG_BG[level]} ${hasGap ? 'bct-cog--gap' : ''}`}
                              >
                                <span className="bct-cog__label">
                                  {COG_FULL[level]}
                                </span>
                                <span className="bct-cog__count">{count}</span>
                                {cellGaps.map((gap, gi) => {
                                  const typeLabel = gap.questionType
                                    ? QUESTION_TYPE_LABEL[gap.questionType] ?? gap.questionType
                                    : null;
                                  return (
                                    <span
                                      key={`${gap.questionType ?? 'gap'}-${gi}`}
                                      className="bct-cog__gap"
                                      title={`Thiếu${typeLabel ? ' ' + typeLabel : ''}`}
                                    >
                                      <AlertTriangle size={11} />
                                      {typeLabel && <strong>{typeLabel}</strong>}
                                      {' '}cần {gap.required}, có {gap.available}
                                    </span>
                                  );
                                })}
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
