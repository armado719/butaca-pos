import { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, LogOut, Banknote, CreditCard, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CajaUI = () => {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [pedidoActivo, setPedidoActivo] = useState<any>(null);
  const [metodoPago, setMetodoPago] = useState<string>('efectivo');

  const navigate = useNavigate();

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3001/api/pedidos/caja', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPedidos(res.data);
    } catch (error) {
      console.error(error);
      alert('Error cargando la caja. Inicia sesión de nuevo.');
      navigate('/');
    }
  };

  const realizarCobro = async () => {
    if (!pedidoActivo) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:3001/api/pedidos/${pedidoActivo.id}/pagar`, {
        metodo_pago: metodoPago,
        monto: pedidoActivo.total
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`✅ Cobro exitoso con ${metodoPago.toUpperCase()} por $${pedidoActivo.total.toLocaleString()}`);
      setPedidoActivo(null);
      cargarPedidos(); // Recargar lista
    } catch (error) {
      alert('Error procesando el pago');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      
      {/* PANEL IZQUIERDO: Lista de Pedidos por Cobrar */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col shadow-lg z-10">
        <div className="bg-darkBg p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <DollarSign className="text-primary" />
            <h1 className="text-xl font-bold">Caja Frontal</h1>
          </div>
          <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-gray-400 hover:text-white transition">
            <LogOut size={20} />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto bg-gray-50">
          <h2 className="text-gray-500 font-bold mb-4 uppercase text-xs">Módulos Listos y Entregados</h2>
          
          {pedidos.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">
              No hay cuentas pendientes por cobrar.
            </div>
          ) : (
            <div className="space-y-3">
              {pedidos.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => setPedidoActivo(p)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border ${
                    pedidoActivo?.id === p.id 
                      ? 'bg-primary/10 border-primary ring-1 ring-primary' 
                      : 'bg-white border-gray-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-black text-lg text-darkBg">Mesa {p.mesa_numero}</span>
                    <span className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded-lg">{p.estado}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-gray-500 text-sm">Mesero: {p.mesero}</span>
                    <span className="font-bold text-xl text-darkBg">${p.total.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PANEL DERECHO: Detalle y Checkout */}
      <div className="w-2/3 bg-gray-100 flex flex-col p-8">
        {!pedidoActivo ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <DollarSign size={80} className="mb-4 opacity-20" />
            <h2 className="text-2xl font-bold">Selecciona una mesa para liquidar</h2>
          </div>
        ) : (
          <div className="flex flex-col h-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200">
            
            <div className="bg-darkBg text-white p-6 text-center">
              <h2 className="text-2xl font-black text-primary">Tirilla de Cobro - Mesa {pedidoActivo.mesa_numero}</h2>
              <p className="text-gray-400 mt-1">Ticket #{pedidoActivo.id}</p>
            </div>

            <div className="flex-1 p-8 overflow-y-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-gray-500">
                    <th className="pb-3">CANT</th>
                    <th className="pb-3">DESCRIPCIÓN</th>
                    <th className="pb-3 text-right">SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pedidoActivo.productos.map((prod: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-4 font-bold text-gray-700">{prod.cantidad}</td>
                      <td className="py-4 font-medium">{prod.nombre}</td>
                      <td className="py-4 text-right font-bold text-gray-800">${prod.subtotal.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SECCIÓN DE PAGO */}
            <div className="p-8 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between items-center mb-8">
                <span className="text-gray-500 text-lg uppercase font-bold tracking-widest">Total a Pagar</span>
                <span className="text-5xl font-black text-darkBg">${pedidoActivo.total.toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { id: 'efectivo', icon: Banknote, label: 'Efectivo' },
                  { id: 'transferencia', icon: CreditCard, label: 'Transferencia' },
                  { id: 'nequi', icon: DollarSign, label: 'Nequi' },
                  { id: 'daviplata', icon: DollarSign, label: 'Daviplata' }
                ].map(metodo => (
                  <button
                    key={metodo.id}
                    onClick={() => setMetodoPago(metodo.id)}
                    className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${
                      metodoPago === metodo.id 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <metodo.icon size={28} />
                    <span className="font-bold">{metodo.label}</span>
                  </button>
                ))}
              </div>

              <button 
                onClick={realizarCobro}
                className="w-full bg-primary hover:bg-yellow-400 text-darkBg font-black text-xl py-5 rounded-2xl flex justify-center items-center gap-3 shadow-lg hover:shadow-xl transition-all"
              >
                <CheckCircle size={28} />
                CONFIRMAR PAGO
              </button>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};
