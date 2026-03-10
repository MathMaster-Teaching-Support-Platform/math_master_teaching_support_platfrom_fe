import {
    type QuestionTemplateRequest,
    type QuestionTemplateResponse,
    type TemplateTestResponse,
    type TemplateImportResponse,
    type AIEnhancedQuestionResponse,
    type PageResponse,
    type ApiResponse,
    CognitiveLevel,
    QuestionType
} from '../types/questionTemplate';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'; // Adjust base URL as needed

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken'); // Fixed: Match AuthService key
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export const questionTemplateService = {
    // Create Question Template
    createQuestionTemplate: async (request: QuestionTemplateRequest): Promise<ApiResponse<QuestionTemplateResponse>> => {
        const response = await fetch(`${API_BASE_URL}/question-templates`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(request),
        });
        if (!response.ok) throw new Error('Failed to create question template');
        return response.json();
    },

    // Update Question Template
    updateQuestionTemplate: async (id: string, request: QuestionTemplateRequest): Promise<ApiResponse<QuestionTemplateResponse>> => {
        const response = await fetch(`${API_BASE_URL}/question-templates/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(request),
        });
        if (!response.ok) throw new Error('Failed to update question template');
        return response.json();
    },

    // Delete Question Template
    deleteQuestionTemplate: async (id: string): Promise<ApiResponse<void>> => {
        const response = await fetch(`${API_BASE_URL}/question-templates/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete question template');
        return response.json();
    },

    // Get Question Template by ID
    getQuestionTemplateById: async (id: string): Promise<ApiResponse<QuestionTemplateResponse>> => {
        const response = await fetch(`${API_BASE_URL}/question-templates/${id}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch question template');
        return response.json();
    },

    // Get My Question Templates
    getMyQuestionTemplates: async (
        page: number = 0,
        size: number = 20,
        sortBy: string = 'createdAt',
        sortDirection: string = 'DESC'
    ): Promise<ApiResponse<PageResponse<QuestionTemplateResponse>>> => {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
            sortBy,
            sortDirection,
        });
        const response = await fetch(`${API_BASE_URL}/question-templates/my?${params.toString()}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch my question templates');
        return response.json();
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

        const response = await fetch(`${API_BASE_URL}/question-templates/search?${queryParams.toString()}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to search question templates');
        return response.json();
    },

    // Toggle Public Status
    togglePublicStatus: async (id: string): Promise<ApiResponse<QuestionTemplateResponse>> => {
        const response = await fetch(`${API_BASE_URL}/question-templates/${id}/toggle-public`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to toggle public status');
        return response.json();
    },

    // Publish Template
    publishTemplate: async (id: string): Promise<ApiResponse<QuestionTemplateResponse>> => {
        const response = await fetch(`${API_BASE_URL}/question-templates/${id}/publish`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to publish template');
        return response.json();
    },

    // Archive Template
    archiveTemplate: async (id: string): Promise<ApiResponse<QuestionTemplateResponse>> => {
        const response = await fetch(`${API_BASE_URL}/question-templates/${id}/archive`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to archive template');
        return response.json();
    },

    // Test Existing Template
    testTemplate: async (id: string, sampleCount: number = 5, useAI: boolean = true): Promise<ApiResponse<TemplateTestResponse>> => {
        const params = new URLSearchParams({
            sampleCount: sampleCount.toString(),
            useAI: useAI.toString(),
        });
        const response = await fetch(`${API_BASE_URL}/question-templates/${id}/test?${params.toString()}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to test template');
        return response.json();
    },

    // Generate AI Enhanced Question
    generateAIEnhancedQuestion: async (id: string): Promise<ApiResponse<AIEnhancedQuestionResponse>> => {
        const response = await fetch(`${API_BASE_URL}/question-templates/${id}/generate-ai-enhanced`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to generate AI enhanced question');
        return response.json();
    },

    // Import Template from File
    importTemplateFromFile: async (file: File, subjectHint?: string, contextHint?: string): Promise<ApiResponse<TemplateImportResponse>> => {
        const formData = new FormData();
        formData.append('file', file);
        if (subjectHint) formData.append('subjectHint', subjectHint);
        if (contextHint) formData.append('contextHint', contextHint);

        const headers: Record<string, string> = { ...getAuthHeaders() };
        delete headers['Content-Type']; // Let browser set multipart boundary

        const response = await fetch(`${API_BASE_URL}/question-templates/import-from-file`, {
            method: 'POST',
            headers,
            body: formData,
        });
        if (!response.ok) throw new Error('Failed to import template from file');
        return response.json();
    },
};
