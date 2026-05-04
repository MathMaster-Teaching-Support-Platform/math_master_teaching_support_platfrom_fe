import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import type {
  ChapterResponse,
  ChaptersApiResponse,
  CreateChapterRequest,
  CreateLessonRequest,
  CreateSchoolGradeRequest,
  CreateSubjectRequest,
  LessonResponse,
  LessonsApiResponse,
  SchoolGradeResponse,
  SchoolGradesApiResponse,
  SubjectResponse,
  SubjectsApiResponse,
  UpdateChapterRequest,
  UpdateLessonRequest,
  UpdateSchoolGradeRequest,
  UpdateSubjectRequest,
} from '../../types/academic.types';
import type { ApiResponse } from '../../types/auth.types';
import { AuthService } from './auth.service';

export class AcademicStructureService {
  private static async getHeaders() {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      accept: '*/*',
    };
  }

  private static parseApiError(payload: unknown, fallback: string): Error {
    const p = payload as { message?: string; code?: number };
    if (typeof p?.message === 'string' && p.message.trim().length > 0) {
      return new Error(p.message);
    }
    if (typeof p?.code === 'number' && p.code !== 1000) {
      return new Error(`${fallback} (code: ${p.code})`);
    }
    return new Error(fallback);
  }

  private static async parseResponse<T>(
    response: Response,
    fallback: string
  ): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw this.parseApiError(error, fallback);
    }

    const data = (await response.json()) as ApiResponse<T>;
    if (data.code !== 1000) {
      throw this.parseApiError(data, fallback);
    }

    return data;
  }

  static async getSchoolGrades(activeOnly?: boolean): Promise<SchoolGradesApiResponse> {
    const headers = await this.getHeaders();
    const query = new URLSearchParams();
    if (typeof activeOnly === 'boolean') {
      query.set('activeOnly', String(activeOnly));
    }

    const queryString = query.toString();
    const endpoint = `${API_BASE_URL}${API_ENDPOINTS.SCHOOL_GRADES}${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
    });

    return this.parseResponse<SchoolGradeResponse[]>(response, 'Failed to fetch school grades');
  }

  static async createSchoolGrade(
    payload: CreateSchoolGradeRequest
  ): Promise<ApiResponse<SchoolGradeResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SCHOOL_GRADES}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    return this.parseResponse<SchoolGradeResponse>(response, 'Failed to create school grade');
  }

  static async updateSchoolGrade(
    schoolGradeId: string,
    payload: UpdateSchoolGradeRequest
  ): Promise<ApiResponse<SchoolGradeResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.SCHOOL_GRADE_DETAIL(schoolGradeId)}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      }
    );

    return this.parseResponse<SchoolGradeResponse>(response, 'Failed to update school grade');
  }

  static async deleteSchoolGrade(schoolGradeId: string): Promise<ApiResponse<unknown>> {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.SCHOOL_GRADE_DETAIL(schoolGradeId)}`,
      {
        method: 'DELETE',
        headers,
      }
    );

    return this.parseResponse<unknown>(response, 'Failed to delete school grade');
  }

  static async getSubjectsBySchoolGrade(schoolGradeId: string): Promise<SubjectsApiResponse> {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.SUBJECTS_BY_SCHOOL_GRADE(schoolGradeId)}`,
      {
        method: 'GET',
        headers,
      }
    );

    return this.parseResponse<SubjectResponse[]>(response, 'Failed to fetch subjects');
  }

  static async createSubject(payload: CreateSubjectRequest): Promise<ApiResponse<SubjectResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SUBJECTS}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    return this.parseResponse<SubjectResponse>(response, 'Failed to create subject');
  }

  static async updateSubject(
    subjectId: string,
    payload: UpdateSubjectRequest
  ): Promise<ApiResponse<SubjectResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SUBJECT_DETAIL(subjectId)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });

    return this.parseResponse<SubjectResponse>(response, 'Failed to update subject');
  }

  static async deleteSubject(subjectId: string): Promise<ApiResponse<unknown>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SUBJECT_DETAIL(subjectId)}`, {
      method: 'DELETE',
      headers,
    });

    return this.parseResponse<unknown>(response, 'Failed to delete subject');
  }

  static async getChaptersBySubject(subjectId: string): Promise<ChaptersApiResponse> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHAPTERS_BY_SUBJECT(subjectId)}`, {
      method: 'GET',
      headers,
    });

    return this.parseResponse<ChapterResponse[]>(response, 'Failed to fetch chapters');
  }

  static async createChapter(payload: CreateChapterRequest): Promise<ApiResponse<ChapterResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHAPTERS}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    return this.parseResponse<ChapterResponse>(response, 'Failed to create chapter');
  }

  static async updateChapter(
    chapterId: string,
    payload: UpdateChapterRequest
  ): Promise<ApiResponse<ChapterResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHAPTER_DETAIL(chapterId)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });

    return this.parseResponse<ChapterResponse>(response, 'Failed to update chapter');
  }

  static async deleteChapter(chapterId: string): Promise<ApiResponse<unknown>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHAPTER_DETAIL(chapterId)}`, {
      method: 'DELETE',
      headers,
    });

    return this.parseResponse<unknown>(response, 'Failed to delete chapter');
  }

  static async getLessonsByChapter(chapterId: string, name?: string): Promise<LessonsApiResponse> {
    const headers = await this.getHeaders();
    const query = new URLSearchParams();
    if (name?.trim()) {
      query.set('name', name.trim());
    }

    const queryString = query.toString();
    const endpoint = `${API_BASE_URL}${API_ENDPOINTS.CHAPTER_LESSONS(chapterId)}${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
    });

    return this.parseResponse<LessonResponse[]>(response, 'Failed to fetch lessons by chapter');
  }

  static async createLesson(payload: CreateLessonRequest): Promise<ApiResponse<LessonResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LESSONS}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    return this.parseResponse<LessonResponse>(response, 'Failed to create lesson');
  }

  static async updateLesson(
    lessonId: string,
    payload: UpdateLessonRequest
  ): Promise<ApiResponse<LessonResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LESSON_DETAIL(lessonId)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });

    return this.parseResponse<LessonResponse>(response, 'Failed to update lesson');
  }

  static async deleteLesson(lessonId: string): Promise<ApiResponse<unknown>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LESSON_DETAIL(lessonId)}`, {
      method: 'DELETE',
      headers,
    });

    return this.parseResponse<unknown>(response, 'Failed to delete lesson');
  }
}
