import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RoadmapService } from '../services/api/roadmap.service';
import type {
  CreateAdminRoadmapRequest,
  CreateRoadmapEntryTestRequest,
  CreateRoadmapTopicRequest,
  SubmitRoadmapEntryTestRequest,
  TopicMaterialResourceType,
  UpdateAdminRoadmapRequest,
  UpdateRoadmapProgressRequest,
} from '../types';

export const roadmapKeys = {
  all: ['roadmaps'] as const,
  list: () => [...roadmapKeys.all, 'list'] as const,
  detail: (roadmapId: string) => [...roadmapKeys.all, 'detail', roadmapId] as const,
  adminDetail: (roadmapId: string) => [...roadmapKeys.all, 'admin', 'detail', roadmapId] as const,
  student: (roadmapId?: string) => [...roadmapKeys.all, 'student', roadmapId ?? 'current'] as const,
  adminList: () => [...roadmapKeys.all, 'admin', 'list'] as const,
  topicMaterials: (topicId: string, resourceType?: TopicMaterialResourceType) =>
    [...roadmapKeys.all, 'topic-materials', topicId, resourceType ?? 'ALL'] as const,
};

export function useRoadmaps() {
  return useQuery({
    queryKey: roadmapKeys.list(),
    queryFn: () => RoadmapService.getRoadmaps(),
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

export function useAdminRoadmaps() {
  return useQuery({
    queryKey: roadmapKeys.adminList(),
    queryFn: () => RoadmapService.getAdminRoadmaps(),
  });
}

export function useCreateRoadmap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAdminRoadmapRequest) => RoadmapService.createRoadmap(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roadmapKeys.adminList() });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.list() });
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
      queryClient.invalidateQueries({ queryKey: roadmapKeys.list() });
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
      queryClient.invalidateQueries({ queryKey: roadmapKeys.list() });
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
