export interface ApiResponse<T> {
  code: number;
  message?: string;
  result: T;
}

// ── Enums (confirmed by BE 2026-04-17) ──────────────────────────────────────
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT' | 'REFUND';
export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

export interface WalletSummary {
  walletId?: string;
  userId?: string;
  balance: number;
  /** All-time sum of DEPOSIT+SUCCESS — provided by BE, no client-side calculation needed */
  totalDeposited?: number;
  /** All-time sum of PAYMENT+SUCCESS */
  totalSpent?: number;
  /** Total transaction count across all statuses */
  transactionCount?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WalletTransaction {
  transactionId: string; // UUID — primary identifier
  walletId?: string;
  orderCode?: number; // long — displayed to user, always present for DEPOSIT
  amount: number; // always positive, unit: VND
  type?: TransactionType;
  status: TransactionStatus;
  description?: string;
  paymentLinkId?: string;
  referenceCode?: string | null;
  transactionDate?: string | null; // ISO 8601 — when PayOS confirmed
  expiresAt?: string | null; // ISO 8601 — only set for PENDING, null otherwise
  createdAt?: string;
  updatedAt?: string;
}

/** Spring Data Page<WalletTransaction> — fields are at the top level */
export interface WalletTransactionPage {
  content: WalletTransaction[];
  totalElements: number;
  totalPages: number;
  number: number; // 0-indexed current page
  size: number;
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
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
