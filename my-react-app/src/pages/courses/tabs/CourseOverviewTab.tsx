import React from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Image,
  Languages,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CourseResponse } from '../../../types';
import './CourseOverviewTab.css';
import { UI_TEXT } from '../../../constants/uiText';

interface CourseOverviewTabProps {
  course: CourseResponse;
}

function MetaRow({
  icon: Icon,
  label,
  children,
}: Readonly<{
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}>) {
  return (
    <div className="course-overview-tab__row">
      <span className="course-overview-tab__row-label">
        <Icon aria-hidden />
        {label}
      </span>
      <div className="course-overview-tab__row-value">{children}</div>
    </div>
  );
}

const CourseOverviewTab: React.FC<CourseOverviewTabProps> = ({ course }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const statSets = [
    {
      key: 'lessons',
      cardClass: 'stat-blue' as const,
      Icon: BookOpen,
      label: 'Bài học',
      value: course.lessonsCount.toLocaleString('vi-VN'),
      sub: `trong ${UI_TEXT.COURSE.toLowerCase()}`,
    },
    {
      key: 'students',
      cardClass: 'stat-emerald' as const,
      Icon: Users,
      label: 'Học viên',
      value: course.studentsCount.toLocaleString('vi-VN'),
      sub: 'đã ghi danh',
    },
    {
      key: 'rating',
      cardClass: 'stat-amber' as const,
      Icon: Star,
      label: 'Đánh giá',
      value: Number(course.rating).toFixed(1),
      sub: 'trên 5.0',
    },
    {
      key: 'status',
      cardClass: 'stat-violet' as const,
      Icon: course.published ? Eye : CheckCircle2,
      label: 'Trạng thái',
      value: course.published ? 'Công khai' : 'Nháp',
      sub: course.published ? 'hiển thị cho học viên' : 'chỉ bạn thấy',
    },
  ];

  const hasDesc = Boolean(course.description);
  const hasThumb = Boolean(course.thumbnailUrl);
  const grid2Split = hasDesc && hasThumb;

  return (
    <div className="course-overview-tab">
      <div className="stats-grid">
        {statSets.map((stat, index) => (
          <div
            key={stat.key}
            className={`stat-card ${stat.cardClass}`}
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className="stat-icon-wrap" aria-hidden>
              <stat.Icon size={20} />
            </div>
            <div className="stat-card__text">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
              <span className="stat-card__sub">{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <section className="course-overview-tab__summary" aria-label="Tóm tắt nhanh">
        <div className="course-overview-tab__summary-pill">
          <span className="course-overview-tab__summary-label">Video</span>
          <strong className="course-overview-tab__summary-value">
            {course.totalVideoHours ?? 0} giờ
          </strong>
        </div>
        <div className="course-overview-tab__summary-pill">
          <span className="course-overview-tab__summary-label">Tải về</span>
          <strong className="course-overview-tab__summary-value">{course.resourcesCount ?? 0}</strong>
        </div>
        <div className="course-overview-tab__summary-pill course-overview-tab__summary-pill--wide">
          <span className="course-overview-tab__summary-label">Cập nhật</span>
          <strong className="course-overview-tab__summary-value course-overview-tab__summary-value--sm">
            {formatDate(course.updatedAt)}
          </strong>
        </div>
      </section>

      <div className="course-overview-tab__config">
        <div className="course-overview-tab__config-head">
          <p className="course-overview-tab__kicker">Hồ sơ {UI_TEXT.COURSE.toLowerCase()}</p>
          <h2 className="course-overview-config-heading">Thông tin cấu hình</h2>
          <p className="course-overview-tab__lede">
            Chi tiết phân loại, thời lượng, tài nguyên và mốc thời gian.
          </p>
        </div>

        <div className="course-overview-tab__config-body">
          <MetaRow icon={Sparkles} label={`Loại ${UI_TEXT.COURSE.toLowerCase()}`}>
            {course.provider === 'CUSTOM' ? (
              <span className="course-overview-tab__badge course-overview-tab__badge--custom">Khóa học tùy chỉnh</span>
            ) : (
              <span className="course-overview-tab__badge course-overview-tab__badge--ministry">Chương trình Bộ GD</span>
            )}
          </MetaRow>

          {course.provider === 'MINISTRY' && (
            <>
              <MetaRow icon={GraduationCap} label="Môn học">
                <strong>{course.subjectName || '—'}</strong>
              </MetaRow>
              <MetaRow icon={BookOpen} label="Khối lớp">
                <strong>Khối {course.gradeLevel}</strong>
              </MetaRow>
            </>
          )}

          <MetaRow icon={Users} label="Giáo viên">
            <strong>{course.teacherName || 'Bạn'}</strong>
          </MetaRow>

          <MetaRow icon={Languages} label="Ngôn ngữ">
            {course.language || 'Tiếng Việt'}
          </MetaRow>

          <MetaRow icon={Clock} label="Tổng giờ video">
            <strong>
              {course.totalVideoHours ?? 0} giờ
            </strong>
          </MetaRow>

          <MetaRow icon={Download} label="Tài nguyên tải về">
            <strong>
              {course.resourcesCount ?? 0} tài nguyên
            </strong>
          </MetaRow>

          <MetaRow icon={FileText} label="Bài đọc (Articles)">
            <strong>
              {course.articlesCount ?? 0} bài
            </strong>
          </MetaRow>

          <MetaRow icon={Calendar} label="Ngày tạo">
            <strong>{formatDate(course.createdAt)}</strong>
          </MetaRow>

          <MetaRow icon={Calendar} label="Cập nhật lần cuối">
            <strong>{formatDate(course.updatedAt)}</strong>
          </MetaRow>
        </div>
      </div>

      {(hasDesc || hasThumb) && (
        <div
          className={
            grid2Split
              ? 'course-overview-tab__grid2 course-overview-tab__grid2--split'
              : 'course-overview-tab__grid2'
          }
        >
          {hasDesc && (
            <div className="course-overview-tab__panel">
              <div className="course-overview-tab__panel-head">
                <h2 className="course-overview-tab__panel-title">Mô tả</h2>
                <p className="course-overview-tab__panel-mute">Lời giới thiệu dành cho học viên</p>
              </div>
              <div className="course-overview-tab__panel-body">
                <p className="course-overview-tab__body-serif">{course.description}</p>
              </div>
            </div>
          )}

          {hasThumb && (
            <div
              className={
                hasDesc
                  ? 'course-overview-tab__panel'
                  : 'course-overview-tab__panel course-overview-tab__panel--thumb-only'
              }
            >
              <div className="course-overview-tab__panel-head course-overview-tab__panel-head--row">
                <h2 className="course-overview-tab__panel-title">Ảnh bìa</h2>
                <span className="course-overview-tab__thumb-hint">
                  <Image aria-hidden />
                  Xem trước
                </span>
              </div>
              <div className="course-overview-tab__thumb-pad">
                <div className="course-overview-tab__img-frame">
                  <img
                    src={course.thumbnailUrl ?? ''}
                    alt={course.title}
                    className="course-overview-tab__img"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseOverviewTab;
