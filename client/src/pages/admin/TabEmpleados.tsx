import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { Pencil, LayoutGrid, List } from 'lucide-react';
import { ModalOverlay, LabelInput } from './shared';

export const TabEmpleados = () => {
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [modal, setModal] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const cargar = useCallback(async () => {
    const { data } = await api.get('/administrativo/empleados');
    setEmpleados(data);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    if (modal.id) await api.put(`/administrativo/empleados/${modal.id}`, modal);
    else await api.post('/administrativo/empleados', modal);
    setModal(null); cargar();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-gray-800">Personal</h2>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 p-1 rounded-lg">
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
            <thead className="bg-gray-50 text-gray-400 uppercase text-xs font-black"><tr>
              <th className="px-4 py-3 text-left">Empleado</th>
              <th className="px-4 py-3 text-left">Documento</th>
              <th className="px-4 py-3 text-left">Cargo</th>
              <th className="px-4 py-3 text-right">Salario</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr></thead>
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
            <div className="col-span-2"><LabelInput label="Nombre completo" value={modal.nombre || ''} onChange={v => setModal({...modal, nombre: v})} /></div>
            <LabelInput label="Documento (CC)" value={modal.documento || ''} onChange={v => setModal({...modal, documento: v})} />
            <LabelInput label="Cargo" value={modal.cargo || ''} onChange={v => setModal({...modal, cargo: v})} />
            <LabelInput label="Teléfono" value={modal.telefono || ''} onChange={v => setModal({...modal, telefono: v})} />
            <LabelInput label="Dirección" value={modal.direccion || ''} onChange={v => setModal({...modal, direccion: v})} />
            <LabelInput label="Fecha Nacimiento" type="date" value={modal.fecha_nacimiento ? modal.fecha_nacimiento.split('T')[0] : ''} onChange={v => setModal({...modal, fecha_nacimiento: v})} />
            <LabelInput label="Salario Base" type="number" value={String(modal.salario_base || 0)} onChange={v => setModal({...modal, salario_base: Number(v)})} />
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
