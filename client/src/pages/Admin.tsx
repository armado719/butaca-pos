import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  LayoutDashboard, UtensilsCrossed, Table2, Users,
  TrendingUp, LogOut, Plus, Pencil, Trash2, ToggleLeft,
  ToggleRight, X, Check, DollarSign,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ButacaLogo } from '../components/ButacaLogo';

const API = 'http://localhost:3001/api';

type Tab = 'reportes' | 'productos' | 'mesas' | 'usuarios';

interface Categoria { id: number; nombre: string; }
interface Producto { id: number; categoria_id: number; nombre: string; descripcion: string; precio: number; disponible: number; categoria_nombre: string; }
interface Mesa { id: number; numero: number; capacidad: number; estado: string; }
interface Usuario { id: number; nombre: string; email: string; rol: string; activo: number; }
interface Reporte {
  fecha: string;
  resumen: { total_pedidos: number; total_ventas: number; efectivo: number; nequi: number; daviplata: number; transferencia: number; };
  top_productos: { nombre: string; cantidad: number; total: number; }[];
  ultimos_pedidos: { id: number; total: number; estado: string; mesa_numero: number; mesero: string; metodo_pago: string; created_at: string; }[];
}

export const AdminUI = () => {
  const [tab, setTab] = useState<Tab>('reportes');
  const { logout, token } = useAuth();
  const navigate = useNavigate();
  const headers = { Authorization: `Bearer ${token}` };

  const handleLogout = () => { logout(); navigate('/login'); };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'reportes',  label: 'Reportes',  icon: <TrendingUp size={18} /> },
    { id: 'productos', label: 'Productos', icon: <UtensilsCrossed size={18} /> },
    { id: 'mesas',     label: 'Mesas',     icon: <Table2 size={18} /> },
    { id: 'usuarios',  label: 'Usuarios',  icon: <Users size={18} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-col items-center">
          <ButacaLogo size={90} theme="light" />
          <p className="text-xs text-gray-400 tracking-widest mt-1 uppercase">Panel Admin</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-secondary text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition"
          >
            <LogOut size={18} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6 text-gray-400 text-sm">
            <LayoutDashboard size={16} />
            <span>Admin</span>
            <span>/</span>
            <span className="text-gray-700 font-semibold capitalize">{tab}</span>
          </div>

          {tab === 'reportes'  && <TabReportes  headers={headers} />}
          {tab === 'productos' && <TabProductos headers={headers} />}
          {tab === 'mesas'     && <TabMesas     headers={headers} />}
          {tab === 'usuarios'  && <TabUsuarios  headers={headers} />}
        </div>
      </main>
    </div>
  );
};

// ─── TAB REPORTES ────────────────────────────────────────────────────────────

const TabReportes = ({ headers }: { headers: Record<string,string> }) => {
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/reportes/ventas-dia?fecha=${fecha}`, { headers });
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
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-secondary"
          />
          <button onClick={cargar} className="bg-primary text-darkBg font-bold px-4 py-2 rounded-lg text-sm">
            Actualizar
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-400">Cargando...</p>}

      {reporte && (
        <>
          {/* Tarjetas resumen */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { label: 'Total Ventas', value: fmt(reporte.resumen.total_ventas), icon: <TrendingUp size={20}/>, color: 'text-primary' },
              { label: 'Pedidos',      value: reporte.resumen.total_pedidos,     icon: <LayoutDashboard size={20}/>, color: 'text-blue-500' },
              { label: 'Efectivo',     value: fmt(reporte.resumen.efectivo),     icon: <DollarSign size={20}/>, color: 'text-green-600' },
              { label: 'Nequi',        value: fmt(reporte.resumen.nequi),        icon: <DollarSign size={20}/>, color: 'text-purple-500' },
              { label: 'Daviplata',    value: fmt(reporte.resumen.daviplata),    icon: <DollarSign size={20}/>, color: 'text-red-500' },
              { label: 'Transferencia',value: fmt(reporte.resumen.transferencia),icon: <DollarSign size={20}/>, color: 'text-yellow-600' },
            ].map(c => (
              <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className={`${c.color} mb-2`}>{c.icon}</div>
                <p className="text-2xl font-black text-gray-800">{c.value}</p>
                <p className="text-xs text-gray-400 mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top productos */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-lg mb-4">Top Productos</h3>
              {reporte.top_productos.length === 0
                ? <p className="text-gray-500 text-sm">Sin datos</p>
                : <div className="space-y-3">
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
              }
            </div>

            {/* Últimos pedidos */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-lg mb-4">Últimos Pedidos</h3>
              {reporte.ultimos_pedidos.length === 0
                ? <p className="text-gray-500 text-sm">Sin pedidos</p>
                : <div className="space-y-2 max-h-64 overflow-y-auto">
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
              }
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── TAB PRODUCTOS ───────────────────────────────────────────────────────────

const TabProductos = ({ headers }: { headers: Record<string,string> }) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [modal, setModal] = useState<Partial<Producto> | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(async () => {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      axios.get(`${API}/admin/productos`, { headers }),
      axios.get(`${API}/admin/categorias`, { headers }),
    ]);
    setProductos(prods);
    setCategorias(cats);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    if (!modal) return;
    try {
      if (modal.id) {
        await axios.put(`${API}/admin/productos/${modal.id}`, modal, { headers });
      } else {
        await axios.post(`${API}/admin/productos`, modal, { headers });
      }
      setModal(null);
      cargar();
    } catch { alert('Error al guardar producto'); }
  };

  const toggleDisponible = async (id: number) => {
    await axios.patch(`${API}/admin/productos/${id}/toggle`, {}, { headers });
    cargar();
  };

  const filtrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.categoria_nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-gray-800">Productos ({productos.length})</h2>
        <button
          onClick={() => setModal({ disponible: 1 })}
          className="flex items-center gap-2 bg-primary text-darkBg font-bold px-4 py-2 rounded-lg text-sm"
        >
          <Plus size={16} /> Nuevo Producto
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre o categoría..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 mb-4 focus:outline-none focus:border-secondary"
      />

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-gray-400 text-xs uppercase">
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3">Categoría</th>
              <th className="text-right px-4 py-3">Precio</th>
              <th className="text-center px-4 py-3">Disponible</th>
              <th className="text-center px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtrados.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
                <td className="px-4 py-3 text-gray-400">{p.categoria_nombre}</td>
                <td className="px-4 py-3 text-right text-primary font-bold">
                  ${(p.precio).toLocaleString('es-CO')}
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleDisponible(p.id)}>
                    {p.disponible
                      ? <ToggleRight size={24} className="text-green-400" />
                      : <ToggleLeft  size={24} className="text-gray-500" />
                    }
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => setModal(p)}
                    className="text-gray-400 hover:text-gray-700 transition p-1"
                  >
                    <Pencil size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Producto */}
      {modal !== null && (
        <ModalOverlay onClose={() => setModal(null)}>
          <h3 className="text-xl font-black text-gray-800 mb-5">{modal.id ? 'Editar' : 'Nuevo'} Producto</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Categoría</label>
              <select
                value={modal.categoria_id || ''}
                onChange={e => setModal({ ...modal, categoria_id: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-secondary"
              >
                <option value="">Selecciona...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <LabelInput label="Nombre" value={modal.nombre || ''} onChange={v => setModal({ ...modal, nombre: v })} />
            <LabelInput label="Descripción" value={modal.descripcion || ''} onChange={v => setModal({ ...modal, descripcion: v })} />
            <LabelInput label="Precio (COP)" type="number" value={String(modal.precio || '')} onChange={v => setModal({ ...modal, precio: Number(v) })} />
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={guardar} className="flex-1 flex items-center justify-center gap-2 bg-primary text-darkBg font-bold py-2.5 rounded-lg">
              <Check size={16} /> Guardar
            </button>
            <button onClick={() => setModal(null)} className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-600 hover:bg-gray-200 py-2.5 rounded-lg transition">
              <X size={16} /> Cancelar
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

// ─── TAB MESAS ───────────────────────────────────────────────────────────────

const TabMesas = ({ headers }: { headers: Record<string,string> }) => {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [modal, setModal] = useState<Partial<Mesa> | null>(null);

  const cargar = useCallback(async () => {
    const { data } = await axios.get(`${API}/admin/mesas`, { headers });
    setMesas(data);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    if (!modal) return;
    try {
      if (modal.id) {
        await axios.put(`${API}/admin/mesas/${modal.id}`, modal, { headers });
      } else {
        await axios.post(`${API}/admin/mesas`, modal, { headers });
      }
      setModal(null);
      cargar();
    } catch (err: any) {
      alert(err.response?.data?.msg || 'Error al guardar mesa');
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar esta mesa?')) return;
    try {
      await axios.delete(`${API}/admin/mesas/${id}`, { headers });
      cargar();
    } catch { alert('No se puede eliminar una mesa con pedidos activos'); }
  };

  const estadoColor: Record<string, string> = {
    disponible: 'text-green-700 bg-green-100',
    ocupada:    'text-red-700 bg-red-100',
    reservada:  'text-yellow-700 bg-yellow-100',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-gray-800">Mesas ({mesas.length})</h2>
        <button
          onClick={() => setModal({ capacidad: 4 })}
          className="flex items-center gap-2 bg-primary text-darkBg font-bold px-4 py-2 rounded-lg text-sm"
        >
          <Plus size={16} /> Nueva Mesa
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {mesas.map(m => (
          <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center">
            <div className="text-4xl font-black text-primary mb-1">{m.numero}</div>
            <div className="text-xs text-gray-400 mb-2">{m.capacidad} personas</div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium mb-4 ${estadoColor[m.estado]}`}>
              {m.estado}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setModal(m)} className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-gray-600">
                <Pencil size={14} />
              </button>
              <button onClick={() => eliminar(m.id)} className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/40 transition text-red-400">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal !== null && (
        <ModalOverlay onClose={() => setModal(null)}>
          <h3 className="text-xl font-black text-gray-800 mb-5">{modal.id ? 'Editar' : 'Nueva'} Mesa</h3>
          <div className="space-y-4">
            <LabelInput label="Número de Mesa" type="number" value={String(modal.numero || '')} onChange={v => setModal({ ...modal, numero: Number(v) })} />
            <LabelInput label="Capacidad" type="number" value={String(modal.capacidad || 4)} onChange={v => setModal({ ...modal, capacidad: Number(v) })} />
            {modal.id && (
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Estado</label>
                <select
                  value={modal.estado || 'disponible'}
                  onChange={e => setModal({ ...modal, estado: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-secondary"
                >
                  {['disponible', 'ocupada', 'reservada'].map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={guardar} className="flex-1 flex items-center justify-center gap-2 bg-primary text-darkBg font-bold py-2.5 rounded-lg">
              <Check size={16} /> Guardar
            </button>
            <button onClick={() => setModal(null)} className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-600 hover:bg-gray-200 py-2.5 rounded-lg transition">
              <X size={16} /> Cancelar
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

// ─── TAB USUARIOS ────────────────────────────────────────────────────────────

const TabUsuarios = ({ headers }: { headers: Record<string,string> }) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [modal, setModal] = useState<(Partial<Usuario> & { password?: string }) | null>(null);

  const cargar = useCallback(async () => {
    const { data } = await axios.get(`${API}/admin/usuarios`, { headers });
    setUsuarios(data);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    if (!modal) return;
    try {
      if (modal.id) {
        await axios.put(`${API}/admin/usuarios/${modal.id}`, modal, { headers });
      } else {
        await axios.post(`${API}/admin/usuarios`, modal, { headers });
      }
      setModal(null);
      cargar();
    } catch (err: any) {
      alert(err.response?.data?.msg || 'Error al guardar usuario');
    }
  };

  const toggle = async (id: number) => {
    await axios.patch(`${API}/admin/usuarios/${id}/toggle`, {}, { headers });
    cargar();
  };

  const rolColor: Record<string, string> = {
    admin:   'bg-primary/20 text-primary',
    mesero:  'bg-blue-100 text-blue-600',
    cocina:  'bg-orange-100 text-orange-600',
    cajero:  'bg-green-100 text-green-600',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-gray-800">Usuarios ({usuarios.length})</h2>
        <button
          onClick={() => setModal({ activo: 1 })}
          className="flex items-center gap-2 bg-primary text-darkBg font-bold px-4 py-2 rounded-lg text-sm"
        >
          <Plus size={16} /> Nuevo Usuario
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-gray-400 text-xs uppercase">
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-center px-4 py-3">Rol</th>
              <th className="text-center px-4 py-3">Estado</th>
              <th className="text-center px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-medium text-gray-800">{u.nombre}</td>
                <td className="px-4 py-3 text-gray-400">{u.email}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${rolColor[u.rol]}`}>
                    {u.rol}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggle(u.id)}>
                    {u.activo
                      ? <ToggleRight size={22} className="text-green-400" />
                      : <ToggleLeft  size={22} className="text-gray-500" />
                    }
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => setModal(u)} className="text-gray-400 hover:text-gray-700 transition p-1">
                    <Pencil size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <ModalOverlay onClose={() => setModal(null)}>
          <h3 className="text-xl font-black text-gray-800 mb-5">{modal.id ? 'Editar' : 'Nuevo'} Usuario</h3>
          <div className="space-y-4">
            <LabelInput label="Nombre completo" value={modal.nombre || ''} onChange={v => setModal({ ...modal, nombre: v })} />
            <LabelInput label="Correo electrónico" type="email" value={modal.email || ''} onChange={v => setModal({ ...modal, email: v })} />
            <LabelInput
              label={modal.id ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
              type="password"
              value={(modal as any).password || ''}
              onChange={v => setModal({ ...modal, password: v })}
            />
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Rol</label>
              <select
                value={modal.rol || ''}
                onChange={e => setModal({ ...modal, rol: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-secondary"
              >
                <option value="">Selecciona...</option>
                {['admin', 'mesero', 'cocina', 'cajero'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={guardar} className="flex-1 flex items-center justify-center gap-2 bg-primary text-darkBg font-bold py-2.5 rounded-lg">
              <Check size={16} /> Guardar
            </button>
            <button onClick={() => setModal(null)} className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-600 hover:bg-gray-200 py-2.5 rounded-lg transition">
              <X size={16} /> Cancelar
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const ModalOverlay = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md relative shadow-xl">
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
        <X size={20} />
      </button>
      {children}
    </div>
  </div>
);

const LabelInput = ({
  label, value, onChange, type = 'text'
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) => (
  <div>
    <label className="text-xs text-gray-400 mb-1 block">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-secondary transition"
    />
  </div>
);
