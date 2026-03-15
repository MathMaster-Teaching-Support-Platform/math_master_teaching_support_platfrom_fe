// Request types
export interface RegisterRequest {
  userName: string;
  password: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: string; // YYYY-MM-DD format
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
}

export interface ApiResponse<T> {
  code: number;
  result: T;
}
