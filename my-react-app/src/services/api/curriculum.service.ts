import { API_BASE_URL } from '../../config/api.config';
import { AuthService } from './auth.service';
import type { ApiResponse } from '../../types';

export interface CurriculumItem {
  id: string;
  name: string;
  grade: number;
  category: string;
  description: string | null;
}

export class CurriculumService {
  private static async getHeaders() {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');
    return { Authorization: `Bearer ${token}`, accept: '*/*' };
  }

  static async getAllCurricula(): Promise<ApiResponse<CurriculumItem[]>> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/curriculums/all`, { method: 'GET', headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || 'Failed to fetch curricula');
    }
    return res.json();
  }
}
