import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import { AuthService } from './auth.service';
import type {
  ApiResponse,
  DepositRequest,
  DepositResponse,
  WalletSummary,
  WalletTransactionPage,
} from '../../types/wallet.types';

export class WalletService {
  private static readonly WALLET_BASE_URL = API_BASE_URL;

  private static async getHeaders(includeJsonContentType = false) {
    const token = AuthService.getToken();
    if (!token) throw new Error('Authentication required');

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      accept: '*/*',
    };

    if (includeJsonContentType) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  private static async parseError(response: Response, fallback: string): Promise<never> {
    let message = fallback;

    try {
      const error = await response.json();
      message =
        (error && typeof error.message === 'string' && error.message) ||
        (error && typeof error.error === 'string' && error.error) ||
        fallback;
    } catch {
      // Keep fallback when response body is not JSON.
    }

    throw new Error(`${response.status} ${response.statusText}: ${message}`);
  }

  static async getMyWallet(): Promise<ApiResponse<WalletSummary>> {
    const headers = await this.getHeaders(false);
    const response = await fetch(`${this.WALLET_BASE_URL}${API_ENDPOINTS.WALLET_MY}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      return this.parseError(response, 'Failed to fetch wallet');
    }

    return response.json();
  }

  static async getTransactions(params?: {
    page?: number;
    size?: number;
  }): Promise<ApiResponse<WalletTransactionPage>> {
    const headers = await this.getHeaders(false);
    const query = new URLSearchParams();
    query.set('page', String(params?.page ?? 0));
    query.set('size', String(params?.size ?? 20));

    const response = await fetch(
      `${this.WALLET_BASE_URL}${API_ENDPOINTS.WALLET_TRANSACTIONS}?${query.toString()}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      return this.parseError(response, 'Failed to fetch transactions');
    }

    return response.json();
  }

  static async getTransactionsByStatus(
    status: string,
    params?: {
      page?: number;
      size?: number;
    }
  ): Promise<ApiResponse<WalletTransactionPage>> {
    const headers = await this.getHeaders(false);
    const query = new URLSearchParams();
    query.set('page', String(params?.page ?? 0));
    query.set('size', String(params?.size ?? 20));

    const response = await fetch(
      `${this.WALLET_BASE_URL}${API_ENDPOINTS.WALLET_TRANSACTIONS_BY_STATUS(status)}?${query.toString()}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      return this.parseError(response, 'Failed to fetch transactions by status');
    }

    return response.json();
  }

  static async deposit(data: DepositRequest): Promise<ApiResponse<DepositResponse>> {
    const headers = await this.getHeaders(true);
    const response = await fetch(`${this.WALLET_BASE_URL}${API_ENDPOINTS.PAYMENT_DEPOSIT}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return this.parseError(response, 'Failed to create deposit request');
    }

    return response.json();
  }
}
