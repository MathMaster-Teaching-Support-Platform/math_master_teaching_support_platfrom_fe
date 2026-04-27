import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { WithdrawalService } from '../services/api/withdrawal.service';
import type {
  CreateWithdrawalRequest,
  VerifyWithdrawalOtpRequest,
  WithdrawalStatus,
} from '../types/wallet.types';

export const WITHDRAWAL_KEYS = {
  myRequests: (status?: WithdrawalStatus) => ['withdrawal', 'my', status] as const,
  adminRequests: (params: object) => ['withdrawal', 'admin', params] as const,
};

// ── User hooks ───────────────────────────────────────────────────────────────

export function useMyWithdrawals(status?: WithdrawalStatus, page = 0) {
  return useQuery({
    queryKey: WITHDRAWAL_KEYS.myRequests(status),
    queryFn: () => WithdrawalService.getMyRequests({ status, page, size: 10 }),
    staleTime: 30_000,
  });
}

export function useCreateWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWithdrawalRequest) => WithdrawalService.createRequest(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['withdrawal', 'my'] }),
  });
}

export function useVerifyWithdrawalOtp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: VerifyWithdrawalOtpRequest) => WithdrawalService.verifyOtp(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['withdrawal', 'my'] });
      // Also refresh wallet balance after OTP confirmed (balance goes on hold)
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function useCancelWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => WithdrawalService.cancelRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['withdrawal', 'my'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

// ── Admin hooks ──────────────────────────────────────────────────────────────

export function useAdminWithdrawals(params: {
  status?: WithdrawalStatus;
  search?: string;
  page?: number;
}) {
  return useQuery({
    queryKey: WITHDRAWAL_KEYS.adminRequests(params),
    queryFn: () => WithdrawalService.adminGetRequests({ ...params, size: 10 }),
    staleTime: 20_000,
  });
}

export function useAdminProcessWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      proofImage,
      adminNote,
    }: {
      id: string;
      proofImage: File;
      adminNote?: string;
    }) => WithdrawalService.adminProcess(id, proofImage, adminNote),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['withdrawal', 'admin'] }),
  });
}

export function useAdminRejectWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      WithdrawalService.adminReject(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['withdrawal', 'admin'] }),
  });
}
