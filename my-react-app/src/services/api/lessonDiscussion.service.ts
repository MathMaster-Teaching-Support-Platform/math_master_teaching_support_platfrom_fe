import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import type {
  ApiResponse,
  CreateLessonDiscussionCommentRequest,
  LessonDiscussionCommentResponse,
  LessonDiscussionLikeResponse,
  PaginatedResponse,
  UpdateLessonDiscussionCommentRequest,
} from '../../types';
import { AuthService } from './auth.service';

export class LessonDiscussionService {
  private static async getHeaders() {
    const token = AuthService.getToken();
    if (!token) throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      accept: '*/*',
    };
  }

  private static async handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const message = (err as { message?: string }).message || 'Request failed';
      throw Object.assign(new Error(message), { response: { data: err } });
    }
    return res.json();
  }

  static async getRootComments(
    courseId: string,
    lessonId: string,
    page = 0,
    size = 10
  ): Promise<ApiResponse<PaginatedResponse<LessonDiscussionCommentResponse>>> {
    const headers = await this.getHeaders();
    const endpoint =
      `${API_BASE_URL}${API_ENDPOINTS.COURSE_LESSON_DISCUSSION_COMMENTS(courseId, lessonId)}` +
      `?page=${page}&size=${size}`;
    const res = await fetch(endpoint, { method: 'GET', headers });
    return this.handleResponse(res);
  }

  static async getReplies(
    courseId: string,
    lessonId: string,
    commentId: string,
    page = 0,
    size = 10
  ): Promise<ApiResponse<PaginatedResponse<LessonDiscussionCommentResponse>>> {
    const headers = await this.getHeaders();
    const endpoint =
      `${API_BASE_URL}${API_ENDPOINTS.COURSE_LESSON_DISCUSSION_REPLIES(courseId, lessonId, commentId)}` +
      `?page=${page}&size=${size}`;
    const res = await fetch(endpoint, { method: 'GET', headers });
    return this.handleResponse(res);
  }

  static async createComment(
    courseId: string,
    lessonId: string,
    data: CreateLessonDiscussionCommentRequest
  ): Promise<ApiResponse<LessonDiscussionCommentResponse>> {
    const headers = await this.getHeaders();
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.COURSE_LESSON_DISCUSSION_COMMENTS(courseId, lessonId)}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse(res);
  }

  static async updateComment(
    courseId: string,
    lessonId: string,
    commentId: string,
    data: UpdateLessonDiscussionCommentRequest
  ): Promise<ApiResponse<LessonDiscussionCommentResponse>> {
    const headers = await this.getHeaders();
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.COURSE_LESSON_DISCUSSION_COMMENT_DETAIL(courseId, lessonId, commentId)}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse(res);
  }

  static async deleteComment(courseId: string, lessonId: string, commentId: string): Promise<void> {
    const headers = await this.getHeaders();
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.COURSE_LESSON_DISCUSSION_COMMENT_DETAIL(courseId, lessonId, commentId)}`,
      {
        method: 'DELETE',
        headers,
      }
    );
    await this.handleResponse(res);
  }

  static async toggleLike(
    courseId: string,
    lessonId: string,
    commentId: string
  ): Promise<ApiResponse<LessonDiscussionLikeResponse>> {
    const headers = await this.getHeaders();
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.COURSE_LESSON_DISCUSSION_LIKE_TOGGLE(courseId, lessonId, commentId)}`,
      {
        method: 'POST',
        headers,
      }
    );
    return this.handleResponse(res);
  }
}
