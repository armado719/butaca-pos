import { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api";
import { useSocket } from "../../context/SocketContext";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { ModalOverlay, LabelInput } from "./shared";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import type { Mesa } from "../../types";

export const TabMesas = () => {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [modal, setModal] = useState<Partial<Mesa> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    try {
      const { data: res } = await api.get("/admin/mesas");
      setMesas(res.data || res);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const { socket } = useSocket();

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!socket) return;
    socket.on("nueva_comanda", cargar);
    socket.on("pedido_pagado", cargar);
    socket.on("mesa_transferida", cargar);
    return () => {
      socket.off("nueva_comanda", cargar);
      socket.off("pedido_pagado", cargar);
      socket.off("mesa_transferida", cargar);
    };
  }, [socket, cargar]);

  const guardar = async () => {
    if (!modal) return;
    try {
      if (modal.id) await api.put(`/admin/mesas/${modal.id}`, modal);
      else await api.post("/admin/mesas", modal);
      toast.success("Mesa guardada correctamente");
      setModal(null);
      cargar();
    } catch (err: any) {
      toast.error(err.response?.data?.msg || "Error al guardar mesa");
    }
  };

  const eliminar = (id: number) => {
    setConfirmDelete(id);
  };

  const confirmarEliminar = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/admin/mesas/${confirmDelete}`);
      toast.success("Mesa eliminada");
      setConfirmDelete(null);
      cargar();
    } catch {
      toast.error("No se puede eliminar una mesa con pedidos activos");
    }
  };

  const estadoColor: Record<string, string> = {
    disponible: "text-green-700 bg-green-100",
    ocupada: "text-red-700 bg-red-100",
    reservada: "text-yellow-700 bg-yellow-100",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-gray-800">
          Mesas ({mesas.length})
        </h2>
        <button
          onClick={() => setModal({ capacidad: 4 })}
          className="flex items-center gap-2 bg-primary text-darkBg font-bold px-4 py-2 rounded-lg text-sm"
        >
          <Plus size={16} /> Nueva Mesa
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {mesas.map((m) => (
          <div
            key={m.id}
            className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center"
          >
            <div className="text-4xl font-black text-primary mb-1">
              {m.numero}
            </div>
            <div className="text-xs text-gray-400 mb-2">
              {m.capacidad} personas
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium mb-4 ${estadoColor[m.estado]}`}
            >
              {m.estado}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setModal(m)}
                className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-gray-600"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => eliminar(m.id)}
                className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/40 transition text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {modal !== null && (
        <ModalOverlay onClose={() => setModal(null)}>
          <h3 className="text-xl font-black text-gray-800 mb-5">
            {modal.id ? "Editar" : "Nueva"} Mesa
          </h3>
          <div className="space-y-4">
            <LabelInput
              label="Número de Mesa"
              type="number"
              value={String(modal.numero || "")}
              onChange={(v) => setModal({ ...modal, numero: Number(v) })}
            />
            <LabelInput
              label="Capacidad"
              type="number"
              value={String(modal.capacidad || 4)}
              onChange={(v) => setModal({ ...modal, capacidad: Number(v) })}
            />
            {modal.id && (
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Estado
                </label>
                <select
                  value={modal.estado || "disponible"}
                  onChange={(e) =>
                    setModal({ ...modal, estado: e.target.value as any })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-secondary"
                >
                  {["disponible", "ocupada", "reservada"].map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={guardar}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-darkBg font-bold py-2.5 rounded-lg"
            >
              <Check size={16} /> Guardar
            </button>
            <button
              onClick={() => setModal(null)}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-600 hover:bg-gray-200 py-2.5 rounded-lg transition"
            >
              <X size={16} /> Cancelar
            </button>
          </div>
        </ModalOverlay>
      )}
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        title="¿Eliminar Mesa?"
        message="Esta acción no se puede deshacer. La mesa se eliminará permanentemente."
        onConfirm={confirmarEliminar}
        onCancel={() => setConfirmDelete(null)}
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
};
