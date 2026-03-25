import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
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
import { mockTeacher } from '../../data/mockData';
import type { ChatMessageResponse } from '../../types';
import './AIAssistant.css';

const AIAssistant: React.FC = () => {
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [input, setInput] = useState('');
  const [pendingPrompt, setPendingPrompt] = useState('');
  const [localError, setLocalError] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [isSessionPanelOpen, setIsSessionPanelOpen] = useState(true);

  const sessionQueryParams = useMemo(() => ({ page: 0, size: 20 }), []);

  const messageQueryParams = useMemo(() => ({ page: 0, size: 50 }), []);

  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    error: sessionsError,
  } = useChatSessions(sessionQueryParams);

  const sessions = useMemo(() => sessionsData?.result.content ?? [], [sessionsData]);

  useEffect(() => {
    if (!selectedSessionId && sessions.length > 0) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [selectedSessionId, sessions]);

  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
  } = useChatSessionMessages(selectedSessionId, messageQueryParams);

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
    } catch (error) {
      setLocalError(getErrorMessage(error, 'Không thể gửi prompt.'));
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

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: mockTeacher.name, avatar: mockTeacher.avatar!, role: 'teacher' }}
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
                <button type="button" onClick={() => void handleRenameSession()}>
                  Lưu
                </button>
                <button
                  type="button"
                  className="ghost"
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
                <h1>{selectedSession?.title ?? 'Xin chào! Chúng ta nên bắt đầu từ đâu?'}</h1>
                <p>
                  {selectedSession
                    ? `Model: ${selectedSession.model} · Last update: ${formatDateTime(selectedSession.updatedAt)}`
                    : 'Tạo một cuộc trò chuyện mới hoặc chọn lại session cũ để xem lịch sử.'}
                </p>
              </div>
            )}

            <div className="header-actions">
              <button
                type="button"
                className="ghost"
                onClick={() => setIsEditingTitle((prev) => !prev)}
                disabled={!selectedSessionId || renameSessionMutation.isPending}
              >
                Rename
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => void handleArchiveSession()}
                disabled={!selectedSessionId || isArchived || archiveSessionMutation.isPending}
              >
                Archive
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => void handleDeleteSession()}
                disabled={!selectedSessionId || deleteSessionMutation.isPending}
              >
                Delete
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => setIsSessionPanelOpen((prev) => !prev)}
              >
                {isSessionPanelOpen ? 'Thu gọn panel' : 'Mở panel'}
              </button>
            </div>
          </header>

          <div className="message-stream">
            {combinedError && <div className="error-banner">{combinedError}</div>}

            {!combinedError &&
              selectedSessionId &&
              displayMessages.length === 0 &&
              !messagesLoading && (
                <div className="empty-state">
                  <h3>Session này chưa có tin nhắn</h3>
                  <p>Hãy nhập prompt ở phía dưới để bắt đầu hội thoại.</p>
                </div>
              )}

            {!combinedError && !selectedSessionId && (
              <div className="empty-state">
                <h3>Chào mừng bạn đến AI Assistant</h3>
                <p>Nhấn "Cuộc trò chuyện mới" ở panel bên phải để bắt đầu.</p>
              </div>
            )}

            {displayMessages.map((message) => (
              <article
                key={message.id}
                className={`chat-row ${message.role === 'USER' ? 'chat-user' : 'chat-assistant'}`}
              >
                <div className="chat-avatar">{message.role === 'USER' ? 'B' : 'AI'}</div>
                <div className="chat-body">
                  <p>{message.content}</p>
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
          </div>

          <footer className="composer-wrap">
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

            <div className="composer-box">
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
                disabled={isSending || isArchived || !selectedSessionId}
              />
              <div className="composer-actions">
                <div className="composer-meta">
                  <span>Messages: {memory?.messageCount ?? 0}</span>
                  <span>{isArchived ? 'Session archived' : 'Session active'}</span>
                </div>
                <button
                  type="button"
                  className="send-btn"
                  onClick={() => void handleSend()}
                  disabled={isSending || isArchived || !selectedSessionId}
                >
                  Gửi
                </button>
              </div>
            </div>
          </footer>
        </section>

        <aside className={`gemini-sidebar right ${isSessionPanelOpen ? '' : 'collapsed'}`}>
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={() => setIsSessionPanelOpen((prev) => !prev)}
          >
            {isSessionPanelOpen ? '>' : '<'}
          </button>

          {isSessionPanelOpen ? (
            <>
              <button
                type="button"
                className="new-session-btn"
                onClick={() => void handleNewChat()}
                disabled={createSessionMutation.isPending}
              >
                + Cuộc trò chuyện mới
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
                <div className="session-muted">Memory limit: {memory?.wordLimit ?? 1000} words</div>
                <div className="session-muted">Used: {memory?.currentWords ?? 0}</div>
              </div>
            </>
          ) : (
            <div className="collapsed-actions">
              <button
                type="button"
                className="new-session-btn collapsed"
                onClick={() => void handleNewChat()}
                disabled={createSessionMutation.isPending}
                title="Tạo cuộc trò chuyện mới"
              >
                +
              </button>
              <div className="collapsed-count" title="Số lượng session">
                {sessions.length}
              </div>
            </div>
          )}
        </aside>
      </div>
    </DashboardLayout>
  );
};

export default AIAssistant;
