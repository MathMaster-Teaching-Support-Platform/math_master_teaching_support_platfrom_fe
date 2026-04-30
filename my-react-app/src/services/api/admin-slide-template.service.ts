import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import { AuthService } from './auth.service';
import type { LessonSlideTemplate, ApiEnvelope } from '../../types/lessonSlide.types';

export interface AdminSlideTemplateCreatePayload {
  name: string;
  description?: string;
  pptxFile: File;
  previewImageFile?: File;
}

export interface AdminSlideTemplateUpdatePayload {
  name?: string;
  description?: string;
  pptxFile?: File;
  previewImageFile?: File;
}

interface DownloadResult {
  blob: Blob;
  filename: string;
}

export class AdminSlideTemplateService {
  private static async getAuthHeaders(): Promise<Record<string, string>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');
    return { Authorization: `Bearer ${token}`, accept: '*/*' };
  }

  private static async readErrorMessage(response: Response, fallback: string): Promise<string> {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };
      return payload.message || payload.error || fallback;
    }
    const text = await response.text().catch(() => '');
    return text.trim() || fallback;
  }

  private static getFilenameFromDisposition(disposition: string | null): string {
    if (!disposition) return 'template.pptx';
    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
    const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
    return asciiMatch?.[1] || 'template.pptx';
  }

  /** GET /admin/slide-templates?activeOnly=false */
  static async listTemplates(activeOnly = false): Promise<ApiEnvelope<LessonSlideTemplate[]>> {
    const headers = await this.getAuthHeaders();
    const query = new URLSearchParams({ activeOnly: String(activeOnly) });
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_SLIDE_TEMPLATES}?${query}`, {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      throw new Error(await this.readErrorMessage(response, 'Failed to fetch slide templates'));
    }
    return response.json() as Promise<ApiEnvelope<LessonSlideTemplate[]>>;
  }

  /** GET /admin/slide-templates/{id} */
  static async getTemplate(id: string): Promise<ApiEnvelope<LessonSlideTemplate>> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.ADMIN_SLIDE_TEMPLATE_DETAIL(id)}`,
      { method: 'GET', headers }
    );
    if (!response.ok) {
      throw new Error(await this.readErrorMessage(response, 'Failed to fetch template'));
    }
    return response.json() as Promise<ApiEnvelope<LessonSlideTemplate>>;
  }

  /** POST /admin/slide-templates — multipart/form-data */
  static async createTemplate(
    payload: AdminSlideTemplateCreatePayload
  ): Promise<ApiEnvelope<LessonSlideTemplate>> {
    const headers = await this.getAuthHeaders();
    const formData = new FormData();
    formData.append('name', payload.name);
    if (payload.description) formData.append('description', payload.description);
    formData.append('file', payload.pptxFile);
    if (payload.previewImageFile) formData.append('previewImageFile', payload.previewImageFile);

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_SLIDE_TEMPLATES}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      throw new Error(await this.readErrorMessage(response, 'Failed to create slide template'));
    }
    return response.json() as Promise<ApiEnvelope<LessonSlideTemplate>>;
  }

  /** PUT /admin/slide-templates/{id} — multipart/form-data */
  static async updateTemplate(
    id: string,
    payload: AdminSlideTemplateUpdatePayload
  ): Promise<ApiEnvelope<LessonSlideTemplate>> {
    const headers = await this.getAuthHeaders();
    const formData = new FormData();
    if (payload.name !== undefined) formData.append('name', payload.name);
    if (payload.description !== undefined) formData.append('description', payload.description);
    if (payload.pptxFile) formData.append('file', payload.pptxFile);
    if (payload.previewImageFile) formData.append('previewImageFile', payload.previewImageFile);

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.ADMIN_SLIDE_TEMPLATE_DETAIL(id)}`,
      { method: 'PUT', headers, body: formData }
    );
    if (!response.ok) {
      throw new Error(await this.readErrorMessage(response, 'Failed to update slide template'));
    }
    return response.json() as Promise<ApiEnvelope<LessonSlideTemplate>>;
  }

  /** PATCH /admin/slide-templates/{id}/activate */
  static async activateTemplate(id: string): Promise<ApiEnvelope<LessonSlideTemplate>> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.ADMIN_SLIDE_TEMPLATE_ACTIVATE(id)}`,
      { method: 'PATCH', headers }
    );
    if (!response.ok) {
      throw new Error(await this.readErrorMessage(response, 'Failed to activate template'));
    }
    return response.json() as Promise<ApiEnvelope<LessonSlideTemplate>>;
  }

  /** PATCH /admin/slide-templates/{id}/deactivate */
  static async deactivateTemplate(id: string): Promise<ApiEnvelope<LessonSlideTemplate>> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.ADMIN_SLIDE_TEMPLATE_DEACTIVATE(id)}`,
      { method: 'PATCH', headers }
    );
    if (!response.ok) {
      throw new Error(await this.readErrorMessage(response, 'Failed to deactivate template'));
    }
    return response.json() as Promise<ApiEnvelope<LessonSlideTemplate>>;
  }

  /** DELETE /admin/slide-templates/{id} */
  static async deleteTemplate(id: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.ADMIN_SLIDE_TEMPLATE_DETAIL(id)}`,
      { method: 'DELETE', headers }
    );
    if (!response.ok) {
      throw new Error(await this.readErrorMessage(response, 'Failed to delete template'));
    }
  }

  /** GET /admin/slide-templates/{id}/download */
  static async downloadTemplate(id: string): Promise<DownloadResult> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.ADMIN_SLIDE_TEMPLATE_DOWNLOAD(id)}`,
      { method: 'GET', headers }
    );
    if (!response.ok) {
      throw new Error(await this.readErrorMessage(response, 'Failed to download template'));
    }
    return {
      blob: await response.blob(),
      filename: this.getFilenameFromDisposition(response.headers.get('content-disposition')),
    };
  }

  /** GET /admin/slide-templates/{id}/preview-image */
  static getPreviewImageUrl(id: string): string {
    return `${API_BASE_URL}${API_ENDPOINTS.ADMIN_SLIDE_TEMPLATE_PREVIEW_IMAGE(id)}`;
  }
}
