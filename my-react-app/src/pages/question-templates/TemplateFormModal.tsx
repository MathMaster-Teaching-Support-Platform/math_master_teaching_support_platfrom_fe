import { AlertTriangle, HelpCircle, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import MathText from '../../components/common/MathText';
import {
  CognitiveLevel,
  QuestionType,
  QuestionTag,
  questionTagLabels,
  type QuestionTemplateRequest,
  type QuestionTemplateResponse,
} from '../../types/questionTemplate';
// ✅ NEW: Import hooks for Grade→Subject→Chapter cascade
import { useGrades } from '../../hooks/useGrades';
import { useSubjectsByGrade } from '../../hooks/useSubjects';
import { useChaptersBySubject } from '../../hooks/useChapters';

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

type Props = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: QuestionTemplateResponse | null;
  onClose: () => void;
  onSubmit: (data: QuestionTemplateRequest) => Promise<void>;
};

type ValidationResult = {
  normalizedName: string;
  normalizedTemplateText: string;
  normalizedAnswerFormula?: string;
  normalizedTags: QuestionTag[];
};

type ActiveMathField =
  | { kind: 'name' }
  | { kind: 'description' }
  | { kind: 'templateText' }
  | { kind: 'answerFormula' }
  | { kind: 'diagramTemplateRaw' }
  | { kind: 'parameterName'; index: number }
  | { kind: 'parameterMin'; index: number }
  | { kind: 'parameterMax'; index: number }
  | { kind: 'parameterConstraint'; index: number }
  | { kind: 'optionKey'; index: number }
  | { kind: 'optionFormula'; index: number };

type MathSnippet = {
  label: string;
  snippet: string;
  caretOffset: number;
};

type ActiveFieldContext = {
  value: string;
  setValue: (value: string) => void;
  element: HTMLInputElement | HTMLTextAreaElement | null;
};

const mathSnippets: MathSnippet[] = [
  { label: 'Fraction', snippet: String.raw`\frac{}{}`, caretOffset: 6 },
  { label: 'Square root', snippet: String.raw`\sqrt{}`, caretOffset: 6 },
  { label: 'Power', snippet: '^{}', caretOffset: 2 },
  { label: 'Subscript', snippet: '_{}', caretOffset: 2 },
  { label: 'Pi', snippet: String.raw`\pi`, caretOffset: 3 },
  { label: 'Infinity', snippet: String.raw`\infty`, caretOffset: 7 },
  { label: 'Integral', snippet: String.raw`\int_{}^{}`, caretOffset: 6 },
];

function parseTemplateText(value: Record<string, unknown> | undefined): string {
  const vi = value?.vi;
  const en = value?.en;
  if (typeof vi === 'string') return vi;
  if (typeof en === 'string') return en;
  return '';
}

function validateFormInput(input: {
  name: string;
  templateText: string;
  answerFormula: string;
  tags: QuestionTag[];
}): { error?: string; result?: ValidationResult } {
  const normalizedName = input.name.trim();
  if (!normalizedName) return { error: 'Tên mẫu là bắt buộc.' };
  if (normalizedName.length > 255) return { error: 'Tên mẫu không được vượt quá 255 ký tự.' };

  const normalizedTemplateText = input.templateText.trim();
  if (!normalizedTemplateText) return { error: 'Nội dung template là bắt buộc.' };

  const normalizedAnswerFormula = input.answerFormula.trim();

  if (input.tags.length === 0) {
    return { error: 'Bạn cần chọn ít nhất một tag cho template.' };
  }

  if (input.tags.length > 5) {
    return { error: 'Bạn chỉ có thể chọn tối đa 5 tags.' };
  }

  return {
    result: {
      normalizedName,
      normalizedTemplateText,
      normalizedAnswerFormula: normalizedAnswerFormula || undefined,
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
    const wrappedFormula = formula.startsWith('$$') && formula.endsWith('$$')
      ? formula
      : `$$${formula}$$`;
    mappedOptions[option.key.trim()] = wrappedFormula;
  }
  return mappedOptions;
}

const cognitiveLevelLabels: Record<CognitiveLevel, string> = {
  NHAN_BIET: '1. Nhận biết',
  THONG_HIEU: '2. Thông hiểu',
  VAN_DUNG: '3. Vận dụng',
  VAN_DUNG_CAO: '4. Vận dụng cao',
};

export function TemplateFormModal({
  isOpen,
  mode,
  initialData,
  onClose,
  onSubmit,
}: Readonly<Props>) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  // ✅ NEW: Academic context state (Template owns chapter)
  const [gradeLevel, setGradeLevel] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [templateType, setTemplateType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
  const [cognitiveLevel, setCognitiveLevel] = useState<CognitiveLevel>(CognitiveLevel.THONG_HIEU);
  const [isPublic, setIsPublic] = useState(false);
  const [templateText, setTemplateText] = useState('');
  const [answerFormula, setAnswerFormula] = useState('');
  const [tags, setTags] = useState<QuestionTag[]>([]);
  const [parameters, setParameters] = useState<ParameterInput[]>([]);
  const [options, setOptions] = useState<OptionInput[]>([]);
  const [diagramTemplateRaw, setDiagramTemplateRaw] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeMathField, setActiveMathField] = useState<ActiveMathField>({ kind: 'templateText' });
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // ✅ NEW: Fetch academic hierarchy data
  const { data: gradesData, isLoading: isLoadingGrades } = useGrades(isOpen);
  const { data: subjectsData, isLoading: isLoadingSubjects } = useSubjectsByGrade(
    gradeLevel,
    !!gradeLevel && isOpen
  );
  const { data: chaptersData, isLoading: isLoadingChapters } = useChaptersBySubject(
    selectedSubjectId,
    !!selectedSubjectId && isOpen
  );

  const grades = gradesData?.result ?? [];
  const subjects = subjectsData?.result ?? [];
  const chapters = chaptersData?.result ?? [];
  const sortedGrades = [...grades].sort((a, b) => a.level - b.level);

  const nameRef = useRef<HTMLInputElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const templateTextRef = useRef<HTMLTextAreaElement | null>(null);
  const answerFormulaRef = useRef<HTMLInputElement | null>(null);
  const diagramTemplateRef = useRef<HTMLTextAreaElement | null>(null);
  const parameterNameRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const parameterMinRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const parameterMaxRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const parameterConstraintRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const optionKeyRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const optionFormulaRefs = useRef<Record<number, HTMLInputElement | null>>({});

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
      // ✅ NEW: Initialize academic context from initialData
      setGradeLevel(initialData.gradeLevel || '');
      setSelectedSubjectId(initialData.subjectId || '');
      setSelectedChapterId(initialData.chapterId || '');
      setTemplateType(initialData.templateType || QuestionType.MULTIPLE_CHOICE);
      setCognitiveLevel(initialData.cognitiveLevel || CognitiveLevel.THONG_HIEU);
      setIsPublic(initialData.isPublic ?? false);
      setTemplateText(parseTemplateText(initialData.templateText));
      setAnswerFormula(initialData.answerFormula || '');
      setTags(initialData.tags || []);
      if (typeof initialData.diagramTemplate === 'string') {
        setDiagramTemplateRaw(initialData.diagramTemplate);
      } else {
        setDiagramTemplateRaw(
          initialData.diagramTemplate ? JSON.stringify(initialData.diagramTemplate, null, 2) : ''
        );
      }

      const mappedParameters: ParameterInput[] = Object.entries(initialData.parameters || {}).map(
        ([key, raw]) => {
          const item = raw as { type?: string; min?: number; max?: number; constraint?: string };
          return {
            name: key,
            type: item.type || 'int',
            min: item.min?.toString() || '1',
            max: item.max?.toString() || '10',
            constraint: item.constraint || '',
          };
        }
      );

      const mappedOptions: OptionInput[] = Object.entries(initialData.optionsGenerator || {}).map(
        ([key, raw]) => ({
          key,
          formula: typeof raw === 'string' ? raw : '',
        })
      );

      setParameters(
        mappedParameters.length
          ? mappedParameters
          : [{ name: 'a', type: 'int', min: '1', max: '10', constraint: '' }]
      );
      setOptions(
        mappedOptions.length
          ? mappedOptions
          : [
              { key: 'A', formula: '' },
              { key: 'B', formula: '' },
            ]
      );
      return;
    }

    setName('');
    setSubmitError(null);
    setDescription('');
    // ✅ NEW: Reset academic context for create mode
    setGradeLevel('');
    setSelectedSubjectId('');
    setSelectedChapterId('');
    setTemplateType(QuestionType.MULTIPLE_CHOICE);
    setCognitiveLevel(CognitiveLevel.THONG_HIEU);
    setIsPublic(false);
    setTemplateText('Giải phương trình: {{a}}x + {{b}} = 0');
    setAnswerFormula('(-{{b}})/{{a}}');
    setTags([QuestionTag.LINEAR_EQUATIONS, QuestionTag.PROBLEM_SOLVING]);
    setDiagramTemplateRaw('');
    setParameters([
      { name: 'a', type: 'int', min: '1', max: '10', constraint: '' },
      { name: 'b', type: 'int', min: '-10', max: '10', constraint: '' },
    ]);
    setOptions([
      { key: 'A', formula: '$$(-{{b}})/{{a}}$$' },
      { key: 'B', formula: '$${{b}}/{{a}}$$' },
      { key: 'C', formula: '$$-{{a}}/{{b}}$$' },
      { key: 'D', formula: '$${{a}}+{{b}}$$' },
    ]);
  }, [isOpen, initialData, mode]);

  if (!isOpen) return null;

  let submitLabel = 'Cập nhật mẫu';
  if (saving) submitLabel = 'Đang lưu...';
  else if (mode === 'create') submitLabel = 'Tạo mẫu';

  const removeParameterAt = (indexToRemove: number) => {
    setParameters((prev) => prev.filter((_entry, index) => index !== indexToRemove));
  };

  const removeOptionAt = (indexToRemove: number) => {
    setOptions((prev) => prev.filter((_entry, index) => index !== indexToRemove));
  };

  const setOptionFormulaAt = (optionIndex: number, nextValue: string) => {
    setOptions((prev) =>
      prev.map((entry, idx) => (idx === optionIndex ? { ...entry, formula: nextValue } : entry))
    );
  };

  const setOptionKeyAt = (optionIndex: number, nextValue: string) => {
    setOptions((prev) =>
      prev.map((entry, idx) => (idx === optionIndex ? { ...entry, key: nextValue } : entry))
    );
  };

  const setParameterFieldAt = (
    parameterIndex: number,
    field: 'name' | 'min' | 'max' | 'constraint',
    nextValue: string
  ) => {
    setParameters((prev) =>
      prev.map((entry, idx) => (idx === parameterIndex ? { ...entry, [field]: nextValue } : entry))
    );
  };

  const getStaticFieldContext = (): ActiveFieldContext | null => {
    switch (activeMathField.kind) {
      case 'name':
        return { value: name, setValue: setName, element: nameRef.current };
      case 'description':
        return { value: description, setValue: setDescription, element: descriptionRef.current };
      case 'templateText':
        return { value: templateText, setValue: setTemplateText, element: templateTextRef.current };
      case 'answerFormula':
        return {
          value: answerFormula,
          setValue: setAnswerFormula,
          element: answerFormulaRef.current,
        };
      case 'diagramTemplateRaw':
        return {
          value: diagramTemplateRaw,
          setValue: setDiagramTemplateRaw,
          element: diagramTemplateRef.current,
        };
      default:
        return null;
    }
  };

  const getIndexedFieldContext = (): ActiveFieldContext | null => {
    if (!('index' in activeMathField)) return null;

    const index = activeMathField.index;
    switch (activeMathField.kind) {
      case 'parameterName': {
        const item = parameters[index];
        if (!item) return null;
        return {
          value: item.name,
          setValue: (nextValue: string) => setParameterFieldAt(index, 'name', nextValue),
          element: parameterNameRefs.current[index] || null,
        };
      }
      case 'parameterMin': {
        const item = parameters[index];
        if (!item) return null;
        return {
          value: item.min,
          setValue: (nextValue: string) => setParameterFieldAt(index, 'min', nextValue),
          element: parameterMinRefs.current[index] || null,
        };
      }
      case 'parameterMax': {
        const item = parameters[index];
        if (!item) return null;
        return {
          value: item.max,
          setValue: (nextValue: string) => setParameterFieldAt(index, 'max', nextValue),
          element: parameterMaxRefs.current[index] || null,
        };
      }
      case 'parameterConstraint': {
        const item = parameters[index];
        if (!item) return null;
        return {
          value: item.constraint,
          setValue: (nextValue: string) => setParameterFieldAt(index, 'constraint', nextValue),
          element: parameterConstraintRefs.current[index] || null,
        };
      }
      case 'optionKey': {
        const item = options[index];
        if (!item) return null;
        return {
          value: item.key,
          setValue: (nextValue: string) => setOptionKeyAt(index, nextValue),
          element: optionKeyRefs.current[index] || null,
        };
      }
      case 'optionFormula': {
        const item = options[index];
        if (!item) return null;
        return {
          value: item.formula,
          setValue: (nextValue: string) => setOptionFormulaAt(index, nextValue),
          element: optionFormulaRefs.current[index] || null,
        };
      }
      default:
        return null;
    }
  };

  const getActiveFieldContext = (): ActiveFieldContext | null => {
    return getStaticFieldContext() || getIndexedFieldContext();
  };

  const applyInsertAtCursor = (snippet: string, caretOffset = snippet.length) => {
    const context = getActiveFieldContext();
    if (!context?.element) return;

    const { element, value, setValue } = context;
    const start = element.selectionStart ?? value.length;
    const end = element.selectionEnd ?? value.length;

    const nextValue = `${value.slice(0, start)}${snippet}${value.slice(end)}`;
    const nextCaret = start + caretOffset;

    setValue(nextValue);
    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(nextCaret, nextCaret);
    });
  };

  const handleInsertMath = () => {
    const context = getActiveFieldContext();
    if (!context?.element) return;

    const { element, value, setValue } = context;
    const start = element.selectionStart ?? value.length;
    const end = element.selectionEnd ?? value.length;

    if (start !== end) {
      const selectedText = value.slice(start, end);
      const wrapped = `$${selectedText}$`;
      const nextValue = `${value.slice(0, start)}${wrapped}${value.slice(end)}`;
      const nextCaret = start + wrapped.length;
      setValue(nextValue);
      requestAnimationFrame(() => {
        element.focus();
        element.setSelectionRange(nextCaret, nextCaret);
      });
      return;
    }

    applyInsertAtCursor('$$', 1);
  };

  const keepFocusOnToolbarClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  async function submit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    setSubmitError(null);

    const validation = validateFormInput({
      name,
      templateText,
      answerFormula,
      tags,
    });
    if (validation.error || !validation.result) {
      setSubmitError(validation.error || 'Dữ liệu mẫu chưa hợp lệ.');
      return;
    }

    setSaving(true);

    const mappedParameters = buildParameters(parameters);
    const mappedOptions = buildOptions(options);
    const mappedDiagramTemplate = diagramTemplateRaw.trim() || undefined;

    if (Object.keys(mappedParameters).length === 0) {
      setSubmitError(
        'Bạn cần khai báo ít nhất một biến số trong mục “Biến số ngẫu nhiên” để hệ thống tạo câu hỏi.'
      );
      setSaving(false);
      return;
    }

    const payload: QuestionTemplateRequest = {
      name: validation.result.normalizedName,
      description: description.trim() || undefined,
      // ✅ NEW: Include academic context (Template owns chapter)
      gradeLevel: gradeLevel || undefined,
      subjectId: selectedSubjectId || undefined,
      chapterId: selectedChapterId || undefined,
      templateType: templateType,
      templateText: { vi: validation.result.normalizedTemplateText },
      parameters: mappedParameters,
      answerFormula: validation.result.normalizedAnswerFormula || '',
      optionsGenerator: Object.keys(mappedOptions).length ? mappedOptions : undefined,
      cognitiveLevel,
      tags: validation.result.normalizedTags,
      isPublic,
      questionBankId: initialData?.questionBankId ?? null,
      diagramTemplate: mappedDiagramTemplate,
    };

    try {
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
            <div className="form-grid">
              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Tên mẫu
                </p>
                <input
                  ref={nameRef}
                  className="input"
                  required
                  value={name}
                  onFocus={() => setActiveMathField({ kind: 'name' })}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>

              {/* ✅ NEW: Grade→Subject→Chapter Cascade Selector */}
              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Khối lớp
                </p>
                <select
                  className="select"
                  value={gradeLevel}
                  onChange={(event) => {
                    const newGrade = event.target.value;
                    setGradeLevel(newGrade);
                    setSelectedSubjectId('');
                    setSelectedChapterId('');
                  }}
                  disabled={isLoadingGrades}
                >
                  <option value="">Chọn khối lớp</option>
                  {sortedGrades.map((grade) => (
                    <option key={grade.id} value={String(grade.level)}>
                      {grade.name || `Lớp ${grade.level}`}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Môn học
                </p>
                <select
                  className="select"
                  value={selectedSubjectId}
                  onChange={(event) => {
                    setSelectedSubjectId(event.target.value);
                    setSelectedChapterId('');
                  }}
                  disabled={isLoadingSubjects || !gradeLevel}
                >
                  {!gradeLevel ? (
                    <option value="">Chọn khối lớp trước</option>
                  ) : isLoadingSubjects ? (
                    <option value="">Đang tải môn học...</option>
                  ) : subjects.length === 0 ? (
                    <option value="">Không có môn học cho khối này</option>
                  ) : (
                    <>
                      <option value="">Chọn môn học</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </label>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Chương học
                </p>
                <select
                  className="select"
                  value={selectedChapterId}
                  onChange={(event) => setSelectedChapterId(event.target.value)}
                  disabled={isLoadingChapters || !selectedSubjectId}
                >
                  {!selectedSubjectId ? (
                    <option value="">Chọn môn học trước</option>
                  ) : isLoadingChapters ? (
                    <option value="">Đang tải chương...</option>
                  ) : chapters.length === 0 ? (
                    <option value="">Không có chương cho môn này</option>
                  ) : (
                    <>
                      <option value="">Chọn chương học</option>
                      {chapters.map((chapter) => (
                        <option key={chapter.id} value={chapter.id}>
                          {chapter.title || chapter.name || chapter.id}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </label>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Loại câu hỏi
                </p>
                <select
                  className="select"
                  value={templateType}
                  onChange={(event) => setTemplateType(event.target.value as QuestionType)}
                  disabled={mode === 'edit'}
                >
                  <option value={QuestionType.MULTIPLE_CHOICE}>Trắc nghiệm (MCQ)</option>
                  <option value={QuestionType.TRUE_FALSE}>Đúng/Sai (TF)</option>
                  <option value={QuestionType.SHORT_ANSWER}>Trả lời ngắn (SA)</option>
                </select>
                {mode === 'edit' && (
                  <p className="muted" style={{ marginTop: 4, fontSize: '0.75rem' }}>
                    Loại câu hỏi không thể thay đổi sau khi tạo
                  </p>
                )}
              </label>

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

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>
                  Tags <span style={{ color: '#ef4444' }}>*</span>
                  <span style={{ fontSize: '0.8rem', marginLeft: 8, fontWeight: 400 }}>
                    (Chọn 1-5 tags)
                  </span>
                </p>
                
                {/* Selected Tags Display */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  minHeight: '40px',
                  padding: '8px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  background: '#f9fafb',
                  marginBottom: '8px'
                }}>
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 8px',
                        background: '#6366f1',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: 500
                      }}
                    >
                      {questionTagLabels[tag]}
                      <button
                        type="button"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          background: 'transparent',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          opacity: 0.8
                        }}
                        onClick={() => setTags(tags.filter((t) => t !== tag))}
                        onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseOut={(e) => e.currentTarget.style.opacity = '0.8'}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                  {tags.length === 0 && (
                    <span style={{
                      color: '#9ca3af',
                      fontSize: '14px',
                      fontStyle: 'italic'
                    }}>
                      Chọn tags từ dropdown bên dưới
                    </span>
                  )}
                </div>

                {/* Dropdown to Add Tags */}
                <select
                  className="select"
                  value=""
                  onChange={(e) => {
                    const selectedTag = e.target.value as QuestionTag;
                    if (selectedTag && !tags.includes(selectedTag)) {
                      if (tags.length < 5) {
                        setTags([...tags, selectedTag]);
                      } else {
                        alert('Bạn chỉ có thể chọn tối đa 5 tags');
                      }
                    }
                  }}
                  disabled={tags.length >= 5}
                >
                  <option value="">
                    {tags.length >= 5 ? 'Đã chọn tối đa 5 tags' : 'Chọn tag để thêm...'}
                  </option>
                  
                  <optgroup label="Đại số">
                    {[
                      QuestionTag.LINEAR_EQUATIONS,
                      QuestionTag.QUADRATIC_EQUATIONS,
                      QuestionTag.POLYNOMIALS,
                      QuestionTag.SYSTEMS_OF_EQUATIONS,
                      QuestionTag.INEQUALITIES,
                      QuestionTag.FUNCTIONS,
                      QuestionTag.SEQUENCES_SERIES,
                    ]
                      .filter(tag => !tags.includes(tag))
                      .map(tag => (
                        <option key={tag} value={tag}>
                          {questionTagLabels[tag]}
                        </option>
                      ))}
                  </optgroup>
                  
                  <optgroup label="Hình học">
                    {[
                      QuestionTag.TRIANGLES,
                      QuestionTag.CIRCLES,
                      QuestionTag.POLYGONS,
                      QuestionTag.SOLID_GEOMETRY,
                      QuestionTag.COORDINATE_GEOMETRY,
                      QuestionTag.TRANSFORMATIONS,
                      QuestionTag.VECTORS,
                      QuestionTag.AREA_PERIMETER,
                    ]
                      .filter(tag => !tags.includes(tag))
                      .map(tag => (
                        <option key={tag} value={tag}>
                          {questionTagLabels[tag]}
                        </option>
                      ))}
                  </optgroup>
                  
                  <optgroup label="Giải tích">
                    {[
                      QuestionTag.LIMITS,
                      QuestionTag.DERIVATIVES,
                      QuestionTag.INTEGRALS,
                      QuestionTag.DIFFERENTIAL_EQUATIONS,
                      QuestionTag.SERIES_CONVERGENCE,
                    ]
                      .filter(tag => !tags.includes(tag))
                      .map(tag => (
                        <option key={tag} value={tag}>
                          {questionTagLabels[tag]}
                        </option>
                      ))}
                  </optgroup>
                  
                  <optgroup label="Thống kê & Xác suất">
                    {[
                      QuestionTag.DESCRIPTIVE_STATISTICS,
                      QuestionTag.PROBABILITY,
                      QuestionTag.DISTRIBUTIONS,
                      QuestionTag.HYPOTHESIS_TESTING,
                    ]
                      .filter(tag => !tags.includes(tag))
                      .map(tag => (
                        <option key={tag} value={tag}>
                          {questionTagLabels[tag]}
                        </option>
                      ))}
                  </optgroup>
                  
                  <optgroup label="Lượng giác">
                    {[
                      QuestionTag.TRIGONOMETRIC_FUNCTIONS,
                      QuestionTag.TRIGONOMETRIC_IDENTITIES,
                      QuestionTag.INVERSE_TRIG,
                    ]
                      .filter(tag => !tags.includes(tag))
                      .map(tag => (
                        <option key={tag} value={tag}>
                          {questionTagLabels[tag]}
                        </option>
                      ))}
                  </optgroup>
                  
                  <optgroup label="Số học">
                    {[
                      QuestionTag.PRIME_NUMBERS,
                      QuestionTag.DIVISIBILITY,
                      QuestionTag.MODULAR_ARITHMETIC,
                      QuestionTag.GCD_LCM,
                    ]
                      .filter(tag => !tags.includes(tag))
                      .map(tag => (
                        <option key={tag} value={tag}>
                          {questionTagLabels[tag]}
                        </option>
                      ))}
                  </optgroup>
                  
                  <optgroup label="Tổ hợp">
                    {[
                      QuestionTag.PERMUTATIONS,
                      QuestionTag.COMBINATIONS,
                      QuestionTag.COUNTING_PRINCIPLES,
                    ]
                      .filter(tag => !tags.includes(tag))
                      .map(tag => (
                        <option key={tag} value={tag}>
                          {questionTagLabels[tag]}
                        </option>
                      ))}
                  </optgroup>
                  
                  <optgroup label="Logic & Tập hợp">
                    {[
                      QuestionTag.SET_THEORY,
                      QuestionTag.LOGIC,
                      QuestionTag.PROOF_TECHNIQUES,
                    ]
                      .filter(tag => !tags.includes(tag))
                      .map(tag => (
                        <option key={tag} value={tag}>
                          {questionTagLabels[tag]}
                        </option>
                      ))}
                  </optgroup>
                  
                  <optgroup label="Toán ứng dụng">
                    {[
                      QuestionTag.OPTIMIZATION,
                      QuestionTag.LINEAR_PROGRAMMING,
                      QuestionTag.MATRICES,
                      QuestionTag.GRAPH_THEORY,
                    ]
                      .filter(tag => !tags.includes(tag))
                      .map(tag => (
                        <option key={tag} value={tag}>
                          {questionTagLabels[tag]}
                        </option>
                      ))}
                  </optgroup>
                  
                  <optgroup label="Khác">
                    {[
                      QuestionTag.WORD_PROBLEMS,
                      QuestionTag.PROBLEM_SOLVING,
                      QuestionTag.MATHEMATICAL_REASONING,
                    ]
                      .filter(tag => !tags.includes(tag))
                      .map(tag => (
                        <option key={tag} value={tag}>
                          {questionTagLabels[tag]}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </label>
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
                onFocus={() => setActiveMathField({ kind: 'description' })}
                onChange={(event) => setDescription(event.target.value)}
              />
              {description && (
                <div className="preview-box">
                  <MathText text={description} />
                </div>
              )}
            </label>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>
                Nội dung câu hỏi{' '}
                <span style={{ fontSize: '0.8rem', marginLeft: 8, fontWeight: 400 }}>
                  (Dùng {'{{a}}'}, {'{{b}}'} để chèn biến số. Ví dụ: "Giải: x + {'{{a}}'} ={' '}
                  {'{{b}}'}")
                </span>
              </p>
              <textarea
                ref={templateTextRef}
                className="textarea"
                rows={3}
                required
                placeholder="Ví dụ: Tính giá trị của biểu thức {{a}} + {{b}}?"
                value={templateText}
                onFocus={() => setActiveMathField({ kind: 'templateText' })}
                onChange={(event) => setTemplateText(event.target.value)}
              />
              <p className="muted" style={{ marginTop: 6, fontSize: '0.78rem' }}>
                Dùng {'{{a}}'} để tạo biến động. Bôi đen nội dung cần công thức rồi bấm Insert Math.
              </p>
              {templateText && (
                <div className="preview-box">
                  <MathText text={templateText} />
                </div>
              )}
            </label>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>
                Công thức tính đáp án đúng
              </p>
              <input
                ref={answerFormulaRef}
                className="input"
                placeholder="Ví dụ: (-{{b}})/{{a}}) — dùng {{tên_biến}} cho tham số"
                value={answerFormula}
                onFocus={() => setActiveMathField({ kind: 'answerFormula' })}
                onChange={(event) => setAnswerFormula(event.target.value)}
              />
              <p className="muted" style={{ marginTop: 6, fontSize: '0.78rem' }}>
                Dùng <code>{'{{tên_biến}}'}</code> cho tham số (ví dụ: <code>{'(-{{b}})/{{a}})'}</code>). Biến phải khớp với tên đã khai báo ở trước.
              </p>
              {answerFormula && (
                <div className="preview-box">
                  <MathText text={answerFormula} />
                </div>
              )}
            </label>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>
                Sơ đồ / Hình vẽ đính kèm (LaTeX, tùy chọn)
              </p>
              <textarea
                ref={diagramTemplateRef}
                className="textarea"
                rows={4}
                value={diagramTemplateRaw}
                onFocus={() => setActiveMathField({ kind: 'diagramTemplateRaw' })}
                onChange={(event) => setDiagramTemplateRaw(event.target.value)}
                placeholder="Vi du: \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}"
              />
            </label>

            <section className="data-card" style={{ minHeight: 0, border: '1px solid #dbeafe' }}>
              <div className="row">
                <div>
                  <h3 style={{ color: '#1e40af' }}>Biến số ngẫu nhiên</h3>
                  <p className="muted" style={{ fontSize: '0.8rem' }}>
                    Khai báo các chữ cái sẽ được thay bằng số ngẫu nhiên trong từng câu hỏi.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() =>
                    setParameters((prev) => [
                      ...prev,
                      { name: '', type: 'int', min: '1', max: '10', constraint: '' },
                    ])
                  }
                >
                  <Plus size={14} />
                  Thêm biến
                </button>
              </div>

              {parameters.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="form-grid"
                  style={{
                    gridTemplateColumns: '1fr 0.8fr 1fr 1fr 1.6fr 40px',
                    alignItems: 'center',
                  }}
                >
                  <input
                    ref={(node) => {
                      parameterNameRefs.current[index] = node;
                    }}
                    className="input"
                    placeholder="Tên (a, b...)"
                    value={item.name}
                    onFocus={() => setActiveMathField({ kind: 'parameterName', index })}
                    onChange={(event) => {
                      const next = [...parameters];
                      next[index] = { ...next[index], name: event.target.value };
                      setParameters(next);
                    }}
                  />
                  <select
                    className="select"
                    value={item.type}
                    onChange={(event) => {
                      const next = [...parameters];
                      next[index] = { ...next[index], type: event.target.value };
                      setParameters(next);
                    }}
                  >
                    <option value="int">Số nguyên</option>
                    <option value="float">Số thập phân</option>
                  </select>
                  <div className="row">
                    <span className="muted">Từ:</span>
                    <input
                      ref={(node) => {
                        parameterMinRefs.current[index] = node;
                      }}
                      className="input"
                      type="number"
                      value={item.min}
                      onFocus={() => setActiveMathField({ kind: 'parameterMin', index })}
                      onChange={(event) => {
                        const next = [...parameters];
                        next[index] = { ...next[index], min: event.target.value };
                        setParameters(next);
                      }}
                    />
                  </div>
                  <div className="row">
                    <span className="muted">Đến:</span>
                    <input
                      ref={(node) => {
                        parameterMaxRefs.current[index] = node;
                      }}
                      className="input"
                      type="number"
                      value={item.max}
                      onFocus={() => setActiveMathField({ kind: 'parameterMax', index })}
                      onChange={(event) => {
                        const next = [...parameters];
                        next[index] = { ...next[index], max: event.target.value };
                        setParameters(next);
                      }}
                    />
                  </div>
                  <input
                    ref={(node) => {
                      parameterConstraintRefs.current[index] = node;
                    }}
                    className="input"
                    placeholder="Constraint (vd: a != 0)"
                    value={item.constraint}
                    onFocus={() => setActiveMathField({ kind: 'parameterConstraint', index })}
                    onChange={(event) => {
                      const next = [...parameters];
                      next[index] = { ...next[index], constraint: event.target.value };
                      setParameters(next);
                    }}
                  />
                  <button
                    type="button"
                    className="btn danger"
                    style={{
                      padding: '0.4rem',
                      height: '38px',
                      width: '38px',
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                    onClick={() => removeParameterAt(index)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </section>

            {/* Type-Specific Sections */}
            {templateType === QuestionType.MULTIPLE_CHOICE && (
              <section className="data-card" style={{ minHeight: 0, border: '1px solid #fef3c7' }}>
                <div className="row">
                  <div>
                    <h3 style={{ color: '#92400e' }}>Phương án trắc nghiệm (tùy chọn)</h3>
                    <p className="muted" style={{ fontSize: '0.8rem' }}>
                      Viết công thức để máy tính tự tính ra kết quả cho các lựa chọn A, B, C, D.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => setOptions((prev) => [...prev, { key: '', formula: '' }])}
                  >
                    <Plus size={14} />
                    Thêm lựa chọn
                  </button>
                </div>

                {options.map((item, index) => (
                  <div key={`${item.key}-${index}`} className="form-grid">
                    <input
                      ref={(node) => {
                        optionKeyRefs.current[index] = node;
                      }}
                      className="input"
                      placeholder="Mã (A, B...)"
                      value={item.key}
                      onFocus={() => setActiveMathField({ kind: 'optionKey', index })}
                      onChange={(event) => {
                        const next = [...options];
                        next[index] = { ...next[index], key: event.target.value };
                        setOptions(next);
                      }}
                    />
                    <div className="row" style={{ gridColumn: 'span 3' }}>
                      <div style={{ width: '100%' }}>
                        <input
                          ref={(node) => {
                            optionFormulaRefs.current[index] = node;
                          }}
                          className="input"
                          style={{ width: '100%' }}
                          placeholder="Công thức"
                          value={item.formula}
                          onFocus={() => setActiveMathField({ kind: 'optionFormula', index })}
                          onChange={(event) => {
                            const next = [...options];
                            next[index] = { ...next[index], formula: event.target.value };
                            setOptions(next);
                          }}
                        />
                        {item.formula && (
                          <div className="preview-box">
                            <MathText text={item.formula} />
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn danger"
                        onClick={() => removeOptionAt(index)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {templateType === QuestionType.TRUE_FALSE && (
              <section className="data-card" style={{ minHeight: 0, border: '1px solid #dbeafe' }}>
                <div>
                  <h3 style={{ color: '#1e40af' }}>Cấu hình mệnh đề Đúng/Sai</h3>
                  <p className="muted" style={{ fontSize: '0.8rem', marginBottom: 16 }}>
                    Câu hỏi TRUE_FALSE có 4 mệnh đề (A, B, C, D). Mỗi mệnh đề có thể thuộc chương và mức độ khác nhau.
                  </p>
                </div>
                <div style={{ 
                  padding: '12px 16px', 
                  backgroundColor: '#fef3c7', 
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: '0.875rem'
                }}>
                  <strong>Lưu ý:</strong> Template TRUE_FALSE sẽ tạo câu hỏi với 4 mệnh đề. Học sinh chọn Đúng/Sai cho từng mệnh đề. 
                  Điểm được tính theo quy tắc THPT: 4/4 đúng = 1 điểm, 3/4 đúng = 0.25 điểm.
                </div>
                <p className="muted" style={{ fontSize: '0.875rem', fontStyle: 'italic' }}>
                  💡 Để tạo template TRUE_FALSE, bạn cần định nghĩa cách sinh ra 4 mệnh đề từ các biến số. 
                  Hiện tại hệ thống chưa hỗ trợ UI chi tiết cho TF template - vui lòng sử dụng MCQ hoặc SA.
                </p>
              </section>
            )}

            {templateType === QuestionType.SHORT_ANSWER && (
              <section className="data-card" style={{ minHeight: 0, border: '1px solid #dcfce7' }}>
                <div>
                  <h3 style={{ color: '#166534' }}>Cấu hình trả lời ngắn</h3>
                  <p className="muted" style={{ fontSize: '0.8rem', marginBottom: 16 }}>
                    Câu hỏi SHORT_ANSWER yêu cầu học sinh nhập đáp án dạng text hoặc số.
                  </p>
                </div>
                <div style={{ 
                  padding: '12px 16px', 
                  backgroundColor: '#dbeafe', 
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: '0.875rem'
                }}>
                  <strong>Chế độ đánh giá:</strong>
                  <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                    <li><strong>EXACT:</strong> So sánh chuỗi chính xác (phân biệt hoa/thường)</li>
                    <li><strong>NUMERIC:</strong> So sánh số với sai số cho phép (ví dụ: ±0.01)</li>
                    <li><strong>REGEX:</strong> Kiểm tra theo biểu thức chính quy</li>
                  </ul>
                </div>
                <p className="muted" style={{ fontSize: '0.875rem', fontStyle: 'italic' }}>
                  💡 Công thức đáp án (answerFormula) sẽ được dùng làm đáp án đúng. 
                  Chế độ đánh giá mặc định là EXACT - có thể cấu hình sau khi tạo câu hỏi.
                </p>
              </section>
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

          <div
            style={{
              position: 'sticky',
              bottom: 0,
              zIndex: 2,
              marginTop: '0.5rem',
              borderTop: '1px solid #e2e8f0',
              background: '#ffffff',
              padding: '0.75rem 1rem',
            }}
          >
            <div className="row" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn secondary"
                onMouseDown={keepFocusOnToolbarClick}
                onClick={handleInsertMath}
              >
                Chèn công thức $$
              </button>
              {mathSnippets.map((entry) => (
                <button
                  key={entry.label}
                  type="button"
                  className="btn secondary"
                  style={{ padding: '0.35rem 0.55rem' }}
                  onMouseDown={keepFocusOnToolbarClick}
                  onClick={() => applyInsertAtCursor(entry.snippet, entry.caretOffset)}
                >
                  {entry.label}
                </button>
              ))}
            </div>
            <p className="muted" style={{ marginTop: 8, marginBottom: 0, fontSize: '0.8rem' }}>
              Focus vào ô cần nhập, sau đó bấm nút phía trên để chèn công thức đúng vị trí con trỏ.
            </p>
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
                  <AlertTriangle size={16} color="#dc2626" />
                  <strong style={{ color: '#7f1d1d' }}>Lỗi phổ biến cần tránh</strong>
                </div>
                <p style={{ margin: '0.55rem 0 0', color: '#7f1d1d' }}>
                  ❌ Quên {'{{}}'} nên biến không render
                </p>
                <p style={{ margin: '0.35rem 0 0', color: '#7f1d1d' }}>
                  ❌ Sai LaTeX gây lỗi hiển thị công thức
                </p>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
