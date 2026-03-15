export type ProfileStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TeacherProfile {
  id: string;
  userId: string;
  userName: string;
  fullName: string;
  schoolName: string;
  schoolAddress?: string;
  schoolWebsite?: string;
  position: string;
  documentUrl: string;
  documentType: string;
  description?: string;
  status: ProfileStatus;
  adminComment?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Request types
export interface SubmitTeacherProfileRequest {
  schoolName: string;
  schoolAddress?: string;
  schoolWebsite?: string;
  position: string;
  documentType: string;
  description?: string;
}

export interface UpdateTeacherProfileRequest {
  schoolName: string;
  schoolAddress?: string;
  schoolWebsite?: string;
  position: string;
  documentUrl: string;
  documentType: string;
  description?: string;
}

export interface ReviewProfileRequest {
  status: 'APPROVED' | 'REJECTED';
  adminComment?: string;
}

// Response types
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
