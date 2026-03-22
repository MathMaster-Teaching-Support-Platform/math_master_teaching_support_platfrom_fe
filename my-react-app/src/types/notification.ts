export interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export interface PaginatedNotifications {
  content: Notification[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
