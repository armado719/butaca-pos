// client/src/components/FormularioDomicilio.tsx
import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Search, UserPlus, MapPin, Phone, User, FileText } from "lucide-react";

interface Cliente {
  id: number;
  nombre: string;
  telefono: string;
  direccion: string;
  notas?: string;
}

export interface DomicilioData {
  cliente_id?: number;
  cliente_nuevo?: {
    nombre: string;
    telefono: string;
    direccion: string;
    notas?: string;
  };
  direccion_entrega: string;
  costo_domicilio: number;
}

interface Props {
  onChange: (data: DomicilioData | null) => void;
}

export const FormularioDomicilio = ({ onChange }: Props) => {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<Cliente | null>(null);
  const [modoNuevo, setModoNuevo] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
    notas: "",
  });
  const [direccionEntrega, setDireccionEntrega] = useState("");
  const [costoDomicilio, setCostoDomicilio] = useState("");

  useEffect(() => {
    if (busqueda.length < 3) {
      setResultados([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/clientes?q=${busqueda}`);
        setResultados(data);
      } catch {
        setResultados([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  useEffect(() => {
    const tieneCliente =
      clienteSeleccionado ||
      (modoNuevo && nuevoCliente.nombre && nuevoCliente.telefono);
    const tieneDireccion = direccionEntrega.trim().length >= 5;

    if (!tieneCliente || !tieneDireccion) {
      onChange(null);
      return;
    }

    onChange({
      cliente_id: clienteSeleccionado?.id,
      cliente_nuevo: modoNuevo
        ? { ...nuevoCliente, direccion: direccionEntrega }
        : undefined,
      direccion_entrega: direccionEntrega,
      costo_domicilio: Number(costoDomicilio) || 0,
    });
  }, [
    clienteSeleccionado,
    modoNuevo,
    nuevoCliente,
    direccionEntrega,
    costoDomicilio,
  ]);

  const seleccionarCliente = (c: Cliente) => {
    setClienteSeleccionado(c);
    setDireccionEntrega(c.direccion);
    setResultados([]);
    setBusqueda(c.telefono);
    setModoNuevo(false);
  };

  const limpiar = () => {
    setClienteSeleccionado(null);
    setBusqueda("");
    setResultados([]);
    setModoNuevo(false);
    setNuevoCliente({ nombre: "", telefono: "", direccion: "", notas: "" });
    setDireccionEntrega("");
    setCostoDomicilio("");
  };

  return (
    <div className="space-y-3">
      {/* Búsqueda */}
      {!clienteSeleccionado && !modoNuevo && (
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Buscar cliente por teléfono
          </label>
          <div className="relative mt-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Ej: 3001234567"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          {resultados.length > 0 && (
            <ul className="mt-1 border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
              {resultados.map((c) => (
                <li
                  key={c.id}
                  onClick={() => seleccionarCliente(c)}
                  className="px-3 py-2 text-sm hover:bg-orange-50 cursor-pointer border-b last:border-b-0"
                >
                  <span className="font-medium">{c.nombre}</span>
                  <span className="text-gray-500 ml-2">{c.telefono}</span>
                  <p className="text-xs text-gray-400 truncate">
                    {c.direccion}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => {
              setModoNuevo(true);
              setNuevoCliente((prev) => ({ ...prev, telefono: busqueda }));
            }}
            className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-orange-300 text-sm text-orange-600 hover:bg-orange-50 hover:border-orange-400 font-medium transition"
          >
            <UserPlus size={15} /> Crear cliente nuevo
          </button>
        </div>
      )}

      {/* Cliente seleccionado */}
      {clienteSeleccionado && (
        <div className="flex items-start justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div>
            <p className="font-semibold text-green-800 text-sm">
              {clienteSeleccionado.nombre}
            </p>
            <p className="text-xs text-green-600">
              {clienteSeleccionado.telefono}
            </p>
          </div>
          <button
            onClick={limpiar}
            className="text-xs text-gray-400 hover:text-red-500"
          >
            Cambiar
          </button>
        </div>
      )}

      {/* Formulario cliente nuevo */}
      {modoNuevo && (
        <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold text-blue-700 uppercase">
              Nuevo cliente
            </p>
            <button
              onClick={limpiar}
              className="text-xs text-gray-400 hover:text-red-500"
            >
              Cancelar
            </button>
          </div>
          {[
            { key: "nombre", icon: User, placeholder: "Nombre completo" },
            { key: "telefono", icon: Phone, placeholder: "Teléfono" },
            { key: "notas", icon: FileText, placeholder: "Notas (opcional)" },
          ].map(({ key, icon: Icon, placeholder }) => (
            <div key={key} className="relative">
              <Icon
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={14}
              />
              <input
                type="text"
                value={(nuevoCliente as any)[key]}
                onChange={(e) =>
                  setNuevoCliente((prev) => ({
                    ...prev,
                    [key]: e.target.value,
                  }))
                }
                placeholder={placeholder}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          ))}
        </div>
      )}

      {/* Dirección de entrega y costo */}
      {(clienteSeleccionado || modoNuevo) && (
        <div className="space-y-2">
          <div className="relative">
            <MapPin
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              type="text"
              value={direccionEntrega}
              onChange={(e) => setDireccionEntrega(e.target.value)}
              placeholder="Dirección de entrega"
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 whitespace-nowrap">
              Costo envío $
            </span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={costoDomicilio}
              onChange={(e) =>
                setCostoDomicilio(e.target.value.replace(/[^0-9]/g, ""))
              }
              className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>
      )}
    </div>
  );
};
