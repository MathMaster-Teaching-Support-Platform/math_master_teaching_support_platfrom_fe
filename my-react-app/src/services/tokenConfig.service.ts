import { API_BASE_URL } from '../config/api.config';
import type { ApiResponse } from '../types/auth.types';
import { AuthService } from './api/auth.service';

export interface TokenCostConfig {
  id: string;
  featureKey: string;
  featureLabel: string;
  costPerUse: number;
  isActive: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface UpdateTokenCostRequest {
  costPerUse?: number;
  isActive?: boolean;
}

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = AuthService.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw error;
  }

  return response.json();
};

export const tokenConfigService = {
  getAllConfigs: async (): Promise<TokenCostConfig[]> => {
    const response: ApiResponse<TokenCostConfig[]> = await fetchWithAuth('/admin/token-config');
    return response.result;
  },

  updateConfig: async (id: string, data: UpdateTokenCostRequest): Promise<TokenCostConfig> => {
    const response: ApiResponse<TokenCostConfig> = await fetchWithAuth(`/admin/token-config/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.result;
  },

  getHistory: async (): Promise<any[]> => {
    const response: ApiResponse<any[]> = await fetchWithAuth('/admin/token-config/history');
    return response.result;
  },
};
