/**
 * Utility functions for working with configurable exam matrix parts (v4 architecture)
 */

import type { ExamMatrixPartConfig, MatrixQuestionType } from '../types/examMatrix';
import { QUESTION_TYPE_LABELS } from '../types/constants';

/**
 * FE-2: Single Source of Truth Rule
 * Get the number of parts from parts array (NEVER use numberOfParts directly)
 */
export function getNumberOfParts(parts?: ExamMatrixPartConfig[]): number {
  return parts?.length ?? 0;
}

/**
 * FE-2: Get part label for display
 * Uses custom name if provided, otherwise generates from part number and question type
 */
export function getPartLabel(part: ExamMatrixPartConfig): string {
  if (part.name) {
    return part.name;
  }
  const typeLabel = QUESTION_TYPE_LABELS[part.questionType] || part.questionType;
  return `Phần ${toRoman(part.partNumber)} (${typeLabel})`;
}

/**
 * Convert number to Roman numeral (1-3 only)
 */
export function toRoman(num: number): string {
  const romanMap: Record<number, string> = {
    1: 'I',
    2: 'II',
    3: 'III',
  };
  return romanMap[num] || String(num);
}

/**
 * Get question type for a specific part number
 * Returns undefined if part not found
 */
export function getQuestionTypeForPart(
  parts: ExamMatrixPartConfig[] | undefined,
  partNumber: number
): MatrixQuestionType | undefined {
  return parts?.find(p => p.partNumber === partNumber)?.questionType;
}

/**
 * Get part configuration by part number
 * Returns undefined if part not found
 */
export function getPartByNumber(
  parts: ExamMatrixPartConfig[] | undefined,
  partNumber: number
): ExamMatrixPartConfig | undefined {
  return parts?.find(p => p.partNumber === partNumber);
}

/**
 * Create default parts for legacy matrices (MCQ, TF, SA)
 */
export function createDefaultParts(numberOfParts: number): ExamMatrixPartConfig[] {
  const defaults: MatrixQuestionType[] = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'];
  const parts: ExamMatrixPartConfig[] = [];
  
  for (let i = 1; i <= Math.min(numberOfParts, 3); i++) {
    parts.push({
      partNumber: i,
      questionType: defaults[i - 1],
    });
  }
  
  return parts;
}

/**
 * Validate parts configuration
 */
export function validateParts(parts: ExamMatrixPartConfig[]): string[] {
  const errors: string[] = [];
  
  if (parts.length === 0) {
    errors.push('Phải có ít nhất 1 phần');
  }
  
  if (parts.length > 3) {
    errors.push('Tối đa 3 phần');
  }
  
  const partNumbers = parts.map(p => p.partNumber);
  const uniquePartNumbers = new Set(partNumbers);
  if (partNumbers.length !== uniquePartNumbers.size) {
    errors.push('Số phần không được trùng lặp');
  }
  
  for (const part of parts) {
    if (part.partNumber < 1 || part.partNumber > 3) {
      errors.push(`Số phần phải từ 1-3 (nhận được: ${part.partNumber})`);
    }
    
    if (!part.questionType) {
      errors.push(`Phần ${part.partNumber} thiếu loại câu hỏi`);
    }
  }
  
  return errors;
}

/**
 * Sort parts by part number (ascending)
 */
export function sortParts(parts: ExamMatrixPartConfig[]): ExamMatrixPartConfig[] {
  return [...parts].sort((a, b) => a.partNumber - b.partNumber);
}

/**
 * Check if parts array is valid and non-empty
 */
export function hasValidParts(parts?: ExamMatrixPartConfig[]): parts is ExamMatrixPartConfig[] {
  return Array.isArray(parts) && parts.length > 0;
}
