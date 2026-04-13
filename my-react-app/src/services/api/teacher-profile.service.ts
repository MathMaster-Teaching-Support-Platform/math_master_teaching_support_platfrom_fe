import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import { AuthService } from './auth.service';
import type {
  TeacherProfile,
  SubmitTeacherProfileRequest,
  UpdateTeacherProfileRequest,
  ReviewProfileRequest,
  ProfileStatus,
  OcrComparisonResult,
  OcrJobResponse,
  OcrJobResult,
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
    data: UpdateTeacherProfileRequest,
    files?: File[]
  ): Promise<ApiResponse<TeacherProfile>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('files', file);
      });
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TEACHER_PROFILES_MY_PROFILE}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        accept: '*/*',
      },
      body: formData,
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

  /**
   * Download verification document content via backend (Admin)
   */
  static async getVerificationDocumentBlob(profileId: string): Promise<Blob> {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.TEACHER_PROFILES_DOWNLOAD_FILE(profileId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          accept: 'application/zip,*/*',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to download verification document');
    }

    return response.blob();
  }

  /**
   * Verify profile with Gemini OCR (Admin) - Async
   * Returns job ID immediately for polling
   */
  static async verifyProfileWithOcr(
    profileId: string
  ): Promise<ApiResponse<OcrJobResponse>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.TEACHER_PROFILES_OCR_VERIFY(profileId)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          accept: '*/*',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to start OCR verification');
    }

    return response.json();
  }

  /**
   * Get OCR job status (Admin)
   */
  static async getOcrJobStatus(jobId: string): Promise<ApiResponse<OcrJobResult>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(
      `${API_BASE_URL}/teacher-profiles/ocr-jobs/${jobId}/status`,
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
      throw new Error(error.message || 'Failed to get job status');
    }

    return response.json();
  }

  /**
   * Get OCR job result (Admin)
   */
  static async getOcrJobResult(jobId: string): Promise<ApiResponse<OcrComparisonResult>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(
      `${API_BASE_URL}/teacher-profiles/ocr-jobs/${jobId}/result`,
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
      throw new Error(error.message || 'Failed to get job result');
    }

    return response.json();
  }

  /**
   * Poll OCR job until completion (Admin)
   * Helper method that polls the job status until it's completed or failed
   */
  static async pollOcrJobUntilComplete(
    jobId: string,
    onProgress?: (progress: number, status: string) => void,
    pollInterval: number = 2000,
    maxAttempts: number = 150 // 5 minutes max (150 * 2s)
  ): Promise<OcrComparisonResult> {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const interval = setInterval(async () => {
        try {
          attempts++;

          if (attempts > maxAttempts) {
            clearInterval(interval);
            reject(new Error('OCR job polling timeout - exceeded maximum attempts'));
            return;
          }

          const response = await this.getOcrJobStatus(jobId);
          const jobResult = response.result;

          // Update progress callback
          if (onProgress) {
            onProgress(jobResult.progress, jobResult.status);
          }

          // Check terminal states
          if (jobResult.status === 'COMPLETED') {
            clearInterval(interval);
            if (jobResult.result) {
              resolve(jobResult.result);
            } else {
              // Fetch full result if not included in status
              const resultResponse = await this.getOcrJobResult(jobId);
              resolve(resultResponse.result);
            }
          } else if (jobResult.status === 'FAILED') {
            clearInterval(interval);
            reject(new Error(jobResult.errorMessage || 'OCR verification failed'));
          } else if (jobResult.status === 'CANCELLED') {
            clearInterval(interval);
            reject(new Error('OCR verification was cancelled'));
          }
          // Continue polling for PENDING and PROCESSING states
        } catch (error) {
          clearInterval(interval);
          reject(error);
        }
      }, pollInterval);
    });
  }

  /**
   * Review profile with optional OCR verification (Admin)
   */
  static async reviewProfileWithOcr(
    profileId: string,
    data: ReviewProfileRequest,
    performOcr: boolean = true
  ): Promise<ApiResponse<TeacherProfile>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.TEACHER_PROFILES_REVIEW_WITH_OCR(profileId)}?performOcr=${performOcr}`,
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
      throw new Error(error.message || 'Failed to review profile with OCR');
    }

    return response.json();
  }
}
