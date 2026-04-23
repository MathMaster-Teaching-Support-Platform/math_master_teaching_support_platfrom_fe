import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../config/api.config';
import { AuthService } from '../services/api/auth.service';
import type { ApiResponse } from '../types';

export interface BatchTopicItem {
  id?: string;
  title: string;
  description?: string;
  sequenceOrder: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  courseIds?: string[]; // Multiple courses (all equal, no primary/additional distinction)
  mark?: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'INACTIVE';
}

export interface BatchTopicRequest {
  roadmapId: string;
  topics: BatchTopicItem[];
}

async function batchSaveTopics(request: BatchTopicRequest): Promise<ApiResponse<any[]>> {
  const token = AuthService.getToken();
  const response = await fetch(
    `${API_BASE_URL}/admin/roadmaps/${request.roadmapId}/topics/batch`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || 'Failed to batch save topics');
  }

  return response.json();
}

export function useBatchSaveTopics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: batchSaveTopics,
    onSuccess: (_, variables) => {
      // Invalidate roadmap detail query to refresh topics
      queryClient.invalidateQueries({ 
        queryKey: ['admin-roadmap-detail', variables.roadmapId] 
      });
    },
  });
}
