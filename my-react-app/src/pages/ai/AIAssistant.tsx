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

// ── Inline markdown + math renderer ──────────────────────────────────────────
function renderInline(text: string): React.ReactNode[] {
  if (!text) return [];
  const re =
    /\*\*([^*\n]+?)\*\*|\*([^*\n]+?)\*|`([^`\n]+?)`|\\\(([^)]+?)\\\)|\$([^$\n]+?)\$/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let idx = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(<React.Fragment key={`t${idx++}`}>{text.slice(last, m.index)}</React.Fragment>);
    }
    const k = idx++;
    if (m[1] !== undefined) {
      parts.push(<strong key={k}>{m[1]}</strong>);
    } else if (m[2] !== undefined) {
      parts.push(<em key={k}>{m[2]}</em>);
    } else if (m[3] !== undefined) {
      parts.push(
        <code key={k} className="md-code-inline">
          {m[3]}
        </code>,
      );
    } else if (m[4] !== undefined) {
      parts.push(
        <InlineMath
          key={k}
          math={m[4]}
          renderError={() => <code className="math-error">{`\\(${m[4]}\\)`}</code>}
        />,
      );
    } else if (m[5] !== undefined) {
      parts.push(
        <InlineMath
          key={k}
          math={m[5]}
          renderError={() => <code className="math-error">{`$${m[5]}$`}</code>}
        />,
      );
    }
    last = m.index + m[0].length;
  }

  if (last < text.length) {
    parts.push(<React.Fragment key={`t${idx++}`}>{text.slice(last)}</React.Fragment>);
  }

  return parts.length > 0 ? parts : [<React.Fragment key="all">{text}</React.Fragment>];
}

// ── Line-level markdown processor ────────────────────────────────────────────
function processLines(lines: string[], keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    // Headers
    const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length as 1 | 2 | 3;
      const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
      nodes.push(
        <Tag key={`${keyPrefix}-h${i}`} className={`md-heading md-h${level}`}>
          {renderInline(headerMatch[2])}
        </Tag>,
      );
      i++;
      continue;
    }

    // Unordered list
    if (/^[-*+]\s/.test(line)) {
      const items: string[] = [];
      const startI = i;
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+]\s+/, ''));
        i++;
      }
      nodes.push(
        <ul key={`${keyPrefix}-ul${startI}`} className="md-ul">
          {items.map((item, j) => (
            <li key={j}>{renderInline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      const startI = i;
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      nodes.push(
        <ol key={`${keyPrefix}-ol${startI}`} className="md-ol">
          {items.map((item, j) => (
            <li key={j}>{renderInline(item)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Paragraph — collect consecutive non-empty, non-block lines
    const paraLines: string[] = [];
    const startI = i;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,3}\s|[-*+]\s|\d+\.\s)/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }

    if (paraLines.length > 0) {
      nodes.push(
        <p key={`${keyPrefix}-p${startI}`} className="md-para">
          {paraLines.map((pl, j) => (
            <React.Fragment key={j}>
              {j > 0 && <br />}
              {renderInline(pl)}
            </React.Fragment>
          ))}
        </p>,
      );
    }
  }

  return nodes;
}

// ── Main message content renderer (markdown + math + code blocks) ─────────────
const ChatMessageContent: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  const blocks: React.ReactNode[] = [];
  const topRe =
    /```([\w]*)\n?([\s\S]*?)```|\\\[([\s\S]+?)\\\]|\$\$([\s\S]+?)\$\$/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let bk = 0;

  while ((m = topRe.exec(content)) !== null) {
    if (m.index > last) {
      const lineNodes = processLines(content.slice(last, m.index).split('\n'), `b${bk}`);
      if (lineNodes.length > 0) {
        blocks.push(
          <div key={`tb${bk}`} className="md-text-block">
            {lineNodes}
          </div>,
        );
      }
      bk++;
    }

    if (m[0].startsWith('```')) {
      blocks.push(
        <pre key={`cb${bk++}`} className="md-code-block">
          {m[1] && <span className="md-code-lang">{m[1]}</span>}
          <code>{(m[2] ?? '').trim()}</code>
        </pre>,
      );
    } else {
      const mathVal = (m[3] ?? m[4] ?? '').trim();
      blocks.push(
        <div key={`mb${bk++}`} className="math-block-wrap">
          <BlockMath
            math={mathVal}
            renderError={() => (
              <code className="math-error">{`$$${mathVal}$$`}</code>
            )}
          />
        </div>,
      );
    }
    last = m.index + m[0].length;
  }

  if (last < content.length) {
    const lineNodes = processLines(content.slice(last).split('\n'), `b${bk}`);
    if (lineNodes.length > 0) {
      blocks.push(
        <div key={`tb${bk}`} className="md-text-block">
          {lineNodes}
        </div>,
      );
    }
  }

  return <div className="chat-content-rich">{blocks}</div>;
};

// ── Main component ────────────────────────────────────────────────────────────
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
  const [tokenModal, setTokenModal] = useState<{ type: 'no-plan' | 'no-token' } | null>(null);
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
    messageQueryParams,
  );

  const { data: sessionDetailData } = useChatSessionDetail(selectedSessionId);
  const { data: memoryData } = useChatSessionMemory(selectedSessionId);
  const createSessionMutation = useCreateChatSession();
  const sendMessageMutation = useSendChatMessage();
  const renameSessionMutation = useRenameChatSession();
  const archiveSessionMutation = useArchiveChatSession();
  const deleteSessionMutation = useDeleteChatSession();

  const selectedSession =
    sessionDetailData?.result ?? sessions.find((s) => s.id === selectedSessionId);
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
        setLocalError('Bạn chưa có gói active. Vui lòng mua gói để tiếp tục sử dụng AI.');
        setTokenModal({ type: 'no-plan' });
      } else if (apiError.code === 1165) {
        setLocalError('Token của gói đã hết. Vui lòng mua thêm gói hoặc nạp tiền.');
        setTokenModal({ type: 'no-token' });
      } else if (apiError.code === 1166) {
        setLocalError('Bạn không đủ token để thanh toán dịch vụ, vui lòng mua gói.');
        setTokenModal({ type: 'no-plan' });
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
    if (!window.confirm('Bạn có chắc muốn xóa session này không?')) return;
    try {
      setLocalError('');
      const removedSessionId = selectedSessionId;
      await deleteSessionMutation.mutateAsync(removedSessionId);
      const nextSession = sessions.find((s) => s.id !== removedSessionId);
      setSelectedSessionId(nextSession?.id ?? '');
    } catch (error) {
      setLocalError(getErrorMessage(error, 'Không thể xóa session.'));
    }
  };

  const quickPrompts = [
    'Giải phương trình bậc 2',
    'Tạo đề kiểm tra 15 phút',
    'Vẽ đồ thị hàm số y = x²',
    'Giải thích định lý Pythagoras',
    'Tạo bài tập về đạo hàm',
    'Tích phân từng phần',
  ];

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
        {/* ── Main area ── */}
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
                <div className="session-heading-icon" aria-hidden="true">
                  <Sparkles size={15} />
                </div>
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
                  <Sparkles size={32} />
                </div>
                <h2>Trợ lý Toán học AI</h2>
                <p>
                  Hỏi bất kỳ câu hỏi toán học nào — giải phương trình, chứng minh, tạo đề
                  kiểm tra...
                </p>
              </div>
            )}

            {displayMessages.map((message) => {
              const isUser = message.role === 'USER';
              return (
                <article
                  key={message.id}
                  className={`chat-row ${isUser ? 'chat-user' : 'chat-assistant'}`}
                >
                  <div className={`chat-avatar ${isUser ? 'user-avatar' : 'ai-avatar'}`}>
                    {isUser ? (currentUser.name?.[0] ?? 'U') : <Sparkles size={16} />}
                  </div>
                  <div className="chat-body">
                    <ChatMessageContent content={message.content} />
                    <time>{formatDateTime(message.createdAt)}</time>
                  </div>
                </article>
              );
            })}

            {isSending && (
              <article className="chat-row chat-assistant">
                <div className="chat-avatar ai-avatar">
                  <Sparkles size={16} />
                </div>
                <div className="chat-body typing">
                  <span />
                  <span />
                  <span />
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
                    onClick={() => setInput(prompt)}
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

        {/* ── Session sidebar ── */}
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

      {/* ── Token / Plan alert modal ── */}
      {tokenModal && (
        <div
          className="ai-token-modal-overlay"
          onClick={() => setTokenModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="ai-token-modal" onClick={(e) => e.stopPropagation()}>
            <span className="ai-token-sym s1" aria-hidden="true">π</span>
            <span className="ai-token-sym s2" aria-hidden="true">Σ</span>
            <span className="ai-token-sym s3" aria-hidden="true">∞</span>
            <span className="ai-token-sym s4" aria-hidden="true">Δ</span>

            <div className="ai-token-modal__char-wrap">
              <div className="ai-token-modal__speech" />
              <div className="ai-token-modal__char">
                {tokenModal.type === 'no-plan' ? '🎓' : '🧮'}
              </div>
              <div className="ai-token-modal__battery">
                <span className="ai-token-battery__bar" />
                <span className="ai-token-battery__bar empty" />
                <span className="ai-token-battery__label">[%]</span>
              </div>
            </div>

            <h2 className="ai-token-modal__title">
              {tokenModal.type === 'no-plan'
                ? 'Chưa có gói đăng ký!'
                : "Hết 'điện' rồi bạn ơi! (0 tokens)"}
            </h2>

            <p className="ai-token-modal__desc">
              {tokenModal.type === 'no-plan'
                ? 'Bạn cần kích hoạt gói đăng ký để dùng AI Trợ lý. Mua gói ngay để giải toán không giới hạn!'
                : 'Phép tính này cần thêm một chút nhiên liệu để hoàn thành. Hãy nạp thêm token để tiếp tục cuộc hành trình toán học nhé!'}
            </p>

            <div className="ai-token-modal__actions">
              <button
                type="button"
                className="ai-token-modal__btn primary"
                onClick={() => {
                  setTokenModal(null);
                  navigate(tokenModal.type === 'no-plan' ? '/pricing' : `/${layoutRole}/wallet`);
                }}
              >
                <span className="ai-token-btn__hot">HOT</span>
                <span className="ai-token-btn__icon">+</span>
                {tokenModal.type === 'no-plan' ? 'Mua gói ngay' : 'Nạp thêm ngay'}
              </button>
              <button
                type="button"
                className="ai-token-modal__btn ghost"
                onClick={() => setTokenModal(null)}
              >
                Để sau
              </button>
            </div>

            <p className="ai-token-modal__footer">HỆ SINH THÁI MATHLAB</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AIAssistant;
