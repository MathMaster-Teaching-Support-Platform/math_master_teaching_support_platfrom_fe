import { PART_LABELS, COGNITIVE_LEVEL_LABELS } from '../types/constants';
import type { QuestionType } from '../types/question';

/**
 * Formats a part number to its display label
 */
export function formatPartLabel(partNumber: number): string {
  return PART_LABELS[partNumber] || `Phần ${partNumber}`;
}

/**
 * Formats a cognitive level to its display label
 */
export function formatCognitiveLevel(level: string): string {
  const upperLevel = level.toUpperCase();
  
  // Handle short forms
  if (upperLevel === 'NB') return 'Nhận biết';
  if (upperLevel === 'TH') return 'Thông hiểu';
  if (upperLevel === 'VD') return 'Vận dụng';
  if (upperLevel === 'VDC') return 'Vận dụng cao';
  
  // Handle full forms
  const fullFormKey = upperLevel as keyof typeof COGNITIVE_LEVEL_LABELS;
  if (fullFormKey in COGNITIVE_LEVEL_LABELS) {
    return COGNITIVE_LEVEL_LABELS[fullFormKey];
  }
  
  return level;
}

/**
 * Formats question type to Vietnamese label
 */
export function formatQuestionType(type: QuestionType): string {
  const labels: Record<QuestionType, string> = {
    MULTIPLE_CHOICE: 'Trắc nghiệm',
    TRUE_FALSE: 'Đúng/Sai',
    SHORT_ANSWER: 'Trả lời ngắn',
    ESSAY: 'Tự luận',
    CODING: 'Lập trình',
  };
  return labels[type] || type;
}

/**
 * Formats a percentage value
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formats points with proper decimal places
 */
export function formatPoints(points: number, decimals: number = 2): string {
  return points.toFixed(decimals);
}

/**
 * Formats a date to Vietnamese locale
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Formats time duration in seconds to readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} giây`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes} phút ${remainingSeconds} giây`
      : `${minutes} phút`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0
    ? `${hours} giờ ${remainingMinutes} phút`
    : `${hours} giờ`;
}

/**
 * Formats a matrix status to Vietnamese
 */
export function formatMatrixStatus(status: string): string {
  const statusLabels: Record<string, string> = {
    DRAFT: 'Nháp',
    APPROVED: 'Đã phê duyệt',
    LOCKED: 'Đã khóa',
    ARCHIVED: 'Đã lưu trữ',
  };
  return statusLabels[status] || status;
}

/**
 * Formats difficulty level to Vietnamese
 */
export function formatDifficulty(difficulty: string): string {
  const difficultyLabels: Record<string, string> = {
    EASY: 'Dễ',
    MEDIUM: 'Trung bình',
    HARD: 'Khó',
  };
  return difficultyLabels[difficulty] || difficulty;
}

/**
 * Creates a cell key for matrix cell identification
 */
export function createCellKey(
  rowId: string,
  partNumber: number,
  cognitiveLevel: string
): string {
  return `${rowId}:${partNumber}:${cognitiveLevel}`;
}

/**
 * Parses a cell key back to its components
 */
export function parseCellKey(key: string): {
  rowId: string;
  partNumber: number;
  cognitiveLevel: string;
} | null {
  const parts = key.split(':');
  if (parts.length !== 3) return null;
  
  const partNumber = parseInt(parts[1], 10);
  if (isNaN(partNumber)) return null;
  
  return {
    rowId: parts[0],
    partNumber,
    cognitiveLevel: parts[2],
  };
}

/**
 * Formats a score with color coding
 */
export function getScoreColor(score: number, maxScore: number): string {
  const percentage = (score / maxScore) * 100;
  
  if (percentage >= 80) return '#16a34a'; // green
  if (percentage >= 60) return '#eab308'; // yellow
  if (percentage >= 40) return '#f97316'; // orange
  return '#dc2626'; // red
}

/**
 * Formats answer value based on question type
 */
export function formatAnswerValue(
  answerValue: string | undefined,
  questionType: QuestionType
): string {
  if (!answerValue) return '(Chưa trả lời)';
  
  switch (questionType) {
    case 'TRUE_FALSE':
      // Format "A,C" to "A, C"
      return answerValue.split(',').filter(Boolean).join(', ');
    case 'MULTIPLE_CHOICE':
      return answerValue.toUpperCase();
    case 'SHORT_ANSWER':
      return answerValue;
    default:
      return answerValue;
  }
}

/**
 * Gets a badge color for question type
 */
export function getQuestionTypeBadgeColor(type: QuestionType): {
  bg: string;
  text: string;
} {
  const colors: Record<QuestionType, { bg: string; text: string }> = {
    MULTIPLE_CHOICE: { bg: '#eff6ff', text: '#1e40af' },
    TRUE_FALSE: { bg: '#f0fdf4', text: '#166534' },
    SHORT_ANSWER: { bg: '#fef3c7', text: '#92400e' },
    ESSAY: { bg: '#f3e8ff', text: '#6b21a8' },
    CODING: { bg: '#fce7f3', text: '#9f1239' },
  };
  return colors[type] || { bg: '#f3f4f6', text: '#374151' };
}

/**
 * Truncates text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Formats a list of tags
 */
export function formatTags(tags: string[]): string {
  if (tags.length === 0) return '-';
  return tags.join(', ');
}
