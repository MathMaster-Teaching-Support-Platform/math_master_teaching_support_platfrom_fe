import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import type { ChaptersApiResponse } from '../../types';
import { translateApiError } from '../../utils/errorCodes';
import { AuthService } from './auth.service';

export class ChapterService {
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

  static async getChaptersBySubject(subjectId: string): Promise<ChaptersApiResponse> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHAPTERS_BY_SUBJECT(subjectId)}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw this.parseApiError(error, 'Failed to fetch chapters by subject');
    }

    const data = (await response.json()) as ChaptersApiResponse;
    if (data.code !== 1000) {
      throw this.parseApiError(data, 'Failed to fetch chapters by subject');
    }

    return data;
  }
}
