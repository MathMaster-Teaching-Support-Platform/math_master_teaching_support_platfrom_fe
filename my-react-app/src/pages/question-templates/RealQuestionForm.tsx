import { Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import {
  CognitiveLevel,
  QuestionType,
  type BlueprintFromRealQuestionRequest,
  type BlueprintFromRealQuestionResponse,
} from '../../types/questionTemplate';
import { useBlueprintFromRealQuestion } from '../../hooks/useQuestionTemplate';
import { TypeSelector } from '../../components/question-templates/TypeSelector';
import { AcademicCascade } from '../../components/common/AcademicCascade';

/**
 * Method 1 entry form. The teacher writes a complete, real-valued question — no
 * placeholders. On submit we call POST /question-templates/blueprint-from-real-question;
 * the response is handed up to the parent which renders the Blueprint Confirm modal.
 */
type Props = {
  isOpen: boolean;
  onClose: () => void;
  onBlueprintReady: (
    request: BlueprintFromRealQuestionRequest,
    response: BlueprintFromRealQuestionResponse
  ) => void;
};

const cognitiveLevelLabels: Record<CognitiveLevel, string> = {
  NHAN_BIET: '1. Nhận biết',
  THONG_HIEU: '2. Thông hiểu',
  VAN_DUNG: '3. Vận dụng',
  VAN_DUNG_CAO: '4. Vận dụng cao',
};

export function RealQuestionForm({ isOpen, onClose, onBlueprintReady }: Readonly<Props>) {
  const [questionType, setQuestionType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
  const [cognitiveLevel, setCognitiveLevel] = useState<CognitiveLevel>(CognitiveLevel.THONG_HIEU);
  const [questionText, setQuestionText] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [solutionSteps, setSolutionSteps] = useState('');
  const [diagramLatex, setDiagramLatex] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [clauses, setClauses] = useState([
    { key: 'A', text: '', truthValue: true },
    { key: 'B', text: '', truthValue: false },
    { key: 'C', text: '', truthValue: true },
    { key: 'D', text: '', truthValue: false },
  ]);
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const blueprintMutation = useBlueprintFromRealQuestion();

  if (!isOpen) return null;

  function updateClause(index: number, field: 'text' | 'truthValue', value: string | boolean) {
    setClauses((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!questionText.trim()) {
      setError('Vui lòng nhập đề bài.');
      return;
    }

    const request: BlueprintFromRealQuestionRequest = {
      questionType,
      questionText: questionText.trim(),
      correctAnswer: correctAnswer.trim() || undefined,
      solutionSteps: solutionSteps.trim() || undefined,
      diagramLatex: diagramLatex.trim() || undefined,
      cognitiveLevel,
      gradeLevel: gradeLevel || undefined,
      subjectId: subjectId || undefined,
      chapterId: chapterId || undefined,
    };

    if (questionType === QuestionType.MULTIPLE_CHOICE) {
      const map: Record<string, string> = {};
      if (optionA.trim()) map.A = optionA.trim();
      if (optionB.trim()) map.B = optionB.trim();
      if (optionC.trim()) map.C = optionC.trim();
      if (optionD.trim()) map.D = optionD.trim();
      if (Object.keys(map).length < 2) {
        setError('Câu trắc nghiệm cần ít nhất 2 đáp án.');
        return;
      }
      request.options = map;
    } else if (questionType === QuestionType.TRUE_FALSE) {
      const map: Record<string, { text: string; truthValue: boolean }> = {};
      for (const c of clauses) {
        if (!c.text.trim()) {
          setError('Mọi mệnh đề phải có nội dung.');
          return;
        }
        map[c.key] = { text: c.text.trim(), truthValue: c.truthValue };
      }
      request.clauses = map;
    }

    try {
      const res = await blueprintMutation.mutateAsync(request);
      const blueprint = res.result;
      if (!blueprint) {
        setError('AI không trả về Blueprint. Vui lòng thử lại.');
        return;
      }
      onBlueprintReady(request, blueprint);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi khi gọi AI.');
    }
  }

  const isLoading = blueprintMutation.isPending;

  return (
    <div className="modal-layer">
      <div className="modal-card" style={{ width: 'min(960px, 96vw)' }}>
        <div className="modal-header">
          <div>
            <h3>Viết câu hỏi thật — AI sẽ tự tạo template</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              Bạn dùng <em>số thật</em>, không cần placeholder. Sau khi lưu, AI sẽ
              gợi ý các hệ số và ràng buộc cho bạn xét duyệt.
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="modal-body" style={{ display: 'grid', gap: 14 }}>
            <TypeSelector selectedType={questionType} onChange={setQuestionType} />

            <AcademicCascade
              gradeLevel={gradeLevel}
              subjectId={subjectId}
              chapterId={chapterId}
              onGradeChange={setGradeLevel}
              onSubjectChange={setSubjectId}
              onChapterChange={setChapterId}
              required={false}
            />

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>
                Mức độ nhận thức
              </p>
              <select
                className="select"
                value={cognitiveLevel}
                onChange={(e) => setCognitiveLevel(e.target.value as CognitiveLevel)}
              >
                {Object.entries(cognitiveLevelLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>
                Đề bài (số thật, không placeholder) <span style={{ color: '#ef4444' }}>*</span>
              </p>
              <textarea
                className="textarea"
                rows={3}
                required
                placeholder="Ví dụ: Giải phương trình 2x + 5 = 0"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
              />
            </label>

            {questionType === QuestionType.MULTIPLE_CHOICE && (
              <section className="data-card" style={{ minHeight: 0 }}>
                <h4 style={{ margin: 0, color: '#92400e' }}>Đáp án A / B / C / D</h4>
                <p className="muted" style={{ fontSize: '0.8rem', marginBottom: 10 }}>
                  Nhập <em>giá trị thật</em> cho từng đáp án. Bỏ trống nếu chỉ dùng 2-3 phương án.
                </p>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <input className="input" placeholder="A" value={optionA} onChange={(e) => setOptionA(e.target.value)} />
                  <input className="input" placeholder="B" value={optionB} onChange={(e) => setOptionB(e.target.value)} />
                  <input className="input" placeholder="C" value={optionC} onChange={(e) => setOptionC(e.target.value)} />
                  <input className="input" placeholder="D" value={optionD} onChange={(e) => setOptionD(e.target.value)} />
                </div>
              </section>
            )}

            {questionType === QuestionType.TRUE_FALSE && (
              <section className="data-card" style={{ minHeight: 0 }}>
                <h4 style={{ margin: 0, color: '#1e40af' }}>Mệnh đề Đúng/Sai (4 mệnh đề)</h4>
                <p className="muted" style={{ fontSize: '0.8rem', marginBottom: 10 }}>
                  Mỗi mệnh đề ghi <em>giá trị thật</em>; AI sẽ chuyển thành placeholder.
                </p>
                {clauses.map((c, i) => (
                  <div
                    key={c.key}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      padding: 10,
                      marginBottom: 10,
                      background: '#fff',
                    }}
                  >
                    <div className="row" style={{ alignItems: 'center', gap: 10 }}>
                      <strong style={{ color: '#1e40af' }}>Mệnh đề {c.key}</strong>
                      <div className="row" style={{ gap: 6, marginLeft: 'auto' }}>
                        <button
                          type="button"
                          className={`btn ${c.truthValue ? '' : 'secondary'}`}
                          onClick={() => updateClause(i, 'truthValue', true)}
                        >
                          Đúng
                        </button>
                        <button
                          type="button"
                          className={`btn ${!c.truthValue ? '' : 'secondary'}`}
                          onClick={() => updateClause(i, 'truthValue', false)}
                        >
                          Sai
                        </button>
                      </div>
                    </div>
                    <textarea
                      className="textarea"
                      rows={2}
                      placeholder="Nội dung mệnh đề (số thật)"
                      value={c.text}
                      onChange={(e) => updateClause(i, 'text', e.target.value)}
                      style={{ marginTop: 8 }}
                    />
                  </div>
                ))}
              </section>
            )}

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>
                Đáp án đúng (số thật)
              </p>
              <input
                className="input"
                placeholder="Ví dụ: x = -2.5"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
              />
            </label>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>
                Lời giải mẫu
              </p>
              <textarea
                className="textarea"
                rows={4}
                placeholder="Ví dụ: Bước 1: Chuyển 5 sang vế phải → 2x = -5. Bước 2: Chia hai vế cho 2 → x = -2.5."
                value={solutionSteps}
                onChange={(e) => setSolutionSteps(e.target.value)}
              />
            </label>

            <label>
              <p className="muted" style={{ marginBottom: 6 }}>
                Sơ đồ / Hình LaTeX (tùy chọn)
              </p>
              <textarea
                className="textarea"
                rows={3}
                placeholder=""
                value={diagramLatex}
                onChange={(e) => setDiagramLatex(e.target.value)}
              />
            </label>

            {error && (
              <div className="empty" style={{ color: '#b91c1c' }}>
                {error}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner" style={{ width: 14, height: 14, marginRight: 6 }} />
                  AI đang phân tích…
                </>
              ) : (
                <>
                  <Sparkles size={14} style={{ marginRight: 6 }} />
                  Phân tích &amp; tạo Blueprint
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
