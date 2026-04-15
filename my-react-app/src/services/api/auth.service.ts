import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import type {
  ApiResponse,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResult,
  ResetPasswordRequest,
  RoleSelectionRequest,
} from '../../types/auth.types';
import { ApiError } from '../../types/auth.types';

export class AuthService {
  private static async extractErrorMessage(response: Response, fallback: string): Promise<string> {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      try {
        const errorJson = await response.json();

        if (errorJson?.message) return String(errorJson.message);
        if (errorJson?.error) return String(errorJson.error);

        return fallback;
      } catch {
        return fallback;
      }
    }

    const errorText = await response.text();
    return errorText?.trim() || fallback;
  }

  /**
   * Register a new user
   */
  static async register(data: RegisterRequest): Promise<ApiResponse<RegisterResult>> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.REGISTER}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: '*/*',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          const errorJson = await response.json();
          if (typeof errorJson?.code === 'number') {
            throw new ApiError(errorJson.code, errorJson.message || 'Đăng ký thất bại');
          }
        } catch (e) {
          if (e instanceof ApiError) throw e;
        }
      }
      throw new ApiError(0, 'Đăng ký thất bại. Vui lòng thử lại.');
    }

    return response.json();
  }

  /**
   * Confirm email with token
   */
  static async confirmEmail(token: string): Promise<ApiResponse<null>> {
    const url = new URL(`${API_BASE_URL}${API_ENDPOINTS.CONFIRM_EMAIL}`, window.location.origin);
    url.searchParams.set('token', token);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { accept: '*/*' },
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          const errorJson = await response.json();
          if (typeof errorJson?.code === 'number') {
            throw new ApiError(errorJson.code, errorJson.message || 'Xác nhận email thất bại');
          }
        } catch (e) {
          if (e instanceof ApiError) throw e;
        }
      }
      throw new ApiError(0, 'Xác nhận email thất bại. Vui lòng thử lại.');
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
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          const errorJson = await response.json();
          if (typeof errorJson?.code === 'number') {
            throw new ApiError(errorJson.code, errorJson.message || 'Đăng nhập thất bại');
          }
        } catch (e) {
          if (e instanceof ApiError) throw e;
        }
      }
      const message = await this.extractErrorMessage(response, 'Đăng nhập thất bại');
      throw new ApiError(0, message);
    }

    return response.json();
  }

  /**
   * Login with Google
   */
  static async googleLogin(token: string): Promise<ApiResponse<LoginResponse>> {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: '*/*',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const message = await this.extractErrorMessage(response, 'Google Login failed');
      throw new Error(message);
    }

    return response.json();
  }

  /**
   * Send forgot-password email
   */
  static async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<null>> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FORGOT_PASSWORD}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: '*/*',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          const errorJson = await response.json();
          if (typeof errorJson?.code === 'number') {
            throw new ApiError(errorJson.code, errorJson.message || 'Gửi yêu cầu thất bại');
          }
        } catch (e) {
          if (e instanceof ApiError) throw e;
        }
      }
      throw new ApiError(0, 'Gửi yêu cầu thất bại. Vui lòng thử lại.');
    }

    return response.json();
  }

  /**
   * Reset password with token from email link
   */
  static async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<null>> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.RESET_PASSWORD}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: '*/*',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          const errorJson = await response.json();
          if (typeof errorJson?.code === 'number') {
            throw new ApiError(errorJson.code, errorJson.message || 'Đặt lại mật khẩu thất bại');
          }
        } catch (e) {
          if (e instanceof ApiError) throw e;
        }
      }
      throw new ApiError(0, 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
    }

    return response.json();
  }

  /**
   * Select user role
   */
  static async selectRole(data: RoleSelectionRequest): Promise<ApiResponse<LoginResponse>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${API_BASE_URL}/auth/select-role`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        accept: '*/*',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Role selection failed');
    }

    return response.json();
  }

  /**
   * Save token to localStorage
   */
  static saveToken(token: string, expiryTime: string): void {
    localStorage.setItem('authToken', token);
    localStorage.setItem('tokenExpiry', expiryTime);
    window.dispatchEvent(new Event('authChange'));
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
  ): { sub: string; scope: string; email: string; [key: string]: unknown } | null {
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
   * Get all user roles from token
   */
  static getUserRoles(): string[] {
    const token = this.getToken();
    if (!token) return [];

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.scope) return [];

    // scope can be a space-separated string containing roles and permissions
    // e.g., "ROLE_TEACHER VIEW_CONTENT EDIT_CONTENT"
    return decoded.scope
      .split(' ')
      .filter((s) => s.startsWith('ROLE_'))
      .map((s) => s.replace('ROLE_', '').toLowerCase());
  }

  /**
   * Get primary user role from token
   */
  static getUserRole(): string | null {
    const roles = this.getUserRoles();
    if (roles.length === 0) return null;

    // Prioritize admin > teacher > student/user
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('teacher')) return 'teacher';
    return roles[0];
  }

  /**
   * Check if user has a specific role
   */
  static hasRole(role: string): boolean {
    return this.getUserRoles().includes(role.toLowerCase());
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
