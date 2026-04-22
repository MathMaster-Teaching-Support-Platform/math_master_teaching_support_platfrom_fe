import {
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Upload,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { questionTemplateService } from '../../services/questionTemplateService';
import type { TemplateBatchImportResponse } from '../../types/questionTemplate';
import './template-bulk-import.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TemplateBulkImportModal({ isOpen, onClose, onSuccess }: Readonly<Props>) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TemplateBatchImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      setError('Chỉ hỗ trợ file định dạng .xlsx hoặc .xls');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File vượt quá giới hạn 10MB');
      return;
    }

    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const response = await questionTemplateService.importFromExcel(selectedFile);
      if (response.result) {
        setResult(response.result);
        if (response.result.successCount > 0) {
          onSuccess();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể nhập file Excel. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) void handleFileSelect(selectedFile);
  };

  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === 'dragenter' || event.type === 'dragover') setDragActive(true);
    else if (event.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) void handleFileSelect(droppedFile);
  };

  const handleClose = () => {
    setLoading(false);
    setResult(null);
    setError(null);
    setDragActive(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-layer">
      <div className="modal-card bulk-import-modal">
        <div className="modal-header">
          <div>
            <h3>Nhập mẫu câu hỏi từ Excel</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              Upload file Excel (.xlsx) để tạo hàng loạt mẫu câu hỏi
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

          {result && (
            <div className={`alert ${result.successCount > 0 ? 'alert-success' : 'alert-error'}`}>
              <CheckCircle size={16} />
              <div>
                <strong>Kết quả nhập:</strong> {result.successCount}/{result.totalRows} mẫu thành công
                {result.failedCount > 0 && (
                  <ul style={{ marginTop: 6, paddingLeft: 16 }}>
                    {result.errors.map((e) => (
                      <li key={`${e.rowNumber}-${e.field ?? ''}`} style={{ fontSize: '0.82rem' }}>
                        Dòng {e.rowNumber}: {e.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {!result && (
            <label
              className={`drop-zone${dragActive ? ' active' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              htmlFor="excel-file-input"
              style={{ cursor: 'pointer', display: 'block', padding: '2.5rem', textAlign: 'center', border: '2px dashed #ccc', borderRadius: 8 }}
            >
              {loading ? (
                <div className="spinner-sm" />
              ) : (
                <>
                  <FileSpreadsheet size={40} style={{ color: '#22c55e', marginBottom: 12 }} />
                  <p><strong>Kéo thả file Excel vào đây</strong></p>
                  <p className="muted">hoặc nhấp để chọn file (.xlsx, .xls, tối đa 10MB)</p>
                  <button className="btn secondary" style={{ marginTop: 12 }} onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}>
                    <Upload size={14} /> Chọn file
                  </button>
                </>
              )}
            </label>
          )}

          <input
            ref={fileInputRef}
            id="excel-file-input"
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleFileInputChange}
          />

          <div style={{ marginTop: 12, fontSize: '0.82rem', color: '#666' }}>
            <strong>Định dạng file:</strong> Cột A: Tên template, B: Nội dung câu hỏi, C: Đáp án, D: Cấp độ (NHAN_BIET/THONG_HIEU/VAN_DUNG/VAN_DUNG_CAO), E: Tham số JSON (tùy chọn)
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn secondary" onClick={handleClose}>Đóng</button>
          {result && (
            <button className="btn" onClick={() => setResult(null)}>
              <Upload size={14} /> Nhập file khác
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
