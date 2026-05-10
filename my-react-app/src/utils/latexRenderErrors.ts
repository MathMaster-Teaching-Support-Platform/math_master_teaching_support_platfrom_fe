/**
 * Maps backend QuickLaTeX / proxy messages and fetch failures to Vietnamese for the UI.
 * Safe to call repeatedly (already-Vietnamese messages pass through).
 */
export function translateLatexRenderError(raw: string): string {
  const msg = (raw ?? '').trim();
  if (!msg) {
    return 'Không kết xuất được công thức.';
  }

  if (/[ăâđêôơưạảãầấẩậắằẳẵặèéẹẻẽềểễệìỉịòóọỏõồốổộớờởợùúụủứựỳýỵỷỹ]/i.test(msg)) {
    return msg;
  }

  const lower = msg.toLowerCase();

  if (lower.includes('quicklatex timeout') || lower.includes('timeout while rendering')) {
    return 'Hết thời gian chờ dịch vụ LaTeX (QuickLaTeX). Vui lòng thử lại.';
  }
  if (lower.startsWith('failed to call quicklatex')) {
    return 'Không kết nối được dịch vụ LaTeX (QuickLaTeX). Vui lòng thử lại sau.';
  }
  if (lower.startsWith('quicklatex returned http')) {
    return 'Dịch vụ LaTeX trả về lỗi mạng. Vui lòng thử lại.';
  }
  if (msg === 'Invalid response format from QuickLaTeX.') {
    return 'Phản hồi từ dịch vụ LaTeX không hợp lệ.';
  }
  if (lower.startsWith('unexpected quicklatex status:')) {
    return 'Dịch vụ LaTeX báo trạng thái không mong đợi.';
  }
  if (lower.includes('quicklatex response did not include image url')) {
    return 'Dịch vụ LaTeX không trả về địa chỉ ảnh.';
  }
  if (msg === 'Failed to render LaTeX via proxy.') {
    return 'Máy chủ không kết xuất được LaTeX qua proxy.';
  }
  if (/^latex rendering failed\b/i.test(msg)) {
    return 'Không kết xuất được LaTeX.';
  }
  if (/latex param must not be blank/i.test(msg)) {
    return 'Tham số LaTeX không được để trống.';
  }
  if (/failed to render diagram/i.test(msg)) {
    return 'Không kết xuất được hình vẽ.';
  }
  if (lower === 'failed to fetch' || lower.includes('networkerror') || lower.includes('load failed')) {
    return 'Lỗi mạng khi gọi dịch vụ LaTeX. Kiểm tra kết nối và thử lại.';
  }

  if (/error|undefined|missing|illegal|extra|unknown|exception/i.test(msg)) {
    return `Lỗi LaTeX: ${msg}`;
  }

  return `Lỗi hiển thị: ${msg}`;
}
