import { useEffect, useState } from 'react';
import { latexRenderService } from '../services/latexRenderService';

type UseLatexRenderResult = {
  imageUrl: string;
  isLoading: boolean;
  error: string;
};

export function useLatexRender(latex: string, enabled = true): UseLatexRenderResult {
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const normalizedLatex = latex.trim();
    if (!normalizedLatex || !enabled) {
      setImageUrl('');
      setError('');
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = globalThis.setTimeout(() => {
      setIsLoading(true);
      setError('');

      latexRenderService
        .renderLatex({ latex: normalizedLatex }, controller.signal)
        .then((payload) => {
          setImageUrl(payload.imageUrl || '');
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          setImageUrl('');
          setError(err instanceof Error ? err.message : 'Latex rendering failed.');
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsLoading(false);
          }
        });
    }, 300);

    return () => {
      globalThis.clearTimeout(timer);
      controller.abort();
    };
  }, [latex, enabled]);

  return { imageUrl, isLoading, error };
}
