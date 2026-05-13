import React from 'react';
import { X, Check, AlertCircle, Info, HelpCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'success' | 'danger' | 'info' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  type = 'info',
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar'
}) => {
  if (!isOpen) return null;

  const themes = {
    success: {
      bg: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconText: 'text-green-600',
      button: 'bg-green-600 hover:bg-green-700 text-white shadow-green-200',
      icon: <Check size={24} />
    },
    danger: {
      bg: 'bg-red-50',
      iconBg: 'bg-red-100',
      iconText: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700 text-white shadow-red-200',
      icon: <X size={24} />
    },
    warning: {
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      iconText: 'text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200',
      icon: <HelpCircle size={24} />
    },
    info: {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-600',
      button: 'bg-primary hover:bg-accent text-darkBg shadow-primary/20',
      icon: <Info size={24} />
    }
  };

  const theme = themes[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onCancel}
      />
      
      {/* Modal Content */}
      <div className={`relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden transform transition-all duration-300 scale-100 animate-in fade-in zoom-in-95`}>
        
        {/* Header/Icon */}
        <div className={`h-32 ${theme.bg} flex items-center justify-center relative overflow-hidden`}>
           {/* Abstract Decoration */}
           <div className={`absolute top-0 right-0 w-24 h-24 ${theme.iconText} opacity-10 -mr-8 -mt-8 rounded-full`} />
           
           <div className={`w-16 h-16 ${theme.iconBg} ${theme.iconText} rounded-2xl flex items-center justify-center shadow-lg transform rotate-6 scale-110`}>
              {theme.icon}
           </div>
        </div>

        {/* Text */}
        <div className="p-8 text-center">
           <h3 className="font-display text-2xl font-black text-[#450A0A] uppercase tracking-tight mb-2">
             {title}
           </h3>
           <p className="text-gray-500 text-sm leading-relaxed">
             {message}
           </p>
        </div>

        {/* Footer Actions */}
        <div className="px-8 pb-8 flex flex-col gap-2">
           <button
             onClick={onConfirm}
             className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-lg active:scale-95 ${theme.button}`}
           >
             {confirmText}
           </button>
           <button
             onClick={onCancel}
             className="w-full py-3 rounded-2xl font-bold text-xs text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
           >
             {cancelText}
           </button>
        </div>
      </div>
    </div>
  );
};
