
import React, { useState, useRef, useEffect } from 'react';
import { 
  Package, 
  TrendingUp, 
  Calculator as CalcIcon,
  Share2,
  Save,
  ChevronRight,
  PieChart as PieIcon,
  History,
  ArrowRight,
  ChevronDown,
  Plus,
  Minus
} from 'lucide-react';
import { ResultCard } from './ResultCard';
import { CalculationResult } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { saveExtraction, saveCalculatorState, subscribeToCalculatorState } from '../firebase';
import html2canvas from 'html2canvas';
import { Toast, ToastType } from './Toast';

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  focusColor?: string;
  isFullWidth?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  value, 
  onChange, 
  focusColor = "focus:border-[#2563eb]",
  isFullWidth = false,
}) => (
  <div className={isFullWidth ? "w-full" : ""}>
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5">
      {label}
    </label>
    <div className="relative group">
      <input
        type="tel"
        inputMode="decimal"
        value={value}
        onChange={onChange}
        placeholder="0,00"
        className={`w-full bg-white border border-slate-200 text-slate-700 text-base font-black rounded-xl p-3 outline-none transition-all placeholder:text-slate-300 shadow-sm ${focusColor} focus:ring-1 focus:ring-opacity-20`}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <span className="text-[9px] font-black text-slate-400 uppercase">kg</span>
      </div>
    </div>
  </div>
);

interface CalculatorProps {
  onBack: () => void;
}

export const Calculator: React.FC<CalculatorProps> = ({ onBack }) => {
  const [step, setStep] = useState<'form' | 'results'>('form');
  const [flourCommon, setFlourCommon] = useState<string>('');
  const [flourSpecial, setFlourSpecial] = useState<string>('');
  const [flourWhole, setFlourWhole] = useState<string>('');
  const [flourGlue, setFlourGlue] = useState<string>('');
  const [branSample, setBranSample] = useState<string>('');
  
  const [results, setResults] = useState<CalculationResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const isRemoteUpdate = useRef(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false
  });
  
  const resultsRef = useRef<HTMLDivElement>(null);

  // Subscribe to remote changes
  useEffect(() => {
    const unsub = subscribeToCalculatorState((remoteState) => {
      isRemoteUpdate.current = true;
      setFlourCommon(remoteState.flourCommon);
      setFlourSpecial(remoteState.flourSpecial);
      setFlourWhole(remoteState.flourWhole);
      setFlourGlue(remoteState.flourGlue);
      setBranSample(remoteState.branSample);
      setStep(remoteState.step);
      setResults(remoteState.results);
      setTimeout(() => { isRemoteUpdate.current = false; }, 100);
    });
    return () => unsub();
  }, []);

  // Save local changes to remote
  useEffect(() => {
    if (!isRemoteUpdate.current) {
      const timer = setTimeout(() => {
        saveCalculatorState({
          flourCommon,
          flourSpecial,
          flourWhole,
          flourGlue,
          branSample,
          step,
          results
        });
      }, 1000); // Debounce saves
      return () => clearTimeout(timer);
    }
  }, [flourCommon, flourSpecial, flourWhole, flourGlue, branSample, step, results]);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
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

  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const maskedValue = maskBrazilian(e.target.value, 2);
    setter(maskedValue);
  };

  const parseFormattedNumber = (str: string) => {
    if (!str) return 0;
    const cleanStr = str.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanStr);
  };

  const resetForm = () => {
    setFlourCommon('');
    setFlourSpecial('');
    setFlourWhole('');
    setFlourGlue('');
    setBranSample('');
    setResults(null);
    setStep('form');
  };

  const handleCalculate = () => {
    const commonRaw = parseFormattedNumber(flourCommon);
    const specialRaw = parseFormattedNumber(flourSpecial);
    const wholeRaw = parseFormattedNumber(flourWhole);
    const glueRaw = parseFormattedNumber(flourGlue);
    const branRaw = parseFormattedNumber(branSample);

    const totalRawFlour = commonRaw + specialRaw + wholeRaw + glueRaw;

    if (totalRawFlour === 0 && branRaw === 0) {
       showToast("Amostra vazia!", "error");
       return;
    }

    const commonPerHour = commonRaw * 360;
    const specialPerHour = specialRaw * 360;
    const wholePerHour = wholeRaw * 360;
    const gluePerHour = glueRaw * 360;
    
    const flourPerHour = totalRawFlour * 360; 
    const branPerHour = branRaw * 360;
    const totalPerHour = flourPerHour + branPerHour;
    const yieldPercentage = totalPerHour > 0 ? (flourPerHour / totalPerHour) * 100 : 0;

    setResults({
      flourPerHour,
      branPerHour,
      totalPerHour,
      yieldPercentage,
      breakdown: {
        common: commonPerHour,
        special: specialPerHour,
        whole: wholePerHour,
        glue: gluePerHour
      }
    });

    setStep('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!results || !results.breakdown) return;
    setIsSaving(true);
    const success = await saveExtraction({
      flourTotal: results.flourPerHour, 
      bran: results.branPerHour,
      yieldPercentage: results.yieldPercentage,
      breakdown: {
          common: results.breakdown.common,
          special: results.breakdown.special,
          whole: results.breakdown.whole,
          glue: results.breakdown.glue
      }
    });
    setIsSaving(false);
    if (success) { 
      showToast("✅ SALVO NA NUVEM!", "success"); 
      resetForm(); 
    } else {
      showToast("Erro ao salvar.", "error");
    }
  };

  const handleShareAsImage = async () => {
    if (!resultsRef.current || !results) return;

    setIsCapturing(true);
    
    // Pequeno delay para garantir que o renderizador de gráficos esteja pronto
    await new Promise(r => setTimeout(r, 100));

    try {
      const canvas = await html2canvas(resultsRef.current, {
        scale: 2, // Maior qualidade
        backgroundColor: "#f8fafc",
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          // Opcional: esconder botões no clone que será fotografado
          const actions = clonedDoc.getElementById('share-actions-area');
          if (actions) actions.style.display = 'none';
          
          const header = clonedDoc.getElementById('results-header');
          if (header) header.style.marginBottom = '20px';
        }
      });

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error("Falha ao criar imagem");

      const file = new File([blob], `extracao-mocca-${Date.now()}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Extração Mocca',
          text: `Relatório de Extração - ${new Date().toLocaleDateString('pt-BR')}`
        });
      } else {
        // Fallback: Download da imagem caso o share não suporte arquivos
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `mocca-relatorio-${Date.now()}.png`;
        link.click();
        showToast("O compartilhamento de arquivos não é suportado neste navegador. A imagem foi baixada.", "info");
      }
    } catch (err) {
      console.error(err);
      showToast("Erro ao gerar foto do resultado.", "error");
    } finally {
      setIsCapturing(false);
    }
  };

  const formatNumber = (num: number) => num.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

  const COLORS_MAP = { common: '#10B981', special: '#2563EB', whole: '#DC2626', glue: '#1e293b', bran: '#4e342e' };

  const chartData = results ? [
    { name: 'Comum', value: results.breakdown.common, color: COLORS_MAP.common },
    { name: 'Especial', value: results.breakdown.special, color: COLORS_MAP.special },
    { name: 'Inteira', value: results.breakdown.whole, color: COLORS_MAP.whole },
    { name: 'Cola', value: results.breakdown.glue, color: COLORS_MAP.glue },
    { name: 'Farelo', value: results.branPerHour, color: COLORS_MAP.bran },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="w-full px-4 pb-8 animate-fadeIn font-inter">
        
        {/* Header Compacto - Não incluído na foto final se clicarmos voltar */}
        <div id="results-header" className="flex items-center mb-5">
            <button onClick={() => step === 'results' ? setStep('form') : onBack()} className="p-2.5 mr-3 bg-white rounded-xl border border-slate-200 shadow-sm active:scale-95 transition-all text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none uppercase">
                {step === 'form' ? 'Painel Extração' : 'Resultados'}
              </h2>
              <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">
                {step === 'form' ? 'Entrada de Dados' : 'Dados Processados'}
              </p>
            </div>
        </div>

        {step === 'form' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Entrada de Farinhas</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Peso das amostras coletadas</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                    <InputField label="Farinha Comum" value={flourCommon} onChange={(e) => handleNumericInputChange(e, setFlourCommon)} focusColor="focus:border-green-500 focus:ring-green-500" />
                    <InputField label="Farinha Especial" value={flourSpecial} onChange={(e) => handleNumericInputChange(e, setFlourSpecial)} focusColor="focus:border-blue-500 focus:ring-blue-500" />
                    <InputField label="Farinha Inteira" value={flourWhole} onChange={(e) => handleNumericInputChange(e, setFlourWhole)} focusColor="focus:border-red-600 focus:ring-red-600" />
                    <InputField label="Farinha Cola" value={flourGlue} onChange={(e) => handleNumericInputChange(e, setFlourGlue)} focusColor="focus:border-black focus:ring-black" />
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Subprodutos</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Peso do farelo coletado</p>
                  </div>
                </div>
                <InputField label="Farelo / Bran" value={branSample} onChange={(e) => handleNumericInputChange(e, setBranSample)} isFullWidth focusColor="focus:border-[#4e342e] focus:ring-[#4e342e]" />
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-200 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center mb-6">
                  <CalcIcon size={40} />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-2">Pronto para Calcular?</h3>
                <p className="text-blue-100 text-xs font-medium mb-8 uppercase tracking-widest leading-relaxed">
                  Certifique-se de que todos os pesos foram inseridos corretamente para obter o rendimento preciso.
                </p>
                <button 
                  onClick={handleCalculate} 
                  className="w-full bg-white text-blue-600 hover:bg-blue-50 font-black rounded-2xl text-xs px-8 py-5 text-center shadow-lg uppercase tracking-widest active:scale-[0.98] transition-all"
                >
                  Processar Extração
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div ref={resultsRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            <div className="lg:col-span-7 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ResultCard label="Comum" value={formatNumber(results!.breakdown.common)} unit="kg/h" colorTheme="emerald" />
                <ResultCard label="Especial" value={formatNumber(results!.breakdown.special)} unit="kg/h" colorTheme="blue" />
                <ResultCard label="Inteira" value={formatNumber(results!.breakdown.whole)} unit="kg/h" colorTheme="red" />
                <ResultCard label="Cola" value={formatNumber(results!.breakdown.glue)} unit="kg/h" colorTheme="black" />
                <div className="col-span-1 sm:col-span-2">
                  <ResultCard label="Farelo" value={formatNumber(results!.branPerHour)} unit="kg/h" colorTheme="brown" />
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <ResultCard label="Total Farinha" value={formatNumber(results!.flourPerHour)} unit="kg/h" colorTheme="green" />
                      <ResultCard label="Rendimento" value={`${results!.yieldPercentage.toFixed(1)}%`} unit="final" colorTheme="yellow" />
                  </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 flex flex-col items-center h-full">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-8 self-start">Composição da Produção</h3>
                <div className="relative h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value" stroke="none">
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', paddingTop: '20px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-10">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Geral</span>
                    <span className="text-3xl font-black text-slate-800 tracking-tighter leading-none">{formatNumber(results!.totalPerHour)}</span>
                    <span className="text-[10px] font-bold text-slate-400 mt-1">KG/H</span>
                  </div>
                </div>

                <div id="share-actions-area" className="w-full mt-auto pt-8 flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={handleShareAsImage} 
                    disabled={isCapturing}
                    className="flex-1 flex items-center justify-center gap-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-5 rounded-2xl transition-all shadow-sm active:scale-95 uppercase tracking-widest text-[10px] disabled:opacity-50"
                  >
                    {isCapturing ? (
                      <span className="animate-pulse">PROCESSANDO...</span>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Exportar Relatório
                      </>
                    )}
                  </button>
                  <button 
                    onClick={handleSave} 
                    disabled={isSaving || isCapturing} 
                    className="flex-1 flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl transition-all shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-70 uppercase tracking-widest text-[10px]"
                  >
                    {isSaving ? "Salvando..." : "Guardar na Nuvem"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Toast 
          isVisible={toast.visible} 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
        />
    </div>
  );
};
