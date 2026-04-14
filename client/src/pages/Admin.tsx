import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  LayoutDashboard, UtensilsCrossed, Table2, Users,
  TrendingUp, LogOut, Plus, Pencil, Trash2, ToggleLeft,
  ToggleRight, X, Check, DollarSign, Printer, FileSpreadsheet, Eye, LayoutGrid, List
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ButacaLogo } from '../components/ButacaLogo';

const API = 'http://localhost:3001/api';

type Tab = 'reportes' | 'productos' | 'mesas' | 'usuarios' | 'egresos' | 'empleados' | 'inventario';

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
    { id: 'egresos',   label: 'Egresos',   icon: <DollarSign size={18} /> },
    { id: 'empleados', label: 'Empleados', icon: <Users size={18} /> },
    { id: 'inventario',label: 'Inventario',icon: <Table2 size={18} /> },
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
      <main className="flex-1 overflow-y-auto relative">
        {/* Banner Decorativo con Parallax */}
        <div className="h-40 w-full relative overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=2000" 
            className="absolute inset-0 w-full h-full object-cover scale-110 animate-pulse-slow" 
            alt="Admin Banner"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-darkBg/90 via-darkBg/50 to-transparent flex flex-col justify-center px-8">
             <div className="flex items-center gap-2 text-primary/80 text-xs font-black uppercase tracking-[0.3em] mb-1">
               <div className="w-8 h-0.5 bg-primary" />
               La Butaca Administrativa
             </div>
             <h1 className="text-white text-3xl font-black uppercase tracking-tighter">
               {tab}
             </h1>
          </div>
        </div>

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
          {tab === 'egresos'   && <TabEgresos   headers={headers} />}
          {tab === 'empleados' && <TabEmpleados headers={headers} />}
          {tab === 'inventario'&& <TabInventario headers={headers} />}
        </div>
      </main>
    </div>
  );
};

// ─── TAB REPORTES ────────────────────────────────────────────────────────────

const TabReportes = ({ headers }: { headers: Record<string,string> }) => {
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [fecha, setFecha] = useState(new Date().toLocaleDateString('sv-SE'));
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

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
        <div className="flex gap-2">
          <div className="flex bg-gray-100 p-1 rounded-lg mr-2">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-secondary' : 'text-gray-400'}`}><List size={18}/></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-secondary' : 'text-gray-400'}`}><LayoutGrid size={18}/></button>
          </div>
          <button
            onClick={() => setModal({ disponible: 1 })}
            className="flex items-center gap-2 bg-primary text-darkBg font-bold px-4 py-2 rounded-lg text-sm"
          >
            <Plus size={16} /> Nuevo Producto
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre o categoría..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 mb-4 focus:outline-none focus:border-secondary"
      />

      {viewMode === 'list' ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-gray-400 text-xs uppercase font-black">
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
                  <td className="px-4 py-3 text-right text-primary font-black">${(p.precio).toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleDisponible(p.id)}>
                      {p.disponible ? <ToggleRight size={24} className="text-green-400" /> : <ToggleLeft size={24} className="text-gray-300" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => setModal(p)} className="text-blue-400 hover:text-blue-600 p-1" title="Ver / Editar"><Pencil size={16} /></button>
                      <button onClick={() => setModal(p)} className="text-gray-300 hover:text-gray-500 p-1" title="Ver Detalles"><Eye size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtrados.map(p => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col shadow-sm hover:shadow-md transition-shadow">
               <div className="flex justify-between items-start mb-2">
                 <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{p.categoria_nombre}</span>
                 <button onClick={() => toggleDisponible(p.id)}>
                    {p.disponible ? <div className="w-2 h-2 rounded-full bg-green-400"/> : <div className="w-2 h-2 rounded-full bg-gray-300"/>}
                 </button>
               </div>
               <p className="font-bold text-gray-800 text-sm mb-1 leading-tight">{p.nombre}</p>
               <p className="text-primary font-black text-lg mt-auto">${(p.precio).toLocaleString('es-CO')}</p>
               <button onClick={() => setModal(p)} className="mt-3 w-full py-1.5 bg-gray-50 text-gray-400 hover:text-secondary border border-gray-100 rounded-lg flex items-center justify-center transition">
                 <Pencil size={14}/>
               </button>
            </div>
          ))}
        </div>
      )}

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
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-secondary"
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
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-secondary"
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
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-secondary"
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

// ─── HELPERS DE EXPORTACIÓN ──────────────────────────────────────────────────

const exportarExcel = (columnas: string[], datos: any[], nombreArchivo: string) => {
  const encabezado = columnas.join(';') + '\n';
  const filas = datos.map(f => Object.values(f).join(';')).join('\n');
  const contenido = '\uFEFF' + encabezado + filas; // BOM para caracteres especiales
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${nombreArchivo}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const imprimirPantalla = () => {
  window.print();
};

// ─── TAB EGRESOS ─────────────────────────────────────────────────────────────

const TabEgresos = ({ headers }: { headers: Record<string,string> }) => {
  const [egresos, setEgresos] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [modal, setModal] = useState<any>(null);
  const [fecha, setFecha] = useState(new Date().toLocaleDateString('sv-SE'));
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const cargar = useCallback(async () => {
    const [{ data: egs }, { data: emps }] = await Promise.all([
      axios.get(`${API}/administrativo/egresos?fecha=${fecha}`, { headers }),
      axios.get(`${API}/administrativo/empleados`, { headers })
    ]);
    setEgresos(egs);
    setEmpleados(emps);
  }, [fecha, headers]);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    if (modal.id) {
       await axios.put(`${API}/administrativo/egresos/${modal.id}`, modal, { headers });
    } else {
       await axios.post(`${API}/administrativo/egresos`, modal, { headers });
    }
    setModal(null);
    cargar();
  };

  const eliminar = async (id: number) => {
    if (confirm('¿Eliminar este egreso?')) {
      await axios.delete(`${API}/administrativo/egresos/${id}`, { headers });
      cargar();
    }
  };

  const total = egresos.reduce((s, e) => s + Number(e.monto), 0);

  const exportar = () => {
    const headers = ['Concepto', 'Categoria', 'Monto', 'Fecha', 'Referencia'];
    const datos = egresos.map(e => ({
      c: e.concepto, k: e.categoria, m: e.monto, f: e.fecha, r: e.empleado_nombre || '-'
    }));
    exportarExcel(headers, datos, `Egresos_${fecha}`);
  };

  return (
    <div className="printable">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-800">Egresos y Gastos</h2>
          <p className="text-sm text-gray-500">Total hoy: <span className="font-bold text-red-500">${total.toLocaleString('es-CO')}</span></p>
        </div>
          <div className="flex bg-gray-100 p-1 rounded-lg mr-2">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-secondary' : 'text-gray-400'}`}><List size={18}/></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-secondary' : 'text-gray-400'}`}><LayoutGrid size={18}/></button>
          </div>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="bg-white border rounded-lg px-3 py-2 text-sm text-gray-900" />
          <button onClick={imprimirPantalla} className="p-2 bg-gray-100 rounded-lg text-gray-600 border border-gray-200"><Printer size={18}/></button>
          <button onClick={exportar} className="p-2 bg-green-50 rounded-lg text-green-600 border border-green-200"><FileSpreadsheet size={18}/></button>
          <button onClick={() => setModal({ categoria: 'otros', monto: 0 })} className="bg-red-500 text-white font-bold px-4 py-2 rounded-lg text-sm shadow-md ml-2">
            + Registro
          </button>
        </div>

      {viewMode === 'list' ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Concepto</th>
                <th className="px-4 py-3 text-left">Categoría</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-center no-print">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {egresos.map(e => (
                <tr key={e.id}>
                  <td className="px-4 py-3 text-gray-800">
                    {e.concepto}
                    <p className="text-[10px] text-gray-400 font-normal">{e.empleado_nombre ? `Pago a: ${e.empleado_nombre}` : ''}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{e.categoria}</td>
                  <td className="px-4 py-3 text-right text-red-500 font-bold">-${Number(e.monto).toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3 text-center no-print">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => setModal(e)} className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg transition" title="Editar">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => setModal(e)} className="p-1.5 text-gray-300 hover:bg-gray-50 rounded-lg transition" title="Ver detalles">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => eliminar(e.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {egresos.map(e => (
            <div key={e.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col relative overflow-hidden">
               <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 -mr-8 -mt-8 rotate-45 pointer-events-none"/>
               <div className="flex justify-between items-start mb-3">
                 <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-gray-100 text-gray-500 rounded">{e.categoria}</span>
                 <p className="text-[10px] text-gray-300">#{e.id}</p>
               </div>
               <p className="font-bold text-gray-800 mb-1">{e.concepto}</p>
               <p className="text-xs text-gray-400 mb-4">{e.empleado_nombre ? `Empleado: ${e.empleado_nombre}` : 'Gasto General'}</p>
               <div className="mt-auto flex justify-between items-end">
                  <p className="text-red-500 font-black text-xl">-${Number(e.monto).toLocaleString('es-CO')}</p>
                  <div className="flex gap-1 no-print">
                     <button onClick={() => setModal(e)} className="p-2 bg-gray-50 text-blue-400 rounded-lg hover:bg-blue-50"><Pencil size={14}/></button>
                     <button onClick={() => eliminar(e.id)} className="p-2 bg-gray-50 text-red-400 rounded-lg hover:bg-red-50"><Trash2 size={14}/></button>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ModalOverlay onClose={() => setModal(null)}>
          <h3 className="text-xl font-black mb-4">Registrar Gasto</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Categoría</label>
              <select 
                value={modal.categoria} 
                onChange={v => setModal({...modal, categoria: v.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none"
              >
                <option value="servicios">Servicios (Agua, Luz, Internet)</option>
                <option value="nomina">Pago de Empleado (Nómina)</option>
                <option value="insumos">Compra de Insumos</option>
                <option value="otros">Otros</option>
              </select>
            </div>
            {modal.categoria === 'nomina' && (
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Empleado</label>
                <select 
                  value={modal.empleado_id || ''} 
                  onChange={v => setModal({...modal, empleado_id: v.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none"
                >
                  <option value="">Selecciona empleado...</option>
                  {empleados.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
                </select>
              </div>
            )}
            <LabelInput label="Concepto" value={modal.concepto} onChange={v => setModal({...modal, concepto: v})} />
            <LabelInput label="Monto" type="number" value={String(modal.monto)} onChange={v => setModal({...modal, monto: Number(v)})} />
          </div>
          <button onClick={guardar} className="w-full bg-red-500 text-white font-bold py-3 rounded-lg mt-6">Registrar</button>
        </ModalOverlay>
      )}
    </div>
  );
};

// ─── TAB EMPLEADOS ───────────────────────────────────────────────────────────

const TabEmpleados = ({ headers }: { headers: Record<string,string> }) => {
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [modal, setModal] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const cargar = useCallback(async () => {
    const { data } = await axios.get(`${API}/administrativo/empleados`, { headers });
    setEmpleados(data);
  }, [headers]);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    if (modal.id) await axios.put(`${API}/administrativo/empleados/${modal.id}`, modal, { headers });
    else await axios.post(`${API}/administrativo/empleados`, modal, { headers });
    setModal(null);
    cargar();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-gray-800">Personal</h2>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 p-1 rounded-lg mr-2">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-secondary' : 'text-gray-400'}`}><List size={18}/></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-secondary' : 'text-gray-400'}`}><LayoutGrid size={18}/></button>
          </div>
          <button onClick={() => setModal({ nombre: '', salario_base: 0, activo: 1 })} className="bg-primary text-darkBg font-bold px-4 py-2 rounded-lg text-sm">
            + Nuevo Empleado
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-400 uppercase text-xs font-black">
              <tr>
                <th className="px-4 py-3 text-left">Empleado</th>
                <th className="px-4 py-3 text-left">Documento</th>
                <th className="px-4 py-3 text-left">Cargo</th>
                <th className="px-4 py-3 text-right">Salario</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {empleados.map(e => (
                <tr key={e.id}>
                  <td className="px-4 py-3 text-gray-800">{e.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{e.documento}</td>
                  <td className="px-4 py-3 text-gray-500">{e.cargo}</td>
                  <td className="px-4 py-3 text-right text-primary font-black">${Number(e.salario_base).toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3 text-center">
                     <button onClick={() => setModal(e)} className="p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:text-secondary"><Pencil size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {empleados.map(e => (
            <div key={e.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between hover:border-primary transition-colors">
              <div className="flex-1">
                <p className="font-black text-gray-800 text-lg leading-tight">{e.nombre}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black uppercase text-secondary bg-secondary/10 px-2 py-0.5 rounded">{e.cargo}</span>
                  <p className="text-[10px] text-gray-400 uppercase tracking-tighter">CC {e.documento}</p>
                </div>
                <p className="text-primary font-black text-xl mt-3">${Number(e.salario_base).toLocaleString('es-CO')}</p>
              </div>
              <button onClick={() => setModal(e)} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition shadow-inner">
                <Pencil size={20} className="text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      )}
      {modal && (
        <ModalOverlay onClose={() => setModal(null)}>
          <h3 className="text-xl font-black mb-1">{modal.id ? 'Editar' : 'Nuevo'} Empleado</h3>
          <p className="text-xs text-gray-400 mb-5 uppercase tracking-widest">Información de Personal</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <LabelInput label="Nombre completo" value={modal.nombre} onChange={v => setModal({...modal, nombre: v})} />
            </div>
            <LabelInput label="Documento (CC)" value={modal.documento} onChange={v => setModal({...modal, documento: v})} />
            <LabelInput label="Cargo" value={modal.cargo} onChange={v => setModal({...modal, cargo: v})} />
            <LabelInput label="Teléfono" value={modal.telefono || ''} onChange={v => setModal({...modal, telefono: v})} />
            <LabelInput label="Dirección" value={modal.direccion || ''} onChange={v => setModal({...modal, direccion: v})} />
            <LabelInput label="Fecha Nacimiento" type="date" value={modal.fecha_nacimiento ? modal.fecha_nacimiento.split('T')[0] : ''} onChange={v => setModal({...modal, fecha_nacimiento: v})} />
            <LabelInput label="Salario Base" type="number" value={String(modal.salario_base)} onChange={v => setModal({...modal, salario_base: Number(v)})} />
            
            <div className="col-span-2 pt-2 border-t border-gray-100 mt-2">
              <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Datos Bancarios</p>
              <div className="grid grid-cols-2 gap-4">
                <LabelInput label="Banco" value={modal.banco || ''} onChange={v => setModal({...modal, banco: v})} />
                <LabelInput label="N° de Cuenta" value={modal.cuenta_bancaria || ''} onChange={v => setModal({...modal, cuenta_bancaria: v})} />
              </div>
            </div>
          </div>

          <button onClick={guardar} className="w-full bg-primary text-darkBg font-bold py-3 rounded-lg mt-6 shadow-lg active:scale-95 transition-transform">
            {modal.id ? 'Actualizar Ficha' : 'Guardar Empleado'}
          </button>
        </ModalOverlay>
      )}
    </div>
  );
};

// ─── TAB INVENTARIO ──────────────────────────────────────────────────────────

const TabInventario = ({ headers }: { headers: Record<string,string> }) => {
  const [insumos, setInsumos] = useState<any[]>([]);
  const [modal, setModal] = useState<any>(null);

  const cargar = useCallback(async () => {
    const { data } = await axios.get(`${API}/administrativo/insumos`, { headers });
    setInsumos(data);
  }, [headers]);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    if (modal.id) {
       await axios.put(`${API}/administrativo/insumos/${modal.id}`, modal, { headers });
    } else {
       await axios.post(`${API}/administrativo/insumos`, modal, { headers });
    }
    setModal(null);
    cargar();
  };

  const ajustarStock = async (id: number, cantidad: number) => {
    await axios.patch(`${API}/administrativo/insumos/${id}`, { cantidad }, { headers });
    cargar();
  };

  const exportar = () => {
    const headers = ['Insumo', 'Unidad', 'Stock Actual', 'Stock Minimo'];
    const datos = insumos.map(i => ({ n: i.nombre, u: i.unidad_medida, s: i.stock_actual, m: i.stock_minimo }));
    exportarExcel(headers, datos, 'Inventario_Insumos');
  };

  return (
    <div className="printable">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-gray-800">Materia Prima / Insumos</h2>
        <div className="flex gap-2 no-print">
          <button onClick={imprimirPantalla} className="p-2 bg-gray-100 rounded-lg text-gray-600 border border-gray-200"><Printer size={18}/></button>
          <button onClick={exportar} className="p-2 bg-green-50 rounded-lg text-green-600 border border-green-200"><FileSpreadsheet size={18}/></button>
          <button onClick={() => setModal({ nombre: '', unidad_medida: 'kg', stock_minimo: 1 })} className="bg-primary text-darkBg font-bold px-4 py-2 rounded-lg text-sm ml-2">
            + Nuevo Insumo
          </button>
        </div>
      </div>
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Insumo</th>
              <th className="px-4 py-3 text-center">Stock Actual</th>
              <th className="px-4 py-3 text-center no-print">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {insumos.map(i => (
              <tr key={i.id} className={Number(i.stock_actual) <= Number(i.stock_minimo) ? 'bg-red-50' : ''}>
                <td className="px-4 py-3">
                  <p className="font-bold text-gray-800">{i.nombre}</p>
                  <p className="text-[10px] text-gray-400">Min: {i.stock_minimo} {i.unidad_medida}</p>
                </td>
                <td className="px-4 py-3 text-center font-black">
                    {i.stock_actual} {i.unidad_medida}
                </td>
                <td className="px-4 py-3 text-center no-print">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => ajustarStock(i.id, 1)} className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition" title="Sumar Stock">+</button>
                    <button onClick={() => ajustarStock(i.id, -1)} className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition" title="Restar Stock">-</button>
                    <button onClick={() => setModal(i)} className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-400 rounded-lg hover:bg-blue-200 transition" title="Editar">
                      <Pencil size={14}/>
                    </button>
                    <button onClick={() => setModal(i)} className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-400 rounded-lg hover:bg-gray-200 transition" title="Ver">
                      <Eye size={14}/>
                    </button>
                    <button 
                      onClick={async () => { if(confirm('¿Eliminar insumo?')) { await axios.delete(`${API}/administrativo/insumos/${i.id}`, {headers}); cargar(); } }} 
                      className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition"
                      title="Eliminar"
                    >
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <ModalOverlay onClose={() => setModal(null)}>
          <h3 className="text-xl font-black mb-4">Nuevo Insumo</h3>
          <div className="space-y-4">
            <LabelInput label="Nombre del Insumo" value={modal.nombre} onChange={v => setModal({...modal, nombre: v})} />
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Unidad de Medida</label>
              <select value={modal.unidad_medida} onChange={v => setModal({...modal, unidad_medida: v.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900">
                <option value="kg">Kilogramos (kg)</option>
                <option value="gr">Gramos (gr)</option>
                <option value="lt">Litros (lt)</option>
                <option value="und">Unidades (und)</option>
              </select>
            </div>
            <LabelInput label="Stock Mínimo (Alerta)" type="number" value={String(modal.stock_minimo)} onChange={v => setModal({...modal, stock_minimo: Number(v)})} />
          </div>
          <button onClick={guardar} className="w-full bg-primary text-darkBg font-bold py-3 rounded-lg mt-6">Añadir al Inventario</button>
        </ModalOverlay>
      )}
    </div>
  );
};

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
