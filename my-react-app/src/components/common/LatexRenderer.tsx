import { useEffect, useRef, useState } from 'react';
import { useLatexRender } from '../../hooks/useLatexRender';

type Props = {
  latex: string;
};

export default function LatexRenderer({ latex }: Readonly<Props>) {
  const normalizedLatex = latex.trim();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !normalizedLatex) return;

    // Already visible – skip observer setup
    if (inView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedLatex]);

  const { imageUrl, isLoading, error } = useLatexRender(normalizedLatex, inView);

  useEffect(() => {
    setImageLoadError(false);
  }, [imageUrl]);

  if (!normalizedLatex) return null;

  if (!inView) {
    return (
      <div
        ref={containerRef}
        style={{ minHeight: 32, border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc' }}
      />
    );
  }

  if (isLoading) {
    return (
      <div
        ref={containerRef}
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          padding: '0.75rem',
          background: '#f8fafc',
        }}
      >
        <div className="muted">Đang render LaTeX...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div ref={containerRef} style={{ border: '1px solid #fecaca', borderRadius: 8, padding: '0.75rem', background: '#fef2f2' }}>
        <p style={{ marginTop: 0, color: '#991b1b' }}>Không hiển thị được công thức.</p>
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

  if (!imageUrl) return <div ref={containerRef} />;

  if (imageLoadError) {
    return (
      <div
        ref={containerRef}
        style={{
          border: '1px solid #fecaca',
          borderRadius: 8,
          padding: '0.75rem',
          background: '#fef2f2',
        }}
      >
        <p style={{ marginTop: 0, color: '#991b1b', marginBottom: 0 }}>
          Không tải được ảnh công thức (mạng hoặc máy chủ ảnh). Vui lòng thử lại.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <img
        src={imageUrl}
        alt="Công thức LaTeX"
        loading="lazy"
        onError={() => setImageLoadError(true)}
        style={{ maxWidth: '100%', display: 'block', background: '#fff' }}
      />
    </div>
  );
}
