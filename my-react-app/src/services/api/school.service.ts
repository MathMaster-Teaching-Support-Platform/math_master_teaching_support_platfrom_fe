import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import { AuthService } from './auth.service';
import type {
  School,
  CreateSchoolRequest,
  UpdateSchoolRequest,
  ApiResponse,
  PaginatedResponse,
} from '../../types';

export class SchoolService {
  /**
   * Get all schools without pagination (for dropdown)
   */
  static async getAllSchools(): Promise<ApiResponse<School[]>> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SCHOOLS_ALL}`, {
      method: 'GET',
      headers: {
        accept: '*/*',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch schools');
    }

    return response.json();
  }

  /**
   * Get schools with pagination
   */
  static async getSchools(
    page: number = 0,
    size: number = 20
  ): Promise<ApiResponse<PaginatedResponse<School>>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.SCHOOLS}?page=${page}&size=${size}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          accept: '*/*',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch schools');
    }

    return response.json();
  }

  /**
   * Search schools by name
   */
  static async searchSchools(name: string): Promise<ApiResponse<School[]>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.SCHOOLS_SEARCH}?name=${encodeURIComponent(name)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          accept: '*/*',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to search schools');
    }

    return response.json();
  }

  /**
   * Get school by ID
   */
  static async getSchoolById(schoolId: number): Promise<ApiResponse<School>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SCHOOLS}/${schoolId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        accept: '*/*',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch school');
    }

    return response.json();
  }

  /**
   * Create school (Admin only)
   */
  static async createSchool(data: CreateSchoolRequest): Promise<ApiResponse<School>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SCHOOLS}`, {
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
      throw new Error(error.message || 'Failed to create school');
    }

    return response.json();
  }

  /**
   * Update school (Admin only)
   */
  static async updateSchool(
    schoolId: number,
    data: UpdateSchoolRequest
  ): Promise<ApiResponse<School>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SCHOOLS}/${schoolId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        accept: '*/*',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update school');
    }

    return response.json();
  }

  /**
   * Delete school (Admin only)
   */
  static async deleteSchool(schoolId: number): Promise<ApiResponse<void>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SCHOOLS}/${schoolId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        accept: '*/*',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete school');
    }

    return response.json();
  }
}
