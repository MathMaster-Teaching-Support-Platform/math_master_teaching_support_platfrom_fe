import { Plus, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  CognitiveLevel,
  QuestionType,
  type QuestionTemplateRequest,
  type QuestionTemplateResponse,
} from '../../types/questionTemplate';
import MathText from '../../components/common/MathText';

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
  normalizedTags: string[];
};

type ActiveMathField =
  | { kind: 'name' }
  | { kind: 'description' }
  | { kind: 'tags' }
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
  tags: string;
}): { error?: string; result?: ValidationResult } {
  const normalizedName = input.name.trim();
  if (!normalizedName) return { error: 'Tên mẫu là bắt buộc.' };
  if (normalizedName.length > 255) return { error: 'Tên mẫu không được vượt quá 255 ký tự.' };

  const normalizedTemplateText = input.templateText.trim();
  if (!normalizedTemplateText) return { error: 'Nội dung template là bắt buộc.' };

  const normalizedAnswerFormula = input.answerFormula.trim();

  const normalizedTags = input.tags
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (normalizedTags.length === 0) {
    return { error: 'Bạn cần nhập ít nhất một tag cho template.' };
  }

  return {
    result: {
      normalizedName,
      normalizedTemplateText,
      normalizedAnswerFormula: normalizedAnswerFormula || undefined,
      normalizedTags,
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
    mappedOptions[option.key.trim()] = option.formula.trim();
  }
  return mappedOptions;
}

const cognitiveLevelLabels: Record<CognitiveLevel, string> = {
  NHAN_BIET: '1. Nhận biết',
  THONG_HIEU: '2. Thông hiểu',
  VAN_DUNG: '3. Vận dụng',
  VAN_DUNG_CAO: '4. Vận dụng cao',
  REMEMBER: '1. Nhận biết',
  UNDERSTAND: '2. Thông hiểu',
  APPLY: '3. Vận dụng',
  ANALYZE: '5. Phân tích',
  EVALUATE: '6. Đánh giá',
  CREATE: '7. Sáng tạo',
};

const questionTypeLabels: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'Trắc nghiệm (Nhiều lựa chọn)',
  TRUE_FALSE: 'Đúng / Sai',
  SHORT_ANSWER: 'Trả lời ngắn (Tự điền kết quả)',
  ESSAY: 'Tự luận',
  CODING: 'Lập trình',
};

export function TemplateFormModal({ isOpen, mode, initialData, onClose, onSubmit }: Readonly<Props>) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateType, setTemplateType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
  const [cognitiveLevel, setCognitiveLevel] = useState<CognitiveLevel>(CognitiveLevel.THONG_HIEU);
  const [isPublic, setIsPublic] = useState(false);
  const [templateText, setTemplateText] = useState('');
  const [answerFormula, setAnswerFormula] = useState('');
  const [tags, setTags] = useState('');
  const [parameters, setParameters] = useState<ParameterInput[]>([]);
  const [options, setOptions] = useState<OptionInput[]>([]);
  const [diagramTemplateRaw, setDiagramTemplateRaw] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeMathField, setActiveMathField] = useState<ActiveMathField>({ kind: 'templateText' });
  const nameRef = useRef<HTMLInputElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const tagsRef = useRef<HTMLInputElement | null>(null);
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
    if (!isOpen) return;

    if (mode === 'edit' && initialData) {
      setSubmitError(null);
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setTemplateType(initialData.templateType || QuestionType.MULTIPLE_CHOICE);
      setCognitiveLevel(initialData.cognitiveLevel || CognitiveLevel.THONG_HIEU);
      setIsPublic(initialData.isPublic ?? false);
      setTemplateText(parseTemplateText(initialData.templateText));
      setAnswerFormula(initialData.answerFormula || '');
      setTags((initialData.tags || []).join(', '));
      if (typeof initialData.diagramTemplate === 'string') {
        setDiagramTemplateRaw(initialData.diagramTemplate);
      } else {
        setDiagramTemplateRaw(
          initialData.diagramTemplate ? JSON.stringify(initialData.diagramTemplate, null, 2) : ''
        );
      }

      const mappedParameters: ParameterInput[] = Object.entries(initialData.parameters || {}).map(([key, raw]) => {
        const item = raw as { type?: string; min?: number; max?: number; constraint?: string };
        return {
          name: key,
          type: item.type || 'int',
          min: item.min?.toString() || '1',
          max: item.max?.toString() || '10',
          constraint: item.constraint || '',
        };
      });

      const mappedOptions: OptionInput[] = Object.entries(initialData.optionsGenerator || {}).map(([key, raw]) => ({
        key,
        formula: typeof raw === 'string' ? raw : '',
      }));

      setParameters(mappedParameters.length ? mappedParameters : [{ name: 'a', type: 'int', min: '1', max: '10', constraint: '' }]);
      setOptions(mappedOptions.length ? mappedOptions : [{ key: 'A', formula: '' }, { key: 'B', formula: '' }]);
      return;
    }

    setName('');
    setSubmitError(null);
    setDescription('');
    setTemplateType(QuestionType.MULTIPLE_CHOICE);
    setCognitiveLevel(CognitiveLevel.THONG_HIEU);
    setIsPublic(false);
    setTemplateText('Giải phương trình: {{a}}x + {{b}} = 0');
    setAnswerFormula('(-b)/a');
    setTags('đại số, lớp 9');
    setDiagramTemplateRaw('');
    setParameters([
      { name: 'a', type: 'int', min: '1', max: '10', constraint: '' },
      { name: 'b', type: 'int', min: '-10', max: '10', constraint: '' },
    ]);
    setOptions([
      { key: 'A', formula: '(-b)/a' },
      { key: 'B', formula: 'b/a' },
      { key: 'C', formula: '-a/b' },
      { key: 'D', formula: 'a+b' },
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
    setOptions((prev) => prev.map((entry, idx) => (idx === optionIndex ? { ...entry, formula: nextValue } : entry)));
  };

  const setOptionKeyAt = (optionIndex: number, nextValue: string) => {
    setOptions((prev) => prev.map((entry, idx) => (idx === optionIndex ? { ...entry, key: nextValue } : entry)));
  };

  const setParameterFieldAt = (
    parameterIndex: number,
    field: 'name' | 'min' | 'max' | 'constraint',
    nextValue: string
  ) => {
    setParameters((prev) => prev.map((entry, idx) => (idx === parameterIndex ? { ...entry, [field]: nextValue } : entry)));
  };

  const getStaticFieldContext = (): ActiveFieldContext | null => {
    switch (activeMathField.kind) {
      case 'name':
        return { value: name, setValue: setName, element: nameRef.current };
      case 'description':
        return { value: description, setValue: setDescription, element: descriptionRef.current };
      case 'tags':
        return { value: tags, setValue: setTags, element: tagsRef.current };
      case 'templateText':
        return { value: templateText, setValue: setTemplateText, element: templateTextRef.current };
      case 'answerFormula':
        return { value: answerFormula, setValue: setAnswerFormula, element: answerFormulaRef.current };
      case 'diagramTemplateRaw':
        return { value: diagramTemplateRaw, setValue: setDiagramTemplateRaw, element: diagramTemplateRef.current };
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
      setSubmitError('Bạn cần khai báo ít nhất một tham số trong mục parameters.');
      setSaving(false);
      return;
    }

    const payload: QuestionTemplateRequest = {
      name: validation.result.normalizedName,
      description: description.trim() || undefined,
      templateType,
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
      setSubmitError(error instanceof Error ? error.message : 'Không thể lưu mẫu câu hỏi. Vui lòng thử lại.');
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
            <p className="muted" style={{ marginTop: 4 }}>Cấu hình logic tạo câu hỏi tự động.</p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-grid">
              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Tên mẫu</p>
                <input
                  ref={nameRef}
                  className="input"
                  required
                  value={name}
                  onFocus={() => setActiveMathField({ kind: 'name' })}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Loại câu hỏi</p>
                <select className="select" value={templateType} onChange={(event) => setTemplateType(event.target.value as QuestionType)}>
                  {Object.entries(questionTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </label>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Mức độ nhận thức</p>
                <select
                  className="select"
                  value={cognitiveLevel}
                  onChange={(event) => setCognitiveLevel(event.target.value as CognitiveLevel)}
                >
                  {Object.entries(cognitiveLevelLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </label>

              <label>
                <p className="muted" style={{ marginBottom: 6 }}>Từ khóa</p>
                <input
                  ref={tagsRef}
                  className="input"
                  value={tags}
                  onFocus={() => setActiveMathField({ kind: 'tags' })}
                  onChange={(event) => setTags(event.target.value)}
                />
              </label>
            </div>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>Mô tả</p>
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
                  (Dùng {"{{a}}"}, {"{{b}}"} để chèn biến số. Ví dụ: "Giải: x + {"{{a}}"} = {"{{b}}"}")
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
              {templateText && (
                <div className="preview-box">
                  <MathText text={templateText} />
                </div>
              )}
            </label>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>Công thức tính đáp án đúng</p>
              <input
                ref={answerFormulaRef}
                className="input"
                placeholder="Ví dụ: a + b"
                value={answerFormula}
                onFocus={() => setActiveMathField({ kind: 'answerFormula' })}
                onChange={(event) => setAnswerFormula(event.target.value)}
              />
              {answerFormula && (
                <div className="preview-box">
                  <MathText text={answerFormula} />
                </div>
              )}
            </label>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>Diagram Template (LaTeX text)</p>
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
                  <h3 style={{ color: '#1e40af' }}>1. Khai báo biến số ngẫu nhiên</h3>
                  <p className="muted" style={{ fontSize: '0.8rem' }}>Định nghĩa các chữ cái sẽ thay đổi thành số ngẫu nhiên trong câu hỏi.</p>
                </div>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setParameters((prev) => [...prev, { name: '', type: 'int', min: '1', max: '10', constraint: '' }])}
                >
                  <Plus size={14} />
                  Thêm biến
                </button>
              </div>

              {parameters.map((item, index) => (
                <div key={`${item.name}-${index}`} className="form-grid" style={{ gridTemplateColumns: '1fr 0.8fr 1fr 1fr 1.6fr 40px', alignItems: 'center' }}>
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
                    style={{ padding: '0.4rem', height: '38px', width: '38px', display: 'flex', justifyContent: 'center' }}
                    onClick={() => removeParameterAt(index)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </section>

            <section className="data-card" style={{ minHeight: 0, border: '1px solid #fef3c7' }}>
              <div className="row">
                <div>
                  <h3 style={{ color: '#92400e' }}>2. Cách tính các phương án (Trắc nghiệm)</h3>
                  <p className="muted" style={{ fontSize: '0.8rem' }}>Viết công thức để máy tính tự tính ra kết quả cho các lựa chọn A, B, C, D.</p>
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

            <label className="row" style={{ justifyContent: 'start' }}>
              <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} />{' '}
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
                Insert Math
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
              Thanh cong cu sticky: focus vao o can nhap, sau do bam nut de chen cong thuc vao dung vi tri con tro.
            </p>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn" disabled={saving}>
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
