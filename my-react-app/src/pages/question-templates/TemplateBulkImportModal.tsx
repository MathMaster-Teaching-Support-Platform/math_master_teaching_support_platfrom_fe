import {
  AlertCircle,
  CheckCircle,
  DownloadCloud,
  FileSpreadsheet,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AcademicCascade } from '../../components/common/AcademicCascade';
import MathText from '../../components/common/MathText';
import { useChaptersBySubject } from '../../hooks/useChapters';
import { templateImportService } from '../../services/templateImportService';
import type { ExcelPreviewResponse } from '../../types/bulkImport';
import './template-bulk-import.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'upload' | 'preview';

const templateTypeLabel: Record<string, string> = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  TRUE_FALSE: 'Đúng/Sai',
  SHORT_ANSWER: 'Trả lời ngắn',
  ESSAY: 'Tự luận',
  CODING: 'Lập trình',
};

const cognitiveLevelLabel: Record<string, string> = {
  NHAN_BIET: 'Nhận biết',
  THONG_HIEU: 'Thông hiểu',
  VAN_DUNG: 'Vận dụng',
  VAN_DUNG_CAO: 'Vận dụng cao',
  REMEMBER: 'Nhận biết',
  UNDERSTAND: 'Thông hiểu',
  APPLY: 'Vận dụng',
  ANALYZE: 'Phân tích',
  EVALUATE: 'Đánh giá',
  CREATE: 'Sáng tạo',
};

export function TemplateBulkImportModal({ isOpen, onClose, onSuccess }: Readonly<Props>) {
  const [step, setStep] = useState<Step>('upload');
  const [previewData, setPreviewData] = useState<ExcelPreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  // Per-row chapter override: rowNumber -> chapterId. Empty/missing means use batch default.
  const [rowChapters, setRowChapters] = useState<Record<number, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chapters available for per-row override — comes from the batch-selected subject.
  const { data: subjectChaptersData } = useChaptersBySubject(subjectId, !!subjectId);
  const subjectChapters = subjectChaptersData?.result ?? [];

  // When subject changes, drop per-row overrides (they may point to chapters in a
  // different subject which is no longer valid for this batch).
  useEffect(() => {
    setRowChapters({});
  }, [subjectId]);

  const handleDownloadTemplate = async () => {
    try {
      setError(null);
      const blob = await templateImportService.downloadTemplate();
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'question_template_import.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      globalThis.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải file mẫu. Vui lòng thử lại.');
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    // Validate file type
    if (!selectedFile.name.endsWith('.xlsx')) {
      setError('Chỉ hỗ trợ file định dạng .xlsx');
      return;
    }

    // Validate file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File vượt quá giới hạn 10MB');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const preview = await templateImportService.previewExcel(selectedFile);
      setPreviewData(preview);
      setStep('preview');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể đọc file Excel. Vui lòng kiểm tra định dạng file.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      void handleFileSelect(selectedFile);
    }
  };

  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      void handleFileSelect(droppedFile);
    }
  };

  const handleSubmit = async () => {
    if (!previewData) return;

    const validRows = previewData.rows.filter((row) => row.isValid && row.data);
    if (validRows.length === 0) {
      setError('Không có mẫu hợp lệ nào để nhập.');
      return;
    }

    // Each row needs a chapter — either its per-row override or the batch default.
    const validTemplates = validRows.map((row) => ({
      ...row.data!,
      chapterId: rowChapters[row.rowNumber] || chapterId || undefined,
    }));

    const missing = validTemplates.filter((t) => !t.chapterId);
    if (missing.length > 0) {
      setError(
        `Còn ${missing.length} mẫu chưa được gán chương. Hãy chọn chương mặc định hoặc gán riêng cho từng dòng.`,
      );
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const result = await templateImportService.submitBatch(
        validTemplates,
        chapterId || undefined,
      );
      onSuccess();
      setSuccessMessage(`Đã nhập thành công ${result.successCount} mẫu câu hỏi.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nhập thất bại. Vui lòng thử lại.');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setPreviewData(null);
    setLoading(false);
    setImporting(false);
    setSuccessMessage(null);
    setError(null);
    setDragActive(false);
    setGradeLevel('');
    setSubjectId('');
    setChapterId('');
    setRowChapters({});
    onClose();
  };

  const handleBack = () => {
    setStep('upload');
    setPreviewData(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-layer">
      <div className="modal-card bulk-import-modal">
        <div className="modal-header">
          <div>
            <h3>Nhập mẫu câu hỏi hàng loạt</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              {step === 'upload'
                ? 'Tải file mẫu, điền dữ liệu và tải lên để nhập nhiều mẫu cùng lúc'
                : `Xem trước: ${previewData?.validRows ?? 0} hợp lệ, ${previewData?.invalidRows ?? 0} lỗi / ${previewData?.totalRows ?? 0} tổng`}
            </p>
          </div>
          <button className="icon-btn" onClick={handleClose}>
            <X size={14} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {step === 'upload' && (
            <div className="bulk-import-upload">
              <div className="alert alert-info">
                <AlertCircle size={16} />
                <div>
                  <strong>Bước 1: Tải file mẫu Excel</strong>
                  <p>
                    Tải file mẫu về máy, mở bằng Excel và điền thông tin các mẫu câu hỏi theo đúng
                    cột.
                  </p>
                </div>
              </div>

              <button className="btn" onClick={handleDownloadTemplate} style={{ marginBottom: 24 }}>
                <DownloadCloud size={16} />
                Tải file mẫu (.xlsx)
              </button>

              <div className="alert alert-info">
                <AlertCircle size={16} />
                <div>
                  <strong>Bước 2: Tải lên file đã điền</strong>
                  <p>
                    Tải lên file Excel đã điền để hệ thống kiểm tra và xem trước dữ liệu trước khi
                    nhập.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className={`file-drop-zone ${dragActive ? 'active' : ''} ${loading ? 'loading' : ''}`}
                aria-label="Chon file Excel de upload"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileInputChange}
                  style={{ display: 'none' }}
                />
                {loading ? (
                  <>
                    <div className="spinner" />
                    <p>Đang đọc file...</p>
                  </>
                ) : (
                  <>
                    <Upload size={48} />
                    <p className="drop-zone-text">Nhấn hoặc kéo thả file Excel vào đây</p>
                    <p className="drop-zone-hint">Chỉ hỗ trợ file .xlsx (tối đa 10MB)</p>
                  </>
                )}
              </button>
            </div>
          )}

          {step === 'preview' && previewData && (
            <div className="bulk-import-preview">
              <div className="alert alert-info" style={{ marginBottom: 12 }}>
                <AlertCircle size={16} />
                <div>
                  <strong>Bước 1: Chọn lớp / môn / chương mặc định</strong>
                  <p>
                    Mọi mẫu sẽ dùng chương này trừ khi bạn chọn riêng cho từng dòng ở cột "Chương"
                    bên dưới.
                  </p>
                </div>
              </div>
              <div
                style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr 1fr', marginBottom: 16 }}
              >
                <AcademicCascade
                  gradeLevel={gradeLevel}
                  subjectId={subjectId}
                  chapterId={chapterId}
                  onGradeChange={(g) => {
                    setGradeLevel(g);
                    setSubjectId('');
                    setChapterId('');
                  }}
                  onSubjectChange={(s) => {
                    setSubjectId(s);
                    setChapterId('');
                  }}
                  onChapterChange={setChapterId}
                />
              </div>
              <div
                className={`alert ${previewData.invalidRows > 0 ? 'alert-warning' : 'alert-success'}`}
              >
                {previewData.invalidRows > 0 ? (
                  <AlertCircle size={16} />
                ) : (
                  <CheckCircle size={16} />
                )}
                <div>
                  <strong>
                    Kết quả kiểm tra: {previewData.validRows} hợp lệ, {previewData.invalidRows} lỗi
                    / {previewData.totalRows} dòng tổng
                  </strong>
                  {previewData.invalidRows > 0 && (
                    <p>Vui lòng sửa các dòng lỗi trong file rồi tải lên lại.</p>
                  )}
                  {previewData.invalidRows === 0 && <p>Tất cả dòng đều hợp lệ, sẵn sàng nhập!</p>}
                </div>
              </div>

              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>Dòng</th>
                      <th style={{ width: 90 }}>Trạng thái</th>
                      <th>Tên mẫu</th>
                      <th style={{ width: 140 }}>Loại</th>
                      <th style={{ width: 120 }}>Mức độ</th>
                      <th style={{ width: 200 }}>Chương</th>
                      <th style={{ width: 240 }}>Chi tiết</th>
                      <th>Lỗi phát hiện</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.rows.map((row) => (
                      <tr key={row.rowNumber} className={row.isValid ? '' : 'row-invalid'}>
                        <td>{row.rowNumber}</td>
                        <td>
                          {row.isValid ? (
                            <span className="badge badge-success">
                              <CheckCircle size={12} />
                              Hợp lệ
                            </span>
                          ) : (
                            <span className="badge badge-error">
                              <XCircle size={12} />
                              Lỗi
                            </span>
                          )}
                        </td>
                        <td>
                          {row.data?.name ? (
                            <MathText text={row.data.name} />
                          ) : (
                            <span className="muted">-</span>
                          )}
                        </td>
                        <td>
                          {row.data?.templateType
                            ? templateTypeLabel[row.data.templateType] || row.data.templateType
                            : '-'}
                        </td>
                        <td>
                          {row.data?.cognitiveLevel
                            ? cognitiveLevelLabel[row.data.cognitiveLevel] ||
                              row.data.cognitiveLevel
                            : '-'}
                        </td>
                        <td>
                          {row.isValid ? (
                            <select
                              className="select"
                              style={{ width: '100%', fontSize: 12 }}
                              value={rowChapters[row.rowNumber] || ''}
                              onChange={(e) =>
                                setRowChapters((prev) => {
                                  const next = { ...prev };
                                  if (e.target.value) {
                                    next[row.rowNumber] = e.target.value;
                                  } else {
                                    delete next[row.rowNumber];
                                  }
                                  return next;
                                })
                              }
                              disabled={!subjectId}
                            >
                              <option value="">
                                {chapterId ? '— Dùng mặc định —' : '— Chọn chương —'}
                              </option>
                              {subjectChapters.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.title}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="muted">-</span>
                          )}
                        </td>
                        <td>
                          {row.data ? (
                            <div style={{ fontSize: 12 }}>
                              {row.data.answerFormula ? (
                                <div>
                                  <strong>Đáp án:</strong>{' '}
                                  <code>{row.data.answerFormula}</code>
                                </div>
                              ) : null}
                              {row.data.optionsGenerator &&
                              Object.keys(row.data.optionsGenerator).length > 0 ? (
                                <details>
                                  <summary
                                    style={{ cursor: 'pointer', color: '#2563eb' }}
                                  >
                                    Đáp án A-D ({Object.keys(row.data.optionsGenerator).length})
                                  </summary>
                                  <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
                                    {Object.entries(row.data.optionsGenerator).map(
                                      ([key, value]) => (
                                        <li key={key}>
                                          <strong>{key}.</strong>{' '}
                                          <code>{String(value)}</code>
                                        </li>
                                      ),
                                    )}
                                  </ul>
                                </details>
                              ) : null}
                              {row.data.statementMutations?.clauseTemplates ? (
                                <details>
                                  <summary
                                    style={{ cursor: 'pointer', color: '#2563eb' }}
                                  >
                                    Mệnh đề (
                                    {row.data.statementMutations.clauseTemplates.length})
                                  </summary>
                                  <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
                                    {row.data.statementMutations.clauseTemplates.map(
                                      (clause, idx) => {
                                        const key = String.fromCharCode(65 + idx);
                                        return (
                                          <li
                                            key={`${row.rowNumber}-${key}`}
                                            style={{
                                              color: clause.truthValue ? '#15803d' : '#b91c1c',
                                            }}
                                          >
                                            <strong>
                                              {key} [{clause.truthValue ? 'Đ' : 'S'}]:
                                            </strong>{' '}
                                            <MathText text={clause.text} />
                                          </li>
                                        );
                                      },
                                    )}
                                  </ul>
                                </details>
                              ) : null}
                              {row.data.diagramTemplate ? (
                                <details>
                                  <summary
                                    style={{ cursor: 'pointer', color: '#2563eb' }}
                                  >
                                    Hình LaTeX
                                  </summary>
                                  <pre
                                    style={{
                                      whiteSpace: 'pre-wrap',
                                      fontSize: 11,
                                      maxHeight: 140,
                                      overflow: 'auto',
                                      background: '#f8fafc',
                                      padding: 6,
                                      borderRadius: 4,
                                      marginTop: 4,
                                    }}
                                  >
                                    {row.data.diagramTemplate}
                                  </pre>
                                </details>
                              ) : null}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          {row.validationErrors && row.validationErrors.length > 0 ? (
                            <div className="error-list">
                              {row.validationErrors.map((err) => (
                                <div key={`${row.rowNumber}-${err}`} className="error-item">
                                  • {err}
                                </div>
                              ))}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step === 'upload' && (
            <button className="btn secondary" onClick={handleClose}>
              Đóng
            </button>
          )}

          {step === 'preview' && (
            <>
              <button className="btn secondary" onClick={handleBack}>
                Quay lại
              </button>
              <button
                className="btn"
                onClick={handleSubmit}
                disabled={!previewData || previewData.validRows === 0 || importing}
              >
                {importing ? (
                  <>
                    <div className="spinner-small" />
                    Đang nhập...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet size={16} />
                    Nhập {previewData?.validRows ?? 0} mẫu hợp lệ
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {successMessage && (
          <dialog
            aria-label="Nhập thành công"
            open
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5,
              borderRadius: 12,
            }}
          >
            <div
              style={{
                width: 'min(420px, calc(100% - 2rem))',
                background: '#ffffff',
                borderRadius: 12,
                border: '1px solid #bfdbfe',
                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.25)',
                padding: '1rem',
              }}
            >
              <div className="row" style={{ alignItems: 'center', gap: 8 }}>
                <CheckCircle size={18} color="#15803d" />
                <strong style={{ color: '#0f172a' }}>Nhập thành công</strong>
              </div>
              <p style={{ margin: '0.75rem 0 1rem', color: '#334155' }}>{successMessage}</p>
              <div className="row" style={{ justifyContent: 'end' }}>
                <button type="button" className="btn" onClick={handleClose}>
                  OK
                </button>
              </div>
            </div>
          </dialog>
        )}
      </div>
    </div>
  );
}
