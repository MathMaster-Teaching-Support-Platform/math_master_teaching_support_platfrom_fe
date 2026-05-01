import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import type {
  ExamMatrixResponse,
  ExamMatrixTableChapter,
  ExamMatrixTableResponse,
  ExamMatrixTableRow,
  MatrixCognitiveDistribution,
} from '../types/examMatrix';

const cognitiveOrder = ['NB', 'TH', 'VD', 'VDC'] as const;
type MatrixLevel = (typeof cognitiveOrder)[number];

function normalizeLevel(level: string): MatrixLevel | null {
  const upper = level.toUpperCase();
  if (upper === 'NB' || upper === 'NHAN_BIET' || upper === 'REMEMBER') return 'NB';
  if (upper === 'TH' || upper === 'THONG_HIEU' || upper === 'UNDERSTAND') return 'TH';
  if (upper === 'VD' || upper === 'VAN_DUNG' || upper === 'APPLY') return 'VD';
  if (upper === 'VDC' || upper === 'VAN_DUNG_CAO' || upper === 'ANALYZE') return 'VDC';
  return null;
}

export function getLevelCount(row: ExamMatrixTableRow, level: MatrixLevel): number {
  const fromCells = row.cells?.find((cell) => normalizeLevel(cell.cognitiveLevel) === level);
  if (fromCells) return Number(fromCells.questionCount ?? 0);

  const dist = row.countByCognitive;
  if (!dist) return 0;

  if (level === 'NB') return Number(dist.NB ?? dist.NHAN_BIET ?? dist.REMEMBER ?? 0);
  if (level === 'TH') return Number(dist.TH ?? dist.THONG_HIEU ?? dist.UNDERSTAND ?? 0);
  if (level === 'VD') return Number(dist.VD ?? dist.VAN_DUNG ?? dist.APPLY ?? 0);
  return Number(dist.VDC ?? dist.VAN_DUNG_CAO ?? dist.ANALYZE ?? 0);
}

function grandLevelCount(dist: MatrixCognitiveDistribution | undefined, level: MatrixLevel): number {
  if (!dist) return 0;
  if (level === 'NB') return Number(dist.NB ?? dist.NHAN_BIET ?? dist.REMEMBER ?? 0);
  if (level === 'TH') return Number(dist.TH ?? dist.THONG_HIEU ?? dist.UNDERSTAND ?? 0);
  if (level === 'VD') return Number(dist.VD ?? dist.VAN_DUNG ?? dist.APPLY ?? 0);
  return Number(dist.VDC ?? dist.VAN_DUNG_CAO ?? dist.ANALYZE ?? 0);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Tên file an toàn trên Windows/macOS, giữ Unicode (tiếng Việt). */
export function safeMatrixFileBase(name: string): string {
  const trimmed = name.trim() || 'ma_tran';
  const noIllegal = trimmed.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ');
  return noIllegal.slice(0, 120) || 'ma_tran';
}

export interface MatrixExportPayload {
  matrix: ExamMatrixResponse;
  table: ExamMatrixTableResponse;
}

/** Xuất .xlsx từ dữ liệu ma trận đã lưu trên hệ thống (theo API). */
export function exportExamMatrixToExcel({ matrix, table }: MatrixExportPayload): void {
  const chapters = table.chapters ?? [];
  const rows: (string | number)[][] = [];

  rows.push([`Ma trận đề: ${matrix.name}`]);
  rows.push([
    `Khối: ${matrix.gradeLevel || table.gradeLevel || ''}`,
    `Môn: ${matrix.subjectName || table.subjectName || ''}`,
    `Trạng thái: ${matrix.status}`,
    `Tổng điểm mục tiêu: ${matrix.totalPointsTarget ?? ''}`,
  ]);
  if (matrix.description) {
    rows.push([`Mô tả: ${matrix.description}`]);
  }
  rows.push([]);
  rows.push([
    'STT',
    'Lớp',
    'Chương',
    'Dạng bài',
    'Trích dẫn',
    'NB (số câu)',
    'TH (số câu)',
    'VD (số câu)',
    'VDC (số câu)',
    'Tổng câu',
    'Tổng điểm',
  ]);

  let stt = 0;
  const gradeDisplay = matrix.gradeLevel || table.gradeLevel || 'N/A';
  for (const chapter of chapters) {
    const chapterName = chapter.chapterName || 'Chương không xác định';
    for (const row of chapter.rows) {
      stt += 1;
      const displayChapter =
        chapterName === 'Chương không xác định'
          ? row.chapterName || row.chapter || chapterName
          : chapterName;
      const ref = row.subject_name || row.subjectName || row.subject || '-';
      rows.push([
        stt,
        gradeDisplay,
        displayChapter,
        row.questionTypeName || 'N/A',
        ref,
        getLevelCount(row, 'NB'),
        getLevelCount(row, 'TH'),
        getLevelCount(row, 'VD'),
        getLevelCount(row, 'VDC'),
        row.rowTotalQuestions ?? 0,
        row.rowTotalPoints ?? 0,
      ]);
    }
  }

  const g = table.grandTotalByCognitive;
  rows.push([]);
  rows.push([
    'Tổng cộng',
    '',
    '',
    '',
    '',
    grandLevelCount(g, 'NB'),
    grandLevelCount(g, 'TH'),
    grandLevelCount(g, 'VD'),
    grandLevelCount(g, 'VDC'),
    table.grandTotalQuestions ?? '',
    table.grandTotalPoints ?? '',
  ]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 5 },
    { wch: 10 },
    { wch: 28 },
    { wch: 24 },
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Ma tran de');
  const base = safeMatrixFileBase(matrix.name);
  XLSX.writeFile(wb, `${base}.xlsx`);
}

function buildExportTableHtml(
  matrix: ExamMatrixResponse,
  table: ExamMatrixTableResponse,
  chapters: ExamMatrixTableChapter[]
): string {
  const grade = escapeHtml(matrix.gradeLevel || table.gradeLevel || 'N/A');
  const subject = escapeHtml(matrix.subjectName || table.subjectName || 'N/A');
  const status = escapeHtml(matrix.status);
  const name = escapeHtml(matrix.name);
  const desc = matrix.description ? escapeHtml(matrix.description) : '';

  const headerCells = cognitiveOrder
    .map(
      (lv) =>
        `<th style="border:1px solid #b7c8df;padding:6px 8px;background:#edf3ff;font-weight:700">${lv}</th>`
    )
    .join('');

  const bodyRows: string[] = [];
  let stt = 0;
  for (const chapter of chapters) {
    const chapterName = chapter.chapterName || 'Chương không xác định';
    for (const row of chapter.rows) {
      stt += 1;
      const displayChapter =
        chapterName === 'Chương không xác định'
          ? row.chapterName || row.chapter || chapterName
          : chapterName;
      const counts = cognitiveOrder
        .map(
          (lv) =>
            `<td style="border:1px solid #d6e0ee;padding:6px 8px;text-align:center">${getLevelCount(row, lv)}</td>`
        )
        .join('');
      bodyRows.push(`<tr>
        <td style="border:1px solid #d6e0ee;padding:6px 8px;text-align:center">${stt}</td>
        <td style="border:1px solid #d6e0ee;padding:6px 8px">${escapeHtml(String(displayChapter))}</td>
        <td style="border:1px solid #d6e0ee;padding:6px 8px">${escapeHtml(row.questionTypeName || 'N/A')}</td>
        ${counts}
        <td style="border:1px solid #d6e0ee;padding:6px 8px;text-align:center">${row.rowTotalQuestions ?? 0}</td>
        <td style="border:1px solid #d6e0ee;padding:6px 8px;text-align:center">${row.rowTotalPoints ?? 0}</td>
      </tr>`);
    }
  }

  const g = table.grandTotalByCognitive;
  const footCounts = cognitiveOrder
    .map(
      (lv) =>
        `<td style="border:1px solid #b7c8df;padding:6px 8px;text-align:center;font-weight:700">${grandLevelCount(g, lv)}</td>`
    )
    .join('');

  return `
<div style="font-family:'Segoe UI',system-ui,sans-serif;padding:20px;color:#142235;width:1120px;background:#fff;box-sizing:border-box">
  <h1 style="font-size:20px;margin:0 0 6px;font-weight:800">${name}</h1>
  <p style="margin:0 0 4px;font-size:12px;color:#60748f">Khối: ${grade} · Môn: ${subject} · Trạng thái: ${status}</p>
  ${desc ? `<p style="margin:8px 0 14px;font-size:11px;color:#24364b;line-height:1.45">${desc}</p>` : '<p style="margin:0 0 14px"></p>'}
  <table style="border-collapse:collapse;width:100%;font-size:11px">
    <thead>
      <tr>
        <th style="border:1px solid #b7c8df;padding:6px 8px;background:#1f5eff;color:#fff;font-weight:700">STT</th>
        <th style="border:1px solid #b7c8df;padding:6px 8px;background:#1f5eff;color:#fff;font-weight:700">Chương</th>
        <th style="border:1px solid #b7c8df;padding:6px 8px;background:#1f5eff;color:#fff;font-weight:700">Chủ đề</th>
        <th colspan="4" style="border:1px solid #b7c8df;padding:6px 8px;background:#1f5eff;color:#fff;font-weight:700">Mức độ nhận thức (số câu)</th>
        <th style="border:1px solid #b7c8df;padding:6px 8px;background:#1f5eff;color:#fff;font-weight:700">Tổng câu</th>
        <th style="border:1px solid #b7c8df;padding:6px 8px;background:#1f5eff;color:#fff;font-weight:700">Tổng điểm</th>
      </tr>
      <tr>
        <th colspan="3" style="border:1px solid #b7c8df;background:#edf3ff"></th>
        ${headerCells}
        <th colspan="2" style="border:1px solid #b7c8df;background:#edf3ff"></th>
      </tr>
    </thead>
    <tbody>${bodyRows.join('')}</tbody>
    <tfoot>
      <tr>
        <td colspan="3" style="border:1px solid #b7c8df;padding:6px 8px;font-weight:700;background:#f3f7fd">Tổng cộng</td>
        ${footCounts}
        <td style="border:1px solid #b7c8df;padding:6px 8px;text-align:center;font-weight:700;background:#f3f7fd">${table.grandTotalQuestions ?? ''}</td>
        <td style="border:1px solid #b7c8df;padding:6px 8px;text-align:center;font-weight:700;background:#f3f7fd">${table.grandTotalPoints ?? ''}</td>
      </tr>
    </tfoot>
  </table>
  <p style="margin:12px 0 0;font-size:9px;color:#9aaece">Xuất từ Math Master — Ma trận đề (dữ liệu đã lưu)</p>
</div>`;
}

/** Xuất PDF: render bảng HTML (UTF-8) rồi chụp bằng html2canvas — hiển thị tiếng Việt ổn định. */
export async function exportExamMatrixToPdf({ matrix, table }: MatrixExportPayload): Promise<void> {
  const chapters = table.chapters ?? [];
  const host = document.createElement('div');
  host.id = 'exam-matrix-export-pdf-host';
  host.style.cssText =
    'position:fixed;left:-10000px;top:0;width:1120px;pointer-events:none;z-index:-1;visibility:visible';
  host.innerHTML = buildExportTableHtml(matrix, table, chapters);
  document.body.appendChild(host);

  try {
    const inner = host.firstElementChild as HTMLElement;
    const canvas = await html2canvas(inner, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;
    const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
    const imgW = canvas.width * ratio;
    const imgH = canvas.height * ratio;
    const x = (pageW - imgW) / 2;
    const y = (pageH - imgH) / 2;
    pdf.addImage(imgData, 'PNG', x, y, imgW, imgH);
    const base = safeMatrixFileBase(matrix.name);
    pdf.save(`${base}.pdf`);
  } finally {
    host.remove();
  }
}
