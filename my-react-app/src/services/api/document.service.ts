import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import type { SearchDocumentsApiResponse } from '../../types';
import { translateApiError } from '../../utils/errorCodes';
import { AuthService } from './auth.service';

export class DocumentService {
  private static async getHeaders() {
    const token = AuthService.getToken();
    if (!token) throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      accept: '*/*',
    };
  }

  static async searchDocumentsByChapterLesson(
    chapterId: string,
    lessonId: string
  ): Promise<SearchDocumentsApiResponse> {
    const headers = await this.getHeaders();
    const queryParams = new URLSearchParams({ chapterId, lessonId });

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS_SEARCH}?${queryParams.toString()}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        translateApiError((error as { message?: string }).message || 'Failed to search documents')
      );
    }

    return response.json();
  }
}
