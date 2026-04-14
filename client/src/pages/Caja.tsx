import { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, LogOut, Banknote, CreditCard, CheckCircle, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ButacaLogo } from '../components/ButacaLogo';

export const CajaUI = () => {
  const [pedidos, setPedidos]         = useState<any[]>([]);
  const [pedidoActivo, setPedidoActivo] = useState<any>(null);
  const [metodoPago, setMetodoPago]   = useState<string>('efectivo');
  const navigate = useNavigate();

  useEffect(() => { cargarPedidos(); }, []);

  const cargarPedidos = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:3001/api/pedidos/caja',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPedidos(data);
    } catch {
      alert('Error cargando la caja.');
      navigate('/login');
    }
  };

  const realizarCobro = async () => {
    if (!pedidoActivo) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:3001/api/pedidos/${pedidoActivo.id}/pagar`,
        { metodo_pago: metodoPago, monto: pedidoActivo.total },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPedidoActivo(null);
      cargarPedidos();
    } catch {
      alert('Error procesando el pago');
    }
  };

  const metodos = [
    { id: 'efectivo',      label: 'Efectivo',      icon: Banknote },
    { id: 'nequi',         label: 'Nequi',         icon: Smartphone },
    { id: 'daviplata',     label: 'Daviplata',     icon: Smartphone },
    { id: 'transferencia', label: 'Transferencia', icon: CreditCard },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden relative">
      {/* ── IZQUIERDA: Lista pedidos ── */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-xl z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <ButacaLogo size={40} variant="icon" theme="light" />
            <div>
              <p className="font-black text-gray-800 text-sm leading-none">LA BUTACA</p>
              <p className="text-xs text-gray-400 tracking-widest">CAJA</p>
            </div>
          </div>
          <button
            onClick={() => { localStorage.clear(); navigate('/login'); }}
            className="text-red-400 hover:text-red-500 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition"
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
            Pendientes por cobrar ({pedidos.length})
          </p>
          {pedidos.length === 0 ? (
            <div className="text-center text-gray-300 mt-10 text-sm">
              No hay cuentas pendientes
            </div>
          ) : (
            <div className="space-y-2">
              {pedidos.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPedidoActivo(p)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    pedidoActivo?.id === p.id
                      ? 'bg-primary/10 border-primary ring-1 ring-primary'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-gray-800">Mesa {p.mesa_numero}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      p.estado === 'listo' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>{p.estado}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs">{p.mesero}</span>
                    <span className="font-black text-gray-800">${Number(p.total).toLocaleString('es-CO')}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── DERECHA: Detalle y cobro ── */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        {!pedidoActivo ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300 select-none">
            <DollarSign size={72} className="mb-4"/>
            <p className="text-xl font-bold text-gray-400">Selecciona una mesa para cobrar</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">

            {/* Cabecera del ticket */}
            <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-800">
                  Mesa {pedidoActivo.mesa_numero} — Ticket #{pedidoActivo.id}
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">Mesero: {pedidoActivo.mesero}</p>
              </div>
              <div className="flex items-center gap-2">
                <ButacaLogo size={52} variant="icon" theme="light" />
              </div>
            </div>

            {/* Productos */}
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
                  {pedidoActivo.productos.map((p: any, i: number) => (
                    <tr key={i}>
                      <td className="py-3 font-bold text-gray-600 w-12">{p.cantidad}</td>
                      <td className="py-3 font-medium text-gray-800">{p.nombre}</td>
                      <td className="py-3 text-right font-bold text-gray-800">
                        ${Number(p.subtotal).toLocaleString('es-CO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sección de pago */}
            <div className="px-8 py-5 border-t border-gray-100 bg-gray-50">
              {/* Total */}
              <div className="flex justify-between items-baseline mb-5">
                <span className="text-gray-500 font-semibold uppercase tracking-widest text-sm">Total a pagar</span>
                <span className="text-4xl font-black text-gray-800">
                  ${Number(pedidoActivo.total).toLocaleString('es-CO')}
                </span>
              </div>

              {/* Métodos de pago */}
              <div className="grid grid-cols-4 gap-3 mb-5">
                {metodos.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMetodoPago(m.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-bold ${
                      metodoPago === m.id
                        ? 'border-secondary bg-secondary/10 text-secondary'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <m.icon size={22}/>
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Botón confirmar */}
              <button
                onClick={realizarCobro}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-black text-base transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg,#F5A623,#D4880A)', color: '#1a1a1a' }}
              >
                <CheckCircle size={22}/> CONFIRMAR PAGO
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
