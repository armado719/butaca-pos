import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { Plus, Pencil, ToggleLeft, ToggleRight, X, Check } from 'lucide-react';
import { ModalOverlay, LabelInput } from './shared';

interface Usuario { id: number; nombre: string; email: string; rol: string; activo: number; }

export const TabUsuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [modal, setModal] = useState<(Partial<Usuario> & { password?: string }) | null>(null);

  const cargar = useCallback(async () => {
    const { data } = await api.get('/admin/usuarios');
    setUsuarios(data);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    if (!modal) return;
    try {
      if (modal.id) await api.put(`/admin/usuarios/${modal.id}`, modal);
      else await api.post('/admin/usuarios', modal);
      setModal(null); cargar();
    } catch (err: any) { alert(err.response?.data?.msg || 'Error al guardar usuario'); }
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
              <select value={modal.rol || ''} onChange={e => setModal({ ...modal, rol: e.target.value })}
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
