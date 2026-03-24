import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RoadmapService } from '../services/api/roadmap.service';
import type {
  CreateAdminRoadmapRequest,
  CreateRoadmapEntryTestRequest,
  CreateRoadmapTopicRequest,
  SubmitRoadmapEntryTestRequest,
  TopicMaterialResourceType,
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
  topicMaterials: (topicId: string, resourceType?: TopicMaterialResourceType) =>
    [...roadmapKeys.all, 'topic-materials', topicId, resourceType ?? 'ALL'] as const,
};

export function useRoadmaps(name = '', page = 0, size = 20) {
  return useQuery({
    queryKey: roadmapKeys.list(name, page, size),
    queryFn: () => RoadmapService.getRoadmaps({ name, page, size }),
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

export function useStudentTopicMaterials(topicId: string, resourceType?: TopicMaterialResourceType) {
  return useQuery({
    queryKey: roadmapKeys.topicMaterials(topicId, resourceType),
    queryFn: () => RoadmapService.getStudentTopicMaterials(topicId, resourceType),
    enabled: !!topicId,
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
