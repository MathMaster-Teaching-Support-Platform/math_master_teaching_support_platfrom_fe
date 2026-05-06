// services/questionBulkImportService.ts
import { API_BASE_URL } from '../config/api.config';
import { AuthService } from './api/auth.service';
import { translateApiError } from '../utils/errorCodes';
import type {
  QuestionExcelPreviewResponse,
  QuestionBatchImportResponse,
  QuestionImportRequest,
  ApiResponse,
} from '../types/bulkImport';

class QuestionBulkImportService {
  /**
   * Download Excel template for question import
   */
  async downloadTemplate(): Promise<Blob> {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
    }

    const response = await fetch(`${API_BASE_URL}/questions/bulk-import/template`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Không thể tải file mẫu.');
    }

    return await response.blob();
  }

  /**
   * Preview Excel import — parses the xlsx and returns per-row validation
   */
  async previewExcel(file: File): Promise<QuestionExcelPreviewResponse> {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/questions/bulk-import/preview`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Không thể xem trước file Excel.' }));
      throw new Error(translateApiError(error.message, error.code));
    }

    const data: ApiResponse<QuestionExcelPreviewResponse> = await response.json();
    return data.result;
  }

  /**
   * Submit validated questions for batch creation
   */
  async submitBatch(questions: QuestionImportRequest[]): Promise<QuestionBatchImportResponse> {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
    }

    const response = await fetch(`${API_BASE_URL}/questions/bulk-import/submit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ questions }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Không thể nhập câu hỏi.' }));
      throw new Error(translateApiError(error.message, error.code));
    }

    const data: ApiResponse<QuestionBatchImportResponse> = await response.json();
    return data.result;
  }
}

export const questionBulkImportService = new QuestionBulkImportService();
