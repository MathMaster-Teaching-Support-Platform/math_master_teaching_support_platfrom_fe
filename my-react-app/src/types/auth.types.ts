// Request types
export interface RegisterRequest {
  userName: string;
  email: string;
  password: string;
}

export interface RegisterResult {
  id: string;
  userName: string;
  email: string;
  status: 'INACTIVE';
  createdDate: string;
  createdBy: string;
  updatedDate: string;
  updatedBy: string;
}

export class ApiError extends Error {
  readonly code: number;
  constructor(code: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RoleSelectionRequest {
  role: string;
  userName?: string;
  fullName?: string;
}

// Response types
export interface User {
  id: number;
  userName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  avatar: string | null;
  dob: string;
  code: string | null;
  status: string;
  banReason: string | null;
  banDate: string | null;
  roles: string[];
  createdDate: string;
  createdBy: string | null;
  updatedDate: string | null;
  updatedBy: string | null;
}

export interface LoginResponse {
  token: string;
  expiryTime: string;
  newRegistration: boolean;
}

export interface ApiResponse<T> {
  code: number;
  result: T;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
