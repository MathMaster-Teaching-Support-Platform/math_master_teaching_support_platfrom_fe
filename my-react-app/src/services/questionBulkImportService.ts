// services/questionBulkImportService.ts
import { API_BASE_URL } from '../config/api.config';
import { AuthService } from './api/auth.service';
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
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/questions/bulk-import/template`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download template');
    }

    return await response.blob();
  }

  /**
   * Preview Excel import — parses the xlsx and returns per-row validation
   */
  async previewExcel(file: File): Promise<QuestionExcelPreviewResponse> {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error('Authentication required');
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
        .catch(() => ({ message: 'Failed to preview Excel file' }));
      throw new Error(error.message || 'Failed to preview Excel file');
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
      throw new Error('Authentication required');
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
      const error = await response.json().catch(() => ({ message: 'Failed to import questions' }));
      throw new Error(error.message || 'Failed to import questions');
    }

    const data: ApiResponse<QuestionBatchImportResponse> = await response.json();
    return data.result;
  }
}

export const questionBulkImportService = new QuestionBulkImportService();
