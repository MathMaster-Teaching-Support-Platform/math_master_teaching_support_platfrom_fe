import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';
import { AuthService } from './api/auth.service';
import type {
  BulkApproveRequest,
  QuestionResponse,
  UpdateQuestionRequest,
} from '../types/question';
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

  getQuestionsByTemplate: (templateId: string) =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTIONS_BY_TEMPLATE(templateId)}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<QuestionResponse[]>),

  approveQuestion: (questionId: string) =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTIONS_APPROVE(questionId)}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse<QuestionResponse>),

  bulkApproveQuestions: (request: BulkApproveRequest) =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTIONS_BULK_APPROVE}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    }).then(handleResponse<QuestionResponse[]>),

  updateQuestion: (questionId: string, request: UpdateQuestionRequest) =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTIONS_DETAIL(questionId)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    }).then(handleResponse<QuestionResponse>),

  deleteQuestion: (questionId: string) =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTIONS_DETAIL(questionId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then(handleResponse<void>),
};
