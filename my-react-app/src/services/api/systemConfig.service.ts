import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import { AuthService } from './auth.service';

// ── Types ─────────────────────────────────────────────────────────────────────

/** A single section in the privacy policy JSON. */
export interface PrivacyPolicySection {
  title: string;
  paragraphs: string[];
  bulletPoints: string[];
  /** Optional footer text for the last section. */
  footer?: string;
}

/** Parsed structure of the `privacy_policy` config value. */
export interface PrivacyPolicyContent {
  lastUpdated: string;
  introBanner: string;
  sections: PrivacyPolicySection[];
  contactEmail: string;
  contactWebsite: string;
  responseTime: string;
}

export interface SystemConfigResponse {
  configKey: string;
  configValue: string;
  description: string | null;
  updatedAt: string | null;
}

interface ApiResponse<T> {
  code: number;
  message?: string;
  result: T;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function parseResponse<T>(res: Response): Promise<T> {
  const payload = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!res.ok || (payload && payload.code !== 1000)) {
    throw new Error(payload?.message ?? `HTTP ${res.status}`);
  }
  return payload!.result;
}

function authHeaders(): Record<string, string> {
  const token = AuthService.getToken();
  if (!token) throw new Error('Authentication required');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// ── Service ───────────────────────────────────────────────────────────────────

export const SystemConfigService = {
  /** Fetch a single config value by key — no auth required (public endpoint). */
  async getPublicConfig(key: string): Promise<SystemConfigResponse> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PUBLIC_CONFIG(key)}`);
    return parseResponse<SystemConfigResponse>(res);
  },

  /** Parse the config value of `privacy_policy` into structured content. */
  async getPrivacyPolicy(): Promise<PrivacyPolicyContent> {
    const config = await SystemConfigService.getPublicConfig('privacy_policy');
    return JSON.parse(config.configValue) as PrivacyPolicyContent;
  },

  // ── Admin ──────────────────────────────────────────────────────────────────

  async listAll(): Promise<SystemConfigResponse[]> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_SYSTEM_CONFIG}`, {
      headers: authHeaders(),
    });
    return parseResponse<SystemConfigResponse[]>(res);
  },

  async getByKey(key: string): Promise<SystemConfigResponse> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_SYSTEM_CONFIG_DETAIL(key)}`, {
      headers: authHeaders(),
    });
    return parseResponse<SystemConfigResponse>(res);
  },

  async update(key: string, configValue: string): Promise<SystemConfigResponse> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_SYSTEM_CONFIG_UPDATE(key)}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ configValue }),
    });
    return parseResponse<SystemConfigResponse>(res);
  },
};
