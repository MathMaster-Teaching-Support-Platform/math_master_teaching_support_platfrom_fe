import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockTeacher, mockAIMessages } from '../../data/mockData';
import './AIAssistant.css';

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState(mockAIMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage = {
      id: `m${messages.length + 1}`,
      role: 'user' as const,
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, newMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: `m${messages.length + 2}`,
        role: 'assistant' as const,
        content:
          'Xin chào! Tôi là AI trợ lý toán học của MathMaster. Tôi có thể giúp bạn:\n\n• Giải các bài toán từ cơ bản đến nâng cao\n• Giải thích các khái niệm toán học\n• Tạo đề bài tập\n• Gợi ý phương pháp giảng dạy\n• Vẽ đồ thị và hình học\n\nBạn cần tôi giúp gì?',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev: typeof mockAIMessages) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const quickPrompts = [
    '💡 Giải phương trình bậc 2',
    '📊 Tạo đề kiểm tra 15 phút',
    '📈 Vẽ đồ thị hàm số y = x²',
    '🧠 Giải thích định lý Pythagoras',
    '✍️ Tạo bài tập về đạo hàm',
    '📐 Vẽ hình tam giác đều',
  ];

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt.split(' ').slice(1).join(' '));
  };

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: mockTeacher.name, avatar: mockTeacher.avatar!, role: 'teacher' }}
      notificationCount={5}
    >
      <div className="ai-assistant-page">
        <div className="ai-header">
          <div>
            <h1 className="page-title">🤖 AI Trợ lý Toán học</h1>
            <p className="page-subtitle">
              Trợ lý AI thông minh hỗ trợ bạn trong giảng dạy và học tập toán học
            </p>
          </div>
          <button className="btn btn-outline">
            <span>🗑️</span> Xóa lịch sử
          </button>
        </div>

        <div className="ai-container">
          {/* Chat Section */}
          <div className="ai-chat-section">
            <div className="chat-messages">
              {messages.map((message) => (
                <div key={message.id} className={`message ${message.role}`}>
                  <div className="message-avatar">
                    {message.role === 'user' ? mockTeacher.avatar : '🤖'}
                  </div>
                  <div className="message-content">
                    <div className="message-text">{message.content}</div>
                    <div className="message-time">
                      {new Date(message.timestamp).toLocaleTimeString('vi-VN')}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="message assistant">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="chat-input-container">
              <div className="quick-prompts">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    className="quick-prompt-btn"
                    onClick={() => handleQuickPrompt(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="chat-input">
                <input
                  type="text"
                  placeholder="Nhập câu hỏi hoặc yêu cầu của bạn..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <button className="send-btn" onClick={handleSend}>
                  <span>📤</span>
                </button>
              </div>
            </div>
          </div>

          {/* Info Sidebar */}
          <div className="ai-sidebar">
            <div className="info-card">
              <h3 className="info-title">💡 AI có thể giúp bạn</h3>
              <ul className="info-list">
                <li>Giải toán từ cơ bản đến nâng cao</li>
                <li>Tạo đề bài tập và kiểm tra</li>
                <li>Vẽ đồ thị và hình học</li>
                <li>Giải thích khái niệm</li>
                <li>Gợi ý phương pháp giảng dạy</li>
                <li>Tạo mindmap và sơ đồ</li>
              </ul>
            </div>

            <div className="info-card">
              <h3 className="info-title">⚡ Tips</h3>
              <ul className="info-list">
                <li>Hỏi câu hỏi cụ thể và rõ ràng</li>
                <li>Sử dụng ký hiệu toán học chuẩn</li>
                <li>Yêu cầu giải thích từng bước</li>
                <li>Lưu lại các câu trả lời hữu ích</li>
              </ul>
            </div>

            <div className="info-card">
              <h3 className="info-title">📊 Thống kê</h3>
              <div className="stats-item">
                <span className="stats-label">Câu hỏi hôm nay</span>
                <span className="stats-value">15</span>
              </div>
              <div className="stats-item">
                <span className="stats-label">Tổng câu hỏi</span>
                <span className="stats-value">234</span>
              </div>
              <div className="stats-item">
                <span className="stats-label">Thời gian tiết kiệm</span>
                <span className="stats-value">12.5h</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIAssistant;
