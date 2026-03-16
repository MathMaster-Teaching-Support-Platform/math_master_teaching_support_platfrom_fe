import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import type {
  AdminRoadmapPayload,
  RoadmapApiResponse,
  RoadmapCatalogItem,
  RoadmapDetail,
  StudentRoadmapSnapshot,
  UpdateRoadmapProgressRequest,
} from '../../types';
import { AuthService } from './auth.service';

export class RoadmapService {
  private static async getHeaders() {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      accept: '*/*',
    };
  }

  static async getRoadmaps(): Promise<RoadmapApiResponse<RoadmapCatalogItem[]>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ROADMAPS}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { message?: string }).message || 'Failed to fetch roadmaps');
    }

    return response.json();
  }

  static async getRoadmapDetail(roadmapId: string): Promise<RoadmapApiResponse<RoadmapDetail>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ROADMAP_DETAIL(roadmapId)}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { message?: string }).message || 'Failed to fetch roadmap detail');
    }

    return response.json();
  }

  static async getStudentRoadmap(
    roadmapId?: string
  ): Promise<RoadmapApiResponse<StudentRoadmapSnapshot>> {
    const headers = await this.getHeaders();
    const endpoint = roadmapId
      ? API_ENDPOINTS.ROADMAP_STUDENT_DETAIL(roadmapId)
      : API_ENDPOINTS.ROADMAP_STUDENT;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { message?: string }).message || 'Failed to fetch student roadmap');
    }

    return response.json();
  }

  static async updateRoadmapProgress(
    roadmapId: string,
    data: UpdateRoadmapProgressRequest
  ): Promise<RoadmapApiResponse<StudentRoadmapSnapshot>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ROADMAP_PROGRESS(roadmapId)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { message?: string }).message || 'Failed to update progress');
    }

    return response.json();
  }

  static async getAdminRoadmaps(): Promise<RoadmapApiResponse<RoadmapCatalogItem[]>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_ROADMAPS}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { message?: string }).message || 'Failed to fetch admin roadmaps');
    }

    return response.json();
  }

  static async createRoadmap(
    payload: AdminRoadmapPayload
  ): Promise<RoadmapApiResponse<RoadmapDetail>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_ROADMAPS}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { message?: string }).message || 'Failed to create roadmap');
    }

    return response.json();
  }

  static async updateRoadmap(
    roadmapId: string,
    payload: AdminRoadmapPayload
  ): Promise<RoadmapApiResponse<RoadmapDetail>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_ROADMAP_DETAIL(roadmapId)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { message?: string }).message || 'Failed to update roadmap');
    }

    return response.json();
  }
}
