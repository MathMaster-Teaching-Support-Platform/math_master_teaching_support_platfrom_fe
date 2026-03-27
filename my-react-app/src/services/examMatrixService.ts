import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';
import { AuthService } from './api/auth.service';
import type {
    ExamMatrixRequest,
    ExamMatrixResponse,
    ExamMatrixApiResponse,
    AddTemplateMappingRequest,
    AddBankMappingRequest,
    TemplateMappingResponse,
    BankMappingResponse,
    MatrixValidationReport,
    MatchingTemplatesResponse,
    ListMatchingTemplatesParams,
    GeneratePreviewRequest,
    PreviewCandidatesResponse,
    FinalizePreviewRequest,
    FinalizePreviewResponse,
} from '../types/examMatrix';

const getAuthHeaders = (): Record<string, string> => {
    const token = AuthService.getToken();
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
    createExamMatrix: (request: ExamMatrixRequest) =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRICES}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(request),
        }).then(handleResponse<ExamMatrixResponse>),

    updateExamMatrix: (matrixId: string, request: ExamMatrixRequest) =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRIX_DETAIL(matrixId)}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(request),
        }).then(handleResponse<ExamMatrixResponse>),

    getExamMatrixById: (matrixId: string) =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRIX_DETAIL(matrixId)}`, {
            headers: getAuthHeaders(),
        }).then(handleResponse<ExamMatrixResponse>),

    getExamMatrixByAssessmentId: (assessmentId: string) =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRIX_BY_ASSESSMENT(assessmentId)}`, {
            headers: getAuthHeaders(),
        }).then(handleResponse<ExamMatrixResponse>),

    getMyExamMatrices: () =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRICES_MY}`, {
            headers: getAuthHeaders(),
        }).then(handleResponse<ExamMatrixResponse[]>),

    deleteExamMatrix: (matrixId: string) =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRIX_DETAIL(matrixId)}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        }).then(handleResponse<void>),

    addTemplateMapping: (matrixId: string, request: AddTemplateMappingRequest) =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRIX_MAPPINGS(matrixId)}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(request),
        }).then(handleResponse<TemplateMappingResponse>),

    removeTemplateMapping: (matrixId: string, mappingId: string) =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRIX_MAPPING_DETAIL(matrixId, mappingId)}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        }).then(handleResponse<void>),

    getTemplateMappings: (matrixId: string) =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRIX_MAPPINGS(matrixId)}`, {
            headers: getAuthHeaders(),
        }).then(handleResponse<TemplateMappingResponse[]>),

    addBankMapping: (matrixId: string, request: AddBankMappingRequest) =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRIX_BANK_MAPPINGS(matrixId)}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(request),
        }).then(handleResponse<BankMappingResponse>),

    removeBankMapping: (matrixId: string, mappingId: string) =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRIX_BANK_MAPPING_DETAIL(matrixId, mappingId)}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        }).then(handleResponse<void>),

    getBankMappings: (matrixId: string) =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRIX_BANK_MAPPINGS(matrixId)}`, {
            headers: getAuthHeaders(),
        }).then(handleResponse<BankMappingResponse[]>),

    validateMatrix: (matrixId: string) =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRIX_VALIDATE(matrixId)}`, {
            headers: getAuthHeaders(),
        }).then(handleResponse<MatrixValidationReport>),

    approveMatrix: (matrixId: string) =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRIX_APPROVE(matrixId)}`, {
            method: 'POST',
            headers: getAuthHeaders(),
        }).then(handleResponse<ExamMatrixResponse>),

    lockMatrix: (matrixId: string) =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRIX_LOCK(matrixId)}`, {
            method: 'POST',
            headers: getAuthHeaders(),
        }).then(handleResponse<void>),

    resetMatrix: (matrixId: string) =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRIX_RESET(matrixId)}`, {
            method: 'POST',
            headers: getAuthHeaders(),
        }).then(handleResponse<ExamMatrixResponse>),

    listMatchingTemplates: (matrixId: string, params: ListMatchingTemplatesParams = {}) => {
        const query = new URLSearchParams();
        if (params.q) query.set('q', params.q);
        if (params.page !== undefined) query.set('page', String(params.page));
        if (params.size !== undefined) query.set('size', String(params.size));
        if (params.onlyMine !== undefined) query.set('onlyMine', String(params.onlyMine));
        if (params.publicOnly !== undefined) query.set('publicOnly', String(params.publicOnly));
        return fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRIX_MATCHING_TEMPLATES(matrixId)}?${query}`, {
            headers: getAuthHeaders(),
        }).then(handleResponse<MatchingTemplatesResponse>);
    },

    generatePreview: (matrixId: string, mappingId: string, request: GeneratePreviewRequest) =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRIX_GENERATE_PREVIEW(matrixId, mappingId)}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(request),
        }).then(handleResponse<PreviewCandidatesResponse>),

    finalizePreview: (matrixId: string, mappingId: string, request: FinalizePreviewRequest) =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRIX_FINALIZE_PREVIEW(matrixId, mappingId)}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(request),
        }).then(handleResponse<FinalizePreviewResponse>),
};
