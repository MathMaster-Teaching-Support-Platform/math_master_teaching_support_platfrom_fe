/**
 * Converts Roman numerals (up to XX) to numbers.
 */
const romanToNum = (roman: string): number | null => {
  const map: Record<string, number> = {
    I: 1, II: 2, III: 3, IV: 4, V: 5,
    VI: 6, VII: 7, VIII: 8, IX: 9, X: 10,
    XI: 11, XII: 12, XIII: 13, XIV: 14, XV: 15,
    XVI: 16, XVII: 17, XVIII: 18, XIX: 19, XX: 20
  };
  return map[roman.toUpperCase()] || null;
};

/**
 * Extracts a numeric value from a title string (e.g., "Chương 5", "Chapter V", "5. Title").
 * Used for ordering and labeling chapters/sections correctly.
 */
export const extractChapterNumber = (title: string): number | null => {
  if (!title) return null;

  // 0. Quick check: If it's a UUID, ignore it (common for chapter IDs)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(title);
  if (isUuid) return null;

  // Normalize whitespace (including non-breaking spaces)
  const cleanTitle = title.replace(/[\s\u00A0]+/g, ' ').trim();

  // 1. Check for common labels anywhere in the string
  const keywords = [
    'chương', 'chuong', 'chapter', 'bài', 'bai', 
    'section', 'module', 'phần', 'phan', 'unit', 'lesson'
  ];

  for (const word of keywords) {
    // Match the word with boundaries to avoid mid-word matches
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    const match = cleanTitle.match(regex);
    
    if (match && match.index !== undefined) {
      const afterWord = cleanTitle.substring(match.index + word.length);
      
      // Try to find an Arabic number after the keyword (allowing for colons, dashes, etc.)
      const arabicMatch = afterWord.match(/^\s*[:\-.\s]*(\d+)/);
      if (arabicMatch) return parseInt(arabicMatch[1], 10);

      // Try to find a Roman numeral after the keyword
      const romanMatch = afterWord.match(/^\s*[:\-.\s]*([IVXLC]+)(?![a-z0-9])/i);
      if (romanMatch) {
        const r = romanToNum(romanMatch[1]);
        if (r) return r;
      }
    }
  }

  // 2. Check for leading numbers (e.g., "5. Đạo hàm" or "V - Title")
  const leadingArabic = cleanTitle.match(/^\s*(\d+)/);
  if (leadingArabic) return parseInt(leadingArabic[1], 10);

  const leadingRoman = cleanTitle.match(/^\s*([IVXLC]+)(?![a-z0-9])/i);
  if (leadingRoman) {
    const r = romanToNum(leadingRoman[1]);
    if (r) return r;
  }

  return null;
};

/**
 * Robust sorting function for curriculum groups.
 * Prioritizes extracted numeric values, then orderIndex, then natural string comparison.
 */
export const sortCurriculumGroups = (
  a: { id?: string; title: string; type?: string; firstSeenIndex?: number; orderIndex?: number },
  b: { id?: string; title: string; type?: string; firstSeenIndex?: number; orderIndex?: number }
): number => {
  // If both are chapters, try numeric extraction first (fallback to ID)
  if (a.type === 'CHAPTER' && b.type === 'CHAPTER') {
    const numA = extractChapterNumber(a.title) ?? (a.id ? extractChapterNumber(a.id) : null);
    const numB = extractChapterNumber(b.title) ?? (b.id ? extractChapterNumber(b.id) : null);
    if (numA !== null && numB !== null && numA !== numB) {
      return numA - numB;
    }
  }

  // If both are sections, use orderIndex
  if (a.type === 'SECTION' && b.type === 'SECTION') {
    if (a.orderIndex !== undefined && b.orderIndex !== undefined && a.orderIndex !== b.orderIndex) {
      return a.orderIndex - b.orderIndex;
    }
  }

  // Fallback to natural sort on title
  return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
};
