import React, { useState } from 'react';
import { User, Lock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ButacaLogo } from '../components/ButacaLogo';

export const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('http://localhost:3001/api/auth/login', { email, password });
      login(data.token, data.usuario);
      const redirects: Record<string, string> = {
        mesero: '/mesero', cocina: '/cocina', cajero: '/caja', admin: '/admin',
      };
      navigate(redirects[data.usuario.rol] || '/login');
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-100">

      {/* ── PANEL IZQUIERDO: patrón rombos rojo/amarillo (desktop) ── */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden">
        {/* Fondo con patrón de rombos inspirado en la imagen del restaurante */}
        <div className="absolute inset-0" style={{ backgroundColor: '#B5201E' }}>
          {Array.from({ length: 10 }).map((_, row) =>
            Array.from({ length: 8 }).map((_, col) => (
              <div
                key={`${row}-${col}`}
                className="absolute rotate-45"
                style={{
                  width: 110, height: 110,
                  left: col * 110 - 55,
                  top:  row * 110 - 55,
                  backgroundColor: (row + col) % 2 === 0 ? '#B5201E' : '#F5A623',
                  boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.12)',
                }}
              />
            ))
          )}
          {/* Overlay oscuro para suavizar */}
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Logo centrado sobre el patrón */}
        <div className="relative z-10 flex flex-col items-center drop-shadow-2xl">
          <ButacaLogo size={280} />
          <p className="text-white/70 text-xs tracking-widest mt-4 uppercase">
            Sistema de Punto de Venta
          </p>
        </div>
      </div>

      {/* ── PANEL DERECHO: tarjeta blanca clara ── */}
      <div className="flex-1 lg:max-w-md flex items-center justify-center px-6 py-12 bg-white shadow-2xl">
        <div className="w-full max-w-sm">

          {/* Logo arriba (reemplaza el tenedor + "Ingresar") */}
          <div className="flex flex-col items-center mb-8">
            <ButacaLogo size={150} />
            <h2 className="text-2xl font-bold text-gray-800 mt-2">Ingresar</h2>
            <p className="text-gray-400 text-sm mt-1">Accede con tus credenciales</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm text-center">
              {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleLogin} className="space-y-4">

            {/* Email */}
            <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20 transition-all bg-white">
              <div className="flex items-center justify-center px-4 bg-gray-50 border-r border-gray-200 text-gray-400 h-12">
                <User size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 text-gray-700 text-sm focus:outline-none placeholder-gray-400"
                placeholder="Correo electrónico"
                required
              />
            </div>

            {/* Contraseña */}
            <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20 transition-all bg-white">
              <div className="flex items-center justify-center px-4 bg-gray-50 border-r border-gray-200 text-gray-400 h-12">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="flex-1 px-4 py-3 text-gray-700 text-sm focus:outline-none placeholder-gray-400"
                placeholder="Contraseña"
                required
              />
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all mt-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #F5A623, #D4880A)', color: '#1a1a1a' }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Ingresando...
                </>
              ) : (
                <>Entrar <ChevronRight size={16} /></>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-gray-300 text-xs mt-8">
            La Butaca Restaurante · Desde 2010
          </p>
        </div>
      </div>

    </div>
  );
};
