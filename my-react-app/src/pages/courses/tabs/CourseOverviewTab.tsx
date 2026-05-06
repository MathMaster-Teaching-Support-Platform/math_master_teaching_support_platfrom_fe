import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  Clock,
  Download,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Languages,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import React from 'react';
import { UI_TEXT } from '../../../constants/uiText';
import type { CourseResponse } from '../../../types';
import './CourseOverviewTab.css';

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

  const statusStat = (() => {
    const s = course.status;
    if (s === 'PENDING_REVIEW') {
      return {
        Icon: Clock,
        value: 'Chờ duyệt',
        sub: 'Đang chờ admin phê duyệt',
      };
    }
    if (s === 'REJECTED') {
      return {
        Icon: AlertCircle,
        value: 'Từ chối',
        sub: 'Chưa được công khai',
      };
    }
    if (s === 'PUBLISHED') {
      return {
        Icon: Eye,
        value: 'Công khai',
        sub: 'Học viên có thể đăng ký',
      };
    }
    if (s === 'DRAFT') {
      return {
        Icon: EyeOff,
        value: 'Nháp',
        sub: 'Chưa xuất bản',
      };
    }
    return {
      Icon: course.published ? Eye : EyeOff,
      value: course.published ? 'Công khai' : 'Nháp',
      sub: course.published ? 'Hiển thị cho học viên' : 'Chưa công khai',
    };
  })();

  const statSets = [
    {
      key: 'lessons',
      cardClass: 'stat-blue' as const,
      Icon: BookOpen,
      label: 'Bài học',
      value: course.lessonsCount.toLocaleString('vi-VN'),
      sub: `Trong ${UI_TEXT.COURSE.toLowerCase()}`,
    },
    {
      key: 'students',
      cardClass: 'stat-emerald' as const,
      Icon: Users,
      label: 'Học viên',
      value: course.studentsCount.toLocaleString('vi-VN'),
      sub: 'Đã ghi danh',
    },
    {
      key: 'rating',
      cardClass: 'stat-amber' as const,
      Icon: Star,
      label: 'Đánh giá',
      value: Number(course.rating).toFixed(1),
      sub: 'Điểm TB / 5',
    },
    {
      key: 'status',
      cardClass: 'stat-violet' as const,
      Icon: statusStat.Icon,
      label: 'Trạng thái',
      value: statusStat.value,
      sub: statusStat.sub,
    },
  ];

  const hasDesc = Boolean(course.description);

  return (
    <div className="course-overview-tab">
      {/* Provider Banner */}
      {course.provider === 'CUSTOM' ? (
        <div className="course-overview-banner custom">
          <div className="course-overview-banner__icon">
            <Sparkles size={24} />
          </div>
          <div className="course-overview-banner__content">
            <h4>Khóa học mở rộng (Tùy chỉnh)</h4>
            <p>
              Khóa học này do bạn tự thiết kế cấu trúc bài giảng, không bị ràng buộc bởi khung
              chương trình cố định.
            </p>
          </div>
        </div>
      ) : (
        <div className="course-overview-banner ministry">
          <div className="course-overview-banner__icon">
            <BookOpen size={24} />
          </div>
          <div className="course-overview-banner__content">
            <h4>Chương trình chuẩn của Bộ GD&ĐT</h4>
            <p>Khóa học tuân theo cấu trúc môn học và lớp chính thức từ Bộ Giáo Dục và Đào Tạo.</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
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

      <div className="course-overview-tab__config">
        <div className="course-overview-tab__config-head">
          <p className="course-overview-tab__kicker">Hồ sơ {UI_TEXT.COURSE.toLowerCase()}</p>
          <h2 className="course-overview-config-heading">Thông tin cấu hình</h2>
          <p className="course-overview-tab__lede">
            Chi tiết phân loại, thời lượng, tài nguyên và các mốc thời gian quan trọng.
          </p>
        </div>

        <div className="course-overview-tab__config-body">
          {course.provider === 'MINISTRY' && (
            <>
              <MetaRow icon={GraduationCap} label="Môn học">
                <strong>{course.subjectName || '—'}</strong>
              </MetaRow>
              <MetaRow icon={BookOpen} label="Lớp">
                <strong>Lớp {course.gradeLevel}</strong>
              </MetaRow>
            </>
          )}

          <MetaRow icon={Users} label="Giáo viên">
            <strong>{course.teacherName || 'Bạn'}</strong>
          </MetaRow>

          <MetaRow icon={Languages} label="Ngôn ngữ">
            <strong>{course.language || 'Tiếng Việt'}</strong>
          </MetaRow>

          <MetaRow icon={Clock} label="Tổng giờ video">
            <strong>{course.totalVideoHours ?? 0} giờ</strong>
          </MetaRow>

          <MetaRow icon={Download} label="Tài nguyên tải về">
            <strong>{course.resourcesCount ?? 0} file đính kèm</strong>
          </MetaRow>

          <MetaRow icon={FileText} label="Bài đọc (Articles)">
            <strong>{course.articlesCount ?? 0} bài viết</strong>
          </MetaRow>

          <MetaRow icon={Calendar} label="Ngày tạo">
            <strong>{formatDate(course.createdAt)}</strong>
          </MetaRow>

          <MetaRow icon={Calendar} label="Cập nhật lần cuối">
            <strong>{formatDate(course.updatedAt)}</strong>
          </MetaRow>
        </div>
      </div>

      {hasDesc && (
        <div className="course-overview-tab__panel">
          <div className="course-overview-tab__panel-head">
            <h2 className="course-overview-tab__panel-title">Mô tả khóa học</h2>
            <p className="course-overview-tab__panel-mute">Lời giới thiệu hiển thị cho học viên</p>
          </div>
          <div className="course-overview-tab__panel-body">
            <p className="course-overview-tab__body-serif">{course.description}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseOverviewTab;
