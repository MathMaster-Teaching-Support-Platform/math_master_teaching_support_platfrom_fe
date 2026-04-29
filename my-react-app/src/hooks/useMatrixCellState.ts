import { useState, useCallback, useRef } from 'react';
import { createCellKey } from '../utils/matrixFormatters';

export interface MatrixCell {
  rowId: string;
  partNumber: number;
  cognitiveLevel: string;
  questionCount: number;
  pointsPerQuestion: number;
}

export interface MatrixCellState {
  cells: Record<string, MatrixCell>;
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

interface HistoryEntry {
  cells: Record<string, MatrixCell>;
  timestamp: number;
}

const MAX_HISTORY_SIZE = 50;

/**
 * Hook for managing matrix cell state with undo/redo support
 */
export function useMatrixCellState(initialCells: MatrixCell[] = []) {
  const [cells, setCells] = useState<Record<string, MatrixCell>>(() => {
    const cellMap: Record<string, MatrixCell> = {};
    initialCells.forEach((cell) => {
      const key = createCellKey(cell.rowId, cell.partNumber, cell.cognitiveLevel);
      cellMap[key] = cell;
    });
    return cellMap;
  });

  const [isDirty, setIsDirty] = useState(false);
  const undoStack = useRef<HistoryEntry[]>([]);
  const redoStack = useRef<HistoryEntry[]>([]);

  const pushHistory = useCallback(() => {
    // Push current state to undo stack
    undoStack.current.push({
      cells: { ...cells },
      timestamp: Date.now(),
    });

    // Limit history size
    if (undoStack.current.length > MAX_HISTORY_SIZE) {
      undoStack.current.shift();
    }

    // Clear redo stack when new change is made
    redoStack.current = [];
  }, [cells]);

  const updateCell = useCallback(
    (rowId: string, partNumber: number, cognitiveLevel: string, updates: Partial<MatrixCell>) => {
      const key = createCellKey(rowId, partNumber, cognitiveLevel);

      setCells((prev) => {
        pushHistory();

        const existingCell = prev[key];
        const newCell: MatrixCell = {
          rowId,
          partNumber,
          cognitiveLevel,
          questionCount: existingCell?.questionCount ?? 0,
          pointsPerQuestion: existingCell?.pointsPerQuestion ?? 0,
          ...updates,
        };

        // Remove cell if question count is 0
        if (newCell.questionCount === 0) {
          const { [key]: _, ...rest } = prev;
          return rest;
        }

        return {
          ...prev,
          [key]: newCell,
        };
      });

      setIsDirty(true);
    },
    [pushHistory]
  );

  const bulkUpdateCells = useCallback(
    (updates: Array<{ rowId: string; partNumber: number; cognitiveLevel: string; updates: Partial<MatrixCell> }>) => {
      setCells((prev) => {
        pushHistory();

        const newCells = { ...prev };

        updates.forEach(({ rowId, partNumber, cognitiveLevel, updates: cellUpdates }) => {
          const key = createCellKey(rowId, partNumber, cognitiveLevel);
          const existingCell = newCells[key];

          const newCell: MatrixCell = {
            rowId,
            partNumber,
            cognitiveLevel,
            questionCount: existingCell?.questionCount ?? 0,
            pointsPerQuestion: existingCell?.pointsPerQuestion ?? 0,
            ...cellUpdates,
          };

          if (newCell.questionCount === 0) {
            delete newCells[key];
          } else {
            newCells[key] = newCell;
          }
        });

        return newCells;
      });

      setIsDirty(true);
    },
    [pushHistory]
  );

  const deleteCell = useCallback(
    (rowId: string, partNumber: number, cognitiveLevel: string) => {
      const key = createCellKey(rowId, partNumber, cognitiveLevel);

      setCells((prev) => {
        pushHistory();
        const { [key]: _, ...rest } = prev;
        return rest;
      });

      setIsDirty(true);
    },
    [pushHistory]
  );

  const deleteRow = useCallback(
    (rowId: string) => {
      setCells((prev) => {
        pushHistory();

        const newCells: Record<string, MatrixCell> = {};
        Object.entries(prev).forEach(([key, cell]) => {
          if (cell.rowId !== rowId) {
            newCells[key] = cell;
          }
        });

        return newCells;
      });

      setIsDirty(true);
    },
    [pushHistory]
  );

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;

    const previousState = undoStack.current.pop();
    if (!previousState) return;

    // Push current state to redo stack
    redoStack.current.push({
      cells: { ...cells },
      timestamp: Date.now(),
    });

    setCells(previousState.cells);
    setIsDirty(true);
  }, [cells]);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;

    const nextState = redoStack.current.pop();
    if (!nextState) return;

    // Push current state to undo stack
    undoStack.current.push({
      cells: { ...cells },
      timestamp: Date.now(),
    });

    setCells(nextState.cells);
    setIsDirty(true);
  }, [cells]);

  const reset = useCallback((newCells: MatrixCell[] = []) => {
    const cellMap: Record<string, MatrixCell> = {};
    newCells.forEach((cell) => {
      const key = createCellKey(cell.rowId, cell.partNumber, cell.cognitiveLevel);
      cellMap[key] = cell;
    });

    setCells(cellMap);
    setIsDirty(false);
    undoStack.current = [];
    redoStack.current = [];
  }, []);

  const markClean = useCallback(() => {
    setIsDirty(false);
  }, []);

  const getCellsArray = useCallback((): MatrixCell[] => {
    return Object.values(cells);
  }, [cells]);

  const getCellsByRow = useCallback(
    (rowId: string): MatrixCell[] => {
      return Object.values(cells).filter((cell) => cell.rowId === rowId);
    },
    [cells]
  );

  const getCellsByPart = useCallback(
    (partNumber: number): MatrixCell[] => {
      return Object.values(cells).filter((cell) => cell.partNumber === partNumber);
    },
    [cells]
  );

  const getCell = useCallback(
    (rowId: string, partNumber: number, cognitiveLevel: string): MatrixCell | undefined => {
      const key = createCellKey(rowId, partNumber, cognitiveLevel);
      return cells[key];
    },
    [cells]
  );

  return {
    cells,
    isDirty,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
    updateCell,
    bulkUpdateCells,
    deleteCell,
    deleteRow,
    undo,
    redo,
    reset,
    markClean,
    getCellsArray,
    getCellsByRow,
    getCellsByPart,
    getCell,
  };
}
