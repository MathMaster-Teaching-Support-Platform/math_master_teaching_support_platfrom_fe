import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import type {
  RegisterRequest,
  LoginRequest,
  ApiResponse,
  User,
  LoginResponse,
} from '../../types/auth.types';

export class AuthService {
  /**
   * Register a new user
   */
  static async register(data: RegisterRequest): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.REGISTER}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: '*/*',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return response.json();
  }

  /**
   * Login user
   */
  static async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOGIN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: '*/*',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  }

  /**
   * Save token to localStorage
   */
  static saveToken(token: string, expiryTime: string): void {
    localStorage.setItem('authToken', token);
    localStorage.setItem('tokenExpiry', expiryTime);
  }

  /**
   * Get token from localStorage
   */
  static getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Remove token from localStorage
   */
  static removeToken(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenExpiry');
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const token = this.getToken();
    const expiry = localStorage.getItem('tokenExpiry');

    if (!token || !expiry) {
      return false;
    }

    // Check if token is expired
    const expiryDate = new Date(expiry);
    return expiryDate > new Date();
  }

  /**
   * Decode JWT token to get user info
   */
  static decodeToken(
    token: string
  ): { sub: string; scope: string; email: string;[key: string]: unknown } | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Get user role from token
   */
  static getUserRole(): string | null {
    const token = this.getToken();
    if (!token) return null;

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.scope) return null;

    // scope can be a space-separated string containing roles and permissions
    // e.g., "ROLE_TEACHER VIEW_CONTENT EDIT_CONTENT"
    const scopes = decoded.scope.split(' ');
    const roleScope = scopes.find((s) => s.startsWith('ROLE_'));

    if (!roleScope) return null;

    const role = roleScope.replace('ROLE_', '').toLowerCase();
    return role;
  }

  /**
   * Get dashboard URL based on user role
   */
  static getDashboardUrl(): string {
    const role = this.getUserRole();

    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'teacher':
        return '/teacher/dashboard';
      case 'user':
      case 'student':
        return '/student/dashboard';
      default:
        return '/'; // fallback to homepage
    }
  }
}
