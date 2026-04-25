/**
 * UnifiedLessonItem
 *
 * Lesson item component that works for both enrolled and non-enrolled users
 * Shows clear lock states and access indicators
 */

import { CheckCircle, Clock, Lock, Paperclip, Play } from 'lucide-react';
import React from 'react';
import type { CourseLessonResponse } from '../../types';

export type AccessReason =
  | 'ENROLLED'
  | 'FREE_PREVIEW'
  | 'LOCKED'
  | 'TEACHER_ACCESS'
  | 'ADMIN_ACCESS';

interface UnifiedLessonItemProps {
  lesson: CourseLessonResponse;
  canAccess: boolean;
  accessReason: AccessReason;
  isPlaying?: boolean;
  isCompleted?: boolean;
  onPlay: () => void;
  onEnroll?: () => void;
  showMaterials?: boolean;
  materialsCount?: number;
}

export const UnifiedLessonItem: React.FC<UnifiedLessonItemProps> = ({
  lesson,
  canAccess,
  accessReason,
  isPlaying = false,
  isCompleted = false,
  onPlay,
  onEnroll,
  showMaterials = false,
  materialsCount = 0,
}) => {
  const handleClick = () => {
    if (canAccess) {
      onPlay();
    }
  };

  const getAccessBadge = () => {
    switch (accessReason) {
      case 'FREE_PREVIEW':
        return (
          <span
            className="badge"
            style={{
              background: '#dbeafe',
              color: '#1e40af',
              fontSize: '0.7rem',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 600,
            }}
          >
            ✓ XEM TRƯỚC MIỄN PHÍ
          </span>
        );
      case 'LOCKED':
        return (
          <span
            className="badge"
            style={{
              background: '#f1f5f9',
              color: '#64748b',
              fontSize: '0.7rem',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Lock size={10} /> BỊ KHÓA
          </span>
        );
      case 'TEACHER_ACCESS':
      case 'ADMIN_ACCESS':
        return (
          <span
            className="badge"
            style={{
              background: '#f3e8ff',
              color: '#7c3aed',
              fontSize: '0.7rem',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 600,
            }}
          >
            {accessReason === 'ADMIN_ACCESS' ? 'ADMIN' : 'GIẢNG VIÊN'}
          </span>
        );
      default:
        return null;
    }
  };

  const getIcon = () => {
    if (!canAccess) {
      return <Lock size={16} color="#94a3b8" />;
    }
    if (isCompleted) {
      return <CheckCircle size={16} color="#15803d" />;
    }
    if (isPlaying) {
      return <Play size={16} color="#1f5eff" fill="#1f5eff" />;
    }
    return <Play size={16} color="#60748f" />;
  };

  const getBackgroundColor = () => {
    if (isPlaying) return '#eff6ff';
    if (isCompleted) return '#f0fdf4';
    if (!canAccess) return '#f8fafc';
    return '#fff';
  };

  const getBorderColor = () => {
    if (isPlaying) return '#1f5eff';
    return 'transparent';
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.85rem 1.2rem',
        background: getBackgroundColor(),
        cursor: canAccess ? 'pointer' : 'not-allowed',
        boxShadow: `inset 2px 0 0 ${getBorderColor()}`,
        borderBottom: '1px solid #f1f5f9',
        transition: 'all 0.2s ease',
        opacity: canAccess ? 1 : 0.7,
      }}
      onMouseEnter={(e) => {
        if (canAccess) {
          e.currentTarget.style.background = isPlaying ? '#dbeafe' : '#f8fafc';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = getBackgroundColor();
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isCompleted
            ? '#dcfce7'
            : isPlaying
              ? '#1f5eff'
              : !canAccess
                ? '#e2e8f0'
                : '#e8eef8',
          color: isCompleted ? '#15803d' : isPlaying ? '#fff' : !canAccess ? '#94a3b8' : '#60748f',
        }}
      >
        {getIcon()}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.88rem',
            fontWeight: isPlaying || isCompleted ? 700 : 600,
            color: isPlaying ? '#1e40af' : !canAccess ? '#94a3b8' : 'var(--mod-ink)',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {lesson.videoTitle ?? lesson.lessonTitle ?? 'Bài học'}
          </span>
          {getAccessBadge()}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {lesson.durationSeconds && (
            <span
              className="muted"
              style={{
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: !canAccess ? '#cbd5e1' : '#64748b',
              }}
            >
              <Clock size={11} />
              {Math.floor(lesson.durationSeconds / 60)} phút
            </span>
          )}
          {showMaterials && materialsCount > 0 && (
            <span
              style={{
                fontSize: '0.75rem',
                color: !canAccess ? '#cbd5e1' : '#6366f1',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <Paperclip size={11} /> {materialsCount} tài liệu
            </span>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div style={{ flexShrink: 0 }}>
        {canAccess && (
          <button
            className="btn secondary"
            style={{
              padding: '0.4rem 0.8rem',
              fontSize: '0.75rem',
              height: 'fit-content',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
          >
            <Play size={12} /> Xem
          </button>
        )}
        {!canAccess && onEnroll && (
          <button
            className="btn primary"
            style={{
              padding: '0.4rem 0.8rem',
              fontSize: '0.75rem',
              height: 'fit-content',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#1f5eff',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onEnroll();
            }}
          >
            <Lock size={12} /> Đăng ký
          </button>
        )}
      </div>
    </div>
  );
};

export default UnifiedLessonItem;
