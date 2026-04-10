import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Bell, CheckCircle2, ChefHat, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const socket = io('http://localhost:3001');

export const CocinaUI = () => {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    cargarPendientes();

    // Escuchar nuevas comandas
    socket.on('nueva_comanda', (nuevoPedido) => {
      // Reproducir sonido
      try {
        const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
        audio.play().catch(() => console.log('El navegador bloqueó el autoplay del sonido'));
      } catch(e) {}

      setPedidos((prev) => [...prev, nuevoPedido]);
    });

    return () => {
      socket.off('nueva_comanda');
    };
  }, []);

  const cargarPendientes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3001/api/pedidos/pendientes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPedidos(res.data);
    } catch (error) {
      console.error(error);
      alert('Error cargando pedidos. Inicia sesión de nuevo.');
      navigate('/');
    }
  };

  const marcarComoListo = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3001/api/pedidos/${id}/estado`, { estado: 'listo' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remover de la pantalla de cocina
      setPedidos((prev) => prev.filter(p => p.id !== id));
    } catch (error) {
      alert('Error al actualizar el estado');
    }
  };

  return (
    <div className="min-h-screen bg-darkBg text-white p-6 font-sans">
      {/* Header Cocina */}
      <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <div className="flex items-center gap-4">
          <div className="bg-secondary p-3 rounded-xl">
            <ChefHat size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-primary tracking-tight">Comandas en Cocina</h1>
            <p className="text-gray-400">La Butaca Restaurante</p>
          </div>
        </div>
        <button 
          onClick={() => { localStorage.clear(); navigate('/'); }} 
          className="bg-white/10 hover:bg-red-500/80 transition p-3 rounded-lg text-white"
        >
          <LogOut size={24} />
        </button>
      </div>

      {/* Grid de Pedidos */}
      {pedidos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 opacity-50">
          <Bell size={64} className="mb-4 text-gray-500" />
          <h2 className="text-2xl font-bold text-gray-400">Sin comandas pendientes</h2>
          <p className="text-gray-500">A la espera de nuevos pedidos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {pedidos.map(pedido => (
            <div key={pedido.id} className="bg-white/10 border border-white/20 rounded-2xl p-5 flex flex-col shadow-xl relative overflow-hidden animate-fade-in">
              
              {/* Etiqueta Superior */}
              <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold leading-none">Mesa {pedido.mesa_id || pedido.mesa_numero}</h2>
                  <p className="text-sm text-gray-400 mt-1">Mesero: {pedido.mesero}</p>
                </div>
                <div className="text-primary font-bold text-lg bg-primary/10 px-3 py-1 rounded-lg">
                  #{pedido.id}
                </div>
              </div>

              {/* Detalles (Productos) */}
              <div className="bg-black/20 rounded-xl p-4 flex-1 mb-4">
                <ul className="space-y-3">
                  {pedido.productos?.map((prod: any, idx: number) => (
                    <li key={idx} className="flex gap-3 text-lg border-b border-white/5 pb-2 last:border-0">
                      <span className="font-bold text-primary">{prod.cantidad}x</span>
                      <div>
                        <span className="font-medium">{prod.nombre}</span>
                        {prod.observaciones && (
                          <p className="text-sm text-secondary italic">"{prod.observaciones}"</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                {pedido.observaciones && (
                  <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
                    <strong>⚠️ Nota General:</strong> {pedido.observaciones}
                  </div>
                )}
              </div>

              <button 
                onClick={() => marcarComoListo(pedido.id)}
                className="w-full bg-green-500 hover:bg-green-400 font-bold text-darkBg py-4 rounded-xl flex items-center justify-center gap-2 transition"
              >
                <CheckCircle2 size={24} />
                Marcar como Listo
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
