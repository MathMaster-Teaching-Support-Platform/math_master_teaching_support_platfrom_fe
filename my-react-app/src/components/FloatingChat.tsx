import 'katex/dist/katex.min.css';
import { MessageCircle, Minus, Send, Sparkles, X } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  useChatSessionMessages,
  useCreateChatSession,
  useSendChatMessage,
} from '../hooks/useChatSessions';
import { notifySubscriptionUpdated } from '../services/api/subscription-plan.service';
import './FloatingChat.css';

const AI_PAGE_PATHS = ['/teacher/ai-assistant', '/student/ai-assistant', '/admin/ai-assistant'];
const PERSIST_KEY = 'mm.floatingChat.sessionId';

const FloatingChat: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [sessionId, setSessionId] = useState<string>(
    () => localStorage.getItem(PERSIST_KEY) ?? '',
  );

  const messageQueryParams = useMemo(() => ({ page: 0, size: 50 }), []);
  const createSessionMutation = useCreateChatSession();
  const sendMessageMutation = useSendChatMessage();
  const { data: messagesData } = useChatSessionMessages(sessionId, messageQueryParams);

  const messages = useMemo(() => messagesData?.result.content ?? [], [messagesData]);
  const isSending = sendMessageMutation.isPending;

  // Persist session ID across navigation
  useEffect(() => {
    if (sessionId) localStorage.setItem(PERSIST_KEY, sessionId);
  }, [sessionId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isSending, isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 100)}px`;
  }, [input]);

  const ensureSession = async (): Promise<string> => {
    if (sessionId) return sessionId;
    const response = await createSessionMutation.mutateAsync({
      title: 'Quick Chat',
      model: 'gemini-2.5-flash',
    });
    const newId = response.result.id;
    setSessionId(newId);
    return newId;
  };

  const handleOpen = async () => {
    setIsOpen(true);
    if (!sessionId) {
      try {
        await ensureSession();
      } catch {
        setError('Không thể kết nối AI.');
      }
    }
  };

  const handleSend = async () => {
    const prompt = input.trim();
    if (!prompt || isSending) return;

    try {
      setError('');
      setInput('');
      const sid = await ensureSession();
      await sendMessageMutation.mutateAsync({
        sessionId: sid,
        payload: { prompt, temperature: 0.4, maxOutputTokens: 600 },
      });
      notifySubscriptionUpdated();
    } catch {
      setError('Không thể gửi tin nhắn.');
      setInput(prompt);
    }
  };

  // Hide on the dedicated AI assistant pages
  const isOnAIPage = AI_PAGE_PATHS.includes(location.pathname);
  if (isOnAIPage) return null;

  return (
    <div className="fc-root">
      {isOpen ? (
        <div className="fc-panel">
          {/* Header */}
          <div className="fc-header">
            <div className="fc-header-info">
              <div className="fc-header-avatar">
                <Sparkles size={15} />
              </div>
              <div>
                <div className="fc-header-title">AI Toán học</div>
                <div className="fc-header-sub">Luôn sẵn sàng hỗ trợ</div>
              </div>
            </div>
            <div className="fc-header-actions">
              <button
                type="button"
                className="fc-icon-btn"
                onClick={() => setIsOpen(false)}
                title="Thu gọn"
              >
                <Minus size={16} />
              </button>
              <button
                type="button"
                className="fc-icon-btn"
                onClick={() => {
                  setIsOpen(false);
                  setSessionId('');
                  localStorage.removeItem(PERSIST_KEY);
                }}
                title="Đóng"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="fc-messages">
            {messages.length === 0 && !isSending && (
              <div className="fc-empty">
                <div className="fc-empty-icon">
                  <Sparkles size={24} />
                </div>
                <p>Xin chào! Tôi có thể giúp gì cho bạn?</p>
              </div>
            )}

            {messages.map((msg) => {
              const isUser = msg.role === 'USER';
              return (
                <div
                  key={msg.id}
                  className={`fc-msg ${isUser ? 'fc-msg-user' : 'fc-msg-ai'}`}
                >
                  {!isUser && (
                    <div className="fc-msg-avatar">
                      <Sparkles size={11} />
                    </div>
                  )}
                  <div className="fc-msg-bubble">{msg.content}</div>
                </div>
              );
            })}

            {isSending && (
              <div className="fc-msg fc-msg-ai">
                <div className="fc-msg-avatar">
                  <Sparkles size={11} />
                </div>
                <div className="fc-msg-bubble fc-typing">
                  <span />
                  <span />
                  <span />
                </div>
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
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
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
              <Send size={15} />
            </button>
          </div>
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
