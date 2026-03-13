import { Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  CognitiveLevel,
  QuestionType,
  type QuestionTemplateRequest,
  type QuestionTemplateResponse,
} from '../../types/questionTemplate';

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
    setTemplateText('Giải phương trình: {a}x + {b} = 0');
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
                  {Object.values(QuestionType).map((item) => (
                    <option key={item} value={item}>{item}</option>
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
                  {Object.values(CognitiveLevel).map((item) => (
                    <option key={item} value={item}>{item}</option>
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
            </label>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>Nội dung câu hỏi</p>
              <textarea className="textarea" rows={3} required value={templateText} onChange={(event) => setTemplateText(event.target.value)} />
            </label>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>Công thức đáp án</p>
              <input className="input" required value={answerFormula} onChange={(event) => setAnswerFormula(event.target.value)} />
            </label>

            <section className="data-card" style={{ minHeight: 0 }}>
              <div className="row">
                <h3>Biến số</h3>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setParameters((prev) => [...prev, { name: '', type: 'int', min: '1', max: '10' }])}
                >
                  <Plus size={14} />
                  Thêm
                </button>
              </div>

              {parameters.map((item, index) => (
                <div key={`${item.name}-${index}`} className="form-grid">
                  <input
                    className="input"
                    placeholder="Tên biến"
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
                    <option value="int">int</option>
                    <option value="float">float</option>
                  </select>
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
                  <div className="row" style={{ justifyContent: 'start' }}>
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
                    <button
                      type="button"
                      className="btn danger"
                      onClick={() => setParameters((prev) => prev.filter((_entry, i) => i !== index))}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </section>

            <section className="data-card" style={{ minHeight: 0 }}>
              <div className="row">
                <h3>Bộ sinh lựa chọn</h3>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setOptions((prev) => [...prev, { key: '', formula: '' }])}
                >
                  <Plus size={14} />
                  Thêm
                </button>
              </div>

              {options.map((item, index) => (
                <div key={`${item.key}-${index}`} className="form-grid">
                  <input
                    className="input"
                    placeholder="Mã lựa chọn"
                    value={item.key}
                    onChange={(event) => {
                      const next = [...options];
                      next[index] = { ...next[index], key: event.target.value };
                      setOptions(next);
                    }}
                  />
                  <div className="row" style={{ gridColumn: 'span 3' }}>
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

            <section className="data-card" style={{ minHeight: 0 }}>
              <div className="row">
                <h3>Luật độ khó</h3>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setRules((prev) => [...prev, { level: 'MEDIUM', condition: '' }])}
                >
                  <Plus size={14} />
                  Thêm
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
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                    <option value="VERY_HARD">VERY_HARD</option>
                  </select>
                  <div className="row" style={{ gridColumn: 'span 3' }}>
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
