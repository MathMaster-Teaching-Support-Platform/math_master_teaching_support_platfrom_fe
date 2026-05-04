/**
 * Shared utility for course-material parsing + download.
 *
 * Replaces two near-identical implementations in StudentLessonsTab and the
 * teacher CourseLessonsTab. Lifting them into one place fixes three bugs at
 * once:
 *
 *  1. The old per-tab `toSafeMaterial` silently dropped any material whose
 *     `url` wasn't an absolute https URL — entries with a `key` (the normal
 *     server-side shape) disappeared from the UI and the user saw nothing.
 *     The new parser keeps any material that has an `id`.
 *
 *  2. The old download handler had a "URL fast path" (`triggerFileDownload(material.url)`)
 *     that opened a `<a target=_blank>` without an Authorization header. Any
 *     URL that wasn't already presigned 403'd in a new tab. We now always go
 *     through the authenticated `/download` endpoint.
 *
 *  3. Both old paths revoked the blob URL after a fixed `setTimeout(_, 1000)`,
 *     which truncated downloads on slow connections. We revoke after the
 *     click event has dispatched plus a generous safety net.
 */

import { CourseService } from '../services/api/course.service';

export type LessonMaterial = {
  id?: string;
  name?: string;
  /** Storage key (MinIO object key) — opaque to the FE. */
  key?: string;
  /** Optional pre-resolved absolute URL. Newer BE versions don't return this. */
  url?: string;
  size?: number;
  contentType?: string;
  uploadedAt?: string;
};

export const toSafeMaterial = (raw: unknown): LessonMaterial | null => {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const id = typeof r.id === 'string' && r.id.trim() ? r.id.trim() : undefined;
  const name =
    (typeof r.name === 'string' && r.name.trim() ? r.name.trim() : undefined) ||
    (typeof r.fileName === 'string' && r.fileName.trim() ? (r.fileName as string).trim() : undefined);
  const key = typeof r.key === 'string' && r.key.trim() ? r.key.trim() : undefined;
  const rawUrl = typeof r.url === 'string' ? r.url.trim() : '';
  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : undefined;
  const size = typeof r.size === 'number' && Number.isFinite(r.size) ? r.size : undefined;
  const contentType =
    typeof r.contentType === 'string' && r.contentType.trim() ? r.contentType.trim() : undefined;
  const uploadedAt =
    typeof r.uploadedAt === 'string' && r.uploadedAt.trim() ? r.uploadedAt.trim() : undefined;

  // Anything with an id is downloadable via the authenticated endpoint, even
  // when no url was returned. We no longer drop those silently.
  if (!id && !url) return null;

  return { id, name, key, url, size, contentType, uploadedAt };
};

export const parseLessonMaterials = (materials?: string | null): LessonMaterial[] => {
  if (!materials) return [];
  try {
    const parsed = JSON.parse(materials);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(toSafeMaterial)
      .filter((m): m is LessonMaterial => Boolean(m));
  } catch {
    return [];
  }
};

export const formatBytes = (bytes?: number): string => {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 100 ? 0 : 1)} ${units[i]}`;
};

/**
 * Returns a short, human-readable kind label inferred from filename / mime
 * type. Used to label material cards (e.g. "PDF", "DOCX", "ZIP"). Falls back
 * to "FILE" rather than guessing wildly.
 */
export const inferFileKind = (m: LessonMaterial): string => {
  const ext = (m.name || '').split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'PDF';
  if (ext === 'doc' || ext === 'docx') return 'DOC';
  if (ext === 'xls' || ext === 'xlsx' || ext === 'csv') return 'XLS';
  if (ext === 'ppt' || ext === 'pptx') return 'PPT';
  if (ext === 'zip' || ext === 'rar' || ext === '7z') return 'ZIP';
  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'webp') {
    return 'IMG';
  }
  if (ext === 'mp4' || ext === 'mov' || ext === 'webm') return 'VIDEO';
  return 'FILE';
};

/**
 * Maps the BE error code we care about to a Vietnamese-friendly message. The
 * caller falls back to the server-provided message if the code is unknown.
 */
export const messageForMaterialError = (
  payload: { code?: number; message?: string } | undefined,
  fallback = 'Không thể tải tài liệu.'
): string => {
  switch (payload?.code) {
    case 1214:
      return 'Bạn cần đăng ký khóa học để tải tài liệu.';
    case 1215:
      return 'Đăng ký của bạn đang tạm ngưng. Vui lòng liên hệ giáo viên để kích hoạt lại.';
    case 1216:
      return 'Hệ thống lưu trữ đang gặp sự cố. Vui lòng thử lại sau ít phút.';
    case 1006:
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.';
    default:
      return payload?.message || fallback;
  }
};

type ErrorWithResponse = Error & { response?: { data?: { code?: number; message?: string } } };

const isErrorWithResponse = (e: unknown): e is ErrorWithResponse =>
  e instanceof Error && 'response' in e && typeof (e as ErrorWithResponse).response === 'object';

/**
 * Authenticated, error-mapped, race-free material download.
 *
 * Always calls the BE `/download` endpoint with the bearer token. The blob URL
 * is revoked after the click event dispatches via two phases: a microtask flush
 * to release the URL the browser already started consuming, plus a 30 s safety
 * net for slow networks. The previous fixed 1 s timeout truncated large PDFs
 * mid-stream.
 */
export async function downloadCourseMaterial(
  courseId: string,
  lessonId: string,
  material: LessonMaterial
): Promise<{ ok: true } | { ok: false; message: string; code?: number }> {
  if (!material.id) {
    return {
      ok: false,
      message: 'Tài liệu chưa có mã định danh hợp lệ. Vui lòng tải lại trang và thử lại.',
    };
  }

  let blob: Blob;
  let filename: string | undefined;
  try {
    const res = await CourseService.downloadMaterial(courseId, lessonId, material.id);
    blob = res.blob;
    filename = res.filename;
  } catch (e) {
    const data = isErrorWithResponse(e) ? e.response?.data : undefined;
    return {
      ok: false,
      message: messageForMaterialError(data, e instanceof Error ? e.message : undefined),
      code: data?.code,
    };
  }

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.rel = 'noopener noreferrer';
  link.download = filename || material.name || 'tai-lieu';
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Revoke after the navigation has been kicked off. Using a microtask plus a
  // long safety net avoids the slow-connection truncation we saw before.
  queueMicrotask(() => URL.revokeObjectURL(objectUrl));
  setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);

  return { ok: true };
}

/**
 * Downloads every material attached to a lesson as a single zip. Same auth +
 * error mapping as {@link downloadCourseMaterial}.
 */
export async function downloadAllCourseMaterials(
  courseId: string,
  lessonId: string,
  fallbackFilename = 'tai-lieu.zip'
): Promise<{ ok: true } | { ok: false; message: string; code?: number }> {
  let blob: Blob;
  let filename: string | undefined;
  try {
    const res = await CourseService.downloadAllMaterials(courseId, lessonId);
    blob = res.blob;
    filename = res.filename;
  } catch (e) {
    const data = isErrorWithResponse(e) ? e.response?.data : undefined;
    return {
      ok: false,
      message: messageForMaterialError(data, e instanceof Error ? e.message : undefined),
      code: data?.code,
    };
  }

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.rel = 'noopener noreferrer';
  link.download = filename || fallbackFilename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  queueMicrotask(() => URL.revokeObjectURL(objectUrl));
  setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
  return { ok: true };
}
