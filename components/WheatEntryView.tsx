
import React, { useEffect, useState } from 'react';
import { useData } from '../src/shared/contexts/DataContext';
import { saveWheatEntry, subscribeToWheatEntries, getActiveBatch, updateBatchProgress, deleteWheatEntry } from '../firebase';
import { WheatEntry } from '../types';
import { Truck, Plus, X, Search, Calendar, Clock, User, FileText, Scale, Droplets, AlertTriangle, CheckCircle2, ChevronRight, Info, Wheat, Trash2, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toast, ToastType } from './Toast';
import { ConfirmModal } from './ConfirmModal';

interface WheatEntryViewProps {
  onBack: () => void;
}

export const WheatEntryView: React.FC<WheatEntryViewProps> = ({ onBack }) => {
  const { wheatEntries: entries, batches: allBatches, loadingBatches, drivers, entities } = useData();
  const activeBatches = allBatches.filter(b => b.status === 'OPEN');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false
  });
  const [showConfirmDelete, setShowConfirmDelete] = useState<WheatEntry | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    ticket: '',
    driver: '',
    plate: '',
    description: '',
    entity: '',
    entityId: '',
    product: 'TRIGO',
    entryWeight: '',
    exitWeight: '',
    moisture: '',
    impurity: '',
    triguilho: '',
    avariado: '',
    ph: '',
    discount: '',
    batchId: '',
    entryTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  });

  useEffect(() => {
    if (activeBatches.length === 1 && !formData.batchId) {
      setFormData(prev => ({ ...prev, batchId: activeBatches[0].id }));
    }
  }, [activeBatches, formData.batchId]);

  // Auto-generate ticket when batch is selected
  useEffect(() => {
    if (formData.batchId && !formData.ticket && showAddModal) {
      const selectedBatch = activeBatches.find(b => b.id === formData.batchId);
      if (selectedBatch) {
        const now = new Date();
        const dayMap = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
        const dayLetter = dayMap[now.getDay()];
        const dayNumber = now.getDate();
        
        // Check how many wheat entries exist today
        const todayEntries = entries.filter(e => {
          const entryDate = e.date?.toDate ? new Date(e.date.toDate()) : new Date();
          return entryDate.getDate() === now.getDate() && 
                 entryDate.getMonth() === now.getMonth() && 
                 entryDate.getFullYear() === now.getFullYear();
        });

        const count = todayEntries.length;
        const letter = count === 0 ? '' : String.fromCharCode(64 + count); // 1 -> A, 2 -> B, etc.
        
        const generatedId = `T${letter}${dayLetter}${dayNumber}`;
        const batchPrefix = selectedBatch.name.startsWith('#') ? selectedBatch.name : `#${selectedBatch.name}`;
        setFormData(prev => ({ ...prev, ticket: `${batchPrefix}/${generatedId}` }));
      }
    }
  }, [formData.batchId, activeBatches, showAddModal, formData.ticket, entries]);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatNumber = (val: string) => {
    // Remove non-numeric characters
    const numeric = val.replace(/\D/g, '');
    if (!numeric) return '';
    // Format with dots for thousands
    return Number(numeric).toLocaleString('pt-BR');
  };

  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: formatNumber(value) }));
  };

  const handleDecimalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'moisture') {
      setFormData(prev => ({ ...prev, [name]: maskHumidity(value) }));
      return;
    }

    if (name === 'ph' || name === 'avariado' || name === 'triguilho' || name === 'impurity') {
      const digits = value.replace(/\D/g, '').slice(0, 2);
      setFormData(prev => ({ ...prev, [name]: digits }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: maskBrazilianValue(value) }));
  };

  const maskHumidity = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 3);
    if (!digits) return '';
    if (digits.length <= 2) return digits;
    return digits.slice(0, 2) + ',' + digits.slice(2);
  };

  const maskBrazilianValue = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const numberValue = Number(digits) / 100;
    return numberValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const calculateLiquid = () => {
    const entry = Number(formData.entryWeight.replace(/\./g, '').replace(',', '.')) || 0;
    const exit = Number(formData.exitWeight.replace(/\./g, '').replace(',', '.')) || 0;
    return Math.abs(entry - exit);
  };

  const calculateFinal = () => {
    const liquid = calculateLiquid();
    const discount = Number(formData.discount.replace(/\./g, '').replace(',', '.')) || 0;
    return liquid - discount;
  };

  const handleSave = async () => {
    if (!formData.entryWeight || !formData.exitWeight) {
      showToast("Preencha os campos obrigatórios (Pesos)", "error");
      return;
    }

    if (!formData.entityId && !formData.entity.trim()) {
      showToast("Selecione ou digite o campo Fornecedor / Origem.", "error");
      return;
    }

    setIsProcessing(true);
    const liquidWeight = calculateLiquid();
    const finalWeight = calculateFinal();

    if (!formData.batchId) {
      showToast("Selecione um lote para registrar a movimentação.", "error");
      setIsProcessing(false);
      return;
    }

    const selectedBatch = activeBatches.find(b => b.id === formData.batchId);
    const selectedEntity = entities.find(e => e.id === formData.entityId);

    const success = await saveWheatEntry({
      ticket: formData.ticket,
      driver: formData.driver.toUpperCase(),
      plate: formData.plate.toUpperCase(),
      description: formData.description.toUpperCase(),
      entity: selectedEntity ? selectedEntity.name : formData.entity.toUpperCase(),
      entityId: formData.entityId || undefined,
      totalTrips: selectedEntity ? 2 : undefined,
      totalDistanceKm: selectedEntity ? selectedEntity.distanceKm * 2 : undefined,
      product: formData.product.toUpperCase(),
      entryWeight: Number(formData.entryWeight.replace(/\./g, '').replace(',', '.')),
      exitWeight: Number(formData.exitWeight.replace(/\./g, '').replace(',', '.')),
      liquidWeight,
      moisture: Number(formData.moisture.replace(/\./g, '').replace(',', '.')) || 0,
      impurity: Number(formData.impurity.replace(/\./g, '').replace(',', '.')) || 0,
      triguilho: Number(formData.triguilho) || 0,
      avariado: Number(formData.avariado) || 0,
      ph: Number(formData.ph) || 0,
      discount: Number(formData.discount.replace(/\./g, '').replace(',', '.')),
      entryTime: formData.entryTime,
      finalWeight,
      batchId: formData.batchId,
      batchName: selectedBatch?.name
    });

    if (success) {
      showToast("Entrada registrada com sucesso!", "success");
      setShowAddModal(false);
      setFormData({
        ticket: '',
        driver: '',
        plate: '',
        description: '',
        entity: '',
        entityId: '',
        product: 'TRIGO',
        entryWeight: '',
        exitWeight: '',
        moisture: '',
        impurity: '',
        triguilho: '',
        avariado: '',
        ph: '',
        discount: '',
        batchId: activeBatches.length === 1 ? activeBatches[0].id : '',
        entryTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
    } else {
      showToast("Erro ao salvar entrada.", "error");
    }
    setIsProcessing(false);
  };

  const handleDelete = async () => {
    if (!showConfirmDelete) return;
    
    setIsProcessing(true);
    const success = await deleteWheatEntry(showConfirmDelete.id, showConfirmDelete.batchId, showConfirmDelete.liquidWeight);
    
    if (success) {
      showToast("Entrada excluída com sucesso!", "success");
    } else {
      showToast("Erro ao excluir entrada.", "error");
    }
    
    setIsProcessing(false);
    setShowConfirmDelete(null);
  };

  const filteredEntries = entries.filter(e => 
    e.ticket.includes(searchTerm) || 
    e.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.plate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalWeight = entries.reduce((acc, curr) => acc + curr.finalWeight, 0);

  return (
    <div className="w-full px-4 pb-12 animate-fadeIn font-inter flex flex-col h-full bg-slate-50 min-h-screen">
      {/* Header Fixo */}
      <div className="flex items-center justify-between mb-6 pt-4 sticky top-0 bg-slate-50 z-10 pb-2">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2.5 mr-3 bg-white rounded-xl border border-slate-200 shadow-sm active:scale-95 transition-all text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase leading-none">Entrada Trigo</h2>
            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">Controle de Entrada de Trigo</p>
          </div>
        </div>

        <button onClick={() => setShowAddModal(true)} className="bg-amber-600 text-white p-2.5 rounded-xl shadow-lg shadow-amber-100 active:scale-95 transition-all">
           <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm">
           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Geral Recebido</span>
           <div className="flex items-baseline gap-1">
             <span className="text-3xl font-black text-slate-800 tracking-tighter">
               {totalWeight.toLocaleString('pt-BR')}
             </span>
             <span className="text-xs font-bold text-slate-400 uppercase">kg</span>
           </div>
        </div>
        <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm">
           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Registros</span>
           <div className="flex items-baseline gap-1">
             <span className="text-3xl font-black text-slate-800 tracking-tighter">{entries.length}</span>
             <span className="text-xs font-bold text-slate-400 uppercase">Entradas</span>
           </div>
        </div>
      </div>

      {/* Batch Weight Summary */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4 ml-1">
           <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Total por Lote</h3>
           <div className="h-[1px] flex-grow bg-amber-100"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {allBatches
            .filter(b => b.status === 'OPEN' || entries.some(e => e.batchId === b.id))
            .sort((a, b) => {
              if (a.status === 'OPEN' && b.status !== 'OPEN') return -1;
              if (a.status !== 'OPEN' && b.status === 'OPEN') return 1;
              const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
              const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
              return dateB.getTime() - dateA.getTime();
            })
            .slice(0, 4)
            .map((batch, index) => {
              const batchWeight = entries
                .filter(e => e.batchId === batch.id)
                .reduce((acc, curr) => acc + curr.finalWeight, 0);
              
              const batchColors = [
                { border: 'border-blue-400', bg: 'bg-blue-50/50', tag: 'bg-blue-500', text: 'text-blue-700', label: 'text-blue-400' },
                { border: 'border-emerald-400', bg: 'bg-emerald-50/50', tag: 'bg-emerald-500', text: 'text-emerald-700', label: 'text-emerald-400' },
                { border: 'border-red-400', bg: 'bg-red-50/50', tag: 'bg-red-500', text: 'text-red-700', label: 'text-red-400' },
                { border: 'border-slate-800', bg: 'bg-slate-100', tag: 'bg-slate-800', text: 'text-slate-900', label: 'text-slate-800' }
              ];
              
              const c = batch.status === 'OPEN' ? batchColors[index % batchColors.length] : { border: 'border-slate-200', bg: 'bg-white', tag: 'bg-slate-400', text: 'text-slate-700', label: 'text-slate-400' };
              
              return (
                <div key={batch.id} className={`p-4 rounded-none border ${c.bg} ${c.border} shadow-sm relative overflow-hidden group transition-all`}>
                  {batch.status === 'OPEN' && (
                    <div className={`absolute top-0 right-0 ${c.tag} text-[6px] font-black text-white px-2 py-0.5 uppercase tracking-tighter`}>Vigor</div>
                  )}
                  <div className="flex flex-col">
                    <span className={`text-[9px] font-black ${c.label} uppercase tracking-widest mb-1`}>Lote {batch.name}</span>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-black tracking-tighter ${c.text}`}>
                        {batchWeight.toLocaleString('pt-BR')}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">kg</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                       <span className="text-[7px] font-bold text-slate-300 uppercase tracking-tighter">Processado</span>
                       <span className={`text-[9px] font-black ${batch.status === 'OPEN' ? c.text : c.label}`}>
                         {entries.filter(e => e.batchId === batch.id).length} Entradas
                       </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Pesquisar por Ticket, Motorista ou Placa..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 p-4 pl-12 rounded-none font-bold text-sm outline-none focus:border-amber-500 transition-all shadow-sm"
        />
      </div>

      {/* Entries List */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4 ml-1">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Entradas Recentes</h3>
           <div className="h-[1px] flex-grow bg-slate-200/60"></div>
           <span className="bg-amber-100 text-amber-600 text-[9px] font-black px-2 py-0.5 rounded-full">{filteredEntries.length}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredEntries.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 opacity-30 flex flex-col items-center bg-white rounded-none border border-dashed border-slate-300 col-span-full"
              >
                 <Truck className="w-12 h-12 mb-2 text-slate-400" />
                 <p className="font-black text-[10px] uppercase tracking-widest">Nenhuma entrada registrada</p>
              </motion.div>
            ) : filteredEntries.map(entry => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden group hover:border-amber-200 transition-all"
              >
                <div className="p-2">
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-amber-50 rounded-none flex items-center justify-center border border-amber-100 overflow-hidden p-0.5 shadow-sm relative bg-white">
                        <img 
                          src="https://i.ibb.co/DgbmXFt0/image.png" 
                          alt="Logo Trigo" 
                          className="w-full h-full object-contain"
                          style={{ imageRendering: '-webkit-optimize-contrast' }}
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-amber-600 flex items-center justify-center" style={{ padding: '0.5px 0' }}>
                          <span className="text-[4px] font-black text-white uppercase tracking-tighter">Trigo</span>
                        </div>
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-[11px] font-black text-slate-800 uppercase leading-none mb-0.5">{entry.ticket}</h4>
                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tight break-words max-w-[80px]">
                          {entry.driver} • {entry.plate}
                        </p>
                      </div>
                    </div>
                    <div className="text-right leading-none flex flex-col items-end">
                      <div className="flex items-center gap-1 justify-end text-slate-500">
                        <Calendar size={6} />
                        <span className="text-[7px] font-black uppercase">
                          {entry.date?.toDate ? new Date(entry.date.toDate()).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}) : '--/--'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 justify-end text-slate-400 mt-0.5">
                        <Clock size={6} />
                        <span className="text-[7px] font-bold uppercase">
                          {entry.entryTime || (entry.date?.toDate ? new Date(entry.date.toDate()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--')}
                        </span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowConfirmDelete(entry);
                        }}
                        className="mt-0.5 p-0.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-none transition-all"
                      >
                        <Trash2 size={8} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50/80 py-1.5 px-2 rounded-none border border-slate-100 mb-1.5">
                    <div className="flex flex-col">
                      <span className="text-[6px] font-black text-slate-400 uppercase block tracking-widest mb-0">Peso Final</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-slate-800 tracking-tighter">{entry.finalWeight.toLocaleString('pt-BR')}</span>
                        <span className="text-[7px] font-bold text-slate-400 uppercase">kg</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-0.5 border-t border-slate-50 pt-1.5">
                    <div className="flex gap-2">
                       <div className="flex items-center gap-1">
                         <div className="w-3.5 h-3.5 rounded-none bg-blue-50 flex items-center justify-center">
                           <Droplets size={7} className="text-blue-500" />
                         </div>
                         <span className="text-[7px] font-black text-slate-600">{entry.moisture}%</span>
                       </div>
                       <div className="flex items-center gap-1">
                         <div className="w-3.5 h-3.5 rounded-none bg-amber-50 flex items-center justify-center">
                           <AlertTriangle size={7} className="text-amber-500" />
                         </div>
                         <span className="text-[7px] font-black text-slate-600">{entry.impurity}%</span>
                       </div>
                       <div className="flex items-center gap-1">
                         <div className="w-3.5 h-3.5 rounded-none bg-indigo-50 flex items-center justify-center">
                           <Scale size={7} className="text-indigo-500" />
                         </div>
                         <span className="text-[7px] font-black text-slate-600">{entry.ph}</span>
                       </div>
                    </div>
                    <div className="w-3.5 h-3.5 rounded-none bg-slate-50 flex items-center justify-center text-slate-300">
                      <ChevronRight size={8} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal Adicionar Entrada */}
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
              className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden relative z-10 my-auto"
            >
              <div className="bg-amber-600 p-6 text-white text-center relative">
                <h3 className="text-xl font-black uppercase tracking-widest">Registrar Entrada Trigo</h3>
                <button onClick={() => setShowAddModal(false)} className="absolute right-6 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto max-h-[80vh]">
                {/* Seleção de Lote */}
                <div className="mb-8 bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-3 block">Para qual lote deseja registrar esta movimentação?</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {loadingBatches ? (
                      <div className="col-span-full py-4 text-center text-blue-500 font-bold text-xs uppercase flex items-center justify-center gap-2">
                        <RefreshCw className="animate-spin w-4 h-4" />
                        Carregando lotes...
                      </div>
                    ) : activeBatches.length === 0 ? (
                      <div className="col-span-full py-4 text-center text-red-500 font-bold text-xs uppercase">
                        Nenhum lote ativo encontrado. Crie um lote primeiro.
                      </div>
                    ) : activeBatches.map(batch => (
                      <button
                        key={batch.id}
                        onClick={() => setFormData(prev => ({ ...prev, batchId: batch.id }))}
                        className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                          formData.batchId === batch.id 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' 
                            : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Package size={18} className={formData.batchId === batch.id ? 'text-white' : 'text-blue-500'} />
                          <span className="font-black text-sm tracking-tight uppercase">{batch.name}</span>
                        </div>
                        {formData.batchId === batch.id && <CheckCircle2 size={16} />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Informações Básicas */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Identificação</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nº Ticket</label>
                        <input 
                          name="ticket" 
                          value={formData.ticket} 
                          onChange={handleInputChange} 
                          placeholder="Ex: #LOTE/T25"
                          className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-amber-500 transition-all" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Hora Entrada</label>
                        <input name="entryTime" type="time" value={formData.entryTime} onChange={handleInputChange} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-amber-500 transition-all" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Motorista</label>
                        <input 
                          name="driver" 
                          list="drivers-list-wheat"
                          value={formData.driver} 
                          onChange={(e) => {
                            const name = e.target.value.toUpperCase();
                            // Se encontrar o motorista no cadastro, preenche a placa automaticamente
                            const driver = drivers.find(d => d.name.toUpperCase() === name);
                            if (driver) {
                              setFormData(prev => ({ ...prev, driver: name, plate: driver.plate.toUpperCase() }));
                            } else {
                              setFormData(prev => ({ ...prev, driver: name }));
                            }
                          }} 
                          className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-amber-500 transition-all uppercase" 
                        />
                        <datalist id="drivers-list-wheat">
                          {drivers.map(d => (
                            <option key={d.id} value={d.name.toUpperCase()} />
                          ))}
                        </datalist>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Placa</label>
                        <input name="plate" value={formData.plate} onChange={handleInputChange} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-amber-500 transition-all uppercase" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Fornecedor / Origem</label>
                      <select 
                        value={formData.entityId}
                        onChange={(e) => {
                          const id = e.target.value;
                          const entity = entities.find(ent => ent.id === id);
                          if (entity) {
                            setFormData(prev => ({ 
                              ...prev, 
                              entityId: id, 
                              entity: entity.name, 
                              description: `TRIGO - ${entity.city}` 
                            }));
                          } else {
                            setFormData(prev => ({ 
                              ...prev, 
                              entityId: '', 
                              entity: '' 
                            }));
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-amber-200 transition-all appearance-none"
                      >
                        <option value="">SELECIONAR DA LISTA (OPCIONAL)</option>
                        {entities.filter(e => e.type === 'FORNECEDOR' || e.type === 'AMBOS').map(ent => (
                          <option key={ent.id} value={ent.id}>{ent.name}</option>
                        ))}
                      </select>
                      {!formData.entityId && (
                        <div className="mt-2">
                          <input 
                            name="entity" 
                            placeholder="OU DIGITE O NOME DO FORNECEDOR MANUALMENTE"
                            value={formData.entity} 
                            onChange={handleInputChange} 
                            className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-amber-500 transition-all uppercase" 
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pesagem */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Pesagem (KG)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Peso Entrada</label>
                      <div className="relative">
                        <input type="text" inputMode="numeric" name="entryWeight" value={formData.entryWeight} onChange={handleNumericInputChange} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-amber-500 transition-all" />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs uppercase">KG</div>
                      </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Peso Saída</label>
                      <div className="relative">
                        <input type="text" inputMode="numeric" name="exitWeight" value={formData.exitWeight} onChange={handleNumericInputChange} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-amber-500 transition-all" />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs uppercase">KG</div>
                      </div>
                      </div>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex justify-between items-center">
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Peso Líquido Calculado</span>
                      <span className="text-xl font-black text-amber-700">{calculateLiquid().toLocaleString('pt-BR')} kg</span>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Desconto Total (KG)</label>
                    <div className="relative">
                      <input type="text" inputMode="numeric" name="discount" value={formData.discount} onChange={handleNumericInputChange} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-amber-500 transition-all" />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs uppercase">KG</div>
                    </div>
                    </div>
                  </div>
                </div>

                {/* Qualidade */}
                <div className="mb-8">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Análise de Qualidade</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Umidade %</label>
                    <div className="relative">
                      <input type="text" inputMode="decimal" name="moisture" value={formData.moisture} onChange={handleDecimalInputChange} className="w-full bg-slate-50 p-2 rounded-lg border border-slate-200 font-bold text-center text-slate-700 outline-none focus:border-amber-500 transition-all" />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[8px] uppercase">%</div>
                    </div>
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Impureza %</label>
                    <div className="relative">
                      <input type="text" inputMode="decimal" name="impurity" value={formData.impurity} onChange={handleDecimalInputChange} className="w-full bg-slate-50 p-2 rounded-lg border border-slate-200 font-bold text-center text-slate-700 outline-none focus:border-amber-500 transition-all" />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[8px] uppercase">%</div>
                    </div>
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">PH</label>
                      <input type="text" inputMode="decimal" name="ph" value={formData.ph} onChange={handleDecimalInputChange} className="w-full bg-slate-50 p-2 rounded-lg border border-slate-200 font-bold text-center text-slate-700 outline-none focus:border-amber-500 transition-all" />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Avariado %</label>
                    <div className="relative">
                      <input type="text" inputMode="decimal" name="avariado" value={formData.avariado} onChange={handleDecimalInputChange} className="w-full bg-slate-50 p-2 rounded-lg border border-slate-200 font-bold text-center text-slate-700 outline-none focus:border-amber-500 transition-all" />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[8px] uppercase">%</div>
                    </div>
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Triguilho %</label>
                    <div className="relative">
                      <input type="text" inputMode="decimal" name="triguilho" value={formData.triguilho} onChange={handleDecimalInputChange} className="w-full bg-slate-50 p-2 rounded-lg border border-slate-200 font-bold text-center text-slate-700 outline-none focus:border-amber-500 transition-all" />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[8px] uppercase">%</div>
                    </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] text-slate-400">Cancelar</button>
                  <button 
                    onClick={handleSave} 
                    disabled={isProcessing} 
                    className="flex-[2] bg-amber-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-amber-100 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Confirmar Entrada
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Toast 
        isVisible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
      />

      <ConfirmModal 
        isOpen={!!showConfirmDelete}
        onClose={() => setShowConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Excluir Entrada"
        message={`Deseja realmente excluir a entrada ${showConfirmDelete?.ticket}? O peso de ${showConfirmDelete?.finalWeight.toLocaleString('pt-BR')}kg será subtraído do progresso do lote.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

function RefreshCw(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>;
}
