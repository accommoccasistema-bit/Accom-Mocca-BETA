
import React, { useState, useMemo } from 'react';
import { Search, X, Package, Truck, Wheat, ArrowRightLeft, Calendar, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../src/shared/contexts/DataContext';

interface SearchViewProps {
  onClose: () => void;
  onNavigate: (view: any) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ onClose, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { wheatEntries, batches, loads, subproductLoads } = useData();

  const results = useMemo(() => {
    if (!searchTerm.trim()) return { batches: [], wheat: [], flour: [], subproducts: [] };

    const term = searchTerm.toLowerCase();

    return {
      batches: batches.filter(b => 
        b.name.toLowerCase().includes(term) || 
        b.status.toLowerCase().includes(term)
      ).slice(0, 5),
      wheat: wheatEntries.filter(w => 
        w.ticket.toLowerCase().includes(term) || 
        w.entity.toLowerCase().includes(term) ||
        w.plate.toLowerCase().includes(term)
      ).slice(0, 5),
      flour: loads.filter(l => 
        l.client?.toLowerCase().includes(term) || 
        l.plate?.toLowerCase().includes(term) ||
        l.status.toLowerCase().includes(term)
      ).slice(0, 5),
      subproducts: subproductLoads.filter(s => 
        s.client.toLowerCase().includes(term) || 
        s.plate.toLowerCase().includes(term) ||
        s.type.toLowerCase().includes(term)
      ).slice(0, 5)
    };
  }, [searchTerm, batches, wheatEntries, loads, subproductLoads]);

  const hasResults = results.batches.length > 0 || results.wheat.length > 0 || results.flour.length > 0 || results.subproducts.length > 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex flex-col items-center p-4 md:p-10 overflow-hidden"
    >
      <div className="w-full max-w-4xl flex flex-col h-full">
        {/* Search Header */}
        <div className="relative mb-8">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
          <input 
            autoFocus
            type="text" 
            placeholder="PESQUISAR LOTES, CARGAS, FORNECEDORES..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/90 border-2 border-transparent focus:border-blue-500 p-6 pl-16 rounded-[2.5rem] shadow-2xl text-lg font-black uppercase tracking-wider outline-none transition-all"
          />
          <button 
            onClick={onClose}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
          {!searchTerm.trim() ? (
            <div className="flex flex-col items-center justify-center h-64 text-white/40">
              <Search size={64} className="mb-4 opacity-20" />
              <p className="text-sm font-black uppercase tracking-[0.3em]">Digite algo para pesquisar</p>
            </div>
          ) : !hasResults ? (
            <div className="flex flex-col items-center justify-center h-64 text-white/40">
              <Search size={64} className="mb-4 opacity-20" />
              <p className="text-sm font-black uppercase tracking-[0.3em]">Nenhum resultado encontrado</p>
            </div>
          ) : (
            <div className="space-y-10 pb-20">
              {/* Batches */}
              {results.batches.length > 0 && (
                <section>
                  <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4 ml-4">Lotes de Produção</h3>
                  <div className="grid gap-3">
                    {results.batches.map(batch => (
                      <button 
                        key={batch.id}
                        onClick={() => { onNavigate('production-batch'); onClose(); }}
                        className="bg-white/10 hover:bg-white/20 border border-white/10 p-5 rounded-3xl flex items-center justify-between group transition-all text-white text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400">
                            <Package size={20} />
                          </div>
                          <div>
                            <p className="font-black uppercase tracking-tight">{batch.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{batch.status}</p>
                          </div>
                        </div>
                        <ChevronRight className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Wheat Entries */}
              {results.wheat.length > 0 && (
                <section>
                  <h3 className="text-amber-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4 ml-4">Entradas de Trigo</h3>
                  <div className="grid gap-3">
                    {results.wheat.map(entry => (
                      <button 
                        key={entry.id}
                        onClick={() => { onNavigate('wheat-entry'); onClose(); }}
                        className="bg-white/10 hover:bg-white/20 border border-white/10 p-5 rounded-3xl flex items-center justify-between group transition-all text-white text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-400">
                            <Truck size={20} />
                          </div>
                          <div>
                            <p className="font-black uppercase tracking-tight">{entry.entity}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ticket #{entry.ticket} • {entry.plate}</p>
                          </div>
                        </div>
                        <ChevronRight className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Flour Loads */}
              {results.flour.length > 0 && (
                <section>
                  <h3 className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4 ml-4">Saídas de Farinha</h3>
                  <div className="grid gap-3">
                    {results.flour.map(load => (
                      <button 
                        key={load.id}
                        onClick={() => { onNavigate('stock-control'); onClose(); }}
                        className="bg-white/10 hover:bg-white/20 border border-white/10 p-5 rounded-3xl flex items-center justify-between group transition-all text-white text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400">
                            <Package size={20} />
                          </div>
                          <div>
                            <p className="font-black uppercase tracking-tight">{load.client || 'Cliente não informado'}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{load.plate} • {load.status}</p>
                          </div>
                        </div>
                        <ChevronRight className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Subproducts */}
              {results.subproducts.length > 0 && (
                <section>
                  <h3 className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4 ml-4">Saídas de Subprodutos</h3>
                  <div className="grid gap-3">
                    {results.subproducts.map(sub => (
                      <button 
                        key={sub.id}
                        onClick={() => { onNavigate('subproducts'); onClose(); }}
                        className="bg-white/10 hover:bg-white/20 border border-white/10 p-5 rounded-3xl flex items-center justify-between group transition-all text-white text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400">
                            <ArrowRightLeft size={20} />
                          </div>
                          <div>
                            <p className="font-black uppercase tracking-tight">{sub.client}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sub.type} • {sub.plate}</p>
                          </div>
                        </div>
                        <ChevronRight className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
