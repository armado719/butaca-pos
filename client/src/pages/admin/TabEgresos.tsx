import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { Pencil, Trash2, Eye, Printer, FileSpreadsheet, LayoutGrid, List } from 'lucide-react';
import { ModalOverlay, LabelInput, exportarExcel } from './shared';

export const TabEgresos = () => {
  const [egresos, setEgresos] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [modal, setModal] = useState<any>(null);
  const [fecha, setFecha] = useState(new Date().toLocaleDateString('sv-SE'));
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const cargar = useCallback(async () => {
    const [{ data: egs }, { data: emps }] = await Promise.all([
      api.get(`/administrativo/egresos?fecha=${fecha}`),
      api.get('/administrativo/empleados'),
    ]);
    setEgresos(egs);
    setEmpleados(emps);
  }, [fecha]);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    if (modal.id) await api.put(`/administrativo/egresos/${modal.id}`, modal);
    else await api.post('/administrativo/egresos', modal);
    setModal(null); cargar();
  };

  const eliminar = async (id: number) => {
    if (confirm('¿Eliminar este egreso?')) {
      await api.delete(`/administrativo/egresos/${id}`);
      cargar();
    }
  };

  const total = egresos.reduce((s, e) => s + Number(e.monto), 0);

  const exportar = () => {
    const cols = ['Concepto', 'Categoria', 'Monto', 'Fecha', 'Referencia'];
    const datos = egresos.map(e => ({ c: e.concepto, k: e.categoria, m: e.monto, f: e.fecha, r: e.empleado_nombre || '-' }));
    exportarExcel(cols, datos, `Egresos_${fecha}`);
  };

  return (
    <div className="printable">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-800">Egresos y Gastos</h2>
          <p className="text-sm text-gray-500">Total hoy: <span className="font-bold text-red-500">${total.toLocaleString('es-CO')}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-secondary' : 'text-gray-400'}`}><List size={18}/></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-secondary' : 'text-gray-400'}`}><LayoutGrid size={18}/></button>
          </div>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="bg-white border rounded-lg px-3 py-2 text-sm text-gray-900" />
          <button onClick={() => window.print()} className="p-2 bg-gray-100 rounded-lg text-gray-600 border border-gray-200"><Printer size={18}/></button>
          <button onClick={exportar} className="p-2 bg-green-50 rounded-lg text-green-600 border border-green-200"><FileSpreadsheet size={18}/></button>
          <button onClick={() => setModal({ categoria: 'otros', monto: 0 })} className="bg-red-500 text-white font-bold px-4 py-2 rounded-lg text-sm shadow-md">
            + Registro
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-400 uppercase text-xs"><tr>
              <th className="px-4 py-3 text-left">Concepto</th>
              <th className="px-4 py-3 text-left">Categoría</th>
              <th className="px-4 py-3 text-right">Monto</th>
              <th className="px-4 py-3 text-center no-print">Acciones</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {egresos.map(e => (
                <tr key={e.id}>
                  <td className="px-4 py-3 text-gray-800">{e.concepto}<p className="text-[10px] text-gray-400 font-normal">{e.empleado_nombre ? `Pago a: ${e.empleado_nombre}` : ''}</p></td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{e.categoria}</td>
                  <td className="px-4 py-3 text-right text-red-500 font-bold">-${Number(e.monto).toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3 text-center no-print">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => setModal(e)} className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg transition"><Pencil size={16} /></button>
                      <button onClick={() => setModal(e)} className="p-1.5 text-gray-300 hover:bg-gray-50 rounded-lg transition"><Eye size={16} /></button>
                      <button onClick={() => eliminar(e.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
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
              <select value={modal.categoria} onChange={v => setModal({...modal, categoria: v.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none">
                <option value="servicios">Servicios (Agua, Luz, Internet)</option>
                <option value="nomina">Pago de Empleado (Nómina)</option>
                <option value="insumos">Compra de Insumos</option>
                <option value="otros">Otros</option>
              </select>
            </div>
            {modal.categoria === 'nomina' && (
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Empleado</label>
                <select value={modal.empleado_id || ''} onChange={v => setModal({...modal, empleado_id: v.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none">
                  <option value="">Selecciona empleado...</option>
                  {empleados.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
                </select>
              </div>
            )}
            <LabelInput label="Concepto" value={modal.concepto || ''} onChange={v => setModal({...modal, concepto: v})} />
            <LabelInput label="Monto" type="number" value={String(modal.monto || 0)} onChange={v => setModal({...modal, monto: Number(v)})} />
          </div>
          <button onClick={guardar} className="w-full bg-red-500 text-white font-bold py-3 rounded-lg mt-6">Registrar</button>
        </ModalOverlay>
      )}
    </div>
  );
};
