import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { QuestionBankRequest, QuestionBankResponse } from '../../types/questionBank';
import { useSubjects } from '../../hooks/useSubjects';
import { useChaptersBySubject } from '../../hooks/useChapters';

type Props = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: QuestionBankResponse | null;
  onClose: () => void;
  onSubmit: (data: QuestionBankRequest) => Promise<void>;
};

export function QuestionBankFormModal({ isOpen, mode, initialData, onClose, onSubmit }: Readonly<Props>) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [chapterSearch, setChapterSearch] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: subjectsData } = useSubjects();
  const { data: chaptersData } = useChaptersBySubject(selectedSubjectId, !!selectedSubjectId && isOpen);

  const subjects = subjectsData?.result ?? [];
  const chapters = chaptersData?.result ?? [];
  const filteredChapters = chapters.filter((chapter) => {
    if (!chapterSearch.trim()) return true;
    const query = chapterSearch.toLowerCase();
    const title = (chapter.title || chapter.name || '').toLowerCase();
    return title.includes(query);
  });

  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit' && initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setIsPublic(initialData.isPublic ?? false);
      setSelectedChapterId(initialData.chapterId ?? '');
      setChapterSearch(initialData.chapterTitle ?? '');
      setSubmitError(null);
      return;
    }

    setName('');
    setDescription('');
    setIsPublic(false);
    setSelectedSubjectId('');
    setSelectedChapterId('');
    setChapterSearch('');
    setSubmitError(null);
  }, [isOpen, mode, initialData]);

  if (!isOpen) return null;

  let submitLabel = 'Cập nhật';
  if (saving) submitLabel = 'Đang lưu...';
  else if (mode === 'create') submitLabel = 'Tạo ngân hàng';

  async function submit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    setSubmitError(null);
    if (!name.trim()) return;

    if (!selectedChapterId) {
      setSubmitError('Vui lòng chọn chapter cho question bank.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
        chapterId: selectedChapterId,
      });
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Không thể lưu question bank.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-layer">
      <div className="modal-card" style={{ width: 'min(680px, 100%)' }}>
        <div className="modal-header">
          <div>
            <h3>{mode === 'create' ? 'Tạo ngân hàng câu hỏi' : 'Chỉnh sửa ngân hàng câu hỏi'}</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              Tổ chức nhóm câu hỏi theo mục tiêu giảng dạy và mức độ chia sẻ.
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="modal-body">
            <label>
              <p className="muted" style={{ marginBottom: 6 }}>Tên ngân hàng</p>
              <input
                className="input"
                required
                maxLength={255}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ví dụ: Đại số lớp 9 - Chương 1"
              />
            </label>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>Môn học</p>
              <select
                className="select"
                value={selectedSubjectId}
                onChange={(event) => {
                  setSelectedSubjectId(event.target.value);
                  setSelectedChapterId('');
                  setChapterSearch('');
                }}
              >
                <option value="">Chọn môn học để tải chapter</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </label>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>Tìm chapter</p>
              <input
                className="input"
                value={chapterSearch}
                onChange={(event) => setChapterSearch(event.target.value)}
                placeholder="Nhập tên chapter để lọc"
              />
            </label>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>Chapter</p>
              <select
                className="select"
                required
                value={selectedChapterId}
                onChange={(event) => setSelectedChapterId(event.target.value)}
              >
                <option value="">Chọn chapter</option>
                {filteredChapters.map((chapter) => {
                  const chapterTitle = chapter.title || chapter.name || chapter.id;
                  return (
                    <option key={chapter.id} value={chapter.id}>{chapterTitle}</option>
                  );
                })}
                {mode === 'edit' && initialData?.chapterId && filteredChapters.every((item) => item.id !== initialData.chapterId) && (
                  <option value={initialData.chapterId}>{initialData.chapterTitle || initialData.chapterId}</option>
                )}
              </select>
            </label>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>Mô tả</p>
              <textarea
                className="textarea"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Mô tả phạm vi kiến thức, mục tiêu, hoặc ghi chú cho ngân hàng câu hỏi"
              />
            </label>

            <label className="row" style={{ justifyContent: 'start' }}>
              <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} />{' '}
              Chia sẻ công khai cho giáo viên khác
            </label>

            {submitError && (
              <div className="empty" style={{ color: '#b91c1c', marginTop: 0 }}>
                {submitError}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn" disabled={saving || !name.trim() || !selectedChapterId}>
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
