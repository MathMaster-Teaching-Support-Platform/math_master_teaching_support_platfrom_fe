import { ChevronDown, ChevronUp, Heart, MessageCircle, Send, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import {
  useCreateDiscussionComment,
  useDeleteDiscussionComment,
  useDiscussionReplies,
  useRootDiscussionComments,
  useToggleDiscussionLike,
  useUpdateDiscussionComment,
} from '../../hooks/useLessonDiscussion';
import type { LessonDiscussionCommentResponse } from '../../types';

interface LessonDiscussionPanelProps {
  courseId: string;
  lessonId: string;
}

const MAX_DEPTH = 2;

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });

function RepliesBlock({
  courseId,
  lessonId,
  parentComment,
  depth,
}: Readonly<{
  courseId: string;
  lessonId: string;
  parentComment: LessonDiscussionCommentResponse;
  depth: number;
}>) {
  const [expanded, setExpanded] = useState(false);
  const repliesQuery = useDiscussionReplies(courseId, lessonId, parentComment.id, expanded);
  const replies = useMemo(
    () => repliesQuery.data?.pages.flatMap((page) => page.result.content ?? []) ?? [],
    [repliesQuery.data]
  );

  if (!parentComment.replyCount) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-800"
        onClick={() => setExpanded((prev) => !prev)}
      >
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {expanded ? 'Ẩn phản hồi' : `Xem phản hồi (${parentComment.replyCount})`}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 border-l border-slate-200 pl-3">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              courseId={courseId}
              lessonId={lessonId}
              depth={depth + 1}
            />
          ))}
          {repliesQuery.hasNextPage && (
            <button
              type="button"
              className="text-xs text-[#C96442] hover:underline"
              onClick={() => void repliesQuery.fetchNextPage()}
            >
              Tải thêm phản hồi
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  courseId,
  lessonId,
  depth,
}: Readonly<{
  comment: LessonDiscussionCommentResponse;
  courseId: string;
  lessonId: string;
  depth: number;
}>) {
  const { showToast } = useToast();
  const [showReplyEditor, setShowReplyEditor] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showEditEditor, setShowEditEditor] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  const createComment = useCreateDiscussionComment(courseId, lessonId);
  const updateComment = useUpdateDiscussionComment(courseId, lessonId);
  const deleteComment = useDeleteDiscussionComment(courseId, lessonId);
  const toggleLike = useToggleDiscussionLike(courseId, lessonId);

  const submitReply = () => {
    if (!replyText.trim()) return;
    createComment.mutate(
      { content: replyText.trim(), parentId: comment.id },
      {
        onSuccess: () => {
          setReplyText('');
          setShowReplyEditor(false);
        },
        onError: (e) =>
          showToast({
            type: 'error',
            message: e instanceof Error ? e.message : 'Không thể phản hồi',
          }),
      }
    );
  };

  const submitEdit = () => {
    if (!editText.trim()) return;
    updateComment.mutate(
      { commentId: comment.id, content: editText.trim() },
      {
        onSuccess: () => setShowEditEditor(false),
        onError: (e) =>
          showToast({
            type: 'error',
            message: e instanceof Error ? e.message : 'Không thể chỉnh sửa',
          }),
      }
    );
  };

  return (
    <div className="rounded-xl border border-[#E8E6DC] bg-white p-3">
      <div className="flex items-start gap-3">
        <img
          src={comment.authorAvatar || 'https://placehold.co/40x40?text=U'}
          alt={comment.authorName}
          className="h-9 w-9 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-800">{comment.authorName}</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 uppercase">
              {comment.authorRole}
            </span>
            <span>{formatTime(comment.createdAt)}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{comment.content}</p>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            <button
              type="button"
              className={`inline-flex items-center gap-1 ${
                comment.likedByCurrentUser ? 'text-rose-600' : 'text-slate-600'
              }`}
              onClick={() => toggleLike.mutate(comment.id)}
            >
              <Heart size={13} /> {comment.likesCount}
            </button>

            {depth < MAX_DEPTH && !comment.deleted && (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-slate-600"
                onClick={() => setShowReplyEditor((prev) => !prev)}
              >
                <MessageCircle size={13} /> Reply
              </button>
            )}

            {comment.canEdit && !comment.deleted && (
              <button
                type="button"
                className="text-slate-600"
                onClick={() => setShowEditEditor((prev) => !prev)}
              >
                Edit
              </button>
            )}

            {comment.canDelete && !comment.deleted && (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-rose-600"
                onClick={() => deleteComment.mutate(comment.id)}
              >
                <Trash2 size={13} /> Delete
              </button>
            )}
          </div>

          {showReplyEditor && (
            <div className="mt-2 flex gap-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Viết phản hồi..."
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                className="rounded-lg bg-[#C96442] px-3 py-2 text-white"
                onClick={submitReply}
              >
                <Send size={14} />
              </button>
            </div>
          )}

          {showEditEditor && (
            <div className="mt-2 flex gap-2">
              <input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                className="rounded-lg bg-[#C96442] px-3 py-2 text-white"
                onClick={submitEdit}
              >
                Lưu
              </button>
            </div>
          )}

          <RepliesBlock
            courseId={courseId}
            lessonId={lessonId}
            parentComment={comment}
            depth={depth}
          />
        </div>
      </div>
    </div>
  );
}

export default function LessonDiscussionPanel({
  courseId,
  lessonId,
}: Readonly<LessonDiscussionPanelProps>) {
  const { showToast } = useToast();
  const [content, setContent] = useState('');
  const commentsQuery = useRootDiscussionComments(courseId, lessonId, !!courseId && !!lessonId);
  const createComment = useCreateDiscussionComment(courseId, lessonId);

  const comments = useMemo(
    () => commentsQuery.data?.pages.flatMap((page) => page.result.content ?? []) ?? [],
    [commentsQuery.data]
  );

  const submitComment = () => {
    if (!content.trim()) return;
    createComment.mutate(
      { content: content.trim() },
      {
        onSuccess: () => setContent(''),
        onError: (e) =>
          showToast({
            type: 'error',
            message: e instanceof Error ? e.message : 'Không thể gửi bình luận',
          }),
      }
    );
  };

  return (
    <div className="mt-5 rounded-2xl border border-[#E8E6DC] bg-white p-4">
      <h4 className="mb-3 font-semibold text-slate-800">Thảo luận bài học</h4>

      <div className="mb-4 flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Viết bình luận"
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <button
          type="button"
          className="rounded-xl bg-[#C96442] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          onClick={submitComment}
          disabled={createComment.isPending || !content.trim()}
        >
          Gửi
        </button>
      </div>

      <div className="space-y-3">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            courseId={courseId}
            lessonId={lessonId}
            depth={0}
          />
        ))}
      </div>

      {commentsQuery.hasNextPage && (
        <button
          type="button"
          className="mt-3 text-sm text-[#C96442] hover:underline"
          onClick={() => void commentsQuery.fetchNextPage()}
        >
          Tải thêm bình luận
        </button>
      )}
    </div>
  );
}
