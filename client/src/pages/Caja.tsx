import { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  DollarSign, LogOut, Banknote, CreditCard, CheckCircle,
  Smartphone, Bike, MapPin, Navigation, Plus, Minus, Trash2, Send, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ButacaLogo } from '../components/ButacaLogo';
import { FormularioDomicilio } from '../components/FormularioDomicilio';
import { Toaster, useToast } from '../components/Toast';
import type { DomicilioData } from '../components/FormularioDomicilio';
import type { PedidoCaja, CategoriaMenu, Producto, ItemCarrito } from '../types';

export const CajaUI = () => {
  // ── Estado principal ───────────────────────────────────────────
  const [pedidos, setPedidos]           = useState<PedidoCaja[]>([]);
  const [pedidoActivo, setPedidoActivo] = useState<PedidoCaja | null>(null);
  const [metodoPago, setMetodoPago]     = useState<string>('efectivo');

  // ── Nuevo domicilio ────────────────────────────────────────────
  const [modalDomicilio, setModalDomicilio] = useState(false);
  const [menu, setMenu]                     = useState<CategoriaMenu[]>([]);
  const [carrito, setCarrito]               = useState<ItemCarrito[]>([]);
  const [domicilioData, setDomicilioData]   = useState<DomicilioData | null>(null);
  const [enviando, setEnviando]             = useState(false);

  const { logout } = useAuth();
  const navigate   = useNavigate();
  const { toasts, toast, dismiss } = useToast();

  useEffect(() => { cargarPedidos(); }, []);

  const cargarPedidos = async () => {
    try {
      const { data } = await api.get<PedidoCaja[]>('/pedidos/caja');
      setPedidos(data);
    } catch {
      navigate('/login');
    }
  };

  const abrirModalDomicilio = async () => {
    if (menu.length === 0) {
      try {
        const { data } = await api.get<CategoriaMenu[]>('/productos');
        setMenu(data);
      } catch { /* silenciar */ }
    }
    setCarrito([]);
    setDomicilioData(null);
    setModalDomicilio(true);
  };

  const agregarAlCarrito = (prod: Producto) => {
    setCarrito(prev => {
      const existe = prev.find(p => p.id === prod.id);
      if (existe) return prev.map(p => p.id === prod.id ? { ...p, cantidad: p.cantidad + 1 } : p);
      return [...prev, { ...prod, cantidad: 1, observaciones: '' }];
    });
  };

  const actualizarCantidad = (id: number, delta: number) => {
    setCarrito(prev =>
      prev.map(p => p.id === id ? { ...p, cantidad: p.cantidad + delta } : p)
        .filter(p => p.cantidad > 0)
    );
  };

  const enviarDomicilio = async () => {
    if (!domicilioData) return toast('Completa los datos del domicilio', 'warning');
    if (carrito.length === 0) return toast('Agrega al menos un producto', 'warning');
    setEnviando(true);
    try {
      const productos = carrito.map(p => ({
        id:            Number(p.id),
        cantidad:      Number(p.cantidad),
        precio:        Number(p.precio),
        observaciones: p.observaciones || '',
      }));
      await api.post('/pedidos', {
        tipo: 'domicilio',
        ...domicilioData,
        productos,
        observaciones: '',
      });
      toast('¡Domicilio enviado a cocina!', 'success');
      setModalDomicilio(false);
      cargarPedidos();
    } catch (err: any) {
      const data = err?.response?.data;
      const firstError = data?.errores?.[0];
      const msg = firstError
        ? `${firstError.campo}: ${firstError.mensaje}`
        : data?.msg || 'Error al crear el domicilio';
      toast(msg, 'error');
    } finally {
      setEnviando(false);
    }
  };

  // ── Cobro ──────────────────────────────────────────────────────
  const realizarCobro = async () => {
    if (!pedidoActivo) return;
    try {
      await api.post(`/pedidos/${pedidoActivo.id}/pagar`, {
        metodo_pago: metodoPago,
        monto: pedidoActivo.total,
      });
      toast('¡Pago registrado con éxito!', 'success');
      setPedidoActivo(null);
      cargarPedidos();
    } catch {
      toast('Error procesando el pago', 'error');
    }
  };

  const actualizarEstadoDomicilio = async (pedidoId: number, estadoDomicilio: string) => {
    try {
      await api.put(`/pedidos/${pedidoId}/estado-domicilio`, { estado_domicilio: estadoDomicilio });
      setPedidoActivo(prev => prev ? { ...prev, estado_domicilio: estadoDomicilio } : null);
      cargarPedidos();
    } catch {
      toast('Error actualizando estado del domicilio', 'error');
    }
  };

  const metodos = [
    { id: 'efectivo',       label: 'Efectivo',       icon: Banknote },
    { id: 'nequi',          label: 'Nequi',          icon: Smartphone },
    { id: 'daviplata',      label: 'Daviplata',      icon: Smartphone },
    { id: 'transferencia',  label: 'Transferencia',  icon: CreditCard },
    { id: 'contra_entrega', label: 'Contra entrega', icon: Bike },
  ];

  const totalCarrito = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);

  return (
    <>
      <Toaster toasts={toasts} onDismiss={dismiss} />
      {/* ── Modal Nuevo Domicilio ─────────────────────────────── */}
      {modalDomicilio && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                <Bike size={20} className="text-amber-500"/> Nuevo Domicilio
              </h2>
              <button onClick={() => setModalDomicilio(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={20}/>
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Menú */}
              <div className="flex-1 overflow-y-auto p-4 border-r border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Menú</p>
                {menu.map(cat => (
                  <div key={cat.id} className="mb-5">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <span className="h-px flex-1 bg-gray-100"/> {cat.nombre} <span className="h-px flex-1 bg-gray-100"/>
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {cat.productos.map((prod: Producto) => (
                        <button
                          key={prod.id} onClick={() => agregarAlCarrito(prod)}
                          className="text-left bg-gray-50 hover:bg-amber-50 border border-gray-200 hover:border-amber-300 rounded-xl p-3 transition-all active:scale-95"
                        >
                          <p className="font-semibold text-gray-800 text-sm">{prod.nombre}</p>
                          <p className="text-amber-600 font-black text-sm mt-0.5">${prod.precio.toLocaleString('es-CO')}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Panel derecho: datos domicilio + carrito */}
              <div className="w-80 flex flex-col overflow-hidden">
                {/* Formulario domicilio */}
                <div className="p-4 border-b border-gray-100 overflow-y-auto max-h-64">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Datos del cliente</p>
                  <FormularioDomicilio onChange={setDomicilioData} />
                </div>

                {/* Carrito */}
                <div className="flex-1 overflow-y-auto p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Pedido</p>
                  {carrito.length === 0 ? (
                    <p className="text-gray-300 text-sm text-center mt-4">Agrega productos del menú</p>
                  ) : (
                    <div className="space-y-2">
                      {carrito.map(item => (
                        <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{item.nombre}</p>
                            <p className="text-xs text-amber-600 font-bold">${(item.precio * item.cantidad).toLocaleString('es-CO')}</p>
                          </div>
                          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-full px-1.5 py-0.5">
                            <button onClick={() => actualizarCantidad(item.id, -1)} className="text-gray-400 hover:text-red-500">
                              {item.cantidad === 1 ? <Trash2 size={12}/> : <Minus size={12}/>}
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{item.cantidad}</span>
                            <button onClick={() => actualizarCantidad(item.id, 1)} className="text-gray-400 hover:text-green-500">
                              <Plus size={12}/>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer: total + enviar */}
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                  <div className="flex justify-between items-baseline mb-3">
                    <span className="text-sm text-gray-500 font-semibold">Total</span>
                    <span className="text-xl font-black text-gray-800">${totalCarrito.toLocaleString('es-CO')}</span>
                  </div>
                  <button
                    onClick={enviarDomicilio}
                    disabled={enviando || !domicilioData || carrito.length === 0}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: (!domicilioData || carrito.length === 0) ? '#e5e7eb' : 'linear-gradient(135deg,#F5A623,#D4880A)', color: '#1a1a1a' }}
                  >
                    <Send size={15}/>
                    {enviando ? 'Enviando...' : 'Enviar a Cocina'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Layout Principal ──────────────────────────────────── */}
      <div className="flex h-screen bg-gray-50 font-sans overflow-hidden relative">
        {/* Panel izquierdo */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-xl z-10">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              <ButacaLogo size={40} variant="icon" theme="light" />
              <div>
                <p className="font-black text-gray-800 text-sm leading-none">LA BUTACA</p>
                <p className="text-xs text-gray-400 tracking-widest">CAJA</p>
              </div>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="text-red-400 hover:text-red-500 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition"
            >
              <LogOut size={16} />
            </button>
          </div>

          {/* Botón Nuevo Domicilio */}
          <div className="px-3 pt-3">
            <button
              onClick={abrirModalDomicilio}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-600 text-white transition-all active:scale-[0.98]"
            >
              <Bike size={16}/> Nuevo Domicilio
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 pt-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
              Pendientes por cobrar ({pedidos.length})
            </p>
            {pedidos.length === 0 ? (
              <div className="text-center text-gray-300 mt-6 text-sm">No hay cuentas pendientes</div>
            ) : (
              <div className="space-y-2">
                {pedidos.map(p => (
                  <button
                    key={p.id} onClick={() => setPedidoActivo(p)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      pedidoActivo?.id === p.id
                        ? 'bg-primary/10 border-primary ring-1 ring-primary'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      {p.tipo === 'domicilio' ? (
                        <span className="flex items-center gap-1 text-amber-600 font-black text-sm">
                          <Bike size={14}/> DOMICILIO
                        </span>
                      ) : (
                        <span className="font-black text-gray-800">Mesa {p.mesa_numero}</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        p.estado === 'listo' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>{p.estado}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-xs">{p.tipo === 'domicilio' ? p.cliente_nombre : p.mesero}</span>
                      <span className="font-black text-gray-800">${Number(p.total).toLocaleString('es-CO')}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          {!pedidoActivo ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 select-none">
              <DollarSign size={72} className="mb-4" />
              <p className="text-xl font-bold text-gray-400">Selecciona un pedido para cobrar</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
              <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                    {pedidoActivo.tipo === 'domicilio' ? (
                      <><Bike size={20} className="text-amber-500"/> {pedidoActivo.cliente_nombre ?? 'Domicilio'}</>
                    ) : (
                      <>Mesa {pedidoActivo.mesa_numero}</>
                    )}
                    <span className="text-gray-400 font-normal text-sm">— #{pedidoActivo.id}</span>
                  </h2>
                  <p className="text-sm text-gray-400 mt-0.5">Mesero: {pedidoActivo.mesero}</p>
                  {pedidoActivo.tipo === 'domicilio' && pedidoActivo.direccion_entrega && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={13}/> {pedidoActivo.direccion_entrega}
                    </p>
                  )}
                </div>
                <ButacaLogo size={52} variant="icon" theme="light" />
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase tracking-widest border-b border-gray-100">
                      <th className="text-left pb-3 font-semibold">Cant.</th>
                      <th className="text-left pb-3 font-semibold">Descripción</th>
                      <th className="text-right pb-3 font-semibold">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pedidoActivo.productos.map((p, i) => (
                      <tr key={i}>
                        <td className="py-3 font-bold text-gray-600 w-12">{p.cantidad}</td>
                        <td className="py-3 font-medium text-gray-800">{p.nombre}</td>
                        <td className="py-3 text-right font-bold text-gray-800">${Number(p.subtotal).toLocaleString('es-CO')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Estado domicilio */}
              {pedidoActivo.tipo === 'domicilio' && (
                <div className="px-8 py-3 border-t border-amber-100 bg-amber-50 flex items-center gap-3">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Entrega:</span>
                  {pedidoActivo.estado_domicilio === 'pendiente' && (
                    <button
                      onClick={() => actualizarEstadoDomicilio(pedidoActivo.id, 'en_camino')}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                    >
                      <Bike size={14}/> Marcar En camino
                    </button>
                  )}
                  {pedidoActivo.estado_domicilio === 'en_camino' && (
                    <>
                      <span className="text-amber-600 text-xs font-semibold flex items-center gap-1"><Bike size={14}/> En camino...</span>
                      <button
                        onClick={() => actualizarEstadoDomicilio(pedidoActivo.id, 'entregado')}
                        className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                      >
                        <Navigation size={14}/> Confirmar entregado
                      </button>
                    </>
                  )}
                  {pedidoActivo.estado_domicilio === 'entregado' && (
                    <span className="text-green-600 text-xs font-semibold flex items-center gap-1"><CheckCircle size={14}/> Entregado</span>
                  )}
                </div>
              )}

              {/* Sección de pago */}
              <div className="px-8 py-5 border-t border-gray-100 bg-gray-50">
                <div className="flex justify-between items-baseline mb-5">
                  <span className="text-gray-500 font-semibold uppercase tracking-widest text-sm">Total a pagar</span>
                  <span className="text-4xl font-black text-gray-800">${Number(pedidoActivo.total).toLocaleString('es-CO')}</span>
                </div>
                <div className={`grid gap-3 mb-5 ${pedidoActivo.tipo === 'domicilio' ? 'grid-cols-5' : 'grid-cols-4'}`}>
                  {metodos.filter(m => pedidoActivo.tipo === 'domicilio' || m.id !== 'contra_entrega').map(m => (
                    <button
                      key={m.id} onClick={() => setMetodoPago(m.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-bold ${
                        metodoPago === m.id
                          ? 'border-secondary bg-secondary/10 text-secondary'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <m.icon size={22} />{m.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={realizarCobro}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-black text-base transition-all active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg,#F5A623,#D4880A)', color: '#1a1a1a' }}
                >
                  <CheckCircle size={22} /> CONFIRMAR PAGO
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
