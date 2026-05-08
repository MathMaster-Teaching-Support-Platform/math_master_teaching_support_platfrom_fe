import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LessonDiscussionService } from '../services/api/lessonDiscussion.service';

const PAGE_SIZE = 10;

export const lessonDiscussionKeys = {
  all: ['lesson-discussion'] as const,
  root: (courseId: string, lessonId: string) =>
    [...lessonDiscussionKeys.all, 'root', courseId, lessonId] as const,
  replies: (courseId: string, lessonId: string, commentId: string) =>
    [...lessonDiscussionKeys.all, 'replies', courseId, lessonId, commentId] as const,
};

export function useRootDiscussionComments(courseId: string, lessonId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: lessonDiscussionKeys.root(courseId, lessonId),
    queryFn: ({ pageParam = 0 }) =>
      LessonDiscussionService.getRootComments(courseId, lessonId, Number(pageParam), PAGE_SIZE),
    enabled: enabled && !!courseId && !!lessonId,
    getNextPageParam: (lastPage) =>
      (lastPage.result.number ?? 0) + 1 >= (lastPage.result.totalPages ?? 0)
        ? undefined
        : (lastPage.result.number ?? 0) + 1,
    initialPageParam: 0,
    refetchInterval: 5000,
  });
}

export function useDiscussionReplies(
  courseId: string,
  lessonId: string,
  commentId: string,
  enabled = true
) {
  return useInfiniteQuery({
    queryKey: lessonDiscussionKeys.replies(courseId, lessonId, commentId),
    queryFn: ({ pageParam = 0 }) =>
      LessonDiscussionService.getReplies(courseId, lessonId, commentId, Number(pageParam), PAGE_SIZE),
    enabled: enabled && !!courseId && !!lessonId && !!commentId,
    getNextPageParam: (lastPage) =>
      (lastPage.result.number ?? 0) + 1 >= (lastPage.result.totalPages ?? 0)
        ? undefined
        : (lastPage.result.number ?? 0) + 1,
    initialPageParam: 0,
    refetchInterval: 5000,
  });
}

export function useCreateDiscussionComment(courseId: string, lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { content: string; parentId?: string }) =>
      LessonDiscussionService.createComment(courseId, lessonId, data),
    onSuccess: (_res, variables) => {
      if (variables.parentId) {
        qc.invalidateQueries({
          queryKey: lessonDiscussionKeys.replies(courseId, lessonId, variables.parentId),
        });
      }
      qc.invalidateQueries({ queryKey: lessonDiscussionKeys.root(courseId, lessonId) });
    },
  });
}

export function useUpdateDiscussionComment(courseId: string, lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      LessonDiscussionService.updateComment(courseId, lessonId, commentId, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: lessonDiscussionKeys.root(courseId, lessonId) });
    },
  });
}

export function useDeleteDiscussionComment(courseId: string, lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => LessonDiscussionService.deleteComment(courseId, lessonId, commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: lessonDiscussionKeys.root(courseId, lessonId) });
    },
  });
}

export function useToggleDiscussionLike(courseId: string, lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => LessonDiscussionService.toggleLike(courseId, lessonId, commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: lessonDiscussionKeys.root(courseId, lessonId) });
    },
  });
}
