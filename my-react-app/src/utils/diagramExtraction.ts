// Extracts a renderable diagram (image URL, primary LaTeX, or list of LaTeX
// candidates) from the heterogeneous shapes BE returns for diagram_data.
//
// BE Question.diagramData is a TEXT column that stores either raw LaTeX/TikZ,
// a JSON object like { latex: "..." } produced by EnhancedQuestionFormModal,
// or a Jackson-serialized representation of either. Question.renderedImageUrl
// is now mirrored to response DTOs as diagramUrl when the BE has cached an
// image via /api/latex/render.

export interface DiagramSource {
  diagramData?: unknown;
  diagramUrl?: string;
  diagramLatex?: string;
}

export interface ExtractedDiagram {
  imageUrl?: string;
  latex?: string;
  latexValues: string[];
  caption?: string;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number') return String(value);
  }
  return undefined;
}

function isLikelyImageSource(value?: string): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('data:image/') ||
    normalized.startsWith('/')
  );
}

function normalizeLatexInput(value?: string): string | undefined {
  if (!value) return undefined;
  let text = value.trim();
  if (text.startsWith('$$') && text.endsWith('$$') && text.length > 4) {
    text = text.slice(2, -2).trim();
  } else if (text.startsWith('$') && text.endsWith('$') && text.length > 2) {
    text = text.slice(1, -1).trim();
  } else if (text.startsWith(String.raw`\(`) && text.endsWith(String.raw`\)`) && text.length > 4) {
    text = text.slice(2, -2).trim();
  } else if (text.startsWith(String.raw`\[`) && text.endsWith(String.raw`\]`) && text.length > 4) {
    text = text.slice(2, -2).trim();
  }
  return text || undefined;
}

function extractLatexCandidateFromString(value: string, keyName = ''): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.includes('{{') || trimmed.includes('}}')) return undefined;

  const looksLikeIdentifier = /^[a-zA-Z]+(?:_[a-zA-Z0-9]+)+$/.test(trimmed);
  if (looksLikeIdentifier) return undefined;

  const keyLooksLatex = /latex|tex|equation|formula|expression|math/i.test(keyName);
  const hasLatexSyntax = /\$[^$]+\$|\\[a-zA-Z]+/.test(trimmed);
  const hasMathOperators = /[=+\-*/^]/.test(trimmed);
  const hasMathSymbols = /\d|[xyabcnm]|π|√/i.test(trimmed);

  if (!(keyLooksLatex || hasLatexSyntax || (hasMathOperators && hasMathSymbols))) {
    return undefined;
  }

  const normalized = normalizeLatexInput(trimmed);
  if (!normalized || isLikelyImageSource(normalized)) return undefined;
  return normalized;
}

function extractDiagramLatexStrings(diagramData: unknown): string[] {
  const values: string[] = [];
  const seen = new WeakSet<object>();

  const visit = (node: unknown, keyName = '') => {
    if (typeof node === 'string') {
      const candidate = extractLatexCandidateFromString(node, keyName);
      if (candidate) values.push(candidate);
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((item) => visit(item, keyName));
      return;
    }

    if (node && typeof node === 'object') {
      if (seen.has(node)) return;
      seen.add(node);

      Object.entries(node as Record<string, unknown>).forEach(([key, value]) => {
        visit(value, key);
      });
    }
  };

  visit(diagramData);
  return Array.from(new Set(values)).slice(0, 6);
}

function extractPrimaryDiagramLatex(diagramData: unknown): string | null {
  if (typeof diagramData === 'string') {
    const value = normalizeLatexInput(diagramData.trim());
    if (!value || isLikelyImageSource(value)) return null;
    return value;
  }

  if (!diagramData || typeof diagramData !== 'object' || Array.isArray(diagramData)) {
    return null;
  }

  const record = diagramData as Record<string, unknown>;
  const directCandidates = ['latex', 'tex', 'equation', 'formula', 'expression', 'math', 'diagram'];
  for (const key of directCandidates) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      const normalized = normalizeLatexInput(value.trim());
      if (normalized && !isLikelyImageSource(normalized)) return normalized;
    }
  }

  const discovered = extractDiagramLatexStrings(record);
  return discovered[0]?.trim() ?? null;
}

export function extractDiagram(source: DiagramSource): ExtractedDiagram {
  const raw = source.diagramData;

  if (typeof raw === 'string') {
    if (isLikelyImageSource(raw)) {
      return { imageUrl: source.diagramUrl ?? raw, latexValues: [] };
    }
    const normalized = normalizeLatexInput(raw);
    return {
      imageUrl: source.diagramUrl,
      latex: normalized,
      latexValues: normalized ? [normalized] : [],
    };
  }

  const rawObj = toRecord(raw);
  const imageUrl = pickString(
    source.diagramUrl,
    rawObj.imageUrl,
    rawObj.image_url,
    rawObj.url,
    rawObj.src,
  );
  const primaryLatex = pickString(
    source.diagramLatex,
    rawObj.latex,
    rawObj.latexContent,
    rawObj.latex_content,
    rawObj.formula,
    extractPrimaryDiagramLatex(raw),
  );
  const latexValues = extractDiagramLatexStrings(raw);
  const caption = pickString(rawObj.caption, rawObj.title, rawObj.description);

  return {
    imageUrl: isLikelyImageSource(imageUrl) ? imageUrl : undefined,
    latex: normalizeLatexInput(primaryLatex),
    latexValues,
    caption,
  };
}

export function hasRenderableDiagram(source: DiagramSource): boolean {
  if (!source.diagramData && !source.diagramUrl && !source.diagramLatex) return false;
  const d = extractDiagram(source);
  return !!d.imageUrl || !!d.latex || d.latexValues.length > 0;
}
