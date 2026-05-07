import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import type { ApiResponse } from '../../types';
import type {
  LessonContentResponse,
  LessonPageResponse,
  UpdateLessonPageRequest,
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

export class BookContentService {
  static async getLessonContentForBook(
    bookId: string,
    lessonId: string
  ): Promise<ApiResponse<LessonContentResponse>> {
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.BOOK_LESSON_CONTENT(bookId, lessonId)}`,
      { method: 'GET', headers: jsonHeaders(requireToken()) }
    );
    return handle<LessonContentResponse>(res, 'Failed to fetch lesson content');
  }

  static async getAllLessonsForBook(
    bookId: string
  ): Promise<ApiResponse<LessonContentResponse[]>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOK_CONTENT(bookId)}`, {
      method: 'GET',
      headers: jsonHeaders(requireToken()),
    });
    return handle<LessonContentResponse[]>(res, 'Failed to fetch book content');
  }

  static async getPage(
    bookId: string,
    lessonId: string,
    pageNumber: number
  ): Promise<ApiResponse<LessonPageResponse>> {
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.BOOK_LESSON_PAGE(bookId, lessonId, pageNumber)}`,
      { method: 'GET', headers: jsonHeaders(requireToken()) }
    );
    return handle<LessonPageResponse>(res, 'Failed to fetch page');
  }

  static async updatePage(
    bookId: string,
    lessonId: string,
    pageNumber: number,
    req: UpdateLessonPageRequest
  ): Promise<ApiResponse<LessonPageResponse>> {
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.BOOK_LESSON_PAGE(bookId, lessonId, pageNumber)}`,
      {
        method: 'PATCH',
        headers: jsonHeaders(requireToken()),
        body: JSON.stringify(req),
      }
    );
    return handle<LessonPageResponse>(res, 'Failed to update page');
  }

  static async getLessonContent(
    lessonId: string
  ): Promise<ApiResponse<LessonContentResponse>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LESSON_OCR_CONTENT(lessonId)}`, {
      method: 'GET',
      headers: jsonHeaders(requireToken()),
    });
    return handle<LessonContentResponse>(res, 'Failed to fetch lesson content');
  }
}
