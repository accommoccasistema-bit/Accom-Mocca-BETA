
import React, { useEffect, useState, useRef } from 'react';
import { useData } from '../src/shared/contexts/DataContext';
import { saveStock, createLoad, updateLoadStep, finalizeLoad, subscribeToLoads, syncLoadQtyWithStock, getActiveBatch, resetActiveLoadsAndStock, resetStockField, deleteLoad, updateLoadAttachment, amortizeLoadWithPendingFlour, cancelLoadAmortization, findInspecaoVeicularDoc, fetchMoccaDocumentData } from '../firebase';
import { Load, LoadType, StockData, Driver, MoccaDocument } from '../types';
import { Package, Truck, CheckCircle2, Beaker, Scale, ClipboardCheck, Plus, Minus, Check, ArrowRight, ArrowLeft, X, RefreshCw, Trash2, Settings, FileUp, FileDown, FileX, Paperclip, Printer, Microscope } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmModal } from './ConfirmModal';
import { Toast, ToastType } from './Toast';

interface FlourStockControlProps {
  onBack: () => void;
}

const TYPE_MAP: Record<LoadType, { name: string; color: string; bg: string; border: string; accent: string; icon: string; imgUrl?: string }> = {
  E: { 
    name: 'Especial', 
    color: 'text-blue-700', 
    bg: 'bg-blue-50', 
    border: 'border-blue-200', 
    accent: 'bg-blue-700',
    icon: 'E',
    imgUrl: 'https://i.ibb.co/3yYgYdjn/image.png'
  },
  C: { 
    name: 'Comum', 
    color: 'text-emerald-700', 
    bg: 'bg-emerald-50', 
    border: 'border-emerald-200', 
    accent: 'bg-emerald-600',
    icon: 'C',
    imgUrl: 'https://i.ibb.co/r2PbxJbz/image.png'
  },
  I: { 
    name: 'Inteira', 
    color: 'text-red-700', 
    bg: 'bg-red-50', 
    border: 'border-red-200', 
    accent: 'bg-red-600',
    icon: 'I',
    imgUrl: 'https://i.ibb.co/Xn0XLJM/image.png'
  },
  CL: { 
    name: 'Cola', 
    color: 'text-slate-900', 
    bg: 'bg-slate-50', 
    border: 'border-slate-300', 
    accent: 'bg-slate-800',
    icon: 'CL',
    imgUrl: 'https://i.ibb.co/8LDzkhh8/image.png'
  }
};

const BatchStats: React.FC<{ batchId: string }> = ({ batchId }) => {
  const { wheatEntries, loads, subproductLoads, batches } = useData();
  const batch = batches.find(b => b.id === batchId);
  
  if (!batch) return null;

  return (
    <div className="bg-slate-900 rounded-3xl p-4 sm:p-6 mb-6 text-white shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status do Lote {batch.name}</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-black uppercase tracking-tight">Em Processamento Industrial</span>
          </div>
        </div>
        
        <div className="flex gap-6 sm:gap-8 items-center">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Processado (In)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-blue-400">{(batch.currentWheat || 0).toLocaleString('pt-BR')}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">KG</span>
            </div>
          </div>
          <div className="h-8 w-[1px] bg-white/10 hidden sm:block"></div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Cargas Expedidas (Out)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-emerald-400">{(batch.currentFlour || 0).toLocaleString('pt-BR')}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">KG</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const STEPS = [
  { id: 1, label: 'Contagem bags', icon: Package },
  { id: 2, label: 'Amostra coletada', icon: DropletsIcon },
  { id: 3, label: 'Laboratório enviado', icon: Beaker },
  { id: 4, label: 'Análise confirmada', icon: ClipboardCheck },
  { id: 5, label: 'Carga pesada', icon: Scale },
  { id: 6, label: 'Aguardando entrega', icon: ClockIcon },
  { id: 7, label: 'Entrega finalizada', icon: Truck }
];

function DropletsIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16.3c2.2 0 4-1.8 4-4 0-3.3-4-8-4-8s-4 4.7-4 8c0 2.2 1.8 4 4 4Z"/><path d="M17 16.3c2.2 0 4-1.8 4-4 0-3.3-4-8-4-8s-4 4.7-4 8c0 2.2 1.8 4 4 4Z"/></svg>;
}

function ClockIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}

// Componente da Minuta (Adesivo)
const MinutaModal: React.FC<{ isOpen: boolean; onClose: () => void; load: Load | null }> = ({ isOpen, onClose, load }) => {
  if (!load) return null;

  const fabricationDate = load.createdAt?.toDate ? new Date(load.createdAt.toDate()) : new Date();
  const validityDate = new Date(fabricationDate);
  validityDate.setDate(validityDate.getDate() + 120);

  const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear().toString().slice(-2);
    return `${d}.${m}.${y}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] overflow-y-auto p-2 sm:p-4 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -10 }}
            className="bg-white rounded-[2.5rem] w-full max-w-[440px] shadow-2xl overflow-hidden relative z-10 p-6 sm:p-8 font-sans my-auto"
          >
            <div className="border-[4px] border-slate-900 p-4 sm:p-6 relative bg-white">
              <div className="flex justify-between items-start mb-8 gap-3">
                <div className="flex flex-col items-center w-[100px] sm:w-[120px] shrink-0 justify-center">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mb-2">
                    <ProductBadge type={load.type} size="lg" />
                  </div>
                </div>
                
                <div className="flex-grow text-center">
                  <h2 className="text-xl sm:text-2xl font-black text-blue-900 uppercase tracking-tighter border-b-4 border-slate-900 pb-1 mb-4">FARINHA DE TRIGO</h2>
                  
                  <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] sm:text-[10px] font-black shrink-0">TIPO 1:</span>
                      <span className="text-xl font-black text-slate-900 leading-none">{load.type === 'E' ? 'X' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] sm:text-[10px] font-black shrink-0">INTEIRA:</span>
                      <span className="text-xl font-black text-slate-900 leading-none">{load.type === 'I' ? 'X' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] sm:text-[10px] font-black shrink-0">TIPO 2:</span>
                      <span className="text-xl font-black text-slate-900 leading-none">{load.type === 'C' ? 'X' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] sm:text-[10px] font-black shrink-0">COLA:</span>
                      <span className="text-xl font-black text-slate-900 leading-none">{load.type === 'CL' ? 'X' : ''}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 items-end">
                  <div className="flex flex-col border-b-2 border-slate-900">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">CLIENTE</span>
                    <span className="text-xs sm:text-sm font-black uppercase italic leading-tight truncate">{load.client || 'NINFA'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 items-end pt-1">
                  <div className="flex flex-col border-b-2 border-slate-900">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">PESO LÍQUIDO (KG)</span>
                    <span className="text-sm font-black text-slate-900 leading-tight">
                      {load.weight ? Number(load.weight).toLocaleString('pt-BR') : '---'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col border-b-2 border-slate-900">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">MOTORISTA</span>
                    <span className="text-[11px] font-black uppercase truncate leading-tight italic">{load.driverName || '---'}</span>
                  </div>
                  <div className="flex flex-col border-b-2 border-slate-900">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">PLACA</span>
                    <span className="text-[11px] font-black uppercase text-center leading-tight italic">{load.vehiclePlate || '---'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="space-y-4">
                    <div className="flex flex-col border-b-2 border-slate-900">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">CRIADO EM</span>
                      <span className="text-xs font-black leading-tight">{formatDate(fabricationDate)}</span>
                    </div>
                    <div className="flex flex-col border-b-2 border-slate-900">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">VAL PARA</span>
                      <span className="text-xs font-black leading-tight text-blue-800">{formatDate(validityDate)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col border-b-2 border-slate-900 text-right">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">LOTE Nº</span>
                      <span className="text-xs font-black leading-tight">{load.loadId}</span>
                    </div>
                    <div className="flex flex-col border-b-2 border-slate-900 text-right">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">BAGS NA CARGA</span>
                      <span className="text-xs font-black leading-tight text-slate-900">{load.currentQty}</span>
                    </div>
                    {load.invoice && (
                      <div className="flex flex-col border-b-2 border-slate-900 text-right">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">NOTA FISCAL</span>
                        <span className="text-xs font-black leading-tight text-slate-900">{load.invoice}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center border-t border-slate-100 pt-3">
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-400 leading-tight block">
                   CONTÉM GLÚTEN | ENRIQUECIDA COM FERRO E ÁCIDO FÓLICO.
                </span>
                <span className="text-[7px] font-bold text-slate-300 mt-1 block uppercase tracking-widest">SISTEMA MOCCA - GESTÃO INDUSTRIAL</span>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 bg-slate-100 text-slate-500 py-3 rounded-xl font-black uppercase tracking-widest text-[9px] active:scale-95 transition-all"
              >
                Voltar
              </button>
              <button 
                onClick={() => window.print()}
                className="flex-[2] bg-blue-600 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-blue-100 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <FileDown size={14} />
                <span>Gerar Relatório</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const formatNumber = (val: string) => {
  const numeric = val.replace(/\D/g, '');
  if (!numeric) return '';
  return Number(numeric).toLocaleString('pt-BR');
};

const maskHumidity = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 3);
  if (!digits) return '';
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + ',' + digits.slice(2);
};

const maskColor = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (!digits) return '';
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + ',' + digits.slice(2);
};

export const FlourStockControl: React.FC<FlourStockControlProps> = ({ onBack }) => {
  const { stock, batches: allBatches, loadingBatches, loads, analyses, drivers, entities } = useData(); 
  const activeBatches = allBatches.filter(b => b.status === 'OPEN');
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmFinalize, setConfirmFinalize] = useState<Load | null>(null);
  const [minimizedLoads, setMinimizedLoads] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false
  });
  const [newLoadType, setNewLoadType] = useState<LoadType>('E');
  const [newLoadQty, setNewLoadQty] = useState('');
  const [newLoadClient, setNewLoadClient] = useState('');
  const [newLoadEntityId, setNewLoadEntityId] = useState('');
  const [newLoadBatchId, setNewLoadBatchId] = useState('');
  const [showMinuta, setShowMinuta] = useState<Load | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Load | null>(null);
  const [adjustingStock, setAdjustingStock] = useState<{ field: keyof StockData; label: string } | null>(null);
  const [adjustValue, setAdjustValue] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);
  const [weightInput, setWeightInput] = useState<Record<string, string>>({});
  const [driverInput, setDriverInput] = useState<Record<string, string>>({});
  const [plateInput, setPlateInput] = useState<Record<string, string>>({});
  const [colorInput, setColorInput] = useState<Record<string, string>>({});
  const [humidityInput, setHumidityInput] = useState<Record<string, string>>({});
  const [invoiceInput, setInvoiceInput] = useState<Record<string, string>>({});

  useEffect(() => {
    // Ensuring color and humidity inputs are empty by default as requested
  }, []);

  useEffect(() => {
    if (activeBatches.length === 1 && !newLoadBatchId) {
      setNewLoadBatchId(activeBatches[0].id);
    }
  }, [activeBatches, newLoadBatchId]);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
  };

  const generateLoadId = (type: LoadType) => {
    const now = new Date();
    const dayMap = ['D', 'S', 'T', 'QA', 'Q', 'SX', 'SA'];
    const dayLetter = dayMap[now.getDay()];
    const dayNumber = now.getDate();

    // Check how many loads of this type exist today (ignoring the batch prefix for comparison)
    const todayLoads = loads.filter(l => {
      // Extract the base ID (e.g., ES30 or EAS30) from the formatted ID (#L36/ES30)
      const baseId = l.loadId.split('/').pop() || '';
      const loadDate = l.createdAt?.toDate ? new Date(l.createdAt.toDate()) : new Date();
      
      // We check if it's the same day and if the base ID starts with the same type
      // and ends with the same day letter + number
      const isSameDay = loadDate.getDate() === now.getDate() && 
                       loadDate.getMonth() === now.getMonth() && 
                       loadDate.getFullYear() === now.getFullYear();
      
      return isSameDay && l.type === type;
    });

    const count = todayLoads.length;
    const letter = count === 0 ? '' : String.fromCharCode(64 + count); // 1 -> A, 2 -> B, etc.
    
    return `${type}${letter}${dayLetter}${dayNumber}`;
  };

  const handleCreateLoad = async () => {
    if (!newLoadBatchId) {
      showToast("Selecione um lote para registrar a movimentação.", "error");
      return;
    }

    if (processingRef.current) return;
    processingRef.current = true;

    // Close modal immediately for "instant" feel
    setShowAddModal(false);
    setIsProcessing(true);
    
    try {
      const selectedBatch = activeBatches.find(b => b.id === newLoadBatchId);
      const selectedEntity = entities.find(e => e.id === newLoadEntityId);

      const success = await createLoad({
        loadId: generateLoadId(newLoadType),
        type: newLoadType,
        quantity: Number(newLoadQty.replace(/\./g, '').replace(',', '.')) || 0,
        currentQty: Number(newLoadQty.replace(/\./g, '').replace(',', '.')) || 0,
        client: selectedEntity ? selectedEntity.name : newLoadClient.toUpperCase(),
        entityId: newLoadEntityId || undefined,
        totalTrips: selectedEntity ? 2 : undefined,
        totalDistanceKm: selectedEntity ? selectedEntity.distanceKm * 2 : undefined,
        step: 1
      }, {
        id: newLoadBatchId,
        name: selectedBatch?.name || ''
      });
      
      if (!success) {
        showToast("Erro ao iniciar nova carga. Verifique sua conexão.", "error");
        setShowAddModal(true);
      } else {
        showToast("Nova carga iniciada com sucesso!", "success");
        setNewLoadQty('');
        setNewLoadClient('');
        setNewLoadEntityId('');
        setNewLoadBatchId(activeBatches.length === 1 ? activeBatches[0].id : '');
      }
    } catch (error) {
      showToast("Erro ao iniciar nova carga.", "error");
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleSyncQty = async (load: Load, targetQty: number) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);
    try {
      const success = await syncLoadQtyWithStock(load.id, targetQty, load.type, load.currentQty, load.step);
      if (!success) {
        showToast("Erro ao sincronizar quantidade.", "error");
      }
    } catch (error) {
      showToast("Erro ao processar alteração.", "error");
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleUpdateStepManual = async (load: Load, targetStep: number) => {
    if (processingRef.current) return;
    if (targetStep === load.step) return;
    processingRef.current = true;
    
    // Garantir que o passo esteja no intervalo válido (1-7)
    const validTarget = Math.max(1, Math.min(7, targetStep));
    if (validTarget === load.step) {
      processingRef.current = false;
      return;
    }

    // Se estiver avançando e for um passo que exige dados, precisa validar
    if (validTarget > load.step) {
      if (load.step === 3 && validTarget > 3) {
        const color = colorInput[load.id] || '';
        const humidity = parseFloat(humidityInput[load.id]?.replace(',', '.') || '');
        if (!color || isNaN(humidity)) {
          showToast("Preencha cor e umidade antes de prosseguir.", "error");
          processingRef.current = false;
          return;
        }
      }
      if (load.step === 5 && validTarget > 5) {
        const weight = parseFloat(weightInput[load.id]?.replace(/\./g, '').replace(',', '.') || '');
        if (isNaN(weight) || weight <= 0) {
          showToast("Informe o peso antes de prosseguir.", "error");
          processingRef.current = false;
          return;
        }
      }
      if (load.step === 6 && validTarget > 6) {
        const invoice = invoiceInput[load.id] || load.invoice || '';
        if (!invoice.trim()) {
          showToast("Informe a Nota Fiscal antes de prosseguir.", "error");
          processingRef.current = false;
          return;
        }
      }
    }

    setIsProcessing(true);
    try {
      let extraData: any = undefined;
      if (load.step === 3 && validTarget > 3) {
        extraData = {
          color: colorInput[load.id] || '',
          humidity: parseFloat(humidityInput[load.id]?.replace(',', '.') || '')
        };
      } else if (load.step === 5 && validTarget > 5) {
        extraData = {
          weight: parseFloat(weightInput[load.id]?.replace(/\./g, '').replace(',', '.') || ''),
          driverName: driverInput[load.id] || '',
          vehiclePlate: plateInput[load.id] || ''
        };
      } else if (load.step === 6 && validTarget > 6) {
        extraData = {
          invoice: invoiceInput[load.id] || ''
        };
      }

      const success = await updateLoadStep(load, validTarget, extraData);
      if (success) {
        showToast(`Movido para etapa ${validTarget}`, "success");
      } else {
        showToast("Erro ao mudar etapa.", "error");
      }
    } catch (error) {
      showToast("Erro ao processar mudança de etapa.", "error");
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleNextStep = async (load: Load) => {
    if (processingRef.current) return;
    if (load.step === 7) {
      setConfirmFinalize(load);
      return;
    }
    handleUpdateStepManual(load, load.step + 1);
  };

  const handlePrevStep = async (load: Load) => {
    if (processingRef.current) return;
    if (load.step <= 1) return;
    handleUpdateStepManual(load, load.step - 1);
  };

  const handleFinalize = async () => {
    if (!confirmFinalize) return;
    if (processingRef.current) return;
    processingRef.current = true;
    const loadId = confirmFinalize.id;
    setConfirmFinalize(null);
    
    setIsProcessing(true);
    try {
      const success = await finalizeLoad(loadId);
      if (success) {
        showToast("Carga finalizada com sucesso!", "success");
      } else {
        showToast("Erro ao finalizar carga.", "error");
      }
    } catch (error) {
      showToast("Erro ao processar finalização.", "error");
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    if (processingRef.current) return;
    processingRef.current = true;
    const loadId = confirmDelete.id;
    setConfirmDelete(null);
    
    setIsProcessing(true);
    try {
      const success = await deleteLoad(loadId);
      if (success) {
        showToast("Carga excluída com sucesso!", "success");
      } else {
        showToast("Erro ao excluir carga.", "error");
      }
    } catch (error) {
      showToast("Erro ao processar exclusão.", "error");
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleReset = async () => {
    setShowResetConfirm(false);
    setIsProcessing(true);
    try {
      const success = await resetActiveLoadsAndStock();
      if (success) {
        showToast("Estoque e cargas zerados com sucesso!", "success");
      } else {
        showToast("Erro ao zerar contadores.", "error");
      }
    } catch (error) {
      showToast("Erro ao processar solicitação.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdjustField = (field: keyof StockData, label: string) => {
    const currentVal = stock[field] || 0;
    setAdjustingStock({ field, label });
    setAdjustValue(currentVal.toString());
  };

  const confirmAdjust = async () => {
    if (!adjustingStock || adjustValue === "" || isNaN(Number(adjustValue))) return;
    
    const newVal = Number(adjustValue);
    if (newVal < 0 && adjustingStock.field !== 'branStock') {
      showToast("O estoque não pode ser negativo.", "error");
      return;
    }

    const { field, label } = adjustingStock;
    setAdjustingStock(null);
    
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);
    
    try {
      const success = await saveStock({ ...stock, [field]: newVal });
      if (success) {
        showToast(`Estoque de ${label} atualizado para ${newVal}!`, "success");
      } else {
        showToast(`Erro ao atualizar ${label}.`, "error");
      }
    } catch (error) {
      showToast("Erro ao salvar alteração.", "error");
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleIncrement = async (load: Load) => {
    handleSyncQty(load, load.currentQty + 1);
  };

  const handleDecrement = async (load: Load) => {
    if (load.currentQty <= 0) return;
    handleSyncQty(load, load.currentQty - 1);
  };

  const handleFileChange = async (loadId: string, file: File | null) => {
    if (!file) return;
    
    if (file.size > 600 * 1024) {
      showToast("Arquivo muito grande. Máximo 600KB.", "error");
      return;
    }

    const isPdf = file.type === 'application/pdf';
    const isImg = file.type.startsWith('image/');

    if (!isPdf && !isImg) {
      showToast("Apenas PDF ou imagens são permitidos.", "error");
      return;
    }

    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const success = await updateLoadAttachment(loadId, {
          name: file.name,
          data: base64,
          uploadedAt: Date.now(),
          size: file.size
        });
        if (success) showToast("Anexo salvo com sucesso!", "success");
        else showToast("Erro ao salvar anexo.", "error");
        processingRef.current = false;
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showToast("Erro ao processar arquivo.", "error");
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleRemoveAttachment = async (loadId: string) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);
    const success = await updateLoadAttachment(loadId, null);
    if (success) showToast("Anexo removido.", "success");
    else showToast("Erro ao remover anexo.", "error");
    processingRef.current = false;
    setIsProcessing(false);
  };

  // Cleanup expired attachments (72h)
  useEffect(() => {
    const checkExpirations = async () => {
      const now = Date.now();
      const seventyTwoHours = 72 * 60 * 60 * 1000;
      
      for (const load of loads) {
        if (load.attachment?.uploadedAt) {
          if (now - load.attachment.uploadedAt > seventyTwoHours) {
            // Silently remove expired attachment
            await updateLoadAttachment(load.id, null);
          }
        }
      }
    };

    checkExpirations();
    const interval = setInterval(checkExpirations, 1000 * 60 * 30); // Check every 30 mins
    
    return () => clearInterval(interval);
  }, [loads]);

  const activeLoads = loads.filter(l => l.status === 'ATIVO');
  const finalizedLoads = loads.filter(l => l.status === 'FINALIZADO');

  const toggleMinimize = (loadId: string) => {
    setMinimizedLoads(prev => {
      const next = new Set(prev);
      if (next.has(loadId)) next.delete(loadId);
      else next.add(loadId);
      return next;
    });
  };

  const activeBatchStats = activeBatches.map(batch => {
    const batchLoads = finalizedLoads.filter(l => l.batchId === batch.id);
    const weight = batchLoads.reduce((acc: number, curr) => acc + (curr.weight || 0), 0);
    const count = batchLoads.length;
    const bagsByType = batchLoads.reduce((acc, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + (curr.currentQty || 0);
      return acc;
    }, {} as Record<string, number>);
    const totalBags = Object.values(bagsByType).reduce((acc: number, curr: number) => acc + curr, 0);

    return {
      batch,
      weight,
      count,
      bagsByType,
      totalBags
    };
  });

  const totalExpedited = finalizedLoads.reduce((acc: number, curr) => acc + (curr.weight || 0), 0);
  const totalLoadsCount = finalizedLoads.length;

  return (
    <div className="w-full px-4 sm:px-4 pb-12 animate-fadeIn font-inter flex flex-col h-full bg-slate-50 min-h-screen">
      
      {/* Header Fixo */}
      <div className="flex items-center justify-between mb-4 pt-4 sticky top-0 bg-slate-50 z-10 pb-2 px-1 sm:px-0">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 sm:p-2.5 mr-2 sm:mr-3 bg-white rounded-xl border border-slate-200 shadow-sm active:scale-95 transition-all text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight uppercase leading-none">Saída Farinha</h2>
            <p className="text-[7px] sm:text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">Gestão de Farinhas</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAddModal(true)} 
            className="bg-[#2563eb] text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-2"
          >
             <Plus className="w-5 h-5" />
             <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Nova Carga</span>
          </button>
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
        {activeBatchStats.map(({ batch, weight, count, bagsByType, totalBags }, index) => {
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-1 w-full">
               <div className={`bg-white p-2 rounded-none border ${c.innerBorder} flex flex-col justify-center`}>
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Expedido</span>
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
               <div className={`bg-white p-2 rounded-none border ${c.innerBorder} flex flex-col justify-center`}>
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Bags</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className={`text-sm font-black ${c.valueText} tabular-nums`}>{totalBags}</span>
                    <span className="text-[7px] font-bold text-slate-400 uppercase">Un</span>
                  </div>
               </div>
               <div className={`bg-white p-2 rounded-none border ${c.innerBorder} flex items-center justify-around gap-1`}>
                  <div className="text-center">
                    <span className="text-[7px] font-black text-blue-500 uppercase block leading-none">ESP</span>
                    <span className="text-xs font-black text-slate-700 tabular-nums">{bagsByType['E'] || 0}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[7px] font-black text-emerald-500 uppercase block leading-none">COM</span>
                    <span className="text-xs font-black text-slate-700 tabular-nums">{bagsByType['C'] || 0}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[7px] font-black text-red-500 uppercase block leading-none">INT</span>
                    <span className="text-xs font-black text-slate-700 tabular-nums">{bagsByType['I'] || 0}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[7px] font-black text-slate-900 uppercase block leading-none">COL</span>
                    <span className="text-xs font-black text-slate-700 tabular-nums">{bagsByType['CL'] || 0}</span>
                  </div>
               </div>
            </div>
          </div>
        )})}
      </div>

      {/* Resumo Rápido Estoque */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-6">
          <button 
            onClick={() => handleAdjustField('special', 'Especial')}
            disabled={isProcessing}
            className="bg-white p-2.5 rounded-2xl border border-slate-200 text-center shadow-sm hover:bg-slate-50 transition-colors active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center relative group"
            title="Ajustar Estoque"
          >
             <Settings className="absolute top-1.5 right-1.5 w-2.5 h-2.5 text-slate-200 group-hover:text-blue-500 transition-colors" />
             <span className="text-[8px] font-black text-blue-600 block uppercase mb-0.5">ESP</span>
             <span className="text-base font-black text-slate-700">{stock.special}</span>
          </button>
          <button 
            onClick={() => handleAdjustField('common', 'Comum')}
            disabled={isProcessing}
            className="bg-white p-2.5 rounded-2xl border border-slate-200 text-center shadow-sm hover:bg-slate-50 transition-colors active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center relative group"
            title="Ajustar Estoque"
          >
             <Settings className="absolute top-1.5 right-1.5 w-2.5 h-2.5 text-slate-200 group-hover:text-emerald-500 transition-colors" />
             <span className="text-[8px] font-black text-emerald-600 block uppercase mb-0.5">COM</span>
             <span className="text-base font-black text-slate-700">{stock.common}</span>
          </button>
          <button 
            onClick={() => handleAdjustField('whole', 'Inteira')}
            disabled={isProcessing}
            className="bg-white p-2.5 rounded-2xl border border-slate-200 text-center shadow-sm hover:bg-slate-50 transition-colors active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center relative group"
            title="Ajustar Estoque"
          >
             <Settings className="absolute top-1.5 right-1.5 w-2.5 h-2.5 text-slate-200 group-hover:text-red-500 transition-colors" />
             <span className="text-[8px] font-black text-red-600 block uppercase mb-0.5">INT</span>
             <span className="text-base font-black text-slate-700">{stock.whole}</span>
          </button>
          <button 
            onClick={() => handleAdjustField('glue', 'Cola')}
            disabled={isProcessing}
            className="bg-white p-2.5 rounded-2xl border border-slate-200 text-center shadow-sm hover:bg-slate-50 transition-colors active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center relative group"
            title="Ajustar Estoque"
          >
             <Settings className="absolute top-1.5 right-1.5 w-2.5 h-2.5 text-slate-200 group-hover:text-slate-900 transition-colors" />
             <span className="text-[8px] font-black text-slate-900 block uppercase mb-0.5">COL</span>
             <span className="text-base font-black text-slate-700">{stock.glue}</span>
          </button>
          <button 
            onClick={() => handleAdjustField('branStock', 'Farelo')}
            disabled={isProcessing}
            className="bg-white p-2.5 rounded-2xl border border-slate-200 text-center shadow-sm hover:bg-slate-50 transition-colors active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center relative group"
            title="Ajustar Estoque"
          >
             <Settings className="absolute top-1.5 right-1.5 w-2.5 h-2.5 text-slate-200 group-hover:text-stone-800 transition-colors" />
             <span className="text-[8px] font-black text-stone-600 block uppercase mb-0.5">FAR</span>
             <span className="text-base font-black text-slate-700">{stock.branStock}</span>
          </button>
          <div 
            className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-2xl text-center shadow-sm flex flex-col items-center justify-center select-none"
            title="Farinha de Devolução Pendente a Amortizar"
          >
             <span className="text-[8px] font-black text-indigo-700 block uppercase mb-0.5">Pendente</span>
             <span className="text-sm font-black text-indigo-900">{(stock.returnFlourBalance || 0).toLocaleString('pt-BR')} <span className="text-[9px] text-indigo-500 font-bold">kg</span></span>
          </div>
      </div>

      {/* Seção de Cargas Ativas */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4 ml-1">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cargas Ativas</h3>
           <div className="h-[1px] flex-grow bg-slate-200/60"></div>
           <span className="bg-blue-100 text-blue-600 text-[9px] font-black px-2 py-0.5 rounded-full">{activeLoads.length}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {activeLoads.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-12 opacity-30 flex flex-col items-center bg-white rounded-[2rem] border border-dashed border-slate-300 col-span-full"
              >
                 <Truck className="w-12 h-12 mb-2 text-slate-400" />
                 <p className="font-black text-[10px] uppercase tracking-widest">Nenhuma carga em andamento</p>
              </motion.div>
            ) : [...activeLoads].sort((a, b) => {
              const aMin = minimizedLoads.has(a.id);
              const bMin = minimizedLoads.has(b.id);
              if (aMin && !bMin) return 1;
              if (!aMin && bMin) return -1;
              return 0;
            }).map(load => (
              <motion.div
                key={load.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <LoadCard 
                  load={load} 
                  isProcessing={isProcessing}
                  isMinimized={minimizedLoads.has(load.id)}
                  onToggleMinimize={() => toggleMinimize(load.id)}
                  onNext={() => handleNextStep(load)} 
                  onPrev={() => handlePrevStep(load)}
                  onStepClick={(step) => handleUpdateStepManual(load, step)}
                  onIncrement={() => handleIncrement(load)}
                  onDecrement={() => handleDecrement(load)}
                  onSyncQty={(qty) => handleSyncQty(load, qty)}
                  onShowMinuta={() => setShowMinuta(load)}
                  onDelete={() => setConfirmDelete(load)}
                  onFileChange={handleFileChange}
                  onRemoveAttachment={handleRemoveAttachment}
                  weightInput={weightInput} 
                  setWeightInput={setWeightInput} 
                  driverInput={driverInput}
                  setDriverInput={setDriverInput}
                  plateInput={plateInput}
                  setPlateInput={setPlateInput}
                  colorInput={colorInput}
                  setColorInput={setColorInput}
                  humidityInput={humidityInput}
                  setHumidityInput={setHumidityInput}
                  invoiceInput={invoiceInput}
                  setInvoiceInput={setInvoiceInput}
                  drivers={drivers}
                  stock={stock}
                  showToast={showToast}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Seção de Histórico */}
      <div>
        <div className="flex items-center gap-3 mb-4 ml-1">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Finalizadas Recentemente</h3>
           <div className="h-[1px] flex-grow bg-slate-200/60"></div>
           <span className="bg-slate-200 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded-full">{finalizedLoads.length}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {finalizedLoads.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 opacity-20 col-span-full"
              >
                 <p className="font-black text-[9px] uppercase tracking-widest">Histórico vazio</p>
              </motion.div>
            ) : finalizedLoads.slice(0, 10).map(load => (
              <motion.div 
                key={load.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-2.5 sm:p-3 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between"
              >
                 <div className="flex items-center gap-3 sm:gap-4">
                   <ProductBadge type={load.type} size="sm" />
                   <div>
                     <h4 className="text-sm sm:text-base font-black text-slate-800 uppercase leading-none mb-1">{load.loadId}</h4>
                     {load.client && (
                       <p className="text-[9px] font-black text-blue-600 uppercase tracking-wider mb-0.5">
                         Cliente: {load.client}
                       </p>
                     )}
                     {(load.driverName || load.vehiclePlate) && (
                       <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                         {load.driverName && `Mot: ${load.driverName}`}
                         {load.driverName && load.vehiclePlate && ' | '}
                         {load.vehiclePlate && `Placa: ${load.vehiclePlate}`}
                       </p>
                     )}
                     <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                       {load.quantity} Bags • {load.weight ? `${load.weight.toLocaleString('pt-BR')} kg` : 'Sem peso'}
                     </p>
                   </div>
                 </div>
                 <div className="flex flex-col items-end gap-2 pr-1 sm:pr-2">
                   <div className="text-right">
                     <span className="text-[7px] sm:text-[8px] font-black text-slate-300 uppercase block mb-0.5 sm:mb-1">Finalizada</span>
                     <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase">
                       {load.updatedAt?.toDate ? new Date(load.updatedAt.toDate()).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '--/--'}
                     </span>
                   </div>
                   <div className="flex flex-row items-center gap-1">
                     <button 
                       onClick={() => setConfirmDelete(load)}
                       className="p-1 px-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                       title="Excluir Registro"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                     <button 
                       onClick={() => setShowMinuta(load)}
                       className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors"
                     >
                       MINUTA
                     </button>
                   </div>
                 </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal Adicionar Carga */}
      <AnimatePresence>
        {showAddModal && (() => {
          const activeTheme = {
            E: { bg: 'bg-[#2563eb]', border: 'border-[#2563eb]', text: 'text-[#2563eb]', focus: 'focus:border-[#2563eb]', lightBg: 'bg-blue-50', lightBorder: 'border-blue-100', hoverBorder: 'hover:border-[#2563eb]' },
            C: { bg: 'bg-[#10b981]', border: 'border-[#10b981]', text: 'text-[#10b981]', focus: 'focus:border-[#10b981]', lightBg: 'bg-emerald-50', lightBorder: 'border-emerald-100', hoverBorder: 'hover:border-[#10b981]' },
            I: { bg: 'bg-[#ef4444]', border: 'border-[#ef4444]', text: 'text-[#ef4444]', focus: 'focus:border-[#ef4444]', lightBg: 'bg-red-50', lightBorder: 'border-red-100', hoverBorder: 'hover:border-[#ef4444]' },
            CL: { bg: 'bg-[#334155]', border: 'border-[#334155]', text: 'text-[#334155]', focus: 'focus:border-[#334155]', lightBg: 'bg-slate-100', lightBorder: 'border-slate-200', hoverBorder: 'hover:border-[#334155]' }
          }[newLoadType] || { bg: 'bg-[#2563eb]', border: 'border-[#2563eb]', text: 'text-[#2563eb]', focus: 'focus:border-[#2563eb]', lightBg: 'bg-blue-50', lightBorder: 'border-blue-100', hoverBorder: 'hover:border-[#2563eb]' };

          return (
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
              className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden relative z-10 my-auto"
            >
              <div className={`${activeTheme.bg} p-6 text-white text-center relative transition-colors duration-300`}>
                <h3 className="text-xl font-black uppercase tracking-widest">Nova Carga</h3>
                <button onClick={() => setShowAddModal(false)} className="absolute right-6 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
                 {/* Seleção de Lote */}
                 <div className={`${activeTheme.lightBg} p-4 rounded-2xl border ${activeTheme.lightBorder} transition-colors duration-300`}>
                   <label className={`text-[9px] font-black ${activeTheme.text} uppercase tracking-widest mb-2 block transition-colors duration-300`}>Para qual lote deseja registrar esta movimentação?</label>
                   <div className="grid grid-cols-2 gap-2">
                     {loadingBatches ? (
                       <div className={`col-span-full py-2 text-center ${activeTheme.text} font-bold text-[10px] uppercase flex items-center justify-center gap-2`}>
                         <RefreshCw className="animate-spin w-3 h-3" />
                         Carregando...
                       </div>
                     ) : activeBatches.length === 0 ? (
                       <div className="col-span-full py-6 text-center text-red-500 font-bold text-[10px] uppercase bg-white rounded-xl border border-dashed border-red-200">
                         Nenhum lote ativo encontrado.
                         <p className="mt-1 text-[8px] opacity-70">Crie um lote no menu de Lotes antes de iniciar cargas.</p>
                       </div>
                     ) : activeBatches.map(batch => (
                       <button
                         key={batch.id}
                         onClick={() => setNewLoadBatchId(batch.id)}
                         className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between ${
                           newLoadBatchId === batch.id 
                             ? `${activeTheme.bg} ${activeTheme.border} text-white shadow-md` 
                             : `bg-white border-slate-100 text-slate-600 ${activeTheme.hoverBorder}`
                         }`}
                       >
                         <div className="flex items-center gap-2">
                           <Package size={14} className={newLoadBatchId === batch.id ? 'text-white' : activeTheme.text} />
                           <span className="font-black text-[10px] tracking-tight uppercase">{batch.name}</span>
                         </div>
                         {newLoadBatchId === batch.id && <CheckCircle2 size={12} />}
                       </button>
                     ))}
                   </div>
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tipo da Farinha</label>
                    <div className="grid grid-cols-2 gap-2">
                       {(['E', 'C', 'I', 'CL'] as LoadType[]).map(t => {
                          const isSelected = newLoadType === t;
                          const tTheme = {
                            E: { bg: 'bg-[#2563eb]', border: 'border-[#2563eb]' },
                            C: { bg: 'bg-[#10b981]', border: 'border-[#10b981]' },
                            I: { bg: 'bg-[#ef4444]', border: 'border-[#ef4444]' },
                            CL: { bg: 'bg-[#334155]', border: 'border-[#334155]' }
                          }[t];
                          
                          return (
                            <button 
                              key={t} 
                              onClick={() => setNewLoadType(t)} 
                              className={`py-3 rounded-2xl border-2 transition-all font-black text-xs uppercase ${isSelected ? `${tTheme?.bg} ${tTheme?.border} text-white shadow-lg` : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                            >
                              {TYPE_MAP[t].name}
                            </button>
                          );
                       })}
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Quantidade Inicial (Bags)</label>
                    <input 
                      type="number" 
                      value={newLoadQty} 
                      onChange={e => setNewLoadQty(e.target.value)} 
                      placeholder="0"
                      className={`w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-3xl font-black text-center ${activeTheme.text} outline-none ${activeTheme.focus} transition-all`} 
                    />
                 </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Cliente / Destino</label>
                    <select 
                      required
                      value={newLoadEntityId}
                      onChange={(e) => {
                        const id = e.target.value;
                        const entity = entities.find(ent => ent.id === id);
                        if (entity) {
                          setNewLoadEntityId(id);
                          setNewLoadClient(entity.name);
                        } else {
                          setNewLoadEntityId('');
                          setNewLoadClient('');
                        }
                      }}
                      className={`w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center text-lg font-black text-slate-800 outline-none focus:bg-white ${activeTheme.focus} transition-all appearance-none`}
                    >
                      <option value="">SELECIONE UM CLIENTE</option>
                      {entities.filter(e => e.type === 'CLIENTE' || e.type === 'AMBOS').map(ent => (
                        <option key={ent.id} value={ent.id}>{ent.name}</option>
                      ))}
                    </select>
                    {!newLoadEntityId && (
                      <input 
                        type="text" 
                        value={newLoadClient} 
                        onChange={e => setNewLoadClient(e.target.value.toUpperCase())} 
                        placeholder="OU DIGITE O NOME MANUALMENTE"
                        className={`w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-lg font-black text-center text-slate-700 outline-none ${activeTheme.focus} transition-all`} 
                      />
                    )}
                  </div>
                 
                 <div className="flex gap-2 sticky bottom-0 bg-white pt-4 border-t border-slate-50">
                    <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] text-slate-400">Cancelar</button>
                    <button 
                      onClick={handleCreateLoad} 
                      disabled={isProcessing || !newLoadBatchId} 
                      className={`flex-[2] ${activeTheme.bg} text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 disabled:opacity-50 transition-all`}
                    >
                      Iniciar Carga
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
          );
        })()}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={!!confirmFinalize}
        onClose={() => setConfirmFinalize(null)}
        onConfirm={handleFinalize}
        title="Finalizar Carga"
        message={`Deseja realmente finalizar a carga ${confirmFinalize?.loadId}? Ela será movida para o histórico.`}
        confirmText="Finalizar"
        variant="primary"
      />

      <ConfirmModal 
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Excluir Carga"
        message={`Deseja realmente excluir a carga ${confirmDelete?.loadId}? O estoque será ajustado automaticamente.`}
        confirmText="Excluir"
        variant="danger"
      />

      <MinutaModal 
        isOpen={!!showMinuta}
        onClose={() => setShowMinuta(null)}
        load={showMinuta}
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

// Helper para transformar links do ImgBB em links diretos
const getDirectImgUrl = (url?: string) => {
  if (!url) return undefined;
  // Se for um link de página do ImgBB, tenta converter para o link direto da imagem
  if (url.includes('ibb.co') && !url.includes('i.ibb.co')) {
    const code = url.split('/').pop();
    // O ImgBB usa i.ibb.co/CODE/image.png para links diretos
    return `https://i.ibb.co/${code}/image.png`;
  }
  return url;
};

// Componente de Selo de Produto (Recriando o Logo Mocca via CSS/SVG ou Imagem)
const ProductBadge: React.FC<{ type: LoadType; size?: 'sm' | 'md' | 'lg' }> = ({ type, size = 'md' }) => {
  const meta = TYPE_MAP[type];
  const [imgError, setImgError] = React.useState(false);
  const directUrl = getDirectImgUrl(meta.imgUrl);
  
  const sizes = {
    sm: { container: 'w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2', font: 'text-lg sm:text-xl', wheat: 'w-7 h-7 sm:w-8 sm:h-8', label: 'text-[4px] sm:text-[5px]', m: 'text-lg sm:text-xl', p: 'p-2' },
    md: { container: 'w-20 h-20 sm:w-24 sm:h-24 rounded-[1.8rem] sm:rounded-[2.2rem] border-4', font: 'text-3xl sm:text-4xl', wheat: 'w-12 h-12 sm:w-14 sm:h-14', label: 'text-[6px] sm:text-[7px]', m: 'text-3xl sm:text-4xl', p: 'p-4' },
    lg: { container: 'w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4', font: 'text-4xl sm:text-5xl', wheat: 'w-14 h-14 sm:w-16 sm:h-16', label: 'text-[7px] sm:text-[8px]', m: 'text-4xl sm:text-5xl', p: 'p-5' }
  };
  const s = sizes[size];

  // Se temos uma imagem e ela não deu erro, mostramos apenas a imagem
  const showImage = directUrl && !imgError;

  return (
    <div className={`${s.container} ${showImage ? 'bg-white' : meta.bg} border-white shadow-lg flex flex-col items-center justify-center relative overflow-hidden`}>
       {/* Efeito de Brilho Animado (Otimizado) */}
       <motion.div 
         initial={{ x: '-100%' }}
         animate={{ x: '100%' }}
         transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 4 }}
         className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none skew-x-12 z-20"
       />
       
      {showImage ? (
        <div className={`w-full h-full ${s.p} flex items-center justify-center z-10`}>
          <img 
            src={directUrl} 
            alt={meta.name} 
            className="w-full h-full object-contain p-0.5"
            style={{ imageRendering: 'auto', WebkitFontSmoothing: 'antialiased' }}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
         <>
           {/* Ícone de Trigo (SVG detalhado para parecer o logo) */}
           <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className={meta.color}>
                 <path d="M6 18c0-3 2-6 6-6s6 3 6 6M12 12V2M8 5l4 4 4-4" />
              </svg>
           </div>

           {/* Letra M Estilizada */}
           <div className="relative z-10 flex flex-col items-center">
              <span className={`${s.m} font-black ${meta.color} tracking-tighter leading-none`}>M</span>
              <span className={`${s.label} font-black ${meta.color} uppercase tracking-[0.2em] -mt-0.5`}>MOCCA</span>
           </div>
         </>
       )}

       {/* Faixa Inferior com Nome do Tipo (Targa) - Sempre visível */}
       <div className={`absolute bottom-0 left-0 right-0 ${meta.accent} py-0.5 z-40`}>
          <span className={`${s.label} font-black text-white uppercase tracking-[0.1em] block text-center`}>{meta.name}</span>
       </div>
    </div>
  );
};

// Componente do Card de Carga com Timeline e Contador Dinâmico
const LoadCard: React.FC<{ 
  load: Load; 
  isProcessing: boolean;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  onNext: () => void | Promise<void>; 
  onPrev: () => void | Promise<void>;
  onStepClick: (step: number) => void | Promise<void>;
  onIncrement: () => void | Promise<void>;
  onDecrement: () => void | Promise<void>;
  onSyncQty: (qty: number) => void | Promise<void>;
  onShowMinuta: () => void;
  onDelete: () => void;
  onFileChange: (loadId: string, file: File | null) => void;
  onRemoveAttachment: (loadId: string) => void;
  weightInput: Record<string, string>; 
  setWeightInput: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  driverInput: Record<string, string>;
  setDriverInput: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  plateInput: Record<string, string>;
  setPlateInput: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  colorInput: Record<string, string>;
  setColorInput: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  humidityInput: Record<string, string>;
  setHumidityInput: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  invoiceInput: Record<string, string>;
  setInvoiceInput: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  drivers: Driver[];
  stock: StockData;
  showToast: (msg: string, type?: ToastType) => void;
}> = ({ load, isProcessing, isMinimized, onToggleMinimize, onNext, onPrev, onStepClick, onIncrement, onDecrement, onSyncQty, onShowMinuta, onDelete, onFileChange, onRemoveAttachment, weightInput, setWeightInput, driverInput, setDriverInput, plateInput, setPlateInput, colorInput, setColorInput, humidityInput, setHumidityInput, invoiceInput, setInvoiceInput, drivers, stock, showToast }) => {
  const meta = TYPE_MAP[load.type];
  
  const [localQty, setLocalQty] = React.useState(load.currentQty.toString());
  const [isEditingQty, setIsEditingQty] = React.useState(false);

  React.useEffect(() => {
    if (!isEditingQty) setLocalQty(load.currentQty.toString());
  }, [load.currentQty, isEditingQty]);

  const handleQtyBlur = () => {
    setIsEditingQty(false);
    const val = parseInt(localQty);
    if (!isNaN(val) && val !== load.currentQty && val >= 0) {
      onSyncQty(val);
    } else {
      setLocalQty(load.currentQty.toString());
    }
  };
  
  const isExpired = load.attachment?.uploadedAt ? (Date.now() - load.attachment.uploadedAt > 72 * 60 * 60 * 1000) : false;

  const handleDownload = () => {
    if (!load.attachment) return;
    const link = document.createElement('a');
    link.href = load.attachment.data;
    link.download = load.attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!load.attachment) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const isImg = load.attachment.data.startsWith('data:image/') || 
                    /\.(png|jpe?g|gif|webp)$/i.test(load.attachment.name);
      
      const content = isImg 
        ? `<img src="${load.attachment.data}">`
        : `<embed src="${load.attachment.data}" type="application/pdf">`;

      printWindow.document.write(`
        <html>
          <head>
            <title>Imprimir Anexo</title>
            <style>
              body, html { margin: 0; padding: 0; height: 100%; width: 100%; display: flex; align-items: center; justify-content: center; background: #fff; overflow: auto; }
              embed { width: 100%; height: 100%; border: none; }
              img { max-width: 100%; max-height: 100%; object-fit: contain; }
            </style>
          </head>
          <body>
            ${content}
          </body>
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
              }, 500);
            };
          </script>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const [isPrintingInspecao, setIsPrintingInspecao] = React.useState(false);
  
  const handlePrintInspecaoVeicular = async () => {
    if (isPrintingInspecao) return;
    setIsPrintingInspecao(true);
    showToast('Buscando documento de Inspeção Veicular...', 'info');
    
    try {
      const inpecaoDoc = await findInspecaoVeicularDoc();
      
      if (!inpecaoDoc) {
        showToast('Documento de Inspeção Veicular não encontrado nos arquivos Mocca.', 'error');
        setIsPrintingInspecao(false);
        return;
      }
      
      const fullData = await fetchMoccaDocumentData(inpecaoDoc.id, !!inpecaoDoc.isChunked, inpecaoDoc.fileData);
      
      const parts = fullData.split(';base64,');
      if (parts.length < 2) {
        throw new Error('Formato de dados base64 inválido.');
      }
      const contentType = parts[0].split(':')[1] || 'application/pdf';
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      
      const blob = new Blob([uInt8Array], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
            document.body.removeChild(iframe);
          }, 5000);
        } catch (e) {
          console.warn("Iframe printing blocked or failed, opening in new window:", e);
          window.open(blobUrl, '_blank');
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        }
      };
    } catch (err) {
      console.error("Error fetching inspection doc:", err);
      showToast('Erro ao carregar documento PDF.', 'error');
    } finally {
      setIsPrintingInspecao(false);
    }
  };

  if (isMinimized) {
    return (
      <motion.div 
        layout
        className={`bg-white rounded-3xl border ${meta.border} shadow-md overflow-hidden relative p-3 flex items-center justify-between group cursor-pointer hover:shadow-lg transition-all`}
        onClick={onToggleMinimize}
      >
        <div className="flex items-center gap-3">
          <ProductBadge type={load.type} size="sm" />
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase leading-none mb-1">{load.loadId}</h3>
            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none">
              Etapa {load.step}/7 • {load.currentQty} Bags
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
            <span className="text-[8px] font-black text-slate-400 uppercase">Status:</span>
            <span className="text-[8px] font-black text-blue-600 uppercase">Em Andamento</span>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggleMinimize?.();
            }}
            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`bg-white rounded-[2.5rem] border ${meta.border} shadow-lg overflow-hidden relative max-w-[420px] mx-auto sm:max-w-none w-full transition-all duration-500`}>
       {/* Top Row com Selo de Produto */}
       <div className="p-5 flex justify-between items-center bg-white border-b border-slate-50">
          <div className="flex gap-4 items-center min-w-0">
             <ProductBadge type={load.type} size="md" />
             <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-black text-slate-800 tracking-tight leading-none uppercase mb-1.5 truncate">{load.loadId}</h3>
                <div className="flex flex-col gap-1 text-[9px] sm:text-[10px]">
                   <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-black px-2 py-1 rounded-full ${meta.bg} ${meta.color} uppercase tracking-tighter border border-white shadow-sm shrink-0`}>
                         {meta.name}
                      </span>
                      {load.client && (
                        <span className="font-black text-blue-600 uppercase tracking-tighter truncate max-w-[120px]">
                          {load.client}
                        </span>
                      )}
                   </div>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
             <button 
               onClick={onDelete}
               disabled={isProcessing}
               className="p-2.5 rounded-xl bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100 active:scale-95 transition-all disabled:opacity-50"
               title="Excluir Carga"
             >
               <Trash2 className="w-5 h-5" />
             </button>
             <div className="bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100 flex flex-col items-center gap-1.5 min-w-[70px]">
                <button 
                  onClick={onToggleMinimize}
                  className="bg-white border border-slate-200 p-1.5 rounded-lg shadow-sm active:scale-95 transition-all w-full flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-200"
                  title="Minimizar"
                >
                  <Minus size={14} />
                </button>
                <button 
                  onClick={onShowMinuta}
                  className="bg-white border border-slate-200 px-2 py-1 rounded-lg shadow-sm active:scale-95 transition-all w-full"
                >
                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter block text-center">MINUTA</span>
                </button>
                <div className="text-center">
                  <span className="text-lg font-black text-slate-700 leading-none">{load.step}<span className="text-slate-300 text-xs">/7</span></span>
                </div>
             </div>
          </div>
       </div>

       {/* Timeline Visual */}
       <div className="px-5 pb-4 pt-3 border-b border-slate-50">
          <div className="flex justify-between items-center relative py-3 mx-1">
             <div className="absolute h-1 bg-slate-100 left-0 right-0 top-1/2 -translate-y-1/2 z-0 rounded-full" />
             <div className="absolute h-1 bg-blue-500 left-0 top-1/2 -translate-y-1/2 z-0 transition-all duration-700 rounded-full" style={{ width: `${((load.step - 1) / 6) * 100}%` }} />
             
             {STEPS.map((s) => {
               const Icon = s.icon;
               const isDone = load.step > s.id;
               const isCurrent = load.step === s.id;
               
               return (
                 <button 
                   key={s.id} 
                   onClick={() => onStepClick(s.id)}
                   disabled={isProcessing}
                  className="relative z-10 flex flex-col items-center group cursor-pointer disabled:cursor-not-allowed"
                 >
                    <motion.div 
                      animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-500 ${isDone ? 'bg-blue-500 text-white shadow-sm' : isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-50 shadow-md' : 'bg-white border-2 border-slate-100 text-slate-200'} group-hover:scale-110`}
                    >
                      {isDone ? <Check size={12} /> : <Icon className="w-2.5 h-2.5" />}
                    </motion.div>
                 </button>
               );
             })}
          </div>
          <p className="text-center text-[9px] font-black text-blue-600 uppercase tracking-widest mt-2 mb-2">
            ETAPA {load.step}: {STEPS.find(s => s.id === load.step)?.label}
          </p>

          {(load.driverName || load.vehiclePlate) && (
             <div className="bg-slate-50 rounded-2xl p-2.5 mb-3 flex items-center justify-center gap-5 border border-slate-100 mx-1">
                <div className="flex items-center gap-2">
                   <Truck size={14} className="text-slate-400" />
                   <span className="text-xs font-black text-slate-500 uppercase truncate max-w-[120px]">{load.driverName || '---'}</span>
                </div>
                <div className="w-[1px] h-4 bg-slate-200" />
                <div className="flex items-center gap-2">
                   <Settings size={14} className="text-slate-400" />
                   <span className="text-xs font-black text-slate-500 uppercase">{load.vehiclePlate || '---'}</span>
                </div>
             </div>
          )}
       </div>

       {/* Attachment Section (Step 4 or if exists) */}
       {(load.step === 4 || load.attachment) && (
          <div className="px-3 pb-3">
              <div className={`p-4 rounded-2xl border-2 border-dashed transition-all ${load.attachment ? (isExpired ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100') : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${load.attachment ? (isExpired ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600') : 'bg-slate-200 text-slate-400'}`}>
                      <Microscope size={18} />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight leading-none mb-1 truncate">
                        {load.attachment ? (isExpired ? 'Anexo Expirado (72h)' : load.attachment.name) : 'Anexar análise alveográfica'}
                      </p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                        {load.attachment ? (isExpired ? 'O arquivo não está mais disponível' : `${(load.attachment.size / 1024).toFixed(1)} KB • Expira em 72h`) : 'PDF ou Imagem • Máximo 600KB'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {load.attachment ? (
                      <>
                        {!isExpired && (
                          <>
                            <button 
                              onClick={handlePrint}
                              className="p-2 bg-white text-emerald-600 rounded-xl border border-emerald-200 shadow-sm active:scale-90 transition-all"
                              title="Imprimir PDF"
                            >
                              <Printer size={18} />
                            </button>
                            <button 
                              onClick={handleDownload}
                              className="p-2 bg-white text-blue-600 rounded-xl border border-blue-200 shadow-sm active:scale-90 transition-all"
                              title="Baixar PDF"
                            >
                              <FileDown size={18} />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => onRemoveAttachment(load.id)}
                          className="p-2 bg-white text-red-500 rounded-xl border border-red-200 shadow-sm active:scale-90 transition-all"
                          title="Remover Anexo"
                        >
                          <FileX size={18} />
                        </button>
                      </>
                    ) : (
                      <label className="cursor-pointer p-2 bg-blue-600 text-white rounded-xl shadow-md active:scale-90 transition-all">
                        <FileUp size={18} />
                        <input 
                          type="file" 
                          accept="application/pdf,image/*" 
                          className="hidden" 
                          onChange={(e) => onFileChange(load.id, e.target.files?.[0] || null)}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Inspeção Veicular Fixed Print Button */}
              {load.attachment && !isExpired && (
                <div className="mt-3 p-4 rounded-2xl border-2 border-dashed bg-slate-50 border-slate-200 transition-all">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                        <ClipboardCheck size={18} />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight leading-none mb-1 truncate">
                          INSPEÇÃO VEICULAR
                        </p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                          Controle de Processo Nº 7.11
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                         onClick={handlePrintInspecaoVeicular}
                         disabled={isPrintingInspecao}
                         className="p-2 bg-white text-emerald-600 rounded-xl border border-emerald-200 shadow-sm active:scale-90 transition-all disabled:opacity-50"
                         title="Imprimir Inspeção Veicular"
                       >
                         <Printer size={18} />
                       </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
       {/* Dynamic Counting Area (Step 1) */}
       {load.step === 1 && (
         <div className="px-5 pb-5 pt-2">
            <div className="bg-slate-50/50 rounded-[2.5rem] p-6 border border-slate-100 flex flex-col items-center">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Contagem de Bags</span>
               
               <div className="flex items-center justify-between w-full max-w-[200px]">
                  <button 
                    onClick={onDecrement}
                    disabled={load.currentQty <= 0 || load.isAmortized || isProcessing}
                    className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex items-center justify-center text-slate-400 active:scale-95 transition-all disabled:opacity-50 hover:border-blue-200"
                  >
                    <Minus className="w-8 h-8" />
                  </button>
                  
                  <div className="text-center">
                     {isEditingQty ? (
                       <input 
                         autoFocus
                         disabled={isProcessing}
                         type="number"
                         value={localQty}
                         onChange={e => setLocalQty(e.target.value)}
                         onBlur={handleQtyBlur}
                         onKeyDown={e => e.key === 'Enter' && handleQtyBlur()}
                         className="w-20 bg-white border-2 border-blue-200 rounded-xl text-3xl font-black text-center text-slate-800 outline-none p-2"
                       />
                     ) : (
                       <motion.span 
                         key={load.currentQty}
                         onClick={() => {
                           if (isProcessing) return;
                           if (load.isAmortized) {
                             showToast("Carga amortizada. Desfaça a amortização para editar o número de bags.", "error");
                             return;
                           }
                           setIsEditingQty(true);
                         }}
                         className={`text-6xl font-black tabular-nums leading-none block tracking-tighter cursor-pointer hover:scale-110 transition-transform ${load.isAmortized ? 'text-slate-400' : 'text-slate-800'}`}
                       >
                          {load.currentQty}
                       </motion.span>
                     )}
                     <span className="text-[10px] font-black text-slate-300 block uppercase tracking-widest mt-2">Bags</span>
                  </div>
                  
                  <button 
                    onClick={onIncrement}
                    disabled={load.isAmortized || isProcessing}
                    className="w-14 h-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-200 flex items-center justify-center text-white active:scale-95 transition-all disabled:opacity-50 hover:bg-blue-700"
                  >
                    <Plus className="w-8 h-8" />
                  </button>
               </div>

               {/* Amortização da Farinha Pendente */}
               {((stock.returnFlourBalance || 0) > 0 || load.isAmortized) && (
                 <div className="mt-6 pt-4 border-t border-slate-100 w-full flex flex-col items-center">
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Amortização de Farinha</span>
                   
                   {load.isAmortized ? (
                     <div className="flex flex-col items-center gap-1.5">
                       <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm max-w-[280px]">
                         <div className="flex items-center gap-1.5">
                           <Check className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                           <span className="text-xs font-black text-emerald-800 uppercase tracking-tight">
                             Amortizado: {load.amortizedWeight?.toLocaleString('pt-BR') || 0} kg
                           </span>
                         </div>
                         {load.amortizedBran && load.amortizedBran > 0 ? (
                           <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block mt-0.5">
                             Desconto no Farelo: -{load.amortizedBran.toLocaleString('pt-BR')} kg
                           </span>
                         ) : null}
                       </div>
                       <button
                         onClick={async () => {
                           try {
                             const success = await cancelLoadAmortization(load.id);
                             if (success) {
                               showToast("Amortização desfeita, saldo e farelo restaurados.", "success");
                             } else {
                               showToast("Erro ao desfazer amortização.", "error");
                             }
                           } catch (e) {
                             showToast("Erro de processamento.", "error");
                           }
                         }}
                         className="text-[9px] font-extrabold text-red-500 hover:text-red-700 hover:underline uppercase tracking-widest block mt-0.5"
                       >
                         [Desfazer Amortização]
                       </button>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center gap-2 w-full text-center">
                       <p className="text-[9px] font-bold text-slate-500 max-w-[240px]">
                         Há <strong className="text-indigo-600">{(stock.returnFlourBalance || 0).toLocaleString('pt-BR')} kg</strong> de Farinha Pendente. Deseja amortizar com esta carga?
                       </p>
                       <button
                         onClick={async () => {
                           if (load.currentQty <= 0) {
                             showToast("A quantidade de bags deve ser maior que 0.", "error");
                             return;
                           }
                           try {
                             const success = await amortizeLoadWithPendingFlour(load.id, load.currentQty, load.type);
                             if (success) {
                               showToast("Carga amortizada com sucesso!", "success");
                             } else {
                               showToast("Erro ao amortizar carga.", "error");
                             }
                           } catch (e) {
                             showToast("Erro de processamento.", "error");
                           }
                         }}
                         className="bg-indigo-600 text-white font-black hover:bg-indigo-700 active:scale-95 transition-all text-[9.5px] uppercase tracking-wide px-4 py-2 rounded-xl shadow-md flex items-center gap-2 pointer-events-auto"
                       >
                         <Package className="w-3.5 h-3.5" />
                         Amortizar {load.currentQty} Bag(s) ({load.currentQty * (load.type === 'CL' ? 1050 : 1200)} kg)
                       </button>
                     </div>
                   )}
                 </div>
               )}
            </div>
         </div>
       )}

       {/* Action Area */}
       <div className="bg-slate-50 p-3 border-t border-slate-50 flex flex-col gap-2">
          {load.step === 3 && (
            <div className="grid grid-cols-2 gap-2 pb-1">
              <div className="relative">
                <label className="text-[7px] font-black text-slate-700 uppercase tracking-widest mb-1 block ml-1">Cor (L*)</label>
                <input 
                  type="text" 
                  disabled={isProcessing}
                  placeholder="00,00" 
                  value={colorInput[load.id] || ''}
                  onChange={e => setColorInput({...colorInput, [load.id]: maskColor(e.target.value)})}
                  className="w-full bg-slate-50 border border-slate-200 p-2 sm:p-2.5 rounded-none font-black text-center text-xs text-slate-800 outline-none focus:border-blue-400 transition-all disabled:opacity-50 shadow-sm"
                />
              </div>
              <div className="relative">
                <label className="text-[7px] font-black text-sky-600 uppercase tracking-widest mb-1 block ml-1">Umidade (%)</label>
                <input 
                  type="text" 
                  disabled={isProcessing}
                  placeholder="00,0" 
                  value={humidityInput[load.id] || ''}
                  onChange={e => setHumidityInput({...humidityInput, [load.id]: maskHumidity(e.target.value)})}
                  className="w-full bg-sky-50/30 border border-sky-100 p-2 sm:p-2.5 rounded-none font-black text-center text-xs text-sky-900 outline-none focus:border-sky-400 transition-all disabled:opacity-50 shadow-sm"
                />
              </div>
            </div>
          )}
          {load.step === 5 && (
             <div className="space-y-3">
                <div className="relative">
                   <input 
                     type="text" 
                     inputMode="numeric"
                     disabled={isProcessing} placeholder="DIGITE O PESO TOTAL (KG)" 
                     value={weightInput[load.id] || ''}
                     onChange={e => {
                       const val = formatNumber(e.target.value);
                       setWeightInput({...weightInput, [load.id]: val});
                     }}
                     className="w-full bg-white border-2 border-blue-100 p-5 rounded-[1.5rem] font-black text-center text-lg outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all disabled:opacity-50 shadow-sm"
                   />
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="relative">
                      <input 
                        type="text" 
                        list={`drivers-list-${load.id}`}
                        disabled={isProcessing} placeholder="NOME DO MOTORISTA" 
                        value={driverInput[load.id] || ''}
                        onChange={e => {
                          const name = e.target.value.toUpperCase();
                          setDriverInput({...driverInput, [load.id]: name});
                          // Se encontrar o motorista no cadastro, preenche a placa automaticamente
                          const driver = drivers.find(d => d.name.toUpperCase() === name);
                          if (driver) {
                            setPlateInput({...plateInput, [load.id]: driver.plate.toUpperCase()});
                          }
                        }}
                        className="w-full bg-white border-2 border-slate-100 p-4 rounded-[1.2rem] font-black text-center text-[10px] outline-none focus:border-blue-500 transition-all shadow-sm"
                      />
                      <datalist id={`drivers-list-${load.id}`}>
                        {drivers.map(d => (
                          <option key={d.id} value={d.name.toUpperCase()} />
                        ))}
                      </datalist>
                   </div>
                   <div className="relative">
                      <input 
                        type="text" 
                        disabled={isProcessing} placeholder="PLACA DO VEÍCULO" 
                        value={plateInput[load.id] || ''}
                        onChange={e => setPlateInput({...plateInput, [load.id]: e.target.value.toUpperCase()})}
                        className="w-full bg-white border-2 border-slate-100 p-4 rounded-[1.2rem] font-black text-center text-[10px] outline-none focus:border-blue-500 transition-all disabled:opacity-50 shadow-sm"
                      />
                   </div>
                </div>
             </div>
          )}

          {load.step === 6 && (
             <div className="space-y-3">
                <div className="relative">
                   <input 
                     type="text" 
                     disabled={isProcessing} placeholder="DIGITE O Nº DA NOTA FISCAL" 
                     value={invoiceInput[load.id] || load.invoice || ""}
                     onChange={e => setInvoiceInput({...invoiceInput, [load.id]: e.target.value})}
                     className="w-full bg-white border-2 border-blue-100 p-5 rounded-[1.5rem] font-black text-center text-lg outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all disabled:opacity-50 shadow-sm"
                   />
                </div>
             </div>
          )}

          <div className="flex gap-2 w-full">
            {load.step > 1 && (
              <button 
                onClick={onPrev} disabled={isProcessing}
                className="flex-1 py-6 rounded-[1.5rem] font-black uppercase tracking-widest text-xs bg-white border border-slate-200 text-slate-400 shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
            )}
            <button 
               onClick={onNext} disabled={isProcessing}
               className={`${load.step > 1 ? 'flex-[2]' : 'w-full'} py-6 rounded-[1.5rem] font-black uppercase tracking-widest text-sm shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 ${load.step === 7 ? 'bg-slate-900 text-white shadow-slate-200' : 'bg-blue-600 text-white shadow-blue-100'}`}
            >
                 <>
                   <span className="tracking-[0.15em]">
                     {load.step === 1 ? "CONFIRMAR CONTAGEM" : 
                      load.step === 5 ? "SALVAR PESO E CONTINUAR" : 
                      load.step === 7 ? "FINALIZAR CARGA" : "CONFIRMAR ETAPA"}
                   </span>
                   <ArrowRight className="w-6 h-6" />
                 </>
            </button>
          </div>
       </div>
    </div>
  );
};
