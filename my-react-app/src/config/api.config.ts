// Sử dụng /api để đi qua Vite proxy (bypass CORS trong development)
// Trong production, thay đổi thành URL thật của backend
export const API_BASE_URL = import.meta.env.PROD
  ? 'http://localhost:8080' // Production URL
  : '/api'; // Development: sử dụng proxy

export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',

  // Schools
  SCHOOLS: '/schools',
  SCHOOLS_ALL: '/schools/all',
  SCHOOLS_SEARCH: '/schools/search',

  // Teacher Profiles
  TEACHER_PROFILES: '/teacher-profiles',
  TEACHER_PROFILES_SUBMIT: '/teacher-profiles/submit',
  TEACHER_PROFILES_MY_PROFILE: '/teacher-profiles/my-profile',
  TEACHER_PROFILES_STATUS: '/teacher-profiles/status',
  TEACHER_PROFILES_PENDING_COUNT: '/teacher-profiles/pending/count',
  TEACHER_PROFILES_REVIEW: (profileId: number) => `/teacher-profiles/${profileId}/review`,

  // Assessments
  ASSESSMENTS: '/assessments',
  ASSESSMENTS_MY: '/assessments/my',
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
  QUESTIONS_BY_BANK: (bankId: string) => `/api/questions/bank/${bankId}`,

  // Mindmaps
  MINDMAPS: '/mindmaps',
  MINDMAPS_GENERATE: '/mindmaps/generate',
  MINDMAPS_MY: '/mindmaps/my-mindmaps',
  MINDMAPS_DETAIL: (id: string) => `/mindmaps/${id}`,
  MINDMAPS_NODES: (mindmapId: string) => `/mindmaps/${mindmapId}/nodes`,
  MINDMAPS_NODE_DETAIL: (mindmapId: string, nodeId: string) =>
    `/mindmaps/${mindmapId}/nodes/${nodeId}`,

  // Lessons
  LESSONS: '/lessons',
  LESSON_DETAIL: (lessonId: string) => `/lessons/${lessonId}`,

  // Wallet
  WALLET_MY: '/wallet/my-wallet',
  WALLET_TRANSACTIONS: '/wallet/transactions',
  WALLET_TRANSACTIONS_BY_STATUS: (status: string) => `/wallet/transactions/status/${status}`,

  // Payment
  PAYMENT_DEPOSIT: '/payment/deposit',
};
