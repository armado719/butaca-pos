import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { Pencil, Trash2, Eye, Printer, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';
import { ModalOverlay, LabelInput, exportarExcel } from './shared';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { Insumo } from '../../types';

export const TabInventario = () => {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [modal, setModal] = useState<Partial<Insumo> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [ajustarModal, setAjustarModal] = useState<{ id: number; cantidad: number; motivo: string; nombre: string } | null>(null);
  const [history, setHistory] = useState<{ open: boolean; insumoId: number | null; nombre: string; logs: any[], page: number, total: number } | null>(null);
  
  const [page, setPage] = useState(Number(sessionStorage.getItem('inventario_page')) || 1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const updatePage = (v: number) => {
    setPage(v);
    sessionStorage.setItem('inventario_page', String(v));
  };

  const cargar = useCallback(async () => {
    try {
      const { data: res } = await api.get(`/administrativo/insumos?page=${page}&limit=${limit}`);
      setInsumos(res.data || res);
      setTotal(res.total || (res.data || res).length);
    } catch { /* error silent */ }
  }, [page]);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    if (!modal) return;
    try {
      if (modal.id) await api.put(`/administrativo/insumos/${modal.id}`, modal);
      else await api.post('/administrativo/insumos', modal);
      toast.success('Insumo guardado');
      setModal(null); cargar();
    } catch { toast.error('Error al guardar insumo'); }
  };

  const eliminar = (id: number) => {
    setConfirmDelete(id);
  };

  const confirmarEliminar = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/administrativo/insumos/${confirmDelete}`);
      toast.success('Insumo eliminado');
      setConfirmDelete(null);
      cargar();
    } catch { toast.error('Error al eliminar insumo'); }
  };

  const ajustarStock = async () => {
    if (!ajustarModal) return;
    try {
      await api.patch(`/administrativo/insumos/${ajustarModal.id}`, { 
        cantidad: ajustarModal.cantidad,
        motivo: ajustarModal.motivo 
      });
      toast.success('Inventario actualizado');
      setAjustarModal(null);
      cargar();
    } catch { toast.error('Error al actualizar stock'); }
  };

  const cargarLogs = async (id: number, p = 1) => {
    try {
      const { data: res } = await api.get(`/administrativo/insumos/logs?id=${id}&page=${p}&limit=5`);
      setHistory(prev => ({ 
        ...prev!, 
        logs: res.data || res, 
        page: p, 
        total: res.total || (res.data || res).length 
      }));
    } catch { /* err */ }
  };

  const verHistorial = (insumo: Insumo) => {
    setHistory({ open: true, insumoId: insumo.id, nombre: insumo.nombre, logs: [], page: 1, total: 0 });
    cargarLogs(insumo.id, 1);
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
                    <button onClick={() => setAjustarModal({ id: i.id, cantidad: 1, motivo: '', nombre: i.nombre })} className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition" title="Ajustar">+</button>
                    <button onClick={() => setAjustarModal({ id: i.id, cantidad: -1, motivo: '', nombre: i.nombre })} className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition" title="Ajustar">-</button>
                    <button onClick={() => setModal(i)} className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-400 rounded-lg hover:bg-blue-200 transition"><Pencil size={14}/></button>
                    <button onClick={() => verHistorial(i)} className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-400 rounded-lg hover:bg-gray-200 transition"><Eye size={14}/></button>
                    <button onClick={() => eliminar(i.id)}
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

      {total > limit && (
        <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm no-print">
          <div className="text-sm text-gray-500">
            Mostrando <span className="font-bold text-gray-800">{(page-1)*limit + 1}</span> a <span className="font-bold text-gray-800">{Math.min(page*limit, total)}</span> de <span className="font-bold text-gray-800">{total}</span> insumos
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
          <h3 className="text-xl font-black mb-4">Nuevo Insumo</h3>
          <div className="space-y-4">
            <LabelInput label="Nombre del Insumo" value={modal.nombre || ''} onChange={v => setModal({...modal, nombre: v})} />
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Unidad de Medida</label>
              <select value={modal.unidad_medida || 'kg'} onChange={v => setModal({...modal, unidad_medida: v.target.value as any})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900">
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
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        title="¿Eliminar Insumo?"
        message="¿Estás seguro de eliminar este insumo del inventario?"
        onConfirm={confirmarEliminar}
        onCancel={() => setConfirmDelete(null)}
        confirmText="Eliminar"
        variant="danger"
      />

      {ajustarModal && (
        <ModalOverlay onClose={() => setAjustarModal(null)}>
          <h3 className="text-xl font-black mb-1">Ajustar Inventario</h3>
          <p className="text-gray-400 text-xs mb-4">Insumo: {ajustarModal.nombre}</p>
          <div className="space-y-4">
            <LabelInput label="Cantidad (positivo p. entrada, negativo p. salida)" type="number" value={String(ajustarModal.cantidad)} onChange={v => setAjustarModal({...ajustarModal, cantidad: Number(v)})} />
            <LabelInput label="Motivo del movimiento" placeholder="Ej: Compra semanal, merma, error de conteo..." value={ajustarModal.motivo} onChange={v => setAjustarModal({...ajustarModal, motivo: v})} />
            <button onClick={ajustarStock} className="w-full bg-secondary text-white font-bold py-3 rounded-xl mt-2 transition active:scale-95 shadow-lg shadow-secondary/20">Procesar Ajuste</button>
          </div>
        </ModalOverlay>
      )}

      {history && history.open && (
        <ModalOverlay onClose={() => setHistory(null)}>
          <h3 className="text-xl font-black mb-1">Historial de Movimientos</h3>
          <p className="text-gray-400 text-xs mb-4">Insumo: {history.nombre}</p>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {history.logs.length === 0 ? <p className="text-center py-10 text-gray-300 italic">Cargando historial...</p> : 
             history.logs.map((log, idx) => (
              <div key={idx} className="p-3 bg-gray-50 border border-gray-100 rounded-xl relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${log.tipo === 'entrada' ? 'bg-green-500' : 'bg-red-500'}`} />
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${log.tipo === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {log.tipo}
                  </span>
                  <span className="text-[10px] text-gray-400">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-bold text-gray-800">{log.cantidad} {log.unidad_medida || 'unid.'}</p>
                  <p className="text-[10px] text-gray-400">Stock previo: {log.stock_previo}</p>
                </div>
                <p className="text-[11px] text-gray-500 mt-1 italic">"{log.motivo}"</p>
                <p className="text-[9px] text-gray-400 mt-1 text-right">— {log.usuario_nombre}</p>
              </div>
            ))}
          </div>
          {history.total > 5 && (
             <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-gray-50">
                <button 
                  disabled={history.page === 1} onClick={() => cargarLogs(history.insumoId!, history.page - 1)}
                  className="p-1 px-2 text-xs bg-gray-50 rounded border disabled:opacity-30"
                >Ant.</button>
                <span className="text-xs self-center font-bold text-gray-500">{history.page}</span>
                <button 
                  disabled={history.page * 5 >= history.total} onClick={() => cargarLogs(history.insumoId!, history.page + 1)}
                  className="p-1 px-2 text-xs bg-gray-50 rounded border disabled:opacity-30"
                >Sig.</button>
             </div>
          )}
        </ModalOverlay>
      )}
    </div>
  );
};
