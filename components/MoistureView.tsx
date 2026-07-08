
import React, { useState, useEffect } from 'react';
import { saveMoisture, subscribeToMoisture } from '../firebase';
import { MoistureEntry } from '../types';
import { Toast, ToastType } from './Toast';

interface MoistureViewProps {
  onBack: () => void;
}

export const MoistureView: React.FC<MoistureViewProps> = ({ onBack }) => {
  const [wheat, setWheat] = useState('');
  const [flour, setFlour] = useState('');
  const [bran, setBran] = useState('');
  const [history, setHistory] = useState<MoistureEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
  };

  useEffect(() => {
    const unsub = subscribeToMoisture((data) => {
      setHistory(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleInputChange = (val: string, setter: (v: string) => void) => {
    const digits = val.replace(/\D/g, '');
    if (!digits) return setter('');
    const num = (Number(digits) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    setter(num);
  };

  const parseValue = (val: string) => parseFloat(val.replace(',', '.'));

  const handleSave = async () => {
    const w = parseValue(wheat);
    const f = parseValue(flour);
    const b = parseValue(bran);

    if (isNaN(w) && isNaN(f) && isNaN(b)) {
      showToast("Preencha ao menos um campo!", "error");
      return;
    }

    setIsSaving(true);
    const success = await saveMoisture(w || 0, f || 0, b || 0);
    setIsSaving(false);

    if (success) {
      setWheat('');
      setFlour('');
      setBran('');
      showToast("Umidade salva com sucesso!", "success");
    } else {
      showToast("Erro ao salvar umidade.", "error");
    }
  };

  const getStatus = (val: number) => {
    if (val === 0) return null;
    const diff = val - 14.5;
    if (Math.abs(diff) <= 0.2) return { text: 'IDEAL', color: 'bg-emerald-100 text-emerald-700' };
    if (diff > 0.2) return { text: 'ALTA', color: 'bg-blue-100 text-blue-700' };
    return { text: 'BAIXA', color: 'bg-red-100 text-red-700' };
  };

  return (
    <div className="w-full px-4 pb-12 animate-fadeIn font-inter">
      <div className="flex items-center mb-8 pt-4">
        <button onClick={onBack} className="p-3 mr-4 text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight leading-none mb-1">Umidade</h2>
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">QUALIDADE</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-8">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Novo Registro</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase">Trigo</label>
              <input type="tel" inputMode="decimal" value={wheat} onChange={(e) => handleInputChange(e.target.value, setWheat)} placeholder="0,00" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-center font-black text-slate-700 outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase">Farinha</label>
              <input type="tel" inputMode="decimal" value={flour} onChange={(e) => handleInputChange(e.target.value, setFlour)} placeholder="0,00" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-center font-black text-slate-700 outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase">Farelo</label>
              <input type="tel" inputMode="decimal" value={bran} onChange={(e) => handleInputChange(e.target.value, setBran)} placeholder="0,00" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-center font-black text-slate-700 outline-none focus:border-amber-500" />
            </div>
          </div>
          <button onClick={handleSave} disabled={isSaving} className="w-full bg-amber-500 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all uppercase tracking-widest text-sm mt-2">
            {isSaving ? "SALVANDO..." : "SALVAR UMIDADE"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2 mb-2">Últimas Medições</h3>
        {loading ? (
          <div className="text-center py-10 animate-pulse text-slate-300 font-bold uppercase text-[10px]">Sincronizando...</div>
        ) : history.map((entry) => (
          <div key={entry.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {entry.date ? (
                  typeof entry.date.toDate === 'function'
                    ? entry.date.toDate().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                    : new Date(entry.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                ) : '---'}
              </span>
              <div className="flex gap-2">
                 {getStatus(entry.flour) && <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${getStatus(entry.flour)?.color}`}>{getStatus(entry.flour)?.text}</span>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center border-r border-slate-50">
                <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Trigo</p>
                <p className="text-sm font-black text-slate-700">{(entry.wheat ?? 0).toFixed(2)}%</p>
              </div>
              <div className="text-center border-r border-slate-50">
                <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Farinha</p>
                <p className="text-sm font-black text-blue-600">{(entry.flour ?? 0).toFixed(2)}%</p>
              </div>
              <div className="text-center">
                <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Farelo</p>
                <p className="text-sm font-black text-amber-600">{(entry.bran ?? 0).toFixed(2)}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Toast 
        isVisible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
      />
    </div>
  );
};
