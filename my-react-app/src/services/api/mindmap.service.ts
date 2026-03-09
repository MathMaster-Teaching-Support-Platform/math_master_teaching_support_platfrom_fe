import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import { AuthService } from './auth.service';
import type {
  MindmapGenerateRequest,
  MindmapGenerateResponse,
  Mindmap,
  MindmapNode,
  MindmapUpdateRequest,
  MindmapNodeUpdateRequest,
  MindmapNodeCreateRequest,
  ApiResponse,
  PaginatedResponse,
} from '../../types';

export class MindmapService {
  private static async getHeaders() {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      accept: '*/*',
    };
  }

  // ─── GENERATE ─────────────────────────────────────────────────────────────

  /** POST /mindmaps/generate - Generate mindmap using AI */
  static async generateMindmap(
    data: MindmapGenerateRequest
  ): Promise<ApiResponse<MindmapGenerateResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MINDMAPS_GENERATE}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate mindmap');
    }
    return response.json();
  }

  // ─── CREATE / UPDATE MINDMAP ──────────────────────────────────────────────

  /** PUT /mindmaps/{id} - Update mindmap metadata */
  static async updateMindmap(
    id: string,
    data: MindmapUpdateRequest
  ): Promise<ApiResponse<Mindmap>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MINDMAPS_DETAIL(id)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update mindmap');
    }
    return response.json();
  }

  /** DELETE /mindmaps/{id} */
  static async deleteMindmap(id: string): Promise<ApiResponse<void>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MINDMAPS_DETAIL(id)}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete mindmap');
    }
    return response.json();
  }

  // ─── READ ─────────────────────────────────────────────────────────────────

  /** GET /mindmaps/my-mindmaps - Get teacher's mindmaps */
  static async getMyMindmaps(params?: {
    page?: number;
    size?: number;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    sortBy?: string;
    direction?: 'ASC' | 'DESC';
  }): Promise<ApiResponse<PaginatedResponse<Mindmap>>> {
    const headers = await this.getHeaders();
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.set('page', params.page.toString());
    if (params?.size !== undefined) queryParams.set('size', params.size.toString());
    if (params?.status) queryParams.set('status', params.status);
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params?.direction) queryParams.set('direction', params.direction);

    const url = `${API_BASE_URL}${API_ENDPOINTS.MINDMAPS_MY}${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch mindmaps');
    }
    return response.json();
  }

  /** GET /mindmaps/{id} - Get mindmap by ID with all nodes */
  static async getMindmapById(id: string): Promise<ApiResponse<MindmapGenerateResponse>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MINDMAPS_DETAIL(id)}`, {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch mindmap');
    }
    return response.json();
  }

  // ─── NODES ────────────────────────────────────────────────────────────────

  /** POST /mindmaps/{mindmapId}/nodes - Create new node */
  static async createNode(
    mindmapId: string,
    data: MindmapNodeCreateRequest
  ): Promise<ApiResponse<MindmapNode>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MINDMAPS_NODES(mindmapId)}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create node');
    }
    return response.json();
  }

  /** PUT /mindmaps/{mindmapId}/nodes/{nodeId} - Update node */
  static async updateNode(
    mindmapId: string,
    nodeId: string,
    data: MindmapNodeUpdateRequest
  ): Promise<ApiResponse<MindmapNode>> {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.MINDMAPS_NODE_DETAIL(mindmapId, nodeId)}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update node');
    }
    return response.json();
  }

  /** DELETE /mindmaps/{mindmapId}/nodes/{nodeId} */
  static async deleteNode(mindmapId: string, nodeId: string): Promise<ApiResponse<void>> {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.MINDMAPS_NODE_DETAIL(mindmapId, nodeId)}`,
      {
        method: 'DELETE',
        headers,
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete node');
    }
    return response.json();
  }
}
