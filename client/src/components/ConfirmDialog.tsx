import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  const themes = {
    danger: {
      icon: <AlertTriangle className="text-red-500" size={24} />,
      bg: 'bg-red-50',
      button: 'bg-red-500 hover:bg-red-600 text-white',
      border: 'border-red-100'
    },
    warning: {
      icon: <AlertTriangle className="text-yellow-500" size={24} />,
      bg: 'bg-yellow-50',
      button: 'bg-yellow-500 hover:bg-yellow-600 text-white',
      border: 'border-yellow-100'
    },
    info: {
      icon: <AlertTriangle className="text-blue-500" size={24} />,
      bg: 'bg-blue-50',
      button: 'bg-blue-500 hover:bg-blue-600 text-white',
      border: 'border-blue-100'
    }
  };

  const theme = themes[variant];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
        <div className={`p-6 ${theme.bg} border-b ${theme.border} flex justify-between items-start`}>
          <div className="flex gap-4">
            <div className="bg-white p-2 rounded-xl shadow-sm">
              {theme.icon}
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800">{title}</h3>
              <p className="text-sm text-gray-500 mt-1">{message}</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 bg-gray-50 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition shadow-md active:scale-95 ${theme.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
