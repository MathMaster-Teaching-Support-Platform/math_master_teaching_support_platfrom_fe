import { useLatexRender } from '../../hooks/useLatexRender';

type Props = {
  latex: string;
};

export default function LatexRenderer({ latex }: Readonly<Props>) {
  const normalizedLatex = latex.trim();
  const { imageUrl, isLoading, error } = useLatexRender(normalizedLatex);

  if (!normalizedLatex) return null;

  if (isLoading) {
    return (
      <div
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          padding: '0.75rem',
          background: '#f8fafc',
        }}
      >
        <div className="muted">Dang render LaTeX...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ border: '1px solid #fecaca', borderRadius: 8, padding: '0.75rem', background: '#fef2f2' }}>
        <p style={{ marginTop: 0, color: '#991b1b' }}>Render LaTeX that bai.</p>
        <pre
          style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            color: '#7f1d1d',
            background: '#fff',
            border: '1px solid #fecaca',
            borderRadius: 6,
            padding: '0.5rem',
          }}
        >
          {error}
        </pre>
      </div>
    );
  }

  if (!imageUrl) return null;

  return (
    <img
      src={imageUrl}
      alt="LaTeX formula"
      loading="lazy"
      style={{ maxWidth: '100%', display: 'block', background: '#fff' }}
    />
  );
}
