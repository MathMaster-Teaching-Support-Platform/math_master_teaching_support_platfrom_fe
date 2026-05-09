/**
 * Chuẩn hóa LaTeX từ OCR sách (Gemini…): thường thiếu $…$, nhưng có \frac, \begin{cases}, …
 * Dùng cho preview/verify — không gọi từ luồng câu hỏi để tránh ảnh hưởng nội dung khác.
 */

/** Vị trí bắt đầu của lệnh LaTeX "thật" (bỏ qua \\ newline). */
export function findFirstLatexCommandIndex(s: string): number {
  for (let i = 0; i < s.length; i += 1) {
    if (s[i] !== '\\') continue;
    if (i + 1 < s.length && s[i + 1] === '\\') {
      i += 1;
      continue;
    }
    if (s.startsWith('\\begin{', i)) return i;
    if (i + 1 < s.length && /[a-zA-Z]/.test(s[i + 1])) return i;
  }
  return -1;
}

/** Tìm vị trí bắt đầu của \\end{name} khớp \\begin{name} mở tại from (stack các môi trường). */
export function findMatchingEnvironmentEnd(s: string, from: number, openEnv: string): number {
  const stack: string[] = [openEnv];
  let i = from;

  while (i < s.length && stack.length > 0) {
    const sub = s.slice(i);
    const beginExec = /^\\begin\{([^}]+)\}/.exec(sub);
    const endExec = /^\\end\{([^}]+)\}/.exec(sub);
    const bi = beginExec ? beginExec.index : Number.POSITIVE_INFINITY;
    const ei = endExec ? endExec.index : Number.POSITIVE_INFINITY;

    if (bi === Number.POSITIVE_INFINITY && ei === Number.POSITIVE_INFINITY) break;

    if (bi < ei && beginExec) {
      stack.push(beginExec[1]);
      i += bi + beginExec[0].length;
      continue;
    }

    if (endExec) {
      const name = endExec[1];
      i += ei + endExec[0].length;
      if (stack[stack.length - 1] === name) {
        stack.pop();
        if (stack.length === 0) return i - endExec[0].length;
      } else {
        const j = stack.lastIndexOf(name);
        if (j >= 0) stack.splice(j);
      }
      continue;
    }

    break;
  }

  return -1;
}

/**
 * Bọc mỗi khối \\begin{…}…\\end{…} bằng \\[ \\] để KaTeX hiển thị dạng display (cases, aligned, …).
 */
export function wrapEnvironmentBlocks(src: string): string {
  let out = '';
  let i = 0;

  while (i < src.length) {
    const idx = src.indexOf('\\begin{', i);
    if (idx === -1) {
      out += src.slice(i);
      break;
    }

    out += src.slice(i, idx);

    const m = /^\\begin\{([^}]+)\}/.exec(src.slice(idx));
    if (!m) {
      out += src[idx];
      i = idx + 1;
      continue;
    }

    const envName = m[1];
    const innerStart = idx + m[0].length;
    const endPos = findMatchingEnvironmentEnd(src, innerStart, envName);
    if (endPos === -1) {
      out += src.slice(idx, innerStart);
      i = innerStart;
      continue;
    }

    const endMatch = /^\\end\{[^}]+\}/.exec(src.slice(endPos));
    const fullEnd = endPos + (endMatch?.[0].length ?? 0);
    const chunk = src.slice(idx, fullEnd);
    const chunkTrimStart = chunk.trimStart();
    out += chunkTrimStart.startsWith('\\[') ? chunk : `\\[${chunk}\\]`;
    i = fullEnd;
  }

  return out;
}

const VI_PLAIN_MATH_PREFIXES: ReadonlyArray<RegExp> = [
  /^(\s*[a-z]\)\s*)(.+)$/i,
  /^(\s*Chú\s+ý\.?\s*)(.+)$/iu,
  /^(\s*Giải\s*(?:\([^)]*\))?\.?\s*)(.+)$/iu,
  /^(\s*Ví\s+dụ\s+\d+\.\s*)(.+)$/iu,
  /^(\s*Bài\s+tập\s*\d*\.?\s*)(.+)$/iu,
  /^(\s*Luyện\s+tập\s+\d+\.\s*)(.+)$/iu,
  /^(\s*Từ\s+đó\s+)(.+)$/iu,
  /^(\s*Mặt\s+khác,?\s*)(.+)$/iu,
  /^(\s*Do\s+đó\s+)(.+)$/iu,
  /^(\s*Vậy\s+)(.+)$/iu,
];

/** Có ký tự chữ Latin mở rộng (Unicode Letter) — gần đúng cho tiếng Việt. */
function hasUnicodeLetters(s: string): boolean {
  return /\p{L}/u.test(s);
}

/**
 * Thêm $…$ cho dòng có \\ nhưng chưa có $: prefix tiếng Việt + phần LaTeX,
 * hoặc bọc cả dòng nếu không có chữ trước lệnh đầu tiên.
 */
export function injectBareLatexDelimiters(text: string): string {
  const lines = text.split('\n');
  const out = lines.map((line) => {
    if (!line.includes('\\')) return line;
    if (line.includes('$')) return line;
    if (line.includes('\\[') || line.includes('\\]')) return line;

    const trimmedStart = line.trimStart();
    if (trimmedStart.startsWith('\\(') || trimmedStart.startsWith('\\begin')) return line;

    for (const re of VI_PLAIN_MATH_PREFIXES) {
      const m = line.match(re);
      if (m && /\\/.test(m[2])) {
        return `${m[1]}$${m[2]}$`;
      }
    }

    const ix = findFirstLatexCommandIndex(line);
    if (ix >= 0) {
      const prefix = line.slice(0, ix);
      const suffix = line.slice(ix);
      const prefixTrim = prefix.trim();
      if (prefixTrim.length > 0 && hasUnicodeLetters(prefix)) {
        return `${prefix}$${suffix}$`;
      }
      if (!prefixTrim) {
        return `$$${line}$$`;
      }
    }

    return line;
  });

  return out.join('\n');
}

/** Chuẩn hóa một khối văn bản OCR trước khi đưa vào MathText (mode bookOcr). */
export function prepareBookOcrMathContent(raw: string): string {
  if (!raw.includes('\\')) return raw;
  let s = wrapEnvironmentBlocks(raw);
  s = injectBareLatexDelimiters(s);
  return s;
}
