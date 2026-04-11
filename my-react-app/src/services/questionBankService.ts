import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';
import { AuthService } from './api/auth.service';
import type {
  ApiResponse,
  PageResponse,
  QuestionBankRequest,
  QuestionBankResponse,
  QuestionBankTemplatesResponse,
  SearchQuestionBanksParams,
} from '../types/questionBank';

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

export const questionBankService = {
  createQuestionBank: (request: QuestionBankRequest) =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_BANKS}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    }).then(handleResponse<QuestionBankResponse>),

  updateQuestionBank: (id: string, request: QuestionBankRequest) =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_BANK_DETAIL(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    }).then(handleResponse<QuestionBankResponse>),

  deleteQuestionBank: (id: string) =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_BANK_DETAIL(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then(handleResponse<void>),

  getQuestionBankById: (id: string) =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_BANK_DETAIL(id)}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<QuestionBankResponse>),

  getMyQuestionBanks: (
    page = 0,
    size = 20,
    sortBy = 'createdAt',
    sortDirection: 'ASC' | 'DESC' = 'DESC'
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDirection,
    });

    return fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_BANKS_MY}?${params.toString()}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<PageResponse<QuestionBankResponse>>);
  },

  searchQuestionBanks: (params: SearchQuestionBanksParams) => {
    const queryParams = new URLSearchParams();

    if (params.isPublic !== undefined) {
      queryParams.append('isPublic', String(params.isPublic));
    }
    if (params.searchTerm) {
      queryParams.append('searchTerm', params.searchTerm);
    }
    if (params.chapterId) {
      queryParams.append('chapterId', params.chapterId);
    }
    if (params.subjectId) {
      queryParams.append('subjectId', params.subjectId);
    }
    if (params.gradeLevel) {
      queryParams.append('gradeLevel', params.gradeLevel);
    }
    if (params.mineOnly !== undefined) {
      queryParams.append('mineOnly', String(params.mineOnly));
    }
    queryParams.append('page', String(params.page ?? 0));
    queryParams.append('size', String(params.size ?? 20));
    queryParams.append('sortBy', params.sortBy ?? 'createdAt');
    queryParams.append('sortDirection', params.sortDirection ?? 'DESC');

    return fetch(
      `${API_BASE_URL}${API_ENDPOINTS.QUESTION_BANKS_SEARCH}?${queryParams.toString()}`,
      {
        headers: getAuthHeaders(),
      }
    ).then(handleResponse<PageResponse<QuestionBankResponse>>);
  },

  togglePublicStatus: (id: string) =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_BANK_TOGGLE_PUBLIC(id)}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    }).then(handleResponse<QuestionBankResponse>),

  canEditQuestionBank: (id: string) =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_BANK_CAN_EDIT(id)}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<boolean>),

  canDeleteQuestionBank: (id: string) =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_BANK_CAN_DELETE(id)}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<boolean>),

  getTemplatesByQuestionBank: (id: string) =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_BANK_TEMPLATES(id)}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse<QuestionBankTemplatesResponse>),

  mapTemplateToQuestionBank: (id: string, templateId: string) =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_BANK_TEMPLATE_MAP(id, templateId)}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse<QuestionBankTemplatesResponse[number]>),

  unmapTemplateFromQuestionBank: (id: string, templateId: string) =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_BANK_TEMPLATE_MAP(id, templateId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then(handleResponse<void>),
};
