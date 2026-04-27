import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { RoadmapService } from '../services/api/roadmap.service';
import type {
  ApiResponse,
  CreateAdminRoadmapRequest,
  RoadmapEntryTestAnswerRequest,
  RoadmapEntryTestFlagRequest,
  CreateRoadmapEntryTestRequest,
  CreateRoadmapTopicRequest,
  SubmitRoadmapFeedbackRequest,
  SubmitRoadmapEntryTestRequest,
  UpdateAdminRoadmapRequest,
  UpdateRoadmapTopicRequest,
  UpdateRoadmapProgressRequest,
} from '../types';

export const roadmapKeys = {
  all: ['roadmaps'] as const,
  list: (name = '', page = 0, size = 20) => [...roadmapKeys.all, 'list', name, page, size] as const,
  detail: (roadmapId: string) => [...roadmapKeys.all, 'detail', roadmapId] as const,
  adminDetail: (roadmapId: string) => [...roadmapKeys.all, 'admin', 'detail', roadmapId] as const,
  student: (roadmapId?: string) => [...roadmapKeys.all, 'student', roadmapId ?? 'current'] as const,
  adminList: (name = '', page = 0, size = 20) =>
    [...roadmapKeys.all, 'admin', 'list', name, page, size] as const,
  myFeedback: (roadmapId: string) => [...roadmapKeys.all, 'feedback', 'me', roadmapId] as const,
  adminFeedback: (roadmapId: string, page = 0, size = 20) =>
    [...roadmapKeys.all, 'feedback', 'admin', roadmapId, page, size] as const,
  entryTest: (roadmapId: string) => [...roadmapKeys.all, 'entry-test', roadmapId] as const,
  entryTestActiveAttempt: (roadmapId: string) =>
    [...roadmapKeys.all, 'entry-test', roadmapId, 'active-attempt'] as const,
  entryTestSnapshot: (roadmapId: string, attemptId: string) =>
    [...roadmapKeys.all, 'entry-test', roadmapId, 'snapshot', attemptId] as const,
  topicMaterials: (topicId: string) => [...roadmapKeys.all, 'topic-materials', topicId] as const,
};

type UseRoadmapsOptions<TData> = Omit<
  UseQueryOptions<ApiResponse<unknown>, Error, TData, ReturnType<typeof roadmapKeys.list>>,
  'queryKey' | 'queryFn'
>;

export function useRoadmaps<TData = ApiResponse<unknown>>(
  name = '',
  page = 0,
  size = 20,
  options?: UseRoadmapsOptions<TData>
) {
  return useQuery({
    queryKey: roadmapKeys.list(name, page, size),
    queryFn: () => RoadmapService.getRoadmaps({ name, page, size }),
    ...options,
  });
}

export function useRoadmapDetail(roadmapId: string) {
  return useQuery({
    queryKey: roadmapKeys.detail(roadmapId),
    queryFn: () => RoadmapService.getRoadmapDetail(roadmapId),
    enabled: !!roadmapId,
  });
}

export function useAdminRoadmapDetail(roadmapId: string) {
  return useQuery({
    queryKey: roadmapKeys.adminDetail(roadmapId),
    queryFn: () => RoadmapService.getAdminRoadmapDetail(roadmapId),
    enabled: !!roadmapId,
  });
}

export function useStudentRoadmap(roadmapId?: string) {
  return useQuery({
    queryKey: roadmapKeys.student(roadmapId),
    queryFn: () => RoadmapService.getStudentRoadmap(roadmapId),
  });
}

export function useUpdateRoadmapProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roadmapId, data }: { roadmapId: string; data: UpdateRoadmapProgressRequest }) =>
      RoadmapService.updateRoadmapProgress(roadmapId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: roadmapKeys.student(variables.roadmapId) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.detail(variables.roadmapId) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.list() });
    },
  });
}

export function useAdminRoadmaps(name = '', page = 0, size = 20) {
  return useQuery({
    queryKey: roadmapKeys.adminList(name, page, size),
    queryFn: () => RoadmapService.getAdminRoadmaps({ name, page, size }),
  });
}

export function useCreateRoadmap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAdminRoadmapRequest) => RoadmapService.createRoadmap(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roadmapKeys.adminList() });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.list('', 0, 20) });
    },
  });
}

export function useUpdateRoadmap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roadmapId, payload }: { roadmapId: string; payload: UpdateAdminRoadmapRequest }) =>
      RoadmapService.updateRoadmap(roadmapId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: roadmapKeys.adminList() });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.detail(variables.roadmapId) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.adminDetail(variables.roadmapId) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.list('', 0, 20) });
    },
  });
}


export function useAddRoadmapTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roadmapId, payload }: { roadmapId: string; payload: CreateRoadmapTopicRequest }) =>
      RoadmapService.addRoadmapTopic(roadmapId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: roadmapKeys.adminDetail(variables.roadmapId) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.detail(variables.roadmapId) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.student(variables.roadmapId) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.adminList() });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.list('', 0, 20) });
    },
  });
}

export function useUpdateRoadmapTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roadmapId,
      topicId,
      payload,
    }: {
      roadmapId: string;
      topicId: string;
      payload: UpdateRoadmapTopicRequest;
    }) => RoadmapService.updateRoadmapTopic(roadmapId, topicId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: roadmapKeys.adminDetail(variables.roadmapId) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.detail(variables.roadmapId) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.student(variables.roadmapId) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.adminList() });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.list('', 0, 20) });
    },
  });
}

export function useArchiveRoadmapTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roadmapId, topicId }: { roadmapId: string; topicId: string }) =>
      RoadmapService.archiveRoadmapTopic(roadmapId, topicId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: roadmapKeys.adminDetail(variables.roadmapId) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.detail(variables.roadmapId) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.student(variables.roadmapId) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.adminList() });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.list('', 0, 20) });
    },
  });
}

export function useDeleteRoadmap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roadmapId: string) => RoadmapService.deleteRoadmap(roadmapId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roadmapKeys.adminList() });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.list('', 0, 20) });
    },
  });
}

export function useCreateRoadmapEntryTest() {
  return useMutation({
    mutationFn: ({ roadmapId, payload }: { roadmapId: string; payload: CreateRoadmapEntryTestRequest }) =>
      RoadmapService.createRoadmapEntryTest(roadmapId, payload),
  });
}

export function useRemoveRoadmapEntryTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roadmapId }: { roadmapId: string }) =>
      RoadmapService.removeRoadmapEntryTest(roadmapId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: roadmapKeys.adminDetail(variables.roadmapId) });
    },
  });
}

export function useRoadmapEntryTest(roadmapId: string) {
  return useQuery({
    queryKey: roadmapKeys.entryTest(roadmapId),
    queryFn: () => RoadmapService.getRoadmapEntryTest(roadmapId),
    enabled: !!roadmapId,
  });
}

export function useStartRoadmapEntryTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roadmapId }: { roadmapId: string }) =>
      RoadmapService.startRoadmapEntryTest(roadmapId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: roadmapKeys.entryTest(variables.roadmapId) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.entryTestActiveAttempt(variables.roadmapId) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.detail(variables.roadmapId) });
    },
  });
}

export function useRoadmapEntryTestActiveAttempt(roadmapId: string) {
  return useQuery({
    queryKey: roadmapKeys.entryTestActiveAttempt(roadmapId),
    queryFn: () => RoadmapService.getRoadmapEntryTestActiveAttempt(roadmapId),
    enabled: !!roadmapId,
  });
}

export function useRoadmapEntryTestSnapshot(roadmapId: string, attemptId: string) {
  return useQuery({
    queryKey: roadmapKeys.entryTestSnapshot(roadmapId, attemptId),
    queryFn: () => RoadmapService.getRoadmapEntryTestSnapshot(roadmapId, attemptId),
    enabled: !!roadmapId && !!attemptId,
  });
}

export function useUpdateRoadmapEntryTestAnswer() {
  return useMutation({
    mutationFn: ({
      roadmapId,
      attemptId,
      payload,
    }: {
      roadmapId: string;
      attemptId: string;
      payload: RoadmapEntryTestAnswerRequest;
    }) => RoadmapService.updateRoadmapEntryTestAnswer(roadmapId, attemptId, payload),
  });
}

export function useUpdateRoadmapEntryTestFlag() {
  return useMutation({
    mutationFn: ({
      roadmapId,
      attemptId,
      payload,
    }: {
      roadmapId: string;
      attemptId: string;
      payload: RoadmapEntryTestFlagRequest;
    }) => RoadmapService.updateRoadmapEntryTestFlag(roadmapId, attemptId, payload),
  });
}

export function useSaveAndExitRoadmapEntryTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roadmapId, attemptId }: { roadmapId: string; attemptId: string }) =>
      RoadmapService.saveAndExitRoadmapEntryTest(roadmapId, attemptId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: roadmapKeys.entryTest(variables.roadmapId) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.entryTestActiveAttempt(variables.roadmapId) });
    },
  });
}

export function useFinishRoadmapEntryTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roadmapId, attemptId }: { roadmapId: string; attemptId: string }) =>
      RoadmapService.finishRoadmapEntryTest(roadmapId, attemptId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: roadmapKeys.entryTest(variables.roadmapId) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.entryTestActiveAttempt(variables.roadmapId) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.student(variables.roadmapId) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.detail(variables.roadmapId) });
    },
  });
}

export function useSubmitRoadmapEntryTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roadmapId, payload }: { roadmapId: string; payload: SubmitRoadmapEntryTestRequest }) =>
      RoadmapService.submitRoadmapEntryTest(roadmapId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: roadmapKeys.student(variables.roadmapId) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.detail(variables.roadmapId) });
    },
  });
}

export function useSubmitRoadmapFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roadmapId, payload }: { roadmapId: string; payload: SubmitRoadmapFeedbackRequest }) =>
      RoadmapService.submitRoadmapFeedback(roadmapId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: roadmapKeys.myFeedback(variables.roadmapId) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.adminFeedback(variables.roadmapId) });
    },
  });
}

export function useMyRoadmapFeedback(roadmapId: string) {
  return useQuery({
    queryKey: roadmapKeys.myFeedback(roadmapId),
    queryFn: () => RoadmapService.getMyRoadmapFeedback(roadmapId),
    enabled: !!roadmapId,
  });
}

export function useAdminRoadmapFeedback(roadmapId: string, page = 0, size = 20) {
  return useQuery({
    queryKey: roadmapKeys.adminFeedback(roadmapId, page, size),
    queryFn: () => RoadmapService.getAdminRoadmapFeedback(roadmapId, page, size),
    enabled: !!roadmapId,
  });
}

export function useTopicMaterials(topicId: string) {
  return useQuery({
    queryKey: roadmapKeys.topicMaterials(topicId),
    queryFn: () => RoadmapService.getTopicMaterials(topicId),
    enabled: !!topicId,
  });
}
