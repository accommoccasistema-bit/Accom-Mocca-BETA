import React from 'react';
import { useData } from '../src/shared/contexts/DataContext';
import { TrendingUp } from 'lucide-react';

interface HistoryViewProps {
  onBack: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onBack }) => {
  const { history, loadingHistory } = useData();

  const formatDateParts = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return { date: "--/--/----", time: "--:--" };
    const dateObj = timestamp.toDate();
    const date = dateObj.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = dateObj.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return { date, time };
  };

  const DataRow = ({ label, value, colorClass, dotColor, bgClass, borderClass }: { label: string, value: number, colorClass: string, dotColor: string, bgClass: string, borderClass: string }) => (
      <div className={`${bgClass} p-3 rounded-2xl border ${borderClass} flex flex-col`}>
          <div className="flex items-center gap-1.5 mb-1">
              <div className={`w-1 h-1 rounded-full ${dotColor}`}></div>
              <span className={`text-[8px] font-black uppercase tracking-widest text-slate-400`}>{label}</span>
          </div>
          <div className="flex items-baseline gap-1">
              <span className={`text-base font-black tracking-tighter ${colorClass}`}>{Math.round(value).toLocaleString('pt-BR')}</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase">kg/h</span>
          </div>
      </div>
  );

  return (
    <div className="w-full pb-12 animate-fadeIn font-inter">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase leading-none">Histórico de Produção</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Registros detalhados de extração e rendimento</p>
        </div>
        <button 
          onClick={onBack}
          className="p-3 text-slate-500 hover:text-slate-800 transition-colors bg-white rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {loadingHistory ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
           <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-6"></div>
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Carregando Histórico...</span>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-32 text-slate-400 bg-white rounded-[2.5rem] border border-dashed border-slate-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-6 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-black text-sm text-slate-500 uppercase tracking-widest">Nenhum registro encontrado</p>
          <p className="text-xs text-slate-400 mt-2 uppercase tracking-wider">Os dados de produção aparecerão aqui após o primeiro cálculo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {history.map((item) => {
            const branKgH = item.bran; // Já está em kg/h no banco
            const { date, time } = formatDateParts(item.date);
            const common = item.flourCommon || 0;
            const special = item.flourSpecial || 0;
            const whole = item.flourWhole || 0;
            const glue = item.flourGlue || 0;
            const legacyFlour = item.flour;
            const hasBreakdown = item.flourCommon !== undefined;
            const totalFlourCalculated = hasBreakdown ? (common + special + whole + glue) : legacyFlour;

            return (
              <div key={item.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
                
                {/* Header Row */}
                <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-100">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Data do Registro</span>
                      <span className="text-sm font-black text-slate-800 uppercase tracking-tight">
                         {date}
                      </span>
                   </div>
                   <div className="text-right">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Horário</span>
                      <span className="text-2xl font-black text-slate-800 tracking-tighter leading-none">
                          {time}
                      </span>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-3">
                       {hasBreakdown ? (
                           <>
                               <DataRow label="Comum" value={common} colorClass="text-emerald-600" dotColor="bg-emerald-500" bgClass="bg-emerald-50/30" borderClass="border-emerald-100/50" />
                               <DataRow label="Especial" value={special} colorClass="text-blue-600" dotColor="bg-blue-600" bgClass="bg-blue-50/30" borderClass="border-blue-100/50" />
                               <DataRow label="Inteira" value={whole} colorClass="text-amber-600" dotColor="bg-amber-500" bgClass="bg-amber-50/30" borderClass="border-amber-100/50" />
                               <DataRow label="Cola" value={glue} colorClass="text-slate-900" dotColor="bg-slate-900" bgClass="bg-slate-50/30" borderClass="border-slate-100/50" />
                           </>
                       ) : (
                           <div className="col-span-2">
                             <DataRow label="Farinha" value={legacyFlour} colorClass="text-slate-600" dotColor="bg-slate-400" bgClass="bg-slate-50/30" borderClass="border-slate-100/50" />
                           </div>
                       )}
                   </div>

                   <div className="grid grid-cols-2 gap-3 mt-4">
                       <div className="bg-orange-50/30 p-3 rounded-2xl border border-orange-100/50 flex flex-col">
                           <div className="flex items-center gap-1.5 mb-1">
                               <div className="w-1 h-1 rounded-full bg-orange-500"></div>
                               <span className="text-[8px] font-black uppercase tracking-widest text-orange-400">Farelo</span>
                           </div>
                           <div className="flex items-baseline gap-1">
                               <span className="text-base font-black tracking-tighter text-orange-600">{Math.round(branKgH).toLocaleString('pt-BR')}</span>
                               <span className="text-[8px] font-bold text-orange-400 uppercase">kg/h</span>
                           </div>
                       </div>
                       <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex flex-col">
                           <div className="flex items-center gap-1.5 mb-1">
                               <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                               <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Total</span>
                           </div>
                           <div className="flex items-baseline gap-1">
                               <span className="text-base font-black tracking-tighter text-white">{Math.round(totalFlourCalculated).toLocaleString('pt-BR')}</span>
                               <span className="text-[8px] font-bold text-slate-400 uppercase">kg/h</span>
                           </div>
                       </div>
                   </div>

                   <div className="mt-6 pt-6 border-t border-slate-100">
                        <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-between">
                             <div>
                               <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest mb-1">Rendimento Final</p>
                               <p className="text-2xl font-black text-white tracking-tighter leading-none">
                                   {item.yieldPercentage.toFixed(1)}%
                               </p>
                             </div>
                             <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                                <TrendingUp size={20} />
                             </div>
                        </div>
                   </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
};
