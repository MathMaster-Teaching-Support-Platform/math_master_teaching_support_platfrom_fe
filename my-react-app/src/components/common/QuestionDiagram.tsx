import LatexRenderer from './LatexRenderer';
import { extractDiagram, type DiagramSource } from '../../utils/diagramExtraction';

interface QuestionDiagramProps {
  source: DiagramSource;
  /** Optional caption override (else uses extracted caption from diagramData). */
  caption?: string;
}

/**
 * Renders the diagram for a question. Resolution order:
 *   1. diagramUrl (cached image from BE) -> <img>, no network call
 *   2. primary LaTeX (string or { latex } object) -> <LatexRenderer> via /api/latex/render
 *   3. multiple sniffed latex candidates -> stack of <LatexRenderer>
 * Returns null when there is nothing renderable so callers can mount it
 * unconditionally without leaving an empty wrapper.
 */
export default function QuestionDiagram({ source, caption }: Readonly<QuestionDiagramProps>) {
  const diagram = extractDiagram(source);
  const hasAny = !!diagram.imageUrl || !!diagram.latex || diagram.latexValues.length > 0;
  if (!hasAny) return null;

  const finalCaption = caption ?? diagram.caption;

  return (
    <div style={{ marginBottom: 16 }}>
      {diagram.imageUrl && (
        <img
          src={diagram.imageUrl}
          alt={finalCaption || 'Question diagram'}
          loading="lazy"
          style={{
            maxWidth: '100%',
            borderRadius: 8,
            border: '1px solid var(--border-color, #e2e8f0)',
            background: '#fff',
            display: 'block',
          }}
        />
      )}
      {!diagram.imageUrl && diagram.latex && (
        <LatexRenderer latex={diagram.latex} />
      )}
      {!diagram.imageUrl && !diagram.latex && diagram.latexValues.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {diagram.latexValues.map((latexValue, index) => (
            <div key={`diagram-latex-${index}`} className="preview-box">
              <LatexRenderer latex={latexValue} />
            </div>
          ))}
        </div>
      )}
      {finalCaption && (
        <p className="muted" style={{ marginTop: 8 }}>
          {finalCaption}
        </p>
      )}
    </div>
  );
}
