import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import { AuthService } from './auth.service';
import type {
  OcrApiResponse,
  OcrBook,
  OcrBookUpdateRequest,
  OcrBooksListResponse,
  OcrBookStatusPoll,
  OcrChapter,
  OcrChapterCreateRequest,
  OcrChapterUpdateRequest,
  OcrContentCreateRequest,
  OcrContentItem,
  OcrContentUpdateRequest,
  OcrHistoryEntry,
  OcrLesson,
  OcrLessonCreateRequest,
  OcrLessonUpdateRequest,
  OcrLessonContent,
} from '../../types/ocr.types';

// ─── Auth helper ──────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = AuthService.getToken();
  if (!token) throw new Error('Authentication required');
  return { Authorization: `Bearer ${token}` };
}

function ocrApiKeyHeader(): Record<string, string> {
  const key = import.meta.env.VITE_OCR_API_KEY as string | undefined;
  if (key) return { 'X-Internal-API-Key': key };
  return {};
}

function changedByHeader(): Record<string, string> {
  try {
    const token = AuthService.getToken();
    if (!token) return {};
    const decoded = AuthService.decodeToken(token);
    if (decoded?.email) return { 'X-Changed-By': decoded.email };
    if (decoded?.sub) return { 'X-Changed-By': decoded.sub };
    return {};
  } catch {
    return {};
  }
}

// ─── Envelope unwrap ─────────────────────────────────────────────────────────
// Python service wraps everything in { success, message, data, error }

function unwrap<T>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'success' in raw) {
    return (raw as OcrApiResponse<T>).data;
  }
  return raw as T;
}

// Normalize id/_id for all entity types (Python uses 'id', old code used '_id')
function normalizeBook(b: OcrBook): OcrBook {
  return { ...b, id: b.id ?? b._id ?? '' };
}
function normalizeChapter(c: OcrChapter): OcrChapter {
  return { ...c, id: c.id ?? c._id ?? '' };
}
function normalizeLesson(l: OcrLesson): OcrLesson {
  return { ...l, id: l.id ?? l._id ?? '' };
}

async function ocrGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...ocrApiKeyHeader() },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `OCR request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

async function ocrPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...ocrApiKeyHeader(), ...changedByHeader() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `OCR POST failed (${res.status})`);
  }
  const raw: unknown = await res.json();
  return unwrap<T>(raw);
}

async function ocrPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...ocrApiKeyHeader(), ...changedByHeader() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `OCR PATCH failed (${res.status})`);
  }
  const raw: unknown = await res.json();
  return unwrap<T>(raw);
}

async function ocrDelete(path: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: { ...authHeaders(), ...ocrApiKeyHeader(), ...changedByHeader() },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `OCR delete failed (${res.status})`);
  }
}

// ─── Books ────────────────────────────────────────────────────────────────────

async function uploadBook(
  file: File,
  grade: number,
  title: string,
  publisher = ''
): Promise<{ book_id: string }> {
  const form = new FormData();
  form.append('file', file);
  form.append('grade', String(grade));
  form.append('title', title);
  if (publisher) form.append('publisher', publisher);

  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.OCR_BOOK_UPLOAD}`, {
    method: 'POST',
    headers: { ...authHeaders(), ...ocrApiKeyHeader() }, // No Content-Type header — browser sets multipart boundary
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Upload failed (${res.status})`);
  }
  return res.json() as Promise<{ book_id: string }>;
}

async function getBooks(grade?: number): Promise<OcrBooksListResponse> {
  const qs = grade ? `?grade=${grade}` : '';
  const raw = await ocrGet<unknown>(`${API_ENDPOINTS.OCR_BOOKS}${qs}`);
  const data = unwrap<OcrBook[] | { books: OcrBook[]; total?: number }>(raw);
  if (Array.isArray(data)) {
    const books = data.map(normalizeBook);
    return { books, total: books.length };
  }
  const books = (data.books ?? []).map(normalizeBook);
  return { books, total: (data as { total?: number }).total ?? books.length };
}

async function getBookDetail(bookId: string): Promise<OcrBook> {
  const raw = await ocrGet<unknown>(API_ENDPOINTS.OCR_BOOK_DETAIL(bookId));
  return normalizeBook(unwrap<OcrBook>(raw));
}

async function getBookStatus(bookId: string): Promise<OcrBookStatusPoll> {
  const raw = await ocrGet<unknown>(API_ENDPOINTS.OCR_BOOK_STATUS(bookId));
  return unwrap<OcrBookStatusPoll>(raw);
}

async function deleteBook(bookId: string): Promise<void> {
  return ocrDelete(API_ENDPOINTS.OCR_BOOK_DELETE(bookId));
}

async function updateBook(bookId: string, payload: OcrBookUpdateRequest): Promise<OcrBook> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.OCR_BOOK_UPDATE(bookId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...ocrApiKeyHeader(), ...changedByHeader() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Update failed (${res.status})`);
  }
  const raw: unknown = await res.json();
  return normalizeBook(unwrap<OcrBook>(raw));
}

// ─── Export helpers (download) ────────────────────────────────────────────────

async function downloadExport(endpoint: string, filename: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Export failed (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportJson(bookId: string): void {
  void downloadExport(API_ENDPOINTS.OCR_BOOK_EXPORT_JSON(bookId), `book_${bookId}.json`);
}

function exportMarkdown(bookId: string): void {
  void downloadExport(API_ENDPOINTS.OCR_BOOK_EXPORT_MD(bookId), `book_${bookId}.md`);
}

function exportChunks(bookId: string): void {
  void downloadExport(API_ENDPOINTS.OCR_BOOK_EXPORT_CHUNKS(bookId), `book_${bookId}_chunks.json`);
}

// ─── Chapters ─────────────────────────────────────────────────────────────────

async function getBookChapters(bookId: string): Promise<OcrChapter[]> {
  const raw = await ocrGet<unknown>(API_ENDPOINTS.OCR_BOOK_CHAPTERS(bookId));
  const data = unwrap<OcrChapter[] | { chapters: OcrChapter[] }>(raw);
  const arr = Array.isArray(data) ? data : (data as { chapters: OcrChapter[] }).chapters ?? [];
  return arr.map(normalizeChapter);
}

async function updateChapter(chapterId: string, payload: OcrChapterUpdateRequest): Promise<OcrChapter> {
  return normalizeChapter(await ocrPatch<OcrChapter>(API_ENDPOINTS.OCR_CHAPTER_UPDATE(chapterId), payload));
}

async function createChapter(payload: OcrChapterCreateRequest): Promise<OcrChapter> {
  return normalizeChapter(await ocrPost<OcrChapter>(API_ENDPOINTS.OCR_CHAPTER_CREATE, payload));
}

async function deleteChapter(chapterId: string): Promise<void> {
  return ocrDelete(API_ENDPOINTS.OCR_CHAPTER_DELETE(chapterId));
}

async function getChapterHistory(chapterId: string): Promise<OcrHistoryEntry[]> {
  const raw = await ocrGet<unknown>(API_ENDPOINTS.OCR_CHAPTER_HISTORY(chapterId));
  return unwrap<OcrHistoryEntry[]>(raw) ?? [];
}

// ─── Lessons ──────────────────────────────────────────────────────────────────

async function getChapterLessons(chapterId: string): Promise<OcrLesson[]> {
  const raw = await ocrGet<unknown>(API_ENDPOINTS.OCR_CHAPTER_LESSONS(chapterId));
  const data = unwrap<OcrLesson[] | { lessons: OcrLesson[] }>(raw);
  const arr = Array.isArray(data) ? data : (data as { lessons: OcrLesson[] }).lessons ?? [];
  return arr.map(normalizeLesson);
}

async function updateLesson(lessonId: string, payload: OcrLessonUpdateRequest): Promise<OcrLesson> {
  return normalizeLesson(await ocrPatch<OcrLesson>(API_ENDPOINTS.OCR_LESSON_UPDATE(lessonId), payload));
}

async function createLesson(payload: OcrLessonCreateRequest): Promise<OcrLesson> {
  return normalizeLesson(await ocrPost<OcrLesson>(API_ENDPOINTS.OCR_LESSON_CREATE, payload));
}

async function deleteLesson(lessonId: string): Promise<void> {
  return ocrDelete(API_ENDPOINTS.OCR_LESSON_DELETE(lessonId));
}

async function getLessonHistory(lessonId: string): Promise<OcrHistoryEntry[]> {
  const raw = await ocrGet<unknown>(API_ENDPOINTS.OCR_LESSON_HISTORY(lessonId));
  return unwrap<OcrHistoryEntry[]>(raw) ?? [];
}

// ─── Lesson content ───────────────────────────────────────────────────────────

async function getLessonContent(lessonId: string): Promise<OcrLessonContent> {
  const raw = await ocrGet<unknown>(API_ENDPOINTS.OCR_LESSON_CONTENT(lessonId));
  const data = unwrap<OcrContentItem[] | OcrLessonContent | null>(raw);
  if (!data) return { lesson_id: lessonId, title: '', items: [] };
  if (Array.isArray(data)) return { lesson_id: lessonId, title: '', items: data };
  // data is an object — ensure items is always an array
  return { ...data, items: data.items ?? [] };
}

// ─── Content blocks ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

async function createContent(payload: OcrContentCreateRequest): Promise<OcrContentItem> {
  return ocrPost<OcrContentItem>(API_ENDPOINTS.OCR_CONTENT_CREATE, payload);
}

async function updateContent(contentId: string, payload: OcrContentUpdateRequest): Promise<OcrContentItem> {
  return ocrPatch<OcrContentItem>(API_ENDPOINTS.OCR_CONTENT_UPDATE(contentId), payload);
}

async function deleteContent(contentId: string): Promise<void> {
  return ocrDelete(API_ENDPOINTS.OCR_CONTENT_DELETE(contentId));
}

async function getContentHistory(contentId: string): Promise<OcrHistoryEntry[]> {
  const raw = await ocrGet<unknown>(API_ENDPOINTS.OCR_CONTENT_HISTORY(contentId));
  return unwrap<OcrHistoryEntry[]>(raw) ?? [];
}

// ─── Book history ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

async function getBookHistory(bookId: string): Promise<OcrHistoryEntry[]> {
  const raw = await ocrGet<unknown>(API_ENDPOINTS.OCR_BOOK_HISTORY(bookId));
  return unwrap<OcrHistoryEntry[]>(raw) ?? [];
}

async function uploadContentImage(file: File): Promise<{ image_url: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.OCR_CONTENT_IMAGE_UPLOAD}`, {
    method: 'POST',
    headers: { ...authHeaders(), ...ocrApiKeyHeader() },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Image upload failed (${res.status})`);
  }
  const raw: unknown = await res.json();
  return unwrap<{ image_url: string }>(raw);
}

async function uploadBookThumbnail(bookId: string, file: File): Promise<{ thumbnail_url: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.OCR_BOOK_THUMBNAIL(bookId)}`, {
    method: 'POST',
    headers: { ...authHeaders(), ...ocrApiKeyHeader() },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Thumbnail upload failed (${res.status})`);
  }
  const raw: unknown = await res.json();
  return unwrap<{ thumbnail_url: string }>(raw);
}

// ─── Search ───────────────────────────────────────────────────────────────────

async function searchContent(q: string, grade?: number): Promise<unknown[]> {
  const params = new URLSearchParams({ q });
  if (grade) params.append('grade', String(grade));
  return ocrGet<unknown[]>(`${API_ENDPOINTS.OCR_SEARCH}?${params.toString()}`);
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const OcrService = {
  uploadBook,
  getBooks,
  getBookDetail,
  getBookStatus,
  deleteBook,
  updateBook,
  exportJson,
  exportMarkdown,
  exportChunks,
  getBookChapters,
  updateChapter,
  createChapter,
  deleteChapter,
  getChapterHistory,
  getChapterLessons,
  updateLesson,
  createLesson,
  deleteLesson,
  getLessonHistory,
  getLessonContent,
  createContent,
  updateContent,
  deleteContent,
  getContentHistory,
  getBookHistory,
  uploadContentImage,
  uploadBookThumbnail,
  searchContent,
};
