import { Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
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
};

type OptionInput = {
  key: string;
  formula: string;
};

type DifficultyRuleInput = {
  level: string;
  condition: string;
};

type Props = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: QuestionTemplateResponse | null;
  onClose: () => void;
  onSubmit: (data: QuestionTemplateRequest) => Promise<void>;
};

function parseTemplateText(value: Record<string, unknown> | undefined): string {
  const vi = value?.vi;
  const en = value?.en;
  if (typeof vi === 'string') return vi;
  if (typeof en === 'string') return en;
  return '';
}

const cognitiveLevelLabels: Record<CognitiveLevel, string> = {
  REMEMBER: '1. Nhận biết',
  UNDERSTAND: '2. Thông hiểu',
  APPLY: '3. Vận dụng',
  ANALYZE: '4. Phân tích',
  EVALUATE: '5. Đánh giá',
  CREATE: '6. Sáng tạo',
};

const questionTypeLabels: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'Trắc nghiệm (Nhiều lựa chọn)',
  TRUE_FALSE: 'Đúng / Sai',
  SHORT_ANSWER: 'Trả lời ngắn (Tự điền kết quả)',
  ESSAY: 'Tự luận',
  CODING: 'Lập trình',
};

const difficultyLabels: Record<string, string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
  VERY_HARD: 'Rất khó',
};

export function TemplateFormModal({ isOpen, mode, initialData, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateType, setTemplateType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
  const [cognitiveLevel, setCognitiveLevel] = useState<CognitiveLevel>(CognitiveLevel.UNDERSTAND);
  const [isPublic, setIsPublic] = useState(false);
  const [templateText, setTemplateText] = useState('');
  const [answerFormula, setAnswerFormula] = useState('');
  const [tags, setTags] = useState('');
  const [parameters, setParameters] = useState<ParameterInput[]>([]);
  const [options, setOptions] = useState<OptionInput[]>([]);
  const [rules, setRules] = useState<DifficultyRuleInput[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit' && initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setTemplateType(initialData.templateType || QuestionType.MULTIPLE_CHOICE);
      setCognitiveLevel(initialData.cognitiveLevel || CognitiveLevel.UNDERSTAND);
      setIsPublic(initialData.isPublic ?? false);
      setTemplateText(parseTemplateText(initialData.templateText));
      setAnswerFormula(initialData.answerFormula || '');
      setTags((initialData.tags || []).join(', '));

      const mappedParameters: ParameterInput[] = Object.entries(initialData.parameters || {}).map(([key, raw]) => {
        const item = raw as { type?: string; min?: number; max?: number };
        return {
          name: key,
          type: item.type || 'int',
          min: item.min?.toString() || '1',
          max: item.max?.toString() || '10',
        };
      });

      const mappedOptions: OptionInput[] = Object.entries(initialData.optionsGenerator || {}).map(([key, raw]) => ({
        key,
        formula: typeof raw === 'string' ? raw : '',
      }));

      const mappedRules: DifficultyRuleInput[] = Object.entries(initialData.difficultyRules || {}).map(([level, raw]) => ({
        level,
        condition: typeof raw === 'string' ? raw : '',
      }));

      setParameters(mappedParameters.length ? mappedParameters : [{ name: 'a', type: 'int', min: '1', max: '10' }]);
      setOptions(mappedOptions.length ? mappedOptions : [{ key: 'A', formula: '' }, { key: 'B', formula: '' }]);
      setRules(mappedRules.length ? mappedRules : [{ level: 'EASY', condition: '' }]);
      return;
    }

    setName('');
    setDescription('');
    setTemplateType(QuestionType.MULTIPLE_CHOICE);
    setCognitiveLevel(CognitiveLevel.UNDERSTAND);
    setIsPublic(false);
    setTemplateText('Giải phương trình: {{a}}x + {{b}} = 0');
    setAnswerFormula('(-b)/a');
    setTags('đại số, lớp 9');
    setParameters([
      { name: 'a', type: 'int', min: '1', max: '10' },
      { name: 'b', type: 'int', min: '-10', max: '10' },
    ]);
    setOptions([
      { key: 'A', formula: '(-b)/a' },
      { key: 'B', formula: 'b/a' },
      { key: 'C', formula: '-a/b' },
      { key: 'D', formula: 'a+b' },
    ]);
    setRules([{ level: 'EASY', condition: 'a < 5' }]);
  }, [isOpen, initialData, mode]);

  if (!isOpen) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    const mappedParameters: Record<string, unknown> = {};
    for (const item of parameters) {
      if (!item.name.trim()) continue;
      mappedParameters[item.name.trim()] = {
        type: item.type,
        min: item.type === 'int' ? Number.parseInt(item.min, 10) : Number.parseFloat(item.min),
        max: item.type === 'int' ? Number.parseInt(item.max, 10) : Number.parseFloat(item.max),
      };
    }

    const mappedOptions: Record<string, unknown> = {};
    for (const option of options) {
      if (!option.key.trim() || !option.formula.trim()) continue;
      mappedOptions[option.key.trim()] = option.formula.trim();
    }

    const mappedRules: Record<string, unknown> = {};
    for (const rule of rules) {
      if (!rule.level.trim() || !rule.condition.trim()) continue;
      mappedRules[rule.level.trim()] = rule.condition.trim();
    }

    const payload: QuestionTemplateRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      templateType,
      templateText: { vi: templateText.trim() },
      parameters: mappedParameters,
      answerFormula: answerFormula.trim(),
      optionsGenerator: Object.keys(mappedOptions).length ? mappedOptions : undefined,
      difficultyRules: mappedRules,
      cognitiveLevel,
      tags: tags.split(',').map((item) => item.trim()).filter(Boolean),
      isPublic,
    };

    try {
      await onSubmit(payload);
      onClose();
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
                <input className="input" required value={name} onChange={(event) => setName(event.target.value)} />
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
                <input className="input" value={tags} onChange={(event) => setTags(event.target.value)} />
              </label>
            </div>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>Mô tả</p>
              <textarea className="textarea" rows={2} value={description} onChange={(event) => setDescription(event.target.value)} />
              {description && (
                <div className="preview-box">
                  <MathText text={description} />
                </div>
              )}
            </label>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>
                Nội dung câu hỏi 
                <span style={{ fontSize: '0.8rem', marginLeft: 8, fontWeight: 400 }}>
                  (Dùng {"{{a}}"}, {"{{b}}"} để chèn biến số. Ví dụ: "Giải: x + {"{{a}}"} = {"{{b}}"}")
                </span>
              </p>
              <textarea className="textarea" rows={3} required placeholder="Ví dụ: Tính giá trị của biểu thức {{a}} + {{b}}?" value={templateText} onChange={(event) => setTemplateText(event.target.value)} />
              {templateText && (
                <div className="preview-box">
                  <MathText text={templateText} />
                </div>
              )}
            </label>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>Công thức tính đáp án đúng</p>
              <input className="input" required placeholder="Ví dụ: a + b" value={answerFormula} onChange={(event) => setAnswerFormula(event.target.value)} />
              {answerFormula && (
                <div className="preview-box">
                  <MathText text={`$${answerFormula.replace(/\$/g, '')}$`} />
                </div>
              )}
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
                  onClick={() => setParameters((prev) => [...prev, { name: '', type: 'int', min: '1', max: '10' }])}
                >
                  <Plus size={14} />
                  Thêm biến
                </button>
              </div>

              {parameters.map((item, index) => (
                <div key={`${item.name}-${index}`} className="form-grid" style={{ gridTemplateColumns: '1fr 0.8fr 1fr 1fr 40px', alignItems: 'center' }}>
                  <input
                    className="input"
                    placeholder="Tên (a, b...)"
                    value={item.name}
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
                      className="input"
                      type="number"
                      value={item.min}
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
                      className="input"
                      type="number"
                      value={item.max}
                      onChange={(event) => {
                        const next = [...parameters];
                        next[index] = { ...next[index], max: event.target.value };
                        setParameters(next);
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn danger"
                    style={{ padding: '0.4rem', height: '38px', width: '38px', display: 'flex', justifyContent: 'center' }}
                    onClick={() => setParameters((prev) => prev.filter((_entry, i) => i !== index))}
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
                    className="input"
                    placeholder="Mã (A, B...)"
                    value={item.key}
                    onChange={(event) => {
                      const next = [...options];
                      next[index] = { ...next[index], key: event.target.value };
                      setOptions(next);
                    }}
                  />
                  <div className="row" style={{ gridColumn: 'span 3' }}>
                    <div style={{ width: '100%' }}>
                      <input
                        className="input"
                        style={{ width: '100%' }}
                        placeholder="Công thức"
                        value={item.formula}
                        onChange={(event) => {
                          const next = [...options];
                          next[index] = { ...next[index], formula: event.target.value };
                          setOptions(next);
                        }}
                      />
                      {item.formula && (
                        <div className="preview-box">
                          <MathText text={`$${item.formula.replace(/\$/g, '')}$`} />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn danger"
                      onClick={() => setOptions((prev) => prev.filter((_entry, i) => i !== index))}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </section>

            <section className="data-card" style={{ minHeight: 0, border: '1px solid #f1f5f9' }}>
              <div className="row">
                <div>
                  <h3 style={{ color: '#334155' }}>3. Tự động phân loại mức độ</h3>
                  <p className="muted" style={{ fontSize: '0.8rem' }}>Thiết lập điều kiện (Ví dụ: a + b &gt; 50) để tự gán mức độ Khó/Dễ.</p>
                </div>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setRules((prev) => [...prev, { level: 'MEDIUM', condition: '' }])}
                >
                  <Plus size={14} />
                  Thêm luật
                </button>
              </div>

              {rules.map((item, index) => (
                <div key={`${item.level}-${index}`} className="form-grid">
                  <select
                    className="select"
                    value={item.level}
                    onChange={(event) => {
                      const next = [...rules];
                      next[index] = { ...next[index], level: event.target.value };
                      setRules(next);
                    }}
                  >
                    {Object.entries(difficultyLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <div className="row" style={{ gridColumn: 'span 3' }}>
                    <div style={{ width: '100%' }}>
                      <input
                        className="input"
                        style={{ width: '100%' }}
                        placeholder="Điều kiện"
                        value={item.condition}
                        onChange={(event) => {
                          const next = [...rules];
                          next[index] = { ...next[index], condition: event.target.value };
                          setRules(next);
                        }}
                      />
                      {item.condition && (
                        <div className="preview-box">
                          <MathText text={item.condition} />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn danger"
                      onClick={() => setRules((prev) => prev.filter((_entry, i) => i !== index))}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </section>

            <label className="row" style={{ justifyContent: 'start' }}>
              <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} />
              Công khai mẫu cho giáo viên khác
            </label>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Đang lưu...' : mode === 'create' ? 'Tạo mẫu' : 'Cập nhật mẫu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
