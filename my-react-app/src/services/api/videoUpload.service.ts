import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import { AuthService } from './auth.service';
import type { ApiResponse } from '../../types';
import type { CourseLessonResponse } from '../../types/course.types';

export interface InitiateUploadResponse {
  uploadId: string;
  objectKey: string;
}

export interface PartUploadUrlResponse {
  presignedUrl: string;
  partNumber: number;
}

export interface PartInfo {
  partNumber: number;
  eTag: string;
}

export interface CompleteUploadPayload {
  uploadId: string;
  objectKey: string;
  parts: PartInfo[];
  lessonId: string;
  videoTitle?: string;
  orderIndex?: number;
  isFreePreview?: boolean;
  durationSeconds?: number;
  materials?: string;
}

export interface UploadProgressCallback {
  onProgress: (percent: number) => void;
  onChunkComplete: (partNumber: number, total: number) => void;
}

const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB per chunk

export class VideoUploadService {
  private static async getHeaders() {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', accept: '*/*' };
  }

  private static async handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || 'Request failed');
    }
    return res.json();
  }

  /** Step 1: Initiate multipart upload */
  static async initiateUpload(
    courseId: string,
    fileName: string,
    contentType: string
  ): Promise<ApiResponse<InitiateUploadResponse>> {
    const headers = await this.getHeaders();
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.COURSE_VIDEO_UPLOAD_INITIATE(courseId)}`,
      { method: 'POST', headers, body: JSON.stringify({ fileName, contentType }) }
    );
    return this.handleResponse(res);
  }

  /** Step 2: Get presigned URL for a specific chunk */
  static async getPartUploadUrl(
    courseId: string,
    uploadId: string,
    objectKey: string,
    partNumber: number
  ): Promise<ApiResponse<PartUploadUrlResponse>> {
    const headers = await this.getHeaders();
    const qs = new URLSearchParams({ uploadId, objectKey, partNumber: String(partNumber) });
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.COURSE_VIDEO_UPLOAD_PART_URL(courseId)}?${qs}`,
      { method: 'GET', headers }
    );
    return this.handleResponse(res);
  }

  /** Step 3: Complete multipart upload and save CourseLesson */
  static async completeUpload(
    courseId: string,
    payload: CompleteUploadPayload
  ): Promise<ApiResponse<CourseLessonResponse>> {
    const headers = await this.getHeaders();
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.COURSE_VIDEO_UPLOAD_COMPLETE(courseId)}`,
      { method: 'POST', headers, body: JSON.stringify(payload) }
    );
    return this.handleResponse(res);
  }

  /** Get presigned URL to stream a video */
  static async getVideoUrl(
    courseId: string,
    courseLessonId: string
  ): Promise<ApiResponse<string>> {
    const headers = await this.getHeaders();
    const res = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.COURSE_VIDEO_URL(courseId, courseLessonId)}`,
      { method: 'GET', headers }
    );
    return this.handleResponse(res);
  }

  /**
   * Full multipart upload flow:
   * 1. Initiate → 2. Upload chunks with presigned URLs → 3. Complete
   */
  static async uploadVideo(
    courseId: string,
    file: File,
    metadata: Omit<CompleteUploadPayload, 'uploadId' | 'objectKey' | 'parts'>,
    callbacks?: UploadProgressCallback
  ): Promise<CourseLessonResponse> {
    // Step 1
    const initiateRes = await this.initiateUpload(courseId, file.name, file.type);
    const { uploadId, objectKey } = initiateRes.result;

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const parts: PartInfo[] = [];

    // Step 2: Upload each chunk
    for (let i = 0; i < totalChunks; i++) {
      const partNumber = i + 1;
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      // Get presigned URL for this chunk
      const urlRes = await this.getPartUploadUrl(courseId, uploadId, objectKey, partNumber);
      const { presignedUrl } = urlRes.result;

      // Upload chunk directly to MinIO
      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        body: chunk,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadRes.ok) {
        throw new Error(`Failed to upload chunk ${partNumber}`);
      }

      // ETag is returned in response header
      const eTag = uploadRes.headers.get('ETag') ?? uploadRes.headers.get('etag') ?? '';
      parts.push({ partNumber, eTag: eTag.replace(/"/g, '') });

      const percent = Math.round((partNumber / totalChunks) * 100);
      callbacks?.onProgress(percent);
      callbacks?.onChunkComplete(partNumber, totalChunks);
    }

    // Step 3: Complete
    const completeRes = await this.completeUpload(courseId, {
      uploadId,
      objectKey,
      parts,
      ...metadata,
    });

    return completeRes.result;
  }
}
