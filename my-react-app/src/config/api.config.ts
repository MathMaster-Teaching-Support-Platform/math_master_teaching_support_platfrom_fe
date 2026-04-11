const normalizeUrl = (url?: string): string => {
  if (!url) return '';
  return url.trim().replace(/\/$/, '');
};

// Development: /api đi qua Vite proxy.
// Production: dùng VITE_API_BASE_URL để gọi backend đã deploy.
const envApiBaseUrl = normalizeUrl(import.meta.env.VITE_API_BASE_URL);

export const API_BASE_URL = import.meta.env.PROD ? envApiBaseUrl : envApiBaseUrl || '/api';

export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  CONFIRM_EMAIL: '/auth/confirm-email',

  // Users (self-service)
  USERS_MY_INFO: '/users/my-info',
  USERS_CHANGE_PASSWORD: '/users/change-password',
  USERS_BY_ID: (userId: string) => `/users/${userId}`,

  // Teacher Profiles
  TEACHER_PROFILES: '/teacher-profiles',
  TEACHER_PROFILES_SUBMIT: '/teacher-profiles/submit',
  TEACHER_PROFILES_MY_PROFILE: '/teacher-profiles/my-profile',
  TEACHER_PROFILES_STATUS: '/teacher-profiles/status',
  TEACHER_PROFILES_PENDING_COUNT: '/teacher-profiles/pending/count',
  TEACHER_PROFILES_REVIEW: (profileId: string) => `/teacher-profiles/${profileId}/review`,
  TEACHER_PROFILES_DOWNLOAD: (profileId: string) => `/teacher-profiles/${profileId}/download`,

  // Assessments
  ASSESSMENTS: '/assessments',
  ASSESSMENTS_MY: '/assessments/my',
  ASSESSMENTS_SEARCH: '/assessments/search',
  ASSESSMENTS_DETAIL: (id: string) => `/assessments/${id}`,
  ASSESSMENTS_PREVIEW: (id: string) => `/assessments/${id}/preview`,
  ASSESSMENTS_PUBLISH_SUMMARY: (id: string) => `/assessments/${id}/publish-summary`,
  ASSESSMENTS_PUBLISH: (id: string) => `/assessments/${id}/publish`,
  ASSESSMENTS_UNPUBLISH: (id: string) => `/assessments/${id}/unpublish`,
  ASSESSMENTS_POINTS_OVERRIDE: (assessmentId: string) =>
    `/assessments/${assessmentId}/points-override`,
  ASSESSMENTS_CAN_EDIT: (id: string) => `/assessments/${id}/can-edit`,
  ASSESSMENTS_CAN_DELETE: (id: string) => `/assessments/${id}/can-delete`,
  ASSESSMENTS_CAN_PUBLISH: (id: string) => `/assessments/${id}/can-publish`,
  ASSESSMENTS_CLOSE: (id: string) => `/assessments/${id}/close`,
  ASSESSMENTS_CLONE: (id: string) => `/assessments/${id}/clone`,
  ASSESSMENTS_GENERATE_FROM_MATRIX: '/assessments/generate-from-matrix',
  ASSESSMENTS_GENERATE: (assessmentId: string) => `/assessments/${assessmentId}/generate`,
  ASSESSMENTS_QUESTIONS: (assessmentId: string) => `/assessments/${assessmentId}/questions`,
  ASSESSMENTS_QUESTION_REMOVE: (assessmentId: string, questionId: string) =>
    `/assessments/${assessmentId}/questions/${questionId}`,

  // Exam matrices
  EXAM_MATRICES: '/exam-matrices',
  EXAM_MATRICES_MY: '/exam-matrices/my',
  EXAM_MATRIX_DETAIL: (matrixId: string) => `/exam-matrices/${matrixId}`,
  EXAM_MATRIX_BY_ASSESSMENT: (assessmentId: string) => `/exam-matrices/assessment/${assessmentId}`,
  EXAM_MATRIX_BUILD: '/exam-matrices/build',
  EXAM_MATRIX_TABLE: (matrixId: string) => `/exam-matrices/${matrixId}/table`,
  EXAM_MATRIX_ROWS: (matrixId: string) => `/exam-matrices/${matrixId}/rows`,
  EXAM_MATRIX_ROW_DETAIL: (matrixId: string, rowId: string) =>
    `/exam-matrices/${matrixId}/rows/${rowId}`,
  EXAM_MATRIX_VALIDATE: (matrixId: string) => `/exam-matrices/${matrixId}/validate`,
  EXAM_MATRIX_APPROVE: (matrixId: string) => `/exam-matrices/${matrixId}/approve`,
  EXAM_MATRIX_LOCK: (matrixId: string) => `/exam-matrices/${matrixId}/lock`,
  EXAM_MATRIX_RESET: (matrixId: string) => `/exam-matrices/${matrixId}/reset`,

  // Question banks
  QUESTION_BANKS: '/question-banks',
  QUESTION_BANKS_MY: '/question-banks/my',
  QUESTION_BANKS_SEARCH: '/question-banks/search',
  QUESTION_BANK_DETAIL: (id: string) => `/question-banks/${id}`,
  QUESTION_BANK_TEMPLATES: (id: string) => `/question-banks/${id}/templates`,
  QUESTION_BANK_TEMPLATE_MAP: (id: string, templateId: string) =>
    `/question-banks/${id}/templates/${templateId}`,
  QUESTION_BANK_TOGGLE_PUBLIC: (id: string) => `/question-banks/${id}/toggle-public`,
  QUESTION_BANK_CAN_EDIT: (id: string) => `/question-banks/${id}/can-edit`,
  QUESTION_BANK_CAN_DELETE: (id: string) => `/question-banks/${id}/can-delete`,

  // Questions
  QUESTIONS: '/questions',
  QUESTIONS_SEARCH: '/questions/search',
  QUESTIONS_BY_BANK: (bankId: string) => `/questions/bank/${bankId}`,
  QUESTIONS_BATCH_ASSIGN_TO_BANK: (bankId: string) => `/questions/bank/${bankId}/batch-assign`,
  QUESTIONS_BATCH_REMOVE_FROM_BANK: (bankId: string) => `/questions/bank/${bankId}/batch-remove`,
  QUESTIONS_BY_TEMPLATE: (templateId: string) => `/questions/template/${templateId}`,
  QUESTIONS_DETAIL: (questionId: string) => `/questions/${questionId}`,
  QUESTIONS_APPROVE: (questionId: string) => `/questions/${questionId}/approve`,
  QUESTIONS_BULK_APPROVE: '/questions/bulk-approve',

  // Mindmaps
  MINDMAPS: '/mindmaps',
  MINDMAPS_GENERATE: '/mindmaps/generate',
  MINDMAPS_MY: '/mindmaps/my-mindmaps',
  MINDMAPS_DETAIL: (id: string) => `/mindmaps/${id}`,
  MINDMAPS_PUBLIC_LIST: '/mindmaps/public',
  MINDMAPS_PUBLIC_DETAIL: (id: string) => `/mindmaps/public/${id}`,
  MINDMAPS_PUBLIC_BY_LESSON: (lessonId: string) => `/mindmaps/public/lesson/${lessonId}`,
  MINDMAPS_NODES: '/mindmaps/nodes',
  MINDMAPS_NODE_DETAIL: (nodeId: string) => `/mindmaps/nodes/${nodeId}`,

  // Lessons
  LESSONS: '/lessons',
  LESSON_DETAIL: (lessonId: string) => `/lessons/${lessonId}`,
  CHAPTER_LESSONS: (chapterId: string) => `/chapters/${chapterId}/lessons`,

  // Documents
  DOCUMENTS_SEARCH: '/documents/search',

  // Chapters
  CHAPTERS_BY_SUBJECT: (subjectId: string) => `/chapters/subject/${subjectId}`,

  // Subjects
  SUBJECTS: '/subjects',
  SUBJECTS_BY_GRADE: (gradeLevel: string) => `/subjects/grade/${gradeLevel}`,

  // Roadmaps
  ROADMAPS: '/student/roadmaps',
  ROADMAP_DETAIL: (roadmapId: string) => `/student/roadmaps/${roadmapId}`,
  ROADMAP_STUDENT: '/roadmaps/student',
  ROADMAP_STUDENT_DETAIL: (roadmapId: string) => `/roadmaps/${roadmapId}/student-progress`,
  ROADMAP_PROGRESS: (roadmapId: string) => `/roadmaps/${roadmapId}/progress`,
  ROADMAP_ENTRY_TEST: (roadmapId: string) => `/student/roadmaps/${roadmapId}/entry-test`,
  ROADMAP_ENTRY_TEST_START: (roadmapId: string) =>
    `/student/roadmaps/${roadmapId}/entry-test/start`,
  ROADMAP_ENTRY_TEST_ACTIVE_ATTEMPT: (roadmapId: string) =>
    `/student/roadmaps/${roadmapId}/entry-test/active-attempt`,
  ROADMAP_ENTRY_TEST_ANSWER: (roadmapId: string, attemptId: string) =>
    `/student/roadmaps/${roadmapId}/entry-test/attempts/${attemptId}/answers`,
  ROADMAP_ENTRY_TEST_FLAG: (roadmapId: string, attemptId: string) =>
    `/student/roadmaps/${roadmapId}/entry-test/attempts/${attemptId}/flags`,
  ROADMAP_ENTRY_TEST_SNAPSHOT: (roadmapId: string, attemptId: string) =>
    `/student/roadmaps/${roadmapId}/entry-test/attempts/${attemptId}/snapshot`,
  ROADMAP_ENTRY_TEST_SAVE_EXIT: (roadmapId: string, attemptId: string) =>
    `/student/roadmaps/${roadmapId}/entry-test/attempts/${attemptId}/save-exit`,
  ROADMAP_ENTRY_TEST_FINISH: (roadmapId: string, attemptId: string) =>
    `/student/roadmaps/${roadmapId}/entry-test/attempts/${attemptId}/finish`,
  ROADMAP_ENTRY_TEST_SUBMIT: (roadmapId: string) =>
    `/student/roadmaps/${roadmapId}/entry-test/submit`,
  STUDENT_ROADMAP_FEEDBACK: (roadmapId: string) => `/student/roadmaps/${roadmapId}/feedback`,
  STUDENT_ROADMAP_FEEDBACK_ME: (roadmapId: string) => `/student/roadmaps/${roadmapId}/feedback/me`,
  STUDENT_TOPIC_MATERIALS: (topicId: string) => `/student/roadmaps/topics/${topicId}/materials`,
  STUDENT_TOPIC_MATERIALS_BY_TYPE: (topicId: string, resourceType: string) =>
    `/student/roadmaps/topics/${topicId}/materials-by-type?resourceType=${resourceType}`,
  ADMIN_ROADMAPS: '/admin/roadmaps',
  ADMIN_ROADMAP_DETAIL: (roadmapId: string) => `/admin/roadmaps/${roadmapId}`,
  ADMIN_ROADMAP_TOPICS: (roadmapId: string) => `/admin/roadmaps/${roadmapId}/topics`,
  ADMIN_ROADMAP_TOPIC_DETAIL: (roadmapId: string, topicId: string) =>
    `/admin/roadmaps/${roadmapId}/topics/${topicId}`,
  ADMIN_ROADMAP_RESOURCE_OPTIONS: '/admin/roadmaps/resource-options',
  ADMIN_ROADMAP_FEEDBACK: (roadmapId: string) => `/admin/roadmaps/${roadmapId}/feedback`,
  ADMIN_ROADMAP_ENTRY_TEST: (roadmapId: string) => `/admin/roadmaps/${roadmapId}/entry-test`,

  // Lesson slide generator flow
  SCHOOL_GRADES: '/school-grades',
  SUBJECTS_BY_SCHOOL_GRADE: (schoolGradeId: string) => `/subjects/school-grade/${schoolGradeId}`,
  LESSONS_BY_CHAPTER: (chapterId: string) => `/lessons/chapters/${chapterId}/lessons`,
  LESSON_SLIDES_TEMPLATES: '/lesson-slides/templates',
  LESSON_SLIDES_GENERATE_CONTENT: '/lesson-slides/generate-content',
  LESSON_SLIDES_GENERATE_PPTX: '/lesson-slides/generate-pptx-from-json',

  // Lesson Plans (Giáo án)
  LESSON_PLANS: '/lesson-plans',
  LESSON_PLANS_MY: '/lesson-plans/my',
  LESSON_PLAN_DETAIL: (id: string) => `/lesson-plans/${id}`,
  LESSON_PLAN_MY_BY_LESSON: (lessonId: string) => `/lesson-plans/my/lesson/${lessonId}`,
  LESSON_PLANS_BY_LESSON: (lessonId: string) => `/lesson-plans/lesson/${lessonId}`,

  // Video Upload (Multipart)
  COURSE_VIDEO_UPLOAD_INITIATE: (courseId: string) =>
    `/courses/${courseId}/lessons/upload/initiate`,
  COURSE_VIDEO_UPLOAD_PART_URL: (courseId: string) =>
    `/courses/${courseId}/lessons/upload/part-url`,
  COURSE_VIDEO_UPLOAD_PART: (courseId: string) => `/courses/${courseId}/lessons/upload/upload-part`,
  COURSE_VIDEO_UPLOAD_COMPLETE: (courseId: string) =>
    `/courses/${courseId}/lessons/upload/complete`,
  COURSE_VIDEO_URL: (courseId: string, courseLessonId: string) =>
    `/courses/${courseId}/lessons/upload/${courseLessonId}/video-url`,

  // Wallet
  WALLET_MY: '/wallet/my-wallet',
  WALLET_TRANSACTIONS: '/wallet/transactions',
  WALLET_TRANSACTIONS_BY_STATUS: (status: string) => `/wallet/transactions/status/${status}`,

  // Payment
  PAYMENT_DEPOSIT: '/payment/deposit',

  // Notifications
  NOTIFICATIONS_TOKEN: '/v1/notifications/token',
  NOTIFICATIONS: '/v1/notifications',
  NOTIFICATIONS_UNREAD_COUNT: '/v1/notifications/unread-count',
  NOTIFICATIONS_READ_ALL: '/v1/notifications/read-all',
  NOTIFICATIONS_MARK_READ: (id: string) => `/v1/notifications/${id}/read`,

  // Chat sessions
  CHAT_SESSIONS: '/chat-sessions',
  CHAT_SESSION_DETAIL: (sessionId: string) => `/chat-sessions/${sessionId}`,
  CHAT_SESSION_MESSAGES: (sessionId: string) => `/chat-sessions/${sessionId}/messages`,
  CHAT_SESSION_ARCHIVE: (sessionId: string) => `/chat-sessions/${sessionId}/archive`,
  CHAT_SESSION_MEMORY: (sessionId: string) => `/chat-sessions/${sessionId}/memory`,

  // Question templates
  QUESTION_TEMPLATES: '/question-templates',
  QUESTION_TEMPLATES_MY: '/question-templates/my',
  QUESTION_TEMPLATES_SEARCH: '/question-templates/search',
  QUESTION_TEMPLATE_DETAIL: (id: string) => `/question-templates/${id}`,
  QUESTION_TEMPLATE_TOGGLE_PUBLIC: (id: string) => `/question-templates/${id}/toggle-public`,
  QUESTION_TEMPLATE_PUBLISH: (id: string) => `/question-templates/${id}/publish`,
  QUESTION_TEMPLATE_ARCHIVE: (id: string) => `/question-templates/${id}/archive`,
  QUESTION_TEMPLATE_TEST: (id: string) => `/question-templates/${id}/test`,
  QUESTION_TEMPLATE_GENERATE_QUESTIONS: (id: string) =>
    `/question-templates/${id}/generate-questions`,
  QUESTION_TEMPLATE_GENERATE_AI_ENHANCED: (id: string) =>
    `/question-templates/${id}/generate-ai-enhanced`,
  QUESTION_TEMPLATE_AI_GENERATE_FROM_LESSON: '/question-templates/ai-generate-from-lesson',
  QUESTION_TEMPLATE_IMPORT_FROM_FILE: '/question-templates/import-from-file',

  // Canonical questions
  CANONICAL_QUESTIONS: '/canonical-questions',
  CANONICAL_QUESTIONS_MY: '/canonical-questions/my',
  CANONICAL_QUESTION_DETAIL: (id: string) => `/canonical-questions/${id}`,
  CANONICAL_QUESTION_QUESTIONS: (id: string) => `/canonical-questions/${id}/questions`,
  CANONICAL_QUESTION_GENERATE_QUESTIONS: (id: string) =>
    `/canonical-questions/${id}/generate-questions`,

  // Latex render via backend proxy (QuickLaTeX)
  LATEX_RENDER: '/latex/render',

  // Courses
  COURSES: '/courses',
  COURSES_MY: '/courses/my',
  COURSE_DETAIL: (courseId: string) => `/courses/${courseId}`,
  COURSE_PUBLISH: (courseId: string) => `/courses/${courseId}/publish`,
  COURSE_STUDENTS: (courseId: string) => `/courses/${courseId}/students`,
  COURSE_LESSONS: (courseId: string) => `/courses/${courseId}/lessons`,
  COURSE_LESSON_DETAIL: (courseId: string, lessonId: string) =>
    `/courses/${courseId}/lessons/${lessonId}`,

  // Enrollments
  COURSE_ENROLL: (courseId: string) => `/courses/${courseId}/enroll`,
  ENROLLMENTS_MY: '/enrollments/my',
  ENROLLMENT_DROP: (enrollmentId: string) => `/enrollments/${enrollmentId}`,

  // Progress
  ENROLLMENT_LESSON_COMPLETE: (enrollmentId: string, courseLessonId: string) =>
    `/enrollments/${enrollmentId}/lessons/${courseLessonId}/complete`,
  ENROLLMENT_PROGRESS: (enrollmentId: string) => `/enrollments/${enrollmentId}/progress`,

  // Student Assessments
  STUDENT_ASSESSMENTS_MY: '/student-assessments/my',
  STUDENT_ASSESSMENTS_DETAIL: (assessmentId: string) => `/student-assessments/${assessmentId}`,
  STUDENT_ASSESSMENTS_START: '/student-assessments/start',
  STUDENT_ASSESSMENTS_UPDATE_ANSWER: '/student-assessments/update-answer',
  STUDENT_ASSESSMENTS_UPDATE_FLAG: '/student-assessments/update-flag',
  STUDENT_ASSESSMENTS_SUBMIT: '/student-assessments/submit',
  STUDENT_ASSESSMENTS_DRAFT_SNAPSHOT: (attemptId: string) =>
    `/student-assessments/draft/${attemptId}`,
  STUDENT_ASSESSMENTS_SAVE_AND_EXIT: '/student-assessments/save-and-exit',

  // Admin User Management
  ADMIN_USERS: '/admin/users',
  ADMIN_USERS_BY_ID: (userId: string) => `/admin/users/${userId}`,
  ADMIN_USERS_STATUS: (userId: string) => `/admin/users/${userId}/status`,
  ADMIN_USERS_RESET_PASSWORD: (userId: string) => `/admin/users/${userId}/reset-password`,
  ADMIN_USERS_SEND_EMAIL: (userId: string) => `/admin/users/${userId}/send-email`,
  ADMIN_USERS_EXPORT: '/admin/users/export',
  USERS_CREATE: '/users',
  USERS_UPDATE: (userId: string) => `/users/${userId}`,
  USERS_DELETE: (userId: string) => `/users/${userId}`,
  USERS_ENABLE: (userId: string) => `/users/${userId}/enable`,
  USERS_DISABLE: (userId: string) => `/users/${userId}/disable`,

  // Admin Subscription Plans
  ADMIN_SUBSCRIPTION_PLANS: '/admin/subscription-plans',
  ADMIN_SUBSCRIPTION_PLAN_DETAIL: (planId: string) => `/admin/subscription-plans/${planId}`,
  ADMIN_SUBSCRIPTION_PLANS_STATS: '/admin/subscription-plans/stats',
  ADMIN_SUBSCRIPTION_PLANS_SUBSCRIPTIONS: '/admin/subscription-plans/subscriptions',

  // Admin Dashboard
  ADMIN_DASHBOARD_STATS: '/admin/dashboard/stats',
  ADMIN_USERS_RECENT: '/users/admin/recent',
  ADMIN_TRANSACTIONS: '/admin/transactions',
  ADMIN_DASHBOARD_REVENUE_BY_MONTH: '/admin/dashboard/revenue-by-month',
  ADMIN_DASHBOARD_QUICK_STATS: '/admin/dashboard/quick-stats',
  ADMIN_SYSTEM_STATUS: '/admin/system/status',

  // Grading
  GRADING_QUEUE: '/grading/queue',
  GRADING_QUEUE_BY_TEACHER: '/grading/queue/my',
  GRADING_SUBMISSION: (submissionId: string) => `/grading/submissions/${submissionId}`,
  GRADING_COMPLETE: '/grading/complete',
  GRADING_OVERRIDE: '/grading/override',
  GRADING_MANUAL_ADJUSTMENT: '/grading/manual-adjustment',
  GRADING_ANALYTICS: (assessmentId: string) => `/grading/analytics/${assessmentId}`,
  GRADING_EXPORT: (assessmentId: string) => `/grading/export/${assessmentId}`,
  GRADING_RELEASE: (assessmentId: string) => `/grading/release/${assessmentId}`,
  GRADING_RELEASE_SUBMISSION: (submissionId: string) =>
    `/grading/release/submission/${submissionId}`,
  GRADING_REGRADE_REQUEST: '/grading/regrade-request',
  GRADING_REGRADE_RESPOND: '/grading/regrade-request/respond',
  GRADING_REGRADE_REQUESTS: '/grading/regrade-requests',
  GRADING_REGRADE_REQUESTS_STUDENT: '/grading/regrade-requests/my',
  GRADING_INVALIDATE: (submissionId: string) => `/grading/invalidate/${submissionId}`,
  GRADING_MY_RESULT: (assessmentId: string) => `/grading/my-result/${assessmentId}`,
  GRADING_AI_REVIEW: (answerId: string) => `/grading/ai-review/${answerId}`,
};
