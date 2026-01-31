import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockTeacher, mockMaterials } from '../../data/mockData';
import './MaterialsGenerator.css';

type MaterialType = 'slide' | 'mindmap' | 'diagram' | 'worksheet';

const MaterialsGenerator: React.FC = () => {
  const [selectedType, setSelectedType] = useState<MaterialType>('slide');
  const [showGenerator, setShowGenerator] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  const materialTypes = [
    {
      id: 'slide' as MaterialType,
      icon: '📊',
      name: 'Slide Bài Giảng',
      desc: 'Tạo slide PowerPoint chuyên nghiệp',
    },
    {
      id: 'mindmap' as MaterialType,
      icon: '🧠',
      name: 'Sơ Đồ Tư Duy',
      desc: 'Tạo mindmap trực quan',
    },
    {
      id: 'diagram' as MaterialType,
      icon: '📐',
      name: 'Hình Vẽ Toán Học',
      desc: 'Vẽ đồ thị, hình học',
    },
    {
      id: 'worksheet' as MaterialType,
      icon: '📝',
      name: 'Phiếu Bài Tập',
      desc: 'Tạo đề bài tập in sẵn',
    },
  ];

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedContent('Generated content preview...');
      setIsGenerating(false);
    }, 2500);
  };

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: mockTeacher.name, avatar: mockTeacher.avatar!, role: 'teacher' }}
      notificationCount={5}
    >
      <div className="materials-generator-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">🎨 Tạo Tài Liệu với AI</h1>
            <p className="page-subtitle">
              Sử dụng AI để tạo slide, sơ đồ tư duy, hình vẽ và tài liệu giảng dạy chuyên nghiệp
            </p>
          </div>
          <button className="btn btn-outline" onClick={() => setShowGenerator(false)}>
            📚 Tài liệu của tôi
          </button>
        </div>

        {!showGenerator ? (
          <>
            {/* Material Types Grid */}
            <div className="material-types-grid">
              {materialTypes.map((type) => (
                <div
                  key={type.id}
                  className={`material-type-card ${selectedType === type.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedType(type.id);
                    setShowGenerator(true);
                  }}
                >
                  <div className="type-icon">{type.icon}</div>
                  <h3 className="type-name">{type.name}</h3>
                  <p className="type-desc">{type.desc}</p>
                  <button className="btn btn-primary btn-sm">Tạo ngay</button>
                </div>
              ))}
            </div>

            {/* Recent Materials */}
            <div className="recent-materials-section">
              <h2 className="section-title">📂 Tài liệu gần đây</h2>
              <div className="materials-grid">
                {mockMaterials.map((material) => (
                  <div key={material.id} className="material-card">
                    <div className="material-type-badge">{material.type}</div>
                    <div className="material-preview">
                      <span className="preview-icon">
                        {material.type === 'Slide'
                          ? '📊'
                          : material.type === 'Mindmap'
                            ? '🧠'
                            : '📝'}
                      </span>
                    </div>
                    <div className="material-info">
                      <h3 className="material-name">{material.title}</h3>
                      <div className="material-meta">
                        <span className="meta-date">
                          {new Date(material.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        <span className="meta-views">👁️ {material.downloads}</span>
                      </div>
                      <div className="material-actions">
                        <button className="action-btn">👁️</button>
                        <button className="action-btn">📥</button>
                        <button className="action-btn">✏️</button>
                        <button className="action-btn">🗑️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Generator Interface */
          <div className="generator-container">
            <div className="generator-sidebar">
              <div className="generator-type-selector">
                <h3>Loại tài liệu</h3>
                {materialTypes.map((type) => (
                  <button
                    key={type.id}
                    className={`type-selector-btn ${selectedType === type.id ? 'active' : ''}`}
                    onClick={() => setSelectedType(type.id)}
                  >
                    <span className="btn-icon">{type.icon}</span>
                    <span className="btn-text">{type.name}</span>
                  </button>
                ))}
              </div>

              <div className="generator-templates">
                <h3>Mẫu có sẵn</h3>
                <div className="template-list">
                  <div className="template-item">
                    <span>📄</span> Mẫu cơ bản
                  </div>
                  <div className="template-item">
                    <span>✨</span> Mẫu chuyên nghiệp
                  </div>
                  <div className="template-item">
                    <span>🎨</span> Mẫu sáng tạo
                  </div>
                </div>
              </div>
            </div>

            <div className="generator-main">
              <div className="generator-form">
                <h2 className="form-title">
                  {materialTypes.find((t) => t.id === selectedType)?.icon}{' '}
                  {materialTypes.find((t) => t.id === selectedType)?.name}
                </h2>

                <div className="form-group">
                  <label>Chủ đề bài giảng *</label>
                  <input type="text" placeholder="Ví dụ: Phương trình bậc 2" />
                </div>

                <div className="form-group">
                  <label>Mô tả chi tiết *</label>
                  <textarea
                    rows={4}
                    placeholder="Mô tả nội dung bạn muốn tạo. Càng chi tiết, kết quả càng chính xác..."
                  ></textarea>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Lớp học</label>
                    <select>
                      <option>Lớp 10</option>
                      <option>Lớp 11</option>
                      <option>Lớp 12</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Độ khó</label>
                    <select>
                      <option>Cơ bản</option>
                      <option>Trung bình</option>
                      <option>Nâng cao</option>
                    </select>
                  </div>
                </div>

                {selectedType === 'slide' && (
                  <div className="form-group">
                    <label>Số slide</label>
                    <input type="number" defaultValue={10} min={5} max={50} />
                  </div>
                )}

                {selectedType === 'worksheet' && (
                  <div className="form-group">
                    <label>Số câu hỏi</label>
                    <input type="number" defaultValue={20} min={5} max={100} />
                  </div>
                )}

                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>Bao gồm ví dụ minh họa</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>Bao gồm bài tập thực hành</span>
                  </label>
                  {selectedType === 'slide' && (
                    <label className="checkbox-label">
                      <input type="checkbox" />
                      <span>Thêm hình ảnh minh họa</span>
                    </label>
                  )}
                </div>

                <div className="form-actions">
                  <button className="btn btn-outline" onClick={() => setShowGenerator(false)}>
                    Hủy
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <span className="spinner"></span> Đang tạo...
                      </>
                    ) : (
                      <>✨ Tạo với AI</>
                    )}
                  </button>
                </div>
              </div>

              {generatedContent && (
                <div className="generator-preview">
                  <div className="preview-header">
                    <h3>Xem trước kết quả</h3>
                    <div className="preview-actions">
                      <button className="btn btn-outline btn-sm">🔄 Tạo lại</button>
                      <button className="btn btn-primary btn-sm">💾 Lưu tài liệu</button>
                    </div>
                  </div>
                  <div className="preview-content">
                    <div className="preview-placeholder">
                      <div className="placeholder-icon">
                        {materialTypes.find((t) => t.id === selectedType)?.icon}
                      </div>
                      <p>Tài liệu đã được tạo thành công!</p>
                      <p className="preview-subtitle">Xem trước và chỉnh sửa trước khi lưu</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MaterialsGenerator;
