import React, { useState, useMemo } from 'react';
import { useData } from '../src/shared/contexts/DataContext';
import { createReturn } from '../firebase';
import { ReturnRecord, LoadType } from '../types';
import { 
  Undo2, 
  ArrowLeft, 
  AlertTriangle, 
  Save, 
  CheckCircle2, 
  Package, 
  Clock, 
  Filter, 
  Search,
  Scale, 
  Info,
  Calendar,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toast, ToastType } from './Toast';

interface ReturnsViewProps {
  onBack: () => void;
}

export const ReturnsView: React.FC<ReturnsViewProps> = ({ onBack }) => {
  const { stock, batches, loads = [], subproductLoads = [], returns = [] } = useData();

  // Toast notifications
  const [toast, setToast] = useState<{ show: boolean; message: string; type: ToastType }>({
    show: false,
    message: '',
    type: 'success'
  });

  // State definitions
  const [isSaving, setIsSaving] = useState(false);
  const [returnProductType, setReturnProductType] = useState<'FARINHA' | 'FARELO' | 'OUTROS'>('FARINHA');
  const [returnLoadDocId, setReturnLoadDocId] = useState<string>('');
  const [returnMotivo, setReturnMotivo] = useState<string>('');
  const [returnBagsQty, setReturnBagsQty] = useState<string>('');
  const [returnWeightKg, setReturnWeightKg] = useState<string>('');
  const [returnQtyGeneral, setReturnQtyGeneral] = useState<string>('');
  const [returnObservations, setReturnObservations] = useState<string>('');

  const formatNumberBr = (val: string) => {
    let clean = val.replace(/[^\d,]/g, '');
    const parts = clean.split(',');
    if (parts.length > 2) clean = parts[0] + ',' + parts.slice(1).join('');
    if (clean.includes(',')) {
      const [int, dec] = clean.split(',');
      const formattedInt = int ? parseInt(int, 10).toLocaleString('pt-BR') : '0';
      return `${formattedInt},${dec}`;
    }
    return clean ? parseInt(clean, 10).toLocaleString('pt-BR') : '';
  };

  const handleReturnWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReturnWeightKg(formatNumberBr(e.target.value));
  };

  const handleReturnBagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReturnBagsQty(formatNumberBr(e.target.value));
  };

  const handleReturnQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReturnQtyGeneral(formatNumberBr(e.target.value));
  };

  // History filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Active production batch
  const activeBatch = useMemo(() => batches.find(b => b.status === 'OPEN'), [batches]);

  // Filter loads based on the selected return product type
  const filteredCargas = useMemo(() => {
    if (!activeBatch) return [];
    if (returnProductType === 'FARINHA') {
      return loads;
    } else if (returnProductType === 'FARELO') {
      return subproductLoads.filter(s => s.type === 'FARELO');
    } else {
      return subproductLoads.filter(s => s.type !== 'FARELO');
    }
  }, [returnProductType, activeBatch, loads, subproductLoads]);

  // Selected cargo details for preview
  const selectedCargoDetails = useMemo(() => {
    if (!returnLoadDocId) return null;
    return filteredCargas.find(c => c.id === returnLoadDocId);
  }, [returnLoadDocId, filteredCargas]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBatch) return;

    if (!returnLoadDocId) {
      showToast('Por favor, selecione uma carga.', 'error');
      return;
    }
    if (!returnMotivo) {
      showToast('Por favor, selecione o motivo do retorno.', 'error');
      return;
    }

    const cleanNumber = (val: string) => val.replace(/\./g, '').replace(',', '.');
    const weightVal = parseFloat(cleanNumber(returnWeightKg)) || 0;
    if (weightVal <= 0 && returnProductType !== 'OUTROS') {
      showToast('Por favor, digite um peso válido superior a zero.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const loadIdStr = selectedCargoDetails ? (selectedCargoDetails.loadId || selectedCargoDetails.id || '') : 'CARGA_RETORNO';

      const success = await createReturn({
        type: returnProductType,
        loadId: loadIdStr,
        loadDocId: returnLoadDocId,
        motivo: returnMotivo as any,
        bagsQty: returnBagsQty ? parseFloat(cleanNumber(returnBagsQty)) : undefined,
        weightKg: weightVal,
        qtyGeneral: returnQtyGeneral ? parseFloat(cleanNumber(returnQtyGeneral)) : undefined,
        observations: returnObservations || undefined
      });

      if (success) {
        setReturnLoadDocId('');
        setReturnMotivo('');
        setReturnBagsQty('');
        setReturnWeightKg('');
        setReturnQtyGeneral('');
        setReturnObservations('');
        showToast('Devolução gravada com sucesso! Estoque e saldos de retorno atualizados.', 'success');
      } else {
        showToast('Erro ao processar devolução. Verifique os dados.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Ocorreu um erro no processamento do retorno.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const showToast = (message: string, type: ToastType) => {
    setToast({ show: true, message, type });
  };

  // Filter returns history
  const filteredReturnsHistory = useMemo(() => {
    return returns.filter(item => {
      const matchesType = filterType === 'ALL' || item.type === filterType;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        item.cleanLoadId?.toLowerCase().includes(searchLower) ||
        item.loadId?.toLowerCase().includes(searchLower) ||
        item.motivo?.toLowerCase().includes(searchLower) ||
        item.batchName?.toLowerCase().includes(searchLower) ||
        item.observations?.toLowerCase().includes(searchLower);
      return matchesType && matchesSearch;
    });
  }, [returns, filterType, searchTerm]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast */}
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(prev => ({ ...prev, show: false }))} 
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-3 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 rounded-2xl hover:bg-slate-50 active:scale-95 transition-all shadow-sm flex items-center justify-center"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Retorno / Devolução</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Gestão, controle e rastreabilidade de produtos retornados</p>
            </div>
          </div>
        </div>

        {activeBatch && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100/70 px-5 py-3 rounded-2xl shadow-sm text-blue-700">
            <CheckCircle2 size={18} />
            <span className="text-[10px] font-black uppercase tracking-wider">Lote Ativo: <strong className="font-extrabold">{activeBatch.name}</strong></span>
          </div>
        )}
      </div>

      {!activeBatch ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-slate-200 shadow-sm rounded-none min-h-[300px]">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mb-6">
            <AlertTriangle size={36} />
          </div>
          <h2 className="text-xl font-black text-red-900 mb-2 uppercase tracking-tight">Nenhum Lote Ativo em Vigor</h2>
          <p className="text-slate-500 max-w-sm text-xs font-medium leading-relaxed">
            Não há nenhum lote de produção aberto atualmente. É necessário ter um lote em vigor para registrar devoluções e ajustar saldos de retorno correspondentes.
          </p>
          <button 
            onClick={onBack}
            className="mt-6 bg-slate-900 hover:bg-slate-800 text-white font-black py-4 px-8 rounded-none shadow-lg active:scale-95 transition-all uppercase text-[10px] tracking-[0.2em]"
          >
            Voltar ao Menu
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Recording Form Panel */}
          <div className="lg:col-span-7 bg-white border border-slate-200 p-8 shadow-sm rounded-none flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-1">Registrar Nova Devolução</h2>
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-50 pb-4 mb-6">Insira os dados da carga devolvida</p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Product Type Action Tab selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">1. Categoria do Produto</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['FARINHA', 'FARELO', 'OUTROS'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setReturnProductType(type);
                          setReturnLoadDocId('');
                        }}
                        className={`py-4 px-2 text-xs font-black uppercase tracking-wider text-center border transition-all rounded-none ${
                          returnProductType === type 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 scale-[1.02]' 
                            : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cargo Selection Dropdown */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">2. Selecionar Carga de Origem</label>
                  
                  {filteredCargas.length === 0 ? (
                    <div className="bg-amber-50/50 border border-amber-100 p-4 text-center rounded-none">
                      <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                        Nenhuma carga de {returnProductType.toLowerCase()} cadastrada encontrada.
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        required
                        value={returnLoadDocId}
                        onChange={(e) => setReturnLoadDocId(e.target.value)}
                        className="w-full bg-white border border-slate-200 p-4 text-xs font-black uppercase text-slate-700 rounded-none focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm cursor-pointer"
                      >
                        <option value="">-- SELECIONE A CARGA --</option>
                        {filteredCargas.map((cargo) => {
                          const rawLoadId = cargo.loadId || cargo.id || '';
                          const cleanId = rawLoadId.includes('/') ? rawLoadId.split('/').pop() : rawLoadId;
                          
                          const clientName = cargo.client || '';
                          const driverName = cargo.driverName || '';
                          const vehiclePlate = cargo.vehiclePlate ? `Placa: ${cargo.vehiclePlate}` : '';
                          const cargoBatch = batches.find(b => b.id === cargo.batchId);
                          const cargoBatchName = cargoBatch ? `LOTE: ${cargoBatch.name}` : '(Lote Desconhecido)';
                          const infoParts = [
                            cargoBatchName,
                            clientName, 
                            driverName ? `Mot: ${driverName}` : '', 
                            vehiclePlate
                          ].filter(Boolean).join(' | ');

                          const entityName = infoParts || cargo.driver || cargo.entity || cargo.observations || 'N/A';
                          const loadDetails = returnProductType === 'FARINHA' 
                            ? `${cargo.currentQty || cargo.quantity || 0} bags | ${cargo.weight ? `${cargo.weight} kg` : 'Sem peso'}` 
                            : `${cargo.weight || cargo.quantity || 0} kg`;
                          
                          return (
                            <option key={cargo.id} value={cargo.id}>
                              {cleanId} - {entityName} ({loadDetails})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                </div>

                {/* Cargo Detail Preview Box */}
                {selectedCargoDetails && (
                  <div className="bg-slate-50 p-4 border border-slate-200/50 rounded-none space-y-2 animate-fadeIn">
                    <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest block">Detalhes da Carga Selecionada</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase block">Carga / Placa</span>
                        <span className="text-xs font-black text-slate-700 uppercase block">
                          {(() => {
                            const rawId = selectedCargoDetails.loadId || selectedCargoDetails.id || '';
                            const cleanId = rawId.includes('/') ? rawId.split('/').pop() : rawId;
                            const plate = selectedCargoDetails.vehiclePlate ? ` (${selectedCargoDetails.vehiclePlate})` : '';
                            return `${cleanId}${plate}`;
                          })()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase block">Motorista / Cliente</span>
                        <span className="text-xs font-black text-slate-700 truncate block">
                          {(() => {
                            const driver = selectedCargoDetails.driverName || '';
                            const clientName = selectedCargoDetails.client || '';
                            const combined = [driver, clientName].filter(Boolean).join(' / ');
                            return combined || selectedCargoDetails.driver || selectedCargoDetails.entity || 'N/A';
                          })()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase block">Quantidade Originário</span>
                        <span className="text-xs font-black text-slate-700 block">
                          {returnProductType === 'FARINHA' 
                            ? `${selectedCargoDetails.currentQty || selectedCargoDetails.quantity || 0} Bags`
                            : `${selectedCargoDetails.weight || selectedCargoDetails.quantity || 0} kg`}
                        </span>
                      </div>
                      {selectedCargoDetails.type && (
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 uppercase block">Tipo</span>
                          <span className="text-xs font-black text-indigo-600 uppercase">
                            FARINHA {selectedCargoDetails.type}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Reason select dropdown */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">3. Motivo da Devolução (Obrigatório)</label>
                  <select
                    required
                    value={returnMotivo}
                    onChange={(e) => setReturnMotivo(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-4 text-xs font-black uppercase text-slate-700 rounded-none focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm cursor-pointer"
                  >
                    <option value="">-- SELECIONE O MOTIVO --</option>
                    <option value="Embalagem danificada">Embalagem danificada</option>
                    <option value="Análise reprovada">Análise reprovada</option>
                    <option value="Cor">Cor / Aspecto visual</option>
                    <option value="Umidade">Umidade fora do padrão</option>
                    <option value="Outros">Outras razões operacionais</option>
                  </select>
                </div>

                {/* Quantitative inputs wrapper */}
                <div className="border border-slate-100 p-6 bg-slate-50/50 space-y-4">
                  <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-2">Dados das Quantidades e Pesos Devolvidos</h3>
                  
                  {returnProductType === 'FARINHA' && (
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-500">Peso Total Devolvido (kg)</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: 2.400,50"
                          value={returnWeightKg}
                          onChange={handleReturnWeightChange}
                          className="w-full bg-white border border-slate-200 p-3.5 text-xs font-black text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  {returnProductType === 'FARELO' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-500">Qtd de Bags (Opcional)</label>
                        <input
                          type="text"
                          placeholder="Ex: 1"
                          value={returnBagsQty}
                          onChange={handleReturnBagsChange}
                          className="w-full bg-white border border-slate-200 p-3.5 text-xs font-black text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-500">Peso Devolvido (kg)</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: 1.000"
                          value={returnWeightKg}
                          onChange={handleReturnWeightChange}
                          className="w-full bg-white border border-slate-200 p-3.5 text-xs font-black text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  {returnProductType === 'OUTROS' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-500">Quantidade Geral</label>
                        <input
                          type="text"
                          placeholder="Ex: 3"
                          value={returnQtyGeneral}
                          onChange={handleReturnQtyChange}
                          className="w-full bg-white border border-slate-200 p-3.5 text-xs font-black text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-500">Peso Total (Se Aplicável - kg)</label>
                        <input
                          type="text"
                          placeholder="Ex: 150"
                          value={returnWeightKg}
                          onChange={handleReturnWeightChange}
                          className="w-full bg-white border border-slate-200 p-3.5 text-xs font-black text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-500">Observações Operacionais do Retorno</label>
                    <textarea
                      rows={3}
                      placeholder="Identifique detalhes adicionais do retorno como avaria, problemas físico-químicos, lote original no cliente, etc..."
                      value={returnObservations}
                      onChange={(e) => setReturnObservations(e.target.value)}
                      className="w-full bg-white border border-slate-200 p-3.5 text-xs font-black text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>

                {/* Save Devolucao button */}
                <button
                  type="submit"
                  disabled={isSaving || !returnLoadDocId || !returnMotivo}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black py-4 rounded-none shadow-lg shadow-indigo-100 active:scale-95 transition-all text-xs tracking-widest uppercase flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <span>Processando e Ajustando Estoque...</span>
                  ) : (
                    <>
                      <Save size={16} />
                      Gravar Devolução e Adicionar ao Sando de Retorno
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Side Info and Real Time Balance Panel */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* REAL TIME CURRENT BALANCES DISPLAY */}
            <div className="bg-slate-900 border border-slate-800 shadow-xl text-white p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <Undo2 size={120} />
              </div>
              
              <div className="relative z-10 space-y-4">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Saldos de Devolução (Disponível)</h3>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Valores em vigor acumulados a serem amortizados na produção futura</p>
                </div>
                
                <div className="h-[1px] bg-slate-800 w-full" />
                
                <div className="space-y-4 pt-1">
                  
                  {/* flour balance */}
                  <div className="flex items-center justify-between bg-white/5 border border-white/5 p-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/10">
                        <Package size={20} />
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Farinha Pendente</span>
                        <span className="text-[8px] font-bold text-blue-400 uppercase block">A ser amortizada manualmente nas cargas (bags)</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-white tabular-nums block">
                        {(stock.returnFlourBalance || 0).toLocaleString('pt-BR')} <span className="text-xs text-slate-400">kg</span>
                      </span>
                    </div>
                  </div>

                  {/* bran balance */}
                  <div className="flex items-center justify-between bg-white/5 border border-white/5 p-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/10">
                        <Scale size={20} />
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Farelo Retornado</span>
                        <span className="text-[8px] font-bold text-amber-400 uppercase block">Soma o peso de volta ao estoque físico</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-white tabular-nums block">
                        {(stock.returnBranBalance || 0).toLocaleString('pt-BR')} <span className="text-xs text-slate-400">kg</span>
                      </span>
                    </div>
                  </div>

                  {/* other balance */}
                  <div className="flex items-center justify-between bg-white/5 border border-white/5 p-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-slate-500/10 rounded-xl text-slate-400 border border-slate-500/10">
                        <Info size={20} />
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Outros Retornos</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase block">Controle e rastreabilidade geral</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-white tabular-nums block">
                        {(stock.returnOtherBalance || 0).toLocaleString('pt-BR')} <span className="text-xs text-slate-400">kg</span>
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </div>



          </div>
        </div>
      )}

      {/* DETAILED HISTORY ACCORDION-TABLE */}
      <div className="bg-white border border-slate-200 p-8 shadow-sm rounded-none space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Histórico e Rastreabilidade de Devoluções</h2>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-1">Lista auditável de todas as transações de retorno registradas no sistema</p>
          </div>
          
          {/* Filtering and Search Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Pesquisar devoluções..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 pl-9 pr-4 py-2.5 text-xs font-black uppercase text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-56"
              />
              <Search size={14} className="absolute left-3 top-3.5 text-slate-400" />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-50 border border-slate-200 py-2.5 px-4 text-xs font-black uppercase text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">TODAS CATEGORIAS</option>
              <option value="FARINHA">FARINHA</option>
              <option value="FARELO">FARELO</option>
              <option value="OUTROS">OUTROS</option>
            </select>
          </div>
        </div>

        {filteredReturnsHistory.length === 0 ? (
          <div className="py-12 text-center text-slate-400/80 flex flex-col items-center justify-center space-y-3">
            <Undo2 size={40} className="stroke-[1.5] opacity-20 mb-1" />
            <span className="text-[10px] font-black uppercase tracking-widest">Nenhuma devolução localizada</span>
            <p className="text-xs text-slate-400 max-w-xs font-medium">Experimente alterar os filtros de categoria ou termo de busca acima.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-100">
            <table className="w-full text-left text-xs font-medium text-slate-600 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="py-4 px-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Data / Hora</th>
                  <th className="py-4 px-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Categoria</th>
                  <th className="py-4 px-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Carga Modificada</th>
                  <th className="py-4 px-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Lote Atribuído</th>
                  <th className="py-4 px-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Motivo legítimo</th>
                  <th className="py-4 px-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Bags / Qtd</th>
                  <th className="py-4 px-5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Peso Retornado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredReturnsHistory.map((rec) => {
                  const dateObj = rec.createdAt?.toDate ? rec.createdAt.toDate() : new Date(rec.createdAt);
                  const typeColors = {
                    'FARINHA': 'bg-blue-50 text-blue-600 border-blue-200/50',
                    'FARELO': 'bg-amber-50 text-amber-600 border-amber-200/50',
                    'OUTROS': 'bg-slate-100 text-slate-600 border-slate-200/50'
                  };

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar size={12} className="text-slate-400" />
                          <span className="font-extrabold text-slate-750 tabular-nums">
                            {dateObj.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2 py-1 text-[8px] font-black uppercase border rounded-none ${typeColors[rec.type] || 'bg-slate-50 text-slate-600'}`}>
                          {rec.type}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div>
                          <span className="font-black text-slate-800 uppercase block">{rec.cleanLoadId}</span>
                          {rec.observations && (
                            <span className="text-[9px] text-slate-400 italic font-medium max-w-[200px] truncate block" title={rec.observations}>
                              "{rec.observations}"
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Lote {rec.batchName}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wide bg-indigo-50/50 px-2.5 py-1 rounded-none">
                          {rec.motivo}
                        </span>
                      </td>
                      <td className="py-4 px-5 tabular-nums font-black text-slate-700">
                        {rec.type === 'FARINHA' && rec.bagsQty ? `${rec.bagsQty} bags` : ''}
                        {rec.type === 'FARELO' && rec.bagsQty ? `${rec.bagsQty} bags` : ''}
                        {rec.type === 'OUTROS' && rec.qtyGeneral ? `${rec.qtyGeneral} un` : ''}
                        {!rec.bagsQty && !rec.qtyGeneral && <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <span className="text-sm font-black text-slate-900 tabular-nums">
                          {rec.weightKg ? `${rec.weightKg.toLocaleString('pt-BR')} kg` : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
