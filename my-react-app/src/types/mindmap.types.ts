// Mindmap TypeScript types/interfaces

export interface MindmapNode {
  id: string;
  mindmapId: string;
  parentId: string | null;
  content: string;
  color: string;
  icon: string;
  displayOrder: number;
  children: MindmapNode[];
  createdAt: string;
  updatedAt: string;
}

export interface Mindmap {
  id: string;
  teacherId: string;
  teacherName: string;
  lessonId: string | null;
  lessonTitle: string | null;
  title: string;
  description: string;
  aiGenerated: boolean;
  generationPrompt: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  nodeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MindmapGenerateRequest {
  prompt: string;
  title: string;
  lessonId?: string;
  levels: number;
}

export interface MindmapGenerateResponse {
  mindmap: Mindmap;
  nodes: MindmapNode[];
}

export interface MindmapUpdateRequest {
  title?: string;
  description?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface MindmapNodeUpdateRequest {
  mindmapId?: string;
  content?: string;
  color?: string;
  icon?: string;
  displayOrder?: number;
  parentId?: string | null;
}

export interface MindmapNodeCreateRequest {
  mindmapId: string;
  parentId: string | null;
  content: string;
  color?: string;
  icon?: string;
  displayOrder?: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}
