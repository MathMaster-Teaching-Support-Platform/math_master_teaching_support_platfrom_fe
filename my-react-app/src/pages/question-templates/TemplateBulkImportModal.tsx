import { useState, useRef } from 'react';
import {
  Upload,
  DownloadCloud,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { templateImportService } from '../../services/templateImportService';
import type { ExcelPreviewResponse } from '../../types/bulkImport';
import MathText from '../../components/common/MathText';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setError(err instanceof Error ? err.message : 'Failed to download template');
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    // Validate file type
    if (!selectedFile.name.endsWith('.xlsx')) {
      setError('Only .xlsx files are supported');
      return;
    }

    // Validate file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const preview = await templateImportService.previewExcel(selectedFile);
      setPreviewData(preview);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse Excel file');
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

    const validTemplates = previewData.rows
      .filter((row) => row.isValid && row.data)
      .map((row) => row.data!);

    if (validTemplates.length === 0) {
      setError('No valid templates to import');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const result = await templateImportService.submitBatch(validTemplates);
      onSuccess();
      setSuccessMessage(`Imported ${result.successCount} templates successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
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
            <h3>Bulk Import Question Templates</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              {step === 'upload'
                ? 'Download template, fill it with your data, and upload'
                : `Preview: ${previewData?.validRows ?? 0} valid, ${previewData?.invalidRows ?? 0} invalid`}
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
                  <strong>Step 1: Download Template</strong>
                  <p>Download the Excel template and fill in your question templates following the format.</p>
                </div>
              </div>

              <button className="btn" onClick={handleDownloadTemplate} style={{ marginBottom: 24 }}>
                <DownloadCloud size={16} />
                Download Excel Template
              </button>

              <div className="alert alert-info">
                <AlertCircle size={16} />
                <div>
                  <strong>Step 2: Upload Filled Template</strong>
                  <p>Upload your filled Excel file to preview and validate.</p>
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
                    <p>Parsing Excel file...</p>
                  </>
                ) : (
                  <>
                    <Upload size={48} />
                    <p className="drop-zone-text">Click or drag Excel file to upload</p>
                    <p className="drop-zone-hint">Only .xlsx files are supported (max 10MB)</p>
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
                    Preview Results: {previewData.validRows} valid, {previewData.invalidRows} invalid
                    out of {previewData.totalRows} total
                  </strong>
                  {previewData.invalidRows > 0 && (
                    <p>Please review and fix invalid rows, then re-upload the file.</p>
                  )}
                  {previewData.invalidRows === 0 && <p>All rows are valid and ready to import!</p>}
                </div>
              </div>

              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>Row</th>
                      <th style={{ width: 80 }}>Status</th>
                      <th>Name</th>
                      <th style={{ width: 150 }}>Type</th>
                      <th style={{ width: 130 }}>Cognitive Level</th>
                      <th>Errors</th>
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
                              Valid
                            </span>
                          ) : (
                            <span className="badge badge-error">
                              <XCircle size={12} />
                              Invalid
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
                            ? cognitiveLevelLabel[row.data.cognitiveLevel] || row.data.cognitiveLevel
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
              Cancel
            </button>
          )}

          {step === 'preview' && (
            <>
              <button className="btn secondary" onClick={handleBack}>
                Back
              </button>
              <button
                className="btn"
                onClick={handleSubmit}
                disabled={!previewData || previewData.validRows === 0 || importing}
              >
                {importing ? (
                  <>
                    <div className="spinner-small" />
                    Importing...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet size={16} />
                    Import {previewData?.validRows ?? 0} Valid Template
                    {previewData && previewData.validRows !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {successMessage && (
          <dialog
            aria-label="Import thanh cong"
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
                <strong style={{ color: '#0f172a' }}>Import completed</strong>
              </div>
              <p style={{ margin: '0.75rem 0 1rem', color: '#334155' }}>{successMessage}</p>
              <div className="row" style={{ justifyContent: 'end' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={handleClose}
                >
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
