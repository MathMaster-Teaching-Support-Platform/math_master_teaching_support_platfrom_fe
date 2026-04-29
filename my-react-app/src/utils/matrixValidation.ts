import { PART_TYPE_MAP } from '../types/constants';
import type { QuestionType } from '../types/question';

export interface MatrixCellValidationError {
  field: string;
  message: string;
}

export interface MatrixRowValidation {
  isValid: boolean;
  errors: MatrixCellValidationError[];
  warnings: string[];
}

/**
 * Validates a matrix row before submission
 */
export function validateMatrixRow(params: {
  chapterId?: string;
  questionBankId?: string;
  cells: Array<{
    cognitiveLevel: string;
    questionCount: number;
    pointsPerQuestion: number;
    partNumber: number;
  }>;
  numberOfParts: number;
  bankStats?: Record<string, number>;
}): MatrixRowValidation {
  const errors: MatrixCellValidationError[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!params.chapterId) {
    errors.push({ field: 'chapterId', message: 'Vui lòng chọn chương' });
  }

  if (!params.questionBankId) {
    errors.push({ field: 'questionBankId', message: 'Vui lòng chọn ngân hàng câu hỏi' });
  }

  // At least one cell with questions
  if (params.cells.length === 0) {
    errors.push({ field: 'cells', message: 'Mỗi dòng cần ít nhất 1 mức độ có số câu > 0' });
  }

  // Validate each cell
  params.cells.forEach((cell, index) => {
    // Question count validation
    if (cell.questionCount < 0) {
      errors.push({
        field: `cells[${index}].questionCount`,
        message: `Số câu phải >= 0 (${cell.cognitiveLevel})`,
      });
    }

    // Points validation
    if (cell.pointsPerQuestion <= 0) {
      errors.push({
        field: `cells[${index}].pointsPerQuestion`,
        message: `Điểm mỗi câu phải > 0 (${cell.cognitiveLevel})`,
      });
    }

    // Part number validation
    if (cell.partNumber < 1 || cell.partNumber > params.numberOfParts) {
      errors.push({
        field: `cells[${index}].partNumber`,
        message: `Part ${cell.partNumber} vượt quá số phần (${params.numberOfParts})`,
      });
    }

    // Bank capacity check (warning only)
    if (params.bankStats) {
      const available = params.bankStats[cell.cognitiveLevel] || 0;
      if (cell.questionCount > available) {
        warnings.push(
          `${cell.cognitiveLevel}: Yêu cầu ${cell.questionCount} câu nhưng bank chỉ có ${available} câu`
        );
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculates points per question based on total target and question count
 */
export function calculatePointsPerQuestion(
  totalPointsTarget: number,
  totalQuestions: number
): number {
  if (totalQuestions === 0) return 0;
  return Number((totalPointsTarget / totalQuestions).toFixed(4));
}

/**
 * Gets the question type for a given part number
 */
export function getQuestionTypeForPart(partNumber: number): QuestionType {
  return PART_TYPE_MAP[partNumber] || 'MULTIPLE_CHOICE';
}

/**
 * Validates that a part number is valid for the matrix
 */
export function isValidPartNumber(partNumber: number, numberOfParts: number): boolean {
  return partNumber >= 1 && partNumber <= numberOfParts;
}

/**
 * Groups cells by part number
 */
export function groupCellsByPart<T extends { partNumber?: number }>(
  cells: T[]
): Record<number, T[]> {
  const grouped: Record<number, T[]> = {};
  
  cells.forEach((cell) => {
    const part = cell.partNumber || 1;
    if (!grouped[part]) {
      grouped[part] = [];
    }
    grouped[part].push(cell);
  });

  return grouped;
}

/**
 * Calculates totals for each cognitive level across all parts
 */
export function calculateCognitiveTotals(
  cells: Array<{ cognitiveLevel: string; questionCount: number }>
): Record<string, number> {
  const totals: Record<string, number> = {};

  cells.forEach((cell) => {
    const level = cell.cognitiveLevel;
    totals[level] = (totals[level] || 0) + cell.questionCount;
  });

  return totals;
}

/**
 * Calculates totals for each part
 */
export function calculatePartTotals(
  cells: Array<{ partNumber?: number; questionCount: number }>
): Record<number, number> {
  const totals: Record<number, number> = {};

  cells.forEach((cell) => {
    const part = cell.partNumber || 1;
    totals[part] = (totals[part] || 0) + cell.questionCount;
  });

  return totals;
}

/**
 * Validates TF clause data
 */
export function validateTFClauses(clauses: Array<{ text: string }>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (clauses.length !== 4) {
    errors.push('Câu hỏi Đúng/Sai phải có đúng 4 mệnh đề');
  }

  clauses.forEach((clause, index) => {
    if (!clause.text || clause.text.trim() === '') {
      errors.push(`Mệnh đề ${String.fromCharCode(65 + index)} không được trống`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Formats validation errors for display
 */
export function formatValidationErrors(errors: MatrixCellValidationError[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0].message;
  return errors.map((e, i) => `${i + 1}. ${e.message}`).join('\n');
}
