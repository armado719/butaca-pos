import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { Login } from './pages/Login';
import { MeseroUI } from './pages/Mesero';
import { CocinaUI } from './pages/Cocina';
import { CajaUI } from './pages/Caja';
import { AdminUI } from './pages/Admin';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
