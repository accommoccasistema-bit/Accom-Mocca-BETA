
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Settings, X, Check, AlertCircle } from 'lucide-react';
import { saveMillingBox } from '../firebase';
import { MillingBoxData, MillingBoxDetails } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface Props {
  boxId: number;
  initialData?: MillingBoxData;
}

// Taxa solicitada: 18.000 kg / 7 horas = 2571.428 kg por hora
const HOURLY_RATE = 2571.428; 

export const MillingBox: React.FC<Props> = ({ boxId, initialData }) => {
  const [isRunning, setIsRunning] = useState(initialData?.isRunning || false);
  const [isPaused, setIsPaused] = useState(initialData?.isPaused || false);
  const [isFinished, setIsFinished] = useState(initialData?.isFinished || false);
  const [elapsedTime, setElapsedTime] = useState(initialData?.elapsedTime || 0);
  const [showSettings, setShowSettings] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  
  const [details, setDetails] = useState<MillingBoxDetails>(initialData?.details || {
    date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }),
    startHour: '--:--',
    flowRate: 6500,
    wheatType: "NINFA",
    scale: 2100,
    water: 420,
    molhagemStart: "17:47h seg",
    totalKg: 18000,
    operator: "MARCELO"
  });

  const timerRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  // Cálculos em tempo real
  const totalSecondsEstimated = (details.totalKg / HOURLY_RATE) * 3600;
  
  // O TRIGO MOÍDO DIMINUI CONFORME O TEMPO PASSA
  // Se passou 1 hora (3600000 ms), diminui 2571.43 Kg
  const producedKg = (elapsedTime / 3600000) * HOURLY_RATE;
  const remainingKg = Math.max(0, details.totalKg - producedKg);
  
  const estimatedHours = Math.floor(totalSecondsEstimated / 3600);
  const estimatedMinutes = Math.floor((totalSecondsEstimated % 3600) / 60);

  // Formatação do Cronômetro: 00:00:00:000
  const formatChronometer = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor(ms % 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(3, '0')}`;
  };

  const getDayAbbr = (date: Date) => {
    const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    return days[date.getDay()];
  };

  const calculateEndTime = () => {
    if (details.startHour === '--:--' || !isRunning) return '--:--';
    const hourPart = details.startHour.split('h')[0];
    const [h, m] = hourPart.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(h, m, 0, 0);
    const endDate = new Date(startDate.getTime() + (totalSecondsEstimated * 1000));
    return endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const startMoagem = async () => {
    const now = new Date();
    const startTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}h ${getDayAbbr(now)}`;
    
    const newDetails = { ...details, startHour: startTimeStr };
    setDetails(newDetails);
    setIsRunning(true);
    setIsPaused(false);
    setIsFinished(false);
    lastTickRef.current = Date.now();

    await saveMillingBox(boxId, {
      id: boxId,
      isRunning: true,
      isPaused: false,
      isFinished: false,
      startTime: Date.now(),
      elapsedTime: 0,
      details: newDetails
    });
  };

  const togglePause = async () => {
    if (!isRunning && !isFinished && elapsedTime === 0) return; // Não pausar se não iniciou
    const newPaused = !isPaused;
    setIsPaused(newPaused);
    if (!newPaused) lastTickRef.current = Date.now();
    
    await saveMillingBox(boxId, {
      id: boxId,
      isRunning,
      isPaused: newPaused,
      isFinished,
      startTime: Date.now(),
      elapsedTime,
      details
    });
  };

  const finishMoagem = async () => {
    setIsRunning(false);
    setIsPaused(false);
    setIsFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);
    
    await saveMillingBox(boxId, {
      id: boxId,
      isRunning: false,
      isPaused: false,
      isFinished: true,
      startTime: null,
      elapsedTime,
      details
    });
  };

  const resetBox = async () => {
    setIsRunning(false);
    setIsPaused(false);
    setIsFinished(false);
    setElapsedTime(0);
    const resetDetails = { ...details, startHour: '--:--' };
    setDetails(resetDetails);
    await saveMillingBox(boxId, {
        id: boxId,
        isRunning: false,
        isPaused: false,
        isFinished: false,
        startTime: null,
        elapsedTime: 0,
        details: resetDetails
    });
  };

  useEffect(() => {
    if (isRunning && !isPaused && !isFinished) {
      // Intervalo menor para fluidez do cronômetro (milissegundos)
      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        const delta = now - lastTickRef.current;
        setElapsedTime(prev => prev + delta);
        lastTickRef.current = now;
      }, 50);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, isPaused, isFinished]);

  return (
    <div className="w-full bg-white rounded-[1.5rem] shadow-2xl border border-slate-300 overflow-hidden flex flex-col mb-10 animate-fadeIn relative">
      
      {/* Engrenagem de Configuração */}
      <button 
        onClick={() => setShowSettings(true)}
        className="absolute top-4 left-4 z-20 p-2 text-slate-400 hover:text-[#2563eb] transition-colors active:scale-90"
      >
        <Settings className="w-8 h-8" />
      </button>

      {/* Título */}
      <div className="py-4 text-center">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
          CAIXA DE TRIGO <span className="text-red-600">{boxId.toString().padStart(2, '0')}</span>
        </h2>
      </div>

      {/* Barra Verde com Cronômetro Digital */}
      <div className="flex h-16 w-full relative">
         <button 
            onClick={isRunning || isFinished ? undefined : startMoagem}
            className={`flex-grow flex items-center justify-center text-white transition-all ${isFinished ? 'bg-slate-700' : 'bg-emerald-500 active:brightness-95'}`}
         >
            {!isRunning && !isFinished && elapsedTime === 0 ? (
               <span className="text-2xl font-black uppercase tracking-tight">INICIAR MOAGEM</span>
            ) : (
               <span className="text-3xl font-black tabular-nums tracking-tight">
                  {formatChronometer(elapsedTime)}
               </span>
            )}
         </button>
         
         <button 
            onClick={togglePause}
            className="w-24 bg-red-600 flex flex-col items-center justify-center text-white border-l-4 border-white active:brightness-90 transition-all"
         >
            {isPaused ? <Play className="w-6 h-6 fill-white" /> : <Pause className="w-6 h-6 fill-white" />}
            <span className="text-[10px] font-black uppercase">{isPaused ? 'VOLTAR' : 'PAUSAR'}</span>
         </button>
      </div>

      {/* Grid de Informações */}
      <div className="px-6 py-4 bg-white space-y-2">
        <div className="flex justify-between items-end border-b border-slate-200 pb-1">
          <span className="text-[11px] font-black text-slate-800 uppercase">DATA DA MOLHAGEM:</span>
          <span className="text-xl font-black text-[#2563eb]">{details.date}</span>
        </div>

        <div className="flex justify-between items-start border-b border-slate-200 pb-1">
          <span className="text-[11px] font-black text-slate-800 uppercase leading-tight w-24 text-left">HORA INICIO DA MOAGEM:</span>
          <span className={`text-xl font-black ${details.startHour === '--:--' ? 'text-emerald-500' : 'text-emerald-600'}`}>
            {details.startHour}
          </span>
        </div>

        <div className="flex justify-between items-end border-b border-slate-200 pb-1">
          <span className="text-[11px] font-black text-slate-800 uppercase">VAZÃO Kg/h :</span>
          <span className="text-xl font-black text-[#2563eb]">{details.flowRate.toLocaleString('pt-BR')}+</span>
        </div>

        <div className="flex justify-between items-end border-b border-slate-200 pb-1">
          <span className="text-[11px] font-black text-slate-800 uppercase">TIPO DE TRIGO:</span>
          <span className="text-xl font-black text-[#2563eb]">{details.wheatType}</span>
        </div>

        <div className="flex justify-between items-end border-b border-slate-200 pb-1">
          <span className="text-[11px] font-black text-slate-800 uppercase">AGUA Lt/h :</span>
          <span className="text-xl font-black text-[#2563eb]">{details.water} Lt/h</span>
        </div>

        <div className="flex justify-between items-end border-b border-slate-200 pb-1">
          <span className="text-[11px] font-black text-slate-800 uppercase">INICIO DA MOLHAGEM:</span>
          <span className="text-xl font-black text-[#2563eb]">{details.molhagemStart}</span>
        </div>

        <div className="flex justify-between items-end border-b border-slate-200 pb-1">
          <span className="text-[11px] font-black text-slate-800 uppercase">QUANTIDADE DE TRIGO MOLHADO:</span>
          <span className="text-xl font-black text-[#2563eb]">{details.totalKg.toLocaleString('pt-BR')} Kg</span>
        </div>

        {/* VALOR EM VERMELHO - DIMINUI EM TEMPO REAL */}
        <div className="flex justify-between items-end border-b-2 border-slate-300 pb-1">
          <span className="text-[11px] font-black text-slate-800 uppercase">QUANTIDADE DE TRIGO MOÍDO:</span>
          <span className="text-2xl font-black text-red-600 tabular-nums">
            {Math.round(remainingKg).toLocaleString('pt-BR')} Kg
          </span>
        </div>

        <div className="flex justify-between items-end pt-1">
          <span className="text-[11px] font-black text-slate-800 uppercase">QUEM MOLHOU:</span>
          <span className="text-xl font-black text-[#2563eb]">{details.operator}</span>
        </div>
      </div>

      {/* Faixa de Previsão Azul */}
      <div className="bg-[#2563eb] py-3 px-6 flex justify-between items-center text-white">
          <span className="text-xl font-black uppercase tracking-tight">PREVISÃO {estimatedHours} HORAS</span>
          <span className="text-2xl font-black tabular-nums">{calculateEndTime()}</span>
      </div>

      {/* Botão Finalizador */}
      <div className="flex">
        <button 
            onClick={() => setShowConfirmFinish(true)}
            disabled={isFinished || (!isRunning && elapsedTime === 0)}
            className={`flex-grow py-5 text-center font-black text-4xl uppercase tracking-tighter transition-all ${isFinished ? 'bg-slate-700 text-slate-400' : 'bg-slate-900 text-white active:bg-black disabled:bg-slate-100 disabled:text-slate-200'}`}
        >
            {isFinished ? 'TERMINOU' : 'TERMINAR'}
        </button>
        {isFinished && (
            <button onClick={() => setShowConfirmReset(true)} className="bg-red-700 text-white px-4 font-black text-xs uppercase border-l border-white/20">Reiniciar</button>
        )}
      </div>

      {/* Modais de Confirmação */}
      <ConfirmModal 
        isOpen={showConfirmFinish}
        onClose={() => setShowConfirmFinish(false)}
        onConfirm={finishMoagem}
        title="Finalizar Moagem"
        message={`Deseja realmente finalizar a moagem da CAIXA ${boxId}?`}
        confirmText="Finalizar"
        variant="danger"
      />

      <ConfirmModal 
        isOpen={showConfirmReset}
        onClose={() => setShowConfirmReset(false)}
        onConfirm={resetBox}
        title="Reiniciar Caixa"
        message={`Deseja resetar a CAIXA ${boxId} para uma nova moagem?`}
        confirmText="Reiniciar"
        variant="primary"
      />

      {/* Modal de Configurações */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] overflow-y-auto p-4 flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100 relative z-10 my-auto"
            >
              <div className="bg-[#2563eb] px-8 py-6 text-white flex justify-between items-center relative">
                <h3 className="text-xl font-black uppercase tracking-widest text-center w-full">CONFIGURAR CAIXA {boxId}</h3>
                <button onClick={() => setShowSettings(false)} className="absolute right-6 top-1/2 -translate-y-1/2">
                  <X className="w-8 h-8" />
                </button>
              </div>

              <div className="px-8 py-6 space-y-5 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">TRIGO MOLHADO (KG)</label>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    value={details.totalKg} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.,]/g, '');
                      const normalized = val.replace(',', '.');
                      setDetails({...details, totalKg: Number(normalized) || 0});
                    }}
                    className="w-full bg-[#f1f5f9] p-4 rounded-2xl font-black text-[#2563eb] text-xl outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">VAZÃO (KG/H)</label>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      value={details.flowRate} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.,]/g, '');
                        const normalized = val.replace(',', '.');
                        setDetails({...details, flowRate: Number(normalized) || 0});
                      }} 
                      className="w-full bg-[#f1f5f9] p-4 rounded-2xl font-black text-[#2563eb] text-xl outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">ÁGUA (LT/H)</label>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      value={details.water} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.,]/g, '');
                        const normalized = val.replace(',', '.');
                        setDetails({...details, water: Number(normalized) || 0});
                      }} 
                      className="w-full bg-[#f1f5f9] p-4 rounded-2xl font-black text-[#2563eb] text-xl outline-none" 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">TIPO DE TRIGO</label>
                  <input type="text" value={details.wheatType} onChange={(e) => setDetails({...details, wheatType: e.target.value})} className="w-full bg-[#f1f5f9] p-4 rounded-2xl font-black text-[#2563eb] text-xl outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">DATA MOLHAGEM</label>
                      <input type="text" value={details.date} onChange={(e) => setDetails({...details, date: e.target.value})} className="w-full bg-[#f1f5f9] p-4 rounded-2xl font-black text-[#2563eb] text-xl outline-none" placeholder="DD/MM/AA" />
                   </div>
                </div>
              </div>

              <div className="px-8 pb-8 pt-2">
                <button 
                  onClick={async () => {
                    setShowSettings(false);
                    await saveMillingBox(boxId, { id: boxId, isRunning, isPaused, isFinished, startTime: Date.now(), elapsedTime, details });
                  }}
                  className="w-full bg-[#009664] text-white font-black text-2xl py-6 rounded-[1.5rem] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all uppercase"
                >
                  <Check className="w-8 h-8" /> SALVAR ALTERAÇÕES
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
