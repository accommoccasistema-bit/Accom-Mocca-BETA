import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X, Check } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'success';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = 'primary'
}) => {
  const colors = {
    danger: 'bg-red-600',
    primary: 'bg-[#2563eb]',
    success: 'bg-emerald-600'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto p-4 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden relative z-10 my-auto"
          >
            <div className={`${colors[variant]} p-6 text-white text-center relative`}>
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-80" />
              <h3 className="text-xl font-black uppercase tracking-widest">{title}</h3>
              <button onClick={onClose} className="absolute right-6 top-6 opacity-60 hover:opacity-100 transition-opacity">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-center text-slate-600 font-medium leading-relaxed">
                {message}
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={onClose} 
                  className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 active:scale-95 transition-all"
                >
                  {cancelText}
                </button>
                <button 
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }} 
                  className={`flex-[1.5] ${colors[variant]} text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
