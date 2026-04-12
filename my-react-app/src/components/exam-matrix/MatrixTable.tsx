import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { ExamMatrixTableRow, ExamMatrixTableChapter } from '../../types/examMatrix';
import { EditableCell } from './EditableCell';
import './matrix-table.css';

interface MatrixTableProps {
  chapters: ExamMatrixTableChapter[];
  gradeLevel?: string;
  subjectName?: string;
  canEdit: boolean;
  onRemoveRow: (rowId: string) => Promise<void>;
  onUpdateCell?: (rowId: string, level: string, questionCount: number, pointsPerQuestion: number) => Promise<void>;
}

const cognitiveOrder = ['NB', 'TH', 'VD', 'VDC'] as const;
type MatrixLevel = (typeof cognitiveOrder)[number];

const levelLabels: Record<MatrixLevel, string> = {
  NB: 'Nhận biết',
  TH: 'Thông hiểu',
  VD: 'Vận dụng',
  VDC: 'Vận dụng cao',
};

function normalizeLevel(level: string): MatrixLevel | null {
  const upper = level.toUpperCase();
  if (upper === 'NB' || upper === 'NHAN_BIET' || upper === 'REMEMBER') return 'NB';
  if (upper === 'TH' || upper === 'THONG_HIEU' || upper === 'UNDERSTAND') return 'TH';
  if (upper === 'VD' || upper === 'VAN_DUNG' || upper === 'APPLY') return 'VD';
  if (upper === 'VDC' || upper === 'VAN_DUNG_CAO' || upper === 'ANALYZE') return 'VDC';
  return null;
}

function getLevelCount(row: ExamMatrixTableRow, level: MatrixLevel): number {
  const fromCells = row.cells?.find((cell) => normalizeLevel(cell.cognitiveLevel) === level);
  if (fromCells) return fromCells.questionCount ?? 0;
  
  const dist = row.countByCognitive;
  if (!dist) return 0;
  
  if (level === 'NB') return dist.NB ?? dist.NHAN_BIET ?? dist.REMEMBER ?? 0;
  if (level === 'TH') return dist.TH ?? dist.THONG_HIEU ?? dist.UNDERSTAND ?? 0;
  if (level === 'VD') return dist.VD ?? dist.VAN_DUNG ?? dist.APPLY ?? 0;
  return dist.VDC ?? dist.VAN_DUNG_CAO ?? dist.ANALYZE ?? 0;
}

export function MatrixTable({
  chapters,
  gradeLevel,
  subjectName: _subjectName,
  canEdit,
  onRemoveRow,
}: MatrixTableProps) {
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null);

  // Calculate totals
  const { columnTotals, chapterTotals, grandTotal } = useMemo(() => {
    const columnTotals = { NB: 0, TH: 0, VD: 0, VDC: 0, total: 0 };
    const chapterTotals: Record<string, { NB: number; TH: number; VD: number; VDC: number; total: number }> = {};

    chapters.forEach((chapter) => {
      const chapterId = chapter.chapterId || chapter.chapterName || '';
      chapterTotals[chapterId] = { NB: 0, TH: 0, VD: 0, VDC: 0, total: 0 };

      chapter.rows.forEach((row) => {
        cognitiveOrder.forEach((level) => {
          const count = getLevelCount(row, level);
          columnTotals[level] += count;
          chapterTotals[chapterId][level] += count;
        });
        const rowTotal = row.rowTotalQuestions || 0;
        columnTotals.total += rowTotal;
        chapterTotals[chapterId].total += rowTotal;
      });
    });

    return {
      columnTotals,
      chapterTotals,
      grandTotal: columnTotals.total,
    };
  }, [chapters]);

  const handleRemoveRow = async (rowId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa dòng này?')) return;
    setDeletingRowId(rowId);
    try {
      await onRemoveRow(rowId);
    } finally {
      setDeletingRowId(null);
    }
  };

  if (chapters.length === 0) {
    return (
      <div className="matrix-empty">
        Ma trận chưa có dòng nào. Hãy thêm dòng từ ngân hàng câu hỏi.
      </div>
    );
  }

  return (
    <div className="matrix-container">
      <div className="matrix-scroll-wrapper">
        <table className="matrix-table">
          {/* Header */}
          <thead className="matrix-header">
            <tr>
              <th className="matrix-th matrix-th--grade" rowSpan={2}>
                Lớp
              </th>
              <th className="matrix-th matrix-th--chapter" rowSpan={2}>
                Chương
              </th>
              <th className="matrix-th matrix-th--type" rowSpan={2}>
                Dạng bài
              </th>
              <th className="matrix-th matrix-th--reference" rowSpan={2}>
                Trích dẫn
              </th>
              <th className="matrix-th matrix-th--cognitive-group" colSpan={4}>
                Mức độ nhận thức
              </th>
              <th className="matrix-th matrix-th--total-type" rowSpan={2}>
                Tổng<br />dạng bài
              </th>
              <th className="matrix-th matrix-th--total-chapter" rowSpan={2}>
                Tổng<br />chương
              </th>
              {canEdit && (
                <th className="matrix-th matrix-th--actions" rowSpan={2}>
                  Thao tác
                </th>
              )}
            </tr>
            <tr>
              {cognitiveOrder.map((level) => (
                <th key={level} className={`matrix-th matrix-th--level matrix-th--level-${level.toLowerCase()}`}>
                  <div className="matrix-level-header">
                    <span className="matrix-level-code">{level}</span>
                    <span className="matrix-level-label">{levelLabels[level]}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="matrix-body">
            {chapters.map((chapter, chapterIndex) => {
              const chapterId = chapter.chapterId || chapter.chapterName || '';
              const chapterName = chapter.chapterName || 'Chương không xác định';
              const rowCount = chapter.rows.length;

              return chapter.rows.map((row, rowIndex) => {
                const isFirstRowInChapter = rowIndex === 0;
                const rowTotal = row.rowTotalQuestions || 0;
                
                // Get grade from multiple possible sources
                const displayGrade = gradeLevel || 
                  row.schoolGradeName || 
                  row.gradeLevel || 
                  row.schoolGrade || 
                  'N/A';
                
                // Get chapter name from multiple possible sources
                const displayChapter = chapterName !== 'Chương không xác định' 
                  ? chapterName 
                  : (row.chapterName || row.chapter || 'Chương không xác định');

                return (
                  <tr
                    key={row.rowId}
                    className={`matrix-row ${chapterIndex % 2 === 0 ? 'matrix-row--even' : 'matrix-row--odd'}`}
                  >
                    {/* Grade (only show on first row of first chapter) */}
                    {chapterIndex === 0 && isFirstRowInChapter && (
                      <td
                        className="matrix-td matrix-td--grade"
                        rowSpan={chapters.reduce((sum, ch) => sum + ch.rows.length, 0)}
                      >
                        <div className="matrix-grade-cell">
                          {displayGrade}
                        </div>
                      </td>
                    )}

                    {/* Chapter (rowspan for all rows in chapter) */}
                    {isFirstRowInChapter && (
                      <td
                        className="matrix-td matrix-td--chapter"
                        rowSpan={rowCount}
                      >
                        <div className="matrix-chapter-cell">
                          {displayChapter}
                        </div>
                      </td>
                    )}

                    {/* Question Type */}
                    <td className="matrix-td matrix-td--type">
                      <div className="matrix-type-cell">
                        {row.questionTypeName || 'N/A'}
                      </div>
                    </td>

                    {/* Reference */}
                    <td className="matrix-td matrix-td--reference">
                      <div className="matrix-reference-cell">
                        {row.subject_name || row.subjectName || row.subject || '-'}
                      </div>
                    </td>

                    {/* Cognitive Levels */}
                    {cognitiveOrder.map((level) => {
                      const count = getLevelCount(row, level);
                      return (
                        <td
                          key={level}
                          className={`matrix-td matrix-td--level matrix-td--level-${level.toLowerCase()} ${
                            count === 0 ? 'matrix-td--empty' : ''
                          }`}
                        >
                          <EditableCell
                            value={count}
                            editable={canEdit}
                            onChange={(newValue: number) => {
                              // Handle cell update
                              console.log('Update cell:', row.rowId, level, newValue);
                            }}
                          />
                        </td>
                      );
                    })}

                    {/* Row Total */}
                    <td className="matrix-td matrix-td--total-type">
                      <div className="matrix-total-cell">
                        {rowTotal}
                      </div>
                    </td>

                    {/* Chapter Total (only show on first row) */}
                    {isFirstRowInChapter && (
                      <td
                        className="matrix-td matrix-td--total-chapter"
                        rowSpan={rowCount}
                      >
                        <div className="matrix-chapter-total-cell">
                          {chapterTotals[chapterId]?.total || 0}
                        </div>
                      </td>
                    )}

                    {/* Actions */}
                    {canEdit && (
                      <td className="matrix-td matrix-td--actions">
                        <button
                          className="matrix-delete-btn"
                          onClick={() => void handleRemoveRow(row.rowId)}
                          disabled={deletingRowId === row.rowId}
                          title="Xóa dòng"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              });
            })}

            {/* Grand Total Row */}
            <tr className="matrix-row matrix-row--grand-total">
              <td
                className="matrix-td matrix-td--total-label"
                colSpan={4}
              >
                <div className="matrix-grand-total-label">
                  TỔNG CỘNG
                </div>
              </td>
              {cognitiveOrder.map((level) => (
                <td
                  key={level}
                  className={`matrix-td matrix-td--level matrix-td--level-${level.toLowerCase()} matrix-td--grand-total`}
                >
                  <div className="matrix-grand-total-cell">
                    {columnTotals[level]}
                  </div>
                </td>
              ))}
              <td className="matrix-td matrix-td--total-type matrix-td--grand-total">
                <div className="matrix-grand-total-cell">
                  {grandTotal}
                </div>
              </td>
              <td className="matrix-td matrix-td--total-chapter matrix-td--grand-total">
                <div className="matrix-grand-total-cell">
                  {grandTotal}
                </div>
              </td>
              {canEdit && <td className="matrix-td matrix-td--actions"></td>}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
