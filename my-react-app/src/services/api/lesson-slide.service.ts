import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import { AuthService } from './auth.service';
import type { LessonResponse } from '../../types/lesson.types';
import type {
  ApiEnvelope,
  ChapterBySubject,
  GeneratedFileListResult,
  GeneratePptxRequest,
  GenerateSlideContentRequest,
  GenerateSlideContentResult,
  PageResult,
  LessonSlideGeneratedFile,
  LessonSlidePublicationStatus,
  LessonByChapter,
  LessonSlideTemplate,
  PublicGeneratedSlidesQuery,
  SchoolGrade,
  SubjectByGrade,
} from '../../types/lessonSlide.types';

interface DownloadPptxResult {
  blob: Blob;
  filename: string;
}

interface UpdateGeneratedSlideMetadataPayload {
  name?: string;
  thumbnail?: File;
}

interface PreviewUrlEnvelope {
  result?:
    | string
    | {
        preSignedUrl?: string;
        presignedUrl?: string;
        previewUrl?: string;
        url?: string;
      };
  preSignedUrl?: string;
  presignedUrl?: string;
  previewUrl?: string;
  url?: string;
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

  private static normalizeGeneratedFileList(
    result: LessonSlideGeneratedFile[] | GeneratedFileListResult | null | undefined
  ): LessonSlideGeneratedFile[] {
    if (Array.isArray(result)) {
      return result;
    }

    if (result && Array.isArray(result.content)) {
      return result.content;
    }

    return [];
  }

  private static normalizeGeneratedFilePage(
    result:
      | LessonSlideGeneratedFile[]
      | GeneratedFileListResult
      | PageResult<LessonSlideGeneratedFile>
      | null
      | undefined,
    fallbackPage = 0,
    fallbackSize = 10
  ): PageResult<LessonSlideGeneratedFile> {
    if (Array.isArray(result)) {
      return {
        content: result,
        number: fallbackPage,
        size: fallbackSize,
        totalElements: result.length,
        totalPages: result.length ? 1 : 0,
        first: true,
        last: true,
      };
    }

    if (result && Array.isArray(result.content)) {
      const totalElements =
        typeof (result as { totalElements?: number }).totalElements === 'number'
          ? (result as { totalElements: number }).totalElements
          : result.content.length;
      const size =
        typeof (result as { size?: number }).size === 'number'
          ? (result as { size: number }).size
          : typeof (result as { pageSize?: number }).pageSize === 'number'
            ? (result as { pageSize: number }).pageSize
            : fallbackSize;
      const number =
        typeof (result as { number?: number }).number === 'number'
          ? (result as { number: number }).number
          : typeof (result as { pageNumber?: number }).pageNumber === 'number'
            ? (result as { pageNumber: number }).pageNumber
            : fallbackPage;
      const totalPages =
        typeof (result as { totalPages?: number }).totalPages === 'number'
          ? (result as { totalPages: number }).totalPages
          : Math.ceil(totalElements / Math.max(size, 1));

      return {
        content: result.content,
        number,
        size,
        totalElements,
        totalPages,
        first:
          typeof (result as { first?: boolean }).first === 'boolean'
            ? (result as { first: boolean }).first
            : number <= 0,
        last:
          typeof (result as { last?: boolean }).last === 'boolean'
            ? (result as { last: boolean }).last
            : number >= Math.max(totalPages - 1, 0),
      };
    }

    return {
      content: [],
      number: fallbackPage,
      size: fallbackSize,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    };
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

  static async getGeneratedFiles(
    lessonId?: string
  ): Promise<ApiEnvelope<LessonSlideGeneratedFile[]>> {
    const headers = await this.getAuthHeaders(false);
    const query = new URLSearchParams();

    if (lessonId) {
      query.set('lessonId', lessonId);
    }

    const queryString = query.toString();
    const url = `${API_BASE_URL}${API_ENDPOINTS.LESSON_SLIDES_GENERATED}${
      queryString ? `?${queryString}` : ''
    }`;

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const parsedError = await this.parseApiError(response, 'Failed to fetch generated slides');
      throw this.buildApiError(parsedError.message, parsedError.code);
    }

    const payload = (await response.json()) as ApiEnvelope<
      LessonSlideGeneratedFile[] | GeneratedFileListResult
    >;

    return {
      ...payload,
      result: this.normalizeGeneratedFileList(payload.result),
    };
  }

  static async downloadGeneratedFile(generatedFileId: string): Promise<DownloadPptxResult> {
    const headers = await this.getAuthHeaders(false);
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.LESSON_SLIDES_GENERATED_DOWNLOAD(generatedFileId)}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      const parsedError = await this.parseApiError(response, 'Failed to download generated slide');
      throw this.buildApiError(parsedError.message, parsedError.code);
    }

    return {
      blob: await response.blob(),
      filename:
        this.getFilenameFromDisposition(response.headers.get('content-disposition')) ||
        'generated-slide.pptx',
    };
  }

  static async getGeneratedFilePreviewUrl(generatedFileId: string): Promise<string> {
    const headers = await this.getAuthHeaders(false);
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.LESSON_SLIDES_GENERATED_PREVIEW_URL(generatedFileId)}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      const parsedError = await this.parseApiError(
        response,
        'Failed to get generated slide preview URL'
      );
      throw this.buildApiError(parsedError.message, parsedError.code);
    }

    const payload = (await response.json()) as PreviewUrlEnvelope;
    const result = payload.result;

    const url =
      (typeof result === 'string' ? result : undefined) ||
      (typeof result === 'object' && result
        ? result.preSignedUrl || result.presignedUrl || result.previewUrl || result.url
        : undefined) ||
      payload.preSignedUrl ||
      payload.presignedUrl ||
      payload.previewUrl ||
      payload.url;

    if (!url) {
      throw this.buildApiError('Preview URL is missing in API response');
    }

    return url;
  }

  static async getGeneratedFilePreviewPdf(generatedFileId: string): Promise<DownloadPptxResult> {
    const headers = await this.getAuthHeaders(false);
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.LESSON_SLIDES_GENERATED_PREVIEW_PDF(generatedFileId)}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      const parsedError = await this.parseApiError(
        response,
        'Failed to preview generated slide PDF'
      );
      throw this.buildApiError(parsedError.message, parsedError.code);
    }

    return {
      blob: await response.blob(),
      filename: this.getFilenameFromDisposition(response.headers.get('content-disposition')),
    };
  }

  static async publishGeneratedFile(
    generatedFileId: string
  ): Promise<ApiEnvelope<LessonSlideGeneratedFile>> {
    const headers = await this.getAuthHeaders(false);
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.LESSON_SLIDES_GENERATED_PUBLISH(generatedFileId)}`,
      {
        method: 'PATCH',
        headers,
      }
    );

    if (!response.ok) {
      const parsedError = await this.parseApiError(response, 'Failed to publish generated slide');
      throw this.buildApiError(parsedError.message, parsedError.code);
    }

    return response.json();
  }

  static async unpublishGeneratedFile(
    generatedFileId: string
  ): Promise<ApiEnvelope<LessonSlideGeneratedFile>> {
    const headers = await this.getAuthHeaders(false);
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.LESSON_SLIDES_GENERATED_UNPUBLISH(generatedFileId)}`,
      {
        method: 'PATCH',
        headers,
      }
    );

    if (!response.ok) {
      const parsedError = await this.parseApiError(response, 'Failed to unpublish generated slide');
      throw this.buildApiError(parsedError.message, parsedError.code);
    }

    return response.json();
  }

  static async updateGeneratedFileMetadata(
    generatedFileId: string,
    payload: UpdateGeneratedSlideMetadataPayload
  ): Promise<ApiEnvelope<LessonSlideGeneratedFile>> {
    const headers = await this.getAuthHeaders(false);
    const formData = new FormData();

    if (typeof payload.name === 'string') {
      formData.append('name', payload.name);
    }

    if (payload.thumbnail) {
      formData.append('thumbnail', payload.thumbnail);
    }

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.LESSON_SLIDES_GENERATED_METADATA(generatedFileId)}`,
      {
        method: 'PATCH',
        headers,
        body: formData,
      }
    );

    if (!response.ok) {
      const parsedError = await this.parseApiError(
        response,
        'Failed to update generated slide metadata'
      );
      throw this.buildApiError(parsedError.message, parsedError.code);
    }

    return response.json();
  }

  static async getGeneratedFileThumbnailImage(generatedFileId: string): Promise<Blob> {
    const headers = await this.getAuthHeaders(false);
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.LESSON_SLIDES_GENERATED_THUMBNAIL_IMAGE(generatedFileId)}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      const parsedError = await this.parseApiError(
        response,
        'Failed to get generated slide thumbnail image'
      );
      throw this.buildApiError(parsedError.message, parsedError.code);
    }

    return response.blob();
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

  static async getPublicGeneratedFilesByLessonId(
    lessonId: string
  ): Promise<ApiEnvelope<LessonSlideGeneratedFile[]>> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.LESSON_SLIDES_PUBLIC_GENERATED_BY_LESSON(lessonId)}`,
      {
        method: 'GET',
        headers: { accept: '*/*' },
      }
    );

    if (!response.ok) {
      const parsedError = await this.parseApiError(
        response,
        'Failed to fetch public generated slides'
      );
      throw this.buildApiError(parsedError.message, parsedError.code);
    }

    const payload = (await response.json()) as ApiEnvelope<
      LessonSlideGeneratedFile[] | GeneratedFileListResult
    >;

    return {
      ...payload,
      result: this.normalizeGeneratedFileList(payload.result),
    };
  }

  static async getAllPublicGeneratedFiles(
    params: PublicGeneratedSlidesQuery = {}
  ): Promise<ApiEnvelope<PageResult<LessonSlideGeneratedFile>>> {
    const query = new URLSearchParams();
    if (params.lessonId) query.set('lessonId', params.lessonId);
    if (params.keyword) query.set('keyword', params.keyword);
    if (typeof params.page === 'number') query.set('page', String(params.page));
    if (typeof params.size === 'number') query.set('size', String(params.size));
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.direction) query.set('direction', params.direction);

    const queryString = query.toString();
    const url = `${API_BASE_URL}${API_ENDPOINTS.LESSON_SLIDES_PUBLIC_GENERATED}${
      queryString ? `?${queryString}` : ''
    }`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { accept: '*/*' },
    });

    if (!response.ok) {
      const parsedError = await this.parseApiError(
        response,
        'Failed to fetch public generated slides'
      );
      throw this.buildApiError(parsedError.message, parsedError.code);
    }

    const payload = (await response.json()) as ApiEnvelope<
      LessonSlideGeneratedFile[] | GeneratedFileListResult | PageResult<LessonSlideGeneratedFile>
    >;

    return {
      ...payload,
      result: this.normalizeGeneratedFilePage(payload.result, params.page ?? 0, params.size ?? 10),
    };
  }

  static async downloadPublicGeneratedFile(generatedFileId: string): Promise<DownloadPptxResult> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.LESSON_SLIDES_PUBLIC_GENERATED_DOWNLOAD(generatedFileId)}`,
      {
        method: 'GET',
        headers: { accept: '*/*' },
      }
    );

    if (!response.ok) {
      const parsedError = await this.parseApiError(
        response,
        'Failed to download public generated slide'
      );
      throw this.buildApiError(parsedError.message, parsedError.code);
    }

    return {
      blob: await response.blob(),
      filename:
        this.getFilenameFromDisposition(response.headers.get('content-disposition')) ||
        'generated-slide.pptx',
    };
  }

  static async getPublicGeneratedFilePreviewUrl(generatedFileId: string): Promise<string> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.LESSON_SLIDES_PUBLIC_GENERATED_PREVIEW_URL(generatedFileId)}`,
      {
        method: 'GET',
        headers: { accept: '*/*' },
      }
    );

    if (!response.ok) {
      const parsedError = await this.parseApiError(
        response,
        'Failed to get public generated slide preview URL'
      );
      throw this.buildApiError(parsedError.message, parsedError.code);
    }

    const payload = (await response.json()) as PreviewUrlEnvelope;
    const result = payload.result;

    const url =
      (typeof result === 'string' ? result : undefined) ||
      (typeof result === 'object' && result
        ? result.preSignedUrl || result.presignedUrl || result.previewUrl || result.url
        : undefined) ||
      payload.preSignedUrl ||
      payload.presignedUrl ||
      payload.previewUrl ||
      payload.url;

    if (!url) {
      throw this.buildApiError('Preview URL is missing in API response');
    }

    return url;
  }

  static async getPublicGeneratedFilePreviewPdf(
    generatedFileId: string
  ): Promise<DownloadPptxResult> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.LESSON_SLIDES_PUBLIC_GENERATED_PREVIEW_PDF(generatedFileId)}`,
      {
        method: 'GET',
        headers: { accept: '*/*' },
      }
    );

    if (!response.ok) {
      const parsedError = await this.parseApiError(
        response,
        'Failed to get public generated slide preview PDF'
      );
      throw this.buildApiError(parsedError.message, parsedError.code);
    }

    return {
      blob: await response.blob(),
      filename: this.getFilenameFromDisposition(response.headers.get('content-disposition')),
    };
  }

  static async getPublicGeneratedFileThumbnailImage(generatedFileId: string): Promise<Blob> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.LESSON_SLIDES_PUBLIC_GENERATED_THUMBNAIL_IMAGE(generatedFileId)}`,
      {
        method: 'GET',
        headers: { accept: '*/*' },
      }
    );

    if (!response.ok) {
      const parsedError = await this.parseApiError(
        response,
        'Failed to get public generated slide thumbnail image'
      );
      throw this.buildApiError(parsedError.message, parsedError.code);
    }

    return response.blob();
  }
}
