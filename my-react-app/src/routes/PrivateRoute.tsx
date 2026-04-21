import { Navigate, useLocation } from 'react-router-dom';
import { AuthService } from '../services/api/auth.service';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const inferAllowedRoles = (pathname: string): string[] => {
  if (pathname.startsWith('/admin')) return ['admin'];
  if (pathname.startsWith('/teacher')) return ['teacher', 'admin'];
  if (pathname.startsWith('/student')) return ['student', 'user', 'teacher', 'admin'];
  return [];
};

export default function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const location = useLocation();

  if (!AuthService.isAuthenticated()) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  const roles = allowedRoles && allowedRoles.length > 0 ? allowedRoles : inferAllowedRoles(location.pathname);
  if (roles.length > 0) {
    const hasAccess = roles.some((role) => AuthService.hasRole(role));
    if (!hasAccess) {
      return <Navigate to={AuthService.getDashboardUrl()} replace state={{ from: location }} />;
    }
  }

  return <>{children}</>;
}
