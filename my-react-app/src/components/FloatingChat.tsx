import 'katex/dist/katex.min.css';
import { ArrowUp, Clock, MessageCircle, Minus, Plus, Sparkles, X } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  useChatSessionMessages,
  useChatSessions,
  useCreateChatSession,
  useSendChatMessage,
} from '../hooks/useChatSessions';
import { notifySubscriptionUpdated } from '../services/api/subscription-plan.service';
import './FloatingChat.css';

const AI_PAGE_PATHS = ['/teacher/ai-assistant', '/student/ai-assistant', '/admin/ai-assistant'];
const PERSIST_KEY = 'mm.floatingChat.sessionId';

function relativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

const FloatingChat: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'chat' | 'sessions'>('chat');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [sessionId, setSessionId] = useState<string>(
    () => localStorage.getItem(PERSIST_KEY) ?? '',
  );

  const messageQueryParams = useMemo(() => ({ page: 0, size: 50 }), []);
  const sessionListParams = useMemo(() => ({ page: 0, size: 20 }), []);
  const createSessionMutation = useCreateChatSession();
  const sendMessageMutation = useSendChatMessage();
  const { data: messagesData } = useChatSessionMessages(sessionId, messageQueryParams);
  const { data: sessionsData } = useChatSessions(sessionListParams);

  const messages = useMemo(() => messagesData?.result.content ?? [], [messagesData]);
  const sessions = useMemo(() => sessionsData?.result?.content ?? [], [sessionsData]);
  const isSending = sendMessageMutation.isPending;

  useEffect(() => {
    if (sessionId) localStorage.setItem(PERSIST_KEY, sessionId);
  }, [sessionId]);

  useEffect(() => {
    if (isOpen && view === 'chat') messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isSending, isOpen, view]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 100)}px`;
  }, [input]);

  const ensureSession = async (): Promise<string> => {
    if (sessionId) return sessionId;
    const res = await createSessionMutation.mutateAsync({ title: 'Quick Chat', model: 'gemini-2.5-flash' });
    const newId = res.result.id;
    setSessionId(newId);
    return newId;
  };

  const handleOpen = async () => {
    setIsOpen(true);
    setView('chat');
    if (!sessionId) {
      try { await ensureSession(); } catch { setError('Không thể kết nối AI.'); }
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await createSessionMutation.mutateAsync({ title: 'Quick Chat', model: 'gemini-2.5-flash' });
      const newId = res.result.id;
      setSessionId(newId);
      localStorage.setItem(PERSIST_KEY, newId);
      setView('chat');
      setInput('');
      setError('');
    } catch {
      setError('Không thể tạo cuộc trò chuyện mới.');
    }
  };

  const handleSelectSession = (id: string) => {
    setSessionId(id);
    localStorage.setItem(PERSIST_KEY, id);
    setView('chat');
  };

  const handleSend = async () => {
    const prompt = input.trim();
    if (!prompt || isSending) return;
    try {
      setError('');
      setInput('');
      const sid = await ensureSession();
      await sendMessageMutation.mutateAsync({ sessionId: sid, payload: { prompt, temperature: 0.4, maxOutputTokens: 600 } });
      notifySubscriptionUpdated();
    } catch {
      setError('Không thể gửi tin nhắn.');
      setInput(prompt);
    }
  };

  const isOnAIPage = AI_PAGE_PATHS.includes(location.pathname);
  if (isOnAIPage) return null;

  return (
    <div className="fc-root">
      {isOpen ? (
        <div className="fc-panel">
          {/* Header */}
          <div className="fc-header">
            <div className="fc-header-info">
              <div className="fc-header-avatar"><Sparkles size={15} /></div>
              <div>
                <div className="fc-header-title">AI Toán học</div>
                <div className="fc-header-sub">{view === 'sessions' ? 'Lịch sử chat' : 'Luôn sẵn sàng hỗ trợ'}</div>
              </div>
            </div>
            <div className="fc-header-actions">
              <button
                type="button"
                className={`fc-icon-btn ${view === 'sessions' ? 'fc-icon-btn--active' : ''}`}
                onClick={() => setView((v) => (v === 'sessions' ? 'chat' : 'sessions'))}
                title="Lịch sử chat"
              >
                <Clock size={14} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                className="fc-icon-btn"
                onClick={() => setIsOpen(false)}
                title="Thu gọn"
              >
                <Minus size={14} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                className="fc-icon-btn"
                onClick={() => { setIsOpen(false); setSessionId(''); localStorage.removeItem(PERSIST_KEY); }}
                title="Đóng"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {view === 'sessions' ? (
            /* Sessions list */
            <div className="fc-sessions">
              <button
                type="button"
                className="fc-new-chat-btn"
                onClick={() => void handleNewChat()}
                disabled={createSessionMutation.isPending}
              >
                <Plus size={14} strokeWidth={2.5} />
                Chat mới
              </button>
              <div className="fc-session-list">
                {sessions.length === 0 && (
                  <div className="fc-session-empty">Chưa có cuộc trò chuyện nào</div>
                )}
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`fc-session-item ${s.id === sessionId ? 'fc-session-item--active' : ''}`}
                    onClick={() => handleSelectSession(s.id)}
                  >
                    <span className="fc-session-title">{s.title || 'Quick Chat'}</span>
                    <span className="fc-session-time">{relativeTime(s.lastMessageAt)}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="fc-messages">
                {messages.length === 0 && !isSending && (
                  <div className="fc-empty">
                    <div className="fc-empty-icon"><Sparkles size={24} /></div>
                    <p>Xin chào! Tôi có thể giúp gì cho bạn?</p>
                  </div>
                )}
                {messages.map((msg) => {
                  const isUser = msg.role === 'USER';
                  return (
                    <div key={msg.id} className={`fc-msg ${isUser ? 'fc-msg-user' : 'fc-msg-ai'}`}>
                      {!isUser && <div className="fc-msg-avatar"><Sparkles size={11} /></div>}
                      <div className="fc-msg-bubble">{msg.content}</div>
                    </div>
                  );
                })}
                {isSending && (
                  <div className="fc-msg fc-msg-ai">
                    <div className="fc-msg-avatar"><Sparkles size={11} /></div>
                    <div className="fc-msg-bubble fc-typing"><span /><span /><span /></div>
                  </div>
                )}
                {error && <div className="fc-error">{error}</div>}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="fc-input-wrap">
                <textarea
                  ref={textareaRef}
                  className="fc-textarea"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); }
                  }}
                  placeholder="Hỏi AI..."
                  disabled={isSending}
                  rows={1}
                />
                <button
                  type="button"
                  className="fc-send-btn"
                  onClick={() => void handleSend()}
                  disabled={isSending || !input.trim()}
                  aria-label="Gửi"
                >
                  <ArrowUp size={16} strokeWidth={2.5} />
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          type="button"
          className="fc-trigger"
          onClick={() => void handleOpen()}
          title="Chat với AI Toán học"
          aria-label="Mở chat AI"
        >
          <MessageCircle size={22} strokeWidth={2} />
          <span className="fc-trigger-label">AI</span>
        </button>
      )}
    </div>
  );
};

export default FloatingChat;
