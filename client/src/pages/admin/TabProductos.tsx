import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { TableSkeleton, GridSkeleton } from '../../components/Skeleton';
import { Plus, Pencil, ToggleLeft, ToggleRight, X, Check, Eye, LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { ModalOverlay, LabelInput } from './shared';

interface Categoria { id: number; nombre: string; }
interface Producto { id: number; categoria_id: number; nombre: string; descripcion: string; precio: number; disponible: number; categoria_nombre: string; }

export const TabProductos = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [modal, setModal] = useState<Partial<Producto> | null>(null);
  const [busqueda, setBusqueda] = useState(sessionStorage.getItem('productos_busqueda') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>( (sessionStorage.getItem('productos_view') as any) || 'list');
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(Number(sessionStorage.getItem('productos_page')) || 1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const updateBusqueda = (v: string) => {
    setBusqueda(v);
    sessionStorage.setItem('productos_busqueda', v);
    setPage(1);
    sessionStorage.setItem('productos_page', '1');
  };

  const updateView = (v: 'grid' | 'list') => {
    setViewMode(v);
    sessionStorage.setItem('productos_view', v);
  };

  const updatePage = (v: number) => {
    setPage(v);
    sessionStorage.setItem('productos_page', String(v));
  };

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: res }, { data: cats }] = await Promise.all([
        api.get(`/admin/productos?page=${page}&limit=${limit}`),
        api.get('/admin/categorias'),
      ]);
      setProductos(res.data || res);
      setTotal(res.total || (res.data || res).length);
      setCategorias(cats);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    if (!modal) return;
    try {
      if (modal.id) await api.put(`/admin/productos/${modal.id}`, modal);
      else await api.post('/admin/productos', modal);
      toast.success('Producto guardado correctamente');
      setModal(null); cargar();
    } catch { toast.error('Error al guardar producto'); }
  };

  const toggleDisponible = async (id: number) => {
    await api.patch(`/admin/productos/${id}/toggle`, {});
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
            <button onClick={() => updateView('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-secondary' : 'text-gray-400'}`}><List size={18}/></button>
            <button onClick={() => updateView('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-secondary' : 'text-gray-400'}`}><LayoutGrid size={18}/></button>
          </div>
          <button onClick={() => setModal({ disponible: 1 })} className="flex items-center gap-2 bg-primary text-darkBg font-bold px-4 py-2 rounded-lg text-sm">
            <Plus size={16} /> Nuevo Producto
          </button>
        </div>
      </div>
      <input type="text" placeholder="Buscar por nombre o categoría..." value={busqueda}
        onChange={e => updateBusqueda(e.target.value)}
        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 mb-4 focus:outline-none focus:border-secondary"
      />
      {loading ? (
        viewMode === 'list' ? <TableSkeleton rows={8} cols={5} /> : <GridSkeleton cards={10} />
      ) : viewMode === 'list' ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50 text-gray-400 text-xs uppercase font-black">
              <th className="text-left px-4 py-3">Nombre</th><th className="text-left px-4 py-3">Categoría</th>
              <th className="text-right px-4 py-3">Precio</th><th className="text-center px-4 py-3">Disponible</th>
              <th className="text-center px-4 py-3">Acciones</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
                  <td className="px-4 py-3 text-gray-400">{p.categoria_nombre}</td>
                  <td className="px-4 py-3 text-right text-primary font-black">${p.precio.toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleDisponible(p.id)}>
                      {p.disponible ? <ToggleRight size={24} className="text-green-400" /> : <ToggleLeft size={24} className="text-gray-300" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => setModal(p)} className="text-blue-400 hover:text-blue-600 p-1"><Pencil size={16} /></button>
                      <button onClick={() => setModal(p)} className="text-gray-300 hover:text-gray-500 p-1"><Eye size={16} /></button>
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
              <p className="text-primary font-black text-lg mt-auto">${p.precio.toLocaleString('es-CO')}</p>
              <button onClick={() => setModal(p)} className="mt-3 w-full py-1.5 bg-gray-50 text-gray-400 hover:text-secondary border border-gray-100 rounded-lg flex items-center justify-center transition">
                <Pencil size={14}/>
              </button>
            </div>
          ))}
        </div>
      )}
      {!loading && total > limit && (
        <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-500">
            Mostrando <span className="font-bold text-gray-800">{(page-1)*limit + 1}</span> a <span className="font-bold text-gray-800">{Math.min(page*limit, total)}</span> de <span className="font-bold text-gray-800">{total}</span> productos
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => updatePage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <button 
              onClick={() => updatePage(page + 1)}
              disabled={page * limit >= total}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
      {modal !== null && (
        <ModalOverlay onClose={() => setModal(null)}>
          <h3 className="text-xl font-black text-gray-800 mb-5">{modal.id ? 'Editar' : 'Nuevo'} Producto</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Categoría</label>
              <select value={modal.categoria_id || ''} onChange={e => setModal({ ...modal, categoria_id: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-secondary">
                <option value="">Selecciona...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <LabelInput label="Nombre" value={modal.nombre || ''} onChange={v => setModal({ ...modal, nombre: v })} />
            <LabelInput label="Descripción" value={modal.descripcion || ''} onChange={v => setModal({ ...modal, descripcion: v })} />
            <LabelInput label="Precio (COP)" type="number" value={String(modal.precio || '')} onChange={v => setModal({ ...modal, precio: Number(v) })} />
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={guardar} className="flex-1 flex items-center justify-center gap-2 bg-primary text-darkBg font-bold py-2.5 rounded-lg"><Check size={16} /> Guardar</button>
            <button onClick={() => setModal(null)} className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-600 hover:bg-gray-200 py-2.5 rounded-lg transition"><X size={16} /> Cancelar</button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};
