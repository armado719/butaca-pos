import { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api";
import { useSocket } from "../../context/SocketContext";
import toast from "react-hot-toast";
import { Bike, Phone, MapPin, Clock, Package, CheckCircle } from "lucide-react";

interface Domicilio {
  id: number;
  estado: string;
  estado_domicilio: string | null;
  total: number;
  costo_domicilio: number;
  direccion_entrega: string;
  created_at: string;
  mesero: string;
  cliente_nombre: string;
  cliente_telefono: string;
  productos: { nombre: string; cantidad: number }[];
}

const estadoColor: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-700",
  en_cocina: "bg-blue-100 text-blue-700",
  listo: "bg-purple-100 text-purple-700",
  en_camino: "bg-orange-100 text-orange-700",
  entregado: "bg-green-100 text-green-700",
  pagado: "bg-gray-100 text-gray-500",
};

const estadoLabel: Record<string, string> = {
  pendiente: "Pendiente",
  en_cocina: "En cocina",
  listo: "Listo",
  en_camino: "En camino",
  entregado: "Entregado",
  pagado: "Pagado",
};

const fmt = (n: number) => `$${(n || 0).toLocaleString("es-CO")}`;

export const TabDomicilios = () => {
  const [domicilios, setDomicilios] = useState<Domicilio[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/pedidos/domicilios");
      setDomicilios(data);
    } catch {
      toast.error("Error al cargar domicilios");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!socket) return;
    socket.on("nueva_comanda", cargar);
    socket.on("domicilio_actualizado", cargar);
    socket.on("pedido_pagado", cargar);
    return () => {
      socket.off("nueva_comanda", cargar);
      socket.off("domicilio_actualizado", cargar);
      socket.off("pedido_pagado", cargar);
    };
  }, [socket, cargar]);

  const actualizarEstado = async (
    id: number,
    estado_domicilio: "en_camino" | "entregado",
  ) => {
    try {
      await api.put(`/pedidos/${id}/estado-domicilio`, { estado_domicilio });
      toast.success(
        estado_domicilio === "en_camino"
          ? "Marcado en camino"
          : "Marcado como entregado",
      );
      cargar();
    } catch {
      toast.error("Error al actualizar estado");
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse"
          >
            <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
            <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (domicilios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Bike size={48} className="mb-4 opacity-30" />
        <p className="font-bold text-lg">Sin domicilios activos</p>
        <p className="text-sm">Los pedidos a domicilio aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-gray-800">
          Domicilios ({domicilios.length})
        </h2>
        <button
          onClick={cargar}
          className="bg-primary text-darkBg font-bold px-4 py-2 rounded-lg text-sm"
        >
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {domicilios.map((d) => (
          <div
            key={d.id}
            className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3"
          >
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <p className="font-black text-gray-800 text-lg leading-tight">
                  {d.cliente_nombre}
                </p>
                <p className="text-xs text-gray-400">Pedido #{d.id}</p>
              </div>
              <span
                className={`text-xs font-bold px-2 py-1 rounded-full ${estadoColor[d.estado_domicilio || d.estado] || "bg-gray-100 text-gray-500"}`}
              >
                {estadoLabel[d.estado_domicilio || d.estado] || d.estado}
              </span>
            </div>

            {/* Info */}
            <div className="space-y-1.5 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-gray-300 shrink-0" />
                <span>{d.cliente_telefono || "Sin teléfono"}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={13} className="text-gray-300 shrink-0 mt-0.5" />
                <span className="leading-tight">{d.direccion_entrega}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-gray-300 shrink-0" />
                <span>
                  {new Date(d.created_at).toLocaleTimeString("es-CO", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            {/* Productos */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-1">
              {d.productos.map((p, i) => (
                <div
                  key={i}
                  className="flex justify-between text-xs text-gray-600"
                >
                  <span>{p.nombre}</span>
                  <span className="font-bold">x{p.cantidad}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">
                Domicilio: {fmt(d.costo_domicilio)}
              </span>
              <span className="font-black text-primary text-lg">
                {fmt(d.total)}
              </span>
            </div>

            {/* Acciones */}
            <div className="flex gap-2 pt-1">
              {(!d.estado_domicilio || d.estado_domicilio === "pendiente") && (
                <button
                  onClick={() => actualizarEstado(d.id, "en_camino")}
                  className="flex-1 flex items-center justify-center gap-2 bg-orange-50 text-orange-600 hover:bg-orange-100 font-bold py-2 rounded-xl text-sm transition"
                >
                  <Bike size={15} /> En camino
                </button>
              )}
              {d.estado_domicilio === "en_camino" && (
                <button
                  onClick={() => actualizarEstado(d.id, "entregado")}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-50 text-green-600 hover:bg-green-100 font-bold py-2 rounded-xl text-sm transition"
                >
                  <CheckCircle size={15} /> Entregado
                </button>
              )}
              {d.estado_domicilio === "entregado" && (
                <div className="flex-1 flex items-center justify-center gap-2 bg-gray-50 text-gray-400 font-bold py-2 rounded-xl text-sm">
                  <Package size={15} /> Pendiente de cobro
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
