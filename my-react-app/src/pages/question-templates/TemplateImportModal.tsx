import { AlertCircle, CheckCircle2, FileText, UploadCloud, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useGetMyQuestionBanks } from '../../hooks/useQuestionBank';
import { useImportTemplateFromFile } from '../../hooks/useQuestionTemplate';
import type { TemplateDraft } from '../../types/questionTemplate';
import MathText from '../../components/common/MathText';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (draft: TemplateDraft) => void;
};

export function TemplateImportModal({ isOpen, onClose, onUseTemplate }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [subjectHint, setSubjectHint] = useState('');
  const [contextHint, setContextHint] = useState('');
  const [questionBankId, setQuestionBankId] = useState('');
  const importMutation = useImportTemplateFromFile();
  const { data: questionBankData } = useGetMyQuestionBanks(0, 200, 'createdAt', 'DESC', isOpen);

  if (!isOpen) return null;

  const result = importMutation.data?.result;
  const questionBanks = questionBankData?.result?.content ?? [];

  function reset() {
    setFile(null);
    setSubjectHint('');
    setContextHint('');
    setQuestionBankId('');
    importMutation.reset();
  }

  return (
    <div className="modal-layer">
      <div className="modal-card" style={{ width: 'min(760px, 100%)' }}>
        <div className="modal-header">
          <div>
            <h3>Nhập mẫu câu hỏi từ file</h3>
            <p className="muted" style={{ marginTop: 4 }}>Sử dụng AI để phân tích cấu trúc mẫu từ nội dung file.</p>
          </div>
          <button className="icon-btn" onClick={() => { reset(); onClose(); }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {!result && (
            <>
              <button
                className="data-card"
                style={{ cursor: 'pointer', textAlign: 'center' }}
                onClick={() => inputRef.current?.click()}
                onDrop={(event) => {
                  event.preventDefault();
                  const next = event.dataTransfer.files?.[0];
                  if (next) setFile(next);
                }}
                onDragOver={(event) => event.preventDefault()}
              >
                <UploadCloud size={30} style={{ margin: '0 auto' }} />
                <h3>{file ? file.name : 'Kéo thả hoặc chọn file'}</h3>
                <p className="muted">Hỗ trợ .pdf, .doc, .docx, .txt</p>
              </button>

              <input
                ref={inputRef}
                type="file"
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.txt"
                onChange={(event) => {
                  const next = event.target.files?.[0];
                  if (next) setFile(next);
                }}
              />

              <div className="form-grid">
                <label>
                  <p className="muted" style={{ marginBottom: 6 }}>Gợi ý môn học</p>
                  <input className="input" value={subjectHint} onChange={(event) => setSubjectHint(event.target.value)} />
                </label>
                <label>
                  <p className="muted" style={{ marginBottom: 6 }}>Gợi ý bối cảnh</p>
                  <input className="input" value={contextHint} onChange={(event) => setContextHint(event.target.value)} />
                </label>
                <label>
                  <p className="muted" style={{ marginBottom: 6 }}>Ngân hàng câu hỏi (tùy chọn)</p>
                  <select
                    className="select"
                    value={questionBankId}
                    onChange={(event) => setQuestionBankId(event.target.value)}
                  >
                    <option value="">Không gán ngân hàng</option>
                    {questionBanks.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {importMutation.isError && (
                <p style={{ color: '#be123c', fontSize: 13 }}>
                  {(importMutation.error as Error)?.message || 'Nhập file thất bại'}
                </p>
              )}
            </>
          )}

          {result && (
            <>
              <div className="data-card" style={{ minHeight: 0 }}>
                <div className="row" style={{ justifyContent: 'start' }}>
                  {result.analysisSuccessful ? <CheckCircle2 size={18} color="#0f766e" /> : <AlertCircle size={18} color="#b45309" />}
                  <h3>{result.analysisSuccessful ? 'Phân tích thành công' : 'Phân tích xong, có cảnh báo'}</h3>
                </div>
                <p className="muted">Độ tin cậy: {result.confidenceScore ?? 0}%</p>
              </div>

              <div className="data-card" style={{ minHeight: 0 }}>
                <div className="row">
                  <h3>Mẫu gợi ý</h3>
                  <FileText size={16} />
                </div>
                <p className="muted">
                  <MathText text={result.suggestedTemplate?.name || 'Không nhận diện được tên mẫu'} />
                </p>
                <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: 12 }}>
                  {JSON.stringify(result.suggestedTemplate, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn secondary" onClick={() => { reset(); onClose(); }}>
            Hủy
          </button>

          {!result && (
            <button
              className="btn"
              disabled={!file || importMutation.isPending}
              onClick={() => {
                if (!file) return;
                importMutation.mutate({
                  file,
                  subjectHint,
                  contextHint,
                  questionBankId: questionBankId || undefined,
                });
              }}
            >
              {importMutation.isPending ? 'Đang phân tích...' : 'Phân tích file'}
            </button>
          )}

          {result && (
            <>
              <button className="btn secondary" onClick={reset}>Chọn file khác</button>
              <button
                className="btn"
                onClick={() => {
                  if (result.suggestedTemplate) {
                    onUseTemplate(result.suggestedTemplate);
                  }
                }}
                disabled={!result.suggestedTemplate}
              >
                Dùng mẫu gợi ý
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
