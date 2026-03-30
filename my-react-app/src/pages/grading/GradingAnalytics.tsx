import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, TrendingUp } from 'lucide-react';
import { useGradingAnalytics, useExportGrades } from '../../hooks/useGrading';
import { useQuery } from '@tanstack/react-query';
import { AssessmentService } from '../../services/api/assessment.service';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import '../../styles/module-refactor.css';

export default function GradingAnalytics() {
  const navigate = useNavigate();
  const [assessmentId, setAssessmentId] = useState('');

  // Fetch list of published assessments
  const { data: assessmentsData } = useQuery({
    queryKey: ['my-assessments', 'PUBLISHED'],
    queryFn: () => AssessmentService.getMyAssessments({ 
      page: 0, 
      size: 100,
      status: 'PUBLISHED'
    }),
  });

  const assessments = assessmentsData?.result?.content ?? [];

  const { data, isLoading, isError } = useGradingAnalytics(assessmentId, {
    enabled: !!assessmentId,
  });
  const exportGradesMutation = useExportGrades();

  const analytics = data?.result;

  const handleExport = () => {
    if (!assessmentId) return;
    exportGradesMutation.mutate(assessmentId);
  };

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
      notificationCount={0}
    >
      <div className="module-layout-container">
        <section className="module-page">
          <header className="page-header">
            <div>
              <button className="btn secondary" onClick={() => navigate('/teacher/grading')}>
                <ArrowLeft size={14} />
                Quay lại
              </button>
              <h2 style={{ marginTop: 12 }}>Phân tích điểm</h2>
              <p className="muted">Xem thống kê và phân tích kết quả bài kiểm tra</p>
            </div>
            {analytics && (
              <button className="btn" onClick={handleExport} disabled={exportGradesMutation.isPending}>
                <Download size={14} />
                {exportGradesMutation.isPending ? 'Đang xuất...' : 'Xuất CSV'}
              </button>
            )}
          </header>

          <div style={{ marginBottom: 24 }}>
            <label>
              <p className="muted" style={{ marginBottom: 6 }}>
                Chọn bài kiểm tra
              </p>
              <select
                className="input"
                value={assessmentId}
                onChange={(e) => setAssessmentId(e.target.value)}
                style={{ maxWidth: 400 }}
              >
                <option value="">-- Chọn bài kiểm tra --</option>
                {assessments.map((assessment) => (
                  <option key={assessment.id} value={assessment.id}>
                    {assessment.title} ({assessment.assessmentType})
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isLoading && <div className="empty">Đang tải phân tích...</div>}
          {isError && <div className="empty">Không thể tải phân tích</div>}

          {analytics && (
            <>
              {/* Summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div
                  style={{
                    padding: 20,
                    backgroundColor: 'white',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                  }}
                >
                  <p className="muted" style={{ fontSize: '0.875rem', marginBottom: 8 }}>
                    Tổng số bài nộp
                  </p>
                  <h2>{analytics.totalSubmissions}</h2>
                </div>

                <div
                  style={{
                    padding: 20,
                    backgroundColor: 'white',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                  }}
                >
                  <p className="muted" style={{ fontSize: '0.875rem', marginBottom: 8 }}>
                    Đã chấm
                  </p>
                  <h2>{analytics.gradedSubmissions}</h2>
                  <p className="muted" style={{ fontSize: '0.875rem', marginTop: 4 }}>
                    {analytics.totalSubmissions > 0
                      ? ((analytics.gradedSubmissions / analytics.totalSubmissions) * 100).toFixed(0)
                      : 0}%
                  </p>
                </div>

                <div
                  style={{
                    padding: 20,
                    backgroundColor: 'white',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                  }}
                >
                  <p className="muted" style={{ fontSize: '0.875rem', marginBottom: 8 }}>
                    Chờ chấm
                  </p>
                  <h2 style={{ color: 'var(--warning-color)' }}>{analytics.pendingSubmissions}</h2>
                </div>

                <div
                  style={{
                    padding: 20,
                    backgroundColor: 'white',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                  }}
                >
                  <p className="muted" style={{ fontSize: '0.875rem', marginBottom: 8 }}>
                    Tỷ lệ đạt
                  </p>
                  <h2 style={{ color: 'var(--success-color)' }}>
                    {analytics.passRate.toFixed(1)}%
                  </h2>
                </div>
              </div>

              {/* Score statistics */}
              <div
                style={{
                  padding: 24,
                  backgroundColor: 'white',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  marginBottom: 24,
                }}
              >
                <h3 style={{ marginBottom: 16 }}>Thống kê điểm</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
                  <div>
                    <p className="muted" style={{ fontSize: '0.875rem' }}>Điểm trung bình</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: 4 }}>
                      {analytics.averageScore.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="muted" style={{ fontSize: '0.875rem' }}>Điểm trung vị</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: 4 }}>
                      {analytics.medianScore.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="muted" style={{ fontSize: '0.875rem' }}>Điểm cao nhất</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: 4, color: 'var(--success-color)' }}>
                      {analytics.highestScore.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="muted" style={{ fontSize: '0.875rem' }}>Điểm thấp nhất</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: 4, color: 'var(--danger-color)' }}>
                      {analytics.lowestScore.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="muted" style={{ fontSize: '0.875rem' }}>Thời gian TB</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: 4 }}>
                      {Math.floor(analytics.averageTimeSpentSeconds / 60)} phút
                    </p>
                  </div>
                </div>
              </div>

              {/* Score distribution */}
              {Object.keys(analytics.scoreDistribution).length > 0 && (
                <div
                  style={{
                    padding: 24,
                    backgroundColor: 'white',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    marginBottom: 24,
                  }}
                >
                  <h3 style={{ marginBottom: 16 }}>Phân bố điểm (Thang điểm 10)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {Object.entries(analytics.scoreDistribution)
                      .sort(([a], [b]) => {
                        // Sort by numeric value
                        const aNum = parseFloat(a.split('-')[0]);
                        const bNum = parseFloat(b.split('-')[0]);
                        return aNum - bNum;
                      })
                      .map(([range, count]) => {
                        const percentage = (count / analytics.totalSubmissions) * 100;
                        
                        // Map ranges to Vietnamese labels
                        const rangeLabels: Record<string, { label: string; color: string }> = {
                          '0-2': { label: 'Kém', color: 'var(--danger-color)' },
                          '2-4': { label: 'Yếu', color: 'var(--warning-color)' },
                          '4-6': { label: 'Trung bình', color: 'var(--info-color)' },
                          '6-8': { label: 'Khá', color: 'var(--primary-color)' },
                          '8-10': { label: 'Giỏi', color: 'var(--success-color)' },
                        };
                        
                        const rangeInfo = rangeLabels[range] || { label: '', color: 'var(--primary-color)' };
                        
                        return (
                          <div key={range}>
                            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontWeight: 500 }}>
                                {range} - <span style={{ color: rangeInfo.color }}>{rangeInfo.label}</span>
                              </span>
                              <span className="muted">
                                {count} học sinh ({percentage.toFixed(0)}%)
                              </span>
                            </div>
                            <div
                              style={{
                                height: 8,
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: 4,
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${percentage}%`,
                                  backgroundColor: rangeInfo.color,
                                  transition: 'width 0.3s',
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Question difficulty (from BE) */}
              {analytics.questionDifficulty && Object.keys(analytics.questionDifficulty).length > 0 && (
                <div
                  style={{
                    padding: 24,
                    backgroundColor: 'white',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                  }}
                >
                  <h3 style={{ marginBottom: 16 }}>
                    <TrendingUp size={20} style={{ marginRight: 8 }} />
                    Độ khó câu hỏi
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {Object.entries(analytics.questionDifficulty).map(([questionId, difficulty], index) => (
                      <div
                        key={questionId}
                        style={{
                          padding: 16,
                          backgroundColor: 'var(--bg-secondary)',
                          borderRadius: 6,
                        }}
                      >
                        <h4 style={{ marginBottom: 8 }}>Câu {index + 1} (ID: {questionId})</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                          <div>
                            <p className="muted" style={{ fontSize: '0.75rem' }}>Độ khó</p>
                            <p style={{ fontWeight: 600 }}>{(difficulty * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="muted" style={{ fontSize: '0.75rem' }}>Tỷ lệ đúng</p>
                            <p style={{ fontWeight: 600, color: 'var(--success-color)' }}>
                              {((1 - difficulty) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
