
import React, { useMemo } from 'react';
import { 
  Database, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Activity, 
  Calendar, 
  Download, 
  Search, 
  Filter,
  ChevronLeft,
  FileText,
  Clock,
  FlaskConical,
  Droplets,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import { useData } from '../src/shared/contexts/DataContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'motion/react';

interface BackupViewProps {
  onBack: () => void;
}

export const BackupView: React.FC<BackupViewProps> = ({ onBack }) => {
  const { 
    wheatEntries, 
    loads, 
    subproductLoads, 
    batches,
    returns,
    additiveEntries,
    additiveOutputs,
    additiveApplications,
    loadingWheat,
    loadingLoads,
    loadingSubproducts,
    loadingBatches,
    loadingReturns,
    loadingAdditiveEntries,
    loadingAdditiveOutputs,
    loadingAdditiveApplications
  } = useData();

  const [searchTerm, setSearchTerm] = React.useState('');

  // Combine all events into a single chronological list
  const allEvents = useMemo(() => {
    const events: any[] = [];

    const getFlourName = (type: string) => {
      switch(type) {
        case 'E': return 'Especial';
        case 'C': return 'Comum';
        case 'I': return 'Inteira';
        case 'CL': return 'Cola';
        default: return type;
      }
    };

    // Wheat Entries (Inputs)
    wheatEntries.forEach(entry => {
      const ticketId = entry.ticket?.includes('/') ? entry.ticket.split('/').pop() : entry.ticket;
      const batchName = entry.ticket?.includes('/') ? entry.ticket.split('/')[0].replace('#', '') : '---';
      
      events.push({
        id: entry.id,
        type: 'ENTRADA_TRIGO',
        title: `Entrada: #${ticketId} / ${batchName}`,
        description: `${entry.entity || 'Produtor'} - ${entry.product || 'Trigo'} - ${(entry.finalWeight || 0).toLocaleString('pt-BR')}kg`,
        date: entry.date?.toDate ? entry.date.toDate() : new Date(),
        category: 'Trigo',
        icon: <ArrowDownCircle className="text-amber-500" />,
        details: entry
      });
    });

    // Flour Loads (Outputs)
    loads.forEach(load => {
      const loadId = load.loadId?.includes('/') ? load.loadId.split('/').pop() : load.loadId;
      const batchName = load.batchName || (load.loadId?.includes('/') ? load.loadId.split('/')[0].replace('#', '') : '---');

      events.push({
        id: load.id,
        type: 'SAIDA_FARINHA',
        title: `Carga: #${loadId} / ${batchName}`,
        description: `${load.client || 'Cliente'} - ${getFlourName(load.type)} - ${load.quantity} bags (${(load.weight || 0).toLocaleString('pt-BR')}kg)`,
        date: load.createdAt?.toDate ? load.createdAt.toDate() : new Date(),
        category: 'Farinha',
        icon: <ArrowUpCircle className="text-blue-500" />,
        details: load
      });
    });

    // Subproduct Loads (Outputs)
    subproductLoads.forEach(load => {
      const loadId = load.loadId?.includes('/') ? load.loadId.split('/').pop() : load.loadId;
      const batchName = load.loadId?.includes('/') ? load.loadId.split('/')[0].replace('#', '') : '---';

      events.push({
        id: load.id,
        type: 'SAIDA_SUBPRODUTO',
        title: `Carga: #${loadId} / ${batchName}`,
        description: `${load.type} - ${(load.quantity || 0).toLocaleString('pt-BR')}kg`,
        date: load.createdAt?.toDate ? load.createdAt.toDate() : new Date(),
        category: 'Subproduto',
        icon: <ArrowUpCircle className="text-emerald-500" />,
        details: load
      });
    });

    // Production Batches (Milling Summaries)
    batches.forEach(batch => {
      events.push({
        id: batch.id,
        type: 'PRODUCAO',
        title: `Lote: ${batch.name}`,
        description: `Moído: ${batch.currentWheat.toLocaleString('pt-BR')}kg - Farinha: ${batch.currentFlour.toLocaleString('pt-BR')}kg`,
        date: batch.createdAt?.toDate ? batch.createdAt.toDate() : new Date(),
        category: 'Produção',
        icon: <Activity className="text-indigo-500" />,
        details: batch
      });
    });

    // Returns / Devoluções
    returns.forEach(ret => {
      const showBags = ret.type === 'FARINHA' && ret.bagsQty ? `(${ret.bagsQty || 0} bags) ` : '';
      const productLabel = ret.type === 'FARINHA' ? 'Farinha de Devolução' : 'Farelo de Devolução';

      events.push({
        id: ret.id,
        type: 'RETORNO_DEVOLUCAO',
        title: `Devolução: ${ret.loadId || 'S/N'}`,
        description: `${productLabel} - ${showBags}${ret.weightKg.toLocaleString('pt-BR')}kg - Motivo: ${ret.motivo || 'Nenhum'}`,
        date: ret.createdAt?.toDate ? ret.createdAt.toDate() : new Date(),
        category: 'Devolução',
        icon: <ArrowDownCircle className="text-rose-500" />,
        details: ret
      });
    });

    // Additive Entries
    (additiveEntries || []).forEach(entry => {
      events.push({
        id: entry.id,
        type: 'ENTRADA_ADITIVO',
        title: `Entrada Aditivo: ${entry.additiveName}`,
        description: `Lote: ${entry.lotInternalCode} - Fornecedor: ${entry.supplier} - Qtd: ${entry.qtyReceived.toLocaleString('pt-BR')} ${entry.unit || 'Kg'}`,
        date: entry.createdAt?.toDate ? entry.createdAt.toDate() : (entry.date ? new Date(entry.date + 'T' + (entry.time || '00:00')) : new Date()),
        category: 'Aditivos',
        icon: <ArrowDownLeft className="text-blue-500" />,
        details: entry
      });
    });

    // Additive Outputs
    (additiveOutputs || []).forEach(out => {
      events.push({
        id: out.id,
        type: 'SAIDA_ADITIVO',
        title: `Baixa Aditivo: ${out.additiveName}`,
        description: `Lote: ${out.lotInternalCode} - Motivo: ${out.reason} - Qtd: ${out.qty.toLocaleString('pt-BR')} ${out.unit || 'Kg'}`,
        date: out.createdAt?.toDate ? out.createdAt.toDate() : (out.date ? new Date(out.date + 'T' + (out.time || '00:00')) : new Date()),
        category: 'Aditivos',
        icon: <ArrowUpRight className="text-amber-600" />,
        details: out
      });
    });

    // Additive Applications
    (additiveApplications || []).forEach(app => {
      events.push({
        id: app.id,
        type: 'APLICACAO_ADITIVO',
        title: `Aplicação Aditivo: ${app.additiveName}`,
        description: `Lote: ${app.lotInternalCode} no Lote Farinha: ${app.flourBatchName} - Qtd: ${app.qtyApplied.toLocaleString('pt-BR')} ${app.unit || 'Kg'}`,
        date: app.createdAt?.toDate ? app.createdAt.toDate() : (app.date ? new Date(app.date + 'T' + (app.time || '00:00')) : new Date()),
        category: 'Aditivos',
        icon: <Droplets className="text-indigo-600" />,
        details: app
      });
    });

    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [wheatEntries, loads, subproductLoads, batches, returns, additiveEntries, additiveOutputs, additiveApplications]);

  const filteredEvents = allEvents.filter(event => 
    (event.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (event.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (event.category?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const isLoading = loadingWheat || loadingLoads || loadingSubproducts || loadingBatches || loadingReturns || loadingAdditiveEntries || loadingAdditiveOutputs || loadingAdditiveApplications;

  const handleDownload = () => {
    if (filteredEvents.length === 0) return;

    // CSV Header
    const headers = ['Data/Hora', 'Operacao', 'Identificacao', 'Descricao', 'Categoria'];
    
    // CSV Rows
    const rows = filteredEvents.map(event => [
      format(event.date, 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      event.type,
      event.title.replace(/,/g, ';'), // Replace commas to avoid CSV breakage
      event.description.replace(/,/g, ';'),
      event.category
    ]);

    // Add BOM for Excel to recognize UTF-8
    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `backup_moinho_${format(new Date(), 'dd_MM_yyyy_HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full animate-fadeIn font-inter">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Sistema de Backup</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Log completo de todas as operações do moinho</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Pesquisar registros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-full md:w-64"
            />
          </div>
          <button 
            onClick={handleDownload}
            disabled={filteredEvents.length === 0}
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={14} /> Exportar
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carregando registros...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
              <Database className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-400 font-bold uppercase text-xs">Nenhum registro encontrado</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Data / Hora</th>
                      <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Operação</th>
                      <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Descrição</th>
                      <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Categoria</th>
                      <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((event, index) => (
                      <motion.tr 
                        key={`${event.type}-${event.id}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.01 }}
                        className="group hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-5 py-3 border-b border-slate-50">
                          <div className="flex items-center gap-3">
                            <Clock size={13} className="text-slate-300" />
                            <div>
                              <p className="text-[11px] font-black text-slate-700 uppercase">
                                {format(event.date, "dd MMM, yyyy", { locale: ptBR })}
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">
                                {format(event.date, "HH:mm")}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 border-b border-slate-50">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                              {React.cloneElement(event.icon, { size: 14 })}
                            </div>
                            <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{event.title}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3 border-b border-slate-50">
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide truncate max-w-xs md:max-w-md">{event.description}</p>
                        </td>
                        <td className="px-5 py-3 border-b border-slate-50">
                          <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                            event.category === 'Trigo' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            event.category === 'Farinha' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            event.category === 'Subproduto' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            event.category === 'Devolução' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            event.category === 'Aditivos' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                            'bg-indigo-50 text-indigo-600 border-indigo-100'
                          }`}>
                            {event.category}
                          </span>
                        </td>
                        <td className="px-5 py-3 border-b border-slate-50">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">OK</span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        <div className="bg-slate-900 p-5 rounded-3xl text-white relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-full -mr-12 -mt-12 blur-xl" />
          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total de Entradas</h4>
          <p className="text-2xl font-black">{wheatEntries.length}</p>
          <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Registros de Trigo</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total de Saídas</h4>
          <p className="text-2xl font-black text-slate-800">{loads.length + subproductLoads.length}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Farinha e Subprodutos</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Lotes Moídos</h4>
          <p className="text-2xl font-black text-slate-800">{batches.length}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Minutas de Produção</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full -mr-10 -mt-10 blur-lg" />
          <h4 className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1.5">Devoluções</h4>
          <p className="text-2xl font-black text-rose-600">{returns.length}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Retornos Farinha/Farelo</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden col-span-2 sm:col-span-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-sky-500/5 rounded-full -mr-10 -mt-10 blur-lg" />
          <h4 className="text-[9px] font-black text-sky-600 uppercase tracking-widest mb-1.5">Aditivos</h4>
          <p className="text-2xl font-black text-sky-600">{(additiveEntries || []).length + (additiveOutputs || []).length + (additiveApplications || []).length}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Operações de Aditivos</p>
        </div>
      </div>
    </div>
  );
};
