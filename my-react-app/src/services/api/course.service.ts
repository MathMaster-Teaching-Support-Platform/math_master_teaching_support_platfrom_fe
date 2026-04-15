import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import type {
  AddAssessmentToCourseRequest,
  ApiResponse,
  CourseAssessmentResponse,
  CourseLessonResponse,
  CourseResponse,
  CreateCourseLessonRequest,
  CreateCourseRequest,
  EnrollmentResponse,
  GetPublicCoursesParams,
  LessonProgressItem,
  PaginatedResponse,
  PublishCourseRequest,
  StudentInCourseResponse,
  StudentProgressResponse,
  UpdateCourseAssessmentRequest,
  UpdateCourseLessonRequest,
  UpdateCourseRequest,
} from '../../types';
import { AuthService } from './auth.service';

export class CourseService {
  private static async getHeaders() {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      accept: '*/*',
    };
  }

  private static async getAuthHeaders() {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');
    return {
      Authorization: `Bearer ${token}`,
      accept: '*/*',
    };
  }

  private static async handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || 'Request failed');
    }
    return res.json();
  }

  // ─── Courses ──────────────────────────────────────────────────────────────

  static async createCourse(data: CreateCourseRequest): Promise<ApiResponse<CourseResponse>> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COURSES}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return this.handleResponse(res);
  }

  static async getMyCourses(): Promise<ApiResponse<CourseResponse[]>> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COURSES_MY}`, {
      method: 'GET',
      headers,
    });
    return this.handleResponse(res);
  }

  static async getCourseById(courseId: string): Promise<ApiResponse<CourseResponse>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COURSE_DETAIL(courseId)}`, {
      method: 'GET',
    });
    return this.handleResponse(res);
  }

  static async updateCourse(
    courseId: string,
    data: UpdateCourseRequest
  ): Promise<ApiResponse<CourseResponse>> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COURSE_DETAIL(courseId)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    return this.handleResponse(res);
  }

  static async deleteCourse(courseId: string): Promise<ApiResponse<void>> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COURSE_DETAIL(courseId)}`, {
      method: 'DELETE',
      headers,
    });
    return this.handleResponse(res);
  }

  static async publishCourse(
    courseId: string,
    data: PublishCourseRequest
  ): Promise<ApiResponse<CourseResponse>> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COURSE_PUBLISH(courseId)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    return this.handleResponse(res);
  }

  static async getPublicCourses(
    params: GetPublicCoursesParams = {}
  ): Promise<ApiResponse<PaginatedResponse<CourseResponse>>> {
    const qs = new URLSearchParams();
    if (params.schoolGradeId) qs.append('schoolGradeId', params.schoolGradeId);
    if (params.subjectId) qs.append('subjectId', params.subjectId);
    if (params.keyword) qs.append('keyword', params.keyword);
    if (params.page !== undefined) qs.append('page', String(params.page));
    if (params.size !== undefined) qs.append('size', String(params.size));
    const url = `${API_BASE_URL}${API_ENDPOINTS.COURSES}${qs.toString() ? `?${qs}` : ''}`;
    const res = await fetch(url, { method: 'GET' });
    return this.handleResponse(res);
  }

  static async getStudentsInCourse(
    courseId: string,
    page = 0,
    size = 20
  ): Promise<ApiResponse<PaginatedResponse<StudentInCourseResponse>>> {
    const headers = await this.getHeaders();
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.COURSE_STUDENTS(courseId)}?page=${page}&size=${size}`,
      { method: 'GET', headers }
    );
    return this.handleResponse(res);
  }

  // ─── Course Lessons ───────────────────────────────────────────────────────

  static async addLesson(
    courseId: string,
    request: CreateCourseLessonRequest,
    videoFile?: File
  ): Promise<ApiResponse<CourseLessonResponse>> {
    const headers = await this.getAuthHeaders();
    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (videoFile) formData.append('video', videoFile);
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COURSE_LESSONS(courseId)}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return this.handleResponse(res);
  }

  static async getLessons(courseId: string): Promise<ApiResponse<CourseLessonResponse[]>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COURSE_LESSONS(courseId)}`, {
      method: 'GET',
    });
    return this.handleResponse(res);
  }

  static async updateLesson(
    courseId: string,
    lessonId: string,
    request: UpdateCourseLessonRequest,
    videoFile?: File
  ): Promise<ApiResponse<CourseLessonResponse>> {
    const headers = await this.getAuthHeaders();
    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (videoFile) formData.append('video', videoFile);
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.COURSE_LESSON_DETAIL(courseId, lessonId)}`,
      { method: 'PUT', headers, body: formData }
    );
    return this.handleResponse(res);
  }

  static async deleteLesson(courseId: string, lessonId: string): Promise<ApiResponse<void>> {
    const headers = await this.getHeaders();
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.COURSE_LESSON_DETAIL(courseId, lessonId)}`,
      { method: 'DELETE', headers }
    );
    return this.handleResponse(res);
  }

  // ─── Enrollments ──────────────────────────────────────────────────────────

  static async enroll(courseId: string): Promise<ApiResponse<EnrollmentResponse>> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COURSE_ENROLL(courseId)}`, {
      method: 'POST',
      headers,
    });
    return this.handleResponse(res);
  }

  static async getMyEnrollments(): Promise<ApiResponse<EnrollmentResponse[]>> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ENROLLMENTS_MY}`, {
      method: 'GET',
      headers,
    });
    return this.handleResponse(res);
  }

  static async dropEnrollment(
    enrollmentId: string
  ): Promise<ApiResponse<EnrollmentResponse> | null> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ENROLLMENT_DROP(enrollmentId)}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || 'Request failed');
    }
    if (res.status === 204 || res.headers.get('content-length') === '0') return null;
    return res.json();
  }

  // ─── Progress ─────────────────────────────────────────────────────────────

  static async markLessonComplete(
    enrollmentId: string,
    courseLessonId: string
  ): Promise<ApiResponse<LessonProgressItem>> {
    const headers = await this.getHeaders();
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.ENROLLMENT_LESSON_COMPLETE(enrollmentId, courseLessonId)}`,
      { method: 'POST', headers }
    );
    return this.handleResponse(res);
  }

  static async getProgress(enrollmentId: string): Promise<ApiResponse<StudentProgressResponse>> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ENROLLMENT_PROGRESS(enrollmentId)}`, {
      method: 'GET',
      headers,
    });
    return this.handleResponse(res);
  }

  // ─── Course Assessments ───────────────────────────────────────────────────

  static async addAssessmentToCourse(
    courseId: string,
    data: AddAssessmentToCourseRequest
  ): Promise<ApiResponse<CourseAssessmentResponse>> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COURSE_DETAIL(courseId)}/assessments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return this.handleResponse(res);
  }

  static async getCourseAssessments(
    courseId: string
  ): Promise<ApiResponse<CourseAssessmentResponse[]>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COURSE_DETAIL(courseId)}/assessments`, {
      method: 'GET',
    });
    return this.handleResponse(res);
  }

  static async updateCourseAssessment(
    courseId: string,
    assessmentId: string,
    data: UpdateCourseAssessmentRequest
  ): Promise<ApiResponse<CourseAssessmentResponse>> {
    const headers = await this.getHeaders();
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.COURSE_DETAIL(courseId)}/assessments/${assessmentId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse(res);
  }

  static async removeAssessmentFromCourse(
    courseId: string,
    assessmentId: string
  ): Promise<ApiResponse<void>> {
    const headers = await this.getHeaders();
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.COURSE_DETAIL(courseId)}/assessments/${assessmentId}`,
      { method: 'DELETE', headers }
    );
    return this.handleResponse(res);
  }
}
