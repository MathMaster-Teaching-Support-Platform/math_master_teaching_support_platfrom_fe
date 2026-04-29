import type { QuestionType } from '../types/question';
import { FE_DEFAULTS, PART_TYPE_MAP } from '../types/constants';

export function resolveQuestionType(q: { questionType?: string | QuestionType }): QuestionType {
  return (q.questionType as QuestionType) ?? FE_DEFAULTS.questionType;
}

export function resolveNumberOfParts(m: { numberOfParts?: number }): number {
  return m.numberOfParts ?? FE_DEFAULTS.numberOfParts;
}

export function resolvePartTypeMapping(
  m: { partTypeMapping?: Record<number, QuestionType>; numberOfParts?: number }
): Record<number, QuestionType> {
  if (m.partTypeMapping) return m.partTypeMapping;
  const n = resolveNumberOfParts(m);
  const map: Record<number, QuestionType> = {};
  for (let i = 1; i <= n; i++) {
    map[i] = PART_TYPE_MAP[i];
  }
  return map;
}

export function formatTFAnswer(selectedKeys: Set<string>): string {
  return ['A', 'B', 'C', 'D']
    .filter(k => selectedKeys.has(k))
    .join(',');
}

export function parseTFAnswer(answer?: string): Set<string> {
  if (!answer) return new Set();
  return new Set(
    answer
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(k => ['A', 'B', 'C', 'D'].includes(k))
  );
}

export function normalizeNumericAnswer(value: string): string {
  // Replace comma with dot for decimal numbers
  return value.replace(',', '.');
}

export function validateSANumeric(value: string): boolean {
  const normalized = normalizeNumericAnswer(value);
  return !isNaN(Number(normalized));
}
