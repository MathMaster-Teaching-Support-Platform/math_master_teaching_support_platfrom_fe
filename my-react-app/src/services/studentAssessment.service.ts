import { API_BASE_URL } from '../config/api.config';
import { AuthService } from './api/auth.service';
import type {
  StudentAssessmentResponse,
  AttemptStartResponse,
  StartAssessmentRequest,
  AnswerUpdateRequest,
  AnswerAckResponse,
  FlagUpdateRequest,
  SubmitAssessmentRequest,
  DraftSnapshotResponse,
} from '../types/studentAssessment.types';
import type { ApiResponse, PaginatedResponse } from '../types';

export class StudentAssessmentService {
  private static async getHeaders() {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      accept: '*/*',
    };
  }

  // Get my assessments
  static async getMyAssessments(params: {
    status?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }): Promise<ApiResponse<PaginatedResponse<StudentAssessmentResponse>>> {
    const headers = await this.getHeaders();
    const queryParams = new URLSearchParams();
    
    if (params.status) queryParams.append('status', params.status);
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortDir) queryParams.append('sortDir', params.sortDir);

    const response = await fetch(
      `${API_BASE_URL}/student-assessments?${queryParams.toString()}`,
      { method: 'GET', headers }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch assessments');
    }

    return response.json();
  }

  // Get assessment details
  static async getAssessmentDetails(
    assessmentId: string
  ): Promise<ApiResponse<StudentAssessmentResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${API_BASE_URL}/student-assessments/${assessmentId}`,
      { method: 'GET', headers }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch assessment details');
    }

    return response.json();
  }

  // Start assessment
  static async startAssessment(
    request: StartAssessmentRequest
  ): Promise<ApiResponse<AttemptStartResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/student-assessments/start`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to start assessment');
    }

    return response.json();
  }

  // Update answer
  static async updateAnswer(
    request: AnswerUpdateRequest
  ): Promise<ApiResponse<AnswerAckResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/student-assessments/answer`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update answer');
    }

    return response.json();
  }

  // Update flag
  static async updateFlag(
    request: FlagUpdateRequest
  ): Promise<ApiResponse<AnswerAckResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/student-assessments/flag`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update flag');
    }

    return response.json();
  }

  // Submit assessment
  static async submitAssessment(request: SubmitAssessmentRequest): Promise<ApiResponse<void>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/student-assessments/submit`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit assessment');
    }

    return response.json();
  }

  // Get draft snapshot
  static async getDraftSnapshot(
    attemptId: string
  ): Promise<ApiResponse<DraftSnapshotResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${API_BASE_URL}/student-assessments/attempts/${attemptId}/snapshot`,
      { method: 'GET', headers }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get draft snapshot');
    }

    return response.json();
  }

  // Save and exit
  static async saveAndExit(attemptId: string): Promise<ApiResponse<void>> {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${API_BASE_URL}/student-assessments/attempts/${attemptId}/save-exit`,
      { method: 'POST', headers }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save and exit');
    }

    return response.json();
  }
}
