import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';
import { AuthService } from './api/auth.service';
import type { LatexRenderRequest, LatexRenderResponse } from '../types/latexRender';

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
      const message = payload?.error || `Latex rendering failed (${response.status}).`;
      throw new Error(message);
    }

    if (!payload?.success || !payload.imageUrl) {
      throw new Error(payload?.error || 'Latex rendering failed.');
    }

    return payload;
  },
};
