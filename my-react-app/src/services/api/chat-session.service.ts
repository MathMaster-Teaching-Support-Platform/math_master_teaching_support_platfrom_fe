import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import type {
  ChatApiError,
  ChatApiResponse,
  ChatExchangeResponse,
  ChatMemoryInfo,
  ChatMessageQueryParams,
  ChatMessageResponse,
  ChatPageResponse,
  ChatSessionQueryParams,
  ChatSessionResponse,
  CreateChatSessionRequest,
  RenameChatSessionRequest,
  SendChatMessageRequest,
} from '../../types';
import { AuthService } from './auth.service';

export class ChatSessionService {
  private static readonly DEFAULT_BACKEND_URL = 'http://localhost:8080';

  private static buildQuery(params?: Record<string, string | number | undefined>): string {
    if (!params) return '';

    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && `${value}`.trim() !== '') {
        query.set(key, String(value));
      }
    });

    const q = query.toString();
    return q ? `?${q}` : '';
  }

  private static async getHeaders(): Promise<Record<string, string>> {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      accept: '*/*',
    };
  }

  private static async parseResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        typeof body?.message === 'string' && body.message.trim().length > 0
          ? body.message
          : fallbackMessage;
      const error = new Error(message) as ChatApiError;
      if (typeof body?.code === 'number') {
        error.code = body.code;
      }
      throw error;
    }

    return body as T;
  }

  private static resolveBackendHint(): string {
    if (API_BASE_URL.startsWith('http')) {
      return API_BASE_URL;
    }

    const proxyTarget = import.meta.env.VITE_API_PROXY_TARGET;
    if (typeof proxyTarget === 'string' && proxyTarget.trim().length > 0) {
      return `${proxyTarget.replace(/\/$/, '')}/api`;
    }

    return `${this.DEFAULT_BACKEND_URL}/api`;
  }

  private static async fetchWithGuard(input: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(input, init);
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(
          `Khong the ket noi backend (${this.resolveBackendHint()}). Vui long kiem tra BE da chay dung port chua.`
        );
      }
      throw error;
    }
  }

  static async createSession(
    payload?: CreateChatSessionRequest
  ): Promise<ChatApiResponse<ChatSessionResponse>> {
    const headers = await this.getHeaders();
    const response = await this.fetchWithGuard(`${API_BASE_URL}${API_ENDPOINTS.CHAT_SESSIONS}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload ?? {}),
    });

    return this.parseResponse<ChatApiResponse<ChatSessionResponse>>(
      response,
      'Failed to create chat session'
    );
  }

  static async getSessions(
    params?: ChatSessionQueryParams
  ): Promise<ChatApiResponse<ChatPageResponse<ChatSessionResponse>>> {
    const headers = await this.getHeaders();
    const query = this.buildQuery({
      status: params?.status,
      keyword: params?.keyword,
      page: params?.page ?? 0,
      size: params?.size ?? 20,
      sortBy: params?.sortBy,
      direction: params?.direction,
    });

    const response = await this.fetchWithGuard(
      `${API_BASE_URL}${API_ENDPOINTS.CHAT_SESSIONS}${query}`,
      {
        method: 'GET',
        headers,
      }
    );

    return this.parseResponse<ChatApiResponse<ChatPageResponse<ChatSessionResponse>>>(
      response,
      'Failed to fetch chat sessions'
    );
  }

  static async getSessionDetail(sessionId: string): Promise<ChatApiResponse<ChatSessionResponse>> {
    const headers = await this.getHeaders();
    const response = await this.fetchWithGuard(
      `${API_BASE_URL}${API_ENDPOINTS.CHAT_SESSION_DETAIL(sessionId)}`,
      {
        method: 'GET',
        headers,
      }
    );

    return this.parseResponse<ChatApiResponse<ChatSessionResponse>>(
      response,
      'Failed to fetch chat session detail'
    );
  }

  static async getSessionMessages(
    sessionId: string,
    params?: ChatMessageQueryParams
  ): Promise<ChatApiResponse<ChatPageResponse<ChatMessageResponse>>> {
    const headers = await this.getHeaders();
    const query = this.buildQuery({
      page: params?.page ?? 0,
      size: params?.size ?? 50,
      sortBy: params?.sortBy,
      direction: params?.direction,
    });

    const response = await this.fetchWithGuard(
      `${API_BASE_URL}${API_ENDPOINTS.CHAT_SESSION_MESSAGES(sessionId)}${query}`,
      {
        method: 'GET',
        headers,
      }
    );

    return this.parseResponse<ChatApiResponse<ChatPageResponse<ChatMessageResponse>>>(
      response,
      'Failed to fetch chat messages'
    );
  }

  static async sendMessage(
    sessionId: string,
    payload: SendChatMessageRequest
  ): Promise<ChatApiResponse<ChatExchangeResponse>> {
    const headers = await this.getHeaders();
    const response = await this.fetchWithGuard(
      `${API_BASE_URL}${API_ENDPOINTS.CHAT_SESSION_MESSAGES(sessionId)}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      }
    );

    return this.parseResponse<ChatApiResponse<ChatExchangeResponse>>(
      response,
      'Failed to send chat message'
    );
  }

  static async renameSession(
    sessionId: string,
    payload: RenameChatSessionRequest
  ): Promise<ChatApiResponse<ChatSessionResponse>> {
    const headers = await this.getHeaders();
    const response = await this.fetchWithGuard(
      `${API_BASE_URL}${API_ENDPOINTS.CHAT_SESSION_DETAIL(sessionId)}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      }
    );

    return this.parseResponse<ChatApiResponse<ChatSessionResponse>>(
      response,
      'Failed to rename chat session'
    );
  }

  static async archiveSession(sessionId: string): Promise<ChatApiResponse<ChatSessionResponse>> {
    const headers = await this.getHeaders();
    const response = await this.fetchWithGuard(
      `${API_BASE_URL}${API_ENDPOINTS.CHAT_SESSION_ARCHIVE(sessionId)}`,
      {
        method: 'PATCH',
        headers,
      }
    );

    return this.parseResponse<ChatApiResponse<ChatSessionResponse>>(
      response,
      'Failed to archive chat session'
    );
  }

  static async deleteSession(sessionId: string): Promise<ChatApiResponse<void>> {
    const headers = await this.getHeaders();
    const response = await this.fetchWithGuard(
      `${API_BASE_URL}${API_ENDPOINTS.CHAT_SESSION_DETAIL(sessionId)}`,
      {
        method: 'DELETE',
        headers,
      }
    );

    return this.parseResponse<ChatApiResponse<void>>(response, 'Failed to delete chat session');
  }

  static async getMemoryInfo(sessionId: string): Promise<ChatApiResponse<ChatMemoryInfo>> {
    const headers = await this.getHeaders();
    const response = await this.fetchWithGuard(
      `${API_BASE_URL}${API_ENDPOINTS.CHAT_SESSION_MEMORY(sessionId)}`,
      {
        method: 'GET',
        headers,
      }
    );

    return this.parseResponse<ChatApiResponse<ChatMemoryInfo>>(
      response,
      'Failed to fetch memory info'
    );
  }
}
