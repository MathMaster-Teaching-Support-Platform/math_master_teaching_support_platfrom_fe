// Mirrors the Java BE DTOs in
// `com.fptu.math_master.dto.{request,response}` for the textbook OCR pipeline.
// Keep in lockstep with BE — fields are JSON-serialized as-is.

export type BookStatus = 'DRAFT' | 'MAPPING' | 'READY' | 'OCR_RUNNING' | 'OCR_DONE' | 'OCR_FAILED';

export interface BookPdfPreviewUrlResponse {
  url: string;
}

/** Result of uploading an image asset for an OCR content block (Step-4 verify wizard). */
export interface BookPageImageResponse {
  /** Stable, admin-protected URL the FE can save into the block. */
  imageUrl: string;
  /** Underlying MinIO object key — kept for parity with OCR-generated blocks. */
  imagePath: string;
}

export interface BookResponse {
  id: string;
  schoolGradeId: string;
  schoolGradeName: string;
  subjectId: string;
  subjectName: string;
  bookSeriesId?: string | null;
  bookSeriesName?: string | null;
  curriculumId: string | null;
  curriculumName: string | null;
  title: string;
  publisher: string | null;
  academicYear: string | null;
  pdfPath: string | null;
  thumbnailPath: string | null;
  totalPages: number | null;
  ocrPageFrom: number | null;
  ocrPageTo: number | null;
  status: BookStatus;
  ocrError: string | null;
  verified: boolean;
  verifiedAt: string | null;
  mappedLessonCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookRequest {
  schoolGradeId: string;
  subjectId: string;
  bookSeriesId?: string | null;
  curriculumId?: string | null;
  title: string;
  publisher?: string | null;
  academicYear?: string | null;
  totalPages?: number | null;
  ocrPageFrom?: number | null;
  ocrPageTo?: number | null;
}

export interface UpdateBookRequest {
  title?: string | null;
  publisher?: string | null;
  academicYear?: string | null;
  totalPages?: number | null;
  ocrPageFrom?: number | null;
  ocrPageTo?: number | null;
}

export interface UpdateBookSeriesNameRequest {
  name: string;
}

export interface BookSeriesResponse {
  id: string;
  name: string;
}

export interface PageMappingItem {
  lessonId: string;
  pageStart: number;
  pageEnd: number;
}

export interface SeriesPageMappingItem extends PageMappingItem {
  bookId: string;
}

export interface BulkPageMappingRequest {
  mappings: PageMappingItem[];
}

export interface BulkSeriesPageMappingRequest {
  mappings: SeriesPageMappingItem[];
}

export interface BookLessonPageResponse {
  id: string;
  bookSeriesId?: string | null;
  bookId: string;
  bookTitle?: string | null;
  lessonId: string;
  lessonTitle: string;
  chapterId: string;
  chapterTitle: string;
  chapterOrderIndex: number | null;
  lessonOrderIndex: number | null;
  pageStart: number;
  pageEnd: number;
  ocrPageCount: number;
  verifiedPageCount: number;
}

export interface OcrTriggerResponse {
  bookId: string;
  status: BookStatus;
  mappingCount: number;
  totalPagesQueued: number;
  message: string;
}

export interface LessonProgress {
  lessonId: string;
  lessonTitle: string;
  pageStart: number | null;
  pageEnd: number | null;
  totalPages: number;
  verifiedPages: number;
  lessonVerified: boolean;
}

export interface BookProgressResponse {
  bookId: string;
  status: BookStatus;
  bookVerified: boolean;
  totalLessons: number;
  verifiedLessons: number;
  totalPages: number;
  verifiedPages: number;
  /** Mongo/Python runner status while status === OCR_RUNNING (pending | processing | done | error). */
  ocrRunnerStatus?: string | null;
  ocrJobProgressPercent?: number | null;
  ocrJobPhase?: string | null;
  ocrJobProcessedPages?: number | null;
  ocrJobTotalPages?: number | null;
  ocrJobErrorMessage?: string | null;
  /** false = Java BE could not call Python /ocr-status while book was OCR_RUNNING. */
  ocrCrawlerReachable?: boolean | null;
  /** Progress fields filled from Postgres snapshot (BE previously polled crawler successfully). */
  ocrProgressFromCache?: boolean | null;
  ocrProgressCachedAt?: string | null;
  lessons: LessonProgress[];
}

// One OCR-extracted block — variable shape; only relevant fields per type.
export interface ContentBlockDto {
  order?: number;
  type?: string;
  content?: string | null;
  latex?: string | null;
  label?: string | null;
  imageUrl?: string | null;
  imagePath?: string | null;
  thumbnailUrl?: string | null;
  caption?: string | null;
  exerciseType?: string | null;
  exerciseNum?: string | null;
  confidence?: number | null;
  source?: string | null;
}

export interface LessonPageResponse {
  id: string;
  bookId: string;
  lessonId: string;
  pageNumber: number;
  contentBlocks: ContentBlockDto[];
  rawImageUrl: string | null;
  ocrConfidence: number | null;
  ocrSource: string | null;
  verified: boolean;
  verifiedBy: string | null;
  verifiedAt: string | null;
  updatedAt: string | null;
}

export interface LessonContentResponse {
  lessonId: string;
  lessonTitle: string;
  bookId: string | null;
  bookTitle: string | null;
  pages: LessonPageResponse[];
  lessonVerified: boolean;
}

export interface UpdateLessonPageRequest {
  contentBlocks?: ContentBlockDto[] | null;
  verified?: boolean | null;
}

export interface LessonPageHistoryEntryResponse {
  id: string;
  action: string;
  changedBy: string;
  changedAt: string;
  summary: string;
  summaryItems?: string[];
  before?: LessonPageResponse | null;
  after?: LessonPageResponse | null;
}

export interface BookSearchParams {
  schoolGradeId?: string;
  subjectId?: string;
  bookSeriesId?: string;
  curriculumId?: string;
  chapterId?: string;
  lessonId?: string;
  status?: BookStatus;
  page?: number;
  size?: number;
}
