/**
 * Teachers reviewing AI drafts often see raw template/engine strings mixed with Vietnamese
 * ("Áp dụng công thức var m = …"). Split into a readable summary + optional technical block for UI.
 */

export type ReviewExplanationParts =
  | { mode: 'plain'; fullText: string }
  | {
      mode: 'structured';
      /** Short Vietnamese line(s) for teachers */
      summary: string;
      /** Raw formula / JS-like logic from template — show in monospace */
      technical: string;
      /** Parsed trailing answer digit if present */
      statedNumericAnswer?: string;
    };

const HEADLINE_WITH_PARAMS =
  /^Áp dụng công thức\s+([\s\S]+?)\s+với các tham số đã cho,\s*đáp án bằng\s*([0-9]+(?:\.[0-9]+)?)\s*\.?\s*$/i;

const HEADLINE_EQUALS_FORM =
  /^Áp dụng công thức:\s*([\s\S]+?)\s*=\s*(\S+)\s*$/;

function looksLikeTechnicalExpression(s: string): boolean {
  const t = s.trim();
  if (t.length < 12) return false;
  const hasDollarMath = /\$(?!\s)/.test(t);
  const codeSignals =
    /\bvar\b/u.test(t) ||
    /\?\s*:/u.test(t) ||
    /\b===?\b/u.test(t) ||
    /\|\|/u.test(t) ||
    /&&/u.test(t) ||
    /\/\/[^\n]*/u.test(t);
  // Intervals like $(-\infty; -5)$ contain `;` — do not treat as JS just because of ; and =
  const semicolonEqualsRule =
    t.includes(';') && /[=<>]=?/.test(t) && !hasDollarMath;
  return codeSignals || semicolonEqualsRule;
}

/**
 * Split stored explanation into teacher-friendly summary + optional technical expression.
 */
export function splitExplanationForTeacherReview(text: string | undefined | null): ReviewExplanationParts {
  if (text == null || text.trim() === '') {
    return { mode: 'plain', fullText: '' };
  }
  const raw = text.trim();

  const mParams = raw.match(HEADLINE_WITH_PARAMS);
  if (mParams) {
    const technical = mParams[1].trim();
    const statedNumericAnswer = mParams[2];
    return {
      mode: 'structured',
      summary:
        'Đáp án được tính từ biểu thức trong mẫu (logic máy tính) với bộ tham số đã gán cho câu này.',
      technical,
      statedNumericAnswer,
    };
  }

  const mEq = raw.match(HEADLINE_EQUALS_FORM);
  if (mEq) {
    const technical = mEq[1].trim();
    const ans = mEq[2];
    if (looksLikeTechnicalExpression(technical)) {
      return {
        mode: 'structured',
        summary:
          'Đáp án được suy ra trực tiếp từ công thức trong mẫu và các giá trị tham số của câu này.',
        technical: `${technical} = ${ans}`,
        statedNumericAnswer: /^[0-9]+(?:\.[0-9]+)?$/.test(ans) ? ans : undefined,
      };
    }
  }

  const blocks = raw.split(/\n\n+/);
  if (blocks.length >= 2) {
    const head = blocks[0].trim();
    const tail = blocks.slice(1).join('\n\n').trim();
    if (looksLikeTechnicalExpression(tail) && head.length > 0) {
      return {
        mode: 'structured',
        summary: head,
        technical: tail,
      };
    }
  }

  if (looksLikeTechnicalExpression(raw) && raw.length > 80) {
    return {
      mode: 'structured',
      summary:
        'Phần dưới là biểu thức/logic máy tính đính kèm trong mẫu — dùng để kiểm tra, không phải lời giải soạn sẵn cho học sinh.',
      technical: raw,
    };
  }

  return { mode: 'plain', fullText: raw };
}
