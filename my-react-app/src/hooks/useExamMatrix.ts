import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { examMatrixService } from '../services/examMatrixService';
import type {
    BatchUpsertMatrixRowCellsRequest,
    BuildExamMatrixRequest,
    GenerateAssessmentByPercentageRequest,
    ExamMatrixRowRequest,
    ExamMatrixRequest,
} from '../types/examMatrix';

export const examMatrixKeys = {
    all: ['examMatrices'] as const,
    mine: () => [...examMatrixKeys.all, 'my'] as const,
    minePaged: (params: object) => [...examMatrixKeys.all, 'myPaged', params] as const,
    detail: (id: string) => [...examMatrixKeys.all, 'detail', id] as const,
    table: (matrixId: string) => [...examMatrixKeys.detail(matrixId), 'table'] as const,
    validation: (matrixId: string) => [...examMatrixKeys.detail(matrixId), 'validation'] as const,
};

export const useGetMyExamMatrices = () =>
    useQuery({
        queryKey: examMatrixKeys.mine(),
        queryFn: () => examMatrixService.getMyExamMatrices(),
    });

export const useGetMyExamMatricesPaged = (params: {
    search?: string;
    status?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: string;
}) =>
    useQuery({
        queryKey: examMatrixKeys.minePaged(params),
        queryFn: () => examMatrixService.getMyExamMatricesPaged(params),
    });

export const useGetExamMatrixById = (matrixId: string, enabled = true) =>
    useQuery({
        queryKey: examMatrixKeys.detail(matrixId),
        queryFn: () => examMatrixService.getExamMatrixById(matrixId),
        enabled: !!matrixId && enabled,
    });

export const useGetExamMatrixTable = (matrixId: string, enabled = true) =>
    useQuery({
        queryKey: examMatrixKeys.table(matrixId),
        queryFn: () => examMatrixService.getExamMatrixTable(matrixId),
        enabled: !!matrixId && enabled,
    });

export const useValidateMatrix = (matrixId: string, enabled = false) =>
    useQuery({
        queryKey: examMatrixKeys.validation(matrixId),
        queryFn: () => examMatrixService.validateMatrix(matrixId),
        enabled: !!matrixId && enabled,
    });

export const useMatrixValidation = (matrixId: string, enabled = true) =>
    useValidateMatrix(matrixId, enabled);

export const useCreateExamMatrix = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (request: ExamMatrixRequest) => examMatrixService.createExamMatrix(request),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: examMatrixKeys.mine() });
        },
    });
};

export const useBuildExamMatrix = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (request: BuildExamMatrixRequest) => examMatrixService.buildExamMatrix(request),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: examMatrixKeys.mine() });
        },
    });
};

export const useUpdateExamMatrix = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ matrixId, request }: { matrixId: string; request: ExamMatrixRequest }) =>
            examMatrixService.updateExamMatrix(matrixId, request),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: examMatrixKeys.detail(vars.matrixId) });
            qc.invalidateQueries({ queryKey: examMatrixKeys.mine() });
        },
    });
};

export const useDeleteExamMatrix = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (matrixId: string) => examMatrixService.deleteExamMatrix(matrixId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: examMatrixKeys.mine() });
        },
    });
};

export const useAddExamMatrixRow = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ matrixId, request }: { matrixId: string; request: ExamMatrixRowRequest }) =>
            examMatrixService.addExamMatrixRow(matrixId, request),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: examMatrixKeys.table(vars.matrixId) });
            qc.invalidateQueries({ queryKey: examMatrixKeys.detail(vars.matrixId) });
        },
    });
};

export const useRemoveExamMatrixRow = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ matrixId, rowId }: { matrixId: string; rowId: string }) =>
            examMatrixService.removeExamMatrixRow(matrixId, rowId),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: examMatrixKeys.table(vars.matrixId) });
            qc.invalidateQueries({ queryKey: examMatrixKeys.detail(vars.matrixId) });
        },
    });
};

export const useApproveMatrix = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (matrixId: string) => examMatrixService.approveMatrix(matrixId),
        onSuccess: (_, matrixId) => {
            qc.invalidateQueries({ queryKey: examMatrixKeys.detail(matrixId) });
            qc.invalidateQueries({ queryKey: examMatrixKeys.mine() });
        },
    });
};

export const useResetMatrix = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (matrixId: string) => examMatrixService.resetMatrix(matrixId),
        onSuccess: (_, matrixId) => {
            qc.invalidateQueries({ queryKey: examMatrixKeys.detail(matrixId) });
            qc.invalidateQueries({ queryKey: examMatrixKeys.mine() });
        },
    });
};

export const useBatchUpsertMatrixRowCells = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ matrixId, request }: { matrixId: string; request: BatchUpsertMatrixRowCellsRequest }) =>
            examMatrixService.batchUpsertExamMatrixRowCells(matrixId, request),
        onSuccess: () => {
            // NOTE: Do NOT invalidate 'table' here — the caller (handleCellChange) calls
            // refetchTable() explicitly after mutateAsync resolves.
            // Extra invalidation creates racing refetches that overwrite pending local edits.
            qc.invalidateQueries({ queryKey: examMatrixKeys.mine() });
        },
    });
};

export const useGenerateAssessmentByPercentage = () => {
    return useMutation({
        mutationFn: (request: GenerateAssessmentByPercentageRequest) =>
            examMatrixService.generateAssessmentByPercentage(request),
    });
};
