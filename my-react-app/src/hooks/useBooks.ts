import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { BookService } from '../services/api/book.service';
import { BookContentService } from '../services/api/bookContent.service';
import type {
  BookProgressResponse,
  BookSearchParams,
  BulkPageMappingRequest,
  BulkSeriesPageMappingRequest,
  CreateBookRequest,
  UpdateBookRequest,
  UpdateLessonPageRequest,
} from '../types/book.types';
import type { ApiResponse } from '../types';

type BookProgressApi = ApiResponse<BookProgressResponse>;

export const bookKeys = {
  all: ['books'] as const,
  list: (params: BookSearchParams) => [...bookKeys.all, 'list', params] as const,
  detail: (bookId: string) => [...bookKeys.all, 'detail', bookId] as const,
  pdfPreviewUrl: (bookId: string) => [...bookKeys.detail(bookId), 'pdf-preview-url'] as const,
  pageMapping: (bookId: string) => [...bookKeys.all, 'page-mapping', bookId] as const,
  seriesPageMapping: (bookId: string) => [...bookKeys.all, 'series-page-mapping', bookId] as const,
  progress: (bookId: string) => [...bookKeys.all, 'progress', bookId] as const,
  bookContent: (bookId: string) => [...bookKeys.all, 'content', bookId] as const,
  lessonContent: (bookId: string, lessonId: string) =>
    [...bookKeys.all, 'lesson-content', bookId, lessonId] as const,
  page: (bookId: string, lessonId: string, pageNumber: number) =>
    [...bookKeys.all, 'page', bookId, lessonId, pageNumber] as const,
  pageHistory: (bookId: string, lessonId: string, pageNumber: number) =>
    [...bookKeys.all, 'page-history', bookId, lessonId, pageNumber] as const,
};

export function useBookList(
  params: BookSearchParams = {},
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: bookKeys.list(params),
    queryFn: () => BookService.search(params),
    enabled: options?.enabled ?? true,
  });
}

export function useBook(bookId: string | undefined, options?: { enabled?: boolean }) {
  const enabled = Boolean(bookId) && (options?.enabled ?? true);
  return useQuery({
    queryKey: bookKeys.detail(bookId ?? ''),
    queryFn: () => BookService.getById(bookId as string),
    enabled,
  });
}

export function useBookPageMapping(bookId: string | undefined) {
  return useQuery({
    queryKey: bookKeys.pageMapping(bookId ?? ''),
    queryFn: () => BookService.getPageMapping(bookId as string),
    enabled: Boolean(bookId),
  });
}

export function useBookProgress(
  bookId: string | undefined,
  options: {
    refetchInterval?: UseQueryOptions<BookProgressApi, Error>['refetchInterval'];
  } = {}
) {
  return useQuery<BookProgressApi, Error>({
    queryKey: bookKeys.progress(bookId ?? ''),
    queryFn: () => BookService.getProgress(bookId as string),
    enabled: Boolean(bookId),
    refetchInterval: options.refetchInterval,
  });
}

export function useCreateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateBookRequest) => BookService.create(req),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bookKeys.all });
    },
  });
}

export function useUpdateBook(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: UpdateBookRequest) => BookService.update(bookId, req),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
      void qc.invalidateQueries({ queryKey: bookKeys.all });
    },
  });
}

export function useRenameBookSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ seriesId, name }: { seriesId: string; name: string }) =>
      BookService.renameSeries(seriesId, { name }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bookKeys.all });
    },
  });
}

export function useUploadBookPdf(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => BookService.uploadPdf(bookId, file),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
      void qc.invalidateQueries({ queryKey: bookKeys.pdfPreviewUrl(bookId) });
      void qc.invalidateQueries({ queryKey: bookKeys.all });
    },
  });
}

/**
 * Upload an image for an OCR content block (Step-4 verify wizard).
 *
 * The new image URL/key is returned and the caller is responsible for patching it onto the block;
 * page persistence still happens through the existing PATCH page endpoint when admins press Save.
 */
export function useUploadBookPageImage(bookId: string) {
  return useMutation({
    mutationFn: (file: File) => BookService.uploadPageImage(bookId, file),
  });
}

export function useSetBookPdfPath(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pdfPath: string) => BookService.setPdfPath(bookId, pdfPath),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
      void qc.invalidateQueries({ queryKey: bookKeys.pdfPreviewUrl(bookId) });
    },
  });
}

/** Presigned MinIO URL for admin PDF preview; omit when using a local Object URL instead. */
export function useBookPdfPreviewUrl(bookId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: bookKeys.pdfPreviewUrl(bookId ?? ''),
    queryFn: () => BookService.getPdfPreviewUrl(bookId as string),
    enabled: Boolean(bookId) && enabled,
    staleTime: 45 * 60 * 1000,
  });
}

export function useDeleteBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookId: string) => BookService.delete(bookId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bookKeys.all });
    },
  });
}

export function useSavePageMapping(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: BulkPageMappingRequest) => BookService.bulkUpsertPageMapping(bookId, req),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bookKeys.pageMapping(bookId) });
      void qc.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
    },
  });
}

export function useBookSeriesPageMapping(bookId: string | undefined) {
  return useQuery({
    queryKey: bookKeys.seriesPageMapping(bookId ?? ''),
    queryFn: () => BookService.getSeriesPageMapping(bookId as string),
    enabled: Boolean(bookId),
  });
}

export function useSaveSeriesPageMapping(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: BulkSeriesPageMappingRequest) =>
      BookService.bulkUpsertSeriesPageMapping(bookId, req),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bookKeys.seriesPageMapping(bookId) });
      void qc.invalidateQueries({ queryKey: bookKeys.pageMapping(bookId) });
      void qc.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
      void qc.invalidateQueries({ queryKey: bookKeys.all });
    },
  });
}

export function useTriggerOcr(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => BookService.triggerOcr(bookId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
      void qc.invalidateQueries({ queryKey: bookKeys.progress(bookId) });
      void qc.invalidateQueries({ queryKey: bookKeys.bookContent(bookId) });
    },
  });
}

export function useCancelOcr(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => BookService.cancelOcr(bookId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
      void qc.invalidateQueries({ queryKey: bookKeys.progress(bookId) });
      void qc.invalidateQueries({ queryKey: bookKeys.bookContent(bookId) });
    },
  });
}

export function useRefreshVerification(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => BookService.refreshVerification(bookId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
      void qc.invalidateQueries({ queryKey: bookKeys.progress(bookId) });
    },
  });
}

export function useBookContent(bookId: string | undefined) {
  return useQuery({
    queryKey: bookKeys.bookContent(bookId ?? ''),
    queryFn: () => BookContentService.getAllLessonsForBook(bookId as string),
    enabled: Boolean(bookId),
  });
}

export function useLessonContent(bookId: string | undefined, lessonId: string | undefined) {
  return useQuery({
    queryKey: bookKeys.lessonContent(bookId ?? '', lessonId ?? ''),
    queryFn: () =>
      BookContentService.getLessonContentForBook(bookId as string, lessonId as string),
    enabled: Boolean(bookId) && Boolean(lessonId),
  });
}

export function useUpdatePage(bookId: string, lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      pageNumber,
      payload,
    }: {
      pageNumber: number;
      payload: UpdateLessonPageRequest;
    }) => BookContentService.updatePage(bookId, lessonId, pageNumber, payload),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: bookKeys.lessonContent(bookId, lessonId) });
      void qc.invalidateQueries({
        queryKey: bookKeys.page(bookId, lessonId, variables.pageNumber),
      });
      void qc.invalidateQueries({ queryKey: bookKeys.progress(bookId) });
    },
  });
}

export function usePageHistory(
  bookId: string | undefined,
  lessonId: string | undefined,
  pageNumber: number | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: bookKeys.pageHistory(bookId ?? '', lessonId ?? '', pageNumber ?? -1),
    queryFn: () =>
      BookContentService.getPageHistory(
        bookId as string,
        lessonId as string,
        pageNumber as number
      ),
    enabled: Boolean(bookId) && Boolean(lessonId) && Number.isFinite(pageNumber) && enabled,
  });
}
