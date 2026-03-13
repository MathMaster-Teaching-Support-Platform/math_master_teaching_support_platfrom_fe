import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';
import { AuthService } from './api/auth.service';
import type { QuestionResponse } from '../types/question';
import type { ApiResponse, PageResponse } from '../types/questionBank';

const getAuthHeaders = (): Record<string, string> => {
  const token = AuthService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const msg = (errorBody as { message?: string }).message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return res.json();
}

export const questionService = {
  getQuestionsByBank: (bankId: string, page = 0, size = 20) => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });

    return fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTIONS_BY_BANK(bankId)}?${params.toString()}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<PageResponse<QuestionResponse>>);
  },
};
