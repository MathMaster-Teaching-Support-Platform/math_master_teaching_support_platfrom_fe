import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import { AuthService } from './auth.service';
import { translateApiError } from '../../utils/errorCodes';
import type { ApiResponse } from '../../types/auth.types';

export interface GradeResponse {
  id: string;
  level: number;
  gradeLevel?: number;
  name: string;
  code?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type GradesApiResponse = ApiResponse<GradeResponse[]>;

export class GradeService {
  private static async getHeaders() {
    const token = AuthService.getToken();
    if (!token) throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      accept: '*/*',
    };
  }

  private static parseApiError(payload: unknown, fallback: string): Error {
    const p = payload as { message?: string; code?: number };
    if (typeof p?.message === 'string' && p.message.trim().length > 0) {
      return new Error(translateApiError(p.message));
    }
    return new Error(translateApiError(fallback));
  }

  static async getSchoolGrades(): Promise<GradesApiResponse> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SCHOOL_GRADES}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw this.parseApiError(error, 'Failed to fetch grades');
    }

    const data = (await response.json()) as GradesApiResponse;
    if (data.code !== 1000) {
      throw this.parseApiError(data, 'Failed to fetch grades');
    }

    const normalizedResult = (data.result ?? []).map((grade) => ({
      ...grade,
      level: grade.level ?? grade.gradeLevel ?? 0,
    }));

    return {
      ...data,
      result: normalizedResult,
    };
  }
}
