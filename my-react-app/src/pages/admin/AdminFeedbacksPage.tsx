import { Loader2, MessageSquare, Send } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { FeedbackService } from '../../services/api/feedback.service';
import type { FeedbackItem } from '../../types/feedback';

const AdminFeedbacksPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const focusedFeedbackId = searchParams.get('feedbackId');
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const activeItem = useMemo(() => items.find((i) => i.id === activeId) || null, [items, activeId]);
  const handleSelectFeedback = async (item: FeedbackItem) => {
    setActiveId(item.id);
    if (item.readByCurrentUser) return;
    try {
      const updated = await FeedbackService.markAsRead(item.id);
      setItems((prev) => prev.map((f) => (f.id === item.id ? updated.result : f)));
    } catch {
      // ignore mark-read failures; still open detail panel
    }
  };
  const listContent = useMemo(() => {
    if (loading) {
      return (
        <div className="p-5 flex items-center gap-2 text-[#87867F]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Đang tải dữ liệu...
        </div>
      );
    }
    if (items.length === 0) {
      return <p className="p-5 text-[14px] text-[#87867F]">Chưa có góp ý nào.</p>;
    }
    return items.map((item) => (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          void handleSelectFeedback(item);
        }}
        className={`w-full text-left px-4 py-3 transition-colors ${
          item.id === activeId ? 'bg-[#F0EEE6]' : 'hover:bg-[#F5F4ED]'
        }`}
      >
        <p className="text-[14px] font-medium text-[#141413]">{item.title}</p>
        <p className="text-[12px] text-[#87867F] mt-1">{item.senderName || item.senderEmail || item.senderId}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-[#E8E6DC] text-[#5E5D59]">
            {item.readByCurrentUser ? 'Đã đọc' : 'Chưa đọc'}
          </span>
          {item.senderRole && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#E8E6DC] text-[#4D4C48]">
              {item.senderRole}
            </span>
          )}
        </div>
      </button>
    ));
  }, [activeId, items, loading]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await FeedbackService.adminGetAll(0, 50);
      setItems(res.result.content);
      if (res.result.content.length > 0) {
        const target = focusedFeedbackId && res.result.content.find((x) => x.id === focusedFeedbackId)?.id;
        if (target) {
          setActiveId(target);
          const targetItem = res.result.content.find((x) => x.id === target);
          if (targetItem) {
            void handleSelectFeedback(targetItem);
          }
        } else if (activeId && res.result.content.some((x) => x.id === activeId)) {
          setActiveId(activeId);
        } else {
          setActiveId(null);
        }
      } else {
        setActiveId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách góp ý.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [focusedFeedbackId]);

  const onRespond = async () => {
    if (!activeItem) return;
    if (!responseMessage.trim()) {
      setError('Vui lòng nhập nội dung phản hồi.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await FeedbackService.respond(activeItem.id, { responseMessage: responseMessage.trim() });
      setResponseMessage('');
      setSuccess('Đã gửi phản hồi cho người dùng.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể phản hồi góp ý.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="admin" user={{ name: '', avatar: '', role: 'admin' }} notificationCount={0}>
      <div className="p-6 lg:p-8 min-h-screen bg-[#F5F4ED]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] text-[#5E5D59] flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-[24px] font-semibold text-[#141413]">Báo cáo góp ý</h1>
              <p className="text-[14px] text-[#87867F]">Tiếp nhận, xem chi tiết và phản hồi cho user.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-5 bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#F0EEE6] text-[13px] text-[#87867F]">
                Danh sách ({items.length})
              </div>
              <div className="max-h-[68vh] overflow-y-auto divide-y divide-[#F0EEE6]">
                {listContent}
              </div>
            </section>

            <section className="lg:col-span-7 bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] p-5">
              {activeItem ? (
                <div>
                  <h2 className="text-[20px] font-semibold text-[#141413]">{activeItem.title}</h2>
                  <div className="mt-2 text-[13px] text-[#87867F] flex flex-wrap gap-x-4 gap-y-1">
                    <span>Từ: {activeItem.senderName || activeItem.senderEmail || activeItem.senderId}</span>
                    <span>Thời gian: {new Date(activeItem.createdAt).toLocaleString('vi-VN')}</span>
                    {activeItem.relatedUrl && <span>Link: {activeItem.relatedUrl}</span>}
                  </div>
                  <div className="mt-4 p-4 rounded-xl border border-[#F0EEE6] bg-white text-[14px] text-[#4D4C48] whitespace-pre-wrap">
                    {activeItem.description}
                  </div>
                  {activeItem.attachments && activeItem.attachments.length > 0 && (
                    <div className="mt-4 rounded-xl border border-[#F0EEE6] bg-white p-4">
                      <p className="text-[13px] font-medium text-[#5E5D59] mb-2">Tài liệu đính kèm</p>
                      <div className="space-y-2">
                        {activeItem.attachments.map((att) => (
                          <a
                            key={att.id}
                            href={att.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-[13px] text-[#2A5DB0] hover:underline"
                          >
                            {att.fileName}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeItem.responseMessage && (
                    <div className="mt-4 p-4 rounded-xl border border-[#E8E6DC] bg-[#F5F4ED]">
                      <p className="text-[12px] text-[#87867F] mb-1">
                        Đã phản hồi bởi {activeItem.respondedByName || 'Admin'}
                      </p>
                      <p className="text-[14px] text-[#4D4C48] whitespace-pre-wrap">{activeItem.responseMessage}</p>
                    </div>
                  )}

                  {activeItem.status !== 'RESPONDED' && (
                    <div className="mt-5 space-y-3">
                      <label
                        htmlFor="feedback-admin-response"
                        className="block text-[13px] font-medium text-[#5E5D59]"
                      >
                        Phản hồi admin
                      </label>
                      <textarea
                        id="feedback-admin-response"
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        rows={4}
                        className="w-full rounded-xl border border-[#E8E6DC] bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-[#3898EC]"
                        placeholder="Nhập nội dung phản hồi cho người gửi..."
                      />
                      <button
                        onClick={onRespond}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141413] text-[#FAF9F5] text-[14px] font-medium disabled:opacity-60"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Gửi phản hồi
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[14px] text-[#87867F]">Chọn một góp ý để xem chi tiết.</p>
              )}
              {error && <p className="mt-4 text-[13px] text-[#B53333]">{error}</p>}
              {success && <p className="mt-4 text-[13px] text-[#2D8A6A]">{success}</p>}
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminFeedbacksPage;
