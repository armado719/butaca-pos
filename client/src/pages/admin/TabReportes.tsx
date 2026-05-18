import { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api";
import { useSocket } from "../../context/SocketContext";
import {
  TrendingUp,
  LayoutDashboard,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  TrendingDown,
  Wallet,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Reporte {
  fecha: string;
  resumen: {
    total_pedidos: number;
    total_ventas: number;
    efectivo: number;
    nequi: number;
    daviplata: number;
    transferencia: number;
  };
  top_productos: { nombre: string; cantidad: number; total: number }[];
  ultimos_pedidos: {
    id: number;
    total: number;
    estado: string;
    mesa_numero: number;
    mesero: string;
    metodo_pago: string;
    created_at: string;
  }[];
  resumen_egresos: {
    total_egresos: number;
    nomina: number;
    insumos: number;
    servicios: number;
    mantenimiento: number;
    otros: number;
  };
  ultimos_egresos: {
    id: number;
    concepto: string;
    monto: number;
    categoria: string;
    fecha: string;
    empleado_nombre?: string;
    usuario_nombre: string;
  }[];
}

export const TabReportes = () => {
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [fecha, setFecha] = useState(
    sessionStorage.getItem("reportes_fecha") ||
      new Date().toLocaleDateString("sv-SE"),
  );
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();

  const updateFecha = (v: string) => {
    setFecha(v);
    sessionStorage.setItem("reportes_fecha", v);
  };

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/reportes/ventas-dia?fecha=${fecha}`);
      setReporte(data);
    } catch {
      /* silenciar */
    }
    setLoading(false);
  }, [fecha]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!socket) return;
    socket.on("pedido_pagado", cargar);
    return () => {
      socket.off("pedido_pagado", cargar);
    };
  }, [socket, cargar]);

  const chartDataMetodos = reporte
    ? [
        {
          name: "Efectivo",
          value: Number(reporte.resumen.efectivo),
          color: "#10b981",
        },
        {
          name: "Nequi",
          value: Number(reporte.resumen.nequi),
          color: "#a855f7",
        },
        {
          name: "Daviplata",
          value: Number(reporte.resumen.daviplata),
          color: "#ef4444",
        },
        {
          name: "Transferencia",
          value: Number(reporte.resumen.transferencia),
          color: "#eab308",
        },
      ].filter((d) => d.value > 0)
    : [];

  const chartDataTop = reporte
    ? reporte.top_productos.slice(0, 5).map((p) => ({
        ...p,
        cantidad: Number(p.cantidad),
        total: Number(p.total),
      }))
    : [];

  const fmt = (n: number) => `$${(n || 0).toLocaleString("es-CO")}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-gray-800">Reporte del Día</h2>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={fecha}
            onChange={(e) => updateFecha(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-secondary"
          />
          <button
            onClick={cargar}
            className="bg-primary text-darkBg font-bold px-4 py-2 rounded-lg text-sm"
          >
            Actualizar
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-400">Cargando...</p>}

      {reporte && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              {
                label: "Total Ventas",
                value: fmt(reporte.resumen.total_ventas),
                icon: <TrendingUp size={20} />,
                color: "text-primary",
              },
              {
                label: "Pedidos",
                value: reporte.resumen.total_pedidos,
                icon: <LayoutDashboard size={20} />,
                color: "text-blue-500",
              },
              {
                label: "Efectivo",
                value: fmt(reporte.resumen.efectivo),
                icon: <DollarSign size={20} />,
                color: "text-green-600",
              },
              {
                label: "Nequi",
                value: fmt(reporte.resumen.nequi),
                icon: <DollarSign size={20} />,
                color: "text-purple-500",
              },
              {
                label: "Daviplata",
                value: fmt(reporte.resumen.daviplata),
                icon: <DollarSign size={20} />,
                color: "text-red-500",
              },
              {
                label: "Transferencia",
                value: fmt(reporte.resumen.transferencia),
                icon: <DollarSign size={20} />,
                color: "text-yellow-600",
              },
            ].map((c) => (
              <div
                key={c.label}
                className="bg-white border border-gray-200 rounded-xl p-4"
              >
                <div className={`${c.color} mb-2`}>{c.icon}</div>
                <p className="text-2xl font-black text-gray-800">{c.value}</p>
                <p className="text-xs text-gray-400 mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-5 h-[300px] shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <PieIcon size={18} className="text-secondary" />
                <h3 className="font-bold text-gray-800">
                  Distribución de Pagos
                </h3>
              </div>
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={chartDataMetodos}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartDataMetodos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => fmt(Number(value || 0))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 h-[300px] shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={18} className="text-primary" />
                <h3 className="font-bold text-gray-800">
                  Top 5 Productos (Ingresos $)
                </h3>
              </div>
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={chartDataTop}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f3f4f6"
                  />
                  <XAxis
                    dataKey="nombre"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: "#f9fafb" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value: any) => [
                      fmt(Number(value)),
                      "Ventas Total",
                    ]}
                  />
                  <Bar
                    dataKey="total"
                    fill="#f5a623"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Egresos del día */}
          {reporte.resumen_egresos && (
            <div className="mb-8">
              <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                <TrendingDown size={20} className="text-red-500" /> Egresos del
                Día
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-4">
                {[
                  {
                    label: "Total Egresos",
                    value: fmt(reporte.resumen_egresos.total_egresos),
                    color: "text-red-600",
                  },
                  {
                    label: "Nómina",
                    value: fmt(reporte.resumen_egresos.nomina),
                    color: "text-orange-500",
                  },
                  {
                    label: "Insumos",
                    value: fmt(reporte.resumen_egresos.insumos),
                    color: "text-yellow-600",
                  },
                  {
                    label: "Servicios",
                    value: fmt(reporte.resumen_egresos.servicios),
                    color: "text-blue-500",
                  },
                  {
                    label: "Mantenimiento",
                    value: fmt(reporte.resumen_egresos.mantenimiento),
                    color: "text-purple-500",
                  },
                  {
                    label: "Otros",
                    value: fmt(reporte.resumen_egresos.otros),
                    color: "text-gray-500",
                  },
                  {
                    label: "Utilidad",
                    value: fmt(
                      Number(reporte.resumen.total_ventas) -
                        Number(reporte.resumen_egresos.total_egresos),
                    ),
                    color:
                      Number(reporte.resumen.total_ventas) -
                        Number(reporte.resumen_egresos.total_egresos) >=
                      0
                        ? "text-green-600"
                        : "text-red-600",
                  },
                ].map((c) => (
                  <div
                    key={c.label}
                    className="bg-white border border-gray-200 rounded-xl p-4"
                  >
                    <div className={`${c.color} mb-2`}>
                      {c.label === "Utilidad" ? (
                        <Wallet size={20} />
                      ) : (
                        <DollarSign size={20} />
                      )}
                    </div>
                    <p className={`text-xl font-black ${c.color}`}>{c.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{c.label}</p>
                  </div>
                ))}
              </div>

              {reporte.ultimos_egresos.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h4 className="font-bold text-sm text-gray-700 mb-3">
                    Detalle de Egresos
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {reporte.ultimos_egresos.map((e) => (
                      <div
                        key={e.id}
                        className="flex justify-between items-center text-sm border-b border-gray-100 pb-2"
                      >
                        <div>
                          <span className="font-medium text-gray-800">
                            {e.concepto}
                          </span>
                          <span className="ml-2 text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded capitalize">
                            {e.categoria}
                          </span>
                          {e.empleado_nombre && (
                            <span className="ml-1 text-xs text-gray-400">
                              — {e.empleado_nombre}
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-red-500">
                          {fmt(Number(e.monto))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-lg mb-4">Top Productos</h3>
              {reporte.top_productos.length === 0 ? (
                <p className="text-gray-500 text-sm">Sin datos</p>
              ) : (
                <div className="space-y-3">
                  {reporte.top_productos.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-primary font-bold w-5">
                          #{i + 1}
                        </span>
                        <span className="truncate max-w-[180px]">
                          {p.nombre}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-400 mr-3">
                          {p.cantidad} und
                        </span>
                        <span className="font-bold text-primary">
                          {fmt(p.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-lg mb-4">Últimos Pedidos</h3>
              {reporte.ultimos_pedidos.length === 0 ? (
                <p className="text-gray-500 text-sm">Sin pedidos</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {reporte.ultimos_pedidos.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-center text-sm border-b border-gray-100 pb-2"
                    >
                      <div>
                        <span className="font-bold text-gray-800">
                          Mesa {p.mesa_numero}
                        </span>
                        <span className="text-gray-400 ml-2">#{p.id}</span>
                        {p.metodo_pago && (
                          <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                            {p.metodo_pago}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-primary">
                        {fmt(p.total)}
                      </span>
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
