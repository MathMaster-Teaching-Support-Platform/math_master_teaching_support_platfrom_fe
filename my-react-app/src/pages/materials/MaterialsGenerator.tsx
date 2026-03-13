import React, { useMemo, useState } from 'react';
import { Clock3, Search } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockTeacher, mockMaterials } from '../../data/mockData';
import './MaterialsGenerator.css';

const MaterialsGenerator: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');

  const cards = [
    {
      icon: '📊',
      title: 'Slide Bài Giảng',
      desc: 'Tạo slide PowerPoint chuyên nghiệp từ nội dung bài giảng của bạn.',
    },
    {
      icon: '🧠',
      title: 'Sơ Đồ Tư Duy',
      desc: 'Tạo mindmap trực quan tự động dựa trên các từ khóa bài học.',
    },
    {
      icon: '📐',
      title: 'Hình Vẽ Toán Học',
      desc: 'Vẽ đồ thị hàm số và hình học không gian chính xác chỉ với mô tả.',
    },
    {
      icon: '🧾',
      title: 'Phiếu Bài Tập',
      desc: 'Tạo đề bài tập in sẵn với các dạng toán đa dạng và lời giải chi tiết.',
    },
  ];

  const rows = useMemo(() => {
    return mockMaterials.filter((m) => m.title.toLowerCase().includes(searchValue.toLowerCase()));
  }, [searchValue]);

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: mockTeacher.name, avatar: mockTeacher.avatar!, role: 'teacher' }}
      notificationCount={5}
    >
      <div className="materials-page">
        <header className="materials-header">
          <div>
            <h1>
              Tạo Tài Liệu với AI <span className="beta-badge">BETA</span>
            </h1>
            <p>
              Sử dụng AI để tạo slide, sơ đồ tư duy, hình vẽ và tài liệu giảng dạy chuyên nghiệp.
            </p>
          </div>
          <button className="history-btn">
            <Clock3 size={16} /> Lịch sử tạo
          </button>
        </header>

        <section className="tool-grid">
          {cards.map((card) => (
            <article key={card.title} className="tool-card">
              <div className="tool-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
              <button>Bắt đầu tạo</button>
            </article>
          ))}
        </section>

        <section className="recent-section">
          <div className="recent-head">
            <h2>Tài liệu đã tạo gần đây</h2>
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Tìm kiếm tài liệu..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tên tệp</th>
                  <th>Công cụ</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.id}>
                    <td className="file-cell">
                      <span className="file-dot">
                        {row.type === 'slide' ? '📊' : row.type === 'mindmap' ? '🧠' : '📄'}
                      </span>
                      {row.title}
                    </td>
                    <td>
                      <span className="tool-tag">{row.type.toUpperCase()} AI</span>
                    </td>
                    <td>{new Date(row.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <span className={`status-tag ${idx % 2 === 0 ? 'done' : 'processing'}`}>
                        {idx % 2 === 0 ? 'Hoàn thành' : 'Đang xử lý'}
                      </span>
                    </td>
                    <td className="action-cell">{idx % 2 === 0 ? 'Tải về' : 'Xem thử'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="table-footer">
              Hiển thị 1 - {Math.min(rows.length, 12)} của {rows.length} tài liệu AI
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default MaterialsGenerator;
