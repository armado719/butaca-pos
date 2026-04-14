import React, { useState, useEffect } from 'react';
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
  const [currentImg, setCurrentImg] = useState(0);

  const navigate = useNavigate();
  const { login } = useAuth();

  const imagenes = [
    "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=2000",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=2000",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=2000"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImg(prev => (prev + 1) % imagenes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0a0c10]">
      
      {/* Lado Derecho - Visual */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-[#0a0c10] items-center justify-center">
        {/* Slider de imágenes */}
        {imagenes.map((img, idx) => (
          <img 
            key={idx}
            src={img} 
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentImg ? 'opacity-40' : 'opacity-0'}`} 
            alt={`Restaurant Background ${idx}`}
          />
        ))}
        
        {/* Capa de gradiente para mejorar lectura */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c10] via-transparent to-[#0a0c10]/50" />

        <div className="relative z-10 text-center px-12">
          <div className="mb-8 transform hover:scale-105 transition-transform duration-700">
            <ButacaLogo size={320} variant="full" theme="dark" />
          </div>
          <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase italic">
            Sabor & Tecnología
          </h2>
          <p className="text-gray-400 text-lg max-w-md mx-auto font-light leading-relaxed">
            Administra tu restaurante con la eficiencia que tu pasión merece.
          </p>
        </div>
        
        {/* Indicadores del Slider */}
        <div className="absolute bottom-10 left-10 flex gap-2">
           {imagenes.map((_, idx) => (
             <div 
               key={idx} 
               className={`h-1 rounded-full transition-all duration-500 ${idx === currentImg ? 'w-12 bg-primary' : 'w-4 bg-white/20'}`} 
             />
           ))}
        </div>
      </div>

      {/* ── MITAD DERECHA: Formulario de Login Limpio ── */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-white relative">
        <div className="w-full max-w-md">
          
          {/* Encabezado con logo para móvil */}
          <div className="mb-12 text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-8">
              <ButacaLogo size={140} theme="light" />
            </div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">Ingresar</h2>
            <p className="text-gray-500 text-lg mt-2 font-medium">Gestiona tu restaurante con eficiencia</p>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="mb-8 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-xl shadow-sm animate-shake">
              <p className="font-bold text-sm">Error de acceso</p>
              <p className="text-xs opacity-90">{error}</p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleLogin} className="space-y-6">
            
            <div className="space-y-2">
              <label className="block text-sm font-black text-gray-800 uppercase tracking-wider ml-1">
                Usuario / Correo
              </label>
              <div className="flex items-center bg-gray-50 border-2 border-gray-200 rounded-2xl focus-within:border-[#B5201E] focus-within:bg-white transition-all shadow-sm">
                <div className="pl-4 text-gray-700">
                  <User size={22} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-4 bg-transparent text-gray-900 font-bold focus:outline-none placeholder-gray-400"
                  placeholder="admin@labutaca.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-black text-gray-800 uppercase tracking-wider ml-1">
                Contraseña
              </label>
              <div className="flex items-center bg-gray-50 border-2 border-gray-200 rounded-2xl focus-within:border-[#B5201E] focus-within:bg-white transition-all shadow-sm">
                <div className="pl-4 text-gray-700">
                  <Lock size={22} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-4 bg-transparent text-gray-900 font-bold focus:outline-none placeholder-gray-400"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden py-5 rounded-2xl font-black text-base uppercase tracking-widest transition-all shadow-xl hover:shadow-[#F5A623]/20 mt-4 active:scale-95"
              style={{ background: '#F5A623', color: '#1a1a1a' }}
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {loading ? 'Entrando...' : 'Entrar al Sistema'}
                {!loading && <ChevronRight size={20} />}
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
          </form>

          {/* Footer del login */}
          <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col items-center">
            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.3em] mb-1">
              La Butaca Restaurante
            </p>
            <p className="text-gray-300 text-[9px] font-medium italic">
              "La comida de siempre, la tecnología de hoy"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

