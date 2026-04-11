import { Navigate, useLocation } from 'react-router-dom';
import { AuthService } from '../services/api/auth.service';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const location = useLocation();

  if (!AuthService.isAuthenticated()) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
