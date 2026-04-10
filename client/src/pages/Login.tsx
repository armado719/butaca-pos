import React, { useState } from 'react';
import { User, Lock, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const Login = () => {
  const [email, setEmail] = useState('admin@labutaca.com');
  const [password, setPassword] = useState('butaca2024');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        email,
        password
      });

      const { token, usuario, user } = response.data;
      const userData = usuario || user;
      
      // Guardar sesión
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      // Redirigir según el rol
      if(userData.rol === 'mesero') {
        navigate('/mesero');
      } else if (userData.rol === 'cocina') {
        navigate('/cocina');
      } else {
        navigate('/dashboard'); 
      }

    } catch (err: any) {
      console.error("⛔ ERROR DETALLADO DE API:", err);
      if (err.response) {
         console.log("DATOS:", err.response.data);
         setError(err.response.data.msg || 'Error interno en el servidor');
      } else {
         setError(`Falla de conexión: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // Fondo oscuro con imagen sutil 
    <div className="min-h-screen bg-darkBg flex items-center justify-center p-4 relative">
      
      {/* Fondo decorativo (opcional, acorde a tema) */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1000&auto=format&fit=crop")' }}
      ></div>

      {/* Tarjeta Centrada Blanca */}
      <div className="bg-white rounded-[20px] p-8 md:p-10 w-full max-w-md shadow-[0_8px_30px_rgb(0,0,0,0.5)] border-4 border-gray-100 relative z-10">
        
        {/* Cabecera */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Utensils size={48} className="text-primary" />
          </div>
          <h1 className="text-3xl font-normal text-darkBg mb-1">Ingresar</h1>
          <p className="text-gray-400 text-sm">
            ¿No tienes cuenta? <span className="text-primary cursor-pointer hover:underline">Habla con el admin.</span>
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          {error && (
            <div className="bg-red-50 text-red-600 p-2 rounded text-sm text-center border border-red-200">
              {error}
            </div>
          )}

          {/* Input Usuario con ícono pegado a la izquierda */}
          <div className="flex focus-within:ring-2 ring-primary rounded-lg border border-gray-300 overflow-hidden transition-all bg-white">
            <div className="flex items-center justify-center px-4 bg-gray-50 border-r border-gray-300 text-gray-400">
              <User size={20} />
            </div>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-gray-700 focus:outline-none placeholder-gray-400"
              placeholder="Correo electrónico"
              required
            />
          </div>

          {/* Input Password con ícono pegado a la izquierda */}
          <div className="flex focus-within:ring-2 ring-primary rounded-lg border border-gray-300 overflow-hidden transition-all bg-white">
            <div className="flex items-center justify-center px-4 bg-gray-50 border-r border-gray-300 text-gray-400">
              <Lock size={20} />
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 text-gray-700 focus:outline-none placeholder-gray-400"
              placeholder="Contraseña"
              required
            />
          </div>

          {/* Checkbox y Forgot Password */}
          <div className="flex justify-between items-center text-sm pt-2">
            <label className="flex items-center text-gray-400 cursor-pointer hover:text-gray-600 transition">
              <input type="checkbox" className="mr-2 rounded text-primary focus:ring-primary h-4 w-4 border-gray-300" />
              Recuérdame
            </label>
            <span className="text-primary cursor-pointer hover:underline">
              ¿Olvidaste la clave?
            </span>
          </div>

          {/* Botón */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-yellow-400 text-darkBg text-lg font-normal py-3 rounded-lg transition-colors mt-6"
          >
            {loading ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>

      </div>
    </div>
  );
};
