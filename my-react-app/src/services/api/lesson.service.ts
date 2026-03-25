import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import { AuthService } from './auth.service';
import type { LessonQueryParams, LessonResponse } from '../../types/lesson.types';
import type { ApiResponse } from '../../types';

export class LessonService {
  private static async getHeaders() {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      accept: '*/*',
    };
  }

  static async getLessons(params: LessonQueryParams): Promise<ApiResponse<LessonResponse[]>> {
    const headers = await this.getHeaders();
    const query = new URLSearchParams({
      gradeLevel: params.gradeLevel,
      subject: params.subject,
    });

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LESSONS}?${query.toString()}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { message?: string }).message || 'Failed to fetch lessons');
    }

    return response.json();
  }

  static async getLessonById(lessonId: string): Promise<ApiResponse<LessonResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LESSON_DETAIL(lessonId)}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { message?: string }).message || 'Failed to fetch lesson detail');
    }

    return response.json();
  }

  static async getLessonsByChapter(
    chapterId: string,
    name?: string
  ): Promise<ApiResponse<LessonResponse[]>> {
    const headers = await this.getHeaders();
    const query = new URLSearchParams();
    if (name?.trim()) {
      query.set('name', name.trim());
    }

    const queryString = query.toString();
    const endpoint = `${API_BASE_URL}${API_ENDPOINTS.LESSONS_BY_CHAPTER(chapterId)}${
      queryString ? `?${queryString}` : ''
    }`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { message?: string }).message || 'Failed to fetch chapter lessons');
    }

    return response.json();
  }
}
