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
};
