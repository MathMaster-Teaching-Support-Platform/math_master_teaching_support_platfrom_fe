import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import type { ApiResponse } from '../../types';
import type { Page } from '../../types/common.types';
import type {
  BookLessonPageResponse,
  BookProgressResponse,
  BookResponse,
  BookSearchParams,
  BulkPageMappingRequest,
  CreateBookRequest,
  OcrTriggerResponse,
  UpdateBookRequest,
} from '../../types/book.types';
import { translateApiError } from '../../utils/errorCodes';
import { AuthService } from './auth.service';

const jsonHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  accept: '*/*',
});

const requireToken = (): string => {
  const token = AuthService.getToken();
  if (!token) throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
  return token;
};

const handle = async <T>(res: Response, fallback: string): Promise<ApiResponse<T>> => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(translateApiError((err as { message?: string }).message || fallback));
  }
  return res.json();
};

export class BookService {
  static async create(req: CreateBookRequest): Promise<ApiResponse<BookResponse>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOKS}`, {
      method: 'POST',
      headers: jsonHeaders(requireToken()),
      body: JSON.stringify(req),
    });
    return handle<BookResponse>(res, 'Failed to create book');
  }

  static async getById(bookId: string): Promise<ApiResponse<BookResponse>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOK_DETAIL(bookId)}`, {
      method: 'GET',
      headers: jsonHeaders(requireToken()),
    });
    return handle<BookResponse>(res, 'Failed to fetch book');
  }

  static async search(
    params: BookSearchParams = {}
  ): Promise<ApiResponse<Page<BookResponse>>> {
    const query = new URLSearchParams();
    if (params.schoolGradeId) query.set('schoolGradeId', params.schoolGradeId);
    if (params.subjectId) query.set('subjectId', params.subjectId);
    if (params.curriculumId) query.set('curriculumId', params.curriculumId);
    if (params.status) query.set('status', params.status);
    query.set('page', String(params.page ?? 0));
    query.set('size', String(params.size ?? 20));

    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOKS}?${query.toString()}`, {
      method: 'GET',
      headers: jsonHeaders(requireToken()),
    });
    return handle<Page<BookResponse>>(res, 'Failed to search books');
  }

  static async update(
    bookId: string,
    req: UpdateBookRequest
  ): Promise<ApiResponse<BookResponse>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOK_DETAIL(bookId)}`, {
      method: 'PUT',
      headers: jsonHeaders(requireToken()),
      body: JSON.stringify(req),
    });
    return handle<BookResponse>(res, 'Failed to update book');
  }

  static async setPdfPath(
    bookId: string,
    pdfPath: string
  ): Promise<ApiResponse<BookResponse>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOK_PDF_PATH(bookId)}`, {
      method: 'PATCH',
      headers: jsonHeaders(requireToken()),
      body: JSON.stringify({ pdfPath }),
    });
    return handle<BookResponse>(res, 'Failed to set PDF path');
  }

  static async uploadPdf(
    bookId: string,
    file: File
  ): Promise<ApiResponse<BookResponse>> {
    const token = requireToken();
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOK_PDF_UPLOAD(bookId)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
      body: form,
    });
    return handle<BookResponse>(res, 'Failed to upload PDF');
  }

  static async delete(bookId: string): Promise<ApiResponse<void>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOK_DETAIL(bookId)}`, {
      method: 'DELETE',
      headers: jsonHeaders(requireToken()),
    });
    return handle<void>(res, 'Failed to delete book');
  }

  static async getPageMapping(
    bookId: string
  ): Promise<ApiResponse<BookLessonPageResponse[]>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOK_PAGE_MAPPING(bookId)}`, {
      method: 'GET',
      headers: jsonHeaders(requireToken()),
    });
    return handle<BookLessonPageResponse[]>(res, 'Failed to fetch page mapping');
  }

  static async bulkUpsertPageMapping(
    bookId: string,
    req: BulkPageMappingRequest
  ): Promise<ApiResponse<BookLessonPageResponse[]>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOK_PAGE_MAPPING(bookId)}`, {
      method: 'PUT',
      headers: jsonHeaders(requireToken()),
      body: JSON.stringify(req),
    });
    return handle<BookLessonPageResponse[]>(res, 'Failed to save page mapping');
  }

  static async triggerOcr(bookId: string): Promise<ApiResponse<OcrTriggerResponse>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOK_OCR_TRIGGER(bookId)}`, {
      method: 'POST',
      headers: jsonHeaders(requireToken()),
    });
    return handle<OcrTriggerResponse>(res, 'Failed to trigger OCR');
  }

  static async getProgress(bookId: string): Promise<ApiResponse<BookProgressResponse>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOK_PROGRESS(bookId)}`, {
      method: 'GET',
      headers: jsonHeaders(requireToken()),
    });
    return handle<BookProgressResponse>(res, 'Failed to fetch progress');
  }

  static async refreshVerification(bookId: string): Promise<ApiResponse<void>> {
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.BOOK_REFRESH_VERIFICATION(bookId)}`,
      { method: 'POST', headers: jsonHeaders(requireToken()) }
    );
    return handle<void>(res, 'Failed to refresh verification');
  }
}
