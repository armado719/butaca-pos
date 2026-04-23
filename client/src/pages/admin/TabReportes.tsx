import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { TrendingUp, LayoutDashboard, DollarSign } from 'lucide-react';

interface Reporte {
  fecha: string;
  resumen: { total_pedidos: number; total_ventas: number; efectivo: number; nequi: number; daviplata: number; transferencia: number };
  top_productos: { nombre: string; cantidad: number; total: number }[];
  ultimos_pedidos: { id: number; total: number; estado: string; mesa_numero: number; mesero: string; metodo_pago: string; created_at: string }[];
}

export const TabReportes = () => {
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [fecha, setFecha] = useState(new Date().toLocaleDateString('sv-SE'));
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/reportes/ventas-dia?fecha=${fecha}`);
      setReporte(data);
    } catch { /* silenciar */ }
    setLoading(false);
  }, [fecha]);

  useEffect(() => { cargar(); }, [cargar]);

  const fmt = (n: number) => `$${(n || 0).toLocaleString('es-CO')}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-gray-800">Reporte del Día</h2>
        <div className="flex items-center gap-3">
          <input
            type="date" value={fecha} onChange={e => setFecha(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-secondary"
          />
          <button onClick={cargar} className="bg-primary text-darkBg font-bold px-4 py-2 rounded-lg text-sm">Actualizar</button>
        </div>
      </div>

      {loading && <p className="text-gray-400">Cargando...</p>}

      {reporte && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { label: 'Total Ventas',  value: fmt(reporte.resumen.total_ventas),   icon: <TrendingUp size={20}/>,    color: 'text-primary' },
              { label: 'Pedidos',       value: reporte.resumen.total_pedidos,        icon: <LayoutDashboard size={20}/>,color: 'text-blue-500' },
              { label: 'Efectivo',      value: fmt(reporte.resumen.efectivo),        icon: <DollarSign size={20}/>,    color: 'text-green-600' },
              { label: 'Nequi',         value: fmt(reporte.resumen.nequi),           icon: <DollarSign size={20}/>,    color: 'text-purple-500' },
              { label: 'Daviplata',     value: fmt(reporte.resumen.daviplata),       icon: <DollarSign size={20}/>,    color: 'text-red-500' },
              { label: 'Transferencia', value: fmt(reporte.resumen.transferencia),   icon: <DollarSign size={20}/>,    color: 'text-yellow-600' },
            ].map(c => (
              <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className={`${c.color} mb-2`}>{c.icon}</div>
                <p className="text-2xl font-black text-gray-800">{c.value}</p>
                <p className="text-xs text-gray-400 mt-1">{c.label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-lg mb-4">Top Productos</h3>
              {reporte.top_productos.length === 0 ? <p className="text-gray-500 text-sm">Sin datos</p> : (
                <div className="space-y-3">
                  {reporte.top_productos.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-primary font-bold w-5">#{i + 1}</span>
                        <span className="truncate max-w-[180px]">{p.nombre}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-400 mr-3">{p.cantidad} und</span>
                        <span className="font-bold text-primary">{fmt(p.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-lg mb-4">Últimos Pedidos</h3>
              {reporte.ultimos_pedidos.length === 0 ? <p className="text-gray-500 text-sm">Sin pedidos</p> : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {reporte.ultimos_pedidos.map(p => (
                    <div key={p.id} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                      <div>
                        <span className="font-bold text-gray-800">Mesa {p.mesa_numero}</span>
                        <span className="text-gray-400 ml-2">#{p.id}</span>
                        {p.metodo_pago && <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{p.metodo_pago}</span>}
                      </div>
                      <span className="font-bold text-primary">{fmt(p.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
