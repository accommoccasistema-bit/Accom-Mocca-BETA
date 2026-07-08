import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Download, 
  ChevronLeft,
  Calendar,
  Filter,
  Package,
  FileText
} from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { useData } from '../src/shared/contexts/DataContext';
import { motion } from 'motion/react';
import { Load, SubproductLoad, WheatEntry } from '../types';

interface StockMovementReportViewProps {
  onBack: () => void;
}

export const StockMovementReportView: React.FC<StockMovementReportViewProps> = ({ onBack }) => {
  const { loads, subproductLoads, wheatEntries, stock, history, auth } = useData();

  const [startDate, setStartDate] = useState(format(startOfDay(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfDay(new Date()), 'yyyy-MM-dd'));
  const [category, setCategory] = useState<string>('Farelo');

  const [logoUrl, setLogoUrl] = useState<string | null>(localStorage.getItem('mocca_logo_url') || '/logo.png');
  
  const reportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [reportScale, setReportScale] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && reportRef.current) {
        const containerWidth = containerRef.current.clientWidth - 48; // padding
        const reportWidth = 794; // A4 width at 96dpi
        const scale = Math.min(1, containerWidth / reportWidth);
        setReportScale(scale);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    const scale = reportScale;
    
    // Temporarily remove transform to take a clean snapshot
    reportRef.current.style.transform = 'none';
    reportRef.current.classList.add('exporting-pdf-bw');

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 5,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Restore transform and BW class
      reportRef.current.classList.remove('exporting-pdf-bw');
      reportRef.current.style.transform = `scale(${scale})`;
      reportRef.current.style.transformOrigin = 'top center';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: false
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`Relatorio_Movimentacao_${category}_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      // Ensure transform is restored
      if (reportRef.current) {
         reportRef.current.classList.remove('exporting-pdf-bw');
         reportRef.current.style.transform = `scale(${scale})`;
         reportRef.current.style.transformOrigin = 'top center';
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Determine categories
  const otherNames = useMemo(() => {
    const names = new Set<string>();
    subproductLoads.forEach(s => {
      if (s.type === 'OUTRO' && s.otherName) {
        names.add(s.otherName);
      }
    });
    return Array.from(names);
  }, [subproductLoads]);

  const categories = [
    'Farelo',
    'Farinha',
    'Farinha Comum',
    'Farinha Especial',
    'Farinha Integral',
    'Farinha Cola',
    'Resíduo',
    'Trigo',
    ...otherNames
  ];

  const filteredMovements = useMemo(() => {
    const start = parseISO(startDate);
    const end = endOfDay(parseISO(endDate));
    
    let movements: any[] = [];

    // Filter by date interval
    const filterByDate = (dateField: any) => {
      if (!dateField) return false;
      let d: Date;
      if (dateField.toDate) {
        d = dateField.toDate();
      } else {
        d = new Date(dateField);
      }
      return isWithinInterval(d, { start, end });
    };

    if (category.startsWith('Farinha')) {
      loads.filter(l => filterByDate(l.createdAt)).forEach(l => {
        if (category === 'Farinha') {
           movements.push({ ...l, date: l.createdAt, displayProduct: 'Farinha' });
        } else if (category === 'Farinha Comum' && l.type === 'C') {
           movements.push({ ...l, date: l.createdAt, displayProduct: 'Farinha Comum' });
        } else if (category === 'Farinha Especial' && l.type === 'E') {
           movements.push({ ...l, date: l.createdAt, displayProduct: 'Farinha Especial' });
        } else if (category === 'Farinha Integral' && l.type === 'I') {
           movements.push({ ...l, date: l.createdAt, displayProduct: 'Farinha Integral' });
        } else if (category === 'Farinha Cola' && l.type === 'CL') {
           movements.push({ ...l, date: l.createdAt, displayProduct: 'Farinha Cola' });
        }
      });
    } else if (category === 'Farelo') {
      subproductLoads.filter(s => s.type === 'FARELO' && filterByDate(s.createdAt)).forEach(s => {
         movements.push({ ...s, date: s.createdAt, displayProduct: 'Farelo' });
      });
    } else if (category === 'Resíduo') {
      subproductLoads.filter(s => s.type === 'RESIDUO' && filterByDate(s.createdAt)).forEach(s => {
         movements.push({ ...s, date: s.createdAt, displayProduct: 'Resíduo' });
      });
    } else if (category === 'Trigo') {
      wheatEntries.filter(w => filterByDate(w.createdAt)).forEach(w => {
         movements.push({ ...w, date: w.createdAt, displayProduct: 'Trigo' });
      });
    } else {
      // Outros
      subproductLoads.filter(s => s.type === 'OUTRO' && s.otherName === category && filterByDate(s.createdAt)).forEach(s => {
         movements.push({ ...s, date: s.createdAt, displayProduct: category });
      });
    }

    return movements.sort((a, b) => {
      const da = a.date?.toDate ? a.date.toDate().getTime() : new Date(a.date).getTime();
      const db = b.date?.toDate ? b.date.toDate().getTime() : new Date(b.date).getTime();
      return db - da; // Descending
    });
  }, [loads, subproductLoads, wheatEntries, category, startDate, endDate]);

  const totalExpedida = useMemo(() => {
    return filteredMovements.reduce((acc, curr) => {
      if (curr.displayProduct === 'Trigo') return acc + (curr.netWeight || 0); // Net weight for wheat
      if (category.startsWith('Farinha')) {
         const isGlue = curr.type === 'CL';
         return acc + (curr.weight || ((curr.quantity || 0) * (isGlue ? 1050 : 1200)));
      }
      return acc + (curr.quantity || 0);
    }, 0);
  }, [filteredMovements, category]);

  // Handle Farinha weight properly
  const totalExpedidaBags = useMemo(() => {
     if (category.startsWith('Farinha')) {
       return filteredMovements.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
     }
     return 0;
  }, [filteredMovements, category]);

  const quantidadeNaCaixa = useMemo(() => {
    let currentCommon = stock.common || 0;
    let currentSpecial = stock.special || 0;
    let currentWhole = stock.whole || 0;
    let currentGlue = stock.glue || 0;
    let currentBran = stock.branStock || 0;

    const end = endOfDay(parseISO(endDate));

    // Restore stock for items dispatched AFTER endDate
    loads.forEach(l => {
       const d = l.createdAt?.toDate ? l.createdAt.toDate() : new Date(l.createdAt);
       if (d > end) {
           if (l.type === 'C') currentCommon += (l.quantity || 0);
           else if (l.type === 'E') currentSpecial += (l.quantity || 0);
           else if (l.type === 'I') currentWhole += (l.quantity || 0);
           else if (l.type === 'CL') currentGlue += (l.quantity || 0);
       }
    });

    subproductLoads.forEach(s => {
       const d = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
       if (d > end && s.type === 'FARELO') {
           currentBran += (s.quantity || 0);
       }
    });

    // Remove stock for items produced AFTER endDate
    history.forEach(h => {
       const d = h.date?.toDate ? h.date.toDate() : new Date(h.date);
       if (d > end) {
           currentCommon -= (h.flourCommon || 0);
           currentSpecial -= (h.flourSpecial || 0);
           currentWhole -= (h.flourWhole || 0);
           currentGlue -= (h.flourGlue || 0);
           currentBran -= (h.bran || 0);
       }
    });

    if (category === 'Farelo') return currentBran;
    if (category === 'Farinha Comum') return currentCommon;
    if (category === 'Farinha Especial') return currentSpecial;
    if (category === 'Farinha Integral') return currentWhole;
    if (category === 'Farinha Cola') return currentGlue;
    if (category === 'Farinha') return currentCommon + currentSpecial + currentWhole + currentGlue;
    return 0; // Outros and Trigo don't have explicit current stock boxes tracked in 'stock' 
  }, [category, stock, loads, subproductLoads, history, endDate]);

  const quantidadeNaCaixaKg = useMemo(() => {
    let currentCommon = stock.common || 0;
    let currentSpecial = stock.special || 0;
    let currentWhole = stock.whole || 0;
    let currentGlue = stock.glue || 0;
    
    const end = endOfDay(parseISO(endDate));

    loads.forEach(l => {
       const d = l.createdAt?.toDate ? l.createdAt.toDate() : new Date(l.createdAt);
       if (d > end) {
           if (l.type === 'C') currentCommon += (l.quantity || 0);
           else if (l.type === 'E') currentSpecial += (l.quantity || 0);
           else if (l.type === 'I') currentWhole += (l.quantity || 0);
           else if (l.type === 'CL') currentGlue += (l.quantity || 0);
       }
    });

    history.forEach(h => {
       const d = h.date?.toDate ? h.date.toDate() : new Date(h.date);
       if (d > end) {
           currentCommon -= (h.flourCommon || 0);
           currentSpecial -= (h.flourSpecial || 0);
           currentWhole -= (h.flourWhole || 0);
           currentGlue -= (h.flourGlue || 0);
       }
    });

    if (category === 'Farinha Comum') return currentCommon * 1200;
    if (category === 'Farinha Especial') return currentSpecial * 1200;
    if (category === 'Farinha Integral') return currentWhole * 1200;
    if (category === 'Farinha Cola') return currentGlue * 1050;
    if (category === 'Farinha') return (currentCommon * 1200) + (currentSpecial * 1200) + (currentWhole * 1200) + (currentGlue * 1050);
    return quantidadeNaCaixa;
  }, [category, stock, loads, history, endDate, quantidadeNaCaixa]);

  const totalProduzido = useMemo(() => {
    if (category.startsWith('Farinha')) {
      return totalExpedidaBags + quantidadeNaCaixa;
    }
    return totalExpedida + quantidadeNaCaixa;
  }, [category, totalExpedida, totalExpedidaBags, quantidadeNaCaixa]);

  const totalProduzidoKg = useMemo(() => {
    if (category.startsWith('Farinha')) {
      return totalExpedida + quantidadeNaCaixaKg;
    }
    return totalProduzido;
  }, [category, totalExpedida, quantidadeNaCaixaKg, totalProduzido]);

  const isFarinha = category.startsWith('Farinha');
  const unit = 'kg';
  
  const groupedMovements = useMemo(() => {
    const rawMovements = filteredMovements.map(m => {
        const dateObj = m.date?.toDate ? m.date.toDate() : new Date(m.date);
        let qty = 0;
        let kg = 0;
        let obs = '';
        if (m.displayProduct === 'Trigo') {
           qty = m.netWeight || 0;
           kg = qty;
           obs = `${m.nf || ''} - ${m.supplier || ''}`;
        } else if (category.startsWith('Farinha')) {
           qty = m.quantity || 0;
           kg = m.weight || (qty * (m.type === 'CL' ? 1050 : 1200));
           obs = m.clientName || m.client || '';
        } else {
           qty = m.quantity || 0;
           kg = qty;
           obs = m.client || m.clientName || '';
        }
        return {
           ...m,
           dateObj,
           qty: qty || 0,
           kg: kg || 0,
           obs: obs || '-'
        };
    });

    const grouped = new Map<string, any>();
    rawMovements.forEach(m => {
       const dateStr = format(m.dateObj, 'dd/MM/yyyy');
       const key = `${dateStr}_${m.displayProduct}_${m.obs}`;
       if (grouped.has(key)) {
          const existing = grouped.get(key);
          existing.qty += m.qty;
          existing.kg += m.kg;
          existing.movCount = (existing.movCount || 1) + 1;
       } else {
          grouped.set(key, { ...m, movCount: 1 });
       }
    });

    return Array.from(grouped.values());
  }, [filteredMovements, category]);

  return (
    <div className="w-full animate-fadeIn font-inter flex flex-col h-[calc(100vh-80px)]">
      <style>{`
        .exporting-pdf-bw * {
          color: #000 !important;
          border-color: #000 !important;
        }
        .exporting-pdf-bw img {
          filter: brightness(0) !important;
        }
        .exporting-pdf-bw .bg-slate-50, .exporting-pdf-bw .bg-slate-900, .exporting-pdf-bw .bg-slate-100 {
          background-color: transparent !important;
        }
        .exporting-pdf-bw .text-emerald-400, .exporting-pdf-bw .text-blue-400, .exporting-pdf-bw .text-emerald-600, .exporting-pdf-bw .text-blue-600, .exporting-pdf-bw .text-slate-800, .exporting-pdf-bw .text-slate-900, .exporting-pdf-bw .text-slate-500, .exporting-pdf-bw .text-slate-400, .exporting-pdf-bw .text-blue-700, .exporting-pdf-bw .text-emerald-700, .exporting-pdf-bw .text-slate-300 {
          color: #000 !important;
        }
        .exporting-pdf-bw .bg-emerald-500 {
           background-color: transparent !important;
        }
      `}</style>
      <div className="flex-shrink-0 mb-8">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={onBack}
            className="p-3 bg-white rounded-none border border-slate-200 shadow-sm hover:shadow-md active:scale-95 transition-all text-slate-500"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex flex-col items-end">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none text-right">Produção e Movimentação<br/>de Estoque</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Relatórios de Entradas e Saídas</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
           <div className="flex-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Categoria / Produto</label>
              <div className="relative">
                <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-none font-bold text-slate-700 outline-none focus:border-blue-500 uppercase text-xs"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
           </div>
           
           <div className="flex-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Data Inicial</label>
              <div className="relative">
                 <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                 <input 
                   type="date" 
                   value={startDate}
                   onChange={e => setStartDate(e.target.value)}
                   className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-none font-bold text-slate-700 outline-none focus:border-blue-500 uppercase text-xs"
                 />
              </div>
           </div>

           <div className="flex-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Data Final</label>
              <div className="relative">
                 <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                 <input 
                   type="date" 
                   value={endDate}
                   onChange={e => setEndDate(e.target.value)}
                   className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-none font-bold text-slate-700 outline-none focus:border-blue-500 uppercase text-xs"
                 />
              </div>
           </div>

           <div className="flex-none flex items-end pb-1">
              <button 
                onClick={handleExportPDF}
                disabled={isExporting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 h-[46px] rounded-none font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
              >
                {isExporting ? <span className="animate-pulse">Exportando...</span> : <><Download size={16} /> Exportar PDF</>}
              </button>
           </div>
        </div>
      </div>

      <div className="flex-grow overflow-auto pb-20 scrollbar-hide" ref={containerRef}>
        <div className="flex flex-col items-center">
           <div className="w-full flex items-center justify-between mb-4 px-6 text-slate-400 font-bold uppercase text-[9px] tracking-[0.3em]">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                 <span>Relatório em Tempo Real</span>
              </div>
              <div className="flex items-center gap-4">
                 <span>Preview Oficial A4 (8.27" x 11.69")</span>
              </div>
           </div>

           <div 
             className="bg-white shadow-2xl relative transition-transform duration-300 transform-gpu overflow-hidden border border-slate-200"
             style={{ 
               width: '794px', 
               minHeight: '1123px',
               transform: `scale(${reportScale})`,
               transformOrigin: 'top center',
               marginBottom: `${(reportScale - 1) * 1123}px` // Compensate for scale height
             }}
           >
             <div ref={reportRef} className="w-full h-full bg-white text-slate-900 absolute top-0 left-0" style={{ padding: '50px 60px' }}>
                
                {/* Cabeçalho */}
                <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-slate-800">
                    <div className="flex items-center gap-4">
                        <img src={logoUrl || '/logo.png'} alt="Logo" className="h-32 w-auto max-w-[360px] object-contain" referrerPolicy="no-referrer" />
                    </div>
                    
                    <div className="text-right">
                        <h1 className="text-[26px] font-black text-slate-900 leading-tight tracking-tighter uppercase">
                            Relatório de<br/>Produção e<br/>Movimentação<br/>de Estoque
                        </h1>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-none mb-8 flex justify-between">
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Categoria Selecionada</p>
                        <p className="text-base font-black uppercase tracking-tight">{category}</p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Período</p>
                        <p className="text-sm font-black uppercase tracking-tight">{format(parseISO(startDate), 'dd/MM/yyyy')} a {format(parseISO(endDate), 'dd/MM/yyyy')}</p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Emissão</p>
                        <p className="text-sm font-black uppercase tracking-tight">{format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                </div>

                {/* Table */}
                <div className="mb-8 min-h-[400px]">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="border-b-2 border-slate-800 text-[10px] uppercase font-black tracking-widest text-slate-400">
                            <th className="py-3 px-2">Data</th>
                            <th className="py-3 px-2">Hora</th>
                            <th className="py-3 px-2">Produto</th>
                            <th className="py-3 px-2 text-right">Quantidade</th>
                            <th className="py-3 px-2">Unid.</th>
                            <th className="py-3 px-2">Destino / Obs</th>
                         </tr>
                      </thead>
                      <tbody className="text-xs font-bold text-slate-700">
                         {groupedMovements.length > 0 ? groupedMovements.map((m, i) => {
                            const dateObj = m.dateObj;
                            const obs = m.movCount > 1 ? `${m.obs} (${m.movCount} movimentações)` : m.obs;

                            return (
                               <tr key={m.id || i} className="border-b border-slate-100">
                                  <td className="py-2.5 px-2">{format(dateObj, 'dd/MM/yyyy')}</td>
                                  <td className="py-2.5 px-2">{m.movCount > 1 ? '-' : format(dateObj, 'HH:mm')}</td>
                                  <td className="py-2.5 px-2 uppercase">{m.displayProduct}</td>
                                  <td className="py-2.5 px-2 text-right">
                                      <div>{(m.kg || 0).toLocaleString('pt-BR')}</div>
                                      {isFarinha && <div className="text-[9px] font-bold text-slate-400">{`${(m.qty || 0).toLocaleString('pt-BR')} Bags`}</div>}
                                  </td>
                                  <td className="py-2.5 px-2 text-[10px] font-black text-slate-400">{unit}</td>
                                  <td className="py-2.5 px-2 text-[10px] text-slate-500 uppercase truncate max-w-[200px]">{obs || '-'}</td>
                               </tr>
                            );
                         }) : (
                            <tr>
                               <td colSpan={6} className="py-8 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                  Nenhuma movimentação encontrada neste período.
                               </td>
                            </tr>
                         )}
                      </tbody>
                   </table>
                </div>

                {/* Resumo */}
                <div className="bg-slate-50 border border-slate-200 rounded-none p-8 mt-auto">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Resumo da Produção</h3>
                    <div className="grid grid-cols-4 gap-6">
                        <div className="flex flex-col justify-between h-full">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Total de Movimentações</p>
                            <div className="mt-auto">
                                <p className="text-2xl font-black text-slate-800 leading-none">{filteredMovements.length}</p>
                            </div>
                        </div>
                        <div className="flex flex-col justify-between h-full">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Expedido</p>
                            <div className="mt-auto">
                                <p className="text-2xl font-black text-slate-800 leading-none flex items-baseline">
                                   {(totalExpedida || 0).toLocaleString('pt-BR')}
                                   <span className="text-[10px] text-slate-500 ml-1">{unit}</span>
                                </p>
                                {isFarinha && <p className="text-[10px] font-bold text-slate-500 mt-1">{(totalExpedidaBags || 0).toLocaleString('pt-BR')} Bags</p>}
                            </div>
                        </div>
                        <div className="flex flex-col justify-between h-full">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Quantidade em Estoque na Data</p>
                            <div className="mt-auto">
                                <p className="text-2xl font-black text-emerald-600 leading-none flex items-baseline">
                                   {isFarinha ? (quantidadeNaCaixaKg || 0).toLocaleString('pt-BR') : (quantidadeNaCaixa || 0).toLocaleString('pt-BR')}
                                   <span className="text-[10px] text-emerald-700 ml-1">{unit}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col justify-between h-full">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Produção Total</p>
                            <div className="mt-auto">
                                <p className="text-2xl font-black text-blue-600 leading-none flex items-baseline">
                                   {isFarinha ? (totalProduzidoKg || 0).toLocaleString('pt-BR') : (totalProduzido || 0).toLocaleString('pt-BR')}
                                   <span className="text-[10px] text-blue-700 ml-1">{unit}</span>
                                </p>
                                {isFarinha && <p className="text-[10px] font-bold text-blue-500 mt-1">{(totalProduzido || 0).toLocaleString('pt-BR')} Bags</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Signatures */}
                <div className="mt-16 flex justify-center">
                   <div className="flex flex-col items-center w-1/3">
                      <div className="w-full border-t border-slate-300 mb-2"></div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Responsável pela Produção</span>
                   </div>
                </div>

                <div className="mt-8 text-center">
                   <p className="text-[8px] font-black uppercase tracking-widest text-slate-300">
                     Relatório gerado automaticamente pelo Sistema ACCOM.
                   </p>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
