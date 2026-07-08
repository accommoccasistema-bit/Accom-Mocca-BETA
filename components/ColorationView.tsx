
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../src/shared/contexts/DataContext';
import { saveColoration } from '../firebase';
import { Bica, Destination } from '../types';
import { Toast, ToastType } from './Toast';

interface ColorationViewProps {
  onBack: () => void;
}

export const ColorationView: React.FC<ColorationViewProps> = ({ onBack }) => {
  const { coloration, loadingColoration } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false
  });
  
  const [localBicas, setLocalBicas] = useState<Bica[]>([]);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
  };

  const [expected, setExpected] = useState({
    C: 0,
    E: 0,
    CL: 0
  });

  useEffect(() => {
    if (!loadingColoration && coloration.length > 0) {
      setLocalBicas(coloration);
    }
  }, [coloration, loadingColoration]);

  const darkestBicaIds = useMemo(() => {
    const findDarkest = (dest: Destination) => {
      const filtered = localBicas.filter(b => b.destination === dest && b.color > 0);
      if (filtered.length === 0) return null;
      return filtered.reduce((prev, curr) => (prev.color < curr.color ? prev : curr)).id;
    };

    return {
      C: findDarkest('C'),
      E: findDarkest('E'),
      CL: findDarkest('CL')
    };
  }, [localBicas]);

  const calculateExpected = (currentBicas = localBicas) => {
    const calcWeighted = (dest: Destination) => {
      const selected = currentBicas.filter(b => b.destination === dest);
      if (selected.length === 0) return 0;
      
      const totalFlow = selected.reduce((acc, curr) => acc + (curr.vazao || 1), 0);
      const weightedSum = selected.reduce((acc, curr) => acc + (curr.color * (curr.vazao || 1)), 0);
      
      return weightedSum / totalFlow;
    };

    setExpected({
      C: calcWeighted('C'),
      E: calcWeighted('E'),
      CL: calcWeighted('CL')
    });
  };

  useEffect(() => {
    calculateExpected();
  }, [localBicas]);

  const toggleDestination = (id: string, dest: Destination) => {
    if (isEditing) return;
    setLocalBicas(prev => {
        const updated = prev.map(b => 
            b.id === id ? { ...b, destination: b.destination === dest ? null : dest } : b
        );
        saveColoration(updated);
        return updated;
    });
  };

  const handleBicaColorChange = (id: string, value: string) => {
    const normalizedValue = value.replace(',', '.');
    const numericValue = parseFloat(normalizedValue);
    setLocalBicas(prev => prev.map(b => 
      b.id === id ? { ...b, color: isNaN(numericValue) ? 0 : numericValue } : b
    ));
  };

  const handleBicaFlowChange = (id: string, value10s: string) => {
    const normalizedValue = value10s.replace(',', '.');
    const numericValue = parseFloat(normalizedValue);
    const flowKgh = isNaN(numericValue) ? 0 : Math.round(numericValue * 360);
    
    setLocalBicas(prev => prev.map(b => 
      b.id === id ? { ...b, vazao: flowKgh } : b
    ));
  };

  const formatNumber = (val: number) => {
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleTopButtonClick = async () => {
    const sortedBicas = [...localBicas].sort((a, b) => b.color - a.color);
    
    let tempE: Bica[] = [];
    let tempC: Bica[] = [];
    let tempCL: Bica[] = [];

    sortedBicas.forEach(bica => {
      if (bica.color >= 92.8) {
        tempE.push(bica);
      } else if (bica.color >= 88.5) {
        tempC.push(bica);
      } else {
        tempCL.push(bica);
      }
    });

    const checkWeightedAverage = (arr: Bica[]) => {
      if (arr.length === 0) return 0;
      const totalFlow = arr.reduce((a, b) => a + (b.vazao || 1), 0);
      const sum = arr.reduce((a, b) => a + (b.color * (b.vazao || 1)), 0);
      return sum / totalFlow;
    };
    
    while (tempC.length > 0 && checkWeightedAverage(tempC) < 89.25) {
      const darker = tempC.pop();
      if (darker) tempCL.push(darker);
    }

    const finalBicas = localBicas.map(orig => {
      if (tempE.find(b => b.id === orig.id)) return { ...orig, destination: 'E' as Destination };
      if (tempC.find(b => b.id === orig.id)) return { ...orig, destination: 'C' as Destination };
      if (tempCL.find(b => b.id === orig.id)) return { ...orig, destination: 'CL' as Destination };
      return { ...orig, destination: null as Destination };
    });

    setLocalBicas(finalBicas);
    await saveColoration(finalBicas);
    showToast("CALIBRAÇÃO PONDERADA CONCLUÍDA!", "success");
  };

  const handleToggleEdit = async () => {
    if (isEditing) {
      setIsSaving(true);
      const success = await saveColoration(localBicas);
      setIsSaving(false);
      if (success) {
        setIsEditing(false);
        showToast("VALORES SALVOS COM SUCESSO!", "success");
      } else {
        showToast("Erro ao salvar. Verifique sua conexão.", "error");
      }
    } else {
      setIsEditing(true);
    }
  };

  const getStatusLabel = (val: number, type: 'C' | 'E') => {
    if (val === 0) return null;
    if (type === 'C') {
      if (val < 89.20) return { text: 'MUITO ESCURA', color: 'text-red-600 bg-red-50' };
      if (val > 90.00) return { text: 'MUITO CLARA', color: 'text-amber-600 bg-amber-50' };
      return { text: 'DENTRO DO PADRÃO', color: 'text-emerald-600 bg-emerald-50' };
    } else {
      if (val < 93.10) return { text: 'FORA DO PADRÃO', color: 'text-red-600 bg-red-50' };
      if (val > 93.95) return { text: 'EXCELENTE', color: 'text-blue-600 bg-blue-50' };
      return { text: 'DENTRO DO PADRÃO', color: 'text-emerald-600 bg-emerald-50' };
    }
  };

  const Parallelogram = ({ index, color }: { index: number, color: string }) => {
    const isEven = index % 2 === 0;
    return (
      <svg viewBox="0 0 40 48" className="w-full h-12 overflow-visible" preserveAspectRatio="none">
        {isEven ? (
          <path d="M12.5 0 L27.5 0 L17.5 48 L2.5 48 Z" fill={color} />
        ) : (
          <path d="M17.5 0 L2.5 0 L12.5 48 L27.5 48 Z" fill={color} />
        )}
      </svg>
    );
  };

  if (loadingColoration) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#2563eb] rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest text-center px-4">Sincronizando Vazão e Cor...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 pb-12 animate-fadeIn font-inter bg-white min-h-screen">
      <div className="pt-4 mb-2">
         <button onClick={onBack} className="p-3 text-slate-500 hover:text-slate-800 transition-colors bg-white rounded-xl border border-slate-200 shadow-sm active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
      </div>

      <div className="text-center mb-6">
        <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none mb-1">Rosca Tripla</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">CONTROLE PONDERADO POR VAZÃO</p>
      </div>

      <div className="flex justify-center mb-8">
        <button onClick={handleTopButtonClick} className="bg-[#2563eb] text-white font-black px-10 py-4 rounded-2xl shadow-xl active:scale-95 transition-all uppercase tracking-widest text-lg">
          CALIBRAR AGORA
        </button>
      </div>

      <div className="w-full max-md mx-auto mb-8 overflow-hidden">
        <div className="grid grid-cols-[0.7fr_0.4fr_0.8fr_0.8fr_0.4fr_0.4fr_0.4fr] items-center text-center pb-2 border-b border-slate-100 mb-2 gap-1 px-1">
            <div className="text-left text-[8px] font-bold text-slate-400 uppercase">Bica</div>
            <div></div>
            <div className="text-[8px] font-bold text-slate-400 uppercase">Cor L*</div>
            <div className="text-[8px] font-bold text-slate-400 uppercase">{isEditing ? "Peso 10s" : "Vazão"}</div>
            <div className="text-emerald-600 font-black text-[10px]">C</div>
            <div className="text-blue-700 font-black text-[10px]">E</div>
            <div className="text-slate-900 font-black text-[10px]">CL</div>
        </div>

        <div className="space-y-0 relative">
          {localBicas.map((bica, idx) => {
            const isDarkestInLine = 
              (bica.destination === 'C' && bica.id === darkestBicaIds.C) ||
              (bica.destination === 'E' && bica.id === darkestBicaIds.E) ||
              (bica.destination === 'CL' && bica.id === darkestBicaIds.CL);

            let segmentColor = '#f1f5f9';
            if (isDarkestInLine) segmentColor = '#ef4444';
            else if (bica.destination === 'C') segmentColor = '#10b981';
            else if (bica.destination === 'E') segmentColor = '#2563eb';
            else if (bica.destination === 'CL') segmentColor = '#171717';

            return (
              <div key={bica.id} className={`grid grid-cols-[0.7fr_0.4fr_0.8fr_0.8fr_0.4fr_0.4fr_0.4fr] items-center h-12 border-b border-slate-50 last:border-none transition-colors gap-1 px-1 ${isEditing ? 'bg-blue-50/40' : ''}`}>
                 
                 <div className="text-left font-black text-slate-700 text-[10px] whitespace-nowrap uppercase flex items-center justify-between pr-1">
                    <span>{bica.name}</span>
                    {isDarkestInLine && !isEditing && (
                       <div className="w-1.5 h-1.5 rounded-full bg-slate-900 shadow-sm" title="Mais escura da linhagem"></div>
                    )}
                 </div>

                 <div className="h-full flex items-center">
                    <Parallelogram index={idx} color={segmentColor} />
                 </div>
                 
                 <div className="flex justify-center">
                   {isEditing ? (
                      <input type="tel" inputMode="decimal" defaultValue={bica.color.toString().replace('.', ',')} onBlur={(e) => handleBicaColorChange(bica.id, e.target.value)} className="w-full max-w-[50px] bg-white border border-slate-200 rounded text-center font-bold text-blue-700 text-xs py-0.5" />
                   ) : (
                      <div className={`text-center font-bold text-xs ${isDarkestInLine ? 'text-red-600 underline decoration-red-300 underline-offset-2' : 'text-blue-700'}`}>
                        {formatNumber(bica.color)}
                      </div>
                   )}
                 </div>

                 <div className="flex justify-center">
                   {isEditing ? (
                      <div className="relative w-full max-w-[60px]">
                          <input type="tel" inputMode="decimal" placeholder="1,15" defaultValue={(bica.vazao / 360).toFixed(2).replace('.', ',')} onBlur={(e) => handleBicaFlowChange(bica.id, e.target.value)} className="w-full bg-white border border-emerald-300 rounded text-center font-black text-emerald-700 text-xs py-0.5" />
                          <span className="absolute -bottom-2.5 left-0 right-0 text-[6px] font-bold text-emerald-500 text-center uppercase">Amostra</span>
                      </div>
                   ) : (
                      <div className="text-center">
                          <span className="font-black text-slate-700 text-xs">{bica.vazao}</span>
                          <span className="text-[8px] text-slate-400 ml-0.5">kg/h</span>
                      </div>
                   )}
                 </div>

                 <div className="flex justify-center">
                   <button disabled={isEditing} onClick={() => toggleDestination(bica.id, 'C')} className={`w-5 h-5 rounded-md border border-slate-300 ${bica.destination === 'C' ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-50'} ${isEditing ? 'opacity-20' : 'active:scale-90'}`} />
                 </div>
                 <div className="flex justify-center">
                   <button disabled={isEditing} onClick={() => toggleDestination(bica.id, 'E')} className={`w-5 h-5 rounded-md border border-slate-300 ${bica.destination === 'E' ? 'bg-blue-600 border-blue-700' : 'bg-slate-50'} ${isEditing ? 'opacity-20' : 'active:scale-90'}`} />
                 </div>
                 <div className="flex justify-center">
                   <button disabled={isEditing} onClick={() => toggleDestination(bica.id, 'CL')} className={`w-5 h-5 rounded-md border border-slate-300 ${bica.destination === 'CL' ? 'bg-slate-800 border-slate-900' : 'bg-slate-50'} ${isEditing ? 'opacity-20' : 'active:scale-90'}`} />
                 </div>
              </div>
            );
          })}
        </div>
        
        {!isEditing && (
          <div className="flex items-center gap-4 mt-6 px-2 opacity-70 flex-wrap">
             <div className="flex items-center gap-1.5">
                <div className="w-3 h-1.5 rounded-sm bg-red-500"></div>
                <span className="text-[8px] font-black text-slate-500 uppercase">Mais Escura</span>
             </div>
             <div className="flex items-center gap-1.5">
                <div className="w-3 h-1.5 rounded-sm bg-blue-600"></div>
                <span className="text-[8px] font-black text-slate-500 uppercase">Especial</span>
             </div>
             <div className="flex items-center gap-1.5">
                <div className="w-3 h-1.5 rounded-sm bg-emerald-500"></div>
                <span className="text-[8px] font-black text-slate-500 uppercase">Comum</span>
             </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-sm mx-auto mt-12 space-y-6 pt-6 border-t border-slate-100">
         <h3 className="text-center text-xs font-black text-slate-800 uppercase tracking-widest">COLORAÇÃO ESPERADA</h3>
         
         <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
               <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">COMUM (PONDERADO)</span>
               {getStatusLabel(expected.C, 'C') && (
                 <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${getStatusLabel(expected.C, 'C')?.color}`}>
                    {getStatusLabel(expected.C, 'C')?.text}
                 </span>
               )}
            </div>
            <div className="flex items-baseline justify-between">
               <span className="text-5xl font-black text-emerald-600 tracking-tighter">{formatNumber(expected.C)}</span>
               <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 block leading-none">L* Médio</span>
                  <span className="text-[8px] font-medium text-slate-300">Considerando vazão</span>
               </div>
            </div>
         </div>

         <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
               <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">ESPECIAL (PONDERADO)</span>
               {getStatusLabel(expected.E, 'E') && (
                 <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${getStatusLabel(expected.E, 'E')?.color}`}>
                    {getStatusLabel(expected.E, 'E')?.text}
                 </span>
               )}
            </div>
            <div className="flex items-baseline justify-between">
               <span className="text-5xl font-black text-blue-700 tracking-tighter">{formatNumber(expected.E)}</span>
               <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 block leading-none">L* Médio</span>
                  <span className="text-[8px] font-medium text-slate-300">Considerando vazão</span>
               </div>
            </div>
         </div>

         <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
               <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">COLA (DESVIO DE COR)</span>
            </div>
            <div className="flex items-baseline justify-between">
               <span className="text-5xl font-black text-slate-900 tracking-tighter">{formatNumber(expected.CL)}</span>
               <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 block leading-none">L* Médio</span>
                  <span className="text-[8px] font-medium text-slate-300">Desvio de Cor</span>
               </div>
            </div>
         </div>
      </div>

      <div className="flex justify-center mt-12 pb-10">
        <button 
            onClick={handleToggleEdit} 
            disabled={isSaving}
            className={`w-full max-w-xs ${isEditing ? 'bg-emerald-600' : 'bg-slate-800'} text-white font-black px-6 py-5 rounded-2xl shadow-xl active:scale-95 transition-all uppercase tracking-widest text-sm text-center flex items-center justify-center`}
        >
          {isSaving ? "SINCRONIZANDO..." : isEditing ? "SALVAR PESOS E CORES" : "EDITAR VALORES DAS BICAS"}
        </button>
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
