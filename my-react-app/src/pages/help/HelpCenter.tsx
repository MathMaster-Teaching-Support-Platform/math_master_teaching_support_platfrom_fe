import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent } from '../../data/mockData';
import './HelpCenter.css';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

interface Article {
  id: number;
  title: string;
  description: string;
  category: string;
  icon: string;
  readTime: string;
}

const HelpCenter: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  const categories = [
    { id: 'all', name: 'Tất cả', icon: '📚' },
    { id: 'account', name: 'Tài khoản', icon: '👤' },
    { id: 'courses', name: 'Khóa học', icon: '📖' },
    { id: 'payment', name: 'Thanh toán', icon: '💳' },
    { id: 'technical', name: 'Kỹ thuật', icon: '⚙️' },
  ];

  const faqs: FAQItem[] = [
    {
      id: 1,
      question: 'Làm thế nào để đặt lại mật khẩu?',
      answer:
        'Bạn có thể đặt lại mật khẩu bằng cách vào trang Đăng nhập > Quên mật khẩu, sau đó nhập email đã đăng ký. Hệ thống sẽ gửi link đặt lại mật khẩu về email của bạn.',
      category: 'account',
      helpful: 125,
    },
    {
      id: 2,
      question: 'Cách đăng ký khóa học mới?',
      answer:
        'Để đăng ký khóa học: 1) Vào trang Khóa học, 2) Chọn khóa học bạn quan tâm, 3) Nhấn "Đăng ký ngay", 4) Chọn gói thanh toán phù hợp, 5) Hoàn tất thanh toán.',
      category: 'courses',
      helpful: 98,
    },
    {
      id: 3,
      question: 'Các phương thức thanh toán được hỗ trợ?',
      answer:
        'Chúng tôi hỗ trợ thanh toán qua: Thẻ ATM nội địa, Thẻ Visa/MasterCard, Ví điện tử (MoMo, ZaloPay, VNPay), Chuyển khoản ngân hàng. Tất cả giao dịch đều được bảo mật.',
      category: 'payment',
      helpful: 87,
    },
    {
      id: 4,
      question: 'Video bài học không phát được?',
      answer:
        'Nếu video không phát: 1) Kiểm tra kết nối internet, 2) Thử tải lại trang (F5), 3) Xóa cache trình duyệt, 4) Thử trình duyệt khác. Nếu vẫn lỗi, vui lòng liên hệ hỗ trợ kỹ thuật.',
      category: 'technical',
      helpful: 76,
    },
    {
      id: 5,
      question: 'Thời gian học tập có giới hạn không?',
      answer:
        'Sau khi đăng ký khóa học, bạn có thể truy cập nội dung trong 12 tháng kể từ ngày đăng ký. Các bài tập và tài liệu có thể tải về để sử dụng vĩnh viễn.',
      category: 'courses',
      helpful: 65,
    },
    {
      id: 6,
      question: 'Cách cập nhật thông tin cá nhân?',
      answer:
        'Vào menu Cài đặt > Hồ sơ cá nhân, tại đây bạn có thể chỉnh sửa tên, email, số điện thoại, ảnh đại diện và các thông tin khác. Nhớ nhấn "Lưu thay đổi" khi hoàn tất.',
      category: 'account',
      helpful: 54,
    },
    {
      id: 7,
      question: 'Chứng chỉ hoàn thành được cấp như thế nào?',
      answer:
        'Chứng chỉ sẽ được tự động cấp khi bạn hoàn thành 100% nội dung khóa học và đạt điểm trung bình ≥ 7.0 trong các bài kiểm tra. Bạn có thể tải xuống PDF hoặc chia sẻ trực tuyến.',
      category: 'courses',
      helpful: 92,
    },
    {
      id: 8,
      question: 'Hoàn tiền trong trường hợp nào?',
      answer:
        'Bạn có thể yêu cầu hoàn tiền 100% trong vòng 7 ngày đầu nếu chưa hoàn thành quá 20% khóa học. Sau 7 ngày, chúng tôi không hỗ trợ hoàn tiền nhưng có thể chuyển sang khóa học khác.',
      category: 'payment',
      helpful: 43,
    },
  ];

  const articles: Article[] = [
    {
      id: 1,
      title: 'Hướng dẫn sử dụng nền tảng cho người mới',
      description: 'Tìm hiểu các tính năng cơ bản và cách bắt đầu học tập hiệu quả',
      category: 'account',
      icon: '🚀',
      readTime: '5 phút',
    },
    {
      id: 2,
      title: 'Tối ưu hóa trải nghiệm học tập',
      description: 'Những mẹo và thủ thuật giúp bạn học tập hiệu quả hơn',
      category: 'courses',
      icon: '📚',
      readTime: '8 phút',
    },
    {
      id: 3,
      title: 'Bảo mật tài khoản của bạn',
      description: 'Cách bảo vệ tài khoản và dữ liệu cá nhân an toàn',
      category: 'account',
      icon: '🔒',
      readTime: '6 phút',
    },
    {
      id: 4,
      title: 'Hướng dẫn thanh toán chi tiết',
      description: 'Các bước thanh toán và xử lý vấn đề phổ biến',
      category: 'payment',
      icon: '💰',
      readTime: '10 phút',
    },
    {
      id: 5,
      title: 'Xử lý sự cố kỹ thuật thường gặp',
      description: 'Giải pháp cho các lỗi phổ biến khi sử dụng nền tảng',
      category: 'technical',
      icon: '🛠️',
      readTime: '12 phút',
    },
    {
      id: 6,
      title: 'Sử dụng AI Assistant hiệu quả',
      description: 'Khai thác tối đa tính năng trợ lý AI trong học tập',
      category: 'courses',
      icon: '🤖',
      readTime: '7 phút',
    },
  ];

  const filteredFAQs = faqs.filter((faq) => {
    const matchCategory = categoryFilter === 'all' || faq.category === categoryFilter;
    const matchSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const filteredArticles = articles.filter((article) => {
    const matchCategory = categoryFilter === 'all' || article.category === categoryFilter;
    const matchSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar!, role: 'student' }}
      notificationCount={5}
    >
      <div className="help-center-page">
        <div className="page-header">
          <h1 className="page-title">❓ Trung Tâm Trợ Giúp</h1>
          <p className="page-subtitle">Tìm câu trả lời cho mọi thắc mắc của bạn</p>
        </div>

        {/* Search */}
        <div className="help-search-section">
          <div className="search-container">
            <input
              type="text"
              placeholder="Tìm kiếm câu hỏi, hướng dẫn..."
              className="help-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <p className="search-hint">Ví dụ: "đặt lại mật khẩu", "thanh toán", "chứng chỉ"...</p>
        </div>

        {/* Categories */}
        <div className="help-categories">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-btn ${categoryFilter === cat.id ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat.id)}
            >
              <span className="category-icon">{cat.icon}</span>
              <span className="category-name">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <div className="quick-action-card" onClick={() => setShowContactModal(true)}>
            <div className="qa-icon">📧</div>
            <div className="qa-content">
              <h3>Liên hệ hỗ trợ</h3>
              <p>Gửi yêu cầu hỗ trợ trực tiếp</p>
            </div>
          </div>
          <div className="quick-action-card">
            <div className="qa-icon">💬</div>
            <div className="qa-content">
              <h3>Chat với chúng tôi</h3>
              <p>Trò chuyện trực tiếp (8:00 - 22:00)</p>
            </div>
          </div>
          <div className="quick-action-card">
            <div className="qa-icon">📞</div>
            <div className="qa-content">
              <h3>Hotline: 1900-xxxx</h3>
              <p>Hỗ trợ 24/7</p>
            </div>
          </div>
          <div className="quick-action-card">
            <div className="qa-icon">📘</div>
            <div className="qa-content">
              <h3>Tài liệu hướng dẫn</h3>
              <p>Tải PDF hướng dẫn sử dụng</p>
            </div>
          </div>
        </div>

        {/* Popular Articles */}
        <div className="help-section">
          <h2 className="section-title">📚 Bài viết hướng dẫn</h2>
          <div className="articles-grid">
            {filteredArticles.map((article) => (
              <div key={article.id} className="article-card">
                <div className="article-icon">{article.icon}</div>
                <h3 className="article-title">{article.title}</h3>
                <p className="article-description">{article.description}</p>
                <div className="article-footer">
                  <span className="read-time">🕐 {article.readTime}</span>
                  <button className="read-btn">Đọc ngay →</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="help-section">
          <h2 className="section-title">❓ Câu hỏi thường gặp</h2>
          <div className="faqs-container">
            {filteredFAQs.map((faq) => (
              <div key={faq.id} className="faq-item">
                <div
                  className="faq-question"
                  onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                >
                  <span className="question-text">{faq.question}</span>
                  <span className="expand-icon">{expandedFAQ === faq.id ? '▲' : '▼'}</span>
                </div>
                {expandedFAQ === faq.id && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                    <div className="faq-footer">
                      <span className="helpful-text">
                        Hữu ích? {faq.helpful} người đã thấy hữu ích
                      </span>
                      <div className="faq-actions">
                        <button className="faq-action-btn">👍 Hữu ích</button>
                        <button className="faq-action-btn">👎 Chưa hữu ích</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Still Need Help */}
        <div className="need-help-section">
          <div className="need-help-content">
            <h2>🤔 Vẫn chưa tìm được câu trả lời?</h2>
            <p>Đừng lo lắng! Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn.</p>
            <button className="btn btn-primary" onClick={() => setShowContactModal(true)}>
              📧 Liên hệ hỗ trợ
            </button>
          </div>
        </div>

        {/* Contact Modal */}
        {showContactModal && (
          <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
            <div className="modal large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">📧 Gửi yêu cầu hỗ trợ</h2>
                <button className="modal-close" onClick={() => setShowContactModal(false)}>
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label>Danh mục vấn đề *</label>
                  <select>
                    <option>Chọn danh mục</option>
                    <option>👤 Tài khoản</option>
                    <option>📖 Khóa học</option>
                    <option>💳 Thanh toán</option>
                    <option>⚙️ Kỹ thuật</option>
                    <option>📝 Khác</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Tiêu đề *</label>
                  <input type="text" placeholder="Mô tả ngắn gọn vấn đề của bạn" />
                </div>

                <div className="form-group">
                  <label>Nội dung chi tiết *</label>
                  <textarea
                    rows={8}
                    placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải...&#10;&#10;Vui lòng cung cấp:&#10;• Mô tả chi tiết vấn đề&#10;• Các bước đã thực hiện&#10;• Ảnh chụp màn hình (nếu có)&#10;• Thời gian xảy ra lỗi"
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Email liên hệ *</label>
                  <input type="email" defaultValue={mockStudent.email} />
                </div>

                <div className="form-group">
                  <label>Đính kèm file (tùy chọn)</label>
                  <input type="file" multiple />
                  <small>Hỗ trợ: JPG, PNG, PDF (tối đa 5MB mỗi file)</small>
                </div>

                <div className="form-group">
                  <label>Độ ưu tiên</label>
                  <div className="priority-options">
                    <label className="priority-option">
                      <input type="radio" name="priority" value="low" defaultChecked />
                      <span>🟢 Thấp</span>
                    </label>
                    <label className="priority-option">
                      <input type="radio" name="priority" value="medium" />
                      <span>🟡 Trung bình</span>
                    </label>
                    <label className="priority-option">
                      <input type="radio" name="priority" value="high" />
                      <span>🔴 Cao</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowContactModal(false)}>
                  Hủy
                </button>
                <button className="btn btn-primary">✅ Gửi yêu cầu</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default HelpCenter;
