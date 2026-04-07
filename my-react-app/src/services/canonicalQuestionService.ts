import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';
import { AuthService } from './api/auth.service';
import type {
  ApiResponse,
  CanonicalQuestionRequest,
  CanonicalQuestionResponse,
  PageResponse,
} from '../types/canonicalQuestion';

type ErrorResponse = {
  code?: number;
  message?: string;
};

const getAuthHeaders = () => {
  const token = AuthService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const parseResponse = async <T>(response: Response, fallbackMessage: string): Promise<T> => {
  if (!response.ok) {
    let errorMessage = fallbackMessage;

    try {
      const payload = (await response.json()) as ErrorResponse;
      if (payload?.message) errorMessage = payload.message;
    } catch {
      // keep fallback
    }

    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
};

export const canonicalQuestionService = {
  createCanonicalQuestion: async (
    request: CanonicalQuestionRequest
  ): Promise<ApiResponse<CanonicalQuestionResponse>> => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CANONICAL_QUESTIONS}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });
    return parseResponse<ApiResponse<CanonicalQuestionResponse>>(
      response,
      'Không thể tạo canonical question'
    );
  },

  getMyCanonicalQuestions: async (
    page: number = 0,
    size: number = 20,
    sortBy: string = 'createdAt',
    sortDirection: string = 'DESC'
  ): Promise<ApiResponse<PageResponse<CanonicalQuestionResponse>>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDirection,
    });
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.CANONICAL_QUESTIONS_MY}?${params.toString()}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );
    return parseResponse<ApiResponse<PageResponse<CanonicalQuestionResponse>>>(
      response,
      'Không thể lấy danh sách canonical question'
    );
  },

  getCanonicalQuestionById: async (id: string): Promise<ApiResponse<CanonicalQuestionResponse>> => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CANONICAL_QUESTION_DETAIL(id)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return parseResponse<ApiResponse<CanonicalQuestionResponse>>(
      response,
      'Không thể lấy canonical question'
    );
  },
};