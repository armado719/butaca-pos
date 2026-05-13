import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';
import { PrivateRoute } from './components/PrivateRoute';
import { Loader2 } from 'lucide-react';

const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const MeseroUI = lazy(() => import('./pages/Mesero').then(m => ({ default: m.MeseroUI })));
const CocinaUI = lazy(() => import('./pages/Cocina').then(m => ({ default: m.CocinaUI })));
const CajaUI = lazy(() => import('./pages/Caja').then(m => ({ default: m.CajaUI })));
const AdminUI = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminUI })));

const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
    <Loader2 className="w-12 h-12 text-primary animate-spin" />
    <p className="mt-4 text-gray-500 font-bold tracking-widest text-xs">CARGANDO...</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />

              <Route path="/mesero" element={
                <PrivateRoute roles={['mesero', 'admin']}>
                  <MeseroUI />
                </PrivateRoute>
              } />

              <Route path="/cocina" element={
                <PrivateRoute roles={['cocina', 'admin']}>
                  <CocinaUI />
                </PrivateRoute>
              } />

              <Route path="/caja" element={
                <PrivateRoute roles={['cajero', 'admin']}>
                  <CajaUI />
                </PrivateRoute>
              } />

              <Route path="/admin" element={
                <PrivateRoute roles={['admin']}>
                  <AdminUI />
                </PrivateRoute>
              } />

              {/* Compatibilidad con ruta /dashboard anterior */}
              <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
