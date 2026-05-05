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

// Positional Đ/S array for a TF answer aligned with the clause keys.
// "A, C" + ['A','B','C','D'] → [true, false, true, false]
export function tfAnswerToBooleans(
  answer: string | undefined | null,
  keys: string[] = ['A', 'B', 'C', 'D']
): boolean[] {
  const truthy = parseTFAnswer(answer ?? undefined);
  return keys.map(k => truthy.has(k.toUpperCase()));
}

// [true, false, true, false] → "Đ, S, Đ, S"
export function tfBooleansToDSString(values: boolean[]): string {
  return values.map(v => (v ? 'Đ' : 'S')).join(', ');
}

export function normalizeNumericAnswer(value: string): string {
  // Replace comma with dot for decimal numbers
  return value.replace(',', '.');
}

export function validateSANumeric(value: string): boolean {
  const normalized = normalizeNumericAnswer(value);
  return !isNaN(Number(normalized));
}
