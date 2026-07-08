
import React from 'react';
import { Wheat, Clock, CheckCircle2, Factory, Zap, Wind, Droplets, Waves, ArrowUpRight } from 'lucide-react';

interface Props {
  initialMoisture: number;
  targetTempering: number;
  compensatedTarget: number;
  targetFlour: number;
  loss: number;
  storageLoss: number;
}

const ProcessFlow: React.FC<Props> = ({ initialMoisture, targetTempering, compensatedTarget, targetFlour, loss, storageLoss }) => {
  return (
    <div className="bg-white rounded-none shadow-sm border border-slate-200 font-sans flex flex-col overflow-hidden relative isolate p-4">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Factory className="w-3.5 h-3.5" /> Fluxo de Processo
        </h3>
      </div>
      
      <div className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-none border border-amber-100">
             <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-black text-amber-600 uppercase">Trigo Limpo</span>
              <div className="w-6 h-6 bg-white rounded-none flex items-center justify-center border border-amber-100 overflow-hidden relative">
                <img 
                  src="https://i.ibb.co/DgbmXFt0/image.png" 
                  alt="Logo Trigo" 
                  className="w-full h-full object-contain mb-0.5"
                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-amber-600 py-0.5 flex items-center justify-center">
                  <span className="text-[4px] font-black text-white uppercase tracking-tighter">Trigo</span>
                </div>
              </div>
             </div>
             <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-amber-900">{initialMoisture.toFixed(1)}</span>
                <span className="text-sm font-bold text-amber-500">%</span>
             </div>
          </div>

          <div className="flex justify-center -my-2 relative z-10">
             <div className="bg-blue-500 p-2 rounded-none shadow-lg border-2 border-white">
                <Droplets className="w-4 h-4 text-white" />
             </div>
          </div>

          <div className="bg-blue-600 p-5 rounded-none shadow-lg relative overflow-hidden text-white">
             <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-black text-blue-200 uppercase">Saída Molhador</span>
                <Waves className="w-4 h-4 text-white animate-pulse" />
             </div>
             <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black">{compensatedTarget.toFixed(2)}</span>
                <span className="text-lg font-bold text-blue-200">%</span>
             </div>
             <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-[8px] font-bold uppercase text-blue-100">
                <span>Meta B1: {targetTempering.toFixed(1)}%</span>
                <span className="flex items-center gap-1"><ArrowUpRight className="w-2.5 h-2.5" /> Evap: -{storageLoss}%</span>
             </div>
          </div>

          <div className="flex justify-center -my-2 relative z-10">
             <div className="bg-red-100 p-2 rounded-none shadow border-2 border-white">
                <Wind className="w-4 h-4 text-red-500" />
             </div>
          </div>

          <div className="bg-emerald-50 p-4 rounded-none border border-emerald-100">
             <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-black text-emerald-600 uppercase">Farinha Final</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
             </div>
             <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-emerald-800">{targetFlour.toFixed(1)}</span>
                <span className="text-sm font-bold text-emerald-500">%</span>
             </div>
             <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Quebra Moagem: -{loss.toFixed(1)}%</p>
          </div>
      </div>
    </div>
  );
};

export default ProcessFlow;
