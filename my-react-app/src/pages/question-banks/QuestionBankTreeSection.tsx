import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, RefreshCw, Sparkles } from 'lucide-react';
import MathText from '../../components/common/MathText';
import {
  QbCognitiveBadge,
  QbEmptyState,
  QbErrorState,
  QbQuestionStatusBadge,
} from '../../components/question-banks/qb-ui';
import { questionBankService } from '../../services/questionBankService';
import type {
  CognitiveLevelVi,
  QuestionBankTreeChapterNode,
  QuestionBankTreeResponse,
} from '../../types/questionBank';
import './QuestionBankTreeSection.css';

type Props = {
  bankId: string;
  /** Bumping this nonce forces a tree re-fetch (e.g. after a batch-assign). */
  refreshNonce?: number;
  onAddFromTemplate?: (
    chapterId: string,
    level: CognitiveLevelVi,
    chapterTitle: string
  ) => void;
  onAddFromMyQuestions?: (
    chapterId: string,
    level: CognitiveLevelVi,
    chapterTitle: string
  ) => void;
};

const LEVEL_ORDER: CognitiveLevelVi[] = ['NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG', 'VAN_DUNG_CAO'];

const LEVEL_BG_CLASS: Record<CognitiveLevelVi, string> = {
  NHAN_BIET: 'qbts-cell--nb',
  THONG_HIEU: 'qbts-cell--th',
  VAN_DUNG: 'qbts-cell--vd',
  VAN_DUNG_CAO: 'qbts-cell--vdc',
};

const QUESTION_TYPE_LABEL: Record<string, string> = {
  MULTIPLE_CHOICE: 'TN',
  TRUE_FALSE: 'Đ/S',
  SHORT_ANSWER: 'TLN',
  ESSAY: 'TL',
  CODING: 'Code',
};

export function QuestionBankTreeSection({
  bankId,
  refreshNonce,
  onAddFromTemplate,
  onAddFromMyQuestions,
}: Readonly<Props>) {
  const [tree, setTree] = useState<QuestionBankTreeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await questionBankService.getBankTree(bankId);
        const data = res.result;
        if (!data) {
          throw new Error('Không có dữ liệu cây ngân hàng.');
        }
        setTree(data);
        if (data.chapters.length > 0) {
          setExpanded(new Set([data.chapters[0].chapterId]));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không tải được cây ngân hàng');
      } finally {
        setLoading(false);
      }
    },
    [bankId]
  );

  useEffect(() => {
    if (!bankId) return;
    void load();
  }, [bankId, load, refreshNonce]);

  const toggle = (chapterId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  if (!bankId) return null;

  return (
    <section className="qbts">
      <header className="qbts__header">
        <div className="qbts__header-text">
          <h3 className="qbts__title">Theo chương và mức độ nhận thức</h3>
          {tree && (
            <p className="qbts__subtitle">
              {tree.schoolGradeName ?? 'Chưa gắn lớp'}
              {tree.subjectName ? ` · ${tree.subjectName}` : ''}
              {' · '}
              {tree.chapters.length} chương
            </p>
          )}
        </div>
        <button
          type="button"
          className="qb-btn qb-btn--secondary qb-btn--sm"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw size={13} /> Làm mới
        </button>
      </header>

      {/* Legend */}
      <div className="qbts__legend">
        <span className="qbts__legend-label">Mức độ:</span>
        {LEVEL_ORDER.map((level) => (
          <QbCognitiveBadge key={level} level={level} variant="long" />
        ))}
      </div>

      {loading && (
        <div className="qbts__loading">
          {[0, 1, 2].map((i) => (
            <div key={i} className="qb-skeleton qbts__loading-row" />
          ))}
        </div>
      )}

      {error && (
        <QbErrorState message={error} onRetry={() => void load()} />
      )}

      {!loading && !error && tree != null && tree.chapters.length === 0 && (
        <QbEmptyState
          title="Lớp này chưa có chương"
          description="Hãy thêm chương trong phần quản lý môn học trước khi nạp câu hỏi vào ma trận."
        />
      )}

      {!loading && !error && tree && tree.chapters.length > 0 && (
        <div className="qbts__chapters">
          {tree.chapters.map((chapter) => (
            <ChapterRow
              key={chapter.chapterId}
              chapter={chapter}
              expanded={expanded.has(chapter.chapterId)}
              onToggle={() => toggle(chapter.chapterId)}
              onAddFromTemplate={onAddFromTemplate}
              onAddFromMyQuestions={onAddFromMyQuestions}
            />
          ))}
        </div>
      )}
    </section>
  );
}

type ChapterRowProps = {
  chapter: QuestionBankTreeChapterNode;
  expanded: boolean;
  onToggle: () => void;
  onAddFromTemplate?: (
    chapterId: string,
    level: CognitiveLevelVi,
    chapterTitle: string
  ) => void;
  onAddFromMyQuestions?: (
    chapterId: string,
    level: CognitiveLevelVi,
    chapterTitle: string
  ) => void;
};

function intensityFromCount(count: number): 'empty' | 'low' | 'med' | 'high' {
  if (count === 0) return 'empty';
  if (count < 5) return 'low';
  if (count < 15) return 'med';
  return 'high';
}

function ChapterRow({
  chapter,
  expanded,
  onToggle,
  onAddFromTemplate,
  onAddFromMyQuestions,
}: Readonly<ChapterRowProps>) {
  const [openLevels, setOpenLevels] = useState<Set<CognitiveLevelVi>>(() => new Set());

  const toggleLevel = (level: CognitiveLevelVi) => {
    setOpenLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  };

  return (
    <article className="qbts-chapter">
      <header className="qbts-chapter__row">
        <button
          type="button"
          className="qbts-chapter__toggle"
          onClick={onToggle}
          aria-expanded={expanded}
        >
          {!expanded ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
          <span className="qbts-chapter__index">
            {chapter.orderIndex != null ? `Chương ${chapter.orderIndex}` : 'Chương'}
          </span>
          <span className="qbts-chapter__title qb-clamp-1">{chapter.title}</span>
        </button>
        <span className="qbts-chapter__total">
          <strong>{chapter.totalQuestions}</strong>
          <span>câu</span>
        </span>
      </header>

      {expanded && (
        <section className="qbts-levels" aria-label="Mức độ nhận thức theo chương">
          {LEVEL_ORDER.map((level) => {
            const bucket = chapter.buckets[level];
            const count = bucket?.count ?? 0;
            const questions = bucket?.questions ?? [];
            const intensity = intensityFromCount(count);
            const isLevelOpen = openLevels.has(level);

            return (
              <div
                key={level}
                className={`qbts-level ${LEVEL_BG_CLASS[level]} qbts-level--${intensity}`}
                data-level={level}
              >
                <div className="qbts-level__bar">
                  <button
                    type="button"
                    className="qbts-level__toggle"
                    onClick={() => toggleLevel(level)}
                    aria-expanded={isLevelOpen}
                    aria-controls={`qbts-level-panel-${chapter.chapterId}-${level}`}
                    id={`qbts-level-trigger-${chapter.chapterId}-${level}`}
                  >
                    {!isLevelOpen ? (
                      <ChevronRight size={16} className="qbts-level__chev" aria-hidden />
                    ) : (
                      <ChevronDown size={16} className="qbts-level__chev" aria-hidden />
                    )}
                    <QbCognitiveBadge level={level} variant="short" />
                    <span className="qbts-level__long">
                      <QbCognitiveBadge level={level} variant="long" />
                    </span>
                    <span className="qbts-level__count">{count}</span>
                    <span className="qbts-level__hint">
                      {isLevelOpen ? 'Thu gọn' : 'Xem câu hỏi'}
                    </span>
                  </button>
                  <div className="qbts-level__actions">
                    {onAddFromTemplate && (
                      <button
                        type="button"
                        className="qbts-cell__btn"
                        title="Sinh câu hỏi từ mẫu"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddFromTemplate(chapter.chapterId, level, chapter.title);
                        }}
                      >
                        <Sparkles size={11} />
                        Mẫu
                      </button>
                    )}
                    {onAddFromMyQuestions && (
                      <button
                        type="button"
                        className="qbts-cell__btn qbts-cell__btn--primary"
                        title="Thêm câu hỏi của tôi"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddFromMyQuestions(chapter.chapterId, level, chapter.title);
                        }}
                      >
                        <Plus size={11} />
                        Thêm
                      </button>
                    )}
                  </div>
                </div>

                {isLevelOpen && (
                  <section
                    className="qbts-level__panel"
                    id={`qbts-level-panel-${chapter.chapterId}-${level}`}
                    aria-labelledby={`qbts-level-trigger-${chapter.chapterId}-${level}`}
                  >
                    {questions.length === 0 ? (
                      <p className="qbts-level__empty">Chưa có câu hỏi ở mức này.</p>
                    ) : (
                      <ul className="qbts-level__questions">
                        {questions.map((q) => (
                          <li key={q.id} className="qbts-level__question">
                            <div className="qbts-level__question-meta">
                              {q.questionType && (
                                <span className="qbts-preview-type">
                                  {QUESTION_TYPE_LABEL[q.questionType] ?? q.questionType}
                                </span>
                              )}
                              {q.questionStatus ? (
                                <QbQuestionStatusBadge status={q.questionStatus} />
                              ) : null}
                              <span className="qbts-level__qid" title={q.id}>
                                #{q.id.slice(0, 8)}…
                              </span>
                            </div>
                            <div className="qbts-level__question-body">
                              <MathText text={q.questionText} />
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}
              </div>
            );
          })}
        </section>
      )}
    </article>
  );
}
