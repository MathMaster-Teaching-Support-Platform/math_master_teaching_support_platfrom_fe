import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';
import type { LatexRenderRequest, LatexRenderResponse } from '../types/latexRender';
import { translateLatexRenderError } from '../utils/latexRenderErrors';
import { AuthService } from './api/auth.service';

const getAuthHeaders = () => {
  const token = AuthService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const latexRenderService = {
  renderLatex: async (
    request: LatexRenderRequest,
    signal?: AbortSignal
  ): Promise<LatexRenderResponse> => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LATEX_RENDER}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
      signal,
    });

    let payload: LatexRenderResponse | null = null;
    try {
      payload = (await response.json()) as LatexRenderResponse;
    } catch {
      // Keep payload null and fallback message below.
    }

    if (!response.ok) {
      const raw = payload?.error || `Latex rendering failed (${response.status}).`;
      throw new Error(translateLatexRenderError(raw));
    }

    if (!payload?.success || !payload.imageUrl) {
      throw new Error(translateLatexRenderError(payload?.error || 'Latex rendering failed.'));
    }

    return payload;
  },
};
