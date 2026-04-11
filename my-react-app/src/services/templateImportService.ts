// services/templateImportService.ts
import { API_BASE_URL } from '../config/api.config';
import { AuthService } from './api/auth.service';
import type {
  ExcelPreviewResponse,
  TemplateBatchImportResponse,
  QuestionTemplateRequest,
  ApiResponse,
} from '../types/bulkImport';

class TemplateImportService {
  /**
   * Download Excel template
   */
  async downloadTemplate(): Promise<Blob> {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/question-templates/bulk-import/template`, {
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
   * Preview Excel import
   */
  async previewExcel(file: File): Promise<ExcelPreviewResponse> {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/question-templates/bulk-import/preview`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to preview Excel file' }));
      throw new Error(error.message || 'Failed to preview Excel file');
    }

    const data: ApiResponse<ExcelPreviewResponse> = await response.json();
    return data.result;
  }

  /**
   * Submit batch import
   */
  async submitBatch(templates: QuestionTemplateRequest[]): Promise<TemplateBatchImportResponse> {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/question-templates/bulk-import/submit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ templates }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to import templates' }));
      throw new Error(error.message || 'Failed to import templates');
    }

    const data: ApiResponse<TemplateBatchImportResponse> = await response.json();
    return data.result;
  }
}

export const templateImportService = new TemplateImportService();
