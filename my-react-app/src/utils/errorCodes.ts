/**
 * Error code mapping for user-friendly messages
 * Matches backend ErrorCode enum
 */

export const ERROR_MESSAGES: Record<number, string> = {
  // Wallet & Payment errors
  1029: 'Số dư ví không đủ để thanh toán. Vui lòng nạp thêm tiền.',
  
  // Course errors (from backend fixes)
  1030: 'Khóa học này chưa được xuất bản hoặc đang chờ duyệt.',
  1031: 'Bạn đã đăng ký khóa học này rồi.',
  1032: 'Giá khuyến mãi phải nhỏ hơn giá gốc.',
  1033: 'Khóa học phải có ít nhất một bài học trước khi gửi duyệt.',
  1034: 'Khóa học đã được gửi duyệt trước đó.',
  1035: 'Khóa học không ở trạng thái chờ duyệt.',
  1036: 'Khóa học đã được xuất bản rồi.',
  1037: 'Khóa học đã bị từ chối.',
  1038: 'Không tìm thấy video cho bài học này.',
  
  // Generic errors
  9999: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.',
};

/**
 * Get user-friendly error message from error code
 */
export const getErrorMessage = (code: number | undefined, defaultMessage?: string): string => {
  if (!code) {
    return defaultMessage || 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
  }
  
  return ERROR_MESSAGES[code] || defaultMessage || 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
};

/**
 * Extract error code from error object
 */
export const extractErrorCode = (error: unknown): number | undefined => {
  if (!error) return undefined;
  
  // Check direct code property
  if (typeof error === 'object' && 'code' in error) {
    return (error as any).code;
  }
  
  // Check response.data.code (Axios error format)
  if (typeof error === 'object' && 'response' in error) {
    const response = (error as any).response;
    if (response?.data?.code) {
      return response.data.code;
    }
  }
  
  return undefined;
};

/**
 * Extract error message from error object
 */
export const extractErrorMessage = (error: unknown): string => {
  if (!error) return 'Đã xảy ra lỗi không xác định.';
  
  // Check if it's an Error instance
  if (error instanceof Error) {
    return error.message;
  }
  
  // Check response.data.message (Axios error format)
  if (typeof error === 'object' && 'response' in error) {
    const response = (error as any).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  
  // Check direct message property
  if (typeof error === 'object' && 'message' in error) {
    return (error as any).message;
  }
  
  return 'Đã xảy ra lỗi không xác định.';
};

/**
 * Create a standardized error object
 */
export const createError = (code: number, message?: string): Error => {
  const errorMessage = message || getErrorMessage(code);
  const error = new Error(errorMessage);
  (error as any).code = code;
  return error;
};
