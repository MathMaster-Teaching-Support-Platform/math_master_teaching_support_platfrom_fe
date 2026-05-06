import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import { AuthService } from './auth.service';
import type {
  CreateLessonPlanRequest,
  UpdateLessonPlanRequest,
  LessonPlanResponse,
} from '../../types';
import type { ApiResponse } from '../../types';

export class LessonPlanService {
  private static async getHeaders() {
    const token = AuthService.getToken();
    if (!token) throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      accept: '*/*',
    };
  }

  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { message?: string }).message || 'Request failed');
    }
    return response.json();
  }

  /** POST /lesson-plans */
  static async createLessonPlan(
    data: CreateLessonPlanRequest
  ): Promise<ApiResponse<LessonPlanResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LESSON_PLANS}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  /** PUT /lesson-plans/{id} */
  static async updateLessonPlan(
    id: string,
    data: UpdateLessonPlanRequest
  ): Promise<ApiResponse<LessonPlanResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LESSON_PLAN_DETAIL(id)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  /** GET /lesson-plans/{id} */
  static async getLessonPlanById(id: string): Promise<ApiResponse<LessonPlanResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LESSON_PLAN_DETAIL(id)}`, {
      method: 'GET',
      headers,
    });
    return this.handleResponse(response);
  }

  /** GET /lesson-plans/my */
  static async getMyLessonPlans(): Promise<ApiResponse<LessonPlanResponse[]>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LESSON_PLANS_MY}`, {
      method: 'GET',
      headers,
    });
    return this.handleResponse(response);
  }

  /** GET /lesson-plans/my/lesson/{lessonId} */
  static async getMyLessonPlanByLesson(
    lessonId: string
  ): Promise<ApiResponse<LessonPlanResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.LESSON_PLAN_MY_BY_LESSON(lessonId)}`,
      { method: 'GET', headers }
    );
    return this.handleResponse(response);
  }

  /** GET /lesson-plans/lesson/{lessonId} */
  static async getLessonPlansByLesson(
    lessonId: string
  ): Promise<ApiResponse<LessonPlanResponse[]>> {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.LESSON_PLANS_BY_LESSON(lessonId)}`,
      { method: 'GET', headers }
    );
    return this.handleResponse(response);
  }

  /** DELETE /lesson-plans/{id} */
  static async deleteLessonPlan(id: string): Promise<ApiResponse<void>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LESSON_PLAN_DETAIL(id)}`, {
      method: 'DELETE',
      headers,
    });
    return this.handleResponse(response);
  }
}
