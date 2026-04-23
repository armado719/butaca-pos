import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { Pencil, Trash2, Eye, Printer, FileSpreadsheet } from 'lucide-react';
import { ModalOverlay, LabelInput, exportarExcel } from './shared';

export const TabInventario = () => {
  const [insumos, setInsumos] = useState<any[]>([]);
  const [modal, setModal] = useState<any>(null);

  const cargar = useCallback(async () => {
    const { data } = await api.get('/administrativo/insumos');
    setInsumos(data);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    if (modal.id) await api.put(`/administrativo/insumos/${modal.id}`, modal);
    else await api.post('/administrativo/insumos', modal);
    setModal(null); cargar();
  };

  const ajustarStock = async (id: number, cantidad: number) => {
    await api.patch(`/administrativo/insumos/${id}`, { cantidad });
    cargar();
  };

  const exportar = () => {
    const cols = ['Insumo', 'Unidad', 'Stock Actual', 'Stock Minimo'];
    const datos = insumos.map(i => ({ n: i.nombre, u: i.unidad_medida, s: i.stock_actual, m: i.stock_minimo }));
    exportarExcel(cols, datos, 'Inventario_Insumos');
  };

  return (
    <div className="printable">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-gray-800">Materia Prima / Insumos</h2>
        <div className="flex gap-2 no-print">
          <button onClick={() => window.print()} className="p-2 bg-gray-100 rounded-lg text-gray-600 border border-gray-200"><Printer size={18}/></button>
          <button onClick={exportar} className="p-2 bg-green-50 rounded-lg text-green-600 border border-green-200"><FileSpreadsheet size={18}/></button>
          <button onClick={() => setModal({ nombre: '', unidad_medida: 'kg', stock_minimo: 1 })} className="bg-primary text-darkBg font-bold px-4 py-2 rounded-lg text-sm ml-2">
            + Nuevo Insumo
          </button>
        </div>
      </div>
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-400 uppercase text-xs"><tr>
            <th className="px-4 py-3 text-left">Insumo</th>
            <th className="px-4 py-3 text-center">Stock Actual</th>
            <th className="px-4 py-3 text-center no-print">Acciones</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {insumos.map(i => (
              <tr key={i.id} className={Number(i.stock_actual) <= Number(i.stock_minimo) ? 'bg-red-50' : ''}>
                <td className="px-4 py-3">
                  <p className="font-bold text-gray-800">{i.nombre}</p>
                  <p className="text-[10px] text-gray-400">Min: {i.stock_minimo} {i.unidad_medida}</p>
                </td>
                <td className="px-4 py-3 text-center font-black">{i.stock_actual} {i.unidad_medida}</td>
                <td className="px-4 py-3 text-center no-print">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => ajustarStock(i.id, 1)} className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition" title="Sumar">+</button>
                    <button onClick={() => ajustarStock(i.id, -1)} className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition" title="Restar">-</button>
                    <button onClick={() => setModal(i)} className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-400 rounded-lg hover:bg-blue-200 transition"><Pencil size={14}/></button>
                    <button onClick={() => setModal(i)} className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-400 rounded-lg hover:bg-gray-200 transition"><Eye size={14}/></button>
                    <button onClick={async () => { if(confirm('¿Eliminar insumo?')) { await api.delete(`/administrativo/insumos/${i.id}`); cargar(); } }}
                      className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition">
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
            <LabelInput label="Nombre del Insumo" value={modal.nombre || ''} onChange={v => setModal({...modal, nombre: v})} />
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Unidad de Medida</label>
              <select value={modal.unidad_medida || 'kg'} onChange={v => setModal({...modal, unidad_medida: v.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900">
                <option value="kg">Kilogramos (kg)</option>
                <option value="gr">Gramos (gr)</option>
                <option value="lt">Litros (lt)</option>
                <option value="und">Unidades (und)</option>
              </select>
            </div>
            <LabelInput label="Stock Mínimo (Alerta)" type="number" value={String(modal.stock_minimo || 1)} onChange={v => setModal({...modal, stock_minimo: Number(v)})} />
          </div>
          <button onClick={guardar} className="w-full bg-primary text-darkBg font-bold py-3 rounded-lg mt-6">Añadir al Inventario</button>
        </ModalOverlay>
      )}
    </div>
  );
};
