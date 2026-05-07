import { AlertCircle, Trash2, Save, X, Check, Loader2, Pencil } from 'lucide-react';
import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import type {
  ExamMatrixPartConfig,
  ExamMatrixTableChapter,
  ExamMatrixTableRow,
  MatrixCellRequest,
  BatchUpsertMatrixRowCellsRequest,
} from '../../types/examMatrix';
import { getPartLabel, getNumberOfParts } from '../../utils/partHelpers';
import { useGetQuestionBankMatrixStats } from '../../hooks/useQuestionBank';
import './matrix-table.css';

interface MatrixTableProps {
  chapters: ExamMatrixTableChapter[];
  gradeLevel?: string;
  subjectName?: string;
  parts?: ExamMatrixPartConfig[];
  numberOfParts?: number;  // DEPRECATED
  matrixTotalPointsTarget?: number;
  matrixTotalQuestionsTarget?: number;
  canEdit: boolean;
  onRemoveRow: (rowId: string) => Promise<void>;
  onCellChange?: (matrixId: string, updates: BatchUpsertMatrixRowCellsRequest) => Promise<void>;
  matrixId?: string;
  questionBankId?: string;
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

// Stable mapping — defined outside component so it never changes reference
const LEVEL_TO_BACKEND: Record<MatrixLevel, import('./../../types/examMatrix').MatrixCognitiveLevel> = {
  NB: 'NHAN_BIET',
  TH: 'THONG_HIEU',
  VD: 'VAN_DUNG',
  VDC: 'VAN_DUNG_CAO',
};
function mapLevelToBackend(level: MatrixLevel): import('./../../types/examMatrix').MatrixCognitiveLevel {
  return LEVEL_TO_BACKEND[level];
}

function normalizeLevel(level: string): MatrixLevel | null {
  const upper = level.toUpperCase();
  if (upper === 'NB' || upper === 'NHAN_BIET' || upper === 'REMEMBER') return 'NB';
  if (upper === 'TH' || upper === 'THONG_HIEU' || upper === 'UNDERSTAND') return 'TH';
  if (upper === 'VD' || upper === 'VAN_DUNG' || upper === 'APPLY') return 'VD';
  if (upper === 'VDC' || upper === 'VAN_DUNG_CAO' || upper === 'ANALYZE') return 'VDC';
  return null;
}

function buildLocalCellsMap(
  chapters: ExamMatrixTableChapter[],
  numberOfParts: number
): Map<CellId, number> {
  const map = new Map<CellId, number>();
  for (const chapter of chapters) {
    for (const row of chapter.rows) {
      for (let p = 1; p <= numberOfParts; p++) {
        for (const level of cognitiveOrder) {
          const cellId = makeCellId(row.rowId, p, level);
          map.set(cellId, getLevelCount(row, level, p));
        }
      }
    }
  }
  return map;
}

function getLevelCount(row: ExamMatrixTableRow, level: MatrixLevel, partNumber: number): number {
  // FIX: Only use row.cells array, filtered by BOTH cognitiveLevel AND partNumber.
  // The old fallback to countByCognitive was aggregating across ALL parts,
  // causing Part 2 and Part 3 to show Part 1's data.
  const fromCells = row.cells?.find(
    (cell) => normalizeLevel(cell.cognitiveLevel) === level && cell.partNumber === partNumber
  );
  return fromCells?.questionCount ?? 0;
}

/** Nhãn lớp để gộp ô — ưu tiên grade ma trận, sau đó dữ liệu dòng */
function displayGradeForRow(row: ExamMatrixTableRow, matrixGrade?: string): string {
  const g =
    matrixGrade?.trim() ||
    row.schoolGradeName?.trim() ||
    row.gradeLevel?.trim() ||
    row.schoolGrade?.trim() ||
    row.school_grade_name?.trim() ||
    row.grade_level?.trim() ||
    '';
  return g || '—';
}

function chapterSortRank(ch: ExamMatrixTableChapter): number {
  const id = ch.chapterId?.trim();
  if (id && /^\d+$/.test(id)) return Number.parseInt(id, 10);
  const name = ch.chapterName || '';
  const m = name.match(/(\d+)/);
  if (m) return Number.parseInt(m[1], 10);
  return Number.MAX_SAFE_INTEGER;
}

/** Sắp xếp chương: số trong tên/id trước, sau đó locale */
function sortChaptersForDisplay(list: ExamMatrixTableChapter[]): ExamMatrixTableChapter[] {
  return [...list].sort((a, b) => {
    const ra = chapterSortRank(a);
    const rb = chapterSortRank(b);
    if (ra !== rb) return ra - rb;
    return (a.chapterName || '').localeCompare(b.chapterName || '', 'vi', { numeric: true });
  });
}

type MatrixFlatRow = {
  row: ExamMatrixTableRow;
  chapter: ExamMatrixTableChapter;
  chapterLabel: string;
  displayGrade: string;
  sortedChapterIndex: number;
};

function buildFlatTableRows(
  sortedChapters: ExamMatrixTableChapter[],
  matrixGrade?: string
): MatrixFlatRow[] {
  const out: MatrixFlatRow[] = [];
  sortedChapters.forEach((chapter, sortedChapterIndex) => {
    const fallbackChapterName = chapter.chapterName || 'Chủ đề không xác định';
    for (const row of chapter.rows) {
      const displayGrade = displayGradeForRow(row, matrixGrade);
      const chapterLabel =
        fallbackChapterName === 'Chủ đề không xác định'
          ? row.chapterName || row.chapter || fallbackChapterName
          : fallbackChapterName;
      out.push({
        row,
        chapter,
        chapterLabel,
        displayGrade,
        sortedChapterIndex,
      });
    }
  });
  return out;
}

/** rowspan cột Lớp: các dòng liên tiếp cùng displayGrade → một ô */
function computeGradeRowSpans(flat: MatrixFlatRow[]): number[] {
  const spans = new Array(flat.length).fill(0);
  let i = 0;
  while (i < flat.length) {
    const label = flat[i].displayGrade;
    let n = 1;
    let j = i + 1;
    while (j < flat.length && flat[j].displayGrade === label) {
      n++;
      j++;
    }
    spans[i] = n;
    i = j;
  }
  return spans;
}

export function MatrixTable({
  chapters,
  gradeLevel,
  subjectName: _subjectName,
  parts,
  numberOfParts: _numberOfParts,
  matrixTotalPointsTarget: _matrixTotalPointsTarget,
  matrixTotalQuestionsTarget: _matrixTotalQuestionsTarget,
  canEdit,
  onRemoveRow,
  onCellChange,
  matrixId,
  questionBankId,
}: Readonly<MatrixTableProps>) {
  const { data: bankStatsResponse } = useGetQuestionBankMatrixStats(questionBankId ?? '', !!questionBankId);
  const bankStats = bankStatsResponse?.result;

  // Create a lookup map for availability: chapterId -> partNum -> level -> count
  const availabilityMap = useMemo(() => {
    if (!bankStats) return new Map<string, Map<number, Map<string, number>>>();
    
    const map = new Map<string, Map<number, Map<string, number>>>();
    
    bankStats.forEach(gradeStat => {
      gradeStat.chapters.forEach(chap => {
        const chapMap = new Map<number, Map<string, number>>();
        chap.types.forEach(typeStat => {
          // Map backend types to parts
          // Assuming: MULTIPLE_CHOICE -> Part 1, TRUE_FALSE -> Part 2, SHORT_ANSWER -> Part 3
          // Or we can try to match by questionType if parts are provided
          const typeToPartNum: Record<string, number> = {
            'MULTIPLE_CHOICE': 1,
            'TRUE_FALSE': 2,
            'SHORT_ANSWER': 3
          };
          const partNum = typeToPartNum[typeStat.questionType];
          if (partNum) {
            const levelMap = new Map<string, number>();
            Object.entries(typeStat.cognitiveCounts).forEach(([lvl, count]) => {
              // Normalize level keys if needed (e.g. NHAN_BIET -> NB)
              const normLvl = lvl === 'NHAN_BIET' ? 'NB' : 
                               lvl === 'THONG_HIEU' ? 'TH' :
                               lvl === 'VAN_DUNG' ? 'VD' :
                               lvl === 'VAN_DUNG_CAO' ? 'VDC' : lvl;
              levelMap.set(normLvl, count);
            });
            chapMap.set(partNum, levelMap);
          }
        });
        map.set(chap.chapterId, chapMap);
      });
    });
    
    return map;
  }, [bankStats]);

  const getAvailability = useCallback((chapterId: string, partNum: number, level: string) => {
    return availabilityMap.get(chapterId)?.get(partNum)?.get(level);
  }, [availabilityMap]);

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

  const effectiveParts = (parts && parts.length > 0) ? parts : [
    { partNumber: 1, questionType: 'MULTIPLE_CHOICE' as const, name: undefined },
    { partNumber: 2, questionType: 'TRUE_FALSE' as const, name: undefined },
    { partNumber: 3, questionType: 'SHORT_ANSWER' as const, name: undefined },
  ].slice(0, _numberOfParts || 3);
  const numberOfParts = getNumberOfParts(effectiveParts);

  const sortedChapters = useMemo(() => sortChaptersForDisplay(chapters), [chapters]);
  const flatRows = useMemo(
    () => buildFlatTableRows(sortedChapters, gradeLevel),
    [sortedChapters, gradeLevel]
  );
  const gradeRowSpans = useMemo(() => computeGradeRowSpans(flatRows), [flatRows]);

  // Initialize local cells from chapters.
  // CRITICAL FIX: Skip reinitialization entirely when user has pending edits.
  // This prevents server data from racing with and overwriting the user's unsaved changes.
  useEffect(() => {
    if (dirtyCellsRef.current.size > 0) return; // Pending edits — don't overwrite

    setLocalCells(buildLocalCellsMap(chapters, numberOfParts));
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

  // Use refs to avoid stale closure in setTimeout/performSave
  const dirtyCellsRef = useRef<Set<CellId>>(dirtyCells);
  const localCellsRef = useRef<Map<CellId, number>>(localCells);
  const onCellChangeRef = useRef(onCellChange);
  const matrixIdRef = useRef(matrixId);
  const numberOfPartsRef = useRef(numberOfParts);
  
  useEffect(() => { 
    dirtyCellsRef.current = dirtyCells; 
  }, [dirtyCells]);
  
  useEffect(() => { 
    localCellsRef.current = localCells; 
  }, [localCells]);
  
  useEffect(() => {
    onCellChangeRef.current = onCellChange;
  }, [onCellChange]);
  
  useEffect(() => {
    matrixIdRef.current = matrixId;
  }, [matrixId]);
  
  useEffect(() => {
    numberOfPartsRef.current = numberOfParts;
  }, [numberOfParts]);

  const performSave = async () => {
    const currentDirty = dirtyCellsRef.current;
    const currentLocal = localCellsRef.current;
    const currentOnCellChange = onCellChangeRef.current;
    const currentMatrixId = matrixIdRef.current;
    
    if (!currentOnCellChange || !currentMatrixId || currentDirty.size === 0) return;

    setSaving(true);
    setSaveError(null);

    try {
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

      await currentOnCellChange(currentMatrixId, request);
      setDirtyCells(new Set());
      setSaveError(null);
    } catch (error) {
      console.error('Failed to save cells:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Update cell value (local only — gửi máy chủ khi bấm «Lưu thay đổi»)
  const updateCellValue = useCallback((rowId: string, partNumber: number, level: MatrixLevel, newValue: number) => {
    const cellId = makeCellId(rowId, partNumber, level);
    const clampedValue = Math.max(0, Math.floor(newValue));

    setLocalCells((prev) => {
      const next = new Map(prev);
      next.set(cellId, clampedValue);
      return next;
    });

    setDirtyCells((prev) => new Set(prev).add(cellId));
  }, []);

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
    const cellId = makeCellId(rowId, partNumber, level);

    // Prevent double-commit (e.g. Enter + Blur)
    if (editingCell !== cellId) return;

    const newValue = parseInt(editValue, 10);
    if (!isNaN(newValue)) {
      const currentValue = getCellValue(rowId, partNumber, level);

      // Only update if value actually changed
      if (newValue !== currentValue) {
        updateCellValue(rowId, partNumber, level, newValue);
      }
    }
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, getCellValue, updateCellValue]);

  // Cancel edit
  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const discardPendingChanges = useCallback(() => {
    if (saving) return;
    const hasLocalDraft = dirtyCells.size > 0 || editingCell !== null;
    if (!hasLocalDraft) return;

    if (
      !globalThis.confirm(
        'Hủy thao tác chỉnh sửa? Ô đang gõ và các ô đã chỉnh (chưa Lưu) sẽ trở lại như trước.'
      )
    ) {
      return;
    }

    cancelEdit();
    setDirtyCells(new Set());
    setSaveError(null);
    setLocalCells(buildLocalCellsMap(chapters, numberOfParts));
  }, [saving, dirtyCells.size, editingCell, chapters, numberOfParts, cancelEdit]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const handleRemoveRow = async (rowId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa dòng này? Tất cả thiết lập số lượng câu hỏi cho dòng này sẽ bị xóa và không thể khôi phục.')) return;
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

  const hasPendingChanges = dirtyCells.size > 0;
  const isDraftingCell = editingCell !== null;
  const toolbarBusy = saving || hasPendingChanges || isDraftingCell || !!saveError;

  return (
    <div
      className={`matrix-container${canEdit && onCellChange && toolbarBusy ? ' matrix-container--edit-mode' : ''}`}
    >
      {canEdit && onCellChange && (
        <section className="matrix-edit-toolbar" aria-label="Trạng thái chỉnh sửa ma trận">
          <div className="matrix-edit-toolbar__row">
            <div className="matrix-edit-toolbar__status" aria-live="polite">
              {saving && (
                <span className="matrix-edit-toolbar__line matrix-edit-toolbar__line--saving">
                  <Loader2 size={16} className="matrix-edit-toolbar__spin" aria-hidden />
                  Đang gửi lên máy chủ…
                </span>
              )}
              {!saving && saveError && (
                <span className="matrix-edit-toolbar__line matrix-edit-toolbar__line--error">
                  <AlertCircle size={16} aria-hidden />
                  <span>
                    Không lưu được: <strong>{saveError}</strong> — thử lại sau khi sửa hoặc kiểm tra kết nối.
                  </span>
                </span>
              )}
              {!saving && !saveError && isDraftingCell && (
                <span className="matrix-edit-toolbar__line matrix-edit-toolbar__line--edit">
                  <Pencil size={16} aria-hidden />
                  <span>
                    <strong>Đang sửa ô.</strong> Enter để xác nhận số câu · Esc để bỏ nhập trong ô · Sau đó bấm{' '}
                    <strong>Lưu thay đổi</strong> để hoàn tất.
                  </span>
                </span>
              )}
              {!saving &&
                !saveError &&
                !isDraftingCell &&
                hasPendingChanges && (
                  <span className="matrix-edit-toolbar__line matrix-edit-toolbar__line--pending">
                    <Save size={16} aria-hidden />
                    <span>
                      Có <strong>{dirtyCells.size}</strong> ô đã chỉnh trên màn hình,{' '}
                      <strong>chưa gửi máy chủ</strong>. Bấm <strong>Lưu thay đổi</strong> để hoàn tất hoặc{' '}
                      <strong>Hủy</strong> để trở lại dữ liệu đã tải.
                    </span>
                  </span>
                )}
              {!saving && !saveError && !isDraftingCell && !hasPendingChanges && (
                <span className="matrix-edit-toolbar__line matrix-edit-toolbar__line--synced">
                  <Check size={16} aria-hidden />
                  <span>
                    Đã đồng bộ với máy chủ. Click vào ô số câu để chỉnh — kết thúc bằng{' '}
                    <strong>Lưu thay đổi</strong>.
                  </span>
                </span>
              )}
            </div>

            <div className="matrix-edit-toolbar__actions">
              <button
                type="button"
                className="matrix-toolbar-btn matrix-toolbar-btn--ghost"
                onClick={() => discardPendingChanges()}
                disabled={saving || (!hasPendingChanges && !isDraftingCell)}
                title="Bỏ ô đang nhập và/hoặc các ô đã chỉnh chưa Lưu"
              >
                <X size={15} aria-hidden />
                Hủy
              </button>
              <button
                type="button"
                className="matrix-toolbar-btn matrix-toolbar-btn--primary"
                onClick={() => void performSave()}
                disabled={saving || !hasPendingChanges || isDraftingCell}
                title={
                  isDraftingCell
                    ? 'Hoàn tất ô đang sửa (Enter hoặc click ra ngoài) trước khi lưu'
                    : undefined
                }
              >
                {saving ? (
                  <>
                    <Loader2 size={15} className="matrix-edit-toolbar__spin" aria-hidden />
                    Đang lưu…
                  </>
                ) : (
                  <>
                    <Save size={15} aria-hidden />
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
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

          {/* Body — chương đã sort; cột Lớp gộp theo cụm dòng liên tiếp cùng lớp */}
          <tbody className="matrix-body">
            {flatRows.map((fr, rowIdx) => {
              const { row, chapter, chapterLabel, displayGrade, sortedChapterIndex } = fr;
              const rowTotal = rowTotals[row.rowId] ?? 0;
              const gradeSpan = gradeRowSpans[rowIdx];
              const showGradeCell = gradeSpan > 0;

              const prevFr = rowIdx > 0 ? flatRows[rowIdx - 1] : null;
              const isFirstRowInChapter = !prevFr || prevFr.chapter !== chapter;
              const chapterRowSpan = chapter.rows.length;

              return (
                <tr
                  key={row.rowId}
                  className={`matrix-row ${sortedChapterIndex % 2 === 0 ? 'matrix-row--even' : 'matrix-row--odd'}`}
                >
                  {showGradeCell && (
                    <td className="matrix-td matrix-td--grade" rowSpan={gradeSpan}>
                      <div className="matrix-grade-cell">{displayGrade}</div>
                    </td>
                  )}

                  {isFirstRowInChapter && (
                    <td className="matrix-td matrix-td--chapter" rowSpan={chapterRowSpan}>
                      <div className="matrix-chapter-cell">{chapterLabel}</div>
                    </td>
                  )}

                    {/* Editable cells */}
                    {effectiveParts.map((part) =>
                      cognitiveOrder.map((level) => {
                        const cellId = makeCellId(row.rowId, part.partNumber, level);
                        const count = getCellValue(row.rowId, part.partNumber, level);
                        const isEditing = editingCell === cellId;
                        const isDirty = dirtyCells.has(cellId);
                        
                        const available = getAvailability(
                          row.chapterId || chapter.chapterId || '',
                          part.partNumber,
                          level
                        );
                        const isOverLimit = available !== undefined && count > available;

                        return (
                          <td
                            key={`${part.partNumber}-${level}`}
                            className={`matrix-td matrix-td--level matrix-td--level-${level.toLowerCase()} ${
                              count === 0 ? 'matrix-td--empty' : ''
                            } ${isDirty ? 'matrix-td--dirty' : ''} ${canEdit ? 'matrix-td--editable' : ''} ${
                              isOverLimit ? 'matrix-td--overlimit' : ''
                            }`}
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
                                {available !== undefined && (
                                  <div className={`matrix-cell-availability ${isOverLimit ? 'overlimit' : ''}`} 
                                       title={`Kho có: ${available} ${part.questionType === 'TRUE_FALSE' ? 'mệnh đề' : 'câu'}`}>
                                    <span className="availability-label">Kho:</span>
                                    <span className="availability-count">{available}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })
                    )}

                    <td className={`matrix-td matrix-td--total-type ${rowTotal === 0 ? 'matrix-td--warning' : ''}`}>
                      <div className="matrix-total-cell" title={rowTotal === 0 ? 'Tổng = 0, hàng này sẽ không có câu hỏi' : ''}>
                        {rowTotal}                        {rowTotal === 0 && <span style={{ color: '#dc2626', fontSize: 11, display: 'block' }}>⚠️ Trống</span>}
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
                        {total}                      </div>
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
