import { useEffect } from 'react';
import type { AttemptQuestionResponse } from '../../types/studentAssessment.types';
import MathText from '../common/MathText';
import LatexRenderer from '../common/LatexRenderer';
import QuestionDiagram from '../common/QuestionDiagram';
import { extractDiagram, hasRenderableDiagram } from '../../utils/diagramExtraction';
import { extractOptionText } from '../../utils/optionText';

interface QuestionDisplayProps {
  question: AttemptQuestionResponse;
  answer: any;
  onAnswerChange: (value: any) => void;
}

function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number') return String(value);
  }
  return undefined;
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

export default function QuestionDisplay({ question, answer, onAnswerChange }: Readonly<QuestionDisplayProps>) {
  const diagram = extractDiagram(question);
  const optionalLatex = normalizeLatexInput(pickString(question.latexContent, question.answerFormula));
  const hasDiagramPayload = !!question.diagramData || !!question.diagramUrl || !!question.diagramLatex;
  const shouldRenderDiagram =
    question.questionType === 'MULTIPLE_CHOICE' || hasDiagramPayload || hasRenderableDiagram(question);
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
      <QuestionDiagram source={question} />
      {!diagram.imageUrl && !diagram.latex && diagram.latexValues.length === 0 && (
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
              const optionText = extractOptionText(value);
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
