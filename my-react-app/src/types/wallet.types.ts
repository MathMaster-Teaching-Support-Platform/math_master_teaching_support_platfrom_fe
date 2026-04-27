export interface ApiResponse<T> {
  code: number;
  message?: string;
  result: T;
}

// ── Enums (confirmed by BE 2026-04-17) ──────────────────────────────────────
export type TransactionType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'PAYMENT'
  | 'COURSE_PURCHASE'
  | 'INSTRUCTOR_REVENUE'
  | 'PLATFORM_COMMISSION';
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

// ── Withdrawal ────────────────────────────────────────────────────────────────
export type WithdrawalStatus =
  | 'PENDING_VERIFY'
  | 'PENDING_ADMIN'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'REJECTED'
  | 'CANCELLED';

export interface WithdrawalRequestResponse {
  withdrawalRequestId: string;
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  status: WithdrawalStatus;
  proofImageUrl: string | null;
  adminNote: string | null;
  /** transactionId của WalletTransaction (type=WITHDRAWAL) — set khi SUCCESS */
  transactionId: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Admin-only fields
  userId?: string;
  userName?: string;
  userEmail?: string;
}

export interface WithdrawalPage {
  content: WithdrawalRequestResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CreateWithdrawalRequest {
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  password: string;
}

export interface VerifyWithdrawalOtpRequest {
  withdrawalRequestId: string;
  otpCode: string;
}
