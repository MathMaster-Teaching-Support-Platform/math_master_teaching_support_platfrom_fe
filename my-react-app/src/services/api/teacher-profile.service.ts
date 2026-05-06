import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import { translateApiError } from '../../utils/errorCodes';
import { AuthService } from './auth.service';
import type {
  ApiResponse,
  OcrComparisonResult,
  OcrJobResponse,
  OcrJobResult,
  PaginatedResponse,
  ProfileStatus,
  ReviewProfileRequest,
  SubmitTeacherProfileRequest,
  TeacherProfile,
  UpdateTeacherProfileRequest,
} from '../../types';

const AUTH_ERR = 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.';

export class TeacherProfileService {
  static async submitProfile(
    data: SubmitTeacherProfileRequest,
    files: File[]
  ): Promise<ApiResponse<TeacherProfile>> {
    const token = AuthService.getToken();
    if (!token) throw new Error(AUTH_ERR);

    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    files.forEach((file) => formData.append('files', file));

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TEACHER_PROFILES_SUBMIT}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(translateApiError(err.message, err.code));
    }
    return response.json();
  }

  static async getMyProfile(): Promise<ApiResponse<TeacherProfile>> {
    const token = AuthService.getToken();
    if (!token) throw new Error(AUTH_ERR);

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TEACHER_PROFILES_MY_PROFILE}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(translateApiError(err.message, err.code));
    }
    return response.json();
  }

  static async updateMyProfile(
    data: UpdateTeacherProfileRequest,
    files?: File[]
  ): Promise<ApiResponse<TeacherProfile>> {
    const token = AuthService.getToken();
    if (!token) throw new Error(AUTH_ERR);

    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (files?.length) files.forEach((file) => formData.append('files', file));

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TEACHER_PROFILES_MY_PROFILE}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(translateApiError(err.message, err.code));
    }
    return response.json();
  }

  static async deleteMyProfile(): Promise<ApiResponse<{ message: string }>> {
    const token = AuthService.getToken();
    if (!token) throw new Error(AUTH_ERR);

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TEACHER_PROFILES_MY_PROFILE}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(translateApiError(err.message, err.code));
    }
    return response.json();
  }

  static async getProfileById(profileId: string): Promise<ApiResponse<TeacherProfile>> {
    const token = AuthService.getToken();
    if (!token) throw new Error(AUTH_ERR);

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TEACHER_PROFILES}/${profileId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(translateApiError(err.message, err.code));
    }
    return response.json();
  }

  static async getProfilesByStatus(
    status: ProfileStatus,
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<PaginatedResponse<TeacherProfile>>> {
    const token = AuthService.getToken();
    if (!token) throw new Error(AUTH_ERR);

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.TEACHER_PROFILES_STATUS}/${status}?page=${page}&size=${size}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(translateApiError(err.message, err.code));
    }
    return response.json();
  }

  static async countPendingProfiles(): Promise<ApiResponse<number>> {
    const token = AuthService.getToken();
    if (!token) throw new Error(AUTH_ERR);

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.TEACHER_PROFILES_PENDING_COUNT}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(translateApiError(err.message, err.code));
    }
    return response.json();
  }

  static async reviewProfile(
    profileId: string,
    data: ReviewProfileRequest
  ): Promise<ApiResponse<TeacherProfile>> {
    const token = AuthService.getToken();
    if (!token) throw new Error(AUTH_ERR);

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
      const err = await response.json();
      throw new Error(translateApiError(err.message, err.code));
    }
    return response.json();
  }

  static async getDownloadUrl(profileId: string): Promise<ApiResponse<String>> {
    const token = AuthService.getToken();
    if (!token) throw new Error(AUTH_ERR);

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.TEACHER_PROFILES_DOWNLOAD(profileId)}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(translateApiError(err.message, err.code));
    }
    return response.json();
  }

  static async getVerificationDocumentBlob(profileId: string): Promise<Blob> {
    const token = AuthService.getToken();
    if (!token) throw new Error(AUTH_ERR);

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.TEACHER_PROFILES_DOWNLOAD_FILE(profileId)}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, accept: 'application/zip,*/*' },
      }
    );

    if (!response.ok) {
      throw new Error('Không thể tải tài liệu xác minh.');
    }
    return response.blob();
  }

  static async verifyProfileWithOcr(
    profileId: string
  ): Promise<ApiResponse<OcrJobResponse>> {
    const token = AuthService.getToken();
    if (!token) throw new Error(AUTH_ERR);

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.TEACHER_PROFILES_OCR_VERIFY(profileId)}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(translateApiError(err.message, err.code));
    }
    return response.json();
  }

  static async getOcrJobStatus(jobId: string): Promise<ApiResponse<OcrJobResult>> {
    const token = AuthService.getToken();
    if (!token) throw new Error(AUTH_ERR);

    const response = await fetch(
      `${API_BASE_URL}/teacher-profiles/ocr-jobs/${jobId}/status`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(translateApiError(err.message, err.code));
    }
    return response.json();
  }

  static async getOcrJobResult(jobId: string): Promise<ApiResponse<OcrComparisonResult>> {
    const token = AuthService.getToken();
    if (!token) throw new Error(AUTH_ERR);

    const response = await fetch(
      `${API_BASE_URL}/teacher-profiles/ocr-jobs/${jobId}/result`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(translateApiError(err.message, err.code));
    }
    return response.json();
  }

  static async pollOcrJobUntilComplete(
    jobId: string,
    onProgress?: (progress: number, status: string) => void,
    pollInterval: number = 2000,
    maxAttempts: number = 150
  ): Promise<OcrComparisonResult> {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const interval = setInterval(async () => {
        try {
          attempts++;

          if (attempts > maxAttempts) {
            clearInterval(interval);
            reject(new Error('Xác minh tự động quá thời gian chờ. Vui lòng thử lại.'));
            return;
          }

          const response = await this.getOcrJobStatus(jobId);
          const jobResult = response.result;

          if (onProgress) onProgress(jobResult.progress, jobResult.status);

          if (jobResult.status === 'COMPLETED') {
            clearInterval(interval);
            if (jobResult.result) {
              resolve(jobResult.result);
            } else {
              const resultResponse = await this.getOcrJobResult(jobId);
              resolve(resultResponse.result);
            }
          } else if (jobResult.status === 'FAILED') {
            clearInterval(interval);
            reject(new Error(translateApiError(jobResult.errorMessage)));
          } else if (jobResult.status === 'CANCELLED') {
            clearInterval(interval);
            reject(new Error('Xác minh tự động đã bị hủy.'));
          }
        } catch (error) {
          clearInterval(interval);
          reject(error);
        }
      }, pollInterval);
    });
  }

  static async reviewProfileWithOcr(
    profileId: string,
    data: ReviewProfileRequest,
    performOcr: boolean = true
  ): Promise<ApiResponse<TeacherProfile>> {
    const token = AuthService.getToken();
    if (!token) throw new Error(AUTH_ERR);

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
      const err = await response.json();
      throw new Error(translateApiError(err.message, err.code));
    }
    return response.json();
  }
}
