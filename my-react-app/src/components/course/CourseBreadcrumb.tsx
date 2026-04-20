import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import './CourseBreadcrumb.css';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface CourseBreadcrumbProps {
  items?: BreadcrumbItem[];
  courseTitle?: string;
}

export const CourseBreadcrumb: React.FC<CourseBreadcrumbProps> = ({ items, courseTitle }) => {
  const location = useLocation();

  // Auto-generate breadcrumbs if not provided
  const breadcrumbs = items || generateBreadcrumbs(location.pathname, courseTitle);

  return (
    <nav className="course-breadcrumb" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        <li className="breadcrumb-item">
          <Link to="/" className="breadcrumb-link">
            <Home size={14} />
            <span>Trang chủ</span>
          </Link>
        </li>
        {breadcrumbs.map((item, index) => (
          <li key={index} className="breadcrumb-item">
            <ChevronRight size={14} className="breadcrumb-separator" />
            {item.path && index < breadcrumbs.length - 1 ? (
              <Link to={item.path} className="breadcrumb-link">
                {item.label}
              </Link>
            ) : (
              <span className="breadcrumb-current">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

function generateBreadcrumbs(pathname: string, courseTitle?: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Teacher routes
  if (segments[0] === 'teacher') {
    breadcrumbs.push({ label: 'Giáo viên', path: '/teacher/dashboard' });

    if (segments[1] === 'courses') {
      breadcrumbs.push({ label: 'Giáo trình', path: '/teacher/courses' });

      if (segments[2]) {
        // Course detail
        breadcrumbs.push({
          label: courseTitle || 'Chi tiết giáo trình',
          path: `/teacher/courses/${segments[2]}`,
        });

        if (segments[3] === 'lessons') {
          breadcrumbs.push({ label: 'Bài học' });
        } else if (segments[3] === 'assessments') {
          breadcrumbs.push({ label: 'Đánh giá' });
        }
      }
    } else if (segments[1] === 'assessments') {
      breadcrumbs.push({ label: 'Đánh giá', path: '/teacher/assessments' });
      if (segments[2]) {
        breadcrumbs.push({ label: 'Chi tiết' });
      }
    }
  }

  // Student routes
  if (segments[0] === 'student') {
    breadcrumbs.push({ label: 'Học sinh', path: '/student/courses' });

    if (segments[1] === 'courses') {
      breadcrumbs.push({ label: 'Giáo trình của tôi', path: '/student/courses' });

      if (segments[2]) {
        breadcrumbs.push({
          label: courseTitle || 'Chi tiết giáo trình',
        });
      }
    }
  }

  // Public course preview
  if (segments[0] === 'course') {
    breadcrumbs.push({ label: 'Khám phá giáo trình', path: '/courses' });
    if (segments[1]) {
      breadcrumbs.push({ label: courseTitle || 'Xem trước giáo trình' });
    }
  }

  return breadcrumbs;
}
