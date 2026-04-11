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
  verificationDocumentKey?: string;
  description?: string;
  status: ProfileStatus;
  adminComment?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  // OCR verification fields
  ocrVerified?: boolean;
  ocrMatchScore?: number;
  ocrVerificationData?: string;
  ocrVerifiedAt?: string;
}

// Request types
export interface SubmitTeacherProfileRequest {
  schoolName: string;
  schoolAddress?: string;
  schoolWebsite?: string;
  position: string;
  description?: string;
}

export interface UpdateTeacherProfileRequest {
  schoolName: string;
  schoolAddress?: string;
  schoolWebsite?: string;
  position: string;
  description?: string;
}

export interface ReviewProfileRequest {
  status: 'APPROVED' | 'REJECTED';
  adminComment?: string;
}

// OCR verification types
export interface OcrComparisonResult {
  isMatch: boolean;
  matchScore: number; // 0-100 percentage
  fieldComparisons: FieldComparison[];
  summary: string;
}

export interface FieldComparison {
  fieldName: string;
  submittedValue: string;
  ocrValue: string;
  matches: boolean;
  similarity: number; // 0-1 score
}

// Async OCR job types
export type OcrJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface OcrJobResponse {
  jobId: string;
  status: OcrJobStatus;
  message: string;
  statusUrl: string;
}

export interface OcrJobResult {
  jobId: string;
  profileId: string;
  status: OcrJobStatus;
  progress: number; // 0-100
  result?: OcrComparisonResult;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// Response types
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
