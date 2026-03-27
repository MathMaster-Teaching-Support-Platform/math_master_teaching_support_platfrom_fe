import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { examMatrixService } from '../services/examMatrixService';
import type {
    AddBankMappingRequest,
    AddTemplateMappingRequest,
    ExamMatrixRequest,
    FinalizePreviewRequest,
    GeneratePreviewRequest,
    ListMatchingTemplatesParams,
} from '../types/examMatrix';

export const examMatrixKeys = {
    all: ['examMatrices'] as const,
    mine: () => [...examMatrixKeys.all, 'my'] as const,
    detail: (id: string) => [...examMatrixKeys.all, 'detail', id] as const,
    mappings: (matrixId: string) => [...examMatrixKeys.detail(matrixId), 'mappings'] as const,
    validation: (matrixId: string) => [...examMatrixKeys.detail(matrixId), 'validation'] as const,
    bankMappings: (matrixId: string) => [...examMatrixKeys.detail(matrixId), 'bank-mappings'] as const,
    matchingTemplates: (matrixId: string, params: ListMatchingTemplatesParams) =>
        [...examMatrixKeys.detail(matrixId), 'matching-templates', params] as const,
};

export const useGetMyExamMatrices = () =>
    useQuery({
        queryKey: examMatrixKeys.mine(),
        queryFn: () => examMatrixService.getMyExamMatrices(),
    });

export const useGetExamMatrixById = (matrixId: string, enabled = true) =>
    useQuery({
        queryKey: examMatrixKeys.detail(matrixId),
        queryFn: () => examMatrixService.getExamMatrixById(matrixId),
        enabled: !!matrixId && enabled,
    });

export const useGetTemplateMappings = (matrixId: string, enabled = true) =>
    useQuery({
        queryKey: examMatrixKeys.mappings(matrixId),
        queryFn: () => examMatrixService.getTemplateMappings(matrixId),
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

export const useGetBankMappings = (matrixId: string, enabled = true) =>
    useQuery({
        queryKey: examMatrixKeys.bankMappings(matrixId),
        queryFn: () => examMatrixService.getBankMappings(matrixId),
        enabled: !!matrixId && enabled,
    });

export const useListMatchingTemplates = (
    matrixId: string,
    params: ListMatchingTemplatesParams = {},
    enabled = true
) =>
    useQuery({
        queryKey: examMatrixKeys.matchingTemplates(matrixId, params),
        queryFn: () => examMatrixService.listMatchingTemplates(matrixId, params),
        enabled: !!matrixId && enabled,
    });

export const useCreateExamMatrix = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (request: ExamMatrixRequest) => examMatrixService.createExamMatrix(request),
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

export const useAddTemplateMapping = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            matrixId,
            request,
        }: {
            matrixId: string;
            request: AddTemplateMappingRequest;
        }) => examMatrixService.addTemplateMapping(matrixId, request),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: examMatrixKeys.mappings(vars.matrixId) });
            qc.invalidateQueries({ queryKey: examMatrixKeys.detail(vars.matrixId) });
        },
    });
};

export const useRemoveTemplateMapping = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ matrixId, mappingId }: { matrixId: string; mappingId: string }) =>
            examMatrixService.removeTemplateMapping(matrixId, mappingId),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: examMatrixKeys.mappings(vars.matrixId) });
            qc.invalidateQueries({ queryKey: examMatrixKeys.detail(vars.matrixId) });
        },
    });
};

export const useAddBankMapping = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            matrixId,
            request,
        }: {
            matrixId: string;
            request: AddBankMappingRequest;
        }) => examMatrixService.addBankMapping(matrixId, request),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: examMatrixKeys.bankMappings(vars.matrixId) });
            qc.invalidateQueries({ queryKey: examMatrixKeys.validation(vars.matrixId) });
            qc.invalidateQueries({ queryKey: examMatrixKeys.detail(vars.matrixId) });
        },
    });
};

export const useRemoveBankMapping = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ matrixId, mappingId }: { matrixId: string; mappingId: string }) =>
            examMatrixService.removeBankMapping(matrixId, mappingId),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: examMatrixKeys.bankMappings(vars.matrixId) });
            qc.invalidateQueries({ queryKey: examMatrixKeys.validation(vars.matrixId) });
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

export const useGeneratePreview = () =>
    useMutation({
        mutationFn: ({
            matrixId,
            mappingId,
            request,
        }: {
            matrixId: string;
            mappingId: string;
            request: GeneratePreviewRequest;
        }) => examMatrixService.generatePreview(matrixId, mappingId, request),
    });

export const useFinalizePreview = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            matrixId,
            mappingId,
            request,
        }: {
            matrixId: string;
            mappingId: string;
            request: FinalizePreviewRequest;
        }) => examMatrixService.finalizePreview(matrixId, mappingId, request),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: examMatrixKeys.detail(vars.matrixId) });
            qc.invalidateQueries({ queryKey: examMatrixKeys.mappings(vars.matrixId) });
        },
    });
};
