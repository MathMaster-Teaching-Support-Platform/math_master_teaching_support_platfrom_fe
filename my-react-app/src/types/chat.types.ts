export type ChatSessionStatus = 'ACTIVE' | 'ARCHIVED';
export type ChatMessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';

export interface ChatApiResponse<T> {
  code: number;
  message?: string;
  result: T;
}

export interface ChatPageResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ChatSessionResponse {
  id: string;
  userId: string;
  title: string;
  status: ChatSessionStatus;
  model: string;
  totalMessages: number;
  totalWords: number;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageResponse {
  id: string;
  sessionId: string;
  userId: string;
  role: ChatMessageRole;
  content: string;
  wordCount: number;
  model: string;
  latencyMs: number;
  sequenceNo: number;
  createdAt: string;
}

export interface ChatMemoryInfo {
  wordLimit: number;
  currentWords: number;
  messageCount: number;
  trimmed: boolean;
}

export interface ChatExchangeResponse {
  sessionId: string;
  userMessage: ChatMessageResponse;
  assistantMessage: ChatMessageResponse;
  memory: ChatMemoryInfo;
}

export interface CreateChatSessionRequest {
  title?: string;
  model?: string;
}

export interface RenameChatSessionRequest {
  title: string;
}

export interface SendChatMessageRequest {
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface ChatSessionQueryParams {
  status?: ChatSessionStatus;
  keyword?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'ASC' | 'DESC';
}

export interface ChatMessageQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'ASC' | 'DESC';
}

export interface ChatApiError extends Error {
  code?: number;
}
