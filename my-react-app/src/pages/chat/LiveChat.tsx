import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent } from '../../data/mockData';
import './LiveChat.css';

interface Message {
  id: number;
  sender: 'me' | 'other' | 'system';
  senderName?: string;
  avatar?: string;
  content: string;
  timestamp: string;
  status?: 'sending' | 'sent' | 'read';
}

interface Conversation {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
  type: 'teacher' | 'student' | 'support';
}

const LiveChat: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<number | null>(1);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversations: Conversation[] = [
    {
      id: 1,
      name: 'Thầy Nguyễn Văn A',
      avatar: '👨‍🏫',
      lastMessage: 'Em làm bài tập chưa nhỉ?',
      timestamp: '10:30',
      unread: 2,
      online: true,
      type: 'teacher',
    },
    {
      id: 2,
      name: 'Trần Thị B (Bạn học)',
      avatar: '👩‍🎓',
      lastMessage: 'Mình có thể hỏi bài không?',
      timestamp: '09:15',
      unread: 0,
      online: true,
      type: 'student',
    },
    {
      id: 3,
      name: 'Hỗ trợ kỹ thuật',
      avatar: '💬',
      lastMessage: 'Cảm ơn bạn đã liên hệ!',
      timestamp: 'Hôm qua',
      unread: 0,
      online: true,
      type: 'support',
    },
    {
      id: 4,
      name: 'Lê Văn C (Bạn học)',
      avatar: '👨‍🎓',
      lastMessage: 'Ok, cảm ơn bạn nhé',
      timestamp: 'Hôm qua',
      unread: 0,
      online: false,
      type: 'student',
    },
    {
      id: 5,
      name: 'Cô Phạm Thị D',
      avatar: '👩‍🏫',
      lastMessage: 'Bài tập khá tốt đấy',
      timestamp: '2 ngày trước',
      unread: 0,
      online: false,
      type: 'teacher',
    },
  ];

  const messages: { [key: number]: Message[] } = {
    1: [
      {
        id: 1,
        sender: 'other',
        senderName: 'Thầy Nguyễn Văn A',
        avatar: '👨‍🏫',
        content: 'Chào em! Thầy thấy em chưa nộp bài tập tuần này',
        timestamp: '10:15',
        status: 'read',
      },
      {
        id: 2,
        sender: 'me',
        content: 'Dạ em xin lỗi thầy, em đang làm ạ',
        timestamp: '10:18',
        status: 'read',
      },
      {
        id: 3,
        sender: 'other',
        senderName: 'Thầy Nguyễn Văn A',
        avatar: '👨‍🏫',
        content: 'Được, nhưng nhớ nộp trước 5h chiều nhé',
        timestamp: '10:20',
        status: 'read',
      },
      {
        id: 4,
        sender: 'me',
        content: 'Dạ em cảm ơn thầy ạ. Em có thể hỏi thầy về bài 3 được không?',
        timestamp: '10:25',
        status: 'read',
      },
      {
        id: 5,
        sender: 'other',
        senderName: 'Thầy Nguyễn Văn A',
        avatar: '👨‍🏫',
        content: 'Được chứ, bài 3 phần nào em chưa rõ?',
        timestamp: '10:28',
        status: 'read',
      },
      {
        id: 6,
        sender: 'me',
        content: 'Dạ em chưa hiểu cách giải phương trình bậc 2 khi có tham số ạ',
        timestamp: '10:30',
        status: 'sent',
      },
    ],
    2: [
      {
        id: 1,
        sender: 'other',
        senderName: 'Trần Thị B',
        avatar: '👩‍🎓',
        content: 'Hi! Mình có thể hỏi bạn về bài tập không?',
        timestamp: '09:15',
        status: 'read',
      },
      {
        id: 2,
        sender: 'me',
        content: 'Được chứ, bài nào vậy?',
        timestamp: '09:16',
        status: 'read',
      },
      {
        id: 3,
        sender: 'other',
        senderName: 'Trần Thị B',
        avatar: '👩‍🎓',
        content: 'Bài tập về đạo hàm ý. Mình làm mãi không ra',
        timestamp: '09:17',
        status: 'read',
      },
    ],
    3: [
      {
        id: 1,
        sender: 'system',
        content: 'Cuộc trò chuyện được kết nối với đội ngũ hỗ trợ',
        timestamp: '14:30',
        status: 'read',
      },
      {
        id: 2,
        sender: 'me',
        content: 'Cho mình hỏi tại sao video không phát được?',
        timestamp: '14:31',
        status: 'read',
      },
      {
        id: 3,
        sender: 'other',
        senderName: 'Support Team',
        avatar: '💬',
        content: 'Xin chào! Bạn đang gặp lỗi này trên trình duyệt nào?',
        timestamp: '14:32',
        status: 'read',
      },
      { id: 4, sender: 'me', content: 'Mình dùng Chrome ạ', timestamp: '14:33', status: 'read' },
      {
        id: 5,
        sender: 'other',
        senderName: 'Support Team',
        avatar: '💬',
        content: 'Bạn thử xóa cache và tải lại trang xem sao nhé. Nếu vẫn lỗi thì báo lại cho mình',
        timestamp: '14:35',
        status: 'read',
      },
    ],
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat]);

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedChat) {
      // Handle sending message logic here
      setMessageInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedConversation = conversations.find((c) => c.id === selectedChat);
  const currentMessages = selectedChat ? messages[selectedChat] || [] : [];

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar!, role: 'student' }}
      notificationCount={5}
    >
      <div className="chat-page">
        <div className="chat-container">
          {/* Conversations List */}
          <div className="conversations-sidebar">
            <div className="sidebar-header">
              <h2>Tin nhắn</h2>
              <button className="new-chat-btn" title="Tin nhắn mới">
                ➕
              </button>
            </div>

            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="conversations-list">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`conversation-item ${selectedChat === conv.id ? 'active' : ''}`}
                  onClick={() => setSelectedChat(conv.id)}
                >
                  <div className="conv-avatar-wrapper">
                    <div className="conv-avatar">{conv.avatar}</div>
                    {conv.online && <div className="online-indicator"></div>}
                  </div>
                  <div className="conv-content">
                    <div className="conv-header">
                      <span className="conv-name">{conv.name}</span>
                      <span className="conv-time">{conv.timestamp}</span>
                    </div>
                    <div className="conv-footer">
                      <span className="conv-message">{conv.lastMessage}</span>
                      {conv.unread > 0 && <span className="unread-badge">{conv.unread}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Window */}
          {selectedChat ? (
            <div className="chat-window">
              <div className="chat-header">
                <div className="chat-header-left">
                  <div className="header-avatar-wrapper">
                    <div className="header-avatar">{selectedConversation?.avatar}</div>
                    {selectedConversation?.online && <div className="online-indicator"></div>}
                  </div>
                  <div className="header-info">
                    <h3 className="header-name">{selectedConversation?.name}</h3>
                    <span className="header-status">
                      {selectedConversation?.online ? 'Đang hoạt động' : 'Không hoạt động'}
                    </span>
                  </div>
                </div>
                <div className="chat-header-actions">
                  <button className="header-action-btn" title="Gọi video">
                    📹
                  </button>
                  <button className="header-action-btn" title="Thông tin">
                    ℹ️
                  </button>
                </div>
              </div>

              <div className="chat-messages">
                {currentMessages.map((msg) => (
                  <div key={msg.id} className={`message-wrapper ${msg.sender}`}>
                    {msg.sender === 'other' && <div className="message-avatar">{msg.avatar}</div>}
                    <div className="message-bubble">
                      {msg.sender === 'other' && msg.senderName && (
                        <div className="message-sender-name">{msg.senderName}</div>
                      )}
                      {msg.sender === 'system' ? (
                        <div className="system-message">{msg.content}</div>
                      ) : (
                        <>
                          <div className="message-content">{msg.content}</div>
                          <div className="message-meta">
                            <span className="message-time">{msg.timestamp}</span>
                            {msg.sender === 'me' && msg.status && (
                              <span className="message-status">
                                {msg.status === 'sending' && '🕐'}
                                {msg.status === 'sent' && '✓'}
                                {msg.status === 'read' && '✓✓'}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input-area">
                <button className="input-action-btn" title="Đính kèm">
                  📎
                </button>
                <button className="input-action-btn" title="Emoji">
                  😊
                </button>
                <textarea
                  className="message-input"
                  placeholder="Nhập tin nhắn..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  rows={1}
                />
                <button
                  className="send-btn"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                >
                  ➤
                </button>
              </div>
            </div>
          ) : (
            <div className="chat-empty">
              <div className="empty-icon">💬</div>
              <h3>Chọn một cuộc trò chuyện</h3>
              <p>Chọn một tin nhắn từ danh sách bên trái để bắt đầu</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LiveChat;
