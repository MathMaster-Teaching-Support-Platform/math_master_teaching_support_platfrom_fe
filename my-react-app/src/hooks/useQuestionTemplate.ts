import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questionTemplateService } from '../services/questionTemplateService';
import {
    type QuestionTemplateRequest,
    type QuestionGenerationMode,
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

export const useGetMyQuestionTemplates = (page = 0, size = 20, sortBy = 'createdAt', sortDirection = 'DESC') => {
    return useQuery({
        queryKey: questionTemplateKeys.myList(`${page}-${size}-${sortBy}-${sortDirection}`),
        queryFn: () => questionTemplateService.getMyQuestionTemplates(page, size, sortBy, sortDirection),
    });
};

export const useSearchQuestionTemplates = (params: {
    templateType?: QuestionType;
    cognitiveLevel?: CognitiveLevel;
    isPublic?: boolean;
    searchTerm?: string;
    tags?: string[];
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
            difficultyDistribution,
            generationMode,
            canonicalQuestionId,
        }: {
            id: string;
            count: number;
            difficultyDistribution: { EASY?: number; MEDIUM?: number; HARD?: number };
            generationMode?: QuestionGenerationMode;
            canonicalQuestionId?: string;
        }) =>
            questionTemplateService.generateQuestions(id, {
                count,
                difficultyDistribution,
                generationMode,
                canonicalQuestionId,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['questions'] });
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
