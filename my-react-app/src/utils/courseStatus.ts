import { AlertCircle, CheckCircle2, Eye, EyeOff, BookOpen } from 'lucide-react';
import type { CourseResponse } from '../types/course.types';

export interface StatusBadge {
  className: string;
  label: string;
  icon: any;
}

/**
 * Get standardized course status badge configuration
 */
export const getCourseStatusBadge = (course: CourseResponse): StatusBadge => {
  if (course.status === 'PENDING_REVIEW') {
    return { className: 'badge-review', label: 'Chờ duyệt', icon: CheckCircle2 };
  }
  if (course.status === 'REJECTED') {
    return { className: 'badge-rejected', label: 'Bị từ chối', icon: AlertCircle };
  }
  if (course.status === 'PUBLISHED' && course.published) {
    return { className: 'badge-live', label: 'Công khai', icon: Eye };
  }
  if (course.status === 'ARCHIVED') {
    return { className: 'badge-archived', label: 'Đã lưu trữ', icon: BookOpen };
  }
  return { className: 'badge-draft', label: 'Nháp', icon: EyeOff };
};

/**
 * Check if course is available for enrollment
 */
export const isCourseAvailableForEnrollment = (course: CourseResponse): boolean => {
  return course.published && course.status === 'PUBLISHED';
};

/**
 * Check if course can be submitted for review
 */
export const canSubmitForReview = (course: CourseResponse): boolean => {
  return (
    (course.status === 'DRAFT' || course.status === 'REJECTED') &&
    course.lessonsCount > 0 &&
    (!course.discountedPrice || !course.originalPrice || course.discountedPrice < course.originalPrice)
  );
};

/**
 * Get user-friendly error message for course status
 */
export const getCourseStatusError = (course: CourseResponse): string | null => {
  if (!course.published) {
    return 'Khóa học này chưa được xuất bản.';
  }
  if (course.status === 'PENDING_REVIEW') {
    return 'Khóa học đang chờ duyệt.';
  }
  if (course.status === 'REJECTED') {
    return 'Khóa học đã bị từ chối.';
  }
  if (course.status === 'DRAFT') {
    return 'Khóa học đang ở trạng thái nháp.';
  }
  return null;
};
