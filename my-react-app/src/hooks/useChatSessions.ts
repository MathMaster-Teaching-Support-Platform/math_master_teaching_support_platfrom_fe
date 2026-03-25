import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChatSessionService } from '../services/api/chat-session.service';
import type {
  ChatMessageQueryParams,
  ChatSessionQueryParams,
  CreateChatSessionRequest,
  RenameChatSessionRequest,
  SendChatMessageRequest,
} from '../types';

export const chatSessionKeys = {
  all: ['chat-sessions'] as const,
  list: (params?: ChatSessionQueryParams) => [...chatSessionKeys.all, 'list', params] as const,
  detail: (sessionId: string) => [...chatSessionKeys.all, 'detail', sessionId] as const,
  messages: (sessionId: string, params?: ChatMessageQueryParams) =>
    [...chatSessionKeys.all, 'messages', sessionId, params] as const,
  memory: (sessionId: string) => [...chatSessionKeys.all, 'memory', sessionId] as const,
};

export function useChatSessions(params?: ChatSessionQueryParams) {
  return useQuery({
    queryKey: chatSessionKeys.list(params),
    queryFn: () => ChatSessionService.getSessions(params),
  });
}

export function useChatSessionDetail(sessionId: string) {
  return useQuery({
    queryKey: chatSessionKeys.detail(sessionId),
    queryFn: () => ChatSessionService.getSessionDetail(sessionId),
    enabled: !!sessionId,
  });
}

export function useChatSessionMessages(sessionId: string, params?: ChatMessageQueryParams) {
  return useQuery({
    queryKey: chatSessionKeys.messages(sessionId, params),
    queryFn: () => ChatSessionService.getSessionMessages(sessionId, params),
    enabled: !!sessionId,
  });
}

export function useChatSessionMemory(sessionId: string) {
  return useQuery({
    queryKey: chatSessionKeys.memory(sessionId),
    queryFn: () => ChatSessionService.getMemoryInfo(sessionId),
    enabled: !!sessionId,
  });
}

export function useCreateChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: CreateChatSessionRequest) => ChatSessionService.createSession(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatSessionKeys.all });
    },
  });
}

export function useSendChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: string; payload: SendChatMessageRequest }) =>
      ChatSessionService.sendMessage(sessionId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: chatSessionKeys.list() });
      queryClient.invalidateQueries({ queryKey: chatSessionKeys.detail(variables.sessionId) });
      queryClient.invalidateQueries({ queryKey: chatSessionKeys.messages(variables.sessionId) });
      queryClient.invalidateQueries({ queryKey: chatSessionKeys.memory(variables.sessionId) });
    },
  });
}

export function useRenameChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      payload,
    }: {
      sessionId: string;
      payload: RenameChatSessionRequest;
    }) => ChatSessionService.renameSession(sessionId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: chatSessionKeys.list() });
      queryClient.invalidateQueries({ queryKey: chatSessionKeys.detail(variables.sessionId) });
    },
  });
}

export function useArchiveChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => ChatSessionService.archiveSession(sessionId),
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: chatSessionKeys.list() });
      queryClient.invalidateQueries({ queryKey: chatSessionKeys.detail(sessionId) });
      queryClient.invalidateQueries({ queryKey: chatSessionKeys.memory(sessionId) });
    },
  });
}

export function useDeleteChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => ChatSessionService.deleteSession(sessionId),
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: chatSessionKeys.list() });
      queryClient.removeQueries({ queryKey: chatSessionKeys.detail(sessionId) });
      queryClient.removeQueries({ queryKey: chatSessionKeys.messages(sessionId) });
      queryClient.removeQueries({ queryKey: chatSessionKeys.memory(sessionId) });
    },
  });
}
