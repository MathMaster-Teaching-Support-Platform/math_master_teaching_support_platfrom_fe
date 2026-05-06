import { useEffect, useMemo, useState } from 'react';
import { Globe2, Lock, Sparkles } from 'lucide-react';
import type { QuestionBankRequest, QuestionBankResponse } from '../../types/questionBank';
import type { SchoolGradeResponse, SubjectResponse } from '../../types/academic.types';
import { AcademicStructureService } from '../../services/api/academic-structure.service';
import { QbInlineNotice, QbModal } from '../../components/question-banks/qb-ui';
import './QuestionBankFormModal.css';

type Props = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: QuestionBankResponse | null;
  onClose: () => void;
  onSubmit: (data: QuestionBankRequest) => Promise<void>;
};

const NAME_MAX = 255;
const DESCRIPTION_MAX = 1000;

// Map common BE error messages / phrases to friendly Vietnamese.
function friendlyError(message: string | undefined): string {
  if (!message) return 'Không thể lưu ngân hàng câu hỏi. Vui lòng thử lại.';
  const lower = message.toLowerCase();
  if (lower.includes('grade does not match') || lower.includes('bank_grade_mismatch')) {
    return 'Môn học không thuộc lớp đã chọn. Hãy chọn lại môn phù hợp.';
  }
  if (lower.includes('questions in use') || lower.includes('has questions in use')) {
    return 'Không thể đổi phạm vi vì ngân hàng đã có câu hỏi được dùng trong đề thi.';
  }
  if (lower.includes('school grade not found')) {
    return 'Không tìm thấy lớp đã chọn. Vui lòng tải lại trang.';
  }
  if (lower.includes('subject not found')) {
    return 'Không tìm thấy môn đã chọn. Vui lòng tải lại trang.';
  }
  if (lower.includes('name is required')) {
    return 'Tên ngân hàng không được để trống.';
  }
  return message;
}

interface FieldErrors {
  name?: string;
  schoolGradeId?: string;
}

export function QuestionBankFormModal({
  isOpen,
  mode,
  initialData,
  onClose,
  onSubmit,
}: Readonly<Props>) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [schoolGradeId, setSchoolGradeId] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [grades, setGrades] = useState<SchoolGradeResponse[]>([]);
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<{ name?: boolean; grade?: boolean }>({});
  const [saving, setSaving] = useState(false);

  const isEdit = mode === 'edit';
  // School grade is locked after creation to keep the chapter tree stable.
  const gradeLocked = isEdit && !!initialData?.schoolGradeId;

  // Reset / hydrate form whenever the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setIsPublic(initialData.isPublic ?? false);
      setSchoolGradeId(initialData.schoolGradeId ?? '');
      setSubjectId(initialData.subjectId ?? '');
    } else {
      setName('');
      setDescription('');
      setIsPublic(false);
      setSchoolGradeId('');
      setSubjectId('');
    }
    setSubmitError(null);
    setFieldErrors({});
    setTouched({});
  }, [isOpen, mode, initialData]);

  // Load grades on open.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoadingGrades(true);
    AcademicStructureService.getSchoolGrades(true)
      .then((res) => {
        if (!cancelled) setGrades(res.result ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load school grades', err);
      })
      .finally(() => {
        if (!cancelled) setLoadingGrades(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Subjects depend on grade.
  useEffect(() => {
    if (!isOpen) return;
    if (!schoolGradeId) {
      setSubjects([]);
      return;
    }
    let cancelled = false;
    setLoadingSubjects(true);
    AcademicStructureService.getSubjectsBySchoolGrade(schoolGradeId)
      .then((res) => {
        if (cancelled) return;
        const list = res.result ?? [];
        setSubjects(list);
        if (subjectId && !list.some((s) => s.id === subjectId)) {
          setSubjectId('');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load subjects', err);
        setSubjects([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSubjects(false);
      });
    return () => {
      cancelled = true;
    };
    // subjectId intentionally omitted — only re-fetch when grade changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, schoolGradeId]);

  const trimmedName = name.trim();
  const isNameValid = trimmedName.length > 0 && trimmedName.length <= NAME_MAX;
  const isGradeValid = isEdit ? true : !!schoolGradeId;

  // Live error map (only show after touched / submit attempt).
  const liveErrors = useMemo<FieldErrors>(() => {
    const errors: FieldErrors = {};
    if (touched.name && trimmedName.length === 0) {
      errors.name = 'Tên ngân hàng không được để trống.';
    } else if (trimmedName.length > NAME_MAX) {
      errors.name = `Tên không được vượt quá ${NAME_MAX} ký tự.`;
    }
    if (touched.grade && !isEdit && !schoolGradeId) {
      errors.schoolGradeId = 'Vui lòng chọn lớp.';
    }
    return errors;
  }, [touched, trimmedName, schoolGradeId, isEdit]);

  const errors = { ...liveErrors, ...fieldErrors };

  const canSubmit = isNameValid && isGradeValid && !saving;

  async function submit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    setTouched({ name: true, grade: true });

    const newFieldErrors: FieldErrors = {};
    if (!isNameValid) {
      newFieldErrors.name =
        trimmedName.length === 0
          ? 'Tên ngân hàng không được để trống.'
          : `Tên không được vượt quá ${NAME_MAX} ký tự.`;
    }
    if (!isGradeValid) {
      newFieldErrors.schoolGradeId = 'Vui lòng chọn lớp.';
    }
    setFieldErrors(newFieldErrors);
    if (Object.keys(newFieldErrors).length > 0) return;

    setSubmitError(null);
    setSaving(true);
    try {
      await onSubmit({
        name: trimmedName,
        description: description.trim() || undefined,
        isPublic,
        schoolGradeId: schoolGradeId || undefined,
        subjectId: subjectId || undefined,
      });
      onClose();
    } catch (error) {
      setSubmitError(friendlyError(error instanceof Error ? error.message : undefined));
    } finally {
      setSaving(false);
    }
  }

  const submitLabel = saving
    ? 'Đang lưu…'
    : mode === 'create'
      ? 'Tạo ngân hàng'
      : 'Lưu thay đổi';

  return (
    <QbModal
      isOpen={isOpen}
      onClose={saving ? () => {} : onClose}
      blockBackdropClose={saving}
      size="md"
      title={mode === 'create' ? 'Tạo ngân hàng câu hỏi' : 'Chỉnh sửa ngân hàng câu hỏi'}
      description={
        mode === 'create'
          ? 'Chọn lớp để hệ thống tự gắn các chương và 4 mức độ NB / TH / VD / VDC.'
          : 'Cập nhật thông tin cho ngân hàng câu hỏi của bạn.'
      }
      footer={
        <>
          <button
            type="button"
            className="qb-btn qb-btn--secondary"
            onClick={onClose}
            disabled={saving}
          >
            Hủy
          </button>
          <button
            type="submit"
            form="qb-bank-form"
            className="qb-btn qb-btn--primary"
            disabled={!canSubmit}
          >
            {submitLabel}
          </button>
        </>
      }
    >
      <form id="qb-bank-form" className="qb-bank-form" onSubmit={submit} noValidate>
        {/* ─── Section: Basic info ─── */}
        <fieldset className="qb-bank-form__section">
          <legend className="qb-bank-form__legend">Thông tin cơ bản</legend>

          <div className="qb-bank-form__field">
            <label htmlFor="qb-bank-name" className="qb-field-label">
              Tên ngân hàng <span className="qb-bank-form__required">*</span>
            </label>
            <input
              id="qb-bank-name"
              className={`qb-input ${errors.name ? 'qb-input--invalid' : ''}`}
              maxLength={NAME_MAX}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) setFieldErrors((s) => ({ ...s, name: undefined }));
              }}
              onBlur={() => setTouched((s) => ({ ...s, name: true }))}
              placeholder="Ví dụ: Ngân hàng câu hỏi Toán 9 — Học kỳ 1"
              aria-invalid={!!errors.name}
              aria-describedby="qb-bank-name-help"
            />
            <div id="qb-bank-name-help" className="qb-bank-form__help">
              {errors.name ? (
                <span className="qb-bank-form__error">{errors.name}</span>
              ) : (
                <span className="qb-text-muted">Tên rõ ràng giúp dễ tìm kiếm sau này.</span>
              )}
              <span
                className={`qb-bank-form__counter ${name.length > NAME_MAX * 0.9 ? 'qb-bank-form__counter--warn' : ''}`}
              >
                {name.length}/{NAME_MAX}
              </span>
            </div>
          </div>

          <div className="qb-bank-form__field">
            <label htmlFor="qb-bank-desc" className="qb-field-label">
              Mô tả
            </label>
            <textarea
              id="qb-bank-desc"
              className="qb-textarea"
              rows={3}
              maxLength={DESCRIPTION_MAX}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả phạm vi kiến thức, mục tiêu, hoặc ghi chú cho ngân hàng câu hỏi"
            />
            <div className="qb-bank-form__help">
              <span className="qb-text-muted">
                Tùy chọn — giúp người khác hiểu mục đích của ngân hàng.
              </span>
              <span
                className={`qb-bank-form__counter ${description.length > DESCRIPTION_MAX * 0.9 ? 'qb-bank-form__counter--warn' : ''}`}
              >
                {description.length}/{DESCRIPTION_MAX}
              </span>
            </div>
          </div>
        </fieldset>

        {/* ─── Section: Scope ─── */}
        <fieldset className="qb-bank-form__section">
          <legend className="qb-bank-form__legend">
            <Sparkles size={13} />
            Phạm vi học tập
          </legend>

          <div className="qb-bank-form__row">
            <div className="qb-bank-form__field">
              <label htmlFor="qb-bank-grade" className="qb-field-label">
                Lớp{' '}
                {!isEdit && <span className="qb-bank-form__required">*</span>}
                {gradeLocked && (
                  <span className="qb-bank-form__lock">
                    <Lock size={11} /> đã khóa
                  </span>
                )}
              </label>
              <select
                id="qb-bank-grade"
                className={`qb-select ${errors.schoolGradeId ? 'qb-input--invalid' : ''}`}
                disabled={gradeLocked || loadingGrades || saving}
                value={schoolGradeId}
                onChange={(e) => {
                  setSchoolGradeId(e.target.value);
                  if (fieldErrors.schoolGradeId)
                    setFieldErrors((s) => ({ ...s, schoolGradeId: undefined }));
                }}
                onBlur={() => setTouched((s) => ({ ...s, grade: true }))}
                aria-invalid={!!errors.schoolGradeId}
              >
                <option value="">{loadingGrades ? 'Đang tải lớp…' : '— Chọn lớp —'}</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                    {g.gradeLevel ? ` (Lớp ${g.gradeLevel})` : ''}
                  </option>
                ))}
              </select>
              {errors.schoolGradeId && (
                <p className="qb-bank-form__error qb-bank-form__error--block">
                  {errors.schoolGradeId}
                </p>
              )}
              {gradeLocked && !errors.schoolGradeId && (
                <p className="qb-text-muted qb-bank-form__hint">
                  Lớp được khóa sau khi tạo để giữ ổn định cây chương.
                </p>
              )}
            </div>

            <div className="qb-bank-form__field">
              <label htmlFor="qb-bank-subject" className="qb-field-label">
                Môn <span className="qb-bank-form__optional">(tùy chọn)</span>
              </label>
              <select
                id="qb-bank-subject"
                className="qb-select"
                disabled={!schoolGradeId || loadingSubjects || saving}
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              >
                <option value="">
                  {!schoolGradeId
                    ? '— Chọn lớp trước —'
                    : loadingSubjects
                      ? 'Đang tải môn…'
                      : '— Tất cả môn của lớp —'}
                </option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <p className="qb-text-muted qb-bank-form__hint">
                Bỏ trống để ngân hàng dùng được cho mọi môn của lớp.
              </p>
            </div>
          </div>
        </fieldset>

        {/* ─── Section: Sharing ─── */}
        <fieldset className="qb-bank-form__section qb-bank-form__section--share">
          <legend className="qb-bank-form__legend">Chia sẻ</legend>
          <label className="qb-bank-form__share">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              disabled={saving}
            />
            <span className="qb-bank-form__share-icon">
              {isPublic ? <Globe2 size={16} /> : <Lock size={16} />}
            </span>
            <span className="qb-bank-form__share-text">
              <strong>{isPublic ? 'Công khai' : 'Riêng tư'}</strong>
              <span className="qb-text-muted">
                {isPublic
                  ? 'Mọi giáo viên trong hệ thống có thể xem ngân hàng này.'
                  : 'Chỉ bạn nhìn thấy ngân hàng câu hỏi này.'}
              </span>
            </span>
          </label>
        </fieldset>

        {submitError && <QbInlineNotice tone="danger">{submitError}</QbInlineNotice>}
      </form>
    </QbModal>
  );
}
