import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';
import { AuthService } from './api/auth.service';
import type {
    BatchUpsertMatrixRowCellsRequest,
    BuildExamMatrixRequest,
    ExamMatrixRequest,
    ExamMatrixResponse,
    ExamMatrixApiResponse,
    ExamMatrixRowRequest,
    ExamMatrixTableResponse,
    GenerateAssessmentByPercentageRequest,
    MatrixValidationReport,
    PercentageBasedGenerationResponse,
    UpdateMatrixRowCellsRequest,
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
    buildExamMatrix: (request: BuildExamMatrixRequest) =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRIX_BUILD}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(request),
        }).then(handleResponse<ExamMatrixResponse>),

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

    getExamMatrixTable: (matrixId: string) =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRIX_TABLE(matrixId)}`, {
            headers: getAuthHeaders(),
        }).then(handleResponse<ExamMatrixTableResponse>),

    getMyExamMatrices: () =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRICES_MY}`, {
            headers: getAuthHeaders(),
        }).then(handleResponse<ExamMatrixResponse[]>),

    deleteExamMatrix: (matrixId: string) =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRIX_DETAIL(matrixId)}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        }).then(handleResponse<void>),

    addExamMatrixRow: (matrixId: string, request: ExamMatrixRowRequest) =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRIX_ROWS(matrixId)}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(request),
        }).then(handleResponse<ExamMatrixTableResponse>),

    removeExamMatrixRow: (matrixId: string, rowId: string) =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRIX_ROW_DETAIL(matrixId, rowId)}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        }).then(handleResponse<ExamMatrixTableResponse>),

    upsertExamMatrixRowCells: (
        matrixId: string,
        rowId: string,
        request: UpdateMatrixRowCellsRequest,
    ) =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRIX_ROW_CELLS(matrixId, rowId)}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(request),
        }).then(handleResponse<ExamMatrixTableResponse>),

    batchUpsertExamMatrixRowCells: (matrixId: string, request: BatchUpsertMatrixRowCellsRequest) =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRIX_ROWS_CELLS_BATCH(matrixId)}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(request),
        }).then(handleResponse<ExamMatrixTableResponse>),

    validateMatrix: (matrixId: string) =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXAM_MATRIX_VALIDATE(matrixId)}`, {
            headers: getAuthHeaders(),
        }).then(handleResponse<MatrixValidationReport>),

    generateAssessmentByPercentage: (request: GenerateAssessmentByPercentageRequest) =>
        fetch(`${API_BASE_URL}${API_ENDPOINTS.ASSESSMENTS_GENERATE_BY_PERCENTAGE}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(request),
        }).then(handleResponse<PercentageBasedGenerationResponse>),

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
};
