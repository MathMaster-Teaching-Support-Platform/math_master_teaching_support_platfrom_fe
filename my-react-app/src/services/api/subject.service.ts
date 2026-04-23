import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import type { SubjectsApiResponse } from '../../types';
import { AuthService } from './auth.service';

export class SubjectService {
  private static async getHeaders() {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      accept: '*/*',
    };
  }

  private static parseApiError(payload: unknown, fallback: string): Error {
    const p = payload as { message?: string; code?: number };
    if (typeof p?.message === 'string' && p.message.trim().length > 0) {
      return new Error(p.message);
    }
    if (typeof p?.code === 'number' && p.code !== 1000) {
      return new Error(`${fallback} (code: ${p.code})`);
    }
    return new Error(fallback);
  }

  static async getSubjects(): Promise<SubjectsApiResponse> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SUBJECTS}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw this.parseApiError(error, 'Failed to fetch subjects');
    }

    const data = (await response.json()) as SubjectsApiResponse;
    if (data.code !== 1000) {
      throw this.parseApiError(data, 'Failed to fetch subjects');
    }

    return data;
  }

  static async getSubjectsByGrade(gradeLevel: string): Promise<SubjectsApiResponse> {
    const normalizedGradeLevel = gradeLevel?.trim?.() ?? '';
    if (
      !normalizedGradeLevel ||
      normalizedGradeLevel.toLowerCase() === 'undefined' ||
      normalizedGradeLevel.toLowerCase() === 'null'
    ) {
      throw new Error('Invalid grade level');
    }

    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SUBJECTS_BY_GRADE(normalizedGradeLevel)}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw this.parseApiError(error, 'Failed to fetch subjects by grade');
    }

    const data = (await response.json()) as SubjectsApiResponse;
    if (data.code !== 1000) {
      throw this.parseApiError(data, 'Failed to fetch subjects by grade');
    }

    return data;
  }
}
