import { useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

const ICONS = {
  success: <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />,
  error:   <XCircle      size={18} className="text-red-500 shrink-0" />,
  warning: <AlertTriangle size={18} className="text-amber-500 shrink-0" />,
  info:    <Info          size={18} className="text-blue-500 shrink-0" />,
};

const STYLES = {
  success: 'border-emerald-200 bg-emerald-50',
  error:   'border-red-200 bg-red-50',
  warning: 'border-amber-200 bg-amber-50',
  info:    'border-blue-200 bg-blue-50',
};

const TEXT = {
  success: 'text-emerald-800',
  error:   'text-red-800',
  warning: 'text-amber-800',
  info:    'text-blue-800',
};

/* ── Componente de presentación ─────────────────────────── */
interface ToasterProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

export const Toaster = ({ toasts, onDismiss }: ToasterProps) => (
  <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
    {toasts.map(t => (
      <div
        key={t.id}
        className={`flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-lg backdrop-blur-sm pointer-events-auto
          animate-in slide-in-from-top-2 fade-in duration-300 ${STYLES[t.type]}`}
      >
        {ICONS[t.type]}
        <p className={`flex-1 text-sm font-semibold leading-snug ${TEXT[t.type]}`}>{t.message}</p>
        <button
          onClick={() => onDismiss(t.id)}
          className="text-gray-400 hover:text-gray-600 transition shrink-0 mt-0.5"
        >
          <X size={14} />
        </button>
      </div>
    ))}
  </div>
);

/* ── Hook ────────────────────────────────────────────────── */
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info', duration = 3500) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, toast, dismiss };
};
