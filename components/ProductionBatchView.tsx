
import React, { useEffect, useState } from 'react';
import { Package, Plus, X, CheckCircle2, AlertCircle, ArrowRight, TrendingUp, Wheat, History, FileText, ArrowRightLeft, Clock, RefreshCw, Scale, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createBatch, subscribeToBatches, closeBatch, updateBatchProgress, updateBatchTarget } from '../firebase';
import { Batch } from '../types';
import { Toast, ToastType } from './Toast';
import { ConfirmModal } from './ConfirmModal';
import { useData } from '../src/shared/contexts/DataContext';

interface ProductionBatchViewProps {
  onBack: () => void;
}

export const ProductionBatchView: React.FC<ProductionBatchViewProps> = ({ onBack }) => {
  const { additiveApplications } = useData();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBatchTarget, setNewBatchTarget] = useState('428.571');
  const [millingCapacity, setMillingCapacity] = useState('2.500');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [estimatedEndDate, setEstimatedEndDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showReportModal, setShowReportModal] = useState<Batch | null>(null);
  const [batchToClose, setBatchToClose] = useState<string | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustValue, setAdjustValue] = useState('');
  const [adjustType, setAdjustType] = useState<'wheat' | 'flour' | 'subproduct'>('wheat');
  const [adjustMode, setAdjustMode] = useState<'saldo' | 'meta'>('saldo');
  const [adjustValueMeta, setAdjustValueMeta] = useState('');

  const formatNumber = (val: string) => {
    // Remove non-numeric characters (keep minus for adjustments)
    const isNegative = val.startsWith('-');
    const numeric = val.replace(/\D/g, '');
    if (!numeric) return isNegative ? '-' : '';
    // Format with dots for thousands
    const formatted = Number(numeric).toLocaleString('pt-BR');
    return isNegative ? `-${formatted}` : formatted;
  };
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false
  });

  // Generate Automatic Batch Name: L + Month + Letter (if > 1) + Last Digit of Year
  const generateBatchName = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const yearLastDigit = currentYear.toString().slice(-1);

    // Count how many batches already exist in this month and year
    const batchesThisMonth = batches.filter(b => {
      const batchDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
      return (batchDate.getMonth() + 1) === currentMonth && batchDate.getFullYear() === currentYear;
    });

    const count = batchesThisMonth.length;

    if (count === 0) {
      return `L${currentMonth}${yearLastDigit}`;
    } else {
      // 1st extra batch = A (index 0 of letters), 2nd = B, etc.
      // But wait, the first batch of the month has no letter.
      // So if count is 1, it means there is already 1 batch (the one without letter).
      // The next one (the 2nd) should have 'A'.
      const letter = String.fromCharCode(65 + (count - 1)); // 65 is 'A'
      return `L${currentMonth}${letter}${yearLastDigit}`;
    }
  };

  const autoBatchName = generateBatchName();
  
  // Auto-calculate estimated end date
  useEffect(() => {
    const target = Number(newBatchTarget.replace(/\./g, '')) || 0;
    const cap = Number(millingCapacity.replace(/\./g, '')) || 0;
    
    if (target > 0 && cap > 0 && startDate) {
      const totalHoursNeeded = target / cap;
      const start = new Date(startDate + 'T12:00:00'); // Use noon to avoid TZ issues
      const end = new Date(start.getTime() + totalHoursNeeded * 60 * 60 * 1000);
      
      setEstimatedEndDate(end.toISOString().split('T')[0]);
    }
  }, [newBatchTarget, millingCapacity, startDate]);

  useEffect(() => {
    const unsub = subscribeToBatches(setBatches);
    return () => unsub();
  }, []);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
  };

  const handleCreateBatch = async () => {
    setIsProcessing(true);
    const targetWheat = Number(newBatchTarget.replace(/\./g, '').replace(',', '.'));
    const capacity = Number(millingCapacity.replace(/\./g, '').replace(',', '.'));
    
    const success = await createBatch({
      name: autoBatchName,
      targetWheat: targetWheat,
      millingCapacity: capacity,
      startDate: startDate ? new Date(startDate) : new Date(),
      estimatedEndDate: estimatedEndDate ? new Date(estimatedEndDate) : null
    });

    if (success) {
      showToast("Nova pedida iniciada com sucesso!", "success");
      setShowAddModal(false);
    } else {
      showToast("Erro ao criar pedida. Verifique se já existe uma aberta.", "error");
    }
    setIsProcessing(false);
  };

  const handleCloseBatch = async (id: string) => {
    setBatchToClose(id);
    setShowConfirmClose(true);
  };

  const confirmCloseBatch = async () => {
    if (!batchToClose) return;
    
    setIsProcessing(true);
    const success = await closeBatch(batchToClose);
    
    if (success) {
      showToast("Lote fechado com sucesso!", "success");
    } else {
      showToast("Erro ao fechar lote. Tente novamente.", "error");
    }
    
    setIsProcessing(false);
    setBatchToClose(null);
  };

  const handleAdjustProgress = async () => {
    if (!batchToClose || !adjustValue) return;
    
    setIsProcessing(true);
    const value = Number(adjustValue.replace(/\./g, '').replace(',', '.'));
    const updates: any = {};
    if (adjustType === 'wheat') updates.wheatAdd = value;
    if (adjustType === 'flour') updates.flourAdd = value;
    if (adjustType === 'subproduct') updates.subproductAdd = value;
    
    const success = await updateBatchProgress(batchToClose, updates);
    
    if (success) {
      showToast("Saldo ajustado com sucesso!", "success");
      setShowAdjustModal(false);
      setAdjustValue('');
      setBatchToClose(null);
    } else {
      showToast("Erro ao ajustar saldo.", "error");
    }
    setIsProcessing(false);
  };

  const handleAdjustTarget = async () => {
    if (!batchToClose || !adjustValueMeta) return;

    setIsProcessing(true);
    const value = Number(adjustValueMeta.replace(/\./g, ''));
    if (isNaN(value) || value <= 0) {
      showToast("Por favor, digite uma meta válida maior que zero.", "error");
      setIsProcessing(false);
      return;
    }

    const success = await updateBatchTarget(batchToClose, value);

    if (success) {
      showToast("Meta do lote reajustada com sucesso!", "success");
      setShowAdjustModal(false);
      setAdjustValueMeta('');
      setBatchToClose(null);
    } else {
      showToast("Erro ao reajustar meta.", "error");
    }
    setIsProcessing(false);
  };

  const activeBatches = batches.filter(b => b.status === 'OPEN');
  
  // Ensure we have targets even for older batches
  activeBatches.forEach(batch => {
    if (!batch.targetFlour) batch.targetFlour = Math.round(batch.targetWheat * 0.77);
    if (!batch.targetSubproduct) batch.targetSubproduct = Math.round(batch.targetWheat * 0.23);
    if (batch.currentSubproduct === undefined) batch.currentSubproduct = 0;
  });

  const historyBatches = batches.filter(b => b.status === 'CLOSED');

  return (
    <div className="w-full px-4 pb-12 animate-fadeIn font-inter bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between mb-8 pt-4 sticky top-0 bg-slate-50 z-10 pb-2">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2.5 mr-3 bg-white rounded-xl border border-slate-200 shadow-sm active:scale-95 transition-all text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase leading-none">Sistema de Pedido</h2>
            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">Gestão de Lotes e Rastreabilidade</p>
          </div>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 flex items-center gap-2 active:scale-95 transition-all"
        >
          <Plus size={16} /> Nova Pedida
        </button>
      </div>

      {activeBatches.length > 0 ? (
        <div className="mb-12 space-y-8">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Lotes em Operação</h3>
            <div className="h-[1px] flex-grow bg-blue-100"></div>
            <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full">{activeBatches.length}</span>
          </div>

          {activeBatches.map(batch => (
            <div key={batch.id} className="bg-white rounded-none border-2 border-blue-100 shadow-xl overflow-hidden">
              <div className="p-8 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Identificação do Lote</span>
                    <h4 className="text-4xl font-black tracking-tighter mt-1">{batch.name}</h4>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[120px]">
                    <span className="text-[8px] font-black uppercase tracking-widest block opacity-60 mb-1">Status</span>
                    <span className="text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> Em Aberto
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Wheat Progress */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2">
                        <Wheat size={18} className="opacity-60" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Entrada de Trigo</span>
                      </div>
                      <span className="text-xs font-black">
                        {Math.round((batch.currentWheat / batch.targetWheat) * 100)}%
                      </span>
                    </div>
                    <div className="h-4 bg-white/10 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (batch.currentWheat / batch.targetWheat) * 100)}%` }}
                        className="h-full bg-amber-400"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                      <span>{(batch.currentWheat || 0).toLocaleString('pt-BR')} kg</span>
                      <span>Meta: {(batch.targetWheat || 0).toLocaleString('pt-BR')} kg</span>
                    </div>
                  </div>

                  {/* Flour Progress */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2">
                        <Package size={18} className="opacity-60" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Produção de Farinha (77%)</span>
                      </div>
                      <span className="text-xs font-black">
                        {Math.round((batch.currentFlour / batch.targetFlour) * 100)}%
                      </span>
                    </div>
                    <div className="h-4 bg-white/10 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (batch.currentFlour / batch.targetFlour) * 100)}%` }}
                        className="h-full bg-emerald-400"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                      <span>{(batch.currentFlour || 0).toLocaleString('pt-BR')} kg</span>
                      <span>Meta: {(batch.targetFlour || 0).toLocaleString('pt-BR')} kg</span>
                    </div>
                  </div>

                  {/* Subproduct Progress */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2">
                        <ArrowRightLeft size={18} className="opacity-60" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Saída Subproduto (23%)</span>
                      </div>
                      <span className="text-xs font-black">
                        {Math.round((batch.currentSubproduct / batch.targetSubproduct) * 100)}%
                      </span>
                    </div>
                    <div className="h-4 bg-white/10 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (batch.currentSubproduct / batch.targetSubproduct) * 100)}%` }}
                        className="h-full bg-indigo-400"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                      <span>{(batch.currentSubproduct || 0).toLocaleString('pt-BR')} kg</span>
                      <span>Meta: {(batch.targetSubproduct || 0).toLocaleString('pt-BR')} kg</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Iniciado em</span>
                    <span className="text-xs font-bold text-slate-600">
                      {batch.startDate?.toDate 
                        ? new Date(batch.startDate.toDate()).toLocaleDateString('pt-BR') 
                        : batch.createdAt?.toDate 
                          ? new Date(batch.createdAt.toDate()).toLocaleDateString('pt-BR') 
                          : 'Hoje'}
                    </span>
                  </div>

                  {batch.estimatedEndDate?.toDate && (
                    <div className="flex flex-col border-l border-slate-200 pl-6">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Término Previsto</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-600">
                          {new Date(batch.estimatedEndDate.toDate()).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      setBatchToClose(batch.id);
                      setAdjustValueMeta((batch.targetWheat || 0).toLocaleString('pt-BR'));
                      setAdjustMode('saldo');
                      setAdjustValue('');
                      setShowAdjustModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-none text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
                  >
                    <Scale size={14} /> Ajustar Saldo / Meta
                  </button>
                </div>
                <button 
                  onClick={() => handleCloseBatch(batch.id)}
                  className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-none font-black text-[10px] uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all active:scale-95"
                >
                  Fechar Lote / Finalizar Pedida
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-12 bg-white p-12 rounded-[3rem] border-2 border-dashed border-slate-200 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mb-4">
            <TrendingUp size={40} />
          </div>
          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nenhuma Pedida Ativa</h4>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 max-w-xs">
            Inicie um novo lote de produção para começar a rastrear a entrada de trigo e produção de farinha.
          </p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="mt-8 bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-100 active:scale-95 transition-all"
          >
            Iniciar Lote 001
          </button>
        </div>
      )}

      {/* History Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Histórico de Lotes</h3>
          <div className="h-[1px] flex-grow bg-slate-200"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {historyBatches.length === 0 ? (
            <div className="col-span-full py-12 text-center opacity-20">
              <History size={40} className="mx-auto mb-2" />
              <p className="font-black text-[10px] uppercase tracking-widest">Nenhum lote finalizado</p>
            </div>
          ) : historyBatches.map(batch => (
            <div 
              key={batch.id} 
              onClick={() => setShowReportModal(batch)}
              className="bg-white p-6 rounded-none border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h5 className="text-lg font-black text-slate-800 uppercase leading-none mb-1">{batch.name}</h5>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {batch.currentWheat.toLocaleString('pt-BR')}kg Trigo • {batch.currentFlour.toLocaleString('pt-BR')}kg Farinha
                    </p>
                    {batch.estimatedEndDate?.toDate && batch.closedAt?.toDate && (() => {
                      const closed = new Date(batch.closedAt.toDate());
                      closed.setHours(0, 0, 0, 0);
                      const estimated = new Date(batch.estimatedEndDate.toDate());
                      estimated.setHours(0, 0, 0, 0);
                      if (closed > estimated) {
                        const diffTime = Math.abs(closed.getTime() - estimated.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return (
                          <span className="text-[7px] font-black bg-red-50 text-red-500 px-1.5 py-0.5 rounded uppercase">
                            +{diffDays}d atraso
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[8px] font-black text-slate-300 uppercase block mb-1">Finalizado em</span>
                <span className="text-[10px] font-black text-slate-500 uppercase">
                  {batch.closedAt?.toDate ? new Date(batch.closedAt.toDate()).toLocaleDateString('pt-BR') : '--/--'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Nova Pedida */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] overflow-y-auto p-4 flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-none w-full max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden relative z-10 my-auto border border-slate-100"
            >
              <div className="bg-blue-600 p-10 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <h3 className="text-3xl font-black uppercase tracking-tighter relative z-10">Nova Pedida de Trigo</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mt-2 relative z-10">Configuração de Lote Industrial</p>
                <button onClick={() => setShowAddModal(false)} className="absolute right-6 top-8 opacity-60 hover:opacity-100 transition-opacity z-20">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-10 space-y-8">
                 <div className="bg-slate-50 p-6 rounded-none border border-slate-100 text-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 block">Identificação Automática</label>
                    <div className="text-5xl font-black text-slate-800 tracking-tighter">{autoBatchName}</div>
                    <div className="mt-2 text-[9px] font-bold text-blue-600 uppercase tracking-widest">Código Único do Período</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Quantidade de Trigo (KG)</label>
                    <div className="relative group">
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={newBatchTarget} 
                        onChange={e => {
                          setNewBatchTarget(formatNumber(e.target.value));
                        }} 
                        className="w-full bg-slate-50 p-6 rounded-none border-2 border-slate-100 text-4xl font-black text-center text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner pr-16" 
                        placeholder="0"
                      />
                      <div className="absolute right-8 top-1/2 -translate-y-1/2 text-blue-600 font-black text-xs uppercase tracking-widest pointer-events-none">KG</div>
                    </div>
                    
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="bg-emerald-50 p-4 rounded-none border border-emerald-100">
                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Farinha (77%)</span>
                        <span className="text-sm font-black text-emerald-700">{Math.round(Number(newBatchTarget.replace(/\./g, '')) * 0.77).toLocaleString('pt-BR')} kg</span>
                      </div>
                      <div className="bg-indigo-50 p-4 rounded-none border border-indigo-100">
                        <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest block mb-1">Subproduto (23%)</span>
                        <span className="text-sm font-black text-indigo-700">{Math.round(Number(newBatchTarget.replace(/\./g, '')) * 0.23).toLocaleString('pt-BR')} kg</span>
                      </div>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Data de Início</label>
                        <input 
                          type="date" 
                          value={startDate}
                          onChange={e => setStartDate(e.target.value)}
                          className="w-full bg-slate-50 p-4 rounded-none border-2 border-slate-100 text-sm font-black text-slate-800 outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Término Previsto</label>
                        <input 
                          type="date" 
                          value={estimatedEndDate}
                          onChange={e => setEstimatedEndDate(e.target.value)}
                          className="w-full bg-slate-50 p-4 rounded-none border-2 border-slate-100 text-sm font-black text-slate-800 outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="mt-8">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Capacidade de Moagem (KG/H)</label>
                      <div className="relative group">
                        <input 
                          type="text" 
                          inputMode="numeric"
                          value={millingCapacity} 
                          onChange={e => {
                            setMillingCapacity(formatNumber(e.target.value));
                          }} 
                          className="w-full bg-slate-50 p-4 rounded-none border-2 border-slate-100 text-2xl font-black text-center text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner pr-20" 
                          placeholder="0"
                        />
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 text-blue-600 font-black text-xs uppercase tracking-widest pointer-events-none">KG/H</div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Simulações de Tempo</label>
                      
                      {[24, 21, 12].map((hoursPerDay) => {
                        const cap = Number(millingCapacity.replace(/\./g, '')) || 2500;
                        const target = Number(newBatchTarget.replace(/\./g, '')) || 0;
                        const totalHoursNeeded = target / cap;
                        const totalDays = totalHoursNeeded / hoursPerDay;
                        
                        const d = Math.floor(totalDays);
                        const h = Math.round((totalDays - d) * hoursPerDay);
                        
                        return (
                          <div key={hoursPerDay} className={`p-4 rounded-2xl border flex items-center justify-between ${hoursPerDay === 24 ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex items-center gap-3">
                              <Clock size={16} className={hoursPerDay === 24 ? 'text-amber-500' : 'text-slate-400'} />
                              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">Trabalhando {hoursPerDay}h/dia</span>
                            </div>
                            <span className={`text-sm font-black ${hoursPerDay === 24 ? 'text-amber-700' : 'text-slate-700'}`}>
                              {d > 0 ? `${d}D E ${h}H` : `${h} HORAS`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                 </div>
                 
                 <div className="flex flex-col gap-3 pt-4">
                    <button 
                      onClick={handleCreateBatch} 
                      disabled={isProcessing}
                      className="w-full bg-blue-600 text-white py-6 rounded-none font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-blue-200 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                    >
                      {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
                      Iniciar Lote Industrial
                    </button>
                    <button onClick={() => setShowAddModal(false)} className="w-full py-4 font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-600 transition-colors">Cancelar Operação</button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-[110] overflow-y-auto p-4 flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReportModal(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md print:hidden"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-xl w-full max-w-[450px] shadow-2xl overflow-hidden relative z-10 p-6 font-sans my-auto printable-card"
            >
              <div className="border-4 border-slate-800 p-6 relative">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-col items-center w-[100px]">
                    <div className="flex flex-col items-center border-2 border-slate-800 p-1 px-3">
                      <span className="text-3xl font-black text-slate-800 leading-none">M</span>
                      <span className="text-[8px] font-black text-slate-800 uppercase tracking-widest">MOCCA</span>
                    </div>
                    <span className="text-[7px] font-bold text-slate-800 uppercase mt-1 text-center leading-tight">Moinho Comercial<br/>de Céu Azul</span>
                  </div>
                  <div className="flex-grow text-center px-2">
                    <h2 className="text-xl font-black text-blue-900 uppercase tracking-tighter border-b-2 border-slate-800 pb-1 mb-2">Laudo de Produção</h2>
                    <div className="flex justify-center gap-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lote: <span className="text-slate-800">{showReportModal.name}</span></span>
                    </div>
                  </div>
                  <button onClick={() => setShowReportModal(null)} className="p-1 hover:bg-slate-100 rounded-full transition-colors print:hidden">
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-b border-slate-800 pb-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Início do Lote</span>
                      <span className="text-xs font-black text-slate-800">
                        {showReportModal.startDate?.toDate 
                          ? new Date(showReportModal.startDate.toDate()).toLocaleDateString('pt-BR') 
                          : showReportModal.createdAt?.toDate 
                            ? new Date(showReportModal.createdAt.toDate()).toLocaleDateString('pt-BR') 
                            : '---'}
                      </span>
                    </div>
                    <div className="border-b border-slate-800 pb-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Término Previsto</span>
                      <span className="text-xs font-black text-slate-800">
                        {showReportModal.estimatedEndDate?.toDate ? new Date(showReportModal.estimatedEndDate.toDate()).toLocaleDateString('pt-BR') : '---'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="border-b border-slate-800 pb-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Final Real</span>
                      <span className="text-[10px] font-black text-slate-800 truncate">
                        {showReportModal.closedAt?.toDate ? new Date(showReportModal.closedAt.toDate()).toLocaleDateString('pt-BR') : '---'}
                      </span>
                    </div>
                    <div className="border-b border-slate-800 pb-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Duração</span>
                      <span className="text-[10px] font-black text-slate-800">
                        {showReportModal.durationDays || 0} Dias
                      </span>
                    </div>
                    <div className="border-b border-slate-800 pb-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Bags</span>
                      <span className="text-[10px] font-black text-slate-800">
                        {showReportModal.totalBags || 0} UN
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-b border-slate-800 pb-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Trigo Recebido (Líquido)</span>
                      <span className="text-xs font-black text-slate-800">
                        {showReportModal.currentWheat.toLocaleString('pt-BR')} KG
                      </span>
                    </div>
                    <div className="border-b border-slate-800 pb-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Farinha Produzida</span>
                      <span className="text-xs font-black text-slate-800">
                        {showReportModal.currentFlour.toLocaleString('pt-BR')} KG
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-b border-slate-800 pb-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Saída Subproduto</span>
                      <span className="text-xs font-black text-slate-800">
                        {showReportModal.currentSubproduct?.toLocaleString('pt-BR') || 0} KG
                      </span>
                    </div>
                    <div className="border-b border-slate-800 pb-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Rendimento Industrial</span>
                      <span className="text-xs font-black text-slate-800">
                        {showReportModal.currentWheat > 0 ? (((showReportModal.currentFlour + (showReportModal.currentSubproduct || 0)) / showReportModal.currentWheat) * 100).toFixed(2) : '0.00'}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-b border-slate-800 pb-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Entradas de Trigo</span>
                      <span className="text-xs font-black text-slate-800">
                        {showReportModal.wheatEntryCount || 0} Tickets
                      </span>
                    </div>
                    <div className="border-b border-slate-800 pb-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Saídas de Cargas</span>
                      <span className="text-xs font-black text-slate-800">
                        {showReportModal.flourLoadCount || 0} Cargas
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Rendimento Final de Farinha</span>
                    <span className="text-2xl font-black text-blue-600">
                      {showReportModal.currentWheat > 0 ? ((showReportModal.currentFlour / showReportModal.currentWheat) * 100).toFixed(2) : '0.00'}%
                    </span>
                  </div>

                  {showReportModal && additiveApplications.filter(app => app.flourBatchId === showReportModal.id).length > 0 && (
                    <div className="border border-slate-800 p-4 rounded-xl mt-4 text-left">
                      <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest block mb-2 border-b border-slate-800 pb-1">
                        Aditivos Aplicados (Rastreabilidade Operacional)
                      </span>
                      <div className="space-y-1.5">
                        {additiveApplications.filter(app => app.flourBatchId === showReportModal.id).map((app, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                            <span>{app.additiveName} <span className="text-slate-400 font-medium uppercase text-[8px]">(Lote Mocca: {app.lotInternalCode})</span></span>
                            <span className="font-black text-slate-950">{app.qtyApplied.toLocaleString('pt-BR')} {app.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-8 flex flex-col items-center gap-1">
                    <div className="w-48 h-[1px] bg-slate-800"></div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Assinatura Responsável</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-center print:hidden">
                <button 
                  onClick={() => window.print()}
                  className="bg-slate-800 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center gap-2"
                >
                  <FileText size={16} /> Imprimir Laudo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Ajustar Saldo / Meta */}
      <AnimatePresence>
        {showAdjustModal && (
          <div className="fixed inset-0 z-[100] overflow-y-auto p-4 flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdjustModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-none w-full max-w-md shadow-2xl overflow-hidden relative z-10 my-auto"
            >
              <div className="bg-slate-800 p-8 text-white text-center">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Ajustar Lote</h3>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-2">Saldo e Metas Operacionais</p>
              </div>

              {/* Modo Selector Tab */}
              <div className="flex border-b border-slate-100">
                <button
                  onClick={() => setAdjustMode('saldo')}
                  className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
                    adjustMode === 'saldo' ? 'border-amber-500 text-slate-800 bg-slate-50' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Ajustar Saldo
                </button>
                <button
                  onClick={() => setAdjustMode('meta')}
                  className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
                    adjustMode === 'meta' ? 'border-amber-500 text-slate-800 bg-slate-50' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Reajustar Meta
                </button>
              </div>
              
              <div className="p-10 space-y-6">
                {adjustMode === 'saldo' ? (
                  <>
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                      {(['wheat', 'flour', 'subproduct'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setAdjustType(type)}
                          className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                            adjustType === type ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {type === 'wheat' ? 'Trigo' : type === 'flour' ? 'Farinha' : 'Subproduto'}
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Valor para Adicionar/Subtrair (KG)</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          inputMode="numeric"
                          value={adjustValue} 
                          onChange={e => {
                            setAdjustValue(formatNumber(e.target.value));
                          }} 
                          placeholder="0"
                          className="w-full bg-slate-50 p-6 rounded-none border-2 border-slate-100 text-3xl font-black text-center text-slate-800 outline-none focus:border-slate-500 transition-all" 
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-sm uppercase">KG</div>
                      </div>
                      <p className="mt-4 text-[9px] text-slate-400 font-bold uppercase leading-relaxed text-center">
                        Use valores negativos para subtrair e positivos para adicionar ao saldo atual do lote.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                      <button 
                        onClick={handleAdjustProgress}
                        disabled={isProcessing || !adjustValue}
                        className="w-full bg-slate-800 text-white py-6 rounded-none font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95 disabled:opacity-50 transition-all"
                      >
                        Confirmar Ajuste
                      </button>
                      <button onClick={() => setShowAdjustModal(false)} className="w-full py-4 font-black uppercase tracking-widest text-[10px] text-slate-400">Cancelar</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 leading-relaxed bg-amber-50 p-3 text-amber-700">
                        Altere a meta geral de trigo do lote. O sistema recalculará de forma automática as correspondentes metas de Farinha (77%) e Subproduto (23%).
                      </p>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block font-mono">Nova Meta de Entrada (Trigo KG)</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          inputMode="numeric"
                          value={adjustValueMeta} 
                          onChange={e => {
                            setAdjustValueMeta(formatNumber(e.target.value));
                          }} 
                          placeholder="0"
                          className="w-full bg-slate-50 p-6 rounded-none border-2 border-slate-100 text-3xl font-black text-center text-slate-800 outline-none focus:border-slate-500 transition-all" 
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-sm uppercase">KG</div>
                      </div>
                      {batches.find(b => b.id === batchToClose) && (
                        <div className="mt-4 flex flex-col gap-1 text-[9px] text-slate-400 font-bold uppercase">
                          <span>Meta Atual do Lote: {batches.find(b => b.id === batchToClose)?.targetWheat.toLocaleString('pt-BR')} kg</span>
                          <span>Novas Estimativas: Farinha ~{Math.round((Number(adjustValueMeta.replace(/\./g, '')) || 0) * 0.77).toLocaleString('pt-BR')} kg, Subprodutos ~{Math.round((Number(adjustValueMeta.replace(/\./g, '')) || 0) * 0.23).toLocaleString('pt-BR')} kg</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                      <button 
                        onClick={handleAdjustTarget}
                        disabled={isProcessing || !adjustValueMeta}
                        className="w-full bg-slate-800 text-white py-6 rounded-none font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95 disabled:opacity-50 transition-all"
                      >
                        Salvar Nova Meta
                      </button>
                      <button onClick={() => setShowAdjustModal(false)} className="w-full py-4 font-black uppercase tracking-widest text-[10px] text-slate-400">Cancelar</button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        onConfirm={confirmCloseBatch}
        title="Fechar Lote"
        message="Deseja realmente fechar este lote? Esta ação não pode ser desfeita e o lote será movido para o histórico."
        confirmText="Sim, Fechar Lote"
        cancelText="Não, Manter Aberto"
        variant="danger"
      />

      <Toast 
        isVisible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
      />
    </div>
  );
};
