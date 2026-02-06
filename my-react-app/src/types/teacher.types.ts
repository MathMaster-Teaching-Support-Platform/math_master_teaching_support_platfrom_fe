// Teacher Profile & School types

export type ProfileStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface School {
  id: number;
  name: string;
  address: string;
  city: string;
  district: string;
  phoneNumber: string;
  email: string;
  website: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherProfile {
  id: number;
  userId: number;
  userName: string;
  fullName: string;
  schoolId: number;
  schoolName: string;
  position: string;
  certificateUrl?: string;
  identificationDocumentUrl?: string;
  description?: string;
  status: ProfileStatus;
  adminComment?: string;
  reviewedBy?: number;
  reviewedByName?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Request types
export interface SubmitTeacherProfileRequest {
  schoolId: number;
  position: string;
  certificateUrl?: string;
  identificationDocumentUrl?: string;
  description?: string;
}

export interface UpdateTeacherProfileRequest {
  schoolId: number;
  position: string;
  certificateUrl?: string;
  identificationDocumentUrl?: string;
  description?: string;
}

export interface ReviewProfileRequest {
  status: 'APPROVED' | 'REJECTED';
  adminComment?: string;
}

export interface CreateSchoolRequest {
  name: string;
  address: string;
  city: string;
  district: string;
  phoneNumber: string;
  email: string;
  website: string;
}

export interface UpdateSchoolRequest {
  name: string;
  address: string;
  city: string;
  district: string;
  phoneNumber: string;
  email: string;
  website: string;
}

// Response types
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
