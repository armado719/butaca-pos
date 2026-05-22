import { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  LogOut,
  ShoppingCart,
  Send,
  Plus,
  Minus,
  Trash2,
  Bike,
  ArrowLeftRight,
  X,
  Pencil,
  CheckCircle,
  UtensilsCrossed,
  Table2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { ButacaLogo } from "../components/ButacaLogo";
import { FormularioDomicilio } from "../components/FormularioDomicilio";
import { Toaster, useToast } from "../components/Toast";
import type { DomicilioData } from "../components/FormularioDomicilio";
import type { Mesa, CategoriaMenu, ItemCarrito, Producto } from "../types";

export const MeseroUI = () => {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [menu, setMenu] = useState<CategoriaMenu[]>([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [modoDomicilio, setModoDomicilio] = useState(false);
  const [domicilioData, setDomicilioData] = useState<DomicilioData | null>(
    null,
  );
  const [mesaTransfer, setMesaTransfer] = useState<Mesa | null>(null);
  const [pedidoTransferId, setPedidoTransferId] = useState<number | null>(null);
  const [loadingTransfer, setLoadingTransfer] = useState(false);
  const [mobileTab, setMobileTab] = useState<"menu" | "pedido">("menu");

  interface DetalleItem {
    detalle_id: number;
    producto_nombre: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    observaciones: string;
  }
  const [pedidoEditar, setPedidoEditar] = useState<{
    id: number;
    mesa_numero: number;
    items: DetalleItem[];
  } | null>(null);
  const [eliminarIds, setEliminarIds] = useState<number[]>([]);
  const [agregarItems, setAgregarItems] = useState<
    { id: number; nombre: string; precio: number; cantidad: number }[]
  >([]);
  const [loadingEditar, setLoadingEditar] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toasts, toast, dismiss } = useToast();
  const { socket } = useSocket();

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const reload = () => cargarDatos();
    socket.on("nueva_comanda", reload);
    socket.on("pedido_pagado", reload);
    socket.on("mesa_transferida", reload);
    socket.on("pedido_modificado", reload);
    return () => {
      socket.off("nueva_comanda", reload);
      socket.off("pedido_pagado", reload);
      socket.off("mesa_transferida", reload);
      socket.off("pedido_modificado", reload);
    };
  }, [socket]);

  const cargarDatos = async () => {
    try {
      const [mesasRes, menuRes] = await Promise.all([
        api.get<Mesa[]>("/mesas"),
        api.get<CategoriaMenu[]>("/productos"),
      ]);
      setMesas(mesasRes.data);
      setMenu(menuRes.data);
    } catch {
      navigate("/login");
    }
  };

  const agregarAlCarrito = (producto: Producto) => {
    setCarrito((prev) => {
      const existe = prev.find((p) => p.id === producto.id);
      if (existe)
        return prev.map((p) =>
          p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p,
        );
      return [...prev, { ...producto, cantidad: 1, observaciones: "" }];
    });
  };

  const actualizarCantidad = (id: number, delta: number) => {
    setCarrito((prev) =>
      prev
        .map((p) => (p.id === id ? { ...p, cantidad: p.cantidad + delta } : p))
        .filter((p) => p.cantidad > 0),
    );
  };

  const enviarPedido = async () => {
    if (!modoDomicilio && !mesaSeleccionada)
      return toast("Selecciona una mesa primero", "warning");
    if (modoDomicilio && !domicilioData)
      return toast("Completa los datos del domicilio", "warning");
    if (carrito.length === 0) return toast("El carrito está vacío", "warning");
    try {
      const productos = carrito.map((p) => ({
        id: Number(p.id),
        cantidad: Number(p.cantidad),
        precio: Number(p.precio),
        observaciones: p.observaciones || "",
      }));
      const body = modoDomicilio
        ? { tipo: "domicilio", ...domicilioData, productos, observaciones: "" }
        : {
            tipo: "mesa",
            mesa_id: Number(mesaSeleccionada!.id),
            productos,
            observaciones: "",
          };
      await api.post("/pedidos", body);
      toast(
        modoDomicilio
          ? "¡Domicilio enviado a cocina!"
          : `¡Comanda enviada — Mesa ${mesaSeleccionada?.numero}!`,
        "success",
      );
      setCarrito([]);
      setMesaSeleccionada(null);
      setDomicilioData(null);
      setMobileTab("menu");
      cargarDatos();
    } catch (err: any) {
      const data = err?.response?.data;
      const firstError = data?.errores?.[0];
      const msg = firstError
        ? `${firstError.campo}: ${firstError.mensaje}`
        : data?.msg || "Error al enviar el pedido";
      toast(msg, "error");
    }
  };

  const abrirTransferencia = async (mesa: Mesa) => {
    try {
      const res = await api.get<any[]>("/pedidos/pendientes");
      const pedido = res.data.find((p: any) => p.mesa_id === mesa.id);
      if (!pedido) return toast("No hay pedido activo en esta mesa", "warning");
      setPedidoTransferId(pedido.id);
      setMesaTransfer(mesa);
    } catch {
      toast("Error al obtener el pedido", "error");
    }
  };

  const ejecutarTransferencia = async (mesaDestino: Mesa) => {
    if (!pedidoTransferId) return;
    setLoadingTransfer(true);
    try {
      await api.patch(`/pedidos/${pedidoTransferId}/transferir-mesa`, {
        mesa_destino_id: mesaDestino.id,
      });
      toast(
        `Mesa ${mesaTransfer?.numero} transferida a Mesa ${mesaDestino.numero}`,
        "success",
      );
      setMesaTransfer(null);
      setPedidoTransferId(null);
      cargarDatos();
    } catch (err: any) {
      toast(err?.response?.data?.msg || "Error al transferir", "error");
    } finally {
      setLoadingTransfer(false);
    }
  };

  const abrirEdicion = async (mesa: Mesa) => {
    try {
      const resPendientes = await api.get<any[]>("/pedidos/pendientes");
      const pedido = resPendientes.data.find((p: any) => p.mesa_id === mesa.id);
      if (!pedido) return toast("No hay pedido activo en esta mesa", "warning");
      const resDetalle = await api.get<DetalleItem[]>(
        `/pedidos/${pedido.id}/detalle`,
      );
      setPedidoEditar({
        id: pedido.id,
        mesa_numero: mesa.numero,
        items: resDetalle.data,
      });
      setEliminarIds([]);
      setAgregarItems([]);
    } catch {
      toast("Error al cargar el pedido", "error");
    }
  };

  const toggleEliminar = (detalle_id: number) => {
    setEliminarIds((prev) =>
      prev.includes(detalle_id)
        ? prev.filter((x) => x !== detalle_id)
        : [...prev, detalle_id],
    );
  };

  const agregarAlEditar = (prod: Producto) => {
    setAgregarItems((prev) => {
      const existe = prev.find((p) => p.id === prod.id);
      if (existe)
        return prev.map((p) =>
          p.id === prod.id ? { ...p, cantidad: p.cantidad + 1 } : p,
        );
      return [
        ...prev,
        { id: prod.id, nombre: prod.nombre, precio: prod.precio, cantidad: 1 },
      ];
    });
  };

  const quitarDelAgregar = (id: number) => {
    setAgregarItems((prev) => prev.filter((p) => p.id !== id));
  };

  const guardarEdicion = async () => {
    if (!pedidoEditar) return;
    if (eliminarIds.length === 0 && agregarItems.length === 0)
      return toast("No hay cambios para guardar", "warning");
    setLoadingEditar(true);
    try {
      await api.patch(`/pedidos/${pedidoEditar.id}/items`, {
        eliminar: eliminarIds,
        agregar: agregarItems.map((p) => ({
          id: p.id,
          cantidad: p.cantidad,
          precio: p.precio,
          observaciones: "",
        })),
      });
      toast(`Pedido Mesa ${pedidoEditar.mesa_numero} actualizado`, "success");
      setPedidoEditar(null);
      cargarDatos();
    } catch (err: any) {
      toast(
        err?.response?.data?.msg || "Error al modificar el pedido",
        "error",
      );
    } finally {
      setLoadingEditar(false);
    }
  };

  const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden relative">
      <Toaster toasts={toasts} onDismiss={dismiss} />

      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none grayscale"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1544681280-d25a782adc9b?auto=format&fit=crop&q=80&w=2000")',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Panel menú */}
      <div
        className={`${mobileTab === "menu" ? "flex" : "hidden"} md:flex flex-col flex-1 overflow-hidden border-r border-gray-200 bg-white/90 backdrop-blur-sm relative z-10 pb-16 md:pb-0`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <ButacaLogo size={40} variant="icon" theme="light" />
            <div>
              <p className="font-black text-gray-800 text-sm leading-none">
                LA BUTACA
              </p>
              <p className="text-xs text-gray-400 tracking-widest">MESERO</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
          >
            <LogOut size={15} /> Salir
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {menu.map((categoria) => (
            <div key={categoria.id} className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-0.5 w-4 bg-secondary rounded" />
                <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest">
                  {categoria.nombre}
                </h2>
                <div className="h-0.5 flex-1 bg-gray-100 rounded" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {categoria.productos.map((prod: Producto) => (
                  <button
                    key={prod.id}
                    onClick={() => agregarAlCarrito(prod)}
                    className="text-left bg-white hover:bg-yellow-50 border border-gray-200 hover:border-primary rounded-xl p-3 shadow-sm hover:shadow-md transition-all active:scale-95 group"
                  >
                    <p className="font-semibold text-gray-800 text-sm leading-tight group-hover:text-gray-900">
                      {prod.nombre}
                    </p>
                    <p className="text-primary font-black text-base mt-1.5">
                      ${prod.precio.toLocaleString("es-CO")}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel pedido (mesas + carrito) */}
      <div
        className={`${mobileTab === "pedido" ? "flex" : "hidden"} md:flex w-full md:w-80 flex-col bg-gray-50 border-l border-gray-200 pb-16 md:pb-0`}
      >
        {/* Toggle Mesa / Domicilio */}
        <div className="p-4 bg-white border-b border-gray-100">
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => {
                setModoDomicilio(false);
                setDomicilioData(null);
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                !modoDomicilio
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Mesa
            </button>
            <button
              onClick={() => {
                setModoDomicilio(true);
                setMesaSeleccionada(null);
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                modoDomicilio
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Bike size={16} /> Domicilio
            </button>
          </div>
          {!modoDomicilio ? (
            <>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Mesa
              </p>
              <div className="flex flex-wrap gap-2">
                {mesas.map((mesa) => (
                  <div key={mesa.id} className="relative group">
                    <button
                      onClick={() => setMesaSeleccionada(mesa)}
                      className={`w-12 h-10 rounded-lg font-bold text-sm transition-all ${
                        mesaSeleccionada?.id === mesa.id
                          ? "bg-secondary text-white shadow-md ring-2 ring-secondary ring-offset-1"
                          : mesa.estado === "ocupada"
                            ? "bg-red-100 text-red-500 border border-red-200"
                            : "bg-white text-gray-600 border border-gray-200 hover:border-secondary hover:text-secondary"
                      }`}
                    >
                      {mesa.numero}
                    </button>
                    {mesa.estado === "ocupada" && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirTransferencia(mesa);
                          }}
                          title="Transferir mesa"
                          className="absolute -top-2 -right-2 hidden group-hover:flex items-center justify-center w-5 h-5 bg-blue-500 text-white rounded-full shadow hover:bg-blue-600 transition"
                        >
                          <ArrowLeftRight size={10} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirEdicion(mesa);
                          }}
                          title="Editar pedido"
                          className="absolute -bottom-2 -right-2 hidden group-hover:flex items-center justify-center w-5 h-5 bg-amber-500 text-white rounded-full shadow hover:bg-amber-600 transition"
                        >
                          <Pencil size={10} />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <FormularioDomicilio onChange={setDomicilioData} />
          )}
        </div>

        {/* Carrito */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {carrito.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 select-none">
              <ShoppingCart size={44} className="mb-2" />
              <p className="text-sm">Agrega productos al pedido</p>
            </div>
          ) : (
            carrito.map((item: ItemCarrito) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">
                    {item.nombre}
                  </p>
                  <p className="text-primary font-black text-sm">
                    ${(item.precio * item.cantidad).toLocaleString("es-CO")}
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => actualizarCantidad(item.id, -1)}
                    className="text-gray-500 hover:text-secondary transition"
                  >
                    {item.cantidad === 1 ? (
                      <Trash2 size={14} />
                    ) : (
                      <Minus size={14} />
                    )}
                  </button>
                  <span className="w-4 text-center text-sm font-bold text-gray-700">
                    {item.cantidad}
                  </span>
                  <button
                    type="button"
                    onClick={() => actualizarCantidad(item.id, 1)}
                    className="text-gray-500 hover:text-primary transition"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-baseline mb-4">
            <span className="text-gray-500 text-sm font-semibold">Total</span>
            <span className="text-2xl font-black text-gray-800">
              ${total.toLocaleString("es-CO")}
            </span>
          </div>
          <button
            onClick={enviarPedido}
            disabled={
              (!modoDomicilio && !mesaSeleccionada) ||
              (modoDomicilio && !domicilioData) ||
              carrito.length === 0
            }
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background:
                (!modoDomicilio && !mesaSeleccionada) ||
                (modoDomicilio && !domicilioData) ||
                carrito.length === 0
                  ? "#e5e7eb"
                  : "linear-gradient(135deg,#F5A623,#D4880A)",
              color:
                (!modoDomicilio && !mesaSeleccionada) ||
                (modoDomicilio && !domicilioData) ||
                carrito.length === 0
                  ? "#9ca3af"
                  : "#1a1a1a",
            }}
          >
            <Send size={16} />
            {modoDomicilio
              ? domicilioData
                ? "Enviar Domicilio a Cocina"
                : "Completa los datos"
              : mesaSeleccionada
                ? `Enviar — Mesa ${mesaSeleccionada.numero}`
                : "Selecciona una mesa"}
          </button>
        </div>
      </div>

      {/* Bottom tab bar — solo móvil */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-30 shadow-lg">
        <button
          onClick={() => setMobileTab("menu")}
          className={`flex-1 flex flex-col items-center py-2.5 text-xs font-semibold transition-colors ${mobileTab === "menu" ? "text-primary" : "text-gray-400"}`}
        >
          <UtensilsCrossed size={20} className="mb-0.5" />
          Menú
        </button>
        <button
          onClick={() => setMobileTab("pedido")}
          className={`flex-1 flex flex-col items-center py-2.5 text-xs font-semibold transition-colors relative ${mobileTab === "pedido" ? "text-primary" : "text-gray-400"}`}
        >
          <Table2 size={20} className="mb-0.5" />
          Mesas
          {mesaSeleccionada && (
            <span className="absolute top-1.5 right-6 w-2 h-2 bg-green-400 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setMobileTab("pedido")}
          className={`flex-1 flex flex-col items-center py-2.5 text-xs font-semibold transition-colors relative ${mobileTab === "pedido" ? "text-primary" : "text-gray-400"}`}
        >
          <ShoppingCart size={20} className="mb-0.5" />
          Carrito
          {carrito.length > 0 && (
            <span className="absolute top-1.5 right-5 bg-secondary text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
              {carrito.length}
            </span>
          )}
        </button>
      </div>

      {/* Modal transferir mesa */}
      {mesaTransfer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-black text-gray-800 text-lg">
                  Transferir Mesa {mesaTransfer.numero}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Selecciona la mesa destino
                </p>
              </div>
              <button
                onClick={() => {
                  setMesaTransfer(null);
                  setPedidoTransferId(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {mesas
                .filter((m) => m.estado === "disponible")
                .map((m) => (
                  <button
                    key={m.id}
                    onClick={() => ejecutarTransferencia(m)}
                    disabled={loadingTransfer}
                    className="w-14 h-12 rounded-xl font-bold text-sm bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 hover:border-green-400 transition-all disabled:opacity-50"
                  >
                    {m.numero}
                  </button>
                ))}
              {mesas.filter((m) => m.estado === "disponible").length === 0 && (
                <p className="text-sm text-gray-400 text-center w-full py-4">
                  No hay mesas disponibles
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal editar pedido */}
      {pedidoEditar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-black text-gray-800 text-lg">
                  Editar Pedido — Mesa {pedidoEditar.mesa_numero}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Tilda para eliminar · Agrega productos del menú
                </p>
              </div>
              <button
                onClick={() => setPedidoEditar(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Pedido actual
                </p>
                <div className="space-y-2">
                  {pedidoEditar.items.map((item) => {
                    const marcado = eliminarIds.includes(item.detalle_id);
                    return (
                      <div
                        key={item.detalle_id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${marcado ? "bg-red-50 border-red-200 opacity-60" : "bg-gray-50 border-gray-100"}`}
                      >
                        <div>
                          <p
                            className={`font-semibold text-sm ${marcado ? "line-through text-red-400" : "text-gray-800"}`}
                          >
                            {item.producto_nombre}
                          </p>
                          <p className="text-xs text-gray-400">
                            x{item.cantidad} · $
                            {item.subtotal.toLocaleString("es-CO")}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleEliminar(item.detalle_id)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold transition ${marcado ? "bg-red-400 hover:bg-red-500" : "bg-gray-200 hover:bg-red-300 text-gray-500"}`}
                        >
                          {marcado ? (
                            <CheckCircle size={14} />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Agregar productos
                </p>
                <div className="space-y-3">
                  {menu.map((cat) => (
                    <div key={cat.id}>
                      <p className="text-xs text-gray-400 font-semibold mb-1">
                        {cat.nombre}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {cat.productos.map((prod) => {
                          const enLista = agregarItems.find(
                            (p) => p.id === prod.id,
                          );
                          return (
                            <button
                              key={prod.id}
                              onClick={() => agregarAlEditar(prod)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${enLista ? "bg-amber-100 border-amber-300 text-amber-700" : "bg-white border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-600"}`}
                            >
                              {prod.nombre}{" "}
                              {enLista ? `(x${enLista.cantidad})` : ""}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {agregarItems.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                  <p className="text-xs font-bold text-amber-700 mb-2">
                    Se agregarán:
                  </p>
                  <div className="space-y-1">
                    {agregarItems.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-xs text-amber-800">
                          x{p.cantidad} {p.nombre}
                        </span>
                        <button
                          onClick={() => quitarDelAgregar(p.id)}
                          className="text-amber-400 hover:text-amber-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setPedidoEditar(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicion}
                disabled={
                  loadingEditar ||
                  (eliminarIds.length === 0 && agregarItems.length === 0)
                }
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg,#F5A623,#D4880A)",
                }}
              >
                {loadingEditar ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
