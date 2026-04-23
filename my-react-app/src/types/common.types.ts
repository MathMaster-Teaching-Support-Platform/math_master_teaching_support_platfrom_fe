/**
 * Common Type Definitions
 * 
 * Shared types used across the application.
 */

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface ApiError {
  code: number;
  message: string;
  errors?: Record<string, string>;
}
