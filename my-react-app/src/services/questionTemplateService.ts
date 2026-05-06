import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';
import {
  type AIEnhancedQuestionResponse,
  type ApiResponse,
  type BlueprintFromRealQuestionRequest,
  type BlueprintFromRealQuestionResponse,
  type BulkRejectQuestionsRequest,
  CognitiveLevel,
  type ExtractParametersRequest,
  type ExtractParametersResponse,
  type GenerateParametersRequest,
  type GenerateParametersResponse,
  type GenerateQuestionsRequest,
  type GeneratedQuestionsBatchResponse,
  type PageResponse,
  type QuestionTemplateRequest,
  type QuestionTemplateResponse,
  QuestionType,
  type ReviewQuestionResponse,
  type TemplateImportResponse,
  type TemplateTestResponse,
  type UpdateParametersRequest,
} from '../types/questionTemplate';
import { AuthService } from './api/auth.service';

type ErrorResponse = {
  code?: number;
  message?: string;
};

export class QuestionTemplateApiError extends Error {
  status: number;
  code?: number;

  constructor(message: string, status: number, code?: number) {
    super(message);
    this.name = 'QuestionTemplateApiError';
    this.status = status;
    this.code = code;
  }
}

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
    let errorCode: number | undefined;

    try {
      const payload = (await response.json()) as ErrorResponse;
      if (payload?.message) errorMessage = payload.message;
      if (typeof payload?.code === 'number') errorCode = payload.code;
    } catch {
      // Keep fallback message when server does not return JSON payload.
    }

    throw new QuestionTemplateApiError(errorMessage, response.status, errorCode);
  }

  return response.json() as Promise<T>;
};

export const questionTemplateService = {
  // Create Question Template
  createQuestionTemplate: async (
    request: QuestionTemplateRequest
  ): Promise<ApiResponse<QuestionTemplateResponse>> => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_TEMPLATES}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });
    return parseResponse<ApiResponse<QuestionTemplateResponse>>(
      response,
      'Không thể tạo question template'
    );
  },

  // Update Question Template
  updateQuestionTemplate: async (
    id: string,
    request: QuestionTemplateRequest
  ): Promise<ApiResponse<QuestionTemplateResponse>> => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_TEMPLATE_DETAIL(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });
    return parseResponse<ApiResponse<QuestionTemplateResponse>>(
      response,
      'Không thể cập nhật question template'
    );
  },

  // Delete Question Template
  deleteQuestionTemplate: async (id: string): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_TEMPLATE_DETAIL(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return parseResponse<ApiResponse<void>>(response, 'Không thể xóa question template');
  },

  // Get Question Template by ID
  getQuestionTemplateById: async (id: string): Promise<ApiResponse<QuestionTemplateResponse>> => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_TEMPLATE_DETAIL(id)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return parseResponse<ApiResponse<QuestionTemplateResponse>>(
      response,
      'Không thể lấy chi tiết question template'
    );
  },

  // Get My Question Templates
  getMyQuestionTemplates: async (
    page: number = 0,
    size: number = 20,
    sortBy: string = 'createdAt',
    sortDirection: string = 'DESC',
    search?: string,
    status?: string
  ): Promise<ApiResponse<PageResponse<QuestionTemplateResponse>>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDirection,
    });
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.QUESTION_TEMPLATES_MY}?${params.toString()}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );
    return parseResponse<ApiResponse<PageResponse<QuestionTemplateResponse>>>(
      response,
      'Không thể lấy danh sách question template của tôi'
    );
  },

  // Search Question Templates
  searchQuestionTemplates: async (params: {
    templateType?: QuestionType;
    cognitiveLevel?: CognitiveLevel;
    isPublic?: boolean;
    searchTerm?: string;
    tags?: string[];
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: string;
  }): Promise<ApiResponse<PageResponse<QuestionTemplateResponse>>> => {
    const queryParams = new URLSearchParams();

    if (params.templateType) queryParams.append('templateType', params.templateType);
    if (params.cognitiveLevel) queryParams.append('cognitiveLevel', params.cognitiveLevel);
    if (params.isPublic !== undefined) queryParams.append('isPublic', params.isPublic.toString());
    if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params.tags && params.tags.length > 0) {
      params.tags.forEach((tag) => queryParams.append('tags', tag));
    }
    queryParams.append('page', (params.page || 0).toString());
    queryParams.append('size', (params.size || 20).toString());
    queryParams.append('sortBy', params.sortBy || 'createdAt');
    queryParams.append('sortDirection', params.sortDirection || 'DESC');

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.QUESTION_TEMPLATES_SEARCH}?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );
    return parseResponse<ApiResponse<PageResponse<QuestionTemplateResponse>>>(
      response,
      'Không thể tìm kiếm question template'
    );
  },

  // Toggle Public Status
  togglePublicStatus: async (id: string): Promise<ApiResponse<QuestionTemplateResponse>> => {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.QUESTION_TEMPLATE_TOGGLE_PUBLIC(id)}`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
      }
    );
    return parseResponse<ApiResponse<QuestionTemplateResponse>>(
      response,
      'Không thể đổi trạng thái công khai của template'
    );
  },

  // Publish Template
  publishTemplate: async (id: string): Promise<ApiResponse<QuestionTemplateResponse>> => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_TEMPLATE_PUBLISH(id)}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return parseResponse<ApiResponse<QuestionTemplateResponse>>(
      response,
      'Không thể công khai template'
    );
  },

  // Unpublish Template
  unpublishTemplate: async (id: string): Promise<ApiResponse<QuestionTemplateResponse>> => {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.QUESTION_TEMPLATE_UNPUBLISH(id)}`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
      }
    );
    return parseResponse<ApiResponse<QuestionTemplateResponse>>(
      response,
      'Không thể hủy công khai template'
    );
  },

  // Archive Template
  archiveTemplate: async (id: string): Promise<ApiResponse<QuestionTemplateResponse>> => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_TEMPLATE_ARCHIVE(id)}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return parseResponse<ApiResponse<QuestionTemplateResponse>>(
      response,
      'Không thể lưu trữ template'
    );
  },

  // Test Existing Template
  testTemplate: async (
    id: string,
    sampleCount: number = 5,
    useAI: boolean = true
  ): Promise<ApiResponse<TemplateTestResponse>> => {
    const params = new URLSearchParams({
      sampleCount: sampleCount.toString(),
      useAI: useAI.toString(),
    });
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.QUESTION_TEMPLATE_TEST(id)}?${params.toString()}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );
    return parseResponse<ApiResponse<TemplateTestResponse>>(response, 'Không thể test template');
  },

  // Generate a batch of AI draft questions from template
  generateQuestions: async (
    id: string,
    request: GenerateQuestionsRequest
  ): Promise<ApiResponse<GeneratedQuestionsBatchResponse>> => {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.QUESTION_TEMPLATE_GENERATE_QUESTIONS(id)}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request),
      }
    );
    return parseResponse<ApiResponse<GeneratedQuestionsBatchResponse>>(
      response,
      'Không thể tạo câu hỏi từ template'
    );
  },

  // Generate AI Enhanced Question
  generateAIEnhancedQuestion: async (
    id: string
  ): Promise<ApiResponse<AIEnhancedQuestionResponse>> => {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.QUESTION_TEMPLATE_GENERATE_AI_ENHANCED(id)}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );
    return parseResponse<ApiResponse<AIEnhancedQuestionResponse>>(
      response,
      'Không thể tạo AI enhanced question'
    );
  },

  // Import Template from File
  importTemplateFromFile: async (
    file: File,
    subjectHint?: string,
    contextHint?: string,
    questionBankId?: string
  ): Promise<ApiResponse<TemplateImportResponse>> => {
    const formData = new FormData();
    formData.append('file', file);
    if (subjectHint) formData.append('subjectHint', subjectHint);
    if (contextHint) formData.append('contextHint', contextHint);
    if (questionBankId) formData.append('questionBankId', questionBankId);

    const headers: Record<string, string> = { ...getAuthHeaders() };
    delete headers['Content-Type']; // Let browser set multipart boundary

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.QUESTION_TEMPLATE_IMPORT_FROM_FILE}`,
      {
        method: 'POST',
        headers,
        body: formData,
      }
    );
    return parseResponse<ApiResponse<TemplateImportResponse>>(
      response,
      'Không thể import template từ file'
    );
  },

  // Feature 1 — Extract Parameters (AI suggest {{a}}, {{b}} from raw text)
  extractParameters: async (
    templateId: string,
    request: ExtractParametersRequest
  ): Promise<ApiResponse<ExtractParametersResponse>> => {
    const response = await fetch(
      `${API_BASE_URL}/question-templates/${templateId}/extract-parameters`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request),
      }
    );
    return parseResponse<ApiResponse<ExtractParametersResponse>>(
      response,
      'Không thể trích xuất tham số từ AI'
    );
  },

  // Feature 2 — Generate Parameters (AI creates valid param values)
  generateParameters: async (
    templateId: string,
    request: GenerateParametersRequest
  ): Promise<ApiResponse<GenerateParametersResponse>> => {
    const response = await fetch(
      `${API_BASE_URL}/question-templates/${templateId}/generate-parameters`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request),
      }
    );
    return parseResponse<ApiResponse<GenerateParametersResponse>>(
      response,
      'Không thể tạo tham số bằng AI'
    );
  },

  // Feature 2b — Update Parameters (refine based on teacher command)
  updateParameters: async (
    templateId: string,
    request: UpdateParametersRequest
  ): Promise<ApiResponse<GenerateParametersResponse>> => {
    const response = await fetch(
      `${API_BASE_URL}/question-templates/${templateId}/update-parameters`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request),
      }
    );
    return parseResponse<ApiResponse<GenerateParametersResponse>>(
      response,
      'Không thể cập nhật tham số bằng AI'
    );
  },

  // Method 1 — single AI call that converts a real-valued question into a Blueprint draft
  blueprintFromRealQuestion: async (
    request: BlueprintFromRealQuestionRequest
  ): Promise<ApiResponse<BlueprintFromRealQuestionResponse>> => {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.QUESTION_TEMPLATE_BLUEPRINT_FROM_REAL}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request),
      }
    );
    return parseResponse<ApiResponse<BlueprintFromRealQuestionResponse>>(
      response,
      'AI chưa thể chuyển câu hỏi thành Blueprint. Vui lòng thử lại.'
    );
  },

  // Review queue — list UNDER_REVIEW questions for the current teacher
  listReviewQueue: async (
    templateId: string | undefined,
    page = 0,
    size = 20
  ): Promise<ApiResponse<PageResponse<ReviewQuestionResponse>>> => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    if (templateId) params.append('templateId', templateId);
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.QUESTIONS_REVIEW_QUEUE}?${params.toString()}`,
      { method: 'GET', headers: getAuthHeaders() }
    );
    return parseResponse<ApiResponse<PageResponse<ReviewQuestionResponse>>>(
      response,
      'Không thể tải danh sách câu hỏi đang chờ duyệt.'
    );
  },

  approveQuestion: async (id: string): Promise<ApiResponse<ReviewQuestionResponse>> => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_APPROVE(id)}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return parseResponse<ApiResponse<ReviewQuestionResponse>>(response, 'Không thể duyệt câu hỏi.');
  },

  bulkApproveQuestions: async (questionIds: string[]): Promise<ApiResponse<number>> => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_BULK_APPROVE}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ questionIds }),
    });
    return parseResponse<ApiResponse<number>>(response, 'Không thể duyệt loạt câu hỏi.');
  },

  bulkRejectQuestions: async (
    request: BulkRejectQuestionsRequest
  ): Promise<ApiResponse<number>> => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_BULK_REJECT}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });
    return parseResponse<ApiResponse<number>>(response, 'Không thể từ chối loạt câu hỏi.');
  },
};
