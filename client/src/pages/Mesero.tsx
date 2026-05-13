import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { LogOut, ShoppingCart, Send, Plus, Minus, Trash2, Bike } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ButacaLogo } from '../components/ButacaLogo';
import { FormularioDomicilio } from '../components/FormularioDomicilio';
import type { DomicilioData } from '../components/FormularioDomicilio';
import type { Mesa, CategoriaMenu, ItemCarrito, Producto } from '../types';

export const MeseroUI = () => {
  const [mesas, setMesas]                     = useState<Mesa[]>([]);
  const [menu, setMenu]                       = useState<CategoriaMenu[]>([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
  const [carrito, setCarrito]                 = useState<ItemCarrito[]>([]);
  const [modoDomicilio, setModoDomicilio]     = useState(false);
  const [domicilioData, setDomicilioData]     = useState<DomicilioData | null>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      const [mesasRes, menuRes] = await Promise.all([
        api.get<Mesa[]>('/mesas'),
        api.get<CategoriaMenu[]>('/productos'),
      ]);
      setMesas(mesasRes.data);
      setMenu(menuRes.data);
    } catch {
      navigate('/login');
    }
  };

  const agregarAlCarrito = (producto: Producto) => {
    setCarrito(prev => {
      const existe = prev.find(p => p.id === producto.id);
      if (existe) return prev.map(p => p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p);
      return [...prev, { ...producto, cantidad: 1, observaciones: '' }];
    });
  };

  const actualizarCantidad = (id: number, delta: number) => {
    setCarrito(prev =>
      prev.map(p => p.id === id ? { ...p, cantidad: p.cantidad + delta } : p)
        .filter(p => p.cantidad > 0)
    );
  };

  const enviarPedido = async () => {
    if (!modoDomicilio && !mesaSeleccionada) return alert('Selecciona una mesa primero');
    if (modoDomicilio && !domicilioData) return alert('Completa los datos del domicilio');
    if (carrito.length === 0) return alert('El carrito está vacío');
    try {
      const body = modoDomicilio
        ? { tipo: 'domicilio', ...domicilioData, productos: carrito, observaciones: '' }
        : { tipo: 'mesa', mesa_id: mesaSeleccionada!.id, productos: carrito, observaciones: '' };
      await api.post('/pedidos', body);
      alert(modoDomicilio ? '¡Domicilio enviado a cocina!' : '¡Comanda enviada a cocina!');
      setCarrito([]);
      setMesaSeleccionada(null);
      setDomicilioData(null);
      cargarDatos();
    } catch (err: any) {
      const msg = err?.response?.data?.msg || err?.response?.data?.errors?.[0]?.message || 'Error al enviar el pedido';
      alert(msg);
    }
  };

  const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden relative">
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none grayscale"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1544681280-d25a782adc9b?auto=format&fit=crop&q=80&w=2000")',
          backgroundSize: 'cover', backgroundPosition: 'center'
        }}
      />
      <div className="flex flex-col flex-1 overflow-hidden border-r border-gray-200 bg-white/90 backdrop-blur-sm relative z-10">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <ButacaLogo size={48} variant="icon" theme="light" />
            <div>
              <p className="font-black text-gray-800 text-base leading-none">LA BUTACA</p>
              <p className="text-xs text-gray-400 tracking-widest">MESERO</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
          >
            <LogOut size={15} /> Salir
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {menu.map(categoria => (
            <div key={categoria.id} className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-0.5 w-4 bg-secondary rounded" />
                <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest">{categoria.nombre}</h2>
                <div className="h-0.5 flex-1 bg-gray-100 rounded" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {categoria.productos.map((prod: Producto) => (
                  <button
                    key={prod.id} onClick={() => agregarAlCarrito(prod)}
                    className="text-left bg-white hover:bg-yellow-50 border border-gray-200 hover:border-primary rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all active:scale-95 group"
                  >
                    <p className="font-semibold text-gray-800 text-sm leading-tight group-hover:text-gray-900">{prod.nombre}</p>
                    <p className="text-primary font-black text-base mt-1.5">${prod.precio.toLocaleString('es-CO')}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-80 flex flex-col bg-gray-50 border-l border-gray-200">

        {/* Toggle Mesa / Domicilio + Selector */}
        <div className="p-4 bg-white border-b border-gray-100">
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => { setModoDomicilio(false); setDomicilioData(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                !modoDomicilio ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Mesa
            </button>
            <button
              onClick={() => { setModoDomicilio(true); setMesaSeleccionada(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                modoDomicilio ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Bike size={16} /> Domicilio
            </button>
          </div>
          {!modoDomicilio ? (
            <>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Mesa</p>
              <div className="flex flex-wrap gap-2">
                {mesas.map(mesa => (
                  <button
                    key={mesa.id}
                    onClick={() => setMesaSeleccionada(mesa)}
                    className={`w-12 h-10 rounded-lg font-bold text-sm transition-all ${
                      mesaSeleccionada?.id === mesa.id
                        ? 'bg-secondary text-white shadow-md ring-2 ring-secondary ring-offset-1'
                        : mesa.estado === 'ocupada'
                          ? 'bg-red-100 text-red-500 border border-red-200'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-secondary hover:text-secondary'
                    }`}
                  >
                    {mesa.numero}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <FormularioDomicilio onChange={setDomicilioData} />
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {carrito.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 select-none">
              <ShoppingCart size={44} className="mb-2" />
              <p className="text-sm">Agrega productos al pedido</p>
            </div>
          ) : (
            carrito.map((item: ItemCarrito) => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3 shadow-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{item.nombre}</p>
                  <p className="text-primary font-black text-sm">${(item.precio * item.cantidad).toLocaleString('es-CO')}</p>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1 shrink-0">
                  <button type="button" onClick={() => actualizarCantidad(item.id, -1)} className="text-gray-500 hover:text-secondary transition">
                    {item.cantidad === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                  </button>
                  <span className="w-4 text-center text-sm font-bold text-gray-700">{item.cantidad}</span>
                  <button type="button" onClick={() => actualizarCantidad(item.id, 1)} className="text-gray-500 hover:text-primary transition">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-baseline mb-4">
            <span className="text-gray-500 text-sm font-semibold">Total</span>
            <span className="text-2xl font-black text-gray-800">${total.toLocaleString('es-CO')}</span>
          </div>
          <button
            onClick={enviarPedido}
            disabled={(!modoDomicilio && !mesaSeleccionada) || (modoDomicilio && !domicilioData) || carrito.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: ((!modoDomicilio && !mesaSeleccionada) || (modoDomicilio && !domicilioData) || carrito.length === 0)
                ? '#e5e7eb'
                : 'linear-gradient(135deg,#F5A623,#D4880A)',
              color: ((!modoDomicilio && !mesaSeleccionada) || (modoDomicilio && !domicilioData) || carrito.length === 0)
                ? '#9ca3af'
                : '#1a1a1a'
            }}
          >
            <Send size={16} />
            {modoDomicilio
              ? (domicilioData ? 'Enviar Domicilio a Cocina' : 'Completa los datos')
              : (mesaSeleccionada ? `Enviar a Cocina — Mesa ${mesaSeleccionada.numero}` : 'Selecciona una mesa')}
          </button>
        </div>
      </div>
    </div>
  );
};
