import { Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type {
  BatchUpsertMatrixRowCellsRequest,
  ExamMatrixTableChapter,
  ExamMatrixTableRow,
} from '../../types/examMatrix';
import { EditableCell } from './EditableCell';
import './matrix-table.css';

type PercentageLevel = 'NHAN_BIET' | 'THONG_HIEU' | 'VAN_DUNG' | 'VAN_DUNG_CAO';

export interface PercentageDraftValues {
  totalQuestionsTarget: number;
  cognitiveLevelPercentages: Record<PercentageLevel, number>;
}

interface MatrixTableProps {
  chapters: ExamMatrixTableChapter[];
  gradeLevel?: string;
  subjectName?: string;
  matrixTotalPointsTarget?: number;
  canEdit: boolean;
  onRemoveRow: (rowId: string) => Promise<void>;
  percentageDraft?: PercentageDraftValues;
  onChangePercentageDraft?: (draft: PercentageDraftValues) => void;
  onSavePercentages?: (request: BatchUpsertMatrixRowCellsRequest) => Promise<void>;
  savingPercentages?: boolean;
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

function allocateByPercent(total: number, percentages: number[]): number[] {
  const safeTotal = Number.isFinite(total) ? Math.max(0, Math.round(total)) : 0;
  if (safeTotal === 0) return percentages.map(() => 0);

  const weights = percentages.map((value) => (Number.isFinite(value) ? Math.max(0, value) : 0));
  const weightSum = weights.reduce((sum, value) => sum + value, 0);
  const normalized =
    weightSum > 0
      ? weights.map((value) => value / weightSum)
      : weights.map(() => 1 / Math.max(weights.length, 1));

  const raw = normalized.map((ratio) => ratio * safeTotal);
  const base = raw.map((value) => Math.floor(value));
  let remainder = safeTotal - base.reduce((sum, value) => sum + value, 0);

  const ranked = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);

  let pointer = 0;
  while (remainder > 0 && ranked.length > 0) {
    const index = ranked[pointer % ranked.length].index;
    base[index] += 1;
    remainder -= 1;
    pointer += 1;
  }

  return base;
}

function distributeByRowAndColumn(rowTargets: number[], colTargets: number[]): number[][] {
  const rowCount = rowTargets.length;
  const colCount = colTargets.length;
  const matrix = Array.from({ length: rowCount }, () => Array.from({ length: colCount }, () => 0));

  const remainingRows = [...rowTargets];
  const remainingCols = [...colTargets];
  let remainingTotal = remainingRows.reduce((sum, value) => sum + value, 0);

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    for (let colIndex = 0; colIndex < colCount; colIndex += 1) {
      let nextValue = 0;

      if (rowIndex === rowCount - 1 && colIndex === colCount - 1) {
        nextValue = Math.min(remainingRows[rowIndex], remainingCols[colIndex]);
      } else if (rowIndex === rowCount - 1) {
        nextValue = remainingCols[colIndex];
      } else if (colIndex === colCount - 1) {
        nextValue = remainingRows[rowIndex];
      } else if (remainingTotal > 0) {
        const expected =
          (remainingRows[rowIndex] * remainingCols[colIndex]) / Math.max(remainingTotal, 1);
        nextValue = Math.min(
          remainingRows[rowIndex],
          remainingCols[colIndex],
          Math.max(0, Math.round(expected))
        );
      }

      const value = Math.max(0, nextValue);
      matrix[rowIndex][colIndex] = value;
      remainingRows[rowIndex] -= value;
      remainingCols[colIndex] -= value;
      remainingTotal -= value;
    }
  }

  return matrix;
}

export function MatrixTable({
  chapters,
  gradeLevel,
  subjectName: _subjectName,
  matrixTotalPointsTarget,
  canEdit,
  onRemoveRow,
  percentageDraft,
  onChangePercentageDraft,
  onSavePercentages,
  savingPercentages,
}: Readonly<MatrixTableProps>) {
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null);
  const [rowPercentages, setRowPercentages] = useState<Record<string, number>>({});
  const [manualCellsByRow, setManualCellsByRow] = useState<Record<
    string,
    Record<MatrixLevel, number>
  > | null>(null);
  const [previewFromPercent, setPreviewFromPercent] = useState(false);

  const flatRows = useMemo(
    () =>
      chapters.flatMap((chapter) =>
        chapter.rows.map((row) => ({
          chapter,
          row,
        }))
      ),
    [chapters]
  );

  useEffect(() => {
    if (flatRows.length === 0) {
      setRowPercentages({});
      return;
    }

    setRowPercentages((prev) => {
      const hasAllExisting = flatRows.every(({ row }) => prev[row.rowId] !== undefined);
      if (hasAllExisting && Object.keys(prev).length === flatRows.length) {
        return prev;
      }

      const totalExistingQuestions = flatRows.reduce(
        (sum, item) => sum + Math.max(0, item.row.rowTotalQuestions || 0),
        0
      );

      const defaults: Record<string, number> = {};
      if (totalExistingQuestions > 0) {
        for (const item of flatRows) {
          defaults[item.row.rowId] =
            ((item.row.rowTotalQuestions || 0) / totalExistingQuestions) * 100;
        }
      } else {
        const equal = 100 / flatRows.length;
        for (const item of flatRows) {
          defaults[item.row.rowId] = equal;
        }
      }

      return defaults;
    });
  }, [flatRows]);

  const calculatedCellsByRow = useMemo(() => {
    if (!percentageDraft || flatRows.length === 0)
      return {} as Record<string, Record<MatrixLevel, number>>;

    const colPercentages = [
      percentageDraft.cognitiveLevelPercentages.NHAN_BIET,
      percentageDraft.cognitiveLevelPercentages.THONG_HIEU,
      percentageDraft.cognitiveLevelPercentages.VAN_DUNG,
      percentageDraft.cognitiveLevelPercentages.VAN_DUNG_CAO,
    ];

    const rowPercentagesList = flatRows.map(
      ({ row }) => Number(rowPercentages[row.rowId] ?? 0) || 0
    );
    const rowTargets = allocateByPercent(percentageDraft.totalQuestionsTarget, rowPercentagesList);
    const colTargets = allocateByPercent(percentageDraft.totalQuestionsTarget, colPercentages);
    const matrix = distributeByRowAndColumn(rowTargets, colTargets);

    return matrix.reduce<Record<string, Record<MatrixLevel, number>>>((acc, values, rowIndex) => {
      acc[flatRows[rowIndex].row.rowId] = {
        NB: values[0] ?? 0,
        TH: values[1] ?? 0,
        VD: values[2] ?? 0,
        VDC: values[3] ?? 0,
      };
      return acc;
    }, {});
  }, [flatRows, percentageDraft, rowPercentages]);

  const serverCellsByRow = useMemo(() => {
    const cellsByRow: Record<string, Record<MatrixLevel, number>> = {};
    for (const item of flatRows) {
      cellsByRow[item.row.rowId] = {
        NB: getLevelCount(item.row, 'NB'),
        TH: getLevelCount(item.row, 'TH'),
        VD: getLevelCount(item.row, 'VD'),
        VDC: getLevelCount(item.row, 'VDC'),
      };
    }
    return cellsByRow;
  }, [flatRows]);

  const displayedCellsByRow = useMemo(() => {
    if (manualCellsByRow) return manualCellsByRow;
    if (previewFromPercent && percentageDraft) return calculatedCellsByRow;
    return serverCellsByRow;
  }, [
    calculatedCellsByRow,
    manualCellsByRow,
    percentageDraft,
    previewFromPercent,
    serverCellsByRow,
  ]);

  useEffect(() => {
    if (!savingPercentages) {
      setManualCellsByRow(null);
      setPreviewFromPercent(false);
    }
  }, [savingPercentages]);

  // Calculate totals
  const { columnTotals, grandTotal } = useMemo(() => {
    const columnTotals = { NB: 0, TH: 0, VD: 0, VDC: 0, total: 0 };

    for (const chapter of chapters) {
      for (const row of chapter.rows) {
        for (const level of cognitiveOrder) {
          const count = percentageDraft
            ? (displayedCellsByRow[row.rowId]?.[level] ?? 0)
            : getLevelCount(row, level);
          columnTotals[level] += count;
        }
        const rowTotal = percentageDraft
          ? cognitiveOrder.reduce(
              (sum, level) => sum + (displayedCellsByRow[row.rowId]?.[level] ?? 0),
              0
            )
          : row.rowTotalQuestions || 0;
        columnTotals.total += rowTotal;
      }
    }

    return {
      columnTotals,
      grandTotal: columnTotals.total,
    };
  }, [chapters, displayedCellsByRow, percentageDraft]);

  const totalPercentage = useMemo(() => {
    if (!percentageDraft) return 0;
    const p = percentageDraft.cognitiveLevelPercentages;
    return p.NHAN_BIET + p.THONG_HIEU + p.VAN_DUNG + p.VAN_DUNG_CAO;
  }, [percentageDraft]);

  const estimatedDistribution = useMemo(() => {
    if (!percentageDraft) {
      return {
        NHAN_BIET: 0,
        THONG_HIEU: 0,
        VAN_DUNG: 0,
        VAN_DUNG_CAO: 0,
      };
    }
    const totalQuestions = Number.isFinite(percentageDraft.totalQuestionsTarget)
      ? Math.max(0, percentageDraft.totalQuestionsTarget)
      : 0;
    const p = percentageDraft.cognitiveLevelPercentages;
    return {
      NHAN_BIET: Math.round((totalQuestions * p.NHAN_BIET) / 100),
      THONG_HIEU: Math.round((totalQuestions * p.THONG_HIEU) / 100),
      VAN_DUNG: Math.round((totalQuestions * p.VAN_DUNG) / 100),
      VAN_DUNG_CAO: Math.round((totalQuestions * p.VAN_DUNG_CAO) / 100),
    };
  }, [percentageDraft]);

  const canShowPercentageControls = !!percentageDraft;

  const isPercentageTotalValid = Math.abs(totalPercentage - 100) <= 0.01;
  const totalRowPercentage = useMemo(
    () =>
      flatRows.reduce((sum, item) => sum + (Number(rowPercentages[item.row.rowId] ?? 0) || 0), 0),
    [flatRows, rowPercentages]
  );
  const isRowPercentageTotalValid = Math.abs(totalRowPercentage - 100) <= 0.01;

  const updateDraft = (partial: Partial<PercentageDraftValues>) => {
    if (!percentageDraft || !onChangePercentageDraft) return;
    setManualCellsByRow(null);
    setPreviewFromPercent(true);
    onChangePercentageDraft({
      ...percentageDraft,
      ...partial,
    });
  };

  const updateLevel = (level: PercentageLevel, value: number) => {
    if (!percentageDraft || !onChangePercentageDraft) return;
    setManualCellsByRow(null);
    setPreviewFromPercent(true);

    const allLevels: PercentageLevel[] = ['NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG', 'VAN_DUNG_CAO'];
    const prev = percentageDraft.cognitiveLevelPercentages;
    const safeValue = Math.max(0, Math.min(100, value));
    const oldValue = prev[level];
    const diff = safeValue - oldValue;

    // Auto-adjust: find the level with the highest percentage (excluding the changed one) and adjust it
    const others = allLevels.filter((l) => l !== level);
    const otherSum = others.reduce((sum, l) => sum + prev[l], 0);

    let newPercentages: Record<PercentageLevel, number>;
    if (diff === 0) {
      newPercentages = { ...prev, [level]: safeValue };
    } else if (Math.abs(otherSum) < 0.001) {
      // All others are 0; distribute diff equally among them
      const adjust = -diff / others.length;
      newPercentages = { ...prev, [level]: safeValue };
      for (const l of others) newPercentages[l] = Math.max(0, prev[l] + adjust);
    } else {
      // Adjust proportionally from the others, clamped to 0
      newPercentages = { ...prev, [level]: safeValue };
      let remaining = diff;
      // Sort others by descending value to adjust largest first
      const sortedOthers = [...others].sort((a, b) => prev[b] - prev[a]);
      for (const l of sortedOthers) {
        const maxReduce = prev[l];
        const adjust = Math.min(remaining, maxReduce);
        newPercentages[l] = Math.max(0, prev[l] - adjust);
        remaining -= adjust;
        if (Math.abs(remaining) < 0.0001) break;
      }
    }

    onChangePercentageDraft({
      ...percentageDraft,
      cognitiveLevelPercentages: newPercentages,
    });
  };

  const updateRowPercentage = (rowId: string, value: number) => {
    setManualCellsByRow(null);
    setPreviewFromPercent(true);
    setRowPercentages((previous) => ({
      ...previous,
      [rowId]: value,
    }));
  };

  const syncPercentagesFromCells = (cellsByRow: Record<string, Record<MatrixLevel, number>>) => {
    if (!percentageDraft || !onChangePercentageDraft || flatRows.length === 0) return;

    const totalQuestions = flatRows.reduce(
      (sum, item) =>
        sum +
        cognitiveOrder.reduce(
          (rowSum, level) => rowSum + (cellsByRow[item.row.rowId]?.[level] ?? 0),
          0
        ),
      0
    );

    if (totalQuestions <= 0) {
      return;
    }

    const nextRowPercentages: Record<string, number> = {};
    for (const item of flatRows) {
      const rowSum = cognitiveOrder.reduce(
        (sum, level) => sum + (cellsByRow[item.row.rowId]?.[level] ?? 0),
        0
      );
      nextRowPercentages[item.row.rowId] = Number(((rowSum / totalQuestions) * 100).toFixed(2));
    }
    setRowPercentages(nextRowPercentages);

    const colSums = {
      NB: 0,
      TH: 0,
      VD: 0,
      VDC: 0,
    };

    for (const item of flatRows) {
      colSums.NB += cellsByRow[item.row.rowId]?.NB ?? 0;
      colSums.TH += cellsByRow[item.row.rowId]?.TH ?? 0;
      colSums.VD += cellsByRow[item.row.rowId]?.VD ?? 0;
      colSums.VDC += cellsByRow[item.row.rowId]?.VDC ?? 0;
    }

    onChangePercentageDraft({
      totalQuestionsTarget: totalQuestions,
      cognitiveLevelPercentages: {
        NHAN_BIET: Number(((colSums.NB / totalQuestions) * 100).toFixed(2)),
        THONG_HIEU: Number(((colSums.TH / totalQuestions) * 100).toFixed(2)),
        VAN_DUNG: Number(((colSums.VD / totalQuestions) * 100).toFixed(2)),
        VAN_DUNG_CAO: Number(((colSums.VDC / totalQuestions) * 100).toFixed(2)),
      },
    });
  };

  const handleCellChange = (rowId: string, level: MatrixLevel, newValue: number) => {
    if (!percentageDraft || !canEdit) return;

    const base = manualCellsByRow ?? calculatedCellsByRow;
    const nextCellsByRow: Record<string, Record<MatrixLevel, number>> = {};

    for (const item of flatRows) {
      const current = base[item.row.rowId] ?? { NB: 0, TH: 0, VD: 0, VDC: 0 };
      nextCellsByRow[item.row.rowId] = {
        NB: current.NB,
        TH: current.TH,
        VD: current.VD,
        VDC: current.VDC,
      };
    }

    const safeValue = Math.max(0, Math.round(newValue));
    if (!nextCellsByRow[rowId]) {
      nextCellsByRow[rowId] = { NB: 0, TH: 0, VD: 0, VDC: 0 };
    }
    nextCellsByRow[rowId][level] = safeValue;

    setManualCellsByRow(nextCellsByRow);
    setPreviewFromPercent(false);
    syncPercentagesFromCells(nextCellsByRow);
  };

  const getCellChangeHandler = (rowId: string, level: MatrixLevel) => {
    return (nextValue: number) => {
      handleCellChange(rowId, level, nextValue);
    };
  };

  const handleSaveCellBatch = async () => {
    if (!percentageDraft || !onSavePercentages || flatRows.length === 0) return;

    const pointsPerQuestionBase =
      (matrixTotalPointsTarget && matrixTotalPointsTarget > 0
        ? matrixTotalPointsTarget
        : percentageDraft.totalQuestionsTarget) / Math.max(percentageDraft.totalQuestionsTarget, 1);
    const pointsPerQuestion = Math.max(0.01, Number(pointsPerQuestionBase.toFixed(4)));

    const request: BatchUpsertMatrixRowCellsRequest = {
      rows: flatRows.map(({ row }) => {
        const calculated = displayedCellsByRow[row.rowId] ?? { NB: 0, TH: 0, VD: 0, VDC: 0 };
        return {
          rowId: row.rowId,
          cells: [
            {
              cognitiveLevel: 'NHAN_BIET',
              questionCount: calculated.NB,
              pointsPerQuestion,
            },
            {
              cognitiveLevel: 'THONG_HIEU',
              questionCount: calculated.TH,
              pointsPerQuestion,
            },
            {
              cognitiveLevel: 'VAN_DUNG',
              questionCount: calculated.VD,
              pointsPerQuestion,
            },
            {
              cognitiveLevel: 'VAN_DUNG_CAO',
              questionCount: calculated.VDC,
              pointsPerQuestion,
            },
          ],
        };
      }),
    };

    await onSavePercentages(request);
    setManualCellsByRow(null);
    setPreviewFromPercent(false);
  };

  const handleRemoveRow = async (rowId: string) => {
    if (!globalThis.confirm('Bạn có chắc muốn xóa dòng này?')) return;
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
                Tổng
                <br />
                dạng bài
              </th>
              {canEdit && (
                <th className="matrix-th matrix-th--actions" rowSpan={2}>
                  Thao tác
                </th>
              )}
            </tr>
            <tr>
              {cognitiveOrder.map((level) => (
                <th
                  key={level}
                  className={`matrix-th matrix-th--level matrix-th--level-${level.toLowerCase()}`}
                >
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
              const chapterName = chapter.chapterName || 'Chương không xác định';
              const rowCount = chapter.rows.length;

              return chapter.rows.map((row, rowIndex) => {
                const isFirstRowInChapter = rowIndex === 0;
                const rowTotal = percentageDraft
                  ? cognitiveOrder.reduce(
                      (sum, level) => sum + (displayedCellsByRow[row.rowId]?.[level] ?? 0),
                      0
                    )
                  : row.rowTotalQuestions || 0;

                // Get grade from multiple possible sources
                const displayGrade =
                  gradeLevel || row.schoolGradeName || row.gradeLevel || row.schoolGrade || 'N/A';

                // Get chapter name from multiple possible sources
                const displayChapter =
                  chapterName === 'Chương không xác định'
                    ? row.chapterName || row.chapter || 'Chương không xác định'
                    : chapterName;

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
                        <div className="matrix-grade-cell">{displayGrade}</div>
                      </td>
                    )}

                    {/* Chapter (rowspan for all rows in chapter) */}
                    {isFirstRowInChapter && (
                      <td className="matrix-td matrix-td--chapter" rowSpan={rowCount}>
                        <div className="matrix-chapter-cell">{displayChapter}</div>
                      </td>
                    )}

                    {/* Question Type */}
                    <td className="matrix-td matrix-td--type">
                      <div className="matrix-type-cell">{row.questionTypeName || 'N/A'}</div>
                    </td>

                    {/* Reference */}
                    <td className="matrix-td matrix-td--reference">
                      <div className="matrix-reference-cell">
                        {row.subject_name || row.subjectName || row.subject || '-'}
                      </div>
                    </td>

                    {/* Cognitive Levels */}
                    {cognitiveOrder.map((level) => {
                      const count = percentageDraft
                        ? (displayedCellsByRow[row.rowId]?.[level] ?? 0)
                        : getLevelCount(row, level);
                      return (
                        <td
                          key={level}
                          className={`matrix-td matrix-td--level matrix-td--level-${level.toLowerCase()} ${
                            count === 0 ? 'matrix-td--empty' : ''
                          }`}
                        >
                          <EditableCell
                            value={count}
                            editable={canEdit && !!percentageDraft}
                            onChange={getCellChangeHandler(row.rowId, level)}
                          />
                        </td>
                      );
                    })}

                    {/* Row Total */}
                    <td className="matrix-td matrix-td--total-type">
                      <div className="matrix-total-cell">
                        {percentageDraft ? (
                          <div style={{ width: '100%' }}>
                            <input
                              className="matrix-percentage-input"
                              type="number"
                              min={0}
                              max={100}
                              step={0.1}
                              value={Number((rowPercentages[row.rowId] ?? 0).toFixed(2))}
                              disabled={!canEdit}
                              onChange={(event) =>
                                updateRowPercentage(row.rowId, Number(event.target.value))
                              }
                            />
                            <p className="matrix-percentage-preview">~ {rowTotal} câu</p>
                          </div>
                        ) : (
                          rowTotal
                        )}
                      </div>
                    </td>

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
              <td className="matrix-td matrix-td--total-label" colSpan={4}>
                <div className="matrix-grand-total-label">TỔNG CỘNG</div>
              </td>
              {cognitiveOrder.map((level) => (
                <td
                  key={level}
                  className={`matrix-td matrix-td--level matrix-td--level-${level.toLowerCase()} matrix-td--grand-total`}
                >
                  <div className="matrix-grand-total-cell">{columnTotals[level]}</div>
                </td>
              ))}
              <td className="matrix-td matrix-td--total-type matrix-td--grand-total">
                <div className="matrix-grand-total-cell">{grandTotal}</div>
              </td>
              {canEdit && <td className="matrix-td matrix-td--actions"></td>}
            </tr>

            {canShowPercentageControls && (
              <tr className="matrix-row matrix-row--percentage-config">
                <td className="matrix-td matrix-td--percentage-label" colSpan={4}>
                  <div className="matrix-grand-total-label">CẤU HÌNH PHẦN TRĂM</div>
                  <p className="matrix-percentage-hint">
                    Nhập % theo mức độ và tổng số câu cần tạo ở dòng này.
                  </p>
                </td>

                <td className="matrix-td matrix-td--percentage-cell">
                  <input
                    className="matrix-percentage-input"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={percentageDraft.cognitiveLevelPercentages.NHAN_BIET}
                    disabled={!canEdit}
                    onChange={(event) => updateLevel('NHAN_BIET', Number(event.target.value))}
                  />
                  <span className="matrix-percentage-suffix">%</span>
                  <p className="matrix-percentage-preview">
                    ~ {estimatedDistribution.NHAN_BIET} câu
                  </p>
                </td>

                <td className="matrix-td matrix-td--percentage-cell">
                  <input
                    className="matrix-percentage-input"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={percentageDraft.cognitiveLevelPercentages.THONG_HIEU}
                    disabled={!canEdit}
                    onChange={(event) => updateLevel('THONG_HIEU', Number(event.target.value))}
                  />
                  <span className="matrix-percentage-suffix">%</span>
                  <p className="matrix-percentage-preview">
                    ~ {estimatedDistribution.THONG_HIEU} câu
                  </p>
                </td>

                <td className="matrix-td matrix-td--percentage-cell">
                  <input
                    className="matrix-percentage-input"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={percentageDraft.cognitiveLevelPercentages.VAN_DUNG}
                    disabled={!canEdit}
                    onChange={(event) => updateLevel('VAN_DUNG', Number(event.target.value))}
                  />
                  <span className="matrix-percentage-suffix">%</span>
                  <p className="matrix-percentage-preview">
                    ~ {estimatedDistribution.VAN_DUNG} câu
                  </p>
                </td>

                <td className="matrix-td matrix-td--percentage-cell">
                  <input
                    className="matrix-percentage-input"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={percentageDraft.cognitiveLevelPercentages.VAN_DUNG_CAO}
                    disabled={!canEdit}
                    onChange={(event) => updateLevel('VAN_DUNG_CAO', Number(event.target.value))}
                  />
                  <span className="matrix-percentage-suffix">%</span>
                  <p className="matrix-percentage-preview">
                    ~ {estimatedDistribution.VAN_DUNG_CAO} câu
                  </p>
                </td>

                <td className="matrix-td matrix-td--percentage-total-cell">
                  <input
                    className="matrix-percentage-input matrix-percentage-input--total"
                    type="number"
                    min={1}
                    max={200}
                    step={1}
                    value={percentageDraft.totalQuestionsTarget}
                    disabled={!canEdit}
                    onChange={(event) =>
                      updateDraft({
                        totalQuestionsTarget: Number(event.target.value),
                      })
                    }
                  />
                  <p className="matrix-percentage-preview">Tổng %: {totalPercentage.toFixed(1)}%</p>
                  {!isPercentageTotalValid && (
                    <p className="matrix-percentage-error">Tổng phần trăm phải bằng 100%</p>
                  )}
                  <p className="matrix-percentage-preview">
                    Tổng % dòng: {totalRowPercentage.toFixed(1)}%
                  </p>
                  {!isRowPercentageTotalValid && (
                    <p className="matrix-percentage-error">
                      Tổng phần trăm theo dòng phải bằng 100%
                    </p>
                  )}
                </td>

                {canEdit && (
                  <td className="matrix-td matrix-td--actions matrix-td--percentage-action">
                    <button
                      className="matrix-save-percentage-btn"
                      onClick={() => void handleSaveCellBatch()}
                      disabled={
                        savingPercentages ||
                        !isPercentageTotalValid ||
                        !isRowPercentageTotalValid ||
                        !onSavePercentages
                      }
                      title="Lưu phân bổ số câu theo phần trăm"
                    >
                      {savingPercentages ? 'Đang lưu...' : 'Lưu phân bổ'}
                    </button>
                  </td>
                )}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
