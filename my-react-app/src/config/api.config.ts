// Sử dụng /api để đi qua Vite proxy (bypass CORS trong development)
// Trong production, thay đổi thành URL thật của backend
export const API_BASE_URL = import.meta.env.PROD
  ? 'http://localhost:8080/api' // Production URL
  : '/api'; // Development: sử dụng proxy

export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',

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
  ASSESSMENTS_QUESTIONS: (assessmentId: string) => `/assessments/${assessmentId}/questions`,
  ASSESSMENTS_QUESTION_REMOVE: (assessmentId: string, questionId: string) =>
    `/assessments/${assessmentId}/questions/${questionId}`,

  // Exam matrices
  EXAM_MATRICES: '/exam-matrices',
  EXAM_MATRICES_MY: '/exam-matrices/my',
  EXAM_MATRIX_DETAIL: (matrixId: string) => `/exam-matrices/${matrixId}`,
  EXAM_MATRIX_BY_ASSESSMENT: (assessmentId: string) => `/exam-matrices/assessment/${assessmentId}`,
  EXAM_MATRIX_MAPPINGS: (matrixId: string) => `/exam-matrices/${matrixId}/template-mappings`,
  EXAM_MATRIX_MAPPING_DETAIL: (matrixId: string, mappingId: string) =>
    `/exam-matrices/${matrixId}/template-mappings/${mappingId}`,
  EXAM_MATRIX_VALIDATE: (matrixId: string) => `/exam-matrices/${matrixId}/validate`,
  EXAM_MATRIX_APPROVE: (matrixId: string) => `/exam-matrices/${matrixId}/approve`,
  EXAM_MATRIX_LOCK: (matrixId: string) => `/exam-matrices/${matrixId}/lock`,
  EXAM_MATRIX_RESET: (matrixId: string) => `/exam-matrices/${matrixId}/reset`,
  EXAM_MATRIX_MATCHING_TEMPLATES: (matrixId: string) =>
    `/exam-matrices/${matrixId}/matching-templates`,
  EXAM_MATRIX_GENERATE_PREVIEW: (matrixId: string, mappingId: string) =>
    `/exam-matrices/${matrixId}/template-mappings/${mappingId}/generate-preview`,
  EXAM_MATRIX_FINALIZE_PREVIEW: (matrixId: string, mappingId: string) =>
    `/exam-matrices/${matrixId}/template-mappings/${mappingId}/finalize`,

  // Question banks
  QUESTION_BANKS: '/question-banks',
  QUESTION_BANKS_MY: '/question-banks/my',
  QUESTION_BANKS_SEARCH: '/question-banks/search',
  QUESTION_BANK_DETAIL: (id: string) => `/question-banks/${id}`,
  QUESTION_BANK_TOGGLE_PUBLIC: (id: string) => `/question-banks/${id}/toggle-public`,
  QUESTION_BANK_CAN_EDIT: (id: string) => `/question-banks/${id}/can-edit`,
  QUESTION_BANK_CAN_DELETE: (id: string) => `/question-banks/${id}/can-delete`,

  // Questions
  QUESTIONS_BY_BANK: (bankId: string) => `/questions/bank/${bankId}`,

  // Mindmaps
  MINDMAPS: '/mindmaps',
  MINDMAPS_GENERATE: '/mindmaps/generate',
  MINDMAPS_MY: '/mindmaps/my-mindmaps',
  MINDMAPS_DETAIL: (id: string) => `/mindmaps/${id}`,
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
  ROADMAP_ENTRY_TEST_SUBMIT: (roadmapId: string) =>
    `/student/roadmaps/${roadmapId}/entry-test/submit`,
  STUDENT_ROADMAP_FEEDBACK: (roadmapId: string) => `/student/roadmaps/${roadmapId}/feedback`,
  STUDENT_ROADMAP_FEEDBACK_ME: (roadmapId: string) =>
    `/student/roadmaps/${roadmapId}/feedback/me`,
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
  QUESTION_TEMPLATE_GENERATE_AI_ENHANCED: (id: string) => `/question-templates/${id}/generate-ai-enhanced`,
  QUESTION_TEMPLATE_AI_GENERATE_FROM_LESSON: '/question-templates/ai-generate-from-lesson',
  QUESTION_TEMPLATE_IMPORT_FROM_FILE: '/question-templates/import-from-file',
};
