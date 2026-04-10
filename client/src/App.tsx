import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';

import { MeseroUI } from './pages/Mesero';
import { CocinaUI } from './pages/Cocina';
import { CajaUI } from './pages/Caja';

// Componentes temporales para el final completo
const Dashboard = () => <CajaUI />;


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/mesero" element={<MeseroUI />} />
        <Route path="/cocina" element={<CocinaUI />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
