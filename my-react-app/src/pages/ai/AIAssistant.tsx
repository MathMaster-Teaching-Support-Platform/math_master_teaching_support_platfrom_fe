import 'katex/dist/katex.min.css';
import {
  AlertCircle,
  Archive,
  ArrowUp,
  Bot,
  Menu,
  MessageSquarePlus,
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
import { AuthService } from '../../services/api/auth.service';
import { notifySubscriptionUpdated } from '../../services/api/subscription-plan.service';
import type { ChatMessageResponse } from '../../types';
import './AIAssistant.css';

// ── Inline markdown + math renderer ──────────────────────────────────────────
function renderInline(text: string): React.ReactNode[] {
  if (!text) return [];
  const re = /\*\*([^*\n]+?)\*\*|\*([^*\n]+?)\*|`([^`\n]+?)`|\\\(([^)]+?)\\\)|\$([^$\n]+?)\$/g;
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
        </code>
      );
    } else if (m[4] !== undefined) {
      const math4 = m[4];
      parts.push(
        <InlineMath
          key={k}
          math={math4}
          renderError={() => <code className="math-error">{`\\(${math4}\\)`}</code>}
        />
      );
    } else if (m[5] !== undefined) {
      const math5 = m[5];
      parts.push(
        <InlineMath
          key={k}
          math={math5}
          renderError={() => <code className="math-error">{`$${math5}$`}</code>}
        />
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

    const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length as 1 | 2 | 3;
      const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
      nodes.push(
        <Tag key={`${keyPrefix}-h${i}`} className={`md-heading md-h${level}`}>
          {renderInline(headerMatch[2])}
        </Tag>
      );
      i++;
      continue;
    }

    if (/^[-*+]\s/.test(line)) {
      const items: string[] = [];
      const s = i;
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+]\s+/, ''));
        i++;
      }
      nodes.push(
        <ul key={`${keyPrefix}-ul${s}`} className="md-ul">
          {items.map((item, j) => (
            <li key={j}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      const s = i;
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      nodes.push(
        <ol key={`${keyPrefix}-ol${s}`} className="md-ol">
          {items.map((item, j) => (
            <li key={j}>{renderInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    const paraLines: string[] = [];
    const s = i;
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|[-*+]\s|\d+\.\s)/.test(lines[i])) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      nodes.push(
        <p key={`${keyPrefix}-p${s}`} className="md-para">
          {paraLines.map((pl, j) => (
            <React.Fragment key={j}>
              {j > 0 && <br />}
              {renderInline(pl)}
            </React.Fragment>
          ))}
        </p>
      );
    }
  }
  return nodes;
}

// ── Message content renderer (markdown + math + code blocks) ─────────────────
const ChatMessageContent: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;
  const blocks: React.ReactNode[] = [];
  const topRe = /```([\w]*)\n?([\s\S]*?)```|\\\[([\s\S]+?)\\\]|\$\$([\s\S]+?)\$\$/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let bk = 0;

  while ((m = topRe.exec(content)) !== null) {
    if (m.index > last) {
      const ln = processLines(content.slice(last, m.index).split('\n'), `b${bk}`);
      if (ln.length)
        blocks.push(
          <div key={`tb${bk}`} className="md-text-block">
            {ln}
          </div>
        );
      bk++;
    }
    if (m[0].startsWith('```')) {
      blocks.push(
        <pre key={`cb${bk++}`} className="md-code-block">
          {m[1] && <span className="md-code-lang">{m[1]}</span>}
          <code>{(m[2] ?? '').trim()}</code>
        </pre>
      );
    } else {
      const v = (m[3] ?? m[4] ?? '').trim();
      blocks.push(
        <div key={`mb${bk++}`} className="math-block-wrap">
          <BlockMath
            math={v}
            renderError={() => <code className="math-error">{`$$${v}$$`}</code>}
          />
        </div>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < content.length) {
    const ln = processLines(content.slice(last).split('\n'), `b${bk}`);
    if (ln.length)
      blocks.push(
        <div key={`tb${bk}`} className="md-text-block">
          {ln}
        </div>
      );
  }
  return <div className="chat-content-rich">{blocks}</div>;
};

// ── Confirm modal ─────────────────────────────────────────────────────────────
type ConfirmConfig = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
};

function ConfirmModal({
  config,
  onClose,
}: Readonly<{ config: ConfirmConfig; onClose: () => void }>) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-[rgba(0,0,0,0.20)_0px_20px_60px] w-full max-w-sm p-6 flex flex-col gap-4"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="text-center">
          <h3 className="font-[Playfair_Display] text-[18px] font-medium text-[#141413]">
            {config.title}
          </h3>
          <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-2">{config.message}</p>
        </div>
        <div className="flex gap-2">
          <button
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#E8E6DC] bg-white font-[Be_Vietnam_Pro] text-[13px] font-medium text-[#5E5D59] hover:bg-[#F5F4ED] transition-colors"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-[Be_Vietnam_Pro] text-[13px] font-semibold transition-colors"
            onClick={() => {
              config.onConfirm();
              onClose();
            }}
          >
            {config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [confirmModal, setConfirmModal] = useState<ConfirmConfig | null>(null);
  const hasBootstrappedSession = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    sessionDetailData?.result ?? sessions.find((s) => s.id === selectedSessionId);
  const messages = useMemo(() => messagesData?.result.content ?? [], [messagesData]);
  const memory = memoryData?.result;
  const isArchived = selectedSession?.status === 'ARCHIVED';
  const isSending = sendMessageMutation.isPending;

  useEffect(() => {
    if (!isEditingTitle) setEditingTitle(selectedSession?.title ?? '');
  }, [isEditingTitle, selectedSession?.title]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }, [input]);

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

  const getErrorMessage = (error: unknown, fallback: string): string =>
    error instanceof Error && error.message.trim().length > 0 ? error.message : fallback;

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
        const r = await createSessionMutation.mutateAsync({
          title: 'New Chat',
          model: 'gemini-2.5-flash',
        });
        sessionId = r.result.id;
        setSelectedSessionId(sessionId);
      }
      setPendingPrompt(prompt);
      setInput('');
      await sendMessageMutation.mutateAsync({
        sessionId,
        payload: { prompt, temperature: 0.4, maxOutputTokens: 800 },
      });
      notifySubscriptionUpdated();
    } catch (error) {
      const apiError = error as Error & { code?: number };
      const isTokenError =
        apiError.code === 1164 || apiError.code === 1165 || apiError.code === 1166;
      if (isTokenError && layoutRole !== 'admin') {
        if (apiError.code === 1165) {
          setLocalError('Token của gói đã hết.');
          setTokenModal({ type: 'no-token' });
        } else {
          setLocalError('Bạn chưa có gói active.');
          setTokenModal({ type: 'no-plan' });
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
      setLocalError('Tiêu đề không được để trống.');
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

  const handleDeleteSession = () => {
    if (!selectedSessionId) return;
    setConfirmModal({
      title: 'Xóa cuộc trò chuyện',
      message: 'Bạn có chắc muốn xóa cuộc trò chuyện này? Hành động này không thể hoàn tác.',
      confirmLabel: 'Xóa',
      onConfirm: async () => {
        try {
          setLocalError('');
          const removedId = selectedSessionId;
          await deleteSessionMutation.mutateAsync(removedId);
          setSelectedSessionId(sessions.find((s) => s.id !== removedId)?.id ?? '');
        } catch (error) {
          setLocalError(getErrorMessage(error, 'Không thể xóa session.'));
        }
      },
    });
  };

  const quickPrompts = [
    'Giải phương trình bậc 2',
    'Tạo đề kiểm tra 15 phút',
    'Vẽ đồ thị hàm số y = x²',
    'Định lý Pythagoras',
    'Bài tập đạo hàm',
    'Tích phân từng phần',
  ];

  const formatDateTime = (value?: string) => {
    if (!value) return '--';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '--' : d.toLocaleString('vi-VN');
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
      contentClassName="dashboard-content--flush-bleed"
    >
      {/* ── Outer page shell (TeacherMindmaps style) ── */}
      <div className="ai-page-shell">
        {/* ── Page header ── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59] flex-shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413]">
                  Trợ lý AI Toán học
                </h1>
                {sessions.length > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E8E6DC] font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59]">
                    {sessions.length}
                  </span>
                )}
              </div>
              <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] mt-0.5">
                Giải bài, chứng minh, tạo đề thi — hỗ trợ bởi Gemini AI
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleNewChat()}
            disabled={createSessionMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141413] text-[#FAF9F5] font-[Be_Vietnam_Pro] text-[13px] font-semibold hover:brightness-95 active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            Chat mới
          </button>
        </div>

        {/* ── Chat panel ── */}
        <div className={`gemini-chat-page ${isSessionPanelOpen ? '' : 'session-collapsed'}`}>
          {/* ── Main chat area ── */}
          <section className="gemini-main">
            {/* Session title bar */}
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
                  <MessageSquarePlus size={15} className="session-heading-icon-raw" />
                  <span className="session-heading-title">
                    {selectedSession?.title ?? 'Cuộc trò chuyện mới'}
                  </span>
                </div>
              )}

              <div className="header-actions">
                <button
                  type="button"
                  className="header-btn ghost"
                  onClick={() => setIsEditingTitle((p) => !p)}
                  disabled={!selectedSessionId || renameSessionMutation.isPending}
                  title="Đổi tên"
                >
                  <Pencil size={14} />
                  <span>Rename</span>
                </button>
                <button
                  type="button"
                  className="header-btn ghost"
                  onClick={() => void handleArchiveSession()}
                  disabled={!selectedSessionId || isArchived || archiveSessionMutation.isPending}
                  title="Lưu trữ"
                >
                  <Archive size={14} />
                  <span>Archive</span>
                </button>
                <button
                  type="button"
                  className="header-btn danger"
                  onClick={() => void handleDeleteSession()}
                  disabled={!selectedSessionId || deleteSessionMutation.isPending}
                  title="Xóa"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </header>

            {/* Message stream */}
            <div className="message-stream">
              {combinedError && <div className="error-banner">{combinedError}</div>}

              {!hasConversationStarted && (
                <div className="empty-state-welcome">
                  <div className="welcome-icon">
                    <Sparkles size={28} />
                  </div>
                  <h2>Trợ lý AI Toán học</h2>
                  <p>Hỏi bất kỳ câu hỏi — giải phương trình, chứng minh, tạo đề kiểm tra...</p>
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
                      {isUser ? (currentUser.name?.[0] ?? 'U') : <Sparkles size={15} />}
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
                    <Sparkles size={15} />
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

            {/* Composer */}
            <footer className="composer-wrap">
              {!hasConversationStarted && (
                <div className="quick-chips" role="list">
                  {quickPrompts.map((p) => (
                    <button type="button" key={p} className="chip" onClick={() => setInput(p)}>
                      {p}
                    </button>
                  ))}
                </div>
              )}

              <div className={`composer-box ${hasConversationStarted ? 'compact' : ''}`}>
                <textarea
                  ref={textareaRef}
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
                    <ArrowUp size={18} strokeWidth={2.5} />
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
              onClick={() => setIsSessionPanelOpen((p) => !p)}
              title={isSessionPanelOpen ? 'Thu gọn' : 'Mở sessions'}
            >
              <Menu size={18} strokeWidth={2.2} />
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
                <Plus size={15} />
                <span>Cuộc trò chuyện mới</span>
              </button>

              <div className="session-list-title">Lịch sử</div>
              <div className="session-list">
                {sessionsLoading && <div className="session-muted">Đang tải...</div>}
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
                  <span className="session-footer-label">Memory</span>
                  <span className="session-footer-value">
                    {memory?.currentWords ?? 0} / {memory?.wordLimit ?? 1000} words
                  </span>
                </div>
              </div>
            </div>

            <div className={`collapsed-actions ${isSessionPanelOpen ? 'is-hidden' : 'is-visible'}`}>
              <button
                type="button"
                className="new-session-btn collapsed sidebar-icon-btn"
                onClick={() => void handleNewChat()}
                disabled={createSessionMutation.isPending}
                title="Chat mới"
              >
                <SquarePen size={18} strokeWidth={2} />
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Confirm modal ── */}
      {confirmModal && <ConfirmModal config={confirmModal} onClose={() => setConfirmModal(null)} />}

      {/* ── Token modal ── */}
      {tokenModal && (
        <div
          className="ai-token-modal-overlay"
          onClick={() => setTokenModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="ai-token-modal" onClick={(e) => e.stopPropagation()}>
            <span className="ai-token-sym s1" aria-hidden="true">
              π
            </span>
            <span className="ai-token-sym s2" aria-hidden="true">
              Σ
            </span>
            <span className="ai-token-sym s3" aria-hidden="true">
              ∞
            </span>
            <span className="ai-token-sym s4" aria-hidden="true">
              Δ
            </span>
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
                : "Hết 'điện' rồi! (0 tokens)"}
            </h2>
            <p className="ai-token-modal__desc">
              {tokenModal.type === 'no-plan'
                ? 'Bạn cần kích hoạt gói đăng ký để dùng AI. Mua gói ngay để giải toán không giới hạn!'
                : 'Hãy nạp thêm token để tiếp tục cuộc hành trình toán học nhé!'}
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
