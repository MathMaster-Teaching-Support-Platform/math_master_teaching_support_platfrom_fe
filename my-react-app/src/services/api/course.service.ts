import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import type {
  AddAssessmentToCourseRequest,
  AvailableCourseAssessmentResponse,
  ApiResponse,
  CourseAssessmentResponse,
  CourseLessonResponse,
  CourseResponse,
  CreateCourseLessonRequest,
  CreateCourseRequest,
  CreateCustomCourseSectionRequest,
  CustomCourseSectionResponse,
  EnrollmentResponse,
  GetPublicCoursesParams,
  LessonProgressItem,
  PaginatedResponse,
  PublishCourseRequest,
  StudentInCourseResponse,
  StudentProgressResponse,
  ReorderLessonsRequest,
  UpdateCourseAssessmentRequest,
  UpdateCourseLessonRequest,
  UpdateCourseRequest,
  RejectCourseRequest,
  UpdateCustomCourseSectionRequest,
  CourseReviewRequest,
  CourseReviewResponse,
  CourseReviewSummaryResponse,
  InstructorReplyRequest,
  TeacherProfileResponse,
} from '../../types';
import { AuthService } from './auth.service';

export class CourseService {
  private static normalizeLessonFlags<T extends Record<string, any>>(lesson: T): T {
    if (!lesson) return lesson;
    if (typeof lesson.isFreePreview === 'undefined' && typeof lesson.freePreview !== 'undefined') {
      return { ...lesson, isFreePreview: !!lesson.freePreview };
    }
    return lesson;
  }

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
      const message = (err as { message?: string }).message || 'Request failed';
      throw Object.assign(new Error(message), { response: { data: err } });
    }
    return res.json();
  }

  // ─── Courses ──────────────────────────────────────────────────────────────

  static async createCourse(data: CreateCourseRequest): Promise<ApiResponse<CourseResponse>> {
    const headers = await this.getAuthHeaders();
    const formData = new FormData();
    const { thumbnailFile, ...request } = data;
    formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    }

    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COURSES}`, {
      method: 'POST',
      headers,
      body: formData,
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

  static async getCoursePreview(courseId: string): Promise<ApiResponse<any>> {
    const headers = await this.getAuthHeaders().catch(() => ({})); // try with auth, fallback to no auth if not logged in
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COURSE_PREVIEW(courseId)}`, {
      method: 'GET',
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });
    const data = await this.handleResponse<ApiResponse<any>>(res);
    if (data?.result?.lessons && Array.isArray(data.result.lessons)) {
      data.result.lessons = data.result.lessons.map((l: any) => this.normalizeLessonFlags(l));
    }
    return data;
  }

  static async updateCourse(
    courseId: string,
    data: UpdateCourseRequest
  ): Promise<ApiResponse<CourseResponse>> {
    const headers = await this.getAuthHeaders();
    const formData = new FormData();
    const { thumbnailFile, ...request } = data;
    formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    }

    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COURSE_DETAIL(courseId)}`, {
      method: 'PUT',
      headers,
      body: formData,
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

  static async submitForReview(courseId: string): Promise<ApiResponse<CourseResponse>> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COURSE_SUBMIT_REVIEW(courseId)}`, {
      method: 'PATCH',
      headers,
    });
    return this.handleResponse(res);
  }

  static async getPendingReviewCourses(params: {
    page?: number;
    size?: number;
  } = {}): Promise<ApiResponse<PaginatedResponse<CourseResponse>>> {
    const headers = await this.getHeaders();
    const qs = new URLSearchParams();
    if (params.page !== undefined) qs.append('page', String(params.page));
    if (params.size !== undefined) qs.append('size', String(params.size));
    const url = `${API_BASE_URL}${API_ENDPOINTS.ADMIN_COURSES_PENDING}${qs.toString() ? `?${qs}` : ''}`;
    const res = await fetch(url, { method: 'GET', headers });
    return this.handleResponse(res);
  }

  static async approveCourse(courseId: string): Promise<ApiResponse<CourseResponse>> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_COURSE_APPROVE(courseId)}`, {
      method: 'PATCH',
      headers,
    });
    return this.handleResponse(res);
  }

  static async rejectCourse(
    courseId: string,
    data: RejectCourseRequest
  ): Promise<ApiResponse<CourseResponse>> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_COURSE_REJECT(courseId)}`, {
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

  /** Admin: search ALL courses (published + unpublished) by keyword */
  static async adminSearchCourses(params: {
    keyword?: string;
    page?: number;
    size?: number;
  } = {}): Promise<ApiResponse<PaginatedResponse<CourseResponse>>> {
    const headers = await this.getHeaders();
    const qs = new URLSearchParams();
    if (params.keyword) qs.append('keyword', params.keyword);
    if (params.page !== undefined) qs.append('page', String(params.page));
    if (params.size !== undefined) qs.append('size', String(params.size));
    const url = `${API_BASE_URL}/courses/admin/search${qs.toString() ? `?${qs}` : ''}`;
    const res = await fetch(url, { method: 'GET', headers });
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
    const data = await this.handleResponse<ApiResponse<CourseLessonResponse[]>>(res);
    if (data?.result && Array.isArray(data.result)) {
      data.result = data.result.map((l: any) => this.normalizeLessonFlags(l));
    }
    return data;
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

  static async reorderLessons(
    courseId: string,
    data: ReorderLessonsRequest
  ): Promise<ApiResponse<void>> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COURSE_LESSONS_REORDER(courseId)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
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

  static async updateProgress(
    enrollmentId: string,
    courseLessonId: string,
    watchedSeconds: number
  ): Promise<ApiResponse<LessonProgressItem>> {
    const headers = await this.getHeaders();
    const res = await fetch(
      `${API_BASE_URL}/enrollments/${enrollmentId}/lessons/${courseLessonId}/progress?watchedSeconds=${watchedSeconds}`,
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
    courseId: string,
    filters?: {
      status?: string;
      type?: string;
      isRequired?: boolean;
    }
  ): Promise<ApiResponse<CourseAssessmentResponse[]>> {
    const qs = new URLSearchParams();
    if (filters?.status) qs.append('status', filters.status);
    if (filters?.type) qs.append('type', filters.type);
    if (filters?.isRequired !== undefined) qs.append('isRequired', String(filters.isRequired));
    
    const url = `${API_BASE_URL}${API_ENDPOINTS.COURSE_DETAIL(courseId)}/assessments${qs.toString() ? `?${qs}` : ''}`;
    const headers = await this.getAuthHeaders();
    const res = await fetch(url, { method: 'GET', headers });
    return this.handleResponse(res);
  }

  static async getAvailableAssessmentsForCourse(
    courseId: string,
    includeOutOfCourseLessons = false
  ): Promise<ApiResponse<AvailableCourseAssessmentResponse[]>> {
    const headers = await this.getHeaders();
    const qs = new URLSearchParams();
    qs.set('includeOutOfCourseLessons', String(includeOutOfCourseLessons));
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.COURSE_DETAIL(courseId)}/assessments/available?${qs.toString()}`,
      { method: 'GET', headers }
    );
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

  // ─── Custom Course Sections ─────────────────────────────────────────────

  static async listSections(
    courseId: string
  ): Promise<ApiResponse<CustomCourseSectionResponse[]>> {
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.COURSE_SECTIONS(courseId)}`,
      { method: 'GET' }
    );
    return this.handleResponse(res);
  }

  static async createSection(
    courseId: string,
    data: CreateCustomCourseSectionRequest
  ): Promise<ApiResponse<CustomCourseSectionResponse>> {
    const headers = await this.getHeaders();
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.COURSE_SECTIONS(courseId)}`,
      { method: 'POST', headers, body: JSON.stringify(data) }
    );
    return this.handleResponse(res);
  }

  static async updateSection(
    courseId: string,
    sectionId: string,
    data: UpdateCustomCourseSectionRequest
  ): Promise<ApiResponse<CustomCourseSectionResponse>> {
    const headers = await this.getHeaders();
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.COURSE_SECTION_DETAIL(courseId, sectionId)}`,
      { method: 'PUT', headers, body: JSON.stringify(data) }
    );
    return this.handleResponse(res);
  }

  static async deleteSection(
    courseId: string,
    sectionId: string
  ): Promise<ApiResponse<void>> {
    const headers = await this.getHeaders();
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.COURSE_SECTION_DETAIL(courseId, sectionId)}`,
      { method: 'DELETE', headers }
    );
    return this.handleResponse(res);
  }

  // ─── Lesson Materials ─────────────────────────────────────────────────────

  static async addMaterial(
    courseId: string,
    lessonId: string,
    file: File
  ): Promise<ApiResponse<CourseLessonResponse>> {
    const headers = await this.getAuthHeaders();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.COURSE_LESSON_MATERIALS(courseId, lessonId)}`,
      { method: 'POST', headers, body: formData }
    );
    return this.handleResponse(res);
  }

  static async removeMaterial(
    courseId: string,
    lessonId: string,
    materialId: string
  ): Promise<ApiResponse<CourseLessonResponse>> {
    const headers = await this.getHeaders();
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.COURSE_LESSON_MATERIAL_DETAIL(courseId, lessonId, materialId)}`,
      { method: 'DELETE', headers }
    );
    return this.handleResponse(res);
  }

  // ─── Course Reviews ────────────────────────────────────────────────────────
  
  static async submitReview(
    courseId: string,
    data: CourseReviewRequest
  ): Promise<ApiResponse<CourseReviewResponse>> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COURSES}/${courseId}/reviews`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return this.handleResponse(res);
  }

  static async updateReview(
    reviewId: string,
    data: CourseReviewRequest
  ): Promise<ApiResponse<CourseReviewResponse>> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COURSES}/reviews/${reviewId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    return this.handleResponse(res);
  }

  static async getCourseReviews(
    courseId: string, 
    page = 0, 
    size = 10,
    rating?: number
  ): Promise<ApiResponse<PaginatedResponse<CourseReviewResponse>>> {
    const url = new URL(`${API_BASE_URL}/courses/${courseId}/reviews`);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('size', size.toString());
    if (rating) url.searchParams.append('rating', rating.toString());

    const headers = await this.getHeaders();
    const response = await fetch(url.toString(), {
      headers,
    });
    return response.json();
  }

  static async getReviewSummary(courseId: string): Promise<ApiResponse<CourseReviewSummaryResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/reviews/summary`, {
      headers,
    });
    return response.json();
  }

  static async replyToReview(
    reviewId: string, 
    data: InstructorReplyRequest
  ): Promise<ApiResponse<CourseReviewResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/courses/reviews/${reviewId}/reply`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return response.json();
  }

  static async getRelatedCourses(
    courseId: string,
    page = 0,
    size = 10
  ): Promise<ApiResponse<PaginatedResponse<CourseResponse>>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/related?page=${page}&size=${size}`, {
      headers,
    });
    return response.json();
  }

  static async getTeacherCourses(teacherId: string): Promise<ApiResponse<CourseResponse[]>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/courses/teachers/${teacherId}/courses`, {
      headers,
    });
    return response.json();
  }

  static async getTeacherProfile(teacherId: string): Promise<ApiResponse<TeacherProfileResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/courses/teachers/${teacherId}/profile`, {
      headers,
    });
    return response.json();
  }

  static async deleteReview(reviewId: string): Promise<ApiResponse<string>> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COURSES}/reviews/${reviewId}`, {
      method: 'DELETE',
      headers,
    });
    return this.handleResponse(res);
  }

  static async getMyReview(courseId: string): Promise<ApiResponse<CourseReviewResponse>> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COURSES}/${courseId}/my-review`, {
      method: 'GET',
      headers,
    });
    return this.handleResponse(res);
  }
}
