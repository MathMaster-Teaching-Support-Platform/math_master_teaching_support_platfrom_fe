import { Trash2, Save, X, Check } from 'lucide-react';
import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import type {
  ExamMatrixPartConfig,
  ExamMatrixTableChapter,
  ExamMatrixTableRow,
  MatrixCellRequest,
  BatchUpsertMatrixRowCellsRequest,
} from '../../types/examMatrix';
import { getPartLabel, getNumberOfParts } from '../../utils/partHelpers';
import './matrix-table.css';

interface MatrixTableProps {
  chapters: ExamMatrixTableChapter[];
  gradeLevel?: string;
  subjectName?: string;
  parts?: ExamMatrixPartConfig[];
  numberOfParts?: number;  // DEPRECATED
  matrixTotalPointsTarget?: number;
  canEdit: boolean;
  onRemoveRow: (rowId: string) => Promise<void>;
  onCellChange?: (matrixId: string, updates: BatchUpsertMatrixRowCellsRequest) => Promise<void>;
  matrixId?: string;
}

const cognitiveOrder = ['NB', 'TH', 'VD', 'VDC'] as const;
type MatrixLevel = (typeof cognitiveOrder)[number];

const levelLabels: Record<MatrixLevel, string> = {
  NB: 'Nhận biết',
  TH: 'Thông hiểu',
  VD: 'Vận dụng',
  VDC: 'Vận dụng cao',
};

type CellKey = string; // Format: "P1:NB", "P2:TH", etc.
function makeCellKey(partNumber: number, level: MatrixLevel): CellKey {
  return `P${partNumber}:${level}`;
}

type CellId = string; // Format: "rowId:P1:NB"
function makeCellId(rowId: string, partNumber: number, level: MatrixLevel): CellId {
  return `${rowId}:P${partNumber}:${level}`;
}

function normalizeLevel(level: string): MatrixLevel | null {
  const upper = level.toUpperCase();
  if (upper === 'NB' || upper === 'NHAN_BIET' || upper === 'REMEMBER') return 'NB';
  if (upper === 'TH' || upper === 'THONG_HIEU' || upper === 'UNDERSTAND') return 'TH';
  if (upper === 'VD' || upper === 'VAN_DUNG' || upper === 'APPLY') return 'VD';
  if (upper === 'VDC' || upper === 'VAN_DUNG_CAO' || upper === 'ANALYZE') return 'VDC';
  return null;
}

function getLevelCount(row: ExamMatrixTableRow, level: MatrixLevel, partNumber: number): number {
  const fromCells = row.cells?.find(
    (cell) => normalizeLevel(cell.cognitiveLevel) === level && cell.partNumber === partNumber
  );
  if (fromCells) return fromCells.questionCount ?? 0;

  if (partNumber === 1) {
    const dist = row.countByCognitive;
    if (!dist) return 0;
    if (level === 'NB') return dist.NB ?? dist.NHAN_BIET ?? dist.REMEMBER ?? 0;
    if (level === 'TH') return dist.TH ?? dist.THONG_HIEU ?? dist.UNDERSTAND ?? 0;
    if (level === 'VD') return dist.VD ?? dist.VAN_DUNG ?? dist.APPLY ?? 0;
    return dist.VDC ?? dist.VAN_DUNG_CAO ?? dist.ANALYZE ?? 0;
  }
  return 0;
}

// Redistribution algorithm (available for future percentage editing feature)
// Currently not used but will be needed when implementing editable percentage rows/columns
// @ts-expect-error - Function defined for future use
function redistribute(cells: number[], newTotal: number): number[] {
  const oldTotal = cells.reduce((a, b) => a + b, 0);
  if (oldTotal === 0) {
    // Distribute evenly
    const each = Math.floor(newTotal / cells.length);
    const remainder = newTotal - each * cells.length;
    return cells.map((_, i) => each + (i < remainder ? 1 : 0));
  }
  // Proportional redistribution
  const result = cells.map(c => Math.round((c / oldTotal) * newTotal));
  // Fix rounding error on last cell
  const diff = newTotal - result.reduce((a, b) => a + b, 0);
  result[result.length - 1] += diff;
  return result;
}

export function MatrixTable({
  chapters,
  gradeLevel,
  subjectName: _subjectName,
  parts,
  numberOfParts: _numberOfParts,
  matrixTotalPointsTarget: _matrixTotalPointsTarget,
  canEdit,
  onRemoveRow,
  onCellChange,
  matrixId,
}: Readonly<MatrixTableProps>) {
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null);
  
  // Inline editing state
  const [editingCell, setEditingCell] = useState<CellId | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Local state for optimistic updates
  const [localCells, setLocalCells] = useState<Map<CellId, number>>(new Map());
  const [dirtyCells, setDirtyCells] = useState<Set<CellId>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Debounce timer
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_MS = 500;

  const effectiveParts = (parts && parts.length > 0) ? parts : [
    { partNumber: 1, questionType: 'MULTIPLE_CHOICE' as const, name: undefined },
    { partNumber: 2, questionType: 'TRUE_FALSE' as const, name: undefined },
    { partNumber: 3, questionType: 'SHORT_ANSWER' as const, name: undefined },
  ].slice(0, _numberOfParts || 3);
  const numberOfParts = getNumberOfParts(effectiveParts);

  // Initialize local cells from chapters
  useEffect(() => {
    const newLocalCells = new Map<CellId, number>();
    for (const chapter of chapters) {
      for (const row of chapter.rows) {
        for (let p = 1; p <= numberOfParts; p++) {
          for (const level of cognitiveOrder) {
            const cellId = makeCellId(row.rowId, p, level);
            const count = getLevelCount(row, level, p);
            newLocalCells.set(cellId, count);
          }
        }
      }
    }
    
    // FIX: Don't overwrite cells that have pending (dirty) changes.
    // The user's edits should survive server data reinitialization.
    setLocalCells(prev => {
      const merged = new Map(newLocalCells);
      for (const dirtyId of dirtyCellsRef.current) {
        const userValue = prev.get(dirtyId);
        if (userValue !== undefined) {
          merged.set(dirtyId, userValue); // Keep user's pending edit
        }
      }
      return merged;
    });
    
    // Only clear dirty cells if there are no pending changes
    if (dirtyCellsRef.current.size === 0) {
      setDirtyCells(new Set());
    }
  }, [chapters, numberOfParts]);

  // Get cell value (local or from chapters)
  const getCellValue = useCallback((rowId: string, partNumber: number, level: MatrixLevel): number => {
    const cellId = makeCellId(rowId, partNumber, level);
    return localCells.get(cellId) ?? 0;
  }, [localCells]);

  // Calculate totals from local state
  const { columnTotals, rowTotals, grandTotal } = useMemo(() => {
    const colTotals: Record<CellKey, number> = {};
    const rowTotals: Record<string, number> = {};
    let total = 0;

    for (const chapter of chapters) {
      for (const row of chapter.rows) {
        let rowTotal = 0;
        for (let p = 1; p <= numberOfParts; p++) {
          for (const level of cognitiveOrder) {
            const ck = makeCellKey(p, level);
            const count = getCellValue(row.rowId, p, level);
            colTotals[ck] = (colTotals[ck] ?? 0) + count;
            rowTotal += count;
            total += count;
          }
        }
        rowTotals[row.rowId] = rowTotal;
      }
    }

    return { columnTotals: colTotals, rowTotals, grandTotal: total };
  }, [chapters, numberOfParts, getCellValue]);

  // Use refs to avoid stale closure in setTimeout
  const dirtyCellsRef = useRef<Set<CellId>>(dirtyCells);
  const localCellsRef = useRef<Map<CellId, number>>(localCells);
  
  useEffect(() => { 
    dirtyCellsRef.current = dirtyCells; 
  }, [dirtyCells]);
  
  useEffect(() => { 
    localCellsRef.current = localCells; 
  }, [localCells]);

  // Debounced save
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    saveTimerRef.current = setTimeout(() => {
      void performSave();
    }, DEBOUNCE_MS);
  }, []); // [] is now SAFE because performSave reads from refs

  // Map short codes to full enum values for backend
  const mapLevelToBackend = (level: MatrixLevel): import('../../types/examMatrix').MatrixCognitiveLevel => {
    const mapping: Record<MatrixLevel, import('../../types/examMatrix').MatrixCognitiveLevel> = {
      'NB': 'NHAN_BIET',
      'TH': 'THONG_HIEU',
      'VD': 'VAN_DUNG',
      'VDC': 'VAN_DUNG_CAO',
    };
    return mapping[level];
  };

  const performSave = async () => {
    const currentDirty = dirtyCellsRef.current;
    const currentLocal = localCellsRef.current;
    
    if (!onCellChange || !matrixId || currentDirty.size === 0) return;

    setSaving(true);
    setSaveError(null);

    try {
      // Validate: warn if any row has all-zero cells
      const rowIds = new Set(Array.from(currentDirty).map(id => id.split(':')[0]));
      for (const rowId of rowIds) {
        let rowTotal = 0;
        for (let p = 1; p <= numberOfParts; p++) {
          for (const level of cognitiveOrder) {
            const cellId = makeCellId(rowId, p, level);
            rowTotal += currentLocal.get(cellId) ?? 0;
          }
        }
        if (rowTotal === 0) {
          setSaveError('Hàng chủ đề không thể có tổng = 0. Vui lòng nhập ít nhất 1 câu hỏi hoặc xóa hàng.');
          setSaving(false);
          return;
        }
      }
      
      // Group dirty cells by row
      const rowUpdates = new Map<string, MatrixCellRequest[]>();
      
      for (const cellId of currentDirty) {
        const [rowId, partStr, level] = cellId.split(':');
        const partNumber = parseInt(partStr.substring(1), 10);
        const count = currentLocal.get(cellId) ?? 0;
        
        if (!rowUpdates.has(rowId)) {
          rowUpdates.set(rowId, []);
        }
        
        rowUpdates.get(rowId)!.push({
          partNumber,
          cognitiveLevel: mapLevelToBackend(level as MatrixLevel),
          questionCount: count,
          pointsPerQuestion: 1, // Default points per question
        });
      }

      // Build batch request
      const request: BatchUpsertMatrixRowCellsRequest = {
        rows: Array.from(rowUpdates.entries()).map(([rowId, cells]) => ({
          rowId,
          cells,
        })),
      };

      await onCellChange(matrixId, request);
      setDirtyCells(new Set());
      setSaveError(null);
    } catch (error) {
      console.error('Failed to save cells:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Update cell value
  const updateCellValue = useCallback((rowId: string, partNumber: number, level: MatrixLevel, newValue: number) => {
    const cellId = makeCellId(rowId, partNumber, level);
    const clampedValue = Math.max(0, Math.floor(newValue));
    
    setLocalCells(prev => {
      const next = new Map(prev);
      next.set(cellId, clampedValue);
      return next;
    });
    
    setDirtyCells(prev => new Set(prev).add(cellId));
    
    // If setting to 0 (delete), save immediately to avoid race condition with useEffect
    if (clampedValue === 0) {
      // Clear any pending debounce
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      // Save immediately after React commits the state update
      // Use requestAnimationFrame to ensure refs are updated
      requestAnimationFrame(() => void performSave());
    } else {
      scheduleSave();
    }
  }, [scheduleSave]);

  // Start editing a cell
  const startEdit = useCallback((rowId: string, partNumber: number, level: MatrixLevel) => {
    if (!canEdit) return;
    const cellId = makeCellId(rowId, partNumber, level);
    const currentValue = getCellValue(rowId, partNumber, level);
    setEditingCell(cellId);
    setEditValue(currentValue.toString());
  }, [canEdit, getCellValue]);

  // Commit edit
  const commitEdit = useCallback((rowId: string, partNumber: number, level: MatrixLevel) => {
    const newValue = parseInt(editValue, 10);
    if (!isNaN(newValue)) {
      updateCellValue(rowId, partNumber, level, newValue);
    }
    setEditingCell(null);
    setEditValue('');
  }, [editValue, updateCellValue]);

  // Cancel edit
  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

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
        Ma trận chưa có dòng nào. Hãy thêm dòng mới.
      </div>
    );
  }

  return (
    <div className="matrix-container">
      {/* Save status indicator */}
      {canEdit && onCellChange && (
        <div className="matrix-save-status">
          {saving && (
            <span className="matrix-save-status--saving">
              <Save size={14} /> Đang lưu...
            </span>
          )}
          {!saving && dirtyCells.size > 0 && (
            <span className="matrix-save-status--pending">
              <Save size={14} /> {dirtyCells.size} thay đổi chưa lưu
            </span>
          )}
          {!saving && dirtyCells.size === 0 && !saveError && (
            <span className="matrix-save-status--saved">
              <Check size={14} /> Đã lưu
            </span>
          )}
          {saveError && (
            <span className="matrix-save-status--error">
              <X size={14} /> Lỗi: {saveError}
            </span>
          )}
        </div>
      )}

      <div className="matrix-scroll-wrapper">
        <table className="matrix-table">
          {/* Header */}
          <thead className="matrix-header">
            <tr>
              <th className="matrix-th matrix-th--grade" rowSpan={2}>
                Lớp
              </th>
              <th className="matrix-th matrix-th--chapter" rowSpan={2}>
                Chủ đề
              </th>
              {effectiveParts.map((part) => (
                <th
                  key={part.partNumber}
                  className="matrix-th matrix-th--part-group"
                  colSpan={4}
                >
                  {getPartLabel(part)}
                </th>
              ))}
              <th className="matrix-th matrix-th--total-type" rowSpan={2}>
                Tổng
                <br />
                chủ đề
              </th>
              <th className="matrix-th matrix-th--total-type" rowSpan={2}>
                Tỉ lệ
              </th>
              {canEdit && (
                <th className="matrix-th matrix-th--actions" rowSpan={2}>
                  Thao tác
                </th>
              )}
            </tr>
            <tr>
              {effectiveParts.map((part) =>
                cognitiveOrder.map((level) => (
                  <th
                    key={`${part.partNumber}-${level}`}
                    className={`matrix-th matrix-th--level matrix-th--level-${level.toLowerCase()}`}
                  >
                    <div className="matrix-level-header">
                      <span className="matrix-level-code">{level}</span>
                      <span className="matrix-level-label">{levelLabels[level]}</span>
                    </div>
                  </th>
                ))
              )}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="matrix-body">
            {chapters.map((chapter, chapterIndex) => {
              const chapterName = chapter.chapterName || 'Chủ đề không xác định';
              const rowCount = chapter.rows.length;

              return chapter.rows.map((row, rowIndex) => {
                const isFirstRowInChapter = rowIndex === 0;
                const rowTotal = rowTotals[row.rowId] ?? 0;

                const displayGrade =
                  gradeLevel || row.schoolGradeName || row.gradeLevel || row.schoolGrade || 'N/A';

                const displayChapter =
                  chapterName === 'Chủ đề không xác định'
                    ? row.chapterName || row.chapter || 'Chủ đề không xác định'
                    : chapterName;

                return (
                  <tr
                    key={row.rowId}
                    className={`matrix-row ${chapterIndex % 2 === 0 ? 'matrix-row--even' : 'matrix-row--odd'}`}
                  >
                    {chapterIndex === 0 && isFirstRowInChapter && (
                      <td
                        className="matrix-td matrix-td--grade"
                        rowSpan={chapters.reduce((sum, ch) => sum + ch.rows.length, 0)}
                      >
                        <div className="matrix-grade-cell">{displayGrade}</div>
                      </td>
                    )}

                    {isFirstRowInChapter && (
                      <td className="matrix-td matrix-td--chapter" rowSpan={rowCount}>
                        <div className="matrix-chapter-cell">{displayChapter}</div>
                      </td>
                    )}

                    {/* Editable cells */}
                    {effectiveParts.map((part) =>
                      cognitiveOrder.map((level) => {
                        const cellId = makeCellId(row.rowId, part.partNumber, level);
                        const count = getCellValue(row.rowId, part.partNumber, level);
                        const isEditing = editingCell === cellId;
                        const isDirty = dirtyCells.has(cellId);

                        return (
                          <td
                            key={`${part.partNumber}-${level}`}
                            className={`matrix-td matrix-td--level matrix-td--level-${level.toLowerCase()} ${
                              count === 0 ? 'matrix-td--empty' : ''
                            } ${isDirty ? 'matrix-td--dirty' : ''} ${canEdit ? 'matrix-td--editable' : ''}`}
                            data-part={part.partNumber}
                            onClick={() => !isEditing && startEdit(row.rowId, part.partNumber, level)}
                          >
                            {isEditing ? (
                              <input
                                ref={inputRef}
                                type="number"
                                min="0"
                                className="matrix-cell-input"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => commitEdit(row.rowId, part.partNumber, level)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    commitEdit(row.rowId, part.partNumber, level);
                                  } else if (e.key === 'Escape') {
                                    cancelEdit();
                                  }
                                }}
                                placeholder={part.questionType === 'TRUE_FALSE' ? 'mệnh đề' : ''}
                                title={part.questionType === 'TRUE_FALSE' ? '4 mệnh đề = 1 câu Đúng/Sai' : ''}
                              />
                            ) : (
                              <div className="matrix-cell-value">
                                {count}
                                {count > 0 && part.questionType === 'TRUE_FALSE' && (
                                  <span style={{ fontSize: 9, color: '#6b7280', display: 'block' }}>
                                    mệnh đề
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })
                    )}

                    <td className={`matrix-td matrix-td--total-type ${rowTotal === 0 ? 'matrix-td--warning' : ''}`}>
                      <div className="matrix-total-cell" title={rowTotal === 0 ? 'Tổng = 0, hàng này sẽ không có câu hỏi' : ''}>
                        {rowTotal}
                        {rowTotal === 0 && <span style={{ color: '#dc2626', fontSize: 11, display: 'block' }}>⚠️ Trống</span>}
                      </div>
                    </td>

                    <td className="matrix-td matrix-td--total-type">
                      <div className="matrix-total-cell">
                        {grandTotal > 0 ? Math.round((rowTotal / grandTotal) * 100) : 0}%
                      </div>
                    </td>

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
              <td className="matrix-td matrix-td--total-label" colSpan={2}>
                <div className="matrix-grand-total-label">TỔNG CỘNG</div>
              </td>
              {effectiveParts.map((part) =>
                cognitiveOrder.map((level) => {
                  const ck = makeCellKey(part.partNumber, level);
                  const total = columnTotals[ck] ?? 0;
                  return (
                    <td
                      key={`${part.partNumber}-${level}`}
                      className={`matrix-td matrix-td--level matrix-td--level-${level.toLowerCase()} matrix-td--grand-total`}
                    >
                      <div className="matrix-grand-total-cell">
                        {total}
                        {part.questionType === 'TRUE_FALSE' && total > 0 && (
                          <div style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>
                            = {Math.ceil(total / 4)} câu TF
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })
              )}
              <td className="matrix-td matrix-td--total-type matrix-td--grand-total">
                <div className="matrix-grand-total-cell">{grandTotal}</div>
              </td>
              <td className="matrix-td matrix-td--total-type matrix-td--grand-total">
                <div className="matrix-grand-total-cell">{grandTotal > 0 ? '100%' : '0%'}</div>
              </td>
              {canEdit && <td className="matrix-td matrix-td--actions"></td>}
            </tr>

            {/* Percentage Row */}
            <tr className="matrix-row matrix-row--ratio">
              <td className="matrix-td matrix-td--total-label" colSpan={2}>
                <div className="matrix-grand-total-label">TỈ LỆ</div>
              </td>
              {effectiveParts.map((part) =>
                cognitiveOrder.map((level) => {
                  const ck = makeCellKey(part.partNumber, level);
                  const percentage = grandTotal > 0
                    ? Math.round(((columnTotals[ck] ?? 0) / grandTotal) * 100)
                    : 0;
                  return (
                    <td
                      key={`${part.partNumber}-${level}-ratio`}
                      className={`matrix-td matrix-td--level matrix-td--level-${level.toLowerCase()}`}
                    >
                      <div className="matrix-grand-total-cell">{percentage}%</div>
                    </td>
                  );
                })
              )}
              <td className="matrix-td matrix-td--total-type">
                <div className="matrix-grand-total-cell">{grandTotal > 0 ? '100%' : '0%'}</div>
              </td>
              <td className="matrix-td matrix-td--total-type">
                <div className="matrix-grand-total-cell"></div>
              </td>
              {canEdit && <td className="matrix-td matrix-td--actions"></td>}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
