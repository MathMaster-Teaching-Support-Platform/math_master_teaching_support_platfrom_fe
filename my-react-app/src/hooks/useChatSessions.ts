import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChatSessionService } from '../services/api/chat-session.service';
import type {
  ChatApiResponse,
  ChatMemoryInfo,
  ChatMessageResponse,
  ChatPageResponse,
  ChatMessageQueryParams,
  ChatSessionQueryParams,
  CreateChatSessionRequest,
  RenameChatSessionRequest,
  SendChatMessageRequest,
} from '../types';

export const chatSessionKeys = {
  all: ['chat-sessions'] as const,
  lists: () => [...chatSessionKeys.all, 'list'] as const,
  details: () => [...chatSessionKeys.all, 'detail'] as const,
  messagesBySession: (sessionId: string) =>
    [...chatSessionKeys.all, 'messages', sessionId] as const,
  memories: () => [...chatSessionKeys.all, 'memory'] as const,
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
    onSuccess: (data, variables) => {
      const sessionId = variables.sessionId;
      const { userMessage, assistantMessage, memory } = data.result;

      queryClient.setQueriesData<ChatApiResponse<ChatPageResponse<ChatMessageResponse>>>(
        { queryKey: chatSessionKeys.messagesBySession(sessionId) },
        (current) => {
          if (!current) return current;

          const nextMessages = [userMessage, assistantMessage].filter(
            (message): message is ChatMessageResponse => !!message
          );

          const mergedMap = new Map(
            (current.result.content ?? []).map((message) => [message.id, message] as const)
          );
          nextMessages.forEach((message) => mergedMap.set(message.id, message));

          const mergedContent = Array.from(mergedMap.values()).sort(
            (a, b) => a.sequenceNo - b.sequenceNo
          );

          return {
            ...current,
            result: {
              ...current.result,
              content: mergedContent,
              totalElements: mergedContent.length,
            },
          };
        }
      );

      queryClient.setQueryData<ChatApiResponse<ChatMemoryInfo>>(chatSessionKeys.memory(sessionId), {
        code: data.code,
        message: data.message,
        result: memory,
      });

      queryClient.invalidateQueries({ queryKey: chatSessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: chatSessionKeys.detail(sessionId) });
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
      queryClient.invalidateQueries({ queryKey: chatSessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: chatSessionKeys.detail(variables.sessionId) });
    },
  });
}

export function useArchiveChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => ChatSessionService.archiveSession(sessionId),
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: chatSessionKeys.lists() });
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
      queryClient.invalidateQueries({ queryKey: chatSessionKeys.lists() });
      queryClient.removeQueries({ queryKey: chatSessionKeys.detail(sessionId) });
      queryClient.removeQueries({ queryKey: chatSessionKeys.messagesBySession(sessionId) });
      queryClient.removeQueries({ queryKey: chatSessionKeys.memory(sessionId) });
    },
  });
}
