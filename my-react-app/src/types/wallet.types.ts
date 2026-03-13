export interface ApiResponse<T> {
  code: number;
  message?: string;
  result: T;
}

export interface WalletSummary {
  id?: string;
  balance: number;
  pendingBalance?: number;
  currency?: string;
  updatedAt?: string;
}

export interface WalletTransaction {
  id: string | number;
  transactionId?: string;
  transactionCode?: string;
  orderCode?: number;
  walletId?: string;
  type?: string;
  amount: number;
  status: string;
  description?: string;
  paymentLinkId?: string;
  referenceCode?: string | null;
  transactionDate?: string | null;
  paymentMethod?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WalletTransactionPage {
  content: WalletTransaction[];
  page?: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface DepositRequest {
  amount: number;
  description: string;
}

export interface DepositResponse {
  checkoutUrl: string;
  qrCode: string;
  orderCode: number;
  paymentLinkId: string;
}
