import { API_BASE_URL } from '../../config/api.config';
import { AuthService } from './auth.service';

export interface UserProfileResponse {
  id: string;
  userName: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
  avatar: string | null;
  dob: string | null;
  code: string | null;
  schoolGrades?: Array<{
    id: string;
    gradeLevel: number;
    name: string;
    description?: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  status: string;
  banReason: string | null;
  banDate: string | null;
  roles: string[];
  createdDate: string;
  createdBy: string | null;
  updatedDate: string | null;
  updatedBy: string | null;
}

export interface UpdateMyInfoRequest {
  fullName: string;
  email: string;
  phoneNumber?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  avatar?: string;
  dob?: string;
  schoolGradeIds?: string[];
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ApiWrapper<T> {
  code: number;
  message?: string;
  result: T;
}

export class UserService {
  private static authHeaders(): Record<string, string> {
    const token = AuthService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private static async handleResponse<T>(res: Response): Promise<T> {
    let data: ApiWrapper<T>;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Lỗi kết nối tới máy chủ (HTTP ${res.status})`);
    }
    if (data.code !== 1000) {
      throw new Error(data.message || `Lỗi hệ thống (code: ${data.code})`);
    }
    return data.result;
  }

  static async getMyInfo(): Promise<UserProfileResponse> {
    const res = await fetch(`${API_BASE_URL}/users/my-info`, {
      headers: this.authHeaders(),
    });
    return this.handleResponse<UserProfileResponse>(res);
  }

  static async updateMyInfo(payload: UpdateMyInfoRequest): Promise<UserProfileResponse> {
    const res = await fetch(`${API_BASE_URL}/users/my-info`, {
      method: 'PUT',
      headers: this.authHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse<UserProfileResponse>(res);
  }

  static async changePassword(payload: ChangePasswordRequest): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/users/change-password`, {
      method: 'PUT',
      headers: this.authHeaders(),
      body: JSON.stringify(payload),
    });
    await this.handleResponse<null>(res);
  }
}
