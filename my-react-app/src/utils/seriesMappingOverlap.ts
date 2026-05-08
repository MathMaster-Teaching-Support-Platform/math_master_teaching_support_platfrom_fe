export interface BookRangeInput {
  bookId: string;
  bookTitle: string;
  from: number | null;
  to: number | null;
}

export interface BookRangeConflict {
  leftBookId: string;
  rightBookId: string;
  overlapFrom: number;
  overlapTo: number;
}

export interface SeriesRangeRow {
  bookId: string;
  bookTitle: string;
  from: number | null;
  to: number | null;
  mappedLessonCount: number;
}

export const rangesOverlap = (
  fromA: number,
  toA: number,
  fromB: number,
  toB: number
): boolean => Math.max(fromA, fromB) <= Math.min(toA, toB);

export function detectBookRangeConflicts(ranges: BookRangeInput[]): BookRangeConflict[] {
  const normalized = ranges.filter(
    (r): r is BookRangeInput & { from: number; to: number } =>
      typeof r.from === 'number' && typeof r.to === 'number' && Number.isFinite(r.from) && Number.isFinite(r.to) && r.from <= r.to
  );

  const conflicts: BookRangeConflict[] = [];
  for (let i = 0; i < normalized.length; i += 1) {
    for (let j = i + 1; j < normalized.length; j += 1) {
      const left = normalized[i];
      const right = normalized[j];
      if (!rangesOverlap(left.from, left.to, right.from, right.to)) continue;
      conflicts.push({
        leftBookId: left.bookId,
        rightBookId: right.bookId,
        overlapFrom: Math.max(left.from, right.from),
        overlapTo: Math.min(left.to, right.to),
      });
    }
  }
  return conflicts;
}

export function toSeriesRangeRows(
  books: Array<{ id: string; title: string }>,
  mappings: Array<{ bookId: string; pageStart: number; pageEnd: number }>
): SeriesRangeRow[] {
  const grouped = new Map<string, Array<{ pageStart: number; pageEnd: number }>>();
  mappings.forEach((m) => {
    const current = grouped.get(m.bookId) ?? [];
    current.push({ pageStart: m.pageStart, pageEnd: m.pageEnd });
    grouped.set(m.bookId, current);
  });

  return books.map((b) => {
    const ranges = grouped.get(b.id) ?? [];
    const minPage = ranges.length ? Math.min(...ranges.map((r) => r.pageStart)) : null;
    const maxPage = ranges.length ? Math.max(...ranges.map((r) => r.pageEnd)) : null;
    return {
      bookId: b.id,
      bookTitle: b.title,
      from: minPage,
      to: maxPage,
      mappedLessonCount: ranges.length,
    };
  });
}
