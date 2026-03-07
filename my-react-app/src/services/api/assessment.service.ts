import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import { AuthService } from './auth.service';
import type {
    AssessmentRequest,
    AssessmentResponse,
    PointsOverrideRequest,
    AssessmentSummary,
    GetMyAssessmentsParams,
    CloneAssessmentRequest,
    AddQuestionToAssessmentRequest,
    ApiResponse,
    PaginatedResponse,
} from '../../types';

export class AssessmentService {
    private static async getHeaders() {
        const token = AuthService.getToken();
        if (!token) throw new Error('Authentication required');
        return {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            accept: '*/*',
        };
    }

    // ─── CREATE / UPDATE ─────────────────────────────────────────────────────

    /** POST /assessments */
    static async createAssessment(data: AssessmentRequest): Promise<ApiResponse<AssessmentResponse>> {
        const headers = await this.getHeaders();
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ASSESSMENTS}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create assessment');
        }
        return response.json();
    }

    /** PUT /assessments/{id} */
    static async updateAssessment(
        id: string,
        data: AssessmentRequest
    ): Promise<ApiResponse<AssessmentResponse>> {
        const headers = await this.getHeaders();
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ASSESSMENTS_DETAIL(id)}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update assessment');
        }
        return response.json();
    }

    /** PATCH /assessments/{assessmentId}/points-override */
    static async setPointsOverride(
        assessmentId: string,
        data: PointsOverrideRequest
    ): Promise<ApiResponse<AssessmentResponse>> {
        const headers = await this.getHeaders();
        const response = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.ASSESSMENTS_POINTS_OVERRIDE(assessmentId)}`,
            { method: 'PATCH', headers, body: JSON.stringify(data) }
        );
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to set points override');
        }
        return response.json();
    }

    // ─── READ ─────────────────────────────────────────────────────────────────

    /** GET /assessments/{id} */
    static async getAssessmentById(id: string): Promise<ApiResponse<AssessmentResponse>> {
        const headers = await this.getHeaders();
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ASSESSMENTS_DETAIL(id)}`, {
            method: 'GET',
            headers,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch assessment');
        }
        return response.json();
    }

    /** GET /assessments/{id}/preview */
    static async getAssessmentPreview(id: string): Promise<ApiResponse<AssessmentResponse>> {
        const headers = await this.getHeaders();
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ASSESSMENTS_PREVIEW(id)}`, {
            method: 'GET',
            headers,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch assessment preview');
        }
        return response.json();
    }

    /** GET /assessments/{id}/publish-summary */
    static async getPublishSummary(id: string): Promise<ApiResponse<AssessmentSummary>> {
        const headers = await this.getHeaders();
        const response = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.ASSESSMENTS_PUBLISH_SUMMARY(id)}`,
            { method: 'GET', headers }
        );
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch publish summary');
        }
        return response.json();
    }

    /** GET /assessments/my */
    static async getMyAssessments(
        params: GetMyAssessmentsParams
    ): Promise<ApiResponse<PaginatedResponse<AssessmentResponse>>> {
        const headers = await this.getHeaders();
        const queryParams = new URLSearchParams();
        if (params.status) queryParams.append('status', params.status);
        if (params.lessonId) queryParams.append('lessonId', params.lessonId);
        if (params.page !== undefined) queryParams.append('page', params.page.toString());
        if (params.size !== undefined) queryParams.append('size', params.size.toString());
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);

        const qs = queryParams.toString();
        const url = `${API_BASE_URL}${API_ENDPOINTS.ASSESSMENTS_MY}${qs ? `?${qs}` : ''}`;
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch assessments');
        }
        return response.json();
    }

    // ─── PERMISSION CHECKS ────────────────────────────────────────────────────

    /** GET /assessments/{id}/can-edit */
    static async canEditAssessment(id: string): Promise<ApiResponse<boolean>> {
        const headers = await this.getHeaders();
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ASSESSMENTS_CAN_EDIT(id)}`, {
            method: 'GET',
            headers,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to check edit permission');
        }
        return response.json();
    }

    /** GET /assessments/{id}/can-delete */
    static async canDeleteAssessment(id: string): Promise<ApiResponse<boolean>> {
        const headers = await this.getHeaders();
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ASSESSMENTS_CAN_DELETE(id)}`, {
            method: 'GET',
            headers,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to check delete permission');
        }
        return response.json();
    }

    /** GET /assessments/{id}/can-publish */
    static async canPublishAssessment(id: string): Promise<ApiResponse<boolean>> {
        const headers = await this.getHeaders();
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ASSESSMENTS_CAN_PUBLISH(id)}`, {
            method: 'GET',
            headers,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to check publish permission');
        }
        return response.json();
    }

    // ─── STATE TRANSITIONS ────────────────────────────────────────────────────

    /** POST /assessments/{id}/publish */
    static async publishAssessment(id: string): Promise<ApiResponse<AssessmentResponse>> {
        const headers = await this.getHeaders();
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ASSESSMENTS_PUBLISH(id)}`, {
            method: 'POST',
            headers,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to publish assessment');
        }
        return response.json();
    }

    /** POST /assessments/{id}/unpublish */
    static async unpublishAssessment(id: string): Promise<ApiResponse<AssessmentResponse>> {
        const headers = await this.getHeaders();
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ASSESSMENTS_UNPUBLISH(id)}`, {
            method: 'POST',
            headers,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to unpublish assessment');
        }
        return response.json();
    }

    /** POST /assessments/{id}/close */
    static async closeAssessment(id: string): Promise<ApiResponse<AssessmentResponse>> {
        const headers = await this.getHeaders();
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ASSESSMENTS_CLOSE(id)}`, {
            method: 'POST',
            headers,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to close assessment');
        }
        return response.json();
    }

    // ─── CLONE ────────────────────────────────────────────────────────────────

    /** POST /assessments/{id}/clone */
    static async cloneAssessment(
        id: string,
        data: CloneAssessmentRequest
    ): Promise<ApiResponse<AssessmentResponse>> {
        const headers = await this.getHeaders();
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ASSESSMENTS_CLONE(id)}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to clone assessment');
        }
        return response.json();
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────

    /** DELETE /assessments/{id} */
    static async deleteAssessment(id: string): Promise<ApiResponse<void>> {
        const headers = await this.getHeaders();
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ASSESSMENTS_DETAIL(id)}`, {
            method: 'DELETE',
            headers,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete assessment');
        }
        return response.json();
    }

    // ─── QUESTIONS ────────────────────────────────────────────────────────────

    /** POST /assessments/{assessmentId}/questions */
    static async addQuestion(
        assessmentId: string,
        data: AddQuestionToAssessmentRequest
    ): Promise<ApiResponse<AssessmentResponse>> {
        const headers = await this.getHeaders();
        const response = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.ASSESSMENTS_QUESTIONS(assessmentId)}`,
            { method: 'POST', headers, body: JSON.stringify(data) }
        );
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to add question to assessment');
        }
        return response.json();
    }

    /** DELETE /assessments/{assessmentId}/questions/{questionId} */
    static async removeQuestion(
        assessmentId: string,
        questionId: string
    ): Promise<ApiResponse<AssessmentResponse>> {
        const headers = await this.getHeaders();
        const response = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.ASSESSMENTS_QUESTION_REMOVE(assessmentId, questionId)}`,
            { method: 'DELETE', headers }
        );
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to remove question from assessment');
        }
        return response.json();
    }
}
