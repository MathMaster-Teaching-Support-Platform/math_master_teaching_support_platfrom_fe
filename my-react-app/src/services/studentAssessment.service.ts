import { API_BASE_URL } from '../config/api.config';
import { AuthService } from './api/auth.service';
import type {
  StudentAssessmentResponse,
  AttemptStartResponse,
  AttemptQuestionResponse,
  StartAssessmentRequest,
  AnswerUpdateRequest,
  AnswerAckResponse,
  FlagUpdateRequest,
  SubmitAssessmentRequest,
  DraftSnapshotResponse,
} from '../types/studentAssessment.types';
import type { ApiResponse, PaginatedResponse } from '../types';

export class StudentAssessmentService {
  private static toRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  }

  private static toArray<T = unknown>(value: unknown): T[] {
    return Array.isArray(value) ? (value as T[]) : [];
  }

  private static pickString(...values: unknown[]): string | undefined {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) return value;
      if (typeof value === 'number') return String(value);
    }
    return undefined;
  }

  private static pickNumber(...values: unknown[]): number {
    for (const value of values) {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
      }
    }
    return 0;
  }

  private static normalizeAttemptQuestion(rawQuestion: unknown): AttemptQuestionResponse {
    const question = this.toRecord(rawQuestion);
    const nestedQuestion = this.toRecord(question.question ?? question.questionData ?? question.question_data);
    const diagramData =
      question.diagramData
      ?? question.diagram_data
      ?? nestedQuestion.diagramData
      ?? nestedQuestion.diagram_data
      ?? nestedQuestion.diagramDefinition
      ?? nestedQuestion.diagram_definition
      ?? null;

    return {
      questionId: this.pickString(
        question.questionId,
        question.question_id,
        question.id,
        nestedQuestion.questionId,
        nestedQuestion.question_id,
        nestedQuestion.id,
      ) || '',
      orderIndex: this.pickNumber(question.orderIndex, question.order_index),
      questionText:
        this.pickString(
          question.questionText,
          question.question_text,
          nestedQuestion.questionText,
          nestedQuestion.question_text,
        ) || '',
      questionType:
        (this.pickString(question.questionType, question.question_type, nestedQuestion.questionType, nestedQuestion.question_type) as AttemptQuestionResponse['questionType'])
        || 'MULTIPLE_CHOICE',
      options:
        (this.toRecord(question.options).constructor === Object && Object.keys(this.toRecord(question.options)).length > 0
          ? this.toRecord(question.options)
          : this.toRecord(nestedQuestion.options)),
      points: this.pickNumber(question.points, question.pointsOverride, question.points_override, nestedQuestion.points),
      diagramData: diagramData as AttemptQuestionResponse['diagramData'],
      diagramUrl: this.pickString(
        question.diagramUrl,
        question.diagram_url,
        nestedQuestion.diagramUrl,
        nestedQuestion.diagram_url,
      ),
      diagramLatex: this.pickString(
        question.diagramLatex,
        question.diagram_latex,
        nestedQuestion.diagramLatex,
        nestedQuestion.diagram_latex,
      ),
      latexContent: this.pickString(
        question.latexContent,
        question.latex_content,
        nestedQuestion.latexContent,
        nestedQuestion.latex_content,
      ),
      answerFormula: this.pickString(
        question.answerFormula,
        question.answer_formula,
        nestedQuestion.answerFormula,
        nestedQuestion.answer_formula,
      ),
    };
  }

  private static normalizeStartAttemptResponse(
    payload: ApiResponse<AttemptStartResponse>
  ): ApiResponse<AttemptStartResponse> {
    const result = payload.result;
    if (!result) return payload;

    return {
      ...payload,
      result: {
        ...result,
        questions: this.toArray(result.questions).map((question) => this.normalizeAttemptQuestion(question)),
      },
    };
  }

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

  static async getMyAssessmentsByCourse(
    courseId: string,
    params: {
      status?: string;
      page?: number;
      size?: number;
      sortBy?: string;
      sortDir?: string;
    }
  ): Promise<ApiResponse<PaginatedResponse<StudentAssessmentResponse>>> {
    const headers = await this.getHeaders();
    const queryParams = new URLSearchParams();

    if (params.status) queryParams.append('status', params.status);
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortDir) queryParams.append('sortDir', params.sortDir);

    const response = await fetch(
      `${API_BASE_URL}/student-assessments/course/${courseId}?${queryParams.toString()}`,
      { method: 'GET', headers }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch course assessments');
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

    const payload = (await response.json()) as ApiResponse<AttemptStartResponse>;
    return this.normalizeStartAttemptResponse(payload);
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
