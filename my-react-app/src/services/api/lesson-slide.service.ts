import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import { AuthService } from './auth.service';
import type { LessonResponse } from '../../types/lesson.types';
import type {
  ApiEnvelope,
  ChapterBySubject,
  GeneratePptxRequest,
  GenerateSlideContentRequest,
  GenerateSlideContentResult,
  LessonSlidePublicationStatus,
  LessonByChapter,
  LessonSlideTemplate,
  SchoolGrade,
  SubjectByGrade,
} from '../../types/lessonSlide.types';

interface DownloadPptxResult {
  blob: Blob;
  filename: string;
}

export class LessonSlideService {
  private static buildApiError(
    message: string,
    code?: number
  ): Error & {
    code?: number;
  } {
    const error = new Error(message) as Error & { code?: number };
    if (typeof code === 'number') {
      error.code = code;
    }
    return error;
  }

  private static async parseApiError(
    response: Response,
    fallback: string
  ): Promise<{ message: string; code?: number }> {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
        code?: number;
      };
      return {
        message: payload.message || payload.error || fallback,
        code: payload.code,
      };
    }

    const text = await response.text().catch(() => '');
    return { message: text.trim() || fallback };
  }

  private static async getAuthHeaders(contentTypeJson = true): Promise<Record<string, string>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      accept: '*/*',
    };

    if (contentTypeJson) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
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
    if (!disposition) return 'lesson-slides.pptx';

    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
      return decodeURIComponent(utf8Match[1]);
    }

    const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
    return asciiMatch?.[1] || 'lesson-slides.pptx';
  }

  static async getSchoolGrades(activeOnly = true): Promise<ApiEnvelope<SchoolGrade[]>> {
    const headers = await this.getAuthHeaders(false);
    const query = new URLSearchParams({ activeOnly: String(activeOnly) });

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SCHOOL_GRADES}?${query}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(await this.readErrorMessage(response, 'Failed to fetch school grades'));
    }

    return response.json();
  }

  static async getSubjectsBySchoolGrade(
    schoolGradeId: string
  ): Promise<ApiEnvelope<SubjectByGrade[]>> {
    const headers = await this.getAuthHeaders(false);
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.SUBJECTS_BY_SCHOOL_GRADE(schoolGradeId)}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(await this.readErrorMessage(response, 'Failed to fetch subjects'));
    }

    return response.json();
  }

  static async getChaptersBySubject(subjectId: string): Promise<ApiEnvelope<ChapterBySubject[]>> {
    const headers = await this.getAuthHeaders(false);
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHAPTERS_BY_SUBJECT(subjectId)}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(await this.readErrorMessage(response, 'Failed to fetch chapters'));
    }

    return response.json();
  }

  static async getLessonsByChapter(chapterId: string): Promise<ApiEnvelope<LessonByChapter[]>> {
    const headers = await this.getAuthHeaders(false);
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LESSONS_BY_CHAPTER(chapterId)}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(await this.readErrorMessage(response, 'Failed to fetch lessons'));
    }

    return response.json();
  }

  static async getTemplates(activeOnly = true): Promise<ApiEnvelope<LessonSlideTemplate[]>> {
    const headers = await this.getAuthHeaders(false);
    const query = new URLSearchParams({ activeOnly: String(activeOnly) });
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.LESSON_SLIDES_TEMPLATES}?${query.toString()}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(await this.readErrorMessage(response, 'Failed to fetch slide templates'));
    }

    return response.json();
  }

  static async generateContent(
    payload: GenerateSlideContentRequest
  ): Promise<ApiEnvelope<GenerateSlideContentResult>> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LESSON_SLIDES_GENERATE_CONTENT}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const parsedError = await this.parseApiError(response, 'Failed to generate slide content');
      throw this.buildApiError(parsedError.message, parsedError.code);
    }

    return response.json();
  }

  static async generatePptx(payload: GeneratePptxRequest): Promise<DownloadPptxResult> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LESSON_SLIDES_GENERATE_PPTX}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await this.readErrorMessage(response, 'Failed to generate PPTX'));
    }

    return {
      blob: await response.blob(),
      filename: this.getFilenameFromDisposition(response.headers.get('content-disposition')),
    };
  }

  static async getTeacherLessonSlideByLessonId(
    lessonId: string
  ): Promise<ApiEnvelope<LessonResponse>> {
    const headers = await this.getAuthHeaders(false);
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.LESSON_SLIDES_BY_LESSON(lessonId)}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(await this.readErrorMessage(response, 'Failed to fetch lesson slide'));
    }

    return response.json();
  }

  static async getTeacherLessonSlidesByStatus(
    status: LessonSlidePublicationStatus = 'DRAFT'
  ): Promise<ApiEnvelope<LessonResponse[]>> {
    const headers = await this.getAuthHeaders(false);
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.LESSON_SLIDES_BY_STATUS(status)}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(await this.readErrorMessage(response, 'Failed to fetch lesson slides'));
    }

    return response.json();
  }

  static async publishLessonSlides(lessonId: string): Promise<ApiEnvelope<LessonResponse>> {
    const headers = await this.getAuthHeaders(false);
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.LESSON_SLIDES_PUBLISH(lessonId)}`,
      {
        method: 'PATCH',
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(await this.readErrorMessage(response, 'Failed to publish lesson slides'));
    }

    return response.json();
  }

  static async unpublishLessonSlides(lessonId: string): Promise<ApiEnvelope<LessonResponse>> {
    const headers = await this.getAuthHeaders(false);
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.LESSON_SLIDES_UNPUBLISH(lessonId)}`,
      {
        method: 'PATCH',
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(await this.readErrorMessage(response, 'Failed to unpublish lesson slides'));
    }

    return response.json();
  }

  static async getPublicLessonSlidesByLessonId(
    lessonId: string
  ): Promise<ApiEnvelope<LessonResponse>> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.LESSON_SLIDES_PUBLIC_BY_LESSON(lessonId)}`,
      {
        method: 'GET',
        headers: { accept: '*/*' },
      }
    );

    if (!response.ok) {
      throw new Error(
        await this.readErrorMessage(response, 'Failed to fetch public lesson slides')
      );
    }

    return response.json();
  }
}
