import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { Pencil, LayoutGrid, List, ChevronLeft, ChevronRight, Banknote } from 'lucide-react';
import { ModalOverlay, LabelInput } from './shared';
import toast from 'react-hot-toast';
import type { Empleado } from '../../types';

export const TabEmpleados = () => {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [modal, setModal] = useState<Partial<Empleado> | null>(null);
  const [pagoModal, setPagoModal] = useState<{ id: number; nombre: string; monto: number; concepto: string } | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>( (sessionStorage.getItem('empleados_view') as any) || 'grid');

  const [page, setPage] = useState(Number(sessionStorage.getItem('empleados_page')) || 1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const updatePage = (v: number) => {
    setPage(v);
    sessionStorage.setItem('empleados_page', String(v));
  };

  const updateView = (v: 'grid' | 'list') => {
    setViewMode(v);
    sessionStorage.setItem('empleados_view', v);
  };

  const cargar = useCallback(async () => {
    try {
      const { data: res } = await api.get(`/administrativo/empleados?page=${page}&limit=${limit}`);
      setEmpleados(res.data || res);
      setTotal(res.total || (res.data || res).length);
    } catch (err) {
      console.error(err);
    }
  }, [page]);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    if (!modal) return;
    try {
      if (modal.id) await api.put(`/administrativo/empleados/${modal.id}`, modal);
      else await api.post('/administrativo/empleados', modal);
      toast.success('Ficha actualizada');
      setModal(null); cargar();
    } catch { toast.error('Error al guardar'); }
  };

  const registrarPago = async () => {
    if (!pagoModal) return;
    try {
      await api.post('/administrativo/egresos', {
        concepto: pagoModal.concepto,
        monto: pagoModal.monto,
        categoria: 'nomina',
        empleado_id: pagoModal.id
      });
      toast.success(`Pago registrado para ${pagoModal.nombre}`);
      setPagoModal(null);
    } catch { toast.error('Error al registrar el pago'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-gray-800">Personal</h2>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button onClick={() => updateView('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-secondary' : 'text-gray-400'}`}><List size={18}/></button>
            <button onClick={() => updateView('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-secondary' : 'text-gray-400'}`}><LayoutGrid size={18}/></button>
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
                    <div className="flex justify-center gap-2">
                       <button onClick={() => setPagoModal({ id: e.id, nombre: e.nombre, monto: Number(e.salario_base), concepto: `Pago Nómina ${e.nombre}` })} 
                               className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100" title="Pagar Nomina"><Banknote size={16}/></button>
                       <button onClick={() => setModal(e)} className="p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:text-secondary"><Pencil size={16}/></button>
                    </div>
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
              <div className="flex flex-col gap-2">
                <button onClick={() => setPagoModal({ id: e.id, nombre: e.nombre, monto: Number(e.salario_base), concepto: `Pago Nómina ${e.nombre}` })} 
                        className="p-3 bg-green-50 rounded-xl hover:bg-green-100 transition shadow-sm text-green-600">
                  <Banknote size={20} />
                </button>
                <button onClick={() => setModal(e)} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition shadow-inner text-gray-400">
                  <Pencil size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > limit && (
        <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-500">
            Mostrando <span className="font-bold text-gray-800">{(page-1)*limit + 1}</span> a <span className="font-bold text-gray-800">{Math.min(page*limit, total)}</span> de <span className="font-bold text-gray-800">{total}</span> empleados
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
      {pagoModal && (
        <ModalOverlay onClose={() => setPagoModal(null)}>
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
              <Banknote size={28} />
            </div>
            <h3 className="text-xl font-black">Registrar Pago</h3>
            <p className="text-gray-400 text-xs">{pagoModal.nombre}</p>
          </div>
          <div className="space-y-4">
            <LabelInput label="Concepto / Nota" value={pagoModal.concepto} onChange={v => setPagoModal({...pagoModal, concepto: v})} />
            <LabelInput label="Monto a Pagar" type="number" value={String(pagoModal.monto)} onChange={v => setPagoModal({...pagoModal, monto: Number(v)})} />
            <button onClick={registrarPago} className="w-full bg-green-500 text-white font-bold py-3 rounded-xl mt-4 shadow-lg shadow-green-200 active:scale-95 transition-transform">
              Confirmar Pago de Nómina
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};
