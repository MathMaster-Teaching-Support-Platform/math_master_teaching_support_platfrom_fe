import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import type {
  CreateAdminRoadmapRequest,
  RoadmapEntryTestActiveAttemptResponse,
  RoadmapEntryTestAnswerAckResponse,
  RoadmapEntryTestAnswerRequest,
  CreateRoadmapEntryTestRequest,
  RoadmapEntryTestFlagRequest,
  RoadmapEntryTestSnapshotResponse,
  CreateRoadmapTopicRequest,
  RoadmapTopicResponse,
  UpdateAdminRoadmapRequest,
  RoadmapApiResponse,
  RoadmapCatalogItem,
  RoadmapDetail,
  RoadmapFeedbackPage,
  RoadmapFeedbackResponse,
  RoadmapEntryTestAttemptStartResponse,
  RoadmapEntryTestResultResponse,
  StudentRoadmapEntryTestInfo,
  SubmitRoadmapFeedbackRequest,
  SubmitRoadmapEntryTestRequest,
  StudentRoadmapSnapshot,
  TopicMaterial,
  UpdateRoadmapTopicRequest,
  UpdateRoadmapProgressRequest,
} from '../../types';
import { AuthService } from './auth.service';

export class RoadmapService {
  static buildPageQuery(params?: { name?: string; page?: number; size?: number }) {
    const query = new URLSearchParams();
    if (params?.name) query.set('name', params.name);
    if (typeof params?.page === 'number') query.set('page', String(params.page));
    if (typeof params?.size === 'number') query.set('size', String(params.size));
    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
  }

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

  static async getRoadmaps(params?: {
    name?: string;
    page?: number;
    size?: number;
  }): Promise<RoadmapApiResponse<RoadmapCatalogItem[]>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ROADMAPS}${this.buildPageQuery(params)}`, {
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
      const message = (error as { message?: string }).message || 'Failed to fetch admin roadmap detail';
      throw new Error(`${response.status} ${response.statusText}: ${message}`);
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

  static async getAdminRoadmaps(params?: {
    name?: string;
    page?: number;
    size?: number;
  }): Promise<RoadmapApiResponse<RoadmapCatalogItem[]>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_ROADMAPS}${this.buildPageQuery(params)}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { message?: string }).message || 'Failed to fetch admin roadmaps');
    }

    return response.json();
  }

  static async deleteRoadmap(roadmapId: string): Promise<RoadmapApiResponse<string>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_ROADMAP_DETAIL(roadmapId)}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { message?: string }).message || 'Failed to archive roadmap');
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
      const message = (error as { message?: string }).message || 'Failed to add topic to roadmap';
      throw new Error(`${response.status} ${response.statusText}: ${message}`);
    }

    return response.json();
  }

  static async updateRoadmapTopic(
    roadmapId: string,
    topicId: string,
    payload: UpdateRoadmapTopicRequest
  ): Promise<RoadmapApiResponse<RoadmapTopicResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_ROADMAP_TOPIC_DETAIL(roadmapId, topicId)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message = (error as { message?: string }).message || 'Failed to update roadmap topic';
      throw new Error(`${response.status} ${response.statusText}: ${message}`);
    }

    return response.json();
  }

  static async archiveRoadmapTopic(
    roadmapId: string,
    topicId: string
  ): Promise<RoadmapApiResponse<string>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_ROADMAP_TOPIC_DETAIL(roadmapId, topicId)}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message = (error as { message?: string }).message || 'Failed to archive roadmap topic';
      throw new Error(`${response.status} ${response.statusText}: ${message}`);
    }

    return response.json();
  }

  static async createRoadmapEntryTest(
    roadmapId: string,
    payload: CreateRoadmapEntryTestRequest
  ): Promise<RoadmapApiResponse<null>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_ROADMAP_ENTRY_TEST(roadmapId)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { message?: string }).message || 'Failed to create roadmap entry test');
    }

    return response.json();
  }

  static async removeRoadmapEntryTest(roadmapId: string): Promise<RoadmapApiResponse<null>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_ROADMAP_ENTRY_TEST(roadmapId)}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { message?: string }).message || 'Failed to remove roadmap entry test');
    }

    return response.json();
  }

  static async getRoadmapEntryTest(
    roadmapId: string
  ): Promise<RoadmapApiResponse<StudentRoadmapEntryTestInfo>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ROADMAP_ENTRY_TEST(roadmapId)}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw this.parseApiError(error, 'Failed to fetch roadmap entry test');
    }

    const data = (await response.json()) as RoadmapApiResponse<StudentRoadmapEntryTestInfo>;
    if (data.code !== 1000) {
      throw this.parseApiError(data, 'Failed to fetch roadmap entry test');
    }

    return data;
  }

  static async startRoadmapEntryTest(
    roadmapId: string
  ): Promise<RoadmapApiResponse<RoadmapEntryTestAttemptStartResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ROADMAP_ENTRY_TEST_START(roadmapId)}`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw this.parseApiError(error, 'Failed to start roadmap entry test');
    }

    const data = (await response.json()) as RoadmapApiResponse<RoadmapEntryTestAttemptStartResponse>;
    if (data.code !== 1000) {
      throw this.parseApiError(data, 'Failed to start roadmap entry test');
    }

    return data;
  }

  static async getRoadmapEntryTestActiveAttempt(
    roadmapId: string
  ): Promise<RoadmapApiResponse<RoadmapEntryTestActiveAttemptResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ROADMAP_ENTRY_TEST_ACTIVE_ATTEMPT(roadmapId)}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw this.parseApiError(error, 'Failed to fetch active roadmap entry test attempt');
    }

    const data = (await response.json()) as RoadmapApiResponse<RoadmapEntryTestActiveAttemptResponse>;
    if (data.code !== 1000) {
      throw this.parseApiError(data, 'Failed to fetch active roadmap entry test attempt');
    }

    return data;
  }

  static async updateRoadmapEntryTestAnswer(
    roadmapId: string,
    attemptId: string,
    payload: RoadmapEntryTestAnswerRequest
  ): Promise<RoadmapApiResponse<RoadmapEntryTestAnswerAckResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ROADMAP_ENTRY_TEST_ANSWER(roadmapId, attemptId)}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw this.parseApiError(error, 'Failed to save roadmap entry test answer');
    }

    const data = (await response.json()) as RoadmapApiResponse<RoadmapEntryTestAnswerAckResponse>;
    if (data.code !== 1000) {
      throw this.parseApiError(data, 'Failed to save roadmap entry test answer');
    }

    return data;
  }

  static async updateRoadmapEntryTestFlag(
    roadmapId: string,
    attemptId: string,
    payload: RoadmapEntryTestFlagRequest
  ): Promise<RoadmapApiResponse<RoadmapEntryTestAnswerAckResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ROADMAP_ENTRY_TEST_FLAG(roadmapId, attemptId)}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw this.parseApiError(error, 'Failed to update roadmap entry test flag');
    }

    const data = (await response.json()) as RoadmapApiResponse<RoadmapEntryTestAnswerAckResponse>;
    if (data.code !== 1000) {
      throw this.parseApiError(data, 'Failed to update roadmap entry test flag');
    }

    return data;
  }

  static async getRoadmapEntryTestSnapshot(
    roadmapId: string,
    attemptId: string
  ): Promise<RoadmapApiResponse<RoadmapEntryTestSnapshotResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ROADMAP_ENTRY_TEST_SNAPSHOT(roadmapId, attemptId)}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw this.parseApiError(error, 'Failed to load roadmap entry test snapshot');
    }

    const data = (await response.json()) as RoadmapApiResponse<RoadmapEntryTestSnapshotResponse>;
    if (data.code !== 1000) {
      throw this.parseApiError(data, 'Failed to load roadmap entry test snapshot');
    }

    return data;
  }

  static async saveAndExitRoadmapEntryTest(
    roadmapId: string,
    attemptId: string
  ): Promise<RoadmapApiResponse<void>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ROADMAP_ENTRY_TEST_SAVE_EXIT(roadmapId, attemptId)}`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw this.parseApiError(error, 'Failed to save and exit roadmap entry test');
    }

    const data = (await response.json()) as RoadmapApiResponse<void>;
    if (data.code !== 1000) {
      throw this.parseApiError(data, 'Failed to save and exit roadmap entry test');
    }

    return data;
  }

  static async finishRoadmapEntryTest(
    roadmapId: string,
    attemptId: string
  ): Promise<RoadmapApiResponse<RoadmapEntryTestResultResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.ROADMAP_ENTRY_TEST_FINISH(roadmapId, attemptId)}`,
      {
        method: 'POST',
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw this.parseApiError(error, 'Failed to finish roadmap entry test');
    }

    const data = (await response.json()) as RoadmapApiResponse<RoadmapEntryTestResultResponse>;
    if (data.code !== 1000) {
      throw this.parseApiError(data, 'Failed to finish roadmap entry test');
    }

    return data;
  }

  static async submitRoadmapEntryTest(
    roadmapId: string,
    payload: SubmitRoadmapEntryTestRequest
  ): Promise<RoadmapApiResponse<RoadmapEntryTestResultResponse>> {
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

  static async submitRoadmapFeedback(
    roadmapId: string,
    payload: SubmitRoadmapFeedbackRequest
  ): Promise<RoadmapApiResponse<RoadmapFeedbackResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.STUDENT_ROADMAP_FEEDBACK(roadmapId)}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message = (error as { message?: string }).message || 'Failed to submit roadmap feedback';
      throw new Error(`${response.status} ${response.statusText}: ${message}`);
    }

    return response.json();
  }

  static async getTopicMaterials(
    topicId: string
  ): Promise<RoadmapApiResponse<TopicMaterial[]>> {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.STUDENT_TOPIC_MATERIALS(topicId)}`,
      { method: 'GET', headers }
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        (error as { message?: string }).message || 'Failed to fetch topic materials'
      );
    }
    return response.json();
  }

  static async getMyRoadmapFeedback(
    roadmapId: string
  ): Promise<RoadmapApiResponse<RoadmapFeedbackResponse | null>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.STUDENT_ROADMAP_FEEDBACK_ME(roadmapId)}`, {
      method: 'GET',
      headers,
    });

    if (response.status === 404) {
      return {
        code: 1000,
        result: null,
      };
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message = (error as { message?: string }).message || 'Failed to fetch my roadmap feedback';
      throw new Error(`${response.status} ${response.statusText}: ${message}`);
    }

    return response.json();
  }

  static async getAdminRoadmapFeedback(
    roadmapId: string,
    page = 0,
    size = 20
  ): Promise<RoadmapApiResponse<RoadmapFeedbackPage>> {
    const headers = await this.getHeaders();
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.ADMIN_ROADMAP_FEEDBACK(roadmapId)}?${query.toString()}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message = (error as { message?: string }).message || 'Failed to fetch roadmap feedback list';
      throw new Error(`${response.status} ${response.statusText}: ${message}`);
    }

    return response.json();
  }
}
