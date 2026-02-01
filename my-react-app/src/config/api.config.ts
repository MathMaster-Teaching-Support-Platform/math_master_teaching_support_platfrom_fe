// Sử dụng /api để đi qua Vite proxy (bypass CORS trong development)
// Trong production, thay đổi thành URL thật của backend
export const API_BASE_URL = import.meta.env.PROD
  ? 'http://localhost:8080' // Production URL
  : '/api'; // Development: sử dụng proxy

export const API_ENDPOINTS = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
};
