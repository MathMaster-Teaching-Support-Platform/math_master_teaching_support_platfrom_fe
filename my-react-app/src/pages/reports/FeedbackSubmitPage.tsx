import { CheckCircle2, Loader2, MessageSquareWarning, Paperclip, Send, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { FeedbackService } from '../../services/api/feedback.service';
import { AuthService } from '../../services/api/auth.service';
import type { FeedbackItem } from '../../types/feedback';

const MAX_FILES = 10;
const MAX_TOTAL_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_EACH_FILE_BYTES = 2 * 1024 * 1024;

const formatBytes = (bytes: number) => {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
};

const FeedbackSubmitPage: React.FC = () => {
  const role = useMemo<'student' | 'teacher'>(() => {
    return AuthService.getUserRole() === 'teacher' ? 'teacher' : 'student';
  }, []);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Góp ý tính năng');
  const [relatedUrl, setRelatedUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recent, setRecent] = useState<FeedbackItem[]>([]);
  const [detailItem, setDetailItem] = useState<FeedbackItem | null>(null);

  const removeFileAt = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const totalFileBytes = files.reduce((acc, file) => acc + file.size, 0);

  const loadRecent = async () => {
    try {
      const res = await FeedbackService.getMy(0, 5);
      setRecent(res.result.content);
    } catch {
      setRecent([]);
    }
  };

  useEffect(() => {
    void loadRecent();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!title.trim() || !description.trim()) {
      setError('Vui lòng nhập đầy đủ tiêu đề và nội dung góp ý.');
      return;
    }
    if (files.length > MAX_FILES) {
      setError(`Bạn chỉ có thể gửi tối đa ${MAX_FILES} file.`);
      return;
    }
    if (totalFileBytes > MAX_TOTAL_SIZE_BYTES) {
      setError(`Tổng dung lượng file vượt quá ${formatBytes(MAX_TOTAL_SIZE_BYTES)}.`);
      return;
    }
    setSubmitting(true);
    try {
      await FeedbackService.create({
        title: title.trim(),
        description: description.trim(),
        category: category.trim() || undefined,
        relatedUrl: relatedUrl.trim() || undefined,
      }, files);
      setSuccess('Đã gửi góp ý. Admin sẽ nhận thông báo ngay và phản hồi sớm nhất.');
      setTitle('');
      setDescription('');
      setRelatedUrl('');
      setFiles([]);
      await loadRecent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi góp ý.');
    } finally {
      setSubmitting(false);
    }
  };

  const recentSorted = [...recent].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const openFeedbackDetail = async (item: FeedbackItem) => {
    setDetailItem(item);
    if (item.readByCurrentUser) return;
    try {
      const updated = await FeedbackService.markAsRead(item.id);
      setRecent((prev) => prev.map((f) => (f.id === item.id ? updated.result : f)));
      setDetailItem(updated.result);
    } catch {
      // keep modal opened even if mark-read fails
    }
  };

  return (
    <DashboardLayout role={role} user={{ name: '', avatar: '', role }} notificationCount={0}>
      <div className="p-6 lg:p-8 bg-[#F5F4ED] min-h-screen">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-7 bg-[#FAF9F5] border border-[#F0EEE6] rounded-2xl p-6 shadow-[rgba(0,0,0,0.05)_0px_4px_24px]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] text-[#5E5D59] flex items-center justify-center">
                <MessageSquareWarning className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-[24px] font-semibold text-[#141413]">Góp ý</h1>
                <p className="text-[14px] text-[#87867F]">
                  Gửi phản hồi về tính năng, lỗi hoặc trải nghiệm sử dụng.
                </p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="feedback-title" className="block text-[13px] font-medium text-[#5E5D59] mb-1.5">
                  Tiêu đề
                </label>
                <input
                  id="feedback-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Khó theo dõi tiến độ bài tập"
                  className="w-full rounded-xl border border-[#E8E6DC] bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-[#3898EC]"
                />
              </div>
              <div>
                <label htmlFor="feedback-category" className="block text-[13px] font-medium text-[#5E5D59] mb-1.5">
                  Loại góp ý
                </label>
                <select
                  id="feedback-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-[#E8E6DC] bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-[#3898EC]"
                >
                  <option>Góp ý tính năng</option>
                  <option>Báo lỗi</option>
                  <option>Đề xuất cải tiến</option>
                  <option>Khác</option>
                </select>
              </div>
              <div>
                <label htmlFor="feedback-related-url" className="block text-[13px] font-medium text-[#5E5D59] mb-1.5">
                  Link liên quan (tuỳ chọn)
                </label>
                <input
                  id="feedback-related-url"
                  value={relatedUrl}
                  onChange={(e) => setRelatedUrl(e.target.value)}
                  placeholder="Ví dụ: /student/courses/123"
                  className="w-full rounded-xl border border-[#E8E6DC] bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-[#3898EC]"
                />
              </div>
              <div>
                <label htmlFor="feedback-description" className="block text-[13px] font-medium text-[#5E5D59] mb-1.5">
                  Nội dung
                </label>
                <textarea
                  id="feedback-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder="Mô tả chi tiết tình huống, mong muốn, hoặc các bước tái hiện lỗi..."
                  className="w-full rounded-xl border border-[#E8E6DC] bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-[#3898EC]"
                />
              </div>
              <div>
                <label htmlFor="feedback-files" className="block text-[13px] font-medium text-[#5E5D59] mb-1.5">
                  Tài liệu/ảnh liên quan (nhiều file)
                </label>
                <div className="rounded-xl border border-dashed border-[#D1CFC5] bg-white p-3">
                  <input
                    id="feedback-files"
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.txt,.ppt,.pptx"
                    onChange={(e) => {
                      const selected = e.target.files ? Array.from(e.target.files) : [];
                      setError(null);
                      setFiles((prev) => {
                        const combined = [...prev, ...selected];
                        if (combined.length > MAX_FILES) {
                          setError(`Chỉ được đính kèm tối đa ${MAX_FILES} file.`);
                          return combined.slice(0, MAX_FILES);
                        }
                        const tooLargeFile = combined.find((file) => file.size > MAX_EACH_FILE_BYTES);
                        if (tooLargeFile) {
                          setError(
                            `File "${tooLargeFile.name}" vượt quá ${formatBytes(MAX_EACH_FILE_BYTES)} mỗi file.`
                          );
                          return prev;
                        }
                        const sum = combined.reduce((acc, file) => acc + file.size, 0);
                        if (sum > MAX_TOTAL_SIZE_BYTES) {
                          setError(`Tổng dung lượng không được vượt ${formatBytes(MAX_TOTAL_SIZE_BYTES)}.`);
                          return prev;
                        }
                        return combined;
                      });
                      e.currentTarget.value = '';
                    }}
                    className="block w-full text-[13px] text-[#5E5D59]"
                  />
                  <p className="mt-2 text-[12px] text-[#87867F]">
                    Tối đa {MAX_FILES} file, tối đa {formatBytes(MAX_EACH_FILE_BYTES)}/file, tổng không quá{' '}
                    {formatBytes(MAX_TOTAL_SIZE_BYTES)}. Hiện tại: {files.length}/{MAX_FILES} file (
                    {formatBytes(totalFileBytes)}).
                  </p>
                  {files.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {files.map((file, idx) => (
                        <span
                          key={`${file.name}-${idx}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F5F4ED] text-[#4D4C48] text-[12px]"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          {file.name}
                          <button
                            type="button"
                            className="text-[#87867F] hover:text-[#141413]"
                            onClick={() => removeFileAt(idx)}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {error && <p className="text-[13px] text-[#B53333]">{error}</p>}
              {success && (
                <p className="text-[13px] text-[#2D8A6A] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {success}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141413] text-[#FAF9F5] text-[14px] font-medium disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Gửi góp ý
              </button>
            </form>
          </section>

          <aside className="lg:col-span-5 space-y-5">
            <div className="bg-[#FAF9F5] border border-[#F0EEE6] rounded-2xl p-5 shadow-[rgba(0,0,0,0.05)_0px_4px_24px]">
              <h2 className="text-[16px] font-semibold text-[#141413] mb-2">Hướng dẫn nhanh</h2>
              <ul className="text-[13px] text-[#5E5D59] space-y-1.5">
                <li>- `Tiêu đề` và `Nội dung` là bắt buộc.</li>
                <li>- Có thể đính kèm nhiều ảnh/tài liệu liên quan.</li>
                <li>- Admin có thể vào trực tiếp từ notification để xử lý.</li>
              </ul>
            </div>
            <div className="bg-[#FAF9F5] border border-[#F0EEE6] rounded-2xl p-5 shadow-[rgba(0,0,0,0.05)_0px_4px_24px]">
              <h2 className="text-[16px] font-semibold text-[#141413] mb-3">Góp ý gần đây</h2>
              <div className="rounded-xl border border-[#F0EEE6] bg-white overflow-hidden">
                {recentSorted.length === 0 ? (
                  <p className="text-[13px] text-[#87867F]">Bạn chưa gửi góp ý nào.</p>
                ) : (
                  <div className="max-h-[280px] overflow-y-auto divide-y divide-[#F0EEE6]">
                    {recentSorted.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        void openFeedbackDetail(item);
                      }}
                      className={`w-full text-left px-3 py-2.5 transition-colors ${
                        item.readByCurrentUser ? 'bg-white hover:bg-[#FAF9F5]' : 'bg-[#FDFCF8] hover:bg-[#F5F4ED]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] text-[#141413] font-medium truncate">{item.title}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F0EEE6] text-[#5E5D59] whitespace-nowrap">
                          {item.readByCurrentUser ? 'Đã đọc' : 'Chưa đọc'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#87867F] mt-1">
                        {new Date(item.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
      {detailItem && (
        <div
          className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetailItem(null);
          }}
        >
          <div className="w-full max-w-2xl rounded-2xl border border-[#E8E6DC] bg-[#FAF9F5] shadow-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-[18px] font-semibold text-[#141413]">{detailItem.title}</h3>
                <p className="text-[12px] text-[#87867F] mt-1">
                  {new Date(detailItem.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <button
                type="button"
                className="text-[#87867F] hover:text-[#141413]"
                onClick={() => setDetailItem(null)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-xl border border-[#F0EEE6] bg-white p-3 text-[13px] text-[#4D4C48] whitespace-pre-wrap">
              {detailItem.description}
            </div>
            {detailItem.responseMessage ? (
              <div className="mt-3 rounded-xl border border-[#E8E6DC] bg-[#F5F4ED] p-3">
                <p className="text-[12px] text-[#87867F] mb-1">
                  Admin phản hồi {detailItem.respondedByName ? `(${detailItem.respondedByName})` : ''}
                </p>
                <p className="text-[13px] text-[#4D4C48] whitespace-pre-wrap">{detailItem.responseMessage}</p>
              </div>
            ) : (
              <p className="mt-3 text-[13px] text-[#87867F]">Admin chưa phản hồi góp ý này.</p>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default FeedbackSubmitPage;
