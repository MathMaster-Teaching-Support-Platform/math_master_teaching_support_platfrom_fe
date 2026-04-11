import { useEffect } from 'react';
import type { AttemptQuestionResponse } from '../../types/studentAssessment.types';
import MathText from '../common/MathText';
import LatexRenderer from '../common/LatexRenderer';

interface QuestionDisplayProps {
  question: AttemptQuestionResponse;
  answer: any;
  onAnswerChange: (value: any) => void;
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
  return normalized.startsWith('http://')
    || normalized.startsWith('https://')
    || normalized.startsWith('data:image/')
    || normalized.startsWith('/');
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

function extractDiagram(question: AttemptQuestionResponse): {
  imageUrl?: string;
  latex?: string;
  latexValues: string[];
  caption?: string;
} {
  const raw = question.diagramData;
  if (typeof raw === 'string') {
    if (isLikelyImageSource(raw)) return { imageUrl: raw, latexValues: [] };
    const normalized = normalizeLatexInput(raw);
    return { latex: normalized, latexValues: normalized ? [normalized] : [] };
  }

  const rawObj = toRecord(raw);
  const imageUrl = pickString(
    question.diagramUrl,
    rawObj.imageUrl,
    rawObj.image_url,
    rawObj.url,
    rawObj.src,
  );
  const primaryLatex = pickString(
    question.diagramLatex,
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

function extractOptionText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);

  const record = toRecord(value);
  const rawText = pickString(
    record.latex,
    record.tex,
    record.formula,
    record.expression,
    record.math,
    record.content,
    record.text,
    record.label,
    record.value,
  );

  if (rawText) return rawText;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function normalizeOptionMathText(value: unknown): string {
  return extractOptionText(value);
}

export default function QuestionDisplay({ question, answer, onAnswerChange }: Readonly<QuestionDisplayProps>) {
  const diagram = extractDiagram(question);
  const optionalLatex = normalizeLatexInput(pickString(question.latexContent, question.answerFormula));
  const hasDiagramPayload = !!question.diagramData || !!question.diagramUrl || !!question.diagramLatex;
  const hasRenderableDiagram = !!diagram.imageUrl || !!diagram.latex || diagram.latexValues.length > 0;
  const shouldRenderDiagram = question.questionType === 'MULTIPLE_CHOICE' || hasDiagramPayload || hasRenderableDiagram;
  const forceDebugLatex = !diagram.imageUrl && !diagram.latex && diagram.latexValues.length === 0
    ? String.raw`x`
    : null;

  useEffect(() => {
    if (diagram.imageUrl) return;

    console.debug('[DiagramDebug] diagram url = null', {
      questionId: question.questionId,
      diagramUrl: question.diagramUrl ?? null,
      extractedImageUrl: diagram.imageUrl ?? null,
      extractedLatex: diagram.latex ?? null,
      extractedLatexValues: diagram.latexValues,
      rawDiagramData: question.diagramData ?? null,
    });
  }, [
    diagram.imageUrl,
    diagram.latex,
    diagram.latexValues,
    question.questionId,
    question.diagramData,
    question.diagramUrl,
  ]);

  const diagramSection = (
    <div style={{ marginBottom: 16 }}>
      {diagram.imageUrl && (
        <img
          src={diagram.imageUrl}
          alt={diagram.caption || 'Question diagram'}
          style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border-color)' }}
        />
      )}
      {!diagram.imageUrl && diagram.latex && (
        // Fallback path: no URL in diagram_data -> use backend LaTeX render API.
        <LatexRenderer latex={diagram.latex} />
      )}
      {!diagram.imageUrl && !diagram.latex && diagram.latexValues.length > 0 && (
        <div className="row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
          {diagram.latexValues.map((latexValue, index) => (
            <div key={`${question.questionId}-diagram-latex-${index}`} className="preview-box">
              <LatexRenderer latex={latexValue} />
            </div>
          ))}
        </div>
      )}
      {!diagram.imageUrl && !diagram.latex && (
        <div>
          {forceDebugLatex && (
            <div style={{ marginBottom: 8 }}>
              {/* Debug fallback: force call /latex/render so BE can trace request even when diagram_data is null. */}
              <LatexRenderer latex={forceDebugLatex} />
            </div>
          )}
          <p className="muted" style={{ margin: 0 }}>
            Chua co du lieu diagram render duoc (url/latex). Dang cho du lieu tu BE.
          </p>
        </div>
      )}
      {diagram.caption && <p className="muted" style={{ marginTop: 8 }}>{diagram.caption}</p>}
    </div>
  );

  return (
    <div style={{ padding: 24, backgroundColor: 'white', borderRadius: 8, border: '1px solid var(--border-color)' }}>
      <div style={{ marginBottom: 8 }}>
        <span className="badge">{question.points} điểm</span>
      </div>

      <h3 style={{ marginBottom: 16 }}>
        <MathText text={question.questionText} />
      </h3>

      {optionalLatex && (
        <div style={{ marginBottom: 16 }}>
          <LatexRenderer latex={optionalLatex} />
        </div>
      )}

      {question.questionType !== 'MULTIPLE_CHOICE' && shouldRenderDiagram && diagramSection}

      {question.questionType === 'MULTIPLE_CHOICE' && question.options && (
        <div style={{ display: 'grid', gridTemplateColumns: shouldRenderDiagram ? '1.5fr 1fr' : '1fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(question.options).map(([key, value]) => {
              const optionText = normalizeOptionMathText(value);
              return (
              <label
                key={key}
                className="row"
                style={{
                  padding: 12,
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  backgroundColor: answer === key ? 'var(--primary-color-light)' : 'white',
                  transition: 'all 0.2s',
                }}
              >
                <input
                  type="radio"
                  name={`question-${question.questionId}`}
                  value={key}
                  checked={answer === key}
                  onChange={(e) => onAnswerChange(e.target.value)}
                  style={{ marginRight: 12 }}
                />
                <span>
                  <MathText text={optionText} />
                </span>
              </label>
              );
            })}
          </div>

          {shouldRenderDiagram && (
            <div className="preview-box" style={{ alignSelf: 'start' }}>
              {diagramSection}
            </div>
          )}
        </div>
      )}

      {question.questionType === 'TRUE_FALSE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label
            className="row"
            style={{
              padding: 12,
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              cursor: 'pointer',
              backgroundColor: answer === 'true' ? 'var(--primary-color-light)' : 'white',
            }}
          >
            <input
              type="radio"
              name={`question-${question.questionId}`}
              value="true"
              checked={answer === 'true'}
              onChange={(e) => onAnswerChange(e.target.value)}
              style={{ marginRight: 12 }}
            />
            <span>Đúng</span>
          </label>
          <label
            className="row"
            style={{
              padding: 12,
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              cursor: 'pointer',
              backgroundColor: answer === 'false' ? 'var(--primary-color-light)' : 'white',
            }}
          >
            <input
              type="radio"
              name={`question-${question.questionId}`}
              value="false"
              checked={answer === 'false'}
              onChange={(e) => onAnswerChange(e.target.value)}
              style={{ marginRight: 12 }}
            />
            <span>Sai</span>
          </label>
        </div>
      )}

      {question.questionType === 'SHORT_ANSWER' && (
        <input
          className="input"
          type="text"
          value={answer || ''}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Nhập câu trả lời của bạn"
          style={{ width: '100%' }}
        />
      )}

      {(question.questionType === 'ESSAY' || question.questionType === 'CODING') && (
        <textarea
          className="input"
          value={answer || ''}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder={
            question.questionType === 'ESSAY'
              ? 'Nhập câu trả lời của bạn'
              : 'Nhập code của bạn'
          }
          rows={10}
          style={{ width: '100%', fontFamily: question.questionType === 'CODING' ? 'monospace' : 'inherit' }}
        />
      )}
    </div>
  );
}
