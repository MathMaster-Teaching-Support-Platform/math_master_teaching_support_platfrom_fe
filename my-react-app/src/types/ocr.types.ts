// ─── OCR / Crawl-Data Types ───────────────────────────────────────────────────
// Maps to the Python FastAPI service response shapes

export type OcrBookStatus = 'pending' | 'processing' | 'done' | 'error';

export interface OcrBook {
  id: string;   // Python service uses 'id'
  _id?: string; // fallback alias
  title: string;
  grade: number;
  publisher: string;
  academic_year?: string;
  status: OcrBookStatus;
  progress: number; // 0–100
  current_phase?: string;
  total_pages: number;
  processed_pages: number;
  chapter_count?: number;
  lesson_count?: number;
  gemini_calls?: number;
  error_message?: string;
  created_at: string;
  updated_at?: string;
  updated_by?: string;
  thumbnail_url?: string;
}

export interface OcrBookStatusPoll {
  book_id: string;
  status: OcrBookStatus;
  progress: number;
  current_phase: string;
  processed_pages: number;
  total_pages: number;
  error_message?: string;
}

// Python API envelope: { success, message, data, error }
export interface OcrApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error: string | null;
}

export interface OcrBooksListResponse {
  books: OcrBook[];
  total: number;
}

export interface OcrBookUpdateRequest {
  title?: string;
  grade?: number;
  publisher?: string;
  academic_year?: string;
}

export interface OcrChapterUpdateRequest {
  title?: string;
  roman_index?: string;
}

export interface OcrChapterCreateRequest {
  book_id: string;
  title: string;
  roman_index?: string;
  chapter_index?: number;
}

export interface OcrLessonUpdateRequest {
  title?: string;
}

export interface OcrLessonCreateRequest {
  chapter_id: string;
  title: string;
  lesson_index?: number;
}

export interface OcrContentUpdateRequest {
  type?: string;
  content?: string;
  label?: string;
  latex?: string;
  image_url?: string;
  caption?: string;
  exercise_type?: string;
  exercise_num?: number;
}

export interface OcrContentCreateRequest {
  lesson_id: string;
  type: OcrContentItemType;
  content?: string;
  label?: string;
  latex?: string;
  image_url?: string;
  caption?: string;
  order?: number;
}

export interface OcrHistoryEntry {
  id: string;
  entity_type: 'chapter' | 'lesson' | 'content';
  entity_id: string;
  book_id: string;
  action: 'create' | 'update' | 'delete';
  changed_by: string;
  changed_at: string;  // ISO
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  summary: string;
}

export interface OcrChapter {
  id: string;
  _id?: string;
  book_id: string;
  title: string;
  chapter_index: number;   // 1, 2, 3 …
  roman_index: string;     // "I", "II", "III" …
  page_start?: number;
  updated_at?: string;
  updated_by?: string;
}

export interface OcrLesson {
  id: string;
  _id?: string;
  chapter_id: string;
  title: string;
  lesson_index: number;
  page_start?: number;
  updated_at?: string;
  updated_by?: string;
}

export type OcrContentItemType =
  | 'text'
  | 'formula'
  | 'image'
  | 'definition'
  | 'example'
  | 'exercise'
  | 'note'
  | 'heading';

export interface OcrContentItem {
  id: string;
  order?: number;
  type: OcrContentItemType;
  content: string;
  label?: string;
  latex?: string;
  image_url?: string;
  image_path?: string;
  thumbnail_url?: string;
  caption?: string;
  exercise_type?: string;
  exercise_num?: number;
  confidence?: number;
  source?: string;
  updated_at?: string;
  updated_by?: string;
}

export interface OcrLessonContent {
  lesson_id: string;
  title: string;
  items: OcrContentItem[];
}
