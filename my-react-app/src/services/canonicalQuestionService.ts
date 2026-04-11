import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';
import { AuthService } from './api/auth.service';
import type {
  ApiResponse,
  CanonicalQuestionPagingParams,
  CanonicalQuestionRequest,
  CanonicalQuestionResponse,
  PageResponse,
} from '../types/canonicalQuestion';
import type { QuestionResponse } from '../types/question';
import type {
  GenerateQuestionsFromCanonicalRequest,
  GeneratedQuestionsBatchResponse,
} from '../types/questionTemplate';

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

  updateCanonicalQuestion: async (
    id: string,
    request: CanonicalQuestionRequest
  ): Promise<ApiResponse<CanonicalQuestionResponse>> => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CANONICAL_QUESTION_DETAIL(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });
    return parseResponse<ApiResponse<CanonicalQuestionResponse>>(
      response,
      'Không thể cập nhật canonical question'
    );
  },

  deleteCanonicalQuestion: async (id: string): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CANONICAL_QUESTION_DETAIL(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return parseResponse<ApiResponse<void>>(
      response,
      'Không thể xóa canonical question'
    );
  },

  getQuestionsByCanonicalQuestion: async (
    id: string,
    params: CanonicalQuestionPagingParams = {}
  ): Promise<ApiResponse<PageResponse<QuestionResponse>>> => {
    const query = new URLSearchParams({
      page: String(params.page ?? 0),
      size: String(params.size ?? 20),
      sortBy: params.sortBy ?? 'createdAt',
      sortDirection: params.sortDirection ?? 'DESC',
    });

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.CANONICAL_QUESTION_QUESTIONS(id)}?${query.toString()}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );
    return parseResponse<ApiResponse<PageResponse<QuestionResponse>>>(
      response,
      'Không thể lấy danh sách câu hỏi theo canonical question'
    );
  },

  generateQuestionsFromCanonical: async (
    canonicalId: string,
    request: GenerateQuestionsFromCanonicalRequest
  ): Promise<ApiResponse<GeneratedQuestionsBatchResponse>> => {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.CANONICAL_QUESTION_GENERATE_QUESTIONS(canonicalId)}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request),
      }
    );
    return parseResponse<ApiResponse<GeneratedQuestionsBatchResponse>>(
      response,
      'Không thể sinh câu hỏi từ canonical flow'
    );
  },
};