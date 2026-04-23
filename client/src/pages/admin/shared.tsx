export const ModalOverlay = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md relative shadow-xl">
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
        ✕
      </button>
      {children}
    </div>
  </div>
);

export const LabelInput = ({
  label, value, onChange, type = 'text'
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) => (
  <div>
    <label className="text-xs text-gray-400 mb-1 block">{label}</label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-secondary transition"
    />
  </div>
);

export const exportarExcel = (columnas: string[], datos: any[], nombreArchivo: string) => {
  const contenido = '﻿' + columnas.join(';') + '\n' + datos.map(f => Object.values(f).join(';')).join('\n');
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${nombreArchivo}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
