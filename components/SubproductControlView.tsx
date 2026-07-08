
import React, { useState } from 'react';
import { useData } from '../src/shared/contexts/DataContext';
import { createSubproductLoad, finalizeSubproductLoad, getActiveBatch, reopenSubproductLoad, deleteSubproductLoad, updateSubproductLoad } from '../firebase';
import { SubproductLoad, SubproductType } from '../types';
import { 
  Plus, 
  X, 
  ArrowRight, 
  Check, 
  CheckCircle2, 
  RefreshCw,
  Package, 
  Minus, 
  ArrowRightLeft,
  Clock,
  AlertCircle,
  Trash2,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmModal } from './ConfirmModal';
import { Toast, ToastType } from './Toast';

interface SubproductControlViewProps {
  onBack: () => void;
}

const TYPE_MAP: Record<SubproductType, { name: string; color: string; bg: string; border: string; accent: string; logo: string }> = {
  FARELO: { 
    name: 'Farelo de Trigo', 
    color: 'text-stone-800', 
    bg: 'bg-stone-50', 
    border: 'border-stone-200', 
    accent: 'bg-[#4e342e]',
    logo: 'https://i.ibb.co/chcGNGq8/image.png'
  },
  RESIDUO: { 
    name: 'Resíduo', 
    color: 'text-fuchsia-800', 
    bg: 'bg-fuchsia-50', 
    border: 'border-fuchsia-200', 
    accent: 'bg-[#b33a8a]',
    logo: 'https://i.ibb.co/b51GQKNP/image.png'
  },
  OUTRO: { 
    name: 'Outro', 
    color: 'text-slate-700', 
    bg: 'bg-slate-50', 
    border: 'border-slate-200', 
    accent: 'bg-slate-600',
    logo: 'https://i.ibb.co/DgbmXFt0/image.png'
  }
};

export const SubproductControlView: React.FC<SubproductControlViewProps> = ({ onBack }) => {
  const { subproductLoads, stock, batches: allBatches, loadingBatches, drivers, entities } = useData();
  const activeBatches = allBatches.filter(b => b.status === 'OPEN');
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmFinalize, setConfirmFinalize] = useState<SubproductLoad | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SubproductLoad | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingLoad, setEditingLoad] = useState<SubproductLoad | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false
  });

  // Form State
  const [newType, setNewType] = useState<SubproductType>('FARELO');
  const [newQty, setNewQty] = useState('');
  const [otherName, setOtherName] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [clientName, setClientName] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState('');

  const formatNumber = (val: string) => {
    // Remove non-numeric characters
    const numeric = val.replace(/\D/g, '');
    if (!numeric) return '';
    // Format with dots for thousands
    return Number(numeric).toLocaleString('pt-BR');
  };

  React.useEffect(() => {
    if (activeBatches.length === 1 && !selectedBatchId) {
      setSelectedBatchId(activeBatches[0].id);
    }
  }, [activeBatches, selectedBatchId]);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
  };

  const handleCreate = async () => {
    const normalizedQty = newQty.replace(/\./g, '').replace(',', '.');
    if (!normalizedQty || Number(normalizedQty) <= 0) {
      showToast("Insira uma quantidade válida", "error");
      return;
    }

    setIsProcessing(true);
    
    if (!selectedBatchId) {
      showToast("Selecione um lote para registrar a movimentação.", "error");
      setIsProcessing(false);
      return;
    }

    const selectedBatch = activeBatches.find(b => b.id === selectedBatchId);
    const selectedEntity = entities.find(e => e.id === selectedEntityId);

    if (!normalizedQty || Number(normalizedQty) <= 0) {
      showToast("Por favor, insira uma quantidade válida.", "error");
      setIsProcessing(false);
      return;
    }

    if (newType === 'OUTRO' && !otherName.trim()) {
      showToast("Por favor, informe o nome do subproduto.", "error");
      setIsProcessing(false);
      return;
    }

    const loadData: any = {
      type: newType,
      quantity: Number(normalizedQty),
      driverName: driverName.trim() || '',
      vehiclePlate: vehiclePlate.trim() || '',
      client: selectedEntity ? selectedEntity.name : clientName.trim() || '',
      entityId: selectedEntityId || undefined,
      totalTrips: selectedEntity ? 2 : undefined,
      totalDistanceKm: selectedEntity ? selectedEntity.distanceKm * 2 : undefined
    };

    if (newType === 'OUTRO') {
      loadData.otherName = otherName;
    }

    const success = await createSubproductLoad(loadData, selectedBatch);

    if (success) {
      showToast("Registro de saída iniciado!", "success");
      handleCloseModal();
    } else {
      showToast("Erro ao criar registro. Verifique se há um lote ativo.", "error");
    }
    setIsProcessing(false);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingLoad(null);
    setNewQty('');
    setOtherName('');
    setDriverName('');
    setVehiclePlate('');
    setClientName('');
    setSelectedEntityId('');
    setSelectedBatchId(activeBatches.length === 1 ? activeBatches[0].id : '');
  };

  const handleStartEdit = (load: SubproductLoad) => {
    setEditingLoad(load);
    setNewType(load.type);
    setNewQty(load.quantity.toLocaleString('pt-BR'));
    setOtherName(load.otherName || '');
    setSelectedBatchId(load.batchId || '');
    setDriverName(load.driverName || '');
    setVehiclePlate(load.vehiclePlate || '');
    setClientName(load.client || '');
    setSelectedEntityId(load.entityId || '');
    setShowAddModal(true);
  };

  const handleUpdate = async () => {
    if (!editingLoad) return;
    const normalizedQty = newQty.replace(/\./g, '').replace(',', '.');
    if (!normalizedQty || Number(normalizedQty) <= 0) {
      showToast("Insira uma quantidade válida", "error");
      return;
    }

    setIsProcessing(true);
    
    if (!selectedBatchId) {
      showToast("Selecione um lote.", "error");
      setIsProcessing(false);
      return;
    }

    const selectedEntity = entities.find(e => e.id === selectedEntityId);

    if (newType === 'OUTRO' && !otherName.trim()) {
      showToast("Por favor, informe o nome do subproduto.", "error");
      setIsProcessing(false);
      return;
    }

    const loadData: any = {
      type: newType,
      quantity: Number(normalizedQty),
      driverName: driverName.trim() || '',
      vehiclePlate: vehiclePlate.trim() || '',
      client: selectedEntity ? selectedEntity.name : clientName.trim() || '',
      entityId: selectedEntityId || undefined,
      totalTrips: selectedEntity ? 2 : undefined,
      totalDistanceKm: selectedEntity ? selectedEntity.distanceKm * 2 : undefined,
      batchId: selectedBatchId
    };

    if (newType === 'OUTRO') {
      loadData.otherName = otherName;
    } else {
      loadData.otherName = '';
    }

    const success = await updateSubproductLoad(editingLoad.id, loadData);

    if (success) {
      showToast("Registro atualizado com sucesso!", "success");
      handleCloseModal();
    } else {
      showToast("Erro ao atualizar registro.", "error");
    }
    setIsProcessing(false);
  };

  const handleFinalize = async () => {
    if (!confirmFinalize) return;
    setIsProcessing(true);
    const success = await finalizeSubproductLoad(confirmFinalize.id);
    if (success) {
      showToast("Registro finalizado com sucesso!", "success");
      setConfirmFinalize(null);
    } else {
      showToast("Erro ao finalizar registro.", "error");
    }
    setIsProcessing(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setIsProcessing(true);
    const loadId = confirmDelete.id;
    setConfirmDelete(null);
    const success = await deleteSubproductLoad(loadId);
    if (success) {
      showToast("Registro excluído com sucesso!", "success");
    } else {
      showToast("Erro ao excluir registro.", "error");
    }
    setIsProcessing(false);
  };

  const handleReopen = async (id: string, name: string) => {
    if (!window.confirm(`Deseja realmente reabrir o registro ${name}? Isso estornará a saída do moinho.`)) return;
    setIsProcessing(true);
    const success = await reopenSubproductLoad(id);
    if (success) {
      showToast("Registro reaberto!", "success");
    } else {
      showToast("Erro ao reabrir registro.", "error");
    }
    setIsProcessing(false);
  };

  const activeLoads = subproductLoads.filter(l => l.status === 'ATIVO');
  const finalizedLoads = subproductLoads.filter(l => l.status === 'FINALIZADO');

  const activeBatchStats = activeBatches.map(batch => {
    const batchLoads = finalizedLoads.filter(l => l.batchId === batch.id);
    const weight = batchLoads.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    const count = batchLoads.length;
    return { batch, weight, count };
  });

  const totalExpedited = finalizedLoads.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const totalLoadsCount = finalizedLoads.length;

  const branStockKg = stock.branStock || 0;
  const BRAN_CAPACITY = 60000;
  const branPercent = Math.max(0, Math.min(Math.round((branStockKg / BRAN_CAPACITY) * 100), 100));

  return (
    <div className="w-full px-4 pb-12 animate-fadeIn font-inter flex flex-col h-full bg-slate-50 min-h-screen">
      {/* Header Fixo */}
      <div className="flex items-center justify-between mb-6 pt-4 sticky top-0 bg-slate-50 z-10 pb-2">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2.5 mr-3 bg-white rounded-xl border border-slate-200 shadow-sm active:scale-95 transition-all text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase leading-none">Saída Subproduto</h2>
            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">Controle de Saída Industrial</p>
          </div>
        </div>

        <button 
          onClick={() => setShowAddModal(true)} 
          className="bg-slate-800 text-white px-6 py-3 rounded-2xl shadow-lg shadow-slate-100 active:scale-95 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Novo Registro</span>
        </button>
      </div>

      {/* Caixa de Farelo Status */}
      <div className="mb-8 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-stone-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-stone-100 rounded-lg text-stone-600">
                  <ArrowRightLeft size={14} />
                </div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Caixa de Farelo (Moinho)</h3>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-800 tracking-tighter">{branStockKg.toLocaleString('pt-BR')}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">kg</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs font-black uppercase tracking-widest ${branPercent > 90 ? 'text-red-600 animate-pulse' : 'text-stone-600'}`}>
                {branPercent}% Ocupado
              </span>
              <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Capacidade: 60.000 kg</p>
            </div>
          </div>
          
          <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${branPercent}%` }}
              className={`h-full rounded-full transition-all duration-1000 ${branPercent > 90 ? 'bg-red-500' : 'bg-stone-800 shadow-sm'}`}
            />
          </div>
          
          {branPercent > 85 && (
            <div className="mt-3 flex items-center gap-2 text-red-600">
              <AlertCircle size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">Atenção: Caixa atingindo limite máximo!</span>
            </div>
          )}
        </div>
      </div>

      {/* Histórico Geral */}
      <div className="flex items-center gap-3 mb-4 ml-1">
         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Resumo Geral (Histórico)</h3>
         <div className="h-[1px] flex-grow bg-slate-200/60"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Geral Expedido</span>
           <div className="flex items-baseline gap-1">
             <span className="text-3xl font-black text-slate-800 tracking-tighter">
               {totalExpedited.toLocaleString('pt-BR')}
             </span>
             <span className="text-xs font-bold text-slate-400 uppercase">kg</span>
           </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Registros</span>
           <div className="flex items-baseline gap-1">
             <span className="text-3xl font-black text-slate-800 tracking-tighter">{totalLoadsCount}</span>
             <span className="text-xs font-bold text-slate-400 uppercase">Cargas</span>
           </div>
        </div>
      </div>

      {/* Resumo dos Lotes em Vigor - Compacto */}
      <div className="flex flex-col gap-3 mb-6">
        {activeBatchStats.map(({ batch, weight, count }, index) => {
          const batchColors = [
            { border: 'border-blue-400', bg: 'bg-blue-50/60', text: 'text-blue-900', label: 'text-blue-500', innerBorder: 'border-blue-200/50', valueText: 'text-blue-600' },
            { border: 'border-emerald-400', bg: 'bg-emerald-50/60', text: 'text-emerald-900', label: 'text-emerald-500', innerBorder: 'border-emerald-200/50', valueText: 'text-emerald-600' },
            { border: 'border-red-400', bg: 'bg-red-50/60', text: 'text-red-900', label: 'text-red-500', innerBorder: 'border-red-200/50', valueText: 'text-red-600' },
            { border: 'border-slate-800', bg: 'bg-slate-100/60', text: 'text-slate-900', label: 'text-slate-800', innerBorder: 'border-slate-300/50', valueText: 'text-slate-900' }
          ];
          const c = batchColors[index % batchColors.length];
          return (
          <div key={batch.id} className={`p-3 ${c.bg} rounded-none border ${c.border} shadow-sm animate-fadeIn relative overflow-hidden flex flex-col sm:flex-row items-center gap-4 transition-all hover:shadow-md`}>
            <div className="flex flex-col items-center sm:items-start min-w-[120px]">
               <span className={`text-[7px] font-black ${c.label} uppercase tracking-widest leading-none mb-0.5`}>Lote em Vigor</span>
               <h2 className={`text-xl font-black ${c.text} tracking-tighter uppercase leading-none`}>{batch.name}</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-2 flex-1 w-full">
               <div className={`bg-white p-2 rounded-none border ${c.innerBorder} flex flex-col justify-center`}>
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Expedido</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-sm font-black text-slate-800 tabular-nums">{weight.toLocaleString('pt-BR')}</span>
                    <span className="text-[7px] font-bold text-slate-400 uppercase">kg</span>
                  </div>
               </div>
               <div className={`bg-white p-2 rounded-none border ${c.innerBorder} flex flex-col justify-center`}>
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Cargas</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-sm font-black text-slate-800 tabular-nums">{count}</span>
                    <span className="text-[7px] font-bold text-slate-400 uppercase">Final</span>
                  </div>
               </div>
            </div>
          </div>
        )})}
      </div>

      {/* Active Loads */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4 ml-1">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Saídas em Aberto</h3>
           <div className="h-[1px] flex-grow bg-slate-200/60"></div>
           <span className="bg-emerald-100 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded-full">{activeLoads.length}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {activeLoads.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-12 text-center bg-white rounded-[2rem] border border-dashed border-slate-200 flex flex-col items-center"
              >
                <ArrowRightLeft className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum registro em andamento</p>
              </motion.div>
            ) : activeLoads.map(load => (
              <motion.div 
                key={load.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-white rounded-[2rem] border ${TYPE_MAP[load.type].border} shadow-xl overflow-hidden group hover:border-emerald-200 transition-all`}
              >
                <div className="p-5 sm:p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 ${TYPE_MAP[load.type].bg} rounded-2xl flex items-center justify-center border-2 ${TYPE_MAP[load.type].border} overflow-hidden shadow-sm relative group-hover:scale-105 transition-transform bg-white`}>
                        <img 
                          src={TYPE_MAP[load.type].logo} 
                          alt={load.type} 
                          className="w-full h-full object-contain p-2 mb-1"
                          style={{ imageRendering: '-webkit-optimize-contrast' }}
                          referrerPolicy="no-referrer"
                        />
                        <div className={`absolute bottom-0 left-0 right-0 ${TYPE_MAP[load.type].accent} py-0.5 flex items-center justify-center`}>
                          <span className="text-[7px] font-black text-white uppercase tracking-tighter">
                            {load.type === 'FARELO' ? 'FARELO' : load.type === 'RESIDUO' ? 'RESÍDUO' : 'TRIGO'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-base sm:text-lg font-black text-slate-800 uppercase leading-none mb-1">
                          {load.loadId}
                        </h4>
                        <div className="flex flex-col gap-0.5">
                          <p className={`text-[9px] font-black px-2 py-0.5 rounded-full inline-block ${TYPE_MAP[load.type].bg} ${TYPE_MAP[load.type].color} uppercase tracking-widest w-fit`}>
                            {load.type === 'OUTRO' ? load.otherName : TYPE_MAP[load.type].name}
                          </p>
                          {load.client && (
                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-wider">
                              Cliente: {load.client}
                            </p>
                          )}
                          {(load.driverName || load.vehiclePlate) && (
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">
                              {load.driverName && `Mot: ${load.driverName}`}
                              {load.driverName && load.vehiclePlate && ' | '}
                              {load.vehiclePlate && `Placa: ${load.vehiclePlate}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right leading-none">
                      <div className="flex items-center gap-1 justify-end text-slate-500">
                        <Clock size={10} />
                        <span className="text-[10px] font-black uppercase">
                          {load.createdAt?.toDate ? new Date(load.createdAt.toDate()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50/80 py-4 px-5 rounded-2xl border border-slate-100 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase block tracking-widest mb-0.5">Quantidade</span>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-3xl font-black ${TYPE_MAP[load.type].color} tracking-tighter`}>{load.quantity.toLocaleString('pt-BR')}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">kg</span>
                        </div>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[8px] font-black text-slate-300 uppercase block mb-0.5">Status</span>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Ativo
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleStartEdit(load)}
                      className="py-4 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all flex items-center justify-center gap-2 border border-slate-200"
                    >
                      <Pencil className="w-4 h-4 text-slate-500" />
                      Editar
                    </button>
                    <button 
                      onClick={() => setConfirmFinalize(load)}
                      className="flex-grow py-4 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Finalizar Registro
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* History */}
      <div>
        <div className="flex items-center gap-3 mb-4 ml-1">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Saídas Finalizadas Recentemente</h3>
           <div className="h-[1px] flex-grow bg-slate-200/60"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {finalizedLoads.slice(0, 12).map(load => (
            <div key={load.id} className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-100 transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${TYPE_MAP[load.type].bg} flex items-center justify-center border ${TYPE_MAP[load.type].border} overflow-hidden bg-white relative`}>
                  <img 
                    src={TYPE_MAP[load.type].logo} 
                    alt={load.type} 
                    className="w-full h-full object-contain p-2 mb-1 opacity-90"
                    style={{ imageRendering: '-webkit-optimize-contrast' }}
                    referrerPolicy="no-referrer"
                  />
                  <div className={`absolute bottom-0 left-0 right-0 ${TYPE_MAP[load.type].accent} py-0.5 flex items-center justify-center`}>
                    <span className="text-[6px] font-black text-white uppercase tracking-tighter">
                      {load.type === 'FARELO' ? 'FARELO' : load.type === 'RESIDUO' ? 'RESÍDUO' : 'TRIGO'}
                    </span>
                  </div>
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1">
                    {load.loadId}
                  </h4>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                      {load.quantity.toLocaleString('pt-BR')} kg • {load.type === 'OUTRO' ? load.otherName : TYPE_MAP[load.type].name}
                    </p>
                    {load.client && (
                      <p className="text-[8px] font-black text-blue-600 uppercase tracking-wider">
                        Cli: {load.client}
                      </p>
                    )}
                    {(load.driverName || load.vehiclePlate) && (
                      <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tight">
                        {load.driverName && `Mot: ${load.driverName}`}
                        {load.driverName && load.vehiclePlate && ' | '}
                        {load.vehiclePlate && `Placa: ${load.vehiclePlate}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <span className="text-[9px] font-black text-slate-400 uppercase">
                  {load.updatedAt?.toDate ? new Date(load.updatedAt.toDate()).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '--/--'}
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setConfirmDelete(load)}
                    disabled={isProcessing}
                    className="p-1.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Excluir Registro"
                  >
                    <Trash2 size={12} />
                  </button>
                  <button 
                    onClick={() => handleReopen(load.id, load.loadId)}
                    disabled={isProcessing}
                    className="p-1.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    title="Reabrir Registro"
                  >
                    <RefreshCw size={12} className={isProcessing ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Adicionar */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] overflow-y-auto p-4 flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden relative z-10"
            >
              <div className={`p-6 ${editingLoad ? 'bg-amber-600' : 'bg-emerald-600'} text-white text-center relative`}>
                <h3 className="text-xl font-black uppercase tracking-widest">
                  {editingLoad ? 'Editar Registro de Saída' : 'Novo Registro de Saída Subproduto'}
                </h3>
                <button onClick={handleCloseModal} className="absolute right-6 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                {/* Seleção de Lote */}
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <label className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2 block">Para qual lote deseja registrar esta movimentação?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {loadingBatches ? (
                      <div className="col-span-full py-2 text-center text-blue-500 font-bold text-[10px] uppercase flex items-center justify-center gap-2">
                        <RefreshCw className="animate-spin w-3 h-3" />
                        Carregando...
                      </div>
                    ) : activeBatches.length === 0 ? (
                      <div className="col-span-full py-2 text-center text-red-500 font-bold text-[10px] uppercase">
                        Nenhum lote ativo encontrado.
                      </div>
                    ) : activeBatches.map(batch => (
                      <button
                        key={batch.id}
                        onClick={() => setSelectedBatchId(batch.id)}
                        className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between ${
                          selectedBatchId === batch.id 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                            : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Package size={14} className={selectedBatchId === batch.id ? 'text-white' : 'text-blue-500'} />
                          <span className="font-black text-[10px] tracking-tight uppercase">{batch.name}</span>
                        </div>
                        {selectedBatchId === batch.id && <CheckCircle2 size={12} />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tipo de Subproduto</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['FARELO', 'RESIDUO', 'OUTRO'] as SubproductType[]).map(t => (
                      <button 
                        key={t} 
                        onClick={() => setNewType(t)} 
                        className={`py-3 rounded-xl border-2 transition-all font-black text-[10px] uppercase ${newType === t ? 'bg-slate-800 border-slate-800 text-white shadow-lg shadow-slate-100' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {newType === 'OUTRO' && (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nome do Subproduto (Escreva o que desejar)</label>
                    <input 
                      type="text" 
                      value={otherName} 
                      onChange={e => setOtherName(e.target.value.toUpperCase())} 
                      placeholder="DIGITE O NOME DO SUBPRODUTO..."
                      className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all uppercase" 
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Quantidade (KG)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      inputMode="numeric"
                      value={newQty} 
                      onChange={e => {
                        setNewQty(formatNumber(e.target.value));
                      }} 
                      placeholder="0"
                      className="w-full bg-slate-50/50 py-4 px-12 rounded-2xl border-2 border-slate-100 font-black text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all text-2xl text-center tracking-tight" 
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs uppercase tracking-wider">KG</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Motorista</label>
                    <input 
                      type="text" 
                      list="drivers-list-sub"
                      value={driverName} 
                      onChange={e => {
                        const name = e.target.value.toUpperCase();
                        setDriverName(name);
                        // Auto-fill plate if exists
                        const driver = drivers.find(d => d.name.toUpperCase() === name);
                        if (driver) {
                          setVehiclePlate(driver.plate.toUpperCase());
                        }
                      }} 
                      placeholder="NOME..."
                      className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all uppercase text-[11px]" 
                    />
                    <datalist id="drivers-list-sub">
                      {drivers.map(d => (
                        <option key={d.id} value={d.name.toUpperCase()} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Placa</label>
                    <input 
                      type="text" 
                      value={vehiclePlate} 
                      onChange={e => setVehiclePlate(e.target.value.toUpperCase())} 
                      placeholder="ABC-1234"
                      className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all uppercase text-[11px]" 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Cliente / Destino</label>
                  <select 
                    required
                    value={selectedEntityId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const entity = entities.find(ent => ent.id === id);
                      if (entity) {
                        setSelectedEntityId(id);
                        setClientName(entity.name);
                      } else {
                        setSelectedEntityId('');
                        setClientName('');
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-center text-sm font-black text-slate-800 outline-none focus:bg-white focus:border-blue-200 transition-all appearance-none"
                  >
                    <option value="">SELECIONE UM CLIENTE</option>
                    {entities.filter(e => e.type === 'CLIENTE' || e.type === 'AMBOS').map(ent => (
                      <option key={ent.id} value={ent.id}>{ent.name}</option>
                    ))}
                  </select>
                  {!selectedEntityId && (
                    <input 
                      type="text" 
                      value={clientName} 
                      onChange={e => setClientName(e.target.value.toUpperCase())} 
                      placeholder="OU DIGITE O NOME MANUALMENTE..."
                      className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all uppercase text-[11px]" 
                    />
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={handleCloseModal} className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] text-slate-400">Cancelar</button>
                  <button 
                    onClick={editingLoad ? handleUpdate : handleCreate} 
                    disabled={isProcessing} 
                    className={`flex-[2] ${editingLoad ? 'bg-amber-600 shadow-amber-100' : 'bg-slate-800 shadow-slate-100'} text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2`}
                  >
                    {isProcessing ? <Clock className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {editingLoad ? 'Salvar Alterações' : 'Iniciar Registro'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={!!confirmFinalize}
        onClose={() => setConfirmFinalize(null)}
        onConfirm={handleFinalize}
        title="Finalizar Registro"
        message={`Deseja realmente finalizar este registro de ${confirmFinalize?.type === 'OUTRO' ? confirmFinalize.otherName : confirmFinalize?.type}? Ele será contabilizado como saída do moinho.`}
        confirmText="Finalizar"
        variant="primary"
      />

      <ConfirmModal 
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Excluir Registro"
        message={`Deseja realmente excluir este registro? Esta ação não pode ser desfeita e não estornará automaticamente saldos em estoque, devendo ser feito manualmente se necessário.`}
        confirmText="Excluir"
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
