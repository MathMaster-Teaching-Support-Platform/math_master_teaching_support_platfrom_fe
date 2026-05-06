/**
 * Error code mapping for user-friendly messages
 * Matches backend ErrorCode enum
 */

// Backend string message → Vietnamese (for messages not covered by error codes)
const BACKEND_MESSAGE_MAP: Record<string, string> = {
  // Auth
  'Authentication required': 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.',
  Unauthorized: 'Bạn không có quyền thực hiện thao tác này.',
  'Access denied': 'Truy cập bị từ chối.',
  'Token expired': 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',

  // Teacher profile
  'Invalid profile status for this operation': 'Trạng thái hồ sơ không phù hợp với thao tác này.',
  'Profile not found': 'Không tìm thấy hồ sơ.',
  'Failed to submit profile': 'Không thể nộp hồ sơ. Vui lòng thử lại.',
  'Failed to fetch profile': 'Không thể tải hồ sơ. Vui lòng thử lại.',
  'Failed to update profile': 'Không thể cập nhật hồ sơ. Vui lòng thử lại.',
  'Failed to delete profile': 'Không thể xóa hồ sơ. Vui lòng thử lại.',
  'Failed to fetch profiles': 'Không thể tải danh sách hồ sơ.',
  'Failed to count pending profiles': 'Không thể đếm hồ sơ đang chờ.',
  'Failed to review profile': 'Không thể duyệt hồ sơ. Vui lòng thử lại.',
  'Failed to review profile with OCR': 'Không thể duyệt hồ sơ. Vui lòng thử lại.',
  'Failed to get download URL': 'Không thể lấy đường dẫn tải tài liệu.',
  'Failed to download verification document': 'Không thể tải tài liệu xác minh.',

  // OCR
  'Failed to start OCR verification': 'Không thể khởi động xác minh tự động.',
  'Failed to get job status': 'Không thể lấy trạng thái xác minh.',
  'Failed to get job result': 'Không thể lấy kết quả xác minh.',
  'OCR job polling timeout - exceeded maximum attempts':
    'Xác minh tự động quá thời gian chờ. Vui lòng thử lại.',
  'OCR verification failed': 'Xác minh tự động thất bại.',
  'OCR verification was cancelled': 'Xác minh tự động đã bị hủy.',

  // Assessment
  'Failed to create assessment': 'Không thể tạo bài kiểm tra.',
  'Failed to update assessment': 'Không thể cập nhật bài kiểm tra.',
  'Failed to patch assessment': 'Không thể cập nhật bài kiểm tra.',
  'Failed to fetch assessment': 'Không thể tải bài kiểm tra.',
  'Failed to fetch assessment preview': 'Không thể tải xem trước bài kiểm tra.',
  'Failed to fetch assessments': 'Không thể tải danh sách bài kiểm tra.',
  'Failed to search assessments': 'Không thể tìm kiếm bài kiểm tra.',
  'Failed to delete assessment': 'Không thể xóa bài kiểm tra.',
  'Failed to publish assessment': 'Không thể công khai bài kiểm tra.',
  'Failed to unpublish assessment': 'Không thể hủy công khai bài kiểm tra.',
  'Failed to close assessment': 'Không thể đóng bài kiểm tra.',
  'Failed to grade preview submission': 'Không thể chấm điểm thử.',
  'Failed to fetch publish summary': 'Không thể tải tóm tắt công khai.',
  'Failed to set points override': 'Không thể điều chỉnh điểm.',
  'Failed to check edit permission': 'Không thể kiểm tra quyền chỉnh sửa.',
  'Failed to check delete permission': 'Không thể kiểm tra quyền xóa.',
  'Failed to check publish permission': 'Không thể kiểm tra quyền công khai.',
  'Failed to generate assessment from matrix': 'Không thể tạo đề từ ma trận.',
  'Failed to validate bank coverage': 'Không thể kiểm tra ngân hàng câu hỏi.',
  'Failed to generate questions from matrix': 'Không thể tạo câu hỏi từ ma trận.',
  'Failed to fetch assessment questions': 'Không thể tải câu hỏi bài kiểm tra.',
  'Failed to add question to assessment': 'Không thể thêm câu hỏi vào bài kiểm tra.',
  'Failed to remove question from assessment': 'Không thể xóa câu hỏi khỏi bài kiểm tra.',
  'Failed to get assessments by lesson': 'Không thể tải bài kiểm tra theo bài học.',
  'Failed to link assessment to lesson': 'Không thể liên kết bài kiểm tra với bài học.',
  'Failed to unlink assessment from lesson': 'Không thể bỏ liên kết bài kiểm tra.',
  'Failed to search questions': 'Không thể tìm kiếm câu hỏi.',
  'Failed to fetch available questions': 'Không thể tải câu hỏi khả dụng.',
  'Failed to batch add questions': 'Không thể thêm hàng loạt câu hỏi.',
  'Failed to batch update points': 'Không thể cập nhật điểm hàng loạt.',
  'Failed to auto distribute points': 'Không thể phân phối điểm tự động.',
  'Failed to distribute points': 'Không thể phân phối điểm.',
  'Failed to save': 'Không thể lưu. Vui lòng thử lại.',

  // Student assessment
  'Failed to start assessment': 'Không thể bắt đầu bài kiểm tra.',
  'Failed to update answer': 'Không thể cập nhật câu trả lời.',
  'Failed to update flag': 'Không thể đánh dấu câu hỏi.',
  'Failed to submit assessment': 'Không thể nộp bài kiểm tra.',
  'Failed to get draft snapshot': 'Không thể tải bản nháp.',
  'Failed to save and exit': 'Không thể lưu và thoát.',
  'Failed to fetch course assessments': 'Không thể tải bài kiểm tra khóa học.',
  'Failed to fetch assessment details': 'Không thể tải chi tiết bài kiểm tra.',

  // Grading
  'Failed to fetch grading queue': 'Không thể tải hàng đợi chấm điểm.',
  'Failed to fetch submission': 'Không thể tải bài làm.',
  'Failed to complete grading': 'Không thể hoàn thành chấm điểm.',
  'Failed to override grade': 'Không thể điều chỉnh điểm.',
  'Failed to add manual adjustment': 'Không thể thêm điều chỉnh thủ công.',
  'Failed to fetch analytics': 'Không thể tải thống kê.',
  'Failed to export grades': 'Không thể công khaig điểm.',
  'Failed to release grades': 'Không thể phát hành kết quả.',
  'Failed to create regrade request': 'Không thể tạo yêu cầu chấm lại.',
  'Failed to respond to regrade request': 'Không thể phản hồi yêu cầu chấm lại.',
  'Failed to fetch regrade requests': 'Không thể tải yêu cầu chấm lại.',
  'Failed to invalidate submission': 'Không thể hủy bài làm.',
  'Failed to fetch result': 'Không thể tải kết quả.',
  'Failed to trigger AI review': 'Không thể kích hoạt xem xét AI.',
  'Failed to fetch pending count': 'Không thể đếm số mục đang chờ.',

  // Slide templates
  'Failed to fetch slide templates': 'Không thể tải danh sách mẫu slide.',
  'Failed to fetch template': 'Không thể tải mẫu slide.',
  'Failed to create slide template': 'Không thể tạo mẫu slide.',
  'Failed to update slide template': 'Không thể cập nhật mẫu slide.',
  'Failed to activate template': 'Không thể kích hoạt mẫu slide.',
  'Failed to deactivate template': 'Không thể tắt mẫu slide.',
  'Failed to delete template': 'Không thể xóa mẫu.',
  'Failed to download template': 'Không thể tải file mẫu.',
  'Failed to regenerate preview': 'Không thể tạo lại ảnh xem trước.',

  // Import
  'Failed to preview Excel file': 'Không thể xem trước file Excel.',
  'Failed to import questions': 'Không thể nhập câu hỏi.',
  'Failed to import templates': 'Không thể nhập mẫu.',

  // Latex
  'Latex rendering failed.': 'Không thể hiển thị công thức toán.',

  // HTTP
  'Empty response': 'Máy chủ không trả về dữ liệu. Vui lòng thử lại.',

  // Mindmap
  'Failed to generate mindmap': 'Không thể tạo sơ đồ tư duy.',
  'Failed to update mindmap': 'Không thể cập nhật sơ đồ tư duy.',
  'Failed to publish mindmap': 'Không thể công khai sơ đồ tư duy.',
  'Failed to unpublish mindmap': 'Không thể hủy công khai sơ đồ tư duy.',
  'Failed to delete mindmap': 'Không thể xóa sơ đồ tư duy.',
  'Failed to fetch mindmaps': 'Không thể tải danh sách sơ đồ tư duy.',
  'Failed to fetch mindmap': 'Không thể tải sơ đồ tư duy.',
  'Failed to fetch public mindmap': 'Không thể tải sơ đồ tư duy.',
  'Failed to export mindmap': 'Không thể xuất sơ đồ tư duy.',
  'Failed to export public mindmap': 'Không thể xuất sơ đồ tư duy công khai.',
  'Failed to fetch public mindmaps': 'Không thể tải sơ đồ tư duy công khai.',
  'Failed to create node': 'Không thể tạo nút sơ đồ tư duy.',
  'Failed to update node': 'Không thể cập nhật nút sơ đồ tư duy.',
  'Failed to delete node': 'Không thể xóa nút sơ đồ tư duy.',

  // Lesson slides
  'Failed to fetch school grades': 'Không thể tải danh sách lớp học.',
  'Failed to fetch subjects': 'Không thể tải danh sách môn học.',
  'Failed to fetch chapters': 'Không thể tải danh sách chương.',
  'Failed to fetch lessons': 'Không thể tải danh sách bài học.',
  'Failed to generate slide content': 'Không thể tạo nội dung slide.',
  'Failed to generate PPTX': 'Không thể tạo file PPTX.',
  'Failed to render slide preview': 'Không thể tạo ảnh xem trước slide.',
  'Failed to fetch generated slides': 'Không thể tải danh sách slide đã tạo.',
  'Failed to download generated slide': 'Không thể tải xuống slide.',
  'Failed to delete generated slide': 'Không thể xóa slide.',
  'Failed to get generated slide preview URL': 'Không thể lấy đường dẫn xem trước slide.',
  'Failed to preview generated slide PDF': 'Không thể xem trước PDF slide.',
  'Failed to publish generated slide': 'Không thể công khai slide.',
  'Failed to unpublish generated slide': 'Không thể hủy công khai slide.',
  'Failed to update generated slide metadata': 'Không thể cập nhật thông tin slide.',
  'Failed to get generated slide thumbnail image': 'Không thể tải ảnh thu nhỏ slide.',
  'Failed to fetch lesson slide': 'Không thể tải slide bài học.',
  'Failed to fetch lesson slides': 'Không thể tải danh sách slide bài học.',
  'Failed to publish lesson slides': 'Không thể công khai slide bài học.',
  'Failed to unpublish lesson slides': 'Không thể hủy công khai slide bài học.',
  'Failed to fetch public lesson slides': 'Không thể tải slide bài học công khai.',
  'Failed to fetch public generated slides': 'Không thể tải slide công khai.',
  'Failed to download public generated slide': 'Không thể tải xuống slide công khai.',
  'Failed to get public generated slide preview URL': 'Không thể lấy đường dẫn xem trước.',
  'Failed to get public generated slide preview PDF': 'Không thể xem trước PDF slide.',
  'Failed to get public generated slide thumbnail image': 'Không thể tải ảnh thu nhỏ.',

  // Chat sessions
  'Failed to create chat session': 'Không thể tạo cuộc trò chuyện.',
  'Failed to fetch chat sessions': 'Không thể tải danh sách cuộc trò chuyện.',
  'Failed to fetch chat session detail': 'Không thể tải chi tiết cuộc trò chuyện.',
  'Failed to fetch chat messages': 'Không thể tải tin nhắn.',
  'Failed to send chat message': 'Không thể gửi tin nhắn.',
  'Failed to rename chat session': 'Không thể đổi tên cuộc trò chuyện.',
  'Failed to archive chat session': 'Không thể lưu trữ cuộc trò chuyện.',
  'Failed to delete chat session': 'Không thể xóa cuộc trò chuyện.',
  'Failed to fetch memory info': 'Không thể tải thông tin bộ nhớ.',

  // Auth
  'Role selection failed': 'Chọn vai trò thất bại. Vui lòng thử lại.',

  // Academic structure (admin)
  'Failed to create school grade': 'Không thể tạo lớp học.',
  'Failed to update school grade': 'Không thể cập nhật lớp học.',
  'Failed to delete school grade': 'Không thể xóa lớp học.',
  'Failed to create subject': 'Không thể tạo môn học.',
  'Failed to update subject': 'Không thể cập nhật môn học.',
  'Failed to delete subject': 'Không thể xóa môn học.',
  'Failed to create chapter': 'Không thể tạo chương.',
  'Failed to update chapter': 'Không thể cập nhật chương.',
  'Failed to delete chapter': 'Không thể xóa chương.',
  'Failed to fetch lessons by chapter': 'Không thể tải bài học theo chương.',
  'Failed to create lesson': 'Không thể tạo bài học.',
  'Failed to update lesson': 'Không thể cập nhật bài học.',
  'Failed to delete lesson': 'Không thể xóa bài học.',

  // Misc services
  'Failed to fetch chapters by subject': 'Không thể tải chương theo môn học.',
  'Failed to fetch grades': 'Không thể tải danh sách cấp độ.',
  'Failed to search documents': 'Không thể tìm kiếm tài liệu.',
  'Failed to fetch curricula': 'Không thể tải chương trình học.',
  'Failed to fetch all lessons': 'Không thể tải tất cả bài học.',
  'Failed to fetch lesson detail': 'Không thể tải chi tiết bài học.',
  'Failed to fetch chapter lessons': 'Không thể tải bài học theo chương.',
  'Failed to fetch student dashboard': 'Không thể tải tổng quan học viên.',
  'Failed to fetch subjects by grade': 'Không thể tải môn học theo lớp.',
  'Invalid grade level': 'Cấp độ lớp không hợp lệ.',
};

export const ERROR_MESSAGES: Record<number, string> = {
  // Wallet & Payment errors
  1029: 'Số dư ví không đủ để thanh toán. Vui lòng nạp thêm tiền.',

  // Course errors (synchronized with backend)
  1145: 'Không tìm thấy khóa học.',
  1147: 'Khóa học đã được công khai rồi.',
  1197: 'Khóa học phải có ít nhất một bài học trước khi gửi duyệt.',
  1198: 'Khóa học đã được gửi duyệt trước đó.',
  1199: 'Giá khuyến mãi phải nhỏ hơn giá gốc.',
  1200: 'Vui lòng đợi một lát trước khi gửi duyệt lại.',
  1148: 'Bạn đã đăng ký khóa học này rồi.',
  1152: 'Khóa học này chưa được công khai hoặc đang chờ duyệt.',
  1154: 'Không tìm thấy video cho bài học này.',

  // Legacy/Internal course codes
  1030: 'Khóa học này chưa được công khai hoặc đang chờ duyệt.',
  1031: 'Bạn đã đăng ký khóa học này rồi.',
  1032: 'Giá khuyến mãi phải nhỏ hơn giá gốc.',
  1033: 'Khóa học phải có ít nhất một bài học trước khi gửi duyệt.',
  1034: 'Khóa học đã được gửi duyệt trước đó.',
  1035: 'Khóa học không ở trạng thái chờ duyệt.',
  1036: 'Khóa học đã được công khai rồi.',
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

/**
 * Translate an API error to Vietnamese.
 * Priority: error code map → message string map → Vietnamese passthrough → generic fallback.
 */
export const translateApiError = (message?: string, code?: number): string => {
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];

  if (!message) return 'Đã xảy ra lỗi. Vui lòng thử lại sau.';

  if (BACKEND_MESSAGE_MAP[message]) return BACKEND_MESSAGE_MAP[message];

  // Already Vietnamese — pass through unchanged
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(message)) {
    return message;
  }

  // "HTTP 4xx / 5xx" pattern
  const httpMatch = message.match(/^HTTP (\d+)/);
  if (httpMatch) return `Lỗi máy chủ (${httpMatch[1]}). Vui lòng thử lại sau.`;

  return 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
};
