import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { rolePath } from '../utils/apiHelpers';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader label="Comprobando sesión…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (allowedRoles?.length) {
    const role = String(user?.rol || '').toLocaleLowerCase('es');
    const allowed = allowedRoles.some((item) => String(item).toLocaleLowerCase('es') === role);
    if (!allowed) return <Navigate to={rolePath(user?.rol)} replace />;
  }

  return <Outlet />;
}
