
import React, { useState, useEffect } from 'react';
import { MillingBox } from './MillingBox';
import { subscribeToMillingBoxes } from '../firebase';
import { MillingBoxData } from '../types';

interface Props {
  onBack: () => void;
}

export const MillingView: React.FC<Props> = ({ onBack }) => {
  const [boxes, setBoxes] = useState<MillingBoxData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuta em tempo real as 3 caixas
    const unsub = subscribeToMillingBoxes((data) => {
      setBoxes(data);
      setLoading(false); // Agora o loading sempre desliga após a primeira resposta, mesmo vazia
    });
    return () => unsub();
  }, []);

  const getBoxData = (id: number) => boxes.find(b => b.id === id);

  return (
    <div className="w-full pb-12 animate-fadeIn">
       {/* Toolbar Superior */}
       <div className="mb-8 flex items-center justify-between">
         <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase leading-none">Monitoramento de Moagem</h2>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.3em] mt-2">Status em Tempo Real das Caixas</p>
         </div>
         <button 
            onClick={onBack} 
            className="p-3 text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all"
         >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
         </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
           <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-6"></div>
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sincronizando Banco de Dados...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <MillingBox boxId={1} initialData={getBoxData(1)} />
          <MillingBox boxId={2} initialData={getBoxData(2)} />
          <MillingBox boxId={3} initialData={getBoxData(3)} />
        </div>
      )}
    </div>
  );
};
