import { HelpCircle, SlidersHorizontal } from 'lucide-react';
import ModalCloseButton from '../../components/common/ModalCloseButton';
import { useEffect, useRef, useState } from 'react';
import { AcademicCascade } from '../../components/common/AcademicCascade';
import { LatexToolbar } from '../../components/common/LatexToolbar';
import { AIExtractPanel } from '../../components/question-templates/AIExtractPanel';
import {
  MCQBlueprint,
  type MCQBlueprintRef,
} from '../../components/question-templates/MCQBlueprint';
import { SABlueprint, type SABlueprintRef } from '../../components/question-templates/SABlueprint';
import { TFBlueprint, type TFBlueprintRef } from '../../components/question-templates/TFBlueprint';
import { TypeSelector } from '../../components/question-templates/TypeSelector';
import {
  CognitiveLevel,
  QuestionType,
  type QuestionTemplateRequest,
  type QuestionTemplateResponse,
} from '../../types/questionTemplate';

type Props = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: QuestionTemplateResponse | null;
  onClose: () => void;
  onSubmit: (data: QuestionTemplateRequest) => Promise<void>;
};

type ValidationResult = {
  normalizedName: string;
};

// Local copy of the unified parameter shape — matches ParametersEditor.
type ParameterInput = {
  name: string;
  constraintText: string;
  sampleValue: string;
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

function validateFormInput(input: { name: string }): {
  error?: string;
  result?: ValidationResult;
} {
  const normalizedName = input.name.trim();
  if (!normalizedName) return { error: 'Tên mẫu là bắt buộc.' };
  if (normalizedName.length > 255) return { error: 'Tên mẫu không được vượt quá 255 ký tự.' };

  return {
    result: {
      normalizedName,
    },
  };
}

function tokensIn(text: string): string[] {
  const set = new Set<string>();
  const re = /\{\{\s*([\p{L}\p{N}_]+)\s*\}\}/gu;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) set.add(match[1]);
  return [...set];
}

const STEP_LABELS = ['Thông tin chung', 'Đề bài & hệ số', 'Phương án', 'Lời giải & xem trước'];

function FormStepper({
  current,
  onJump,
}: Readonly<{ current: 1 | 2 | 3 | 4; onJump: (step: 1 | 2 | 3 | 4) => void }>) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        marginBottom: 16,
        padding: '8px 0',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      {STEP_LABELS.map((label, idx) => {
        const stepNum = (idx + 1) as 1 | 2 | 3 | 4;
        const isActive = stepNum === current;
        const isPast = stepNum < current;
        const clickable = isPast;
        return (
          <button
            key={label}
            type="button"
            disabled={!clickable}
            onClick={() => clickable && onJump(stepNum)}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: 8,
              border: isActive ? '2px solid #6366f1' : '1px solid #e5e7eb',
              background: isActive ? '#eef2ff' : isPast ? '#f8fafc' : '#ffffff',
              cursor: clickable ? 'pointer' : 'default',
              textAlign: 'left',
              opacity: !isActive && !isPast ? 0.6 : 1,
            }}
          >
            <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 600 }}>
              Bước {stepNum}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{label}</div>
          </button>
        );
      })}
    </div>
  );
}

function buildParameters(parameters: ParameterInput[]): Record<string, unknown> {
  // Unified Blueprint shape — matches BE BlueprintParameter / V112 migration.
  const mapped: Record<string, unknown> = {};
  for (const item of parameters) {
    const name = item.name.trim();
    if (!name) continue;
    const constraint = item.constraintText.trim();
    const rawSample = item.sampleValue.trim();
    let sample: unknown = rawSample;
    if (rawSample !== '' && !Number.isNaN(Number(rawSample))) {
      sample = Number(rawSample);
    }
    mapped[name] = {
      constraintText: constraint,
      sampleValue: sample === '' ? null : sample,
      occurrences: [],
    };
  }
  return mapped;
}

function buildOptions(options: OptionInput[]): Record<string, unknown> {
  const mappedOptions: Record<string, unknown> = {};
  for (const option of options) {
    if (!option.key.trim() || !option.formula.trim()) continue;
    const formula = option.formula.trim();
    const wrappedFormula =
      formula.startsWith('$') && formula.endsWith('$') ? formula : `$${formula}$`;
    mappedOptions[option.key.trim()] = wrappedFormula;
  }
  return mappedOptions;
}

function extractBlueprintInitialData(
  data: QuestionTemplateResponse | null | undefined,
  type: QuestionType
) {
  if (!data) return undefined;

  const templateTextStr =
    typeof data.templateText === 'object' && data.templateText?.vi
      ? String(data.templateText.vi)
      : '';

  const params: ParameterInput[] = data.parameters
    ? Object.entries(data.parameters).map(([name, val]) => {
        const v = (val ?? {}) as Record<string, unknown>;
        // Unified shape preferred; fall back to legacy {type,min,max} for old rows.
        const constraintText =
          typeof v.constraintText === 'string'
            ? v.constraintText
            : `${v.type ?? 'integer'}${
                v.min !== undefined ? `, ${v.min} ≤ ${name}` : ''
              }${v.max !== undefined ? ` ≤ ${v.max}` : ''}`;
        const sample =
          v.sampleValue !== undefined ? v.sampleValue : v.min !== undefined ? v.min : '';
        return {
          name,
          constraintText: String(constraintText),
          sampleValue: String(sample ?? ''),
        };
      })
    : [];
  const globalConstraints: string[] = Array.isArray(data.constraints)
    ? data.constraints.map(String)
    : [];

  const diag = typeof data.diagramTemplate === 'string' ? data.diagramTemplate : '';

  if (type === QuestionType.MULTIPLE_CHOICE) {
    const options = data.optionsGenerator
      ? Object.entries(data.optionsGenerator).map(([key, formula]) => ({
          key,
          formula: String(formula),
        }))
      : [];
    return {
      templateText: templateTextStr,
      parameters: params.length > 0 ? params : undefined,
      globalConstraints,
      answerFormula: data.answerFormula || '',
      options: options.length > 0 ? options : undefined,
      diagramTemplateRaw: diag,
      solutionStepsTemplate: data.solutionStepsTemplate || '',
    };
  }

  if (type === QuestionType.TRUE_FALSE) {
    const sm = data.statementMutations as
      | {
          clauseTemplates?: Array<{
            text: string;
            truthValue: boolean;
          }>;
        }
      | undefined;
    const clauses = sm?.clauseTemplates?.map((c, i) => ({
      key: String.fromCharCode(65 + i),
      text: c.text || '',
      truthValue: c.truthValue ?? true,
    }));
    return {
      stemText: templateTextStr,
      clauses,
      parameters: params.length > 0 ? params : undefined,
      globalConstraints,
      diagramTemplateRaw: diag,
      solutionStepsTemplate: data.solutionStepsTemplate || '',
    };
  }

  if (type === QuestionType.SHORT_ANSWER) {
    return {
      templateText: templateTextStr,
      parameters: params.length > 0 ? params : undefined,
      globalConstraints,
      answerFormula: data.answerFormula || '',
      diagramTemplateRaw: diag,
      solutionStepsTemplate: data.solutionStepsTemplate || '',
    };
  }

  return undefined;
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
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [lastFocusedInput, setLastFocusedInput] = useState<
    HTMLInputElement | HTMLTextAreaElement | null
  >(null);

  // Global focus tracking for LatexToolbar
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        setLastFocusedInput(e.target);
      }
    };
    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, []);

  const insertLatexAtCursor = (latex: string) => {
    if (!lastFocusedInput) {
      setSubmitError('Vui lòng chọn một ô nhập liệu trước khi chèn công thức.');
      return;
    }

    // Wrap symbol with single $...$ so MathText renders it as inline math.
    const wrapped = `$${latex}$`;

    const start = lastFocusedInput.selectionStart ?? 0;
    const end = lastFocusedInput.selectionEnd ?? 0;
    const text = lastFocusedInput.value;
    const before = text.substring(0, start);
    const after = text.substring(end);

    const newText = before + wrapped + after;

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set;

    if (lastFocusedInput instanceof HTMLTextAreaElement && nativeTextAreaValueSetter) {
      nativeTextAreaValueSetter.call(lastFocusedInput, newText);
    } else if (lastFocusedInput instanceof HTMLInputElement && nativeInputValueSetter) {
      nativeInputValueSetter.call(lastFocusedInput, newText);
    }

    lastFocusedInput.dispatchEvent(new Event('input', { bubbles: true }));

    setTimeout(() => {
      lastFocusedInput.focus();
      const newPosition = start + wrapped.length;
      lastFocusedInput.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // Blueprint refs for extracting data
  const mcqBlueprintRef = useRef<MCQBlueprintRef>(null);
  const tfBlueprintRef = useRef<TFBlueprintRef>(null);
  const saBlueprintRef = useRef<SABlueprintRef>(null);

  const nameRef = useRef<HTMLInputElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsGuideOpen(false);
    } else {
      setCurrentStep(1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit' && initialData) {
      setSubmitError(null);
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      // Hydrate the academic cascade from the BE response. Without seeding
      // gradeLevel + subjectId here the cascade renders empty in edit mode and
      // the user can't see (or change) the template's chapter context — that
      // was the bug behind "updating chapter & grade doesn't stick".
      setGradeLevel(initialData.gradeLevel || '');
      setSelectedSubjectId(initialData.subjectId || '');
      setSelectedChapterId(initialData.chapterId || '');
      setTemplateType(initialData.templateType || QuestionType.MULTIPLE_CHOICE);
      setCognitiveLevel(initialData.cognitiveLevel || CognitiveLevel.THONG_HIEU);
      setIsPublic(initialData.isPublic ?? false);
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
  }, [isOpen, initialData, mode]);

  if (!isOpen) return null;

  let submitLabel = 'Cập nhật mẫu';
  if (saving) submitLabel = 'Đang lưu...';
  else if (mode === 'create') submitLabel = 'Tạo mẫu';

  function validateStep1(): string | null {
    const v = validateFormInput({ name });
    if (v.error) return v.error;
    if (mode === 'create') {
      if (!gradeLevel) return 'Vui lòng chọn khối lớp.';
      if (!selectedSubjectId) return 'Vui lòng chọn môn học.';
      if (!selectedChapterId) return 'Vui lòng chọn chương.';
    }
    return null;
  }

  function validateStep2(): string | null {
    if (templateType === QuestionType.TRUE_FALSE) {
      const data = tfBlueprintRef.current?.getData();
      if (!data) return 'Lỗi nội bộ: không đọc được dữ liệu blueprint.';
      if (!data.stemText.trim()) return 'Vui lòng nhập đề bài / mệnh đề chính.';
      const params = (data.parameters ?? []).filter((p) => p.name.trim());
      const declared = new Set(params.map((p) => p.name.trim()));
      for (const p of params) {
        if (!p.sampleValue?.toString().trim())
          return `Hệ số {{${p.name}}} chưa có giá trị mẫu.`;
      }
      const undef = tokensIn(data.stemText).find((t) => !declared.has(t));
      if (undef) return `{{${undef}}} dùng trong đề bài chưa được khai báo trong danh sách hệ số.`;
      return null;
    }
    const data =
      templateType === QuestionType.MULTIPLE_CHOICE
        ? mcqBlueprintRef.current?.getData()
        : saBlueprintRef.current?.getData();
    if (!data) return 'Lỗi nội bộ: không đọc được dữ liệu blueprint.';
    if (!data.templateText.trim()) return 'Vui lòng nhập nội dung câu hỏi.';
    const params = (data.parameters ?? []).filter((p) => p.name.trim());
    if (params.length === 0) return 'Bạn cần khai báo ít nhất một hệ số.';
    for (const p of params) {
      if (!p.sampleValue?.toString().trim())
        return `Hệ số {{${p.name}}} chưa có giá trị mẫu.`;
    }
    const declared = new Set(params.map((p) => p.name.trim()));
    const undef = tokensIn(data.templateText).find((t) => !declared.has(t));
    if (undef) return `{{${undef}}} dùng trong đề bài chưa được khai báo trong danh sách hệ số.`;
    return null;
  }

  function validateStep3(): string | null {
    if (templateType === QuestionType.MULTIPLE_CHOICE) {
      const data = mcqBlueprintRef.current?.getData();
      if (!data) return 'Lỗi nội bộ: không đọc được dữ liệu blueprint.';
      const filled = data.options.filter((o) => o.formula.trim());
      if (filled.length < 2) return 'Cần ít nhất 2 phương án có công thức.';
      const correct = data.options.find((o) => o.isCorrect);
      if (!correct) return 'Vui lòng đánh dấu một phương án là đáp án đúng.';
      if (!correct.formula.trim())
        return `Phương án ${correct.key} được đánh dấu đáp án đúng nhưng chưa có công thức.`;
      const declared = new Set(
        data.parameters.filter((p) => p.name.trim()).map((p) => p.name.trim())
      );
      for (const o of filled) {
        const undef = tokensIn(o.formula).find((t) => !declared.has(t));
        if (undef) return `Phương án ${o.key}: {{${undef}}} chưa được khai báo.`;
      }
      return null;
    }
    if (templateType === QuestionType.TRUE_FALSE) {
      const data = tfBlueprintRef.current?.getData();
      if (!data) return 'Lỗi nội bộ: không đọc được dữ liệu blueprint.';
      if (data.clauses.some((c) => !c.text.trim()))
        return 'Tất cả 4 mệnh đề phải có nội dung.';
      const trueCount = data.clauses.filter((c) => c.truthValue).length;
      const falseCount = data.clauses.filter((c) => !c.truthValue).length;
      if (trueCount === 0 || falseCount === 0)
        return 'Phải có ít nhất 1 mệnh đề đúng và 1 mệnh đề sai.';
      const declared = new Set(
        data.parameters.filter((p) => p.name.trim()).map((p) => p.name.trim())
      );
      for (const c of data.clauses) {
        const undef = tokensIn(c.text).find((t) => !declared.has(t));
        if (undef) return `Mệnh đề ${c.key}: {{${undef}}} chưa được khai báo.`;
      }
      return null;
    }
    if (templateType === QuestionType.SHORT_ANSWER) {
      const data = saBlueprintRef.current?.getData();
      if (!data) return 'Lỗi nội bộ: không đọc được dữ liệu blueprint.';
      if (!data.answerFormula.trim()) return 'Vui lòng nhập công thức đáp án đúng.';
      if (data.validationMode === 'NUMERIC' && !data.tolerance.trim())
        return 'Kiểu đánh giá "có sai số" yêu cầu nhập sai số cho phép.';
      const declared = new Set(
        data.parameters.filter((p) => p.name.trim()).map((p) => p.name.trim())
      );
      const undef = tokensIn(data.answerFormula).find((t) => !declared.has(t));
      if (undef) return `Công thức đáp án: {{${undef}}} chưa được khai báo.`;
      return null;
    }
    return null;
  }

  function goNext() {
    let err: string | null = null;
    if (currentStep === 1) err = validateStep1();
    else if (currentStep === 2) err = validateStep2();
    else if (currentStep === 3) err = validateStep3();
    if (err) {
      setSubmitError(err);
      return;
    }
    setSubmitError(null);
    setCurrentStep((s) => (Math.min(4, s + 1) as 1 | 2 | 3 | 4));
  }

  function goBack() {
    setSubmitError(null);
    setCurrentStep((s) => (Math.max(1, s - 1) as 1 | 2 | 3 | 4));
  }

  function jumpTo(step: 1 | 2 | 3 | 4) {
    if (step >= currentStep) return;
    setSubmitError(null);
    setCurrentStep(step);
  }

  async function submit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    setSubmitError(null);

    // Re-run every step gate before save — protects against back-edits that
    // invalidated a downstream step.
    for (const [step, gate] of [
      [1, validateStep1],
      [2, validateStep2],
      [3, validateStep3],
    ] as const) {
      const err = gate();
      if (err) {
        setSubmitError(err);
        setCurrentStep(step as 1 | 2 | 3);
        return;
      }
    }

    const validation = validateFormInput({ name });
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
            setSubmitError('Bạn cần khai báo ít nhất một hệ số.');
            setSaving(false);
            return;
          }

          const cleanedGlobals = (mcqData.globalConstraints ?? [])
            .map((g) => g.trim())
            .filter(Boolean);
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
            constraints: cleanedGlobals.length ? cleanedGlobals : undefined,
            cognitiveLevel,
            isPublic,
            questionBankId: initialData?.questionBankId ?? null,
            diagramTemplate: mcqData.diagramTemplateRaw.trim() || undefined,
            solutionStepsTemplate: mcqData.solutionStepsTemplate.trim() || undefined,
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
          const tfGlobals = (tfData.globalConstraints ?? []).map((g) => g.trim()).filter(Boolean);

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
            constraints: tfGlobals.length ? tfGlobals : undefined,
            statementMutations: {
              clauseTemplates: tfData.clauses.map((c) => ({
                text: c.text,
                truthValue: c.truthValue,
              })),
            },
            cognitiveLevel,
            isPublic,
            questionBankId: initialData?.questionBankId ?? null,
            diagramTemplate: tfData.diagramTemplateRaw?.trim() || undefined,
            solutionStepsTemplate: tfData.solutionStepsTemplate?.trim() || undefined,
          };
          break;
        }

        case QuestionType.SHORT_ANSWER: {
          const saData = saBlueprintRef.current?.getData();
          if (!saData) throw new Error('Không thể lấy dữ liệu SA blueprint');

          const mappedParameters = buildParameters(saData.parameters);

          if (Object.keys(mappedParameters).length === 0) {
            setSubmitError('Bạn cần khai báo ít nhất một hệ số.');
            setSaving(false);
            return;
          }

          if (saData.validationMode === 'NUMERIC' && !saData.tolerance) {
            setSubmitError('Kiểu đánh giá "có sai số" yêu cầu nhập sai số cho phép.');
            setSaving(false);
            return;
          }

          const saGlobals = (saData.globalConstraints ?? []).map((g) => g.trim()).filter(Boolean);
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
            constraints: saGlobals.length ? saGlobals : undefined,
            cognitiveLevel,
            isPublic,
            questionBankId: initialData?.questionBankId ?? null,
            diagramTemplate: saData.diagramTemplateRaw.trim() || undefined,
            solutionStepsTemplate: saData.solutionStepsTemplate.trim() || undefined,
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
          <div className="modal-title-block">
            <div className="modal-title-row">
              <span className="modal-icon-badge">
                <SlidersHorizontal size={16} />
              </span>
              <h3>{mode === 'create' ? 'Tạo mẫu câu hỏi' : 'Chỉnh sửa mẫu câu hỏi'}</h3>
            </div>
            <p className="modal-subtitle">
              Thiết lập hệ số để tạo câu hỏi ngẫu nhiên tự động.
            </p>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={() => setIsGuideOpen(true)}>
              <HelpCircle size={14} />
              Hướng dẫn
            </button>
            <ModalCloseButton onClick={onClose} />
          </div>
        </div>

        <form onSubmit={submit}>
          <div className="modal-body">
            <FormStepper current={currentStep} onJump={jumpTo} />

            {/* STEP 1: Metadata */}
            {currentStep === 1 && (
              <>
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
                      Mức độ câu hỏi
                    </p>
                    <select
                      className="select"
                      value={cognitiveLevel}
                      onChange={(event) =>
                        setCognitiveLevel(event.target.value as CognitiveLevel)
                      }
                    >
                      {Object.entries(cognitiveLevelLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
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
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </label>

              </>
            )}

            {/* STEP 2/3/4: Blueprint slices (always mounted to preserve state) */}
            <div style={{ display: currentStep >= 2 ? 'block' : 'none' }}>
              {templateType === QuestionType.MULTIPLE_CHOICE && (
                <MCQBlueprint
                  ref={mcqBlueprintRef}
                  defaultChapterId={selectedChapterId}
                  templateId={initialData?.id}
                  step={currentStep}
                  initialData={
                    mode === 'edit'
                      ? extractBlueprintInitialData(initialData, QuestionType.MULTIPLE_CHOICE)
                      : undefined
                  }
                />
              )}

              {templateType === QuestionType.TRUE_FALSE && (
                <TFBlueprint
                  ref={tfBlueprintRef}
                  templateId={initialData?.id}
                  step={currentStep}
                  initialData={
                    mode === 'edit'
                      ? extractBlueprintInitialData(initialData, QuestionType.TRUE_FALSE)
                      : undefined
                  }
                />
              )}

              {templateType === QuestionType.SHORT_ANSWER && (
                <SABlueprint
                  ref={saBlueprintRef}
                  defaultChapterId={selectedChapterId}
                  templateId={initialData?.id}
                  step={currentStep}
                  initialData={
                    mode === 'edit'
                      ? extractBlueprintInitialData(initialData, QuestionType.SHORT_ANSWER)
                      : undefined
                  }
                />
              )}
            </div>

            {/* AI Extract Panel — only in step 4 (review/refine). Edit-mode only. */}
            {currentStep === 4 && initialData?.id && (
              <AIExtractPanel
                templateId={initialData.id}
                templateText={
                  templateType === QuestionType.TRUE_FALSE
                    ? (tfBlueprintRef.current?.getData().stemText ?? '')
                    : (mcqBlueprintRef.current?.getData().templateText ??
                      saBlueprintRef.current?.getData().templateText ??
                      '')
                }
                answerFormula={
                  templateType === QuestionType.MULTIPLE_CHOICE
                    ? mcqBlueprintRef.current?.getData().answerFormula
                    : templateType === QuestionType.SHORT_ANSWER
                      ? saBlueprintRef.current?.getData().answerFormula
                      : undefined
                }
                clauses={
                  templateType === QuestionType.TRUE_FALSE
                    ? Object.fromEntries(
                        (tfBlueprintRef.current?.getData().clauses ?? []).map((c) => [
                          c.key,
                          c.text,
                        ])
                      )
                    : undefined
                }
                options={
                  templateType === QuestionType.MULTIPLE_CHOICE
                    ? Object.fromEntries(
                        (mcqBlueprintRef.current?.getData().options ?? []).map((o) => [
                          o.key,
                          o.formula,
                        ])
                      )
                    : undefined
                }
                onApply={(newText) => {
                  if (templateType === QuestionType.TRUE_FALSE) {
                    tfBlueprintRef.current?.setStemText(newText);
                  } else if (templateType === QuestionType.MULTIPLE_CHOICE) {
                    mcqBlueprintRef.current?.setTemplateText(newText);
                  } else {
                    saBlueprintRef.current?.setTemplateText(newText);
                  }
                }}
              />
            )}

            {submitError && (
              <div className="empty" style={{ color: '#b91c1c', marginTop: 0 }}>
                {submitError}
              </div>
            )}

            {/*
             * Sticky LaTeX toolbar — pinned to the bottom of the scroll area so
             * it stays reachable while the teacher edits parameters / options /
             * clauses further down. Previously it lived inline near the top and
             * scrolled out of view, forcing teachers to scroll back up to grab
             * a math symbol.
             *
             * NOTE: must live inside `.modal-body` (the scrolling ancestor) for
             * position:sticky to anchor — placing it between body and footer
             * would just put it in normal flow.
             */}
            <div
              style={{
                position: 'sticky',
                bottom: 0,
                marginTop: 12,
                marginInline: 'calc(-1 * var(--modal-body-pad, 1rem))',
                background: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                padding: '0.55rem 1rem',
                boxShadow: '0 -6px 18px rgba(15, 23, 42, 0.05)',
                zIndex: 4,
              }}
            >
              <LatexToolbar onInsert={insertLatexAtCursor} disabled={saving} />
            </div>
          </div>

          <div className="modal-footer">
            {currentStep === 1 ? (
              <button type="button" className="btn secondary" onClick={onClose}>
                Hủy
              </button>
            ) : (
              <button type="button" className="btn secondary" onClick={goBack}>
                ← Quay lại
              </button>
            )}
            {currentStep < 4 ? (
              <button type="button" className="btn" onClick={goNext}>
                Tiếp tục →
              </button>
            ) : (
              <button type="submit" className="btn" disabled={saving}>
                {submitLabel}
              </button>
            )}
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
              <ModalCloseButton onClick={() => setIsGuideOpen(false)} />
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
                    <strong>1. Hệ số</strong>
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
                  <li>Hệ số phải khớp với tên trong công thức</li>
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
