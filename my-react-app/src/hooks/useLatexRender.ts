import { useLayoutEffect, useState } from 'react';
import { latexRenderService } from '../services/latexRenderService';
import { translateLatexRenderError } from '../utils/latexRenderErrors';

type UseLatexRenderResult = {
  imageUrl: string;
  isLoading: boolean;
  error: string;
};

type FetchPayload = {
  latex: string;
  url: string;
  error: string;
  loading: boolean;
};

export function useLatexRender(latex: string, enabled = true): UseLatexRenderResult {
  const normalizedLatex = latex.trim();
  const [fetchState, setFetchState] = useState<FetchPayload | null>(null);

  useLayoutEffect(() => {
    if (!normalizedLatex || !enabled) {
      setFetchState(null);
      return;
    }

    setFetchState({
      latex: normalizedLatex,
      url: '',
      error: '',
      loading: true,
    });

    const controller = new AbortController();
    const timer = globalThis.setTimeout(() => {
      latexRenderService
        .renderLatex({ latex: normalizedLatex }, controller.signal)
        .then((payload) => {
          setFetchState((prev) => {
            if (!prev || prev.latex !== normalizedLatex) return prev;
            return {
              latex: normalizedLatex,
              url: payload.imageUrl ?? '',
              error: '',
              loading: false,
            };
          });
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          const raw = err instanceof Error ? err.message : String(err);
          const message = translateLatexRenderError(raw);
          setFetchState((prev) => {
            if (!prev || prev.latex !== normalizedLatex) return prev;
            return {
              latex: normalizedLatex,
              url: '',
              error: message,
              loading: false,
            };
          });
        });
    }, 300);

    return () => {
      globalThis.clearTimeout(timer);
      controller.abort();
    };
  }, [latex, enabled]);

  const active =
    fetchState && fetchState.latex === normalizedLatex ? fetchState : null;

  const imageUrl = active?.url ?? '';
  const error = active?.error ?? '';

  const isLoading =
    !!normalizedLatex &&
    enabled &&
    (fetchState === null ||
      fetchState.latex !== normalizedLatex ||
      fetchState.loading);

  return { imageUrl, isLoading, error };
}
