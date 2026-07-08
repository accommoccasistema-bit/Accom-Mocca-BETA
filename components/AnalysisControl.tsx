
import React, { useState } from 'react';
import { Droplets, Palette, Save, History, Clock, CheckCircle2 } from 'lucide-react';
import { saveAnalysis } from '../firebase';
import { useData } from '../src/shared/contexts/DataContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AnalysisControl = () => {
  const { analyses, loadingAnalyses } = useData();
  const [colors, setColors] = useState({
    special: '',
    common: '',
    whole: '',
    glue: '',
    bran: '',
    wheat: ''
  });
  const [humidities, setHumidities] = useState({
    special: '',
    common: '',
    whole: '',
    glue: '',
    bran: '',
    wheat: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const cleanValue = (val: string) => val.replace(/\./g, '').replace(',', '.');
    
    const typesToSave = flourTypes.filter(t => 
      colors[t.id as keyof typeof colors] || 
      humidities[t.id as keyof typeof humidities]
    );
    
    if (typesToSave.length === 0) {
      setIsSaving(false);
      return;
    }

    try {
      for (const type of typesToSave) {
        await saveAnalysis({
          type: type.label,
          color: parseFloat(cleanValue(colors[type.id as keyof typeof colors])) || 0,
          moisture: parseFloat(cleanValue(humidities[type.id as keyof typeof humidities])) || 0
        });
      }
      setColors({ special: '', common: '', whole: '', glue: '', bran: '', wheat: '' });
      setHumidities({ special: '', common: '', whole: '', glue: '', bran: '', wheat: '' });
    } catch (error) {
      console.error("Error saving analyses:", error);
    }
    
    setIsSaving(false);
  };

  const maskBrazilian = (value: string, decimals: number = 2) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const numberValue = Number(digits) / Math.pow(10, decimals);
    return numberValue.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const handleInputChange = (
    setter: React.Dispatch<React.SetStateAction<any>>,
    id: string,
    value: string,
    decimals: number = 2
  ) => {
    if (id === 'wheat' && (setter === setColors)) {
      const digits = value.replace(/\D/g, '').slice(0, 2);
      setter((prev: any) => ({ ...prev, [id]: digits }));
      return;
    }
    const masked = maskBrazilian(value, decimals);
    setter((prev: any) => ({ ...prev, [id]: masked }));
  };

  const flourTypes = [
    { id: 'special', label: 'ESPECIAL', color: 'text-blue-700', bg: 'bg-blue-50/50', border: 'border-blue-200', accent: 'bg-blue-600', icon: <Palette size={20} />, img: 'https://i.ibb.co/3yYgYdjn/image.png' },
    { id: 'common', label: 'COMUM', color: 'text-emerald-700', bg: 'bg-emerald-50/50', border: 'border-emerald-200', accent: 'bg-emerald-600', icon: <Palette size={20} />, img: 'https://i.ibb.co/r2PbxJbz/image.png' },
    { id: 'whole', label: 'INTEIRA', color: 'text-red-700', bg: 'bg-red-50/50', border: 'border-red-200', accent: 'bg-red-600', icon: <Palette size={20} />, img: 'https://i.ibb.co/Xn0XLJM/image.png' },
    { id: 'glue', label: 'COLA', color: 'text-slate-900', bg: 'bg-slate-50/50', border: 'border-slate-300', accent: 'bg-slate-900', icon: <Palette size={20} />, img: 'https://i.ibb.co/8LDzkhh8/image.png' },
    { id: 'bran', label: 'FARELO', color: 'text-amber-800', bg: 'bg-stone-50/50', border: 'border-amber-200', accent: 'bg-amber-800', icon: <Droplets size={20} />, img: 'https://i.ibb.co/chcGNGq8/image.png' },
    { id: 'wheat', label: 'TRIGO', color: 'text-amber-900', bg: 'bg-amber-50/50', border: 'border-amber-300', accent: 'bg-amber-900', icon: <Droplets size={20} />, img: 'https://i.ibb.co/DgbmXFt0/image.png' }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-6 mb-10">
            <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
              <Palette className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Análise de Qualidade</h2>
              <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-wider">Laboratório de Controle de Pureza</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {flourTypes.map(type => (
              <div 
                key={type.id} 
                className={`p-6 rounded-2xl border ${type.border} ${type.bg} transition-all hover:shadow-md group`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 overflow-hidden p-1`}>
                    <img src={type.img} alt={type.label} className="w-full h-full object-contain" style={{ imageRendering: '-webkit-optimize-contrast' }} referrerPolicy="no-referrer" />
                  </div>
                  <h3 className={`text-xl font-bold uppercase tracking-tight ${type.color}`}>{type.label}</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={`text-[11px] font-bold ${type.color} uppercase tracking-wider ml-1`}>
                      {type.id === 'wheat' ? 'PH' : 'Cor (L*)'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={colors[type.id as Extract<keyof typeof colors, string>] || ''}
                        onChange={(e) => handleInputChange(setColors, type.id, e.target.value, 2)}
                        placeholder={type.id === 'wheat' ? '78' : '90,47'}
                        className={`w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xl transition-all font-semibold text-slate-900 placeholder:text-slate-300 focus:ring-4 outline-none ${
                          type.id === 'common' ? 'focus:ring-green-500/10 focus:border-green-500' : 
                          type.id === 'special' ? 'focus:ring-blue-500/10 focus:border-blue-500' :
                          type.id === 'whole' ? 'focus:ring-red-500/10 focus:border-red-500' :
                          'focus:ring-black/10 focus:border-black'
                        }`}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[10px] uppercase">
                        {type.id === 'wheat' ? 'PH' : 'L*'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Umidade (%)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={humidities[type.id as Extract<keyof typeof humidities, string>] || ''}
                        onChange={(e) => handleInputChange(setHumidities, type.id, e.target.value, 1)}
                        placeholder="14,2"
                        className={`w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xl transition-all font-semibold text-slate-900 placeholder:text-slate-300 focus:ring-4 outline-none ${
                          type.id === 'common' ? 'focus:ring-green-500/10 focus:border-green-500' : 
                          type.id === 'special' ? 'focus:ring-blue-500/10 focus:border-blue-500' :
                          type.id === 'whole' ? 'focus:ring-red-500/10 focus:border-red-500' :
                          'focus:ring-black/10 focus:border-black'
                        }`}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[10px] uppercase">%</div>
                    </div>
                  </div>
                </div>

                {/* Removido campos de cinzas, glúten e w conforme solicitado */}
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full mt-8 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg active:scale-[0.98] uppercase text-sm tracking-widest"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Registrando...' : 'Salvar Análise'}
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-slate-100 rounded-xl">
            <History className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Histórico de Análises</h3>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mt-0.5">Registros Recentes</p>
          </div>
        </div>

        <div className="space-y-4">
          {loadingAnalyses ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando...</span>
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhum registro</span>
            </div>
          ) : (
            analyses.map((analysis) => (
              <div key={analysis.id} className="p-6 bg-white rounded-2xl border border-slate-100 hover:border-slate-300 transition-all shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-[10px] font-black text-slate-400 rotate-[-45deg]">{analysis.type?.substring(0, 3)}</div>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{analysis.type}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400">
                          {analysis.date?.toDate ? format(analysis.date.toDate(), "dd/MM/yy HH:mm", { locale: ptBR }) : '---'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    {analysis.type !== 'FARELO' && (
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{analysis.type === 'TRIGO' ? 'PH' : 'Cor (L*)'}</p>
                        <p className="text-lg font-black text-blue-600 tabular-nums">{analysis.type === 'TRIGO' ? (analysis.color?.toFixed(0) + '%') : analysis.color?.toFixed(2)}</p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Umidade</p>
                      <p className="text-lg font-black text-cyan-600 tabular-nums">{analysis.moisture?.toFixed(2)}%</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 h-fit self-center">
                      <CheckCircle2 className="w-3 h-3" />
                      <span className="text-[8px] font-bold uppercase tracking-wider">OK</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisControl;
