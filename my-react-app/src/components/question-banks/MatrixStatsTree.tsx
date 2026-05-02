import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { QuestionBankMatrixStatsResponse } from '../../types/questionBank';
import './MatrixStatsTree.css';

interface MatrixStatsTreeProps {
  stats: QuestionBankMatrixStatsResponse[];
}

const questionTypeLabels: Record<string, string> = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  TRUE_FALSE: 'Đúng/Sai',
  SHORT_ANSWER: 'Trả lời ngắn',
};

const cognitiveLabels: Record<string, string> = {
  NHAN_BIET: 'NB',
  THONG_HIEU: 'TH',
  VAN_DUNG: 'VD',
  VAN_DUNG_CAO: 'VDC',
};

export function MatrixStatsTree({ stats }: MatrixStatsTreeProps) {
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  const toggleGrade = (grade: string) => {
    setExpandedGrades((prev) => {
      const next = new Set(prev);
      if (next.has(grade)) {
        next.delete(grade);
      } else {
        next.add(grade);
      }
      return next;
    });
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  const toggleType = (key: string) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (stats.length === 0) {
    return (
      <div className="matrix-stats-empty">
        <p className="muted">Chưa có câu hỏi trong ngân hàng này</p>
      </div>
    );
  }

  return (
    <div className="matrix-stats-tree">
      <div className="matrix-stats-header">
        <h4>📊 Phân bố chi tiết</h4>
        <p className="muted">Câu hỏi được nhóm theo lớp, chương, loại và mức độ</p>
      </div>

      {stats.map((grade) => {
        const isGradeExpanded = expandedGrades.has(grade.gradeLevel);

        return (
          <div key={grade.gradeLevel} className="matrix-stats-grade">
            <button
              className="matrix-stats-node matrix-stats-node--grade"
              onClick={() => toggleGrade(grade.gradeLevel)}
              type="button"
            >
              {isGradeExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span className="matrix-stats-label">📚 {grade.gradeLevel}</span>
              <span className="matrix-stats-count">{grade.totalQuestions} câu</span>
            </button>

            {isGradeExpanded && (
              <div className="matrix-stats-children">
                {grade.chapters.map((chapter) => {
                  const isChapterExpanded = expandedChapters.has(chapter.chapterId);

                  return (
                    <div key={chapter.chapterId} className="matrix-stats-chapter">
                      <button
                        className="matrix-stats-node matrix-stats-node--chapter"
                        onClick={() => toggleChapter(chapter.chapterId)}
                        type="button"
                      >
                        {isChapterExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <span className="matrix-stats-label">📖 {chapter.chapterName}</span>
                        <span className="matrix-stats-count">{chapter.totalQuestions} câu</span>
                      </button>

                      {isChapterExpanded && (
                        <div className="matrix-stats-children">
                          {chapter.types.map((type) => {
                            const typeKey = `${chapter.chapterId}-${type.questionType}`;
                            const isTypeExpanded = expandedTypes.has(typeKey);

                            return (
                              <div key={typeKey} className="matrix-stats-type">
                                <button
                                  className="matrix-stats-node matrix-stats-node--type"
                                  onClick={() => toggleType(typeKey)}
                                  type="button"
                                >
                                  {isTypeExpanded ? (
                                    <ChevronDown size={12} />
                                  ) : (
                                    <ChevronRight size={12} />
                                  )}
                                  <span className="matrix-stats-label">
                                    {questionTypeLabels[type.questionType] || type.questionType}
                                  </span>
                                  <span className="matrix-stats-count">
                                    {type.totalQuestions} câu
                                  </span>
                                </button>

                                {isTypeExpanded && (
                                  <div className="matrix-stats-cognitive">
                                    {Object.entries(type.cognitiveCounts).map(([level, count]) => (
                                      <div key={level} className="matrix-stats-cognitive-item">
                                        <span className="cognitive-badge">
                                          {cognitiveLabels[level] || level}
                                        </span>
                                        <span className="cognitive-count">{count}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
