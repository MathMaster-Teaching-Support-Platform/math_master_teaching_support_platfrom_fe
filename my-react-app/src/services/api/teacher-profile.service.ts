import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import { AuthService } from './auth.service';
import type {
  TeacherProfile,
  SubmitTeacherProfileRequest,
  UpdateTeacherProfileRequest,
  ReviewProfileRequest,
  ProfileStatus,
  ApiResponse,
  PaginatedResponse,
} from '../../types';

export class TeacherProfileService {
  /**
   * Submit teacher profile (Student)
   */
  static async submitProfile(
    data: SubmitTeacherProfileRequest,
    files: File[]
  ): Promise<ApiResponse<TeacherProfile>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    const formData = new FormData();
    // Wrap the request data in a Blob with application/json type for @RequestPart
    formData.append('request', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    
    // Append each file as 'files' to match @RequestPart("files")
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TEACHER_PROFILES_SUBMIT}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        accept: '*/*',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit profile');
    }

    return response.json();
  }

  /**
   * Get my profile (Student/Teacher)
   */
  static async getMyProfile(): Promise<ApiResponse<TeacherProfile>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TEACHER_PROFILES_MY_PROFILE}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        accept: '*/*',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch profile');
    }

    return response.json();
  }

  /**
   * Update my profile (Student)
   */
  static async updateMyProfile(
    data: UpdateTeacherProfileRequest
  ): Promise<ApiResponse<TeacherProfile>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TEACHER_PROFILES_MY_PROFILE}`, {
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
      throw new Error(error.message || 'Failed to update profile');
    }

    return response.json();
  }

  /**
   * Delete my profile (Student)
   */
  static async deleteMyProfile(): Promise<ApiResponse<{ message: string }>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TEACHER_PROFILES_MY_PROFILE}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        accept: '*/*',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete profile');
    }

    return response.json();
  }

  /**
   * Get profile by ID (Admin)
   */
  static async getProfileById(profileId: string): Promise<ApiResponse<TeacherProfile>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TEACHER_PROFILES}/${profileId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        accept: '*/*',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch profile');
    }

    return response.json();
  }

  /**
   * Get profiles by status (Admin)
   */
  static async getProfilesByStatus(
    status: ProfileStatus,
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<PaginatedResponse<TeacherProfile>>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.TEACHER_PROFILES_STATUS}/${status}?page=${page}&size=${size}`,
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
      throw new Error(error.message || 'Failed to fetch profiles');
    }

    return response.json();
  }

  /**
   * Count pending profiles (Admin)
   */
  static async countPendingProfiles(): Promise<ApiResponse<number>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TEACHER_PROFILES_PENDING_COUNT}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        accept: '*/*',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to count pending profiles');
    }

    return response.json();
  }

  /**
   * Review profile (Admin)
   */
  static async reviewProfile(
    profileId: string,
    data: ReviewProfileRequest
  ): Promise<ApiResponse<TeacherProfile>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.TEACHER_PROFILES_REVIEW(profileId)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          accept: '*/*',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to review profile');
    }

    return response.json();
  }

  /**
   * Get download URL for verification document (Admin)
   */
  static async getDownloadUrl(profileId: string): Promise<ApiResponse<String>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TEACHER_PROFILES_DOWNLOAD(profileId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        accept: '*/*',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get download URL');
    }

    return response.json();
  }
}
