import { API_BASE_URL } from '../config/api.config';
import type { ApiResponse, PaginatedResponse } from '../types';
import type {
  CompleteGradingRequest,
  GradeOverrideRequest,
  GradingAnalyticsResponse,
  GradingSubmissionResponse,
  ManualAdjustmentRequest,
  RegradeRequestCreationRequest,
  RegradeRequestResponse,
  RegradeResponseRequest,
} from '../types/grading.types';
import { translateApiError } from '../utils/errorCodes';
import { AuthService } from './api/auth.service';

export class GradingService {
  private static async getHeaders() {
    const token = AuthService.getToken();
    if (!token) throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      accept: '*/*',
    };
  }

  // Get grading queue
  static async getGradingQueue(params: {
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PaginatedResponse<GradingSubmissionResponse>>> {
    const headers = await this.getHeaders();
    const queryParams = new URLSearchParams();

    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());

    const response = await fetch(`${API_BASE_URL}/grading/queue?${queryParams.toString()}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(translateApiError(error.message, error.code));
    }

    return response.json();
  }

  // Get grading queue by teacher
  static async getGradingQueueByTeacher(
    teacherId: string,
    params: { page?: number; size?: number }
  ): Promise<ApiResponse<PaginatedResponse<GradingSubmissionResponse>>> {
    const headers = await this.getHeaders();
    const queryParams = new URLSearchParams();

    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());

    const response = await fetch(
      `${API_BASE_URL}/grading/queue/teacher/${teacherId}?${queryParams.toString()}`,
      { method: 'GET', headers }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(translateApiError(error.message, error.code));
    }

    return response.json();
  }

  // Get submission for grading
  static async getSubmissionForGrading(
    submissionId: string
  ): Promise<ApiResponse<GradingSubmissionResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/grading/submissions/${submissionId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(translateApiError(error.message, error.code));
    }

    return response.json();
  }

  // Complete grading
  static async completeGrading(
    request: CompleteGradingRequest
  ): Promise<ApiResponse<GradingSubmissionResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/grading/complete`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(translateApiError(error.message, error.code));
    }

    return response.json();
  }

  // Override grade
  static async overrideGrade(request: GradeOverrideRequest): Promise<ApiResponse<void>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/grading/override`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(translateApiError(error.message, error.code));
    }

    return response.json();
  }

  // Add manual adjustment
  static async addManualAdjustment(request: ManualAdjustmentRequest): Promise<ApiResponse<void>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/grading/adjustment`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(translateApiError(error.message, error.code));
    }

    return response.json();
  }

  // Get grading analytics
  static async getGradingAnalytics(
    assessmentId: string
  ): Promise<ApiResponse<GradingAnalyticsResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/grading/analytics/${assessmentId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(translateApiError(error.message, error.code));
    }

    return response.json();
  }

  // Export grades
  static async exportGrades(assessmentId: string): Promise<Blob> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/grading/export/${assessmentId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Không thể công khaig điểm.');
    }

    return response.blob();
  }

  // Release grades
  static async releaseGrades(assessmentId: string): Promise<ApiResponse<void>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/grading/release/${assessmentId}`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(translateApiError(error.message, error.code));
    }

    return response.json();
  }

  // Release grades for submission
  static async releaseGradesForSubmission(submissionId: string): Promise<ApiResponse<void>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/grading/release/submission/${submissionId}`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(translateApiError(error.message, error.code));
    }

    return response.json();
  }

  // Create regrade request
  static async createRegradeRequest(
    request: RegradeRequestCreationRequest
  ): Promise<ApiResponse<RegradeRequestResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/grading/regrade/request`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(translateApiError(error.message, error.code));
    }

    return response.json();
  }

  // Respond to regrade request
  static async respondToRegradeRequest(
    request: RegradeResponseRequest
  ): Promise<ApiResponse<RegradeRequestResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/grading/regrade/respond`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(translateApiError(error.message, error.code));
    }

    return response.json();
  }

  // Get regrade requests
  static async getRegradeRequests(params: {
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PaginatedResponse<RegradeRequestResponse>>> {
    const headers = await this.getHeaders();
    const queryParams = new URLSearchParams();

    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());

    const response = await fetch(
      `${API_BASE_URL}/grading/regrade/requests?${queryParams.toString()}`,
      { method: 'GET', headers }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(translateApiError(error.message, error.code));
    }

    return response.json();
  }

  // Get student regrade requests
  static async getStudentRegradeRequests(
    studentId: string,
    params: { page?: number; size?: number }
  ): Promise<ApiResponse<PaginatedResponse<RegradeRequestResponse>>> {
    const headers = await this.getHeaders();
    const queryParams = new URLSearchParams();

    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());

    const response = await fetch(
      `${API_BASE_URL}/grading/regrade/student/${studentId}?${queryParams.toString()}`,
      { method: 'GET', headers }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(translateApiError(error.message, error.code));
    }

    return response.json();
  }

  // Invalidate submission
  static async invalidateSubmission(
    submissionId: string,
    reason?: string
  ): Promise<ApiResponse<GradingSubmissionResponse>> {
    const headers = await this.getHeaders();
    const queryParams = reason ? `?reason=${encodeURIComponent(reason)}` : '';

    const response = await fetch(
      `${API_BASE_URL}/grading/submissions/${submissionId}/invalidate${queryParams}`,
      { method: 'POST', headers }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(translateApiError(error.message, error.code));
    }

    return response.json();
  }

  // Get my result (student)
  static async getMyResult(submissionId: string): Promise<ApiResponse<GradingSubmissionResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/grading/submissions/${submissionId}/my-result`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(translateApiError(error.message, error.code));
    }

    return response.json();
  }

  // Trigger AI review
  static async triggerAiReview(submissionId: string): Promise<ApiResponse<void>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/grading/submissions/${submissionId}/ai-review`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(translateApiError(error.message, error.code));
    }

    return response.json();
  }

  // Get pending count
  static async getPendingCount(): Promise<ApiResponse<number>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/grading/pending-count`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(translateApiError(error.message, error.code));
    }

    return response.json();
  }
}
