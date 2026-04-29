import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { AuthService } from '../../services/api/auth.service';
import { UI_TEXT } from '../../constants/uiText';
import './CourseBreadcrumb.css';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface CourseBreadcrumbProps {
  items?: BreadcrumbItem[];
  courseTitle?: string;
  homePath?: string;
}

export const CourseBreadcrumb: React.FC<CourseBreadcrumbProps> = ({ items, courseTitle, homePath }) => {
  const location = useLocation();

  // Auto-generate breadcrumbs if not provided
  const breadcrumbs = items || generateBreadcrumbs(location.pathname, courseTitle);

  const dashboardUrl = homePath || AuthService.getDashboardUrl();
  // Hide "Trang chủ" if it points to the same URL as the first breadcrumb item
  const showHome = breadcrumbs.length === 0 || breadcrumbs[0].path !== dashboardUrl;

  return (
    <nav className="course-breadcrumb" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {showHome && (
          <li className="breadcrumb-item">
            <Link to={dashboardUrl} className="breadcrumb-link">
              <Home size={14} />
              <span>Trang chủ</span>
            </Link>
          </li>
        )}
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
      breadcrumbs.push({ label: UI_TEXT.COURSE, path: '/teacher/courses' });

      if (segments[2]) {
        // Course detail
        breadcrumbs.push({
          label: courseTitle || `Chi tiết ${UI_TEXT.COURSE.toLowerCase()}`,
          path: `/teacher/courses/${segments[2]}`,
        });

        if (segments[3] === 'lessons') {
          breadcrumbs.push({ label: 'Bài học' });
        } else if (segments[3] === 'assessments') {
          breadcrumbs.push({ label: UI_TEXT.QUIZ });
        }
      }
    } else if (segments[1] === 'assessments') {
      breadcrumbs.push({ label: UI_TEXT.QUIZ, path: '/teacher/assessments' });
      if (segments[2]) {
        breadcrumbs.push({ label: 'Chi tiết' });
      }
    }
  }

  // Student routes
  if (segments[0] === 'student') {
    if (segments[1] === 'courses') {
      breadcrumbs.push({ label: `${UI_TEXT.COURSE} của tôi`, path: '/student/courses' });

      if (segments[2]) {
        breadcrumbs.push({
          label: courseTitle || `Chi tiết ${UI_TEXT.COURSE.toLowerCase()}`,
        });
      }
    }
  }

  // Public course preview
  if (segments[0] === 'course') {
    breadcrumbs.push({ label: `Khám phá ${UI_TEXT.COURSE.toLowerCase()}`, path: '/courses' });
    if (segments[1]) {
      breadcrumbs.push({ label: courseTitle || `Xem trước ${UI_TEXT.COURSE.toLowerCase()}` });
    }
  }

  return breadcrumbs;
}
