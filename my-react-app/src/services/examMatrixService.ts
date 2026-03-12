import type {
    ExamMatrixRequest,
    ExamMatrixResponse,
    ExamMatrixApiResponse,
    AddTemplateMappingRequest,
    TemplateMappingResponse,
    MatrixValidationReport,
    MatchingTemplatesResponse,
    ListMatchingTemplatesParams,
    GeneratePreviewRequest,
    PreviewCandidatesResponse,
    FinalizePreviewRequest,
    FinalizePreviewResponse,
} from '../types/examMatrix';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

async function handleResponse<T>(res: Response): Promise<ExamMatrixApiResponse<T>> {
    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        const msg = (errorBody as { message?: string }).message || `HTTP ${res.status}`;
        throw new Error(msg);
    }
    return res.json();
}

export const examMatrixService = {
    // ── Matrix CRUD ──────────────────────────────────────────────────────────

    createExamMatrix: (request: ExamMatrixRequest) =>
        fetch(`${API_BASE_URL}/exam-matrices`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(request),
        }).then(handleResponse<ExamMatrixResponse>),

    updateExamMatrix: (matrixId: string, request: ExamMatrixRequest) =>
        fetch(`${API_BASE_URL}/exam-matrices/${matrixId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(request),
        }).then(handleResponse<ExamMatrixResponse>),

    getExamMatrixById: (matrixId: string) =>
        fetch(`${API_BASE_URL}/exam-matrices/${matrixId}`, {
            headers: getAuthHeaders(),
        }).then(handleResponse<ExamMatrixResponse>),

    getExamMatrixByAssessmentId: (assessmentId: string) =>
        fetch(`${API_BASE_URL}/exam-matrices/assessment/${assessmentId}`, {
            headers: getAuthHeaders(),
        }).then(handleResponse<ExamMatrixResponse>),

    getMyExamMatrices: () =>
        fetch(`${API_BASE_URL}/exam-matrices/my`, {
            headers: getAuthHeaders(),
        }).then(handleResponse<ExamMatrixResponse[]>),

    deleteExamMatrix: (matrixId: string) =>
        fetch(`${API_BASE_URL}/exam-matrices/${matrixId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        }).then(handleResponse<void>),

    // ── Template Mappings ────────────────────────────────────────────────────

    addTemplateMapping: (matrixId: string, request: AddTemplateMappingRequest) =>
        fetch(`${API_BASE_URL}/exam-matrices/${matrixId}/template-mappings`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(request),
        }).then(handleResponse<TemplateMappingResponse>),

    removeTemplateMapping: (matrixId: string, mappingId: string) =>
        fetch(`${API_BASE_URL}/exam-matrices/${matrixId}/template-mappings/${mappingId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        }).then(handleResponse<void>),

    getTemplateMappings: (matrixId: string) =>
        fetch(`${API_BASE_URL}/exam-matrices/${matrixId}/template-mappings`, {
            headers: getAuthHeaders(),
        }).then(handleResponse<TemplateMappingResponse[]>),

    // ── Lifecycle ───────────────────────────────────────────────────────────

    validateMatrix: (matrixId: string) =>
        fetch(`${API_BASE_URL}/exam-matrices/${matrixId}/validate`, {
            headers: getAuthHeaders(),
        }).then(handleResponse<MatrixValidationReport>),

    approveMatrix: (matrixId: string) =>
        fetch(`${API_BASE_URL}/exam-matrices/${matrixId}/approve`, {
            method: 'POST',
            headers: getAuthHeaders(),
        }).then(handleResponse<ExamMatrixResponse>),

    lockMatrix: (matrixId: string) =>
        fetch(`${API_BASE_URL}/exam-matrices/${matrixId}/lock`, {
            method: 'POST',
            headers: getAuthHeaders(),
        }).then(handleResponse<void>),

    resetMatrix: (matrixId: string) =>
        fetch(`${API_BASE_URL}/exam-matrices/${matrixId}/reset`, {
            method: 'POST',
            headers: getAuthHeaders(),
        }).then(handleResponse<ExamMatrixResponse>),

    // ── Question Generation ──────────────────────────────────────────────────

    listMatchingTemplates: (matrixId: string, params: ListMatchingTemplatesParams = {}) => {
        const query = new URLSearchParams();
        if (params.q) query.set('q', params.q);
        if (params.page !== undefined) query.set('page', String(params.page));
        if (params.size !== undefined) query.set('size', String(params.size));
        if (params.onlyMine !== undefined) query.set('onlyMine', String(params.onlyMine));
        if (params.publicOnly !== undefined) query.set('publicOnly', String(params.publicOnly));
        return fetch(`${API_BASE_URL}/exam-matrices/${matrixId}/matching-templates?${query}`, {
            headers: getAuthHeaders(),
        }).then(handleResponse<MatchingTemplatesResponse>);
    },

    generatePreview: (matrixId: string, mappingId: string, request: GeneratePreviewRequest) =>
        fetch(
            `${API_BASE_URL}/exam-matrices/${matrixId}/template-mappings/${mappingId}/generate-preview`,
            {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(request),
            }
        ).then(handleResponse<PreviewCandidatesResponse>),

    finalizePreview: (matrixId: string, mappingId: string, request: FinalizePreviewRequest) =>
        fetch(
            `${API_BASE_URL}/exam-matrices/${matrixId}/template-mappings/${mappingId}/finalize`,
            {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(request),
            }
        ).then(handleResponse<FinalizePreviewResponse>),
};
