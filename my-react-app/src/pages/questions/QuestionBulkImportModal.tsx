import {
  AlertCircle,
  CheckCircle,
  DownloadCloud,
  FileSpreadsheet,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { useRef, useState } from 'react';
import MathText from '../../components/common/MathText';
import { questionBulkImportService } from '../../services/questionBulkImportService';
import type { QuestionExcelPreviewResponse } from '../../types/bulkImport';
import '../question-templates/template-bulk-import.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'upload' | 'preview';

const questionTypeLabel: Record<string, string> = {
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

export function QuestionBulkImportModal({ isOpen, onClose, onSuccess }: Readonly<Props>) {
  const [step, setStep] = useState<Step>('upload');
  const [previewData, setPreviewData] = useState<QuestionExcelPreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [clientWarnings, setClientWarnings] = useState<Map<number, string[]>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    try {
      setError(null);
      const blob = await questionBulkImportService.downloadTemplate();
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'question_import.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      globalThis.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải file mẫu. Vui lòng thử lại.');
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.xlsx')) {
      setError('Chỉ hỗ trợ file định dạng .xlsx');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File vượt quá giới hạn 10MB');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const preview = await questionBulkImportService.previewExcel(selectedFile);
      setPreviewData(preview);
      
      // Client-side validation for additional warnings
      const warnings = new Map<number, string[]>();
      preview.rows.forEach((row) => {
        if (row.data && row.isValid) {
          const rowWarnings: string[] = [];
          
          // Check for {{}} parameter format recommendation
          if (row.data.questionText && !row.data.questionText.includes('{{')) {
            rowWarnings.push('💡 Gợi ý: Sử dụng {{tham_số}} cho câu hỏi động');
          }
          
          // Check if options contain {{}} but question text doesn't
          if (row.data.options) {
            const optionsStr = JSON.stringify(row.data.options);
            if (optionsStr.includes('{{') && !row.data.questionText?.includes('{{')) {
              rowWarnings.push('⚠️ Đáp án có {{}} nhưng câu hỏi không có');
            }
          }
          
          if (rowWarnings.length > 0) {
            warnings.set(row.rowNumber, rowWarnings);
          }
        }
      });
      
      setClientWarnings(warnings);
      setStep('preview');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể đọc file Excel. Vui lòng kiểm tra định dạng file.',
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

    const validQuestions = previewData.rows
      .filter((row) => row.isValid && row.data)
      .map((row) => row.data!);

    if (validQuestions.length === 0) {
      setError('Không có câu hỏi hợp lệ nào để nhập.');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const result = await questionBulkImportService.submitBatch(validQuestions);
      onSuccess();
      setSuccessMessage(`Đã nhập thành công ${result.successCount} câu hỏi.`);
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
    setClientWarnings(new Map());
    onClose();
  };

  const handleBack = () => {
    setStep('upload');
    setPreviewData(null);
    setError(null);
    setClientWarnings(new Map());
  };

  if (!isOpen) return null;

  return (
    <div className="modal-layer">
      <div className="modal-card bulk-import-modal">
        <div className="modal-header">
          <div>
            <h3>Nhập câu hỏi hàng loạt</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              {step === 'upload'
                ? 'Tải file mẫu, điền dữ liệu và tải lên để nhập nhiều câu hỏi cùng lúc'
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
                  <strong>⚠️ QUY TẮC MỚI: Chỉ nhập câu hỏi trắc nghiệm</strong>
                  <p style={{ marginTop: 4 }}>
                    Từ nay, hệ thống chỉ chấp nhận câu hỏi loại <strong>MULTIPLE_CHOICE</strong> với đúng 4 đáp án (A, B, C, D).
                    Sử dụng định dạng <code>{'{{'}</code>tham_số<code>{'}}'}</code> cho câu hỏi động.
                  </p>
                </div>
              </div>
              
              <div className="alert alert-info">
                <AlertCircle size={16} />
                <div>
                  <strong>Bước 1: Tải file mẫu Excel</strong>
                  <p>
                    Tải file mẫu về máy, mở bằng Excel và điền thông tin câu hỏi theo đúng cột.
                    Các cột bắt buộc: questionText, questionType, cognitiveLevel.
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
                      <th style={{ width: 100 }}>Trạng thái</th>
                      <th>Nội dung câu hỏi</th>
                      <th style={{ width: 140 }}>Loại câu hỏi</th>
                      <th style={{ width: 130 }}>Mức độ nhận thức</th>
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
                          {row.data?.questionText ? (
                            <MathText text={row.data.questionText} />
                          ) : (
                            <span className="muted">-</span>
                          )}
                        </td>
                        <td>
                          {row.data?.questionType
                            ? (questionTypeLabel[row.data.questionType] ?? row.data.questionType)
                            : '-'}
                        </td>
                        <td>
                          {row.data?.cognitiveLevel
                            ? (cognitiveLevelLabel[row.data.cognitiveLevel] ??
                              row.data.cognitiveLevel)
                            : '-'}
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
                          ) : clientWarnings.has(row.rowNumber) ? (
                            <div className="warning-list" style={{ color: '#d97706' }}>
                              {clientWarnings.get(row.rowNumber)?.map((warning) => (
                                <div key={`${row.rowNumber}-${warning}`} className="warning-item">
                                  {warning}
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
                    Nhập {previewData?.validRows ?? 0} câu hỏi hợp lệ
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
