import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';
import { AuthService } from './api/auth.service';
import {
    type QuestionTemplateRequest,
    type QuestionTemplateResponse,
    type TemplateTestResponse,
    type TemplateImportResponse,
    type AIEnhancedQuestionResponse,
    type GenerateQuestionsRequest,
    type GeneratedQuestionsBatchResponse,
    type PageResponse,
    type ApiResponse,
    CognitiveLevel,
    QuestionType
} from '../types/questionTemplate';

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
    createQuestionTemplate: async (request: QuestionTemplateRequest): Promise<ApiResponse<QuestionTemplateResponse>> => {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_TEMPLATES}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(request),
        });
        return parseResponse<ApiResponse<QuestionTemplateResponse>>(response, 'Không thể tạo question template');
    },

    // Update Question Template
    updateQuestionTemplate: async (id: string, request: QuestionTemplateRequest): Promise<ApiResponse<QuestionTemplateResponse>> => {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_TEMPLATE_DETAIL(id)}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(request),
        });
        return parseResponse<ApiResponse<QuestionTemplateResponse>>(response, 'Không thể cập nhật question template');
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
        return parseResponse<ApiResponse<QuestionTemplateResponse>>(response, 'Không thể lấy chi tiết question template');
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
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_TEMPLATES_MY}?${params.toString()}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        return parseResponse<ApiResponse<PageResponse<QuestionTemplateResponse>>>(response, 'Không thể lấy danh sách question template của tôi');
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
            params.tags.forEach(tag => queryParams.append('tags', tag));
        }
        queryParams.append('page', (params.page || 0).toString());
        queryParams.append('size', (params.size || 20).toString());
        queryParams.append('sortBy', params.sortBy || 'createdAt');
        queryParams.append('sortDirection', params.sortDirection || 'DESC');

        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_TEMPLATES_SEARCH}?${queryParams.toString()}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        return parseResponse<ApiResponse<PageResponse<QuestionTemplateResponse>>>(response, 'Không thể tìm kiếm question template');
    },

    // Toggle Public Status
    togglePublicStatus: async (id: string): Promise<ApiResponse<QuestionTemplateResponse>> => {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_TEMPLATE_TOGGLE_PUBLIC(id)}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
        });
        return parseResponse<ApiResponse<QuestionTemplateResponse>>(response, 'Không thể đổi trạng thái công khai của template');
    },

    // Publish Template
    publishTemplate: async (id: string): Promise<ApiResponse<QuestionTemplateResponse>> => {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_TEMPLATE_PUBLISH(id)}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
        });
        return parseResponse<ApiResponse<QuestionTemplateResponse>>(response, 'Không thể xuất bản template');
    },

    // Archive Template
    archiveTemplate: async (id: string): Promise<ApiResponse<QuestionTemplateResponse>> => {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_TEMPLATE_ARCHIVE(id)}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
        });
        return parseResponse<ApiResponse<QuestionTemplateResponse>>(response, 'Không thể lưu trữ template');
    },

    // Test Existing Template
    testTemplate: async (id: string, sampleCount: number = 5, useAI: boolean = true): Promise<ApiResponse<TemplateTestResponse>> => {
        const params = new URLSearchParams({
            sampleCount: sampleCount.toString(),
            useAI: useAI.toString(),
        });
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_TEMPLATE_TEST(id)}?${params.toString()}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        return parseResponse<ApiResponse<TemplateTestResponse>>(response, 'Không thể test template');
    },

    // Generate a batch of AI draft questions from template
    generateQuestions: async (
        id: string,
        request: GenerateQuestionsRequest
    ): Promise<ApiResponse<GeneratedQuestionsBatchResponse>> => {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_TEMPLATE_GENERATE_QUESTIONS(id)}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(request),
        });
        return parseResponse<ApiResponse<GeneratedQuestionsBatchResponse>>(response, 'Không thể tạo câu hỏi từ template');
    },

    // Generate AI Enhanced Question
    generateAIEnhancedQuestion: async (id: string): Promise<ApiResponse<AIEnhancedQuestionResponse>> => {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_TEMPLATE_GENERATE_AI_ENHANCED(id)}`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        return parseResponse<ApiResponse<AIEnhancedQuestionResponse>>(response, 'Không thể tạo AI enhanced question');
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

        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.QUESTION_TEMPLATE_IMPORT_FROM_FILE}`, {
            method: 'POST',
            headers,
            body: formData,
        });
        return parseResponse<ApiResponse<TemplateImportResponse>>(response, 'Không thể import template từ file');
    },
};
