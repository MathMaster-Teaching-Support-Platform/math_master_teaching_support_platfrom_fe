export type FeedbackStatus = 'OPEN' | 'RESPONDED';

export interface FeedbackItem {
  id: string;
  title: string;
  description: string;
  category?: string;
  relatedUrl?: string;
  status: FeedbackStatus;
  senderId: string;
  senderName?: string;
  senderEmail?: string;
  senderRole?: string;
  responseMessage?: string;
  respondedById?: string;
  respondedByName?: string;
  attachments?: FeedbackAttachmentItem[];
  senderRead?: boolean;
  adminRead?: boolean;
  readByCurrentUser?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackAttachmentItem {
  id: string;
  fileName: string;
  contentType?: string;
  fileSize?: number;
  fileUrl: string;
}

export interface CreateFeedbackPayload {
  title: string;
  description: string;
  category?: string;
  relatedUrl?: string;
}

export interface RespondFeedbackPayload {
  responseMessage: string;
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
