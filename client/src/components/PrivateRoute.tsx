import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: React.ReactNode;
  roles?: ('admin' | 'mesero' | 'cocina' | 'cajero')[];
}

export const PrivateRoute = ({ children, roles }: Props) => {
  const { isAuthenticated, usuario } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && usuario && !roles.includes(usuario.rol)) {
    // Redirigir a su pantalla correspondiente
    const redirects: Record<string, string> = {
      mesero: '/mesero',
      cocina: '/cocina',
      cajero: '/caja',
      admin:  '/admin',
    };
    return <Navigate to={redirects[usuario.rol] || '/login'} replace />;
  }

  return <>{children}</>;
};
