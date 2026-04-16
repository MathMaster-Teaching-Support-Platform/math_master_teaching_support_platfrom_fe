import 'katex/dist/katex.min.css';
import {
  Archive,
  ChevronRight,
  Menu,
  Pencil,
  Plus,
  Sparkles,
  SquarePen,
  Trash2,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BlockMath, InlineMath } from 'react-katex';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent, mockTeacher } from '../../data/mockData';
import { AuthService } from '../../services/api/auth.service';
import {
  useArchiveChatSession,
  useChatSessionDetail,
  useChatSessionMemory,
  useChatSessionMessages,
  useChatSessions,
  useCreateChatSession,
  useDeleteChatSession,
  useRenameChatSession,
  useSendChatMessage,
} from '../../hooks/useChatSessions';
import { notifySubscriptionUpdated } from '../../services/api/subscription-plan.service';
import type { ChatMessageResponse } from '../../types';
import './AIAssistant.css';

type MathSegment =
  | { type: 'text'; value: string }
  | { type: 'inline-math'; value: string }
  | { type: 'block-math'; value: string };

function parseMathSegments(text: string): MathSegment[] {
  if (!text) return [{ type: 'text', value: '' }];
  const segments: MathSegment[] = [];
  const mathRegex = /\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = mathRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined || match[3] !== undefined) {
      segments.push({ type: 'block-math', value: (match[1] ?? match[3] ?? '').trim() });
    } else {
      segments.push({ type: 'inline-math', value: (match[2] ?? match[4] ?? '').trim() });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return segments.length ? segments : [{ type: 'text', value: text }];
}

const ChatMessageContent: React.FC<{ content: string }> = ({ content }) => {
  const segments = parseMathSegments(content);
  return (
    <div className="chat-content-rich">
      {segments.map((seg, i) => {
        if (seg.type === 'block-math') {
          return (
            <div key={i} className="math-block-wrap">
              <BlockMath
                math={seg.value}
                renderError={() => <code className="math-error">{`$$${seg.value}$$`}</code>}
              />
            </div>
          );
        }
        if (seg.type === 'inline-math') {
          return (
            <InlineMath
              key={i}
              math={seg.value}
              renderError={() => <code className="math-error">{`$${seg.value}$`}</code>}
            />
          );
        }
        return (
          <span key={i} style={{ whiteSpace: 'pre-wrap' }}>
            {seg.value}
          </span>
        );
      })}
    </div>
  );
};

const AIAssistant: React.FC = () => {
  const navigate = useNavigate();
  const currentRole = AuthService.getUserRole() || 'student';
  const layoutRole: 'teacher' | 'student' | 'admin' =
    currentRole === 'teacher' ? 'teacher' : currentRole === 'admin' ? 'admin' : 'student';
  const currentUser = currentRole === 'teacher' ? mockTeacher : mockStudent;
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [input, setInput] = useState('');
  const [pendingPrompt, setPendingPrompt] = useState('');
  const [localError, setLocalError] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [isSessionPanelOpen, setIsSessionPanelOpen] = useState(false);
  const hasBootstrappedSession = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sessionQueryParams = useMemo(() => ({ page: 0, size: 20 }), []);

  const messageQueryParams = useMemo(() => ({ page: 0, size: 50 }), []);

  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    error: sessionsError,
  } = useChatSessions(sessionQueryParams);

  const sessions = useMemo(() => sessionsData?.result.content ?? [], [sessionsData]);

  const { data: messagesData, error: messagesError } = useChatSessionMessages(
    selectedSessionId,
    messageQueryParams
  );

  const { data: sessionDetailData } = useChatSessionDetail(selectedSessionId);
  const { data: memoryData } = useChatSessionMemory(selectedSessionId);
  const createSessionMutation = useCreateChatSession();
  const sendMessageMutation = useSendChatMessage();
  const renameSessionMutation = useRenameChatSession();
  const archiveSessionMutation = useArchiveChatSession();
  const deleteSessionMutation = useDeleteChatSession();

  const selectedSession =
    sessionDetailData?.result ?? sessions.find((session) => session.id === selectedSessionId);
  const messages = useMemo(() => messagesData?.result.content ?? [], [messagesData]);
  const memory = memoryData?.result;
  const isArchived = selectedSession?.status === 'ARCHIVED';
  const isSending = sendMessageMutation.isPending;

  useEffect(() => {
    if (!isEditingTitle) {
      setEditingTitle(selectedSession?.title ?? '');
    }
  }, [isEditingTitle, selectedSession?.title]);

  const displayMessages: ChatMessageResponse[] =
    pendingPrompt && selectedSessionId
      ? [
          ...messages,
          {
            id: 'pending-user-message',
            sessionId: selectedSessionId,
            userId: '',
            role: 'USER',
            content: pendingPrompt,
            wordCount: pendingPrompt.trim().split(/\s+/).length,
            model: selectedSession?.model ?? 'gemini-2.5-flash',
            latencyMs: 0,
            sequenceNo: messages.length + 1,
            createdAt: new Date().toISOString(),
          },
        ]
      : messages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages.length, isSending]);

  const getErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }
    return fallback;
  };

  const handleNewChat = async () => {
    try {
      setLocalError('');
      const response = await createSessionMutation.mutateAsync({
        title: 'New Chat',
        model: 'gemini-2.5-flash',
      });
      setSelectedSessionId(response.result.id);
      setIsEditingTitle(false);
      setInput('');
    } catch (error) {
      setLocalError(getErrorMessage(error, 'Không thể tạo phiên chat mới.'));
    }
  };

  useEffect(() => {
    if (hasBootstrappedSession.current) return;
    hasBootstrappedSession.current = true;
    void handleNewChat();
    // Intentionally run once per page mount to always start with a new session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    const prompt = input.trim();
    if (!prompt) return;

    try {
      setLocalError('');

      let sessionId = selectedSessionId;
      if (!sessionId) {
        const sessionResponse = await createSessionMutation.mutateAsync({
          title: 'New Chat',
          model: 'gemini-2.5-flash',
        });
        sessionId = sessionResponse.result.id;
        setSelectedSessionId(sessionId);
      }

      setPendingPrompt(prompt);
      setInput('');

      await sendMessageMutation.mutateAsync({
        sessionId,
        payload: {
          prompt,
          temperature: 0.4,
          maxOutputTokens: 800,
        },
      });
      notifySubscriptionUpdated();
    } catch (error) {
      const apiError = error as Error & { code?: number };
      if (apiError.code === 1164) {
        setLocalError('Ban chua co goi active. Vui long mua goi de tiep tuc su dung AI.');
        if (window.confirm('Ban chua co goi active. Mo trang mua goi ngay?')) {
          navigate('/pricing');
        }
      } else if (apiError.code === 1165) {
        setLocalError('Token cua goi da het. Vui long mua them goi hoac nap tien.');
        if (window.confirm('Token da het. Mo trang goi va vi de nap/mua ngay?')) {
          navigate(`/${layoutRole}/wallet`);
        }
      } else {
        setLocalError(getErrorMessage(error, 'Không thể gửi prompt.'));
      }
      setInput(prompt);
    } finally {
      setPendingPrompt('');
    }
  };

  const handleRenameSession = async () => {
    if (!selectedSessionId) return;

    const nextTitle = editingTitle.trim();
    if (!nextTitle) {
      setLocalError('Tiêu đề session không được để trống.');
      return;
    }

    try {
      setLocalError('');
      await renameSessionMutation.mutateAsync({
        sessionId: selectedSessionId,
        payload: { title: nextTitle },
      });
      setIsEditingTitle(false);
    } catch (error) {
      setLocalError(getErrorMessage(error, 'Không thể đổi tên session.'));
    }
  };

  const handleArchiveSession = async () => {
    if (!selectedSessionId || isArchived) return;

    try {
      setLocalError('');
      await archiveSessionMutation.mutateAsync(selectedSessionId);
    } catch (error) {
      setLocalError(getErrorMessage(error, 'Không thể archive session.'));
    }
  };

  const handleDeleteSession = async () => {
    if (!selectedSessionId) return;

    const confirmDelete = window.confirm('Bạn có chắc muốn xóa session này không?');
    if (!confirmDelete) return;

    try {
      setLocalError('');
      const removedSessionId = selectedSessionId;
      await deleteSessionMutation.mutateAsync(removedSessionId);
      const nextSession = sessions.find((session) => session.id !== removedSessionId);
      setSelectedSessionId(nextSession?.id ?? '');
    } catch (error) {
      setLocalError(getErrorMessage(error, 'Không thể xóa session.'));
    }
  };

  const quickPrompts = [
    'Giải phương trình bậc 2',
    'Tạo đề kiểm tra 15 phút',
    'Vẽ đồ thị hàm số y = x^2',
    'Giải thích định lý Pythagoras',
    'Tạo bài tập về đạo hàm',
    'Vẽ hình tam giác đều',
  ];

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const formatDateTime = (value?: string) => {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleString('vi-VN');
  };

  const combinedError =
    localError ||
    (sessionsError ? getErrorMessage(sessionsError, 'Lỗi tải danh sách session') : '') ||
    (messagesError ? getErrorMessage(messagesError, 'Lỗi tải lịch sử chat') : '');
  const hasConversationStarted = displayMessages.length > 0 || isSending;

  return (
    <DashboardLayout
      role={layoutRole}
      user={{ name: currentUser.name, avatar: currentUser.avatar!, role: layoutRole }}
      notificationCount={5}
    >
      <div className={`gemini-chat-page ${isSessionPanelOpen ? '' : 'session-collapsed'}`}>
        <section className="gemini-main">
          <header className="main-header">
            {isEditingTitle ? (
              <div className="title-edit-row">
                <input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  maxLength={200}
                  placeholder="Nhập tiêu đề session"
                />
                <button
                  type="button"
                  className="header-btn primary"
                  onClick={() => void handleRenameSession()}
                >
                  Lưu
                </button>
                <button
                  type="button"
                  className="header-btn ghost"
                  onClick={() => {
                    setIsEditingTitle(false);
                    setEditingTitle(selectedSession?.title ?? '');
                  }}
                >
                  Hủy
                </button>
              </div>
            ) : (
              <div className="session-heading">
                <h1>{selectedSession?.title ?? 'Cuộc trò chuyện mới'}</h1>
              </div>
            )}

            <div className="header-actions">
              <button
                type="button"
                className="header-btn ghost"
                onClick={() => setIsEditingTitle((prev) => !prev)}
                disabled={!selectedSessionId || renameSessionMutation.isPending}
                title="Đổi tên"
              >
                <Pencil size={15} />
                <span>Rename</span>
              </button>
              <button
                type="button"
                className="header-btn ghost"
                onClick={() => void handleArchiveSession()}
                disabled={!selectedSessionId || isArchived || archiveSessionMutation.isPending}
                title="Lưu trữ"
              >
                <Archive size={15} />
                <span>Archive</span>
              </button>
              <button
                type="button"
                className="header-btn danger"
                onClick={() => void handleDeleteSession()}
                disabled={!selectedSessionId || deleteSessionMutation.isPending}
                title="Xóa"
              >
                <Trash2 size={15} />
                <span>Delete</span>
              </button>
            </div>
          </header>

          <div className="message-stream">
            {combinedError && <div className="error-banner">{combinedError}</div>}

            {!hasConversationStarted && (
              <div className="empty-state-welcome">
                <div className="welcome-icon">
                  <Sparkles size={36} />
                </div>
                <h2>Trợ lý Toán học AI</h2>
                <p>
                  Hỏi bất kỳ câu hỏi toán học nào — giải phương trình, chứng minh, tạo đề kiểm
                  tra...
                </p>
              </div>
            )}

            {displayMessages.map((message) => (
              <article
                key={message.id}
                className={`chat-row ${message.role === 'USER' ? 'chat-user' : 'chat-assistant'}`}
              >
                <div className="chat-avatar">
                  {message.role === 'USER' ? (currentUser.name?.[0] ?? 'U') : 'AI'}
                </div>
                <div className="chat-body">
                  <ChatMessageContent content={message.content} />
                  <time>{formatDateTime(message.createdAt)}</time>
                </div>
              </article>
            ))}

            {isSending && (
              <article className="chat-row chat-assistant">
                <div className="chat-avatar">AI</div>
                <div className="chat-body typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </article>
            )}
            <div ref={messagesEndRef} />
          </div>

          <footer className="composer-wrap">
            {!hasConversationStarted && (
              <div className="quick-chips" role="list">
                {quickPrompts.map((prompt) => (
                  <button
                    type="button"
                    key={prompt}
                    className="chip"
                    onClick={() => handleQuickPrompt(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <div className={`composer-box ${hasConversationStarted ? 'compact' : ''}`}>
              <textarea
                placeholder="Hỏi AI trợ lý toán học..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                disabled={isSending || isArchived}
              />
              <div className="composer-actions">
                <button
                  type="button"
                  className="send-btn"
                  onClick={() => void handleSend()}
                  disabled={isSending || isArchived || !input.trim()}
                  title="Gửi (Enter)"
                  aria-label="Gửi"
                >
                  <ChevronRight size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </footer>
        </section>

        <aside className={`gemini-sidebar right ${isSessionPanelOpen ? '' : 'collapsed'}`}>
          <button
            type="button"
            className="sidebar-toggle-btn sidebar-icon-btn"
            onClick={() => setIsSessionPanelOpen((prev) => !prev)}
            title={isSessionPanelOpen ? 'Thu gọn panel session' : 'Mở panel session'}
            aria-label={isSessionPanelOpen ? 'Thu gọn panel session' : 'Mở panel session'}
          >
            <Menu size={19} strokeWidth={2.25} />
          </button>

          <div
            className={`session-panel-expanded ${isSessionPanelOpen ? 'is-visible' : 'is-hidden'}`}
          >
            <button
              type="button"
              className="new-session-btn"
              onClick={() => void handleNewChat()}
              disabled={createSessionMutation.isPending}
            >
              <Plus size={16} />
              <span>Cuộc trò chuyện mới</span>
            </button>

            <div className="session-list-title">Cuộc trò chuyện</div>
            <div className="session-list">
              {sessionsLoading && <div className="session-muted">Đang tải sessions...</div>}
              {!sessionsLoading && sessions.length === 0 && (
                <div className="session-muted">Chưa có cuộc trò chuyện nào.</div>
              )}
              {sessions.map((session) => (
                <button
                  type="button"
                  key={session.id}
                  className={`session-item ${session.id === selectedSessionId ? 'active' : ''}`}
                  onClick={() => setSelectedSessionId(session.id)}
                >
                  <span className="session-title">{session.title}</span>
                  <span className="session-subtitle">
                    {session.status} · {formatDateTime(session.lastMessageAt)}
                  </span>
                </button>
              ))}
            </div>

            <div className="session-footer">
              <div className="session-footer-item">
                <span className="session-footer-label">Memory limit</span>
                <span className="session-footer-value">{memory?.wordLimit ?? 1000} words</span>
              </div>
              <div className="session-footer-item">
                <span className="session-footer-label">Used</span>
                <span className="session-footer-value">{memory?.currentWords ?? 0} words</span>
              </div>
            </div>
          </div>

          <div className={`collapsed-actions ${isSessionPanelOpen ? 'is-hidden' : 'is-visible'}`}>
            <button
              type="button"
              className="new-session-btn collapsed sidebar-icon-btn"
              onClick={() => void handleNewChat()}
              disabled={createSessionMutation.isPending}
              title="Tạo cuộc trò chuyện mới"
              aria-label="Tạo cuộc trò chuyện mới"
            >
              <SquarePen size={19} strokeWidth={2.1} />
            </button>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
};

export default AIAssistant;
