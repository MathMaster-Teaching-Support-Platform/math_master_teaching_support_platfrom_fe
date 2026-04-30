import { HelpCircle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  CognitiveLevel,
  QuestionType,
  QuestionTag,
  type QuestionTemplateRequest,
  type QuestionTemplateResponse,
} from '../../types/questionTemplate';
import { AcademicCascade } from '../../components/common/AcademicCascade';
import { TagSelector } from '../../components/common/TagSelector';
import { TypeSelector } from '../../components/question-templates/TypeSelector';
import { MCQBlueprint, type MCQBlueprintRef } from '../../components/question-templates/MCQBlueprint';
import { TFBlueprint, type TFBlueprintRef } from '../../components/question-templates/TFBlueprint';
import { SABlueprint, type SABlueprintRef } from '../../components/question-templates/SABlueprint';
import { useChaptersBySubject } from '../../hooks/useChapters';

type Props = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: QuestionTemplateResponse | null;
  onClose: () => void;
  onSubmit: (data: QuestionTemplateRequest) => Promise<void>;
};

type ValidationResult = {
  normalizedName: string;
  normalizedTags: QuestionTag[];
};

type ParameterInput = {
  name: string;
  type: string;
  min: string;
  max: string;
  constraint: string;
};

type OptionInput = {
  key: string;
  formula: string;
};

const cognitiveLevelLabels: Record<CognitiveLevel, string> = {
  NHAN_BIET: '1. Nhận biết',
  THONG_HIEU: '2. Thông hiểu',
  VAN_DUNG: '3. Vận dụng',
  VAN_DUNG_CAO: '4. Vận dụng cao',
};

function validateFormInput(input: {
  name: string;
  tags: QuestionTag[];
}): { error?: string; result?: ValidationResult } {
  const normalizedName = input.name.trim();
  if (!normalizedName) return { error: 'Tên mẫu là bắt buộc.' };
  if (normalizedName.length > 255) return { error: 'Tên mẫu không được vượt quá 255 ký tự.' };

  if (input.tags.length === 0) {
    return { error: 'Bạn cần chọn ít nhất một tag cho template.' };
  }

  if (input.tags.length > 5) {
    return { error: 'Bạn chỉ có thể chọn tối đa 5 tags.' };
  }

  return {
    result: {
      normalizedName,
      normalizedTags: input.tags,
    },
  };
}

function buildParameters(parameters: ParameterInput[]): Record<string, unknown> {
  const mappedParameters: Record<string, unknown> = {};
  for (const item of parameters) {
    if (!item.name.trim()) continue;
    const normalizedConstraint = item.constraint.trim();
    mappedParameters[item.name.trim()] = {
      type: item.type,
      min: item.type === 'int' ? Number.parseInt(item.min, 10) : Number.parseFloat(item.min),
      max: item.type === 'int' ? Number.parseInt(item.max, 10) : Number.parseFloat(item.max),
      ...(normalizedConstraint ? { constraint: normalizedConstraint } : {}),
    };
  }
  return mappedParameters;
}

function buildOptions(options: OptionInput[]): Record<string, unknown> {
  const mappedOptions: Record<string, unknown> = {};
  for (const option of options) {
    if (!option.key.trim() || !option.formula.trim()) continue;
    const formula = option.formula.trim();
    const wrappedFormula = formula.startsWith('$') && formula.endsWith('$')
      ? formula
      : `$${formula}$`;
    mappedOptions[option.key.trim()] = wrappedFormula;
  }
  return mappedOptions;
}

export function TemplateFormModal({
  isOpen,
  mode,
  initialData,
  onClose,
  onSubmit,
}: Readonly<Props>) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [templateType, setTemplateType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
  const [cognitiveLevel, setCognitiveLevel] = useState<CognitiveLevel>(CognitiveLevel.THONG_HIEU);
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState<QuestionTag[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Blueprint refs for extracting data
  const mcqBlueprintRef = useRef<MCQBlueprintRef>(null);
  const tfBlueprintRef = useRef<TFBlueprintRef>(null);
  const saBlueprintRef = useRef<SABlueprintRef>(null);

  // Fetch chapters for TF blueprint
  const { data: chaptersData } = useChaptersBySubject(
    selectedSubjectId,
    !!selectedSubjectId && isOpen
  );
  const chapters = chaptersData?.result ?? [];

  const nameRef = useRef<HTMLInputElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsGuideOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit' && initialData) {
      setSubmitError(null);
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setGradeLevel(initialData.gradeLevel || '');
      setSelectedSubjectId(initialData.subjectId || '');
      setSelectedChapterId(initialData.chapterId || '');
      setTemplateType(initialData.templateType || QuestionType.MULTIPLE_CHOICE);
      setCognitiveLevel(initialData.cognitiveLevel || CognitiveLevel.THONG_HIEU);
      setIsPublic(initialData.isPublic ?? false);
      setTags(initialData.tags || []);
      return;
    }

    setName('');
    setSubmitError(null);
    setDescription('');
    setGradeLevel('');
    setSelectedSubjectId('');
    setSelectedChapterId('');
    setTemplateType(QuestionType.MULTIPLE_CHOICE);
    setCognitiveLevel(CognitiveLevel.THONG_HIEU);
    setIsPublic(false);
    setTags([QuestionTag.LINEAR_EQUATIONS, QuestionTag.PROBLEM_SOLVING]);
  }, [isOpen, initialData, mode]);

  if (!isOpen) return null;

  let submitLabel = 'Cập nhật mẫu';
  if (saving) submitLabel = 'Đang lưu...';
  else if (mode === 'create') submitLabel = 'Tạo mẫu';

  async function submit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    setSubmitError(null);

    // Validate Zone 1 (Metadata)
    const validation = validateFormInput({ name, tags });
    if (validation.error || !validation.result) {
      setSubmitError(validation.error || 'Dữ liệu mẫu chưa hợp lệ.');
      return;
    }

    setSaving(true);

    try {
      let payload: QuestionTemplateRequest;

      switch (templateType) {
        case QuestionType.MULTIPLE_CHOICE: {
          const mcqData = mcqBlueprintRef.current?.getData();
          if (!mcqData) throw new Error('Không thể lấy dữ liệu MCQ blueprint');

          const mappedParameters = buildParameters(mcqData.parameters);
          const mappedOptions = buildOptions(mcqData.options);

          if (Object.keys(mappedParameters).length === 0) {
            setSubmitError('Bạn cần khai báo ít nhất một biến số.');
            setSaving(false);
            return;
          }

          payload = {
            name: validation.result.normalizedName,
            description: description.trim() || undefined,
            gradeLevel: gradeLevel || undefined,
            subjectId: selectedSubjectId || undefined,
            chapterId: selectedChapterId || undefined,
            templateType: QuestionType.MULTIPLE_CHOICE,
            templateText: { vi: mcqData.templateText },
            parameters: mappedParameters,
            answerFormula: mcqData.answerFormula || '',
            optionsGenerator: Object.keys(mappedOptions).length ? mappedOptions : undefined,
            cognitiveLevel,
            tags: validation.result.normalizedTags,
            isPublic,
            questionBankId: initialData?.questionBankId ?? null,
            diagramTemplate: mcqData.diagramTemplateRaw.trim() || undefined,
          };
          break;
        }

        case QuestionType.TRUE_FALSE: {
          const tfData = tfBlueprintRef.current?.getData();
          if (!tfData) throw new Error('Không thể lấy dữ liệu TF blueprint');

          if (tfData.clauses.some((c) => !c.text.trim())) {
            setSubmitError('Tất cả 4 mệnh đề phải có nội dung.');
            setSaving(false);
            return;
          }

          const trueCount = tfData.clauses.filter((c) => c.truthValue).length;
          const falseCount = tfData.clauses.filter((c) => !c.truthValue).length;
          if (trueCount === 0 || falseCount === 0) {
            setSubmitError('Phải có ít nhất 1 mệnh đề đúng và 1 mệnh đề sai.');
            setSaving(false);
            return;
          }

          const mappedParameters = buildParameters(tfData.parameters);

          payload = {
            name: validation.result.normalizedName,
            description: description.trim() || undefined,
            gradeLevel: gradeLevel || undefined,
            subjectId: selectedSubjectId || undefined,
            chapterId: selectedChapterId || undefined,
            templateType: QuestionType.TRUE_FALSE,
            templateText: { vi: tfData.stemText },
            parameters: Object.keys(mappedParameters).length ? mappedParameters : {},
            answerFormula: '',
            optionsGenerator: undefined,
            statementMutations: {
              clauseTemplates: tfData.clauses.map((c) => ({
                text: c.text,
                truthValue: c.truthValue,
                chapterId: c.chapterId,
                cognitiveLevel: c.cognitiveLevel,
              })),
            },
            cognitiveLevel,
            tags: validation.result.normalizedTags,
            isPublic,
            questionBankId: initialData?.questionBankId ?? null,
          };
          break;
        }

        case QuestionType.SHORT_ANSWER: {
          const saData = saBlueprintRef.current?.getData();
          if (!saData) throw new Error('Không thể lấy dữ liệu SA blueprint');

          const mappedParameters = buildParameters(saData.parameters);

          if (Object.keys(mappedParameters).length === 0) {
            setSubmitError('Bạn cần khai báo ít nhất một biến số.');
            setSaving(false);
            return;
          }

          if (saData.validationMode === 'NUMERIC' && !saData.tolerance) {
            setSubmitError('Chế độ NUMERIC yêu cầu sai số cho phép.');
            setSaving(false);
            return;
          }

          payload = {
            name: validation.result.normalizedName,
            description: description.trim() || undefined,
            gradeLevel: gradeLevel || undefined,
            subjectId: selectedSubjectId || undefined,
            chapterId: selectedChapterId || undefined,
            templateType: QuestionType.SHORT_ANSWER,
            templateText: { vi: saData.templateText },
            parameters: mappedParameters,
            answerFormula: saData.answerFormula || '',
            optionsGenerator: undefined,
            cognitiveLevel,
            tags: validation.result.normalizedTags,
            isPublic,
            questionBankId: initialData?.questionBankId ?? null,
            diagramTemplate: saData.diagramTemplateRaw.trim() || undefined,
          };
          break;
        }

        default:
          throw new Error('Loại câu hỏi không hợp lệ');
      }

      await onSubmit(payload);
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Không thể lưu mẫu câu hỏi. Vui lòng thử lại.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-layer">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3>{mode === 'create' ? 'Tạo mẫu câu hỏi' : 'Chỉnh sửa mẫu câu hỏi'}</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              Thiết lập biến số để tạo câu hỏi ngẫu nhiên tự động.
            </p>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button type="button" className="btn secondary" onClick={() => setIsGuideOpen(true)}>
              <HelpCircle size={14} />
              Hướng dẫn
            </button>
            <button className="icon-btn" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={submit}>
          <div className="modal-body">
            {/* ZONE 1: Metadata Section */}
            <div className="form-grid">
              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Tên mẫu <span style={{ color: '#ef4444' }}>*</span>
                </p>
                <input
                  ref={nameRef}
                  className="input"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>

              <AcademicCascade
                gradeLevel={gradeLevel}
                subjectId={selectedSubjectId}
                chapterId={selectedChapterId}
                onGradeChange={setGradeLevel}
                onSubjectChange={setSelectedSubjectId}
                onChapterChange={setSelectedChapterId}
                required={mode === 'create'}
              />

              <TypeSelector
                selectedType={templateType}
                onChange={setTemplateType}
                disabled={mode === 'edit'}
              />

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Mức độ nhận thức
                </p>
                <select
                  className="select"
                  value={cognitiveLevel}
                  onChange={(event) => setCognitiveLevel(event.target.value as CognitiveLevel)}
                >
                  {Object.entries(cognitiveLevelLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <TagSelector
                selectedTags={tags}
                onChange={setTags}
                maxTags={5}
                required
              />
            </div>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>
                Mô tả
              </p>
              <textarea
                ref={descriptionRef}
                className="textarea"
                rows={2}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>

            {/* ZONE 2: Blueprint Section (swaps based on type) */}
            {templateType === QuestionType.MULTIPLE_CHOICE && (
              <MCQBlueprint
                ref={mcqBlueprintRef}
                defaultChapterId={selectedChapterId}
              />
            )}

            {templateType === QuestionType.TRUE_FALSE && (
              <TFBlueprint
                ref={tfBlueprintRef}
                defaultChapterId={selectedChapterId}
                chapters={chapters}
              />
            )}

            {templateType === QuestionType.SHORT_ANSWER && (
              <SABlueprint
                ref={saBlueprintRef}
                defaultChapterId={selectedChapterId}
              />
            )}

            <label className="row" style={{ justifyContent: 'start' }}>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(event) => setIsPublic(event.target.checked)}
              />{' '}
              Công khai mẫu cho giáo viên khác
            </label>

            {submitError && (
              <div className="empty" style={{ color: '#b91c1c', marginTop: 0 }}>
                {submitError}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn" disabled={saving}>
              {submitLabel}
            </button>
          </div>
        </form>
      </div>

      {isGuideOpen && (
        <>
          <button
            type="button"
            aria-label="Đóng hướng dẫn"
            onClick={() => setIsGuideOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.35)',
              border: 'none',
              zIndex: 29,
              cursor: 'pointer',
            }}
          />
          <aside
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: 'min(460px, 100vw)',
              height: '100vh',
              background: '#ffffff',
              borderLeft: '1px solid #e2e8f0',
              boxShadow: '-8px 0 30px rgba(15, 23, 42, 0.16)',
              zIndex: 30,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1rem 0.75rem',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div>
                <h3 style={{ margin: 0, color: '#0f172a' }}>Hướng dẫn</h3>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>
                  Hướng dẫn tạo mẫu câu hỏi và nhập công thức toán học.
                </p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setIsGuideOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                padding: '0.9rem 1rem 1rem',
                overflowY: 'auto',
                display: 'grid',
                gap: '0.75rem',
              }}
            >
              <details
                open
                style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.75rem' }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#0f172a' }}>
                  📌 Phần 1: Quy tắc nhập liệu
                </summary>
                <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                  <div style={{ border: '1px solid #f1f5f9', borderRadius: 10, padding: '0.7rem' }}>
                    <strong>1. Biến số</strong>
                    <p className="muted" style={{ margin: '0.35rem 0' }}>
                      Dùng dạng: {'{{a}}'}, {'{{b}}'}, {'{{n}}'}
                    </p>
                    <pre
                      style={{
                        margin: 0,
                        background: '#f8fafc',
                        padding: '0.5rem',
                        borderRadius: 8,
                        overflowX: 'auto',
                      }}
                    >
                      Tính giá trị của {'{{a}}'} + {'{{b}}'}
                    </pre>
                  </div>

                  <div style={{ border: '1px solid #f1f5f9', borderRadius: 10, padding: '0.7rem' }}>
                    <strong>2. Công thức toán</strong>
                    <p className="muted" style={{ margin: '0.35rem 0' }}>
                      Viết bằng LaTeX, không dùng ký tự lạ hoặc text mơ hồ.
                    </p>
                    <pre
                      style={{
                        margin: 0,
                        background: '#f8fafc',
                        padding: '0.5rem',
                        borderRadius: 8,
                        overflowX: 'auto',
                      }}
                    >{String.raw`\frac{a}{b}, \sqrt{x^2 + 1}`}</pre>
                  </div>

                  <div style={{ border: '1px solid #f1f5f9', borderRadius: 10, padding: '0.7rem' }}>
                    <strong>3. Chèn công thức</strong>
                    <p className="muted" style={{ margin: '0.35rem 0 0' }}>
                      Bôi đen nội dung cần công thức rồi bấm Insert Math.
                    </p>
                  </div>
                </div>
              </details>

              <details
                open
                style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.75rem' }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#0f172a' }}>
                  📌 Phần 2: Các bước tạo câu hỏi
                </summary>
                <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                  <div
                    className="data-card"
                    style={{ minHeight: 0, border: '1px solid #dbeafe', padding: '0.65rem' }}
                  >
                    <strong>Bước 1: Nhập đề bài</strong>
                    <p className="muted" style={{ margin: '0.3rem 0 0' }}>
                      Viết nội dung + chèn biến. Ví dụ: Tính đạo hàm của hàm số y = {'{{a}}'}x^2
                    </p>
                  </div>
                  <div
                    className="data-card"
                    style={{ minHeight: 0, border: '1px solid #dbeafe', padding: '0.65rem' }}
                  >
                    <strong>Bước 2: Công thức đáp án đúng</strong>
                    <p className="muted" style={{ margin: '0.3rem 0 0' }}>
                      Nhập công thức theo biến. Ví dụ: 2 * {'{{a}}'} * x
                    </p>
                  </div>
                  <div
                    className="data-card"
                    style={{ minHeight: 0, border: '1px solid #dbeafe', padding: '0.65rem' }}
                  >
                    <strong>Bước 3: Khai báo tham số</strong>
                    <p className="muted" style={{ margin: '0.3rem 0 0' }}>
                      Ví dụ: a là số nguyên, từ 1 đến 10.
                    </p>
                  </div>
                  <div
                    className="data-card"
                    style={{ minHeight: 0, border: '1px solid #dbeafe', padding: '0.65rem' }}
                  >
                    <strong>Bước 4 (trắc nghiệm): Nhập đáp án A/B/C/D</strong>
                    <p className="muted" style={{ margin: '0.3rem 0 0' }}>
                      A: 2 * {'{{a}}'} * x, B: {'{{a}}'} * x, C: x^2, D: 2x
                    </p>
                  </div>
                  <div
                    className="data-card"
                    style={{ minHeight: 0, border: '1px solid #dbeafe', padding: '0.65rem' }}
                  >
                    <strong>Bước 5: Xem preview</strong>
                    <p className="muted" style={{ margin: '0.3rem 0 0' }}>
                      Luôn kiểm tra preview realtime trước khi lưu.
                    </p>
                  </div>
                </div>
              </details>

              <div
                style={{
                  border: '1px solid #fecaca',
                  background: '#fff7f7',
                  borderRadius: 12,
                  padding: '0.75rem',
                }}
              >
                <div className="row" style={{ alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                  <strong style={{ color: '#991b1b' }}>Lưu ý quan trọng</strong>
                </div>
                <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20, fontSize: '0.85rem' }}>
                  <li>Luôn kiểm tra preview trước khi lưu</li>
                  <li>Biến số phải khớp với tên trong công thức</li>
                  <li>Công thức LaTeX phải đúng cú pháp</li>
                </ul>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
