import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Calendar,
  Clock,
  Download,
  GraduationCap,
  Languages,
  Sparkles,
  Users,
} from 'lucide-react';
import React from 'react';
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

  const hasDesc = Boolean(course.description);

  return (
    <div className="course-overview-tab">
      {/* Provider Banner */}
      {course.provider === 'CUSTOM' && (
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
      )}

      <div className="course-overview-tab__config">
        <div className="course-overview-tab__config-head">
          <h2 className="course-overview-config-heading">Thông tin khóa học</h2>
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
