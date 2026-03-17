import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import type {
  CreateAdminRoadmapRequest,
  CreateRoadmapEntryTestRequest,
  CreateRoadmapTopicRequest,
  UpdateAdminRoadmapRequest,
  RoadmapApiResponse,
  RoadmapCatalogItem,
  RoadmapDetail,
  RoadmapTopicResponse,
  SubmitRoadmapEntryTestRequest,
  SubmitRoadmapEntryTestResult,
  StudentRoadmapSnapshot,
  TopicMaterial,
  TopicMaterialResourceType,
  UpdateRoadmapProgressRequest,
} from '../../types';
import { AuthService } from './auth.service';

export class RoadmapService {
    private static parseApiError(payload: unknown, fallback: string): Error {
      const p = payload as {
        message?: string;
        code?: number;
        errors?: unknown;
        result?: unknown;
      };
      if (typeof p?.message === 'string' && p.message.trim().length > 0) {
        return new Error(p.message);
      }
      if (Array.isArray(p?.errors) && p.errors.length > 0) {
        return new Error(`${fallback}: ${JSON.stringify(p.errors)}`);
      }
      if (typeof p?.code === 'number' && p.code !== 1000) {
        return new Error(`${fallback} (code: ${p.code})`);
      }
      return new Error(fallback);
    }

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

  static async getAdminRoadmapDetail(roadmapId: string): Promise<RoadmapApiResponse<RoadmapDetail>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_ROADMAP_DETAIL(roadmapId)}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { message?: string }).message || 'Failed to fetch admin roadmap detail');
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
    payload: CreateAdminRoadmapRequest
  ): Promise<RoadmapApiResponse<RoadmapDetail>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_ROADMAPS}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw this.parseApiError(error, 'Failed to create roadmap');
    }

    const data = (await response.json()) as RoadmapApiResponse<RoadmapDetail>;
    if (data.code !== 1000) {
      throw this.parseApiError(data, 'Failed to create roadmap');
    }

    return data;
  }

  static async updateRoadmap(
    roadmapId: string,
    payload: UpdateAdminRoadmapRequest
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

  static async addRoadmapTopic(
    roadmapId: string,
    payload: CreateRoadmapTopicRequest
  ): Promise<RoadmapApiResponse<RoadmapTopicResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_ROADMAP_TOPICS(roadmapId)}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { message?: string }).message || 'Failed to add topic to roadmap');
    }

    return response.json();
  }

  static async createRoadmapEntryTest(
    roadmapId: string,
    payload: CreateRoadmapEntryTestRequest
  ): Promise<RoadmapApiResponse<null>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_ROADMAP_ENTRY_TEST(roadmapId)}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { message?: string }).message || 'Failed to create roadmap entry test');
    }

    return response.json();
  }

  static async getStudentTopicMaterials(
    topicId: string,
    resourceType?: TopicMaterialResourceType
  ): Promise<RoadmapApiResponse<TopicMaterial[]>> {
    const headers = await this.getHeaders();
    const endpoint = resourceType
      ? API_ENDPOINTS.STUDENT_TOPIC_MATERIALS_BY_TYPE(topicId, resourceType)
      : API_ENDPOINTS.STUDENT_TOPIC_MATERIALS(topicId);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { message?: string }).message || 'Failed to fetch topic materials');
    }

    return response.json();
  }

  static async submitRoadmapEntryTest(
    roadmapId: string,
    payload: SubmitRoadmapEntryTestRequest
  ): Promise<RoadmapApiResponse<SubmitRoadmapEntryTestResult>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ROADMAP_ENTRY_TEST_SUBMIT(roadmapId)}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { message?: string }).message || 'Failed to submit roadmap entry test');
    }

    return response.json();
  }
}
