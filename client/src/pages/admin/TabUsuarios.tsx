import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, ToggleLeft, ToggleRight, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { ModalOverlay, LabelInput } from './shared';
import type { Usuario } from '../../types';

export const TabUsuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [modal, setModal] = useState<(Partial<Usuario> & { password?: string }) | null>(null);
  
  const [page, setPage] = useState(Number(sessionStorage.getItem('usuarios_page')) || 1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const updatePage = (v: number) => {
    setPage(v);
    sessionStorage.setItem('usuarios_page', String(v));
  };

  const cargar = useCallback(async () => {
    try {
      const { data: res } = await api.get(`/admin/usuarios?page=${page}&limit=${limit}`);
      setUsuarios(res.data || res);
      setTotal(res.total || (res.data || res).length);
    } catch (err) {
      console.error(err);
    }
  }, [page]);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    if (!modal) return;
    try {
      if (modal.id) await api.put(`/admin/usuarios/${modal.id}`, modal);
      else await api.post('/admin/usuarios', modal);
      toast.success('Usuario guardado correctamente');
      setModal(null); cargar();
    } catch (err: any) { toast.error(err.response?.data?.msg || 'Error al guardar usuario'); }
  };

  const toggle = async (id: number) => {
    await api.patch(`/admin/usuarios/${id}/toggle`, {});
    cargar();
  };

  const rolColor: Record<string, string> = {
    admin:  'bg-primary/20 text-primary',
    mesero: 'bg-blue-100 text-blue-600',
    cocina: 'bg-orange-100 text-orange-600',
    cajero: 'bg-green-100 text-green-600',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-gray-800">Usuarios ({usuarios.length})</h2>
        <button onClick={() => setModal({ activo: 1 })} className="flex items-center gap-2 bg-primary text-darkBg font-bold px-4 py-2 rounded-lg text-sm">
          <Plus size={16} /> Nuevo Usuario
        </button>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 bg-gray-50 text-gray-400 text-xs uppercase">
            <th className="text-left px-4 py-3">Nombre</th>
            <th className="text-left px-4 py-3">Email</th>
            <th className="text-center px-4 py-3">Rol</th>
            <th className="text-center px-4 py-3">Estado</th>
            <th className="text-center px-4 py-3">Acciones</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-medium text-gray-800">{u.nombre}</td>
                <td className="px-4 py-3 text-gray-400">{u.email}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${rolColor[u.rol]}`}>{u.rol}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggle(u.id)}>
                    {u.activo ? <ToggleRight size={22} className="text-green-400" /> : <ToggleLeft size={22} className="text-gray-500" />}
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => setModal(u)} className="text-gray-400 hover:text-gray-700 transition p-1"><Pencil size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > limit && (
        <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-500">
            Mostrando <span className="font-bold text-gray-800">{(page-1)*limit + 1}</span> a <span className="font-bold text-gray-800">{Math.min(page*limit, total)}</span> de <span className="font-bold text-gray-800">{total}</span> usuarios
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
          <h3 className="text-xl font-black text-gray-800 mb-5">{modal.id ? 'Editar' : 'Nuevo'} Usuario</h3>
          <div className="space-y-4">
            <LabelInput label="Nombre completo" value={modal.nombre || ''} onChange={v => setModal({ ...modal, nombre: v })} />
            <LabelInput label="Correo electrónico" type="email" value={modal.email || ''} onChange={v => setModal({ ...modal, email: v })} />
            <LabelInput
              label={modal.id ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
              type="password" value={(modal as any).password || ''}
              onChange={v => setModal({ ...modal, password: v })}
            />
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Rol</label>
              <select value={modal.rol || ''} onChange={e => setModal({ ...modal, rol: e.target.value as any })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-secondary">
                <option value="">Selecciona...</option>
                {['admin', 'mesero', 'cocina', 'cajero'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
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
