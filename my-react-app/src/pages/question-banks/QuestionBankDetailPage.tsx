import { useMemo, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Link2, Pencil, RefreshCw, Search, Trash2, Unlink2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import MathText from '../../components/common/MathText';
import { useGetQuestionsByBank } from '../../hooks/useQuestion';
import {
  useDeleteQuestionBank,
  useGetQuestionBankById,
  useGetQuestionBankTemplates,
  useMapTemplateToQuestionBank,
  useToggleQuestionBankPublicStatus,
  useUnmapTemplateFromQuestionBank,
  useUpdateQuestionBank,
} from '../../hooks/useQuestionBank';
import type { QuestionResponse } from '../../types/question';
import type { QuestionBankRequest } from '../../types/questionBank';
import '../../styles/module-refactor.css';
import { QuestionBankFormModal } from './QuestionBankFormModal';
import { useGetMyQuestionTemplates } from '../../hooks/useQuestionTemplate';

const questionTypeLabel: Record<string, string> = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  TRUE_FALSE: 'Đúng/Sai',
  SHORT_ANSWER: 'Trả lời ngắn',
  ESSAY: 'Tự luận',
  CODING: 'Lập trình',
};

const difficultyLabel: Record<string, string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
};

export function QuestionBankDetailPage() {
  const { bankId } = useParams<{ bankId: string }>();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [questionPage, setQuestionPage] = useState(0);
  const [pageSize] = useState(20);
  const [formOpen, setFormOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [mappingMessage, setMappingMessage] = useState<string | null>(null);
  const [mappingError, setMappingError] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useGetQuestionBankById(
    bankId ?? '',
    !!bankId
  );
  const {
    data: questionsData,
    isLoading: questionsLoading,
    isError: questionsError,
    error: questionsErrorValue,
    refetch: refetchQuestions,
  } = useGetQuestionsByBank(bankId ?? '', questionPage, pageSize, !!bankId);
  const { data: mappedTemplatesData, refetch: refetchMappedTemplates } = useGetQuestionBankTemplates(
    bankId ?? '',
    !!bankId
  );
  const { data: myTemplatesData } = useGetMyQuestionTemplates(0, 200, 'createdAt', 'DESC');

  const updateMutation = useUpdateQuestionBank();
  const deleteMutation = useDeleteQuestionBank();
  const togglePublicMutation = useToggleQuestionBankPublicStatus();
  const mapTemplateMutation = useMapTemplateToQuestionBank();
  const unmapTemplateMutation = useUnmapTemplateFromQuestionBank();

  const bank = data?.result;
  const questions = questionsData?.result?.content ?? [];
  const totalQuestionPages = questionsData?.result?.totalPages ?? 0;
  const mappedTemplates = mappedTemplatesData?.result ?? [];
  const myTemplates = myTemplatesData?.result?.content ?? [];

  const unmappedTemplates = useMemo(() => {
    const mappedIds = new Set(mappedTemplates.map((template) => template.id));
    return myTemplates.filter((template) => !mappedIds.has(template.id));
  }, [mappedTemplates, myTemplates]);

  const filteredUnmappedTemplates = useMemo(() => {
    if (!templateSearch.trim()) return unmappedTemplates;
    const query = templateSearch.toLowerCase();
    return unmappedTemplates.filter((template) => {
      return (
        template.name.toLowerCase().includes(query) ||
        (template.description?.toLowerCase().includes(query) ?? false) ||
        template.id.toLowerCase().includes(query)
      );
    });
  }, [templateSearch, unmappedTemplates]);

  const filteredQuestions = useMemo(() => {
    if (!search.trim()) return questions;
    const q = search.toLowerCase();
    return questions.filter((item: QuestionResponse) => {
      const tagMatched = (item.tags ?? []).some((tag) => tag.toLowerCase().includes(q));
      return (
        item.questionText.toLowerCase().includes(q) ||
        (item.explanation?.toLowerCase().includes(q) ?? false) ||
        tagMatched
      );
    });
  }, [questions, search]);

  async function handleSave(payload: QuestionBankRequest) {
    if (!bankId) return;
    await updateMutation.mutateAsync({ id: bankId, request: payload });
    await refetch();
  }

  async function handleDelete() {
    if (!bankId || !bank) return;
    const confirmed = globalThis.confirm(
      `Xóa ngân hàng "${bank.name}"? Câu hỏi sẽ được gỡ liên kết khỏi ngân hàng này.`
    );
    if (!confirmed) return;
    await deleteMutation.mutateAsync(bankId);
    navigate('/teacher/question-banks');
  }

  async function handleMapTemplate() {
    if (!bankId || !selectedTemplateId) return;
    setMappingError(null);
    setMappingMessage(null);
    try {
      await mapTemplateMutation.mutateAsync({ id: bankId, templateId: selectedTemplateId });
      setSelectedTemplateId('');
      setTemplateSearch('');
      setSelectedTemplateIds(new Set());
      await refetchMappedTemplates();
      setMappingMessage('Đã gán template vào question bank.');
    } catch (error) {
      setMappingError(error instanceof Error ? error.message : 'Không thể gán template vào question bank.');
    }
  }

  async function handleMapSelectedTemplates() {
    if (!bankId || selectedTemplateIds.size === 0) return;
    setMappingError(null);
    setMappingMessage(null);

    const templateIds = Array.from(selectedTemplateIds);
    const results = await Promise.allSettled(
      templateIds.map((templateId) => mapTemplateMutation.mutateAsync({ id: bankId, templateId }))
    );

    const failedCount = results.filter((result) => result.status === 'rejected').length;
    const successCount = results.length - failedCount;

    setSelectedTemplateIds(new Set());
    setSelectedTemplateId('');
    setTemplateSearch('');
    await refetchMappedTemplates();

    if (failedCount === 0) {
      setMappingMessage(`Đã gán ${successCount} template thành công.`);
      return;
    }

    if (successCount === 0) {
      setMappingError('Không thể gán template đã chọn. Vui lòng kiểm tra quyền truy cập.');
      return;
    }

    setMappingError(`Đã gán ${successCount} template, thất bại ${failedCount} template.`);
  }

  async function handleUnmapTemplate(templateId: string) {
    if (!bankId) return;
    setMappingError(null);
    setMappingMessage(null);
    try {
      await unmapTemplateMutation.mutateAsync({ id: bankId, templateId });
      await refetchMappedTemplates();
      setMappingMessage('Đã gỡ template khỏi question bank.');
    } catch (error) {
      setMappingError(error instanceof Error ? error.message : 'Không thể gỡ template khỏi question bank.');
    }
  }

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: 'Teacher', avatar: '', role: 'teacher' }}
      notificationCount={0}
    >
      <div className="module-layout-container">
        <section className="module-page">
          <button className="btn secondary" onClick={() => navigate('/teacher/question-banks')}>
            <ArrowLeft size={15} />
            Quay lại ngân hàng câu hỏi
          </button>

          {isLoading && <div className="empty">Đang tải chi tiết ngân hàng câu hỏi...</div>}
          {isError && (
            <div className="empty">
              {error instanceof Error ? error.message : 'Không thể tải chi tiết ngân hàng câu hỏi'}
            </div>
          )}
          {!isLoading && !isError && !bank && (
            <div className="empty">Không tìm thấy ngân hàng câu hỏi.</div>
          )}

          {!isLoading && !isError && bank && (
            <>
              <article className="hero-card">
                <div className="row" style={{ alignItems: 'start', flexWrap: 'wrap' }}>
                  <div>
                    <p className="hero-kicker">Chi tiết ngân hàng câu hỏi</p>
                    <h2>{bank.name}</h2>
                    <p>{bank.description || 'Không có mô tả'}</p>
                  </div>
                  <span className={`badge ${bank.isPublic ? 'published' : 'draft'}`}>
                    {bank.isPublic ? 'Công khai' : 'Riêng tư'}
                  </span>
                </div>

                <div
                  className="row"
                  style={{ justifyContent: 'start', flexWrap: 'wrap', marginTop: 8 }}
                >
                  <span className="muted">Giáo viên: {bank.teacherName || 'Không xác định'}</span>
                  <span className="muted">Số câu hỏi: {bank.questionCount ?? 0}</span>
                  <span className="muted">Chapter: {bank.chapterTitle || bank.chapterId || 'Chưa gán chapter'}</span>
                </div>

                <div
                  className="toolbar"
                  style={{ marginTop: 14, border: 0, padding: 0, background: 'transparent' }}
                >
                  <button
                    className="btn secondary"
                    onClick={() => {
                      void refetch();
                      void refetchQuestions();
                    }}
                  >
                    <RefreshCw size={14} />
                    Làm mới
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => togglePublicMutation.mutate(bank.id)}
                  >
                    {bank.isPublic ? <EyeOff size={14} /> : <Eye size={14} />}
                    {bank.isPublic ? 'Chuyển riêng tư' : 'Chia sẻ công khai'}
                  </button>
                  <button className="btn secondary" onClick={() => setFormOpen(true)}>
                    <Pencil size={14} />
                    Chỉnh sửa
                  </button>
                  <button className="btn danger" onClick={() => void handleDelete()}>
                    <Trash2 size={14} />
                    Xóa
                  </button>
                </div>
              </article>

              <div className="toolbar">
                <label className="row" style={{ minWidth: 260 }}>
                  <Search size={15} />
                  <input
                    className="input"
                    style={{ border: 0, padding: 0, width: '100%' }}
                    placeholder="Tìm câu hỏi trong trang hiện tại"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
              </div>

              <article className="data-card" style={{ marginBottom: 16 }}>
                <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div>
                    <h3>Template Mapping</h3>
                    <p className="muted">Một question bank có thể gán nhiều question template.</p>
                  </div>
                  <span className="muted">Đã gán: {mappedTemplates.length}</span>
                </div>

                <div className="form-grid" style={{ marginTop: 12 }}>
                  <label>
                    <p className="muted" style={{ marginBottom: 6 }}>Tìm template</p>
                    <input
                      className="input"
                      value={templateSearch}
                      onChange={(event) => setTemplateSearch(event.target.value)}
                      placeholder="Tìm theo tên, mô tả, hoặc templateId"
                    />
                  </label>

                  <label>
                    <p className="muted" style={{ marginBottom: 6 }}>Template khả dụng</p>
                    <select
                      className="select"
                      value={selectedTemplateId}
                      onChange={(event) => setSelectedTemplateId(event.target.value)}
                    >
                      <option value="">Chọn template để gán</option>
                      {filteredUnmappedTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name} ({template.id.slice(0, 8)})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="row" style={{ flexWrap: 'wrap', marginTop: 10 }}>
                  <button
                    className="btn secondary"
                    onClick={() => void handleMapTemplate()}
                    disabled={!selectedTemplateId || mapTemplateMutation.isPending}
                  >
                    <Link2 size={14} />
                    {mapTemplateMutation.isPending ? 'Đang gán...' : 'Gán template đã chọn'}
                  </button>
                  <button
                    className="btn"
                    onClick={() => void handleMapSelectedTemplates()}
                    disabled={selectedTemplateIds.size === 0 || mapTemplateMutation.isPending}
                  >
                    <Link2 size={14} />
                    {mapTemplateMutation.isPending
                      ? 'Đang gán theo lô...'
                      : `Gán nhiều template (${selectedTemplateIds.size})`}
                  </button>
                </div>

                {filteredUnmappedTemplates.length > 0 && (
                  <div className="table-wrap" style={{ marginTop: 12 }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th style={{ width: 50 }}>
                            <input
                              type="checkbox"
                              checked={
                                filteredUnmappedTemplates.length > 0 &&
                                filteredUnmappedTemplates.every((template) =>
                                  selectedTemplateIds.has(template.id)
                                )
                              }
                              onChange={(event) => {
                                const checked = event.target.checked;
                                if (!checked) {
                                  setSelectedTemplateIds(new Set());
                                  return;
                                }
                                setSelectedTemplateIds(new Set(filteredUnmappedTemplates.map((item) => item.id)));
                              }}
                            />
                          </th>
                          <th>Tên template</th>
                          <th style={{ width: 280 }}>Template ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUnmappedTemplates.slice(0, 30).map((template) => (
                          <tr key={template.id}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedTemplateIds.has(template.id)}
                                onChange={(event) => {
                                  const checked = event.target.checked;
                                  setSelectedTemplateIds((prev) => {
                                    const next = new Set(prev);
                                    if (checked) next.add(template.id);
                                    else next.delete(template.id);
                                    return next;
                                  });
                                }}
                              />
                            </td>
                            <td>{template.name}</td>
                            <td>{template.id}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {mappedTemplates.length > 0 && (
                  <div className="table-wrap" style={{ marginTop: 12 }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Template đã gán</th>
                          <th style={{ width: 200 }}>Trạng thái</th>
                          <th style={{ width: 220 }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mappedTemplates.map((template) => (
                          <tr key={template.id}>
                            <td>
                              <div>{template.name}</div>
                              <p className="muted" style={{ margin: 0 }}>{template.id}</p>
                            </td>
                            <td>{template.status}</td>
                            <td>
                              <button
                                className="btn danger"
                                onClick={() => void handleUnmapTemplate(template.id)}
                                disabled={unmapTemplateMutation.isPending}
                              >
                                <Unlink2 size={14} />
                                Gỡ mapping
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {mappedTemplates.length === 0 && (
                  <div className="empty" style={{ marginTop: 12 }}>Question bank này chưa gán template nào.</div>
                )}

                {mappingMessage && (
                  <div className="empty" style={{ marginTop: 12, color: '#166534' }}>{mappingMessage}</div>
                )}
                {mappingError && (
                  <div className="empty" style={{ marginTop: 12, color: '#b91c1c' }}>{mappingError}</div>
                )}
              </article>

              {questionsLoading && <div className="empty">Đang tải danh sách câu hỏi...</div>}
              {questionsError && (
                <div className="empty">
                  {questionsErrorValue instanceof Error
                    ? questionsErrorValue.message
                    : 'Không thể tải danh sách câu hỏi'}
                </div>
              )}
              {!questionsLoading && !questionsError && filteredQuestions.length === 0 && (
                <div className="empty">Không có câu hỏi phù hợp trong ngân hàng này.</div>
              )}

              {!questionsLoading && !questionsError && filteredQuestions.length > 0 && (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Câu hỏi</th>
                        <th>Loại</th>
                        <th>Độ khó</th>
                        <th>Điểm</th>
                        <th>Tags</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQuestions.map((question) => (
                        <tr key={question.id}>
                          <td><MathText text={question.questionText} /></td>
                          <td>
                            {questionTypeLabel[question.questionType] || question.questionType}
                          </td>
                          <td>
                            {(question.difficulty && difficultyLabel[question.difficulty]) ||
                              question.difficulty ||
                              '-'}
                          </td>
                          <td>{question.points ?? '-'}</td>
                          <td>{(question.tags ?? []).join(', ') || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {totalQuestionPages > 1 && (
                <div className="row" style={{ justifyContent: 'center' }}>
                  <button
                    className="btn secondary"
                    disabled={questionPage === 0}
                    onClick={() => setQuestionPage((prev) => prev - 1)}
                  >
                    Trước
                  </button>
                  <span className="muted">
                    Trang {questionPage + 1} / {totalQuestionPages}
                  </span>
                  <button
                    className="btn secondary"
                    disabled={questionPage >= totalQuestionPages - 1}
                    onClick={() => setQuestionPage((prev) => prev + 1)}
                  >
                    Sau
                  </button>
                </div>
              )}

              <QuestionBankFormModal
                isOpen={formOpen}
                mode="edit"
                initialData={bank}
                onClose={() => setFormOpen(false)}
                onSubmit={handleSave}
              />
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
