import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questionTemplateService } from '../services/questionTemplateService';
import {
    type QuestionTemplateRequest,
    type QuestionGenerationMode,
    type ExtractParametersRequest,
    type GenerateParametersRequest,
    type UpdateParametersRequest,
    type BlueprintFromRealQuestionRequest,
    type BulkRejectQuestionsRequest,
    CognitiveLevel,
    QuestionType
} from '../types/questionTemplate';

export const questionTemplateKeys = {
    all: ['questionTemplates'] as const,
    lists: () => [...questionTemplateKeys.all, 'list'] as const,
    list: (filters: string) => [...questionTemplateKeys.lists(), { filters }] as const,
    details: () => [...questionTemplateKeys.all, 'detail'] as const,
    detail: (id: string) => [...questionTemplateKeys.details(), id] as const,
    myKeys: () => [...questionTemplateKeys.all, 'my'] as const,
    myList: (filters: string) => [...questionTemplateKeys.myKeys(), { filters }] as const,
};

// --- Queries ---

export const useGetQuestionTemplate = (id: string, enabled = true) => {
    return useQuery({
        queryKey: questionTemplateKeys.detail(id),
        queryFn: () => questionTemplateService.getQuestionTemplateById(id),
        enabled: !!id && enabled,
    });
};

export const useGetMyQuestionTemplates = (page = 0, size = 20, sortBy = 'createdAt', sortDirection = 'DESC', search?: string, status?: string, gradeId?: string, chapterId?: string) => {
    return useQuery({
        queryKey: questionTemplateKeys.myList(`${page}-${size}-${sortBy}-${sortDirection}-${search ?? ''}-${status ?? ''}-${gradeId ?? ''}-${chapterId ?? ''}`),
        queryFn: () => questionTemplateService.getMyQuestionTemplates(page, size, sortBy, sortDirection, search, status, gradeId, chapterId),
    });
};

export const useSearchQuestionTemplates = (params: {
    templateType?: QuestionType;
    cognitiveLevel?: CognitiveLevel;
    isPublic?: boolean;
    searchTerm?: string;
    gradeId?: string;
    chapterId?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: string;
}) => {
    return useQuery({
        queryKey: questionTemplateKeys.list(JSON.stringify(params)),
        queryFn: () => questionTemplateService.searchQuestionTemplates(params),
    });
};

export const useTestTemplate = (id: string, sampleCount = 5, useAI = true, enabled = false) => {
    return useQuery({
        queryKey: [...questionTemplateKeys.detail(id), 'test', sampleCount, useAI],
        queryFn: () => questionTemplateService.testTemplate(id, sampleCount, useAI),
        enabled: !!id && enabled,
    });
};


// --- Mutations ---

export const useCreateQuestionTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (request: QuestionTemplateRequest) => questionTemplateService.createQuestionTemplate(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: questionTemplateKeys.lists() });
            queryClient.invalidateQueries({ queryKey: questionTemplateKeys.myKeys() });
        },
    });
};

export const useUpdateQuestionTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, request }: { id: string; request: QuestionTemplateRequest }) =>
            questionTemplateService.updateQuestionTemplate(id, request),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: questionTemplateKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: questionTemplateKeys.lists() });
            queryClient.invalidateQueries({ queryKey: questionTemplateKeys.myKeys() });
        },
    });
};

export const useDeleteQuestionTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => questionTemplateService.deleteQuestionTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: questionTemplateKeys.lists() });
            queryClient.invalidateQueries({ queryKey: questionTemplateKeys.myKeys() });
        },
    });
};

export const useTogglePublicStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => questionTemplateService.togglePublicStatus(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: questionTemplateKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: questionTemplateKeys.lists() });
            queryClient.invalidateQueries({ queryKey: questionTemplateKeys.myKeys() });
        },
    });
};

export const usePublishTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => questionTemplateService.publishTemplate(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: questionTemplateKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: questionTemplateKeys.lists() });
            queryClient.invalidateQueries({ queryKey: questionTemplateKeys.myKeys() });
        },
    });
};

export const useArchiveTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => questionTemplateService.archiveTemplate(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: questionTemplateKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: questionTemplateKeys.lists() });
            queryClient.invalidateQueries({ queryKey: questionTemplateKeys.myKeys() });
        },
    });
};

export const useUnpublishTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => questionTemplateService.unpublishTemplate(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: questionTemplateKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: questionTemplateKeys.lists() });
            queryClient.invalidateQueries({ queryKey: questionTemplateKeys.myKeys() });
        },
    });
};

export const useGenerateAIEnhancedQuestion = () => {
    return useMutation({
        mutationFn: (id: string) => questionTemplateService.generateAIEnhancedQuestion(id),
    });
};

export const useGenerateQuestions = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            count,
            avoidDuplicates,
            distinctnessHint,
            // Deprecated fields kept for back-compat with old callers.
            generationMode,
            canonicalQuestionId,
        }: {
            id: string;
            count: number;
            avoidDuplicates?: boolean;
            distinctnessHint?: string;
            /** @deprecated ignored by the new generator. */
            generationMode?: QuestionGenerationMode;
            /** @deprecated ignored by the new generator. */
            canonicalQuestionId?: string;
        }) =>
            questionTemplateService.generateQuestions(id, {
                count,
                avoidDuplicates,
                distinctnessHint,
                generationMode,
                canonicalQuestionId,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['questions'] });
            queryClient.invalidateQueries({ queryKey: ['reviewQueue'] });
        },
    });
};

// Method 1 — convert a real-valued question into a Blueprint draft (one AI call)
export const useBlueprintFromRealQuestion = () => {
    return useMutation({
        mutationFn: (request: BlueprintFromRealQuestionRequest) =>
            questionTemplateService.blueprintFromRealQuestion(request),
    });
};

// Review queue
export const useReviewQueue = (templateId: string | undefined, page = 0, size = 20) => {
    return useQuery({
        queryKey: ['reviewQueue', templateId ?? '', page, size],
        queryFn: () => questionTemplateService.listReviewQueue(templateId, page, size),
    });
};

export const useApproveQuestion = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => questionTemplateService.approveQuestion(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reviewQueue'] });
        },
    });
};

export const useBulkApproveQuestions = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (questionIds: string[]) =>
            questionTemplateService.bulkApproveQuestions(questionIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reviewQueue'] });
        },
    });
};

export const useBulkRejectQuestions = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (request: BulkRejectQuestionsRequest) =>
            questionTemplateService.bulkRejectQuestions(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reviewQueue'] });
        },
    });
};

export const useImportTemplateFromFile = () => {
    return useMutation({
        mutationFn: ({
            file,
            subjectHint,
            contextHint,
            questionBankId,
        }: {
            file: File;
            subjectHint?: string;
            contextHint?: string;
            questionBankId?: string;
        }) => questionTemplateService.importTemplateFromFile(file, subjectHint, contextHint, questionBankId),
    });
};

// Feature 1 — AI suggests {{param}} placeholders from raw text
export const useExtractParameters = () => {
    return useMutation({
        mutationFn: ({
            templateId,
            request,
        }: {
            templateId: string;
            request: ExtractParametersRequest;
        }) => questionTemplateService.extractParameters(templateId, request),
    });
};

// Feature 2 — AI generates constraint-aware parameter values
export const useGenerateParameters = () => {
    return useMutation({
        mutationFn: ({
            templateId,
            request,
        }: {
            templateId: string;
            request: GenerateParametersRequest;
        }) => questionTemplateService.generateParameters(templateId, request),
    });
};

// Feature 2b — Teacher refines parameters with a natural-language command
export const useUpdateParameters = () => {
    return useMutation({
        mutationFn: ({
            templateId,
            request,
        }: {
            templateId: string;
            request: UpdateParametersRequest;
        }) => questionTemplateService.updateParameters(templateId, request),
    });
};
