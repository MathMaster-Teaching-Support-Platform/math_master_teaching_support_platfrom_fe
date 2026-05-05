// Normalizes a Question option value (MCQ choice or TF clause) to a plain
// string for <MathText />. BE shape varies:
//   - MCQ: options is Map<String, String>            -> "$\\frac{1}{2}$"
//   - TF (post setClausePoints): Map<String, Map>    -> { text, overdrive_point }
//     (see AIEnhancementServiceImpl.setClausePoints, BE commit 54e6244)
// String(value) on the second shape yields "[object Object]", which kills
// LaTeX rendering. Walk the common keys instead and fall back to JSON only
// as a last resort so the user still sees something diagnosable.

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function pickString(...candidates: unknown[]): string | undefined {
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim() !== '') return c;
    if (typeof c === 'number') return String(c);
  }
  return undefined;
}

export function extractOptionText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (!isPlainObject(value)) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  const text = pickString(
    value.text,
    value.latex,
    value.tex,
    value.formula,
    value.expression,
    value.math,
    value.content,
    value.label,
    value.value,
  );
  if (text) return text;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
