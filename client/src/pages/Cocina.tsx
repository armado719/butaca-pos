import { useState, useEffect } from 'react';
import { api, SOCKET_URL } from '../services/api';
import { io } from 'socket.io-client';
import { Bell, CheckCircle2, LogOut, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ButacaLogo } from '../components/ButacaLogo';

const socket = io(SOCKET_URL);

export const CocinaUI = () => {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    cargarPendientes();

    socket.on('nueva_comanda', (nuevoPedido) => {
      try {
        const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
        audio.play().catch(() => {});
      } catch {}
      setPedidos(prev => [nuevoPedido, ...prev]);
    });

    socket.on('pedido_actualizado', ({ id, estado }: any) => {
      if (estado === 'listo') setPedidos(prev => prev.filter(p => p.id !== id));
    });

    return () => { socket.off('nueva_comanda'); socket.off('pedido_actualizado'); };
  }, []);

  const cargarPendientes = async () => {
    try {
      const { data } = await api.get('/pedidos/pendientes');
      setPedidos(data);
    } catch {
      navigate('/login');
    }
  };

  const marcarComoListo = async (id: number) => {
    try {
      await api.put(`/pedidos/${id}/estado`, { estado: 'listo' });
      setPedidos(prev => prev.filter(p => p.id !== id));
    } catch {
      alert('Error al actualizar el estado');
    }
  };

  const tiempoTranscurrido = (created_at: string) => {
    const diff = Math.floor((Date.now() - new Date(created_at).getTime()) / 60000);
    return diff < 1 ? 'Ahora' : `${diff} min`;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none grayscale invert"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1556910110-ad52744adccb?auto=format&fit=crop&q=80&w=2000")',
          backgroundSize: 'cover', backgroundPosition: 'center'
        }}
      />

      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm px-6 py-3 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <ButacaLogo size={48} variant="icon" theme="light" />
          <div>
            <h1 className="text-xl font-black text-gray-800 leading-none">COCINA</h1>
            <p className="text-xs text-gray-400 tracking-widest">LA BUTACA RESTAURANTE</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-xl">
            <Bell size={16} />
            <span className="font-black text-lg">{pedidos.length}</span>
            <span className="text-sm font-semibold">pendiente{pedidos.length !== 1 ? 's' : ''}</span>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition"
          >
            <LogOut size={15} /> Salir
          </button>
        </div>
      </header>

      <main className="p-6">
        {pedidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-gray-300 select-none">
            <Bell size={64} className="mb-4" />
            <h2 className="text-2xl font-bold text-gray-400">Sin comandas pendientes</h2>
            <p className="text-gray-400 mt-1">A la espera de nuevos pedidos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {pedidos.map(pedido => (
              <div key={pedido.id} className="bg-white rounded-2xl border border-gray-200 shadow-md flex flex-col overflow-hidden">
                <div className="h-1.5 bg-secondary" />
                <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
                  <div>
                    <h2 className="text-2xl font-black text-gray-800 leading-none">
                      Mesa {pedido.mesa_numero ?? pedido.mesa_id}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">{pedido.mesero}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">#{pedido.id}</span>
                    <div className="flex items-center gap-1 text-xs text-secondary mt-1 justify-end">
                      <Clock size={11} />{tiempoTranscurrido(pedido.created_at)}
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-4 space-y-2">
                  {pedido.productos?.map((prod: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 pb-2 border-b border-gray-50 last:border-0">
                      <span className="font-black text-primary text-lg leading-none w-7 shrink-0">{prod.cantidad}×</span>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm leading-tight">{prod.nombre}</p>
                        {prod.observaciones && (
                          <p className="text-xs text-secondary italic mt-0.5">"{prod.observaciones}"</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {pedido.observaciones && (
                    <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-800">
                      ⚠️ {pedido.observaciones}
                    </div>
                  )}
                </div>
                <div className="p-4 pt-2">
                  <button
                    onClick={() => marcarComoListo(pedido.id)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff' }}
                  >
                    <CheckCircle2 size={18} /> Marcar como Listo
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
