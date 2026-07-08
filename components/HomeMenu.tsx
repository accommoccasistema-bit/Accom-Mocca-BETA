
import React from 'react';
import { 
  TrendingUp, 
  Package, 
  Droplets, 
  Palette,
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Calendar,
  ChevronRight,
  Plus,
  Search,
  Bell,
  User,
  Maximize2,
  Truck,
  Wheat,
  FileText,
  BarChart3,
  ArrowRightLeft,
  Microscope,
  Users,
  Undo2,
  FlaskConical
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { useData } from '../src/shared/contexts/DataContext';
import { BigBagIcon } from './BigBagIcon';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { resetActiveLoadsAndStock } from '../firebase';
import { Toast, ToastType } from './Toast';

interface HomeMenuProps {
  onNavigate: (view: any) => void;
}

export const HomeMenu: React.FC<HomeMenuProps> = ({ onNavigate }) => {
  const { history, stock, coloration, wheatEntries, loads, subproductLoads, analyses, loadingHistory, loadingStock } = useData();

  // Filter wheat entries for today and take last 4
  const today = new Date().toLocaleDateString('pt-BR');
  const todayEntries = wheatEntries
    .filter(entry => {
      if (!entry.date) return false;
      const entryDate = entry.date.toDate ? entry.date.toDate() : new Date(entry.date);
      return entryDate.toLocaleDateString('pt-BR') === today;
    })
    .sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 4);

  // Industrial Stats
  const industrialStats = React.useMemo(() => {
    const totalWheat = wheatEntries.reduce((acc, curr) => acc + (curr.finalWeight || 0), 0);
    
    const totalFlour = loads
      .filter(l => l.status === 'FINALIZADO')
      .reduce((acc, curr) => acc + (curr.weight || 0), 0);

    const totalSub = subproductLoads
      .filter(l => l.status === 'FINALIZADO')
      .reduce((acc, curr) => acc + (curr.quantity || 0), 0);

    const realExtraction = totalWheat > 0 ? (totalFlour / totalWheat) * 100 : 0;
    const massBalance = totalWheat - (totalFlour + totalSub);

    return { totalWheat, totalFlour, totalSub, realExtraction, massBalance };
  }, [wheatEntries, loads, subproductLoads]);

  // Process data for charts
  const recentHistory = [...history].slice(0, 7).reverse().map(item => {
    let dateLabel = '--:--';
    if (item.date && typeof item.date.toDate === 'function') {
      dateLabel = item.date.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (item.date instanceof Date) {
      dateLabel = item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return {
      name: dateLabel,
      extracao: item.yieldPercentage || 0,
      producao: item.flour || 0
    };
  });

  const stockData = [
    { name: 'Especial', value: stock.special, color: 'text-blue-600', bg: 'bg-blue-600', lightBg: 'bg-blue-50', img: 'https://i.ibb.co/3yYgYdjn/image.png', weight: 1200 },
    { name: 'Comum', value: stock.common, color: 'text-emerald-600', bg: 'bg-emerald-600', lightBg: 'bg-emerald-50', img: 'https://i.ibb.co/r2PbxJbz/image.png', weight: 1200 },
    { name: 'Inteira', value: stock.whole, color: 'text-red-600', bg: 'bg-red-600', lightBg: 'bg-red-50', img: 'https://i.ibb.co/Xn0XLJM/image.png', weight: 1200 },
    { name: 'Cola', value: stock.glue, color: 'text-slate-900', bg: 'bg-slate-900', lightBg: 'bg-slate-100', img: 'https://i.ibb.co/8LDzkhh8/image.png', weight: 1050 },
  ];

  const totalStock = stock.common + stock.special + stock.whole + stock.glue;
  const totalStockWeight = 
    (stock.common * 1200) + 
    (stock.special * 1200) + 
    (stock.whole * 1200) + 
    (stock.glue * 1050);

  const branStockKg = stock.branStock || 0;
  const BRAN_CAPACITY = 60000;
  const branOccupancyPercent = Math.max(0, Math.min(Math.round((branStockKg / BRAN_CAPACITY) * 100), 100));

  const maxStockValue = Math.max(...stockData.map(d => d.value), 100);
  const TOTAL_CAPACITY = 120;
  const occupancyPercent = Math.min(Math.round((totalStock / TOTAL_CAPACITY) * 100), 100);
  const avgExtraction = recentHistory.length > 0 
    ? (recentHistory.reduce((acc, curr) => acc + curr.extracao, 0) / recentHistory.length).toFixed(2)
    : '0.00';

  const StatCard = ({ title, value, unit, icon, trend, trendValue, color, subValue, banner, bannerColor = "bg-[#5d4037]", bannerSide = "right" }: any) => (
    <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden h-full flex flex-col">
      {banner && (
        <div className={`absolute top-[18px] ${bannerSide === 'right' ? '-right-[42px] rotate-45' : '-left-[42px] -rotate-45'} ${bannerColor} w-[140px] text-center text-white text-[9px] font-black py-1 shadow-sm z-20 uppercase tracking-[0.2em]`}>
          {banner}
        </div>
      )}
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-blue-50/50 transition-colors duration-500" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-6">
          <div className={`p-4 rounded-[1.5rem] ${color} bg-opacity-10 text-opacity-100 group-hover:scale-110 transition-transform duration-500`}>
            {React.cloneElement(icon, { size: 28, className: color })}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {trendValue}
            </div>
          )}
        </div>
        <div className="flex-grow">
          <h3 className="text-slate-400 text-[11px] font-black uppercase tracking-[0.15em] mb-2">{title}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-900 tracking-tighter">{value}</span>
            <span className="text-sm font-bold text-slate-400 uppercase">{unit}</span>
          </div>
        </div>
        {subValue && (
          <div className="flex items-center gap-2 mt-4">
            <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400">
              <Clock size={12} />
            </div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{subValue}</span>
          </div>
        )}
      </div>
    </div>
  );

  const latestExtraction = history.find(item => {
    if (!item.date) return false;
    const itemDate = item.date.toDate ? item.date.toDate() : new Date(item.date);
    return itemDate.toLocaleDateString('pt-BR') === today;
  }) || null;

  const latestAnalysesByType = React.useMemo(() => {
    const latest: Record<string, any> = {};
    // Sort analyses by date descending to get the most recent ones first
    const sortedAnalyses = [...analyses].sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });

    sortedAnalyses.forEach(analysis => {
      if (!latest[analysis.type]) {
        latest[analysis.type] = analysis;
      }
    });
    return latest;
  }, [analyses]);

  const AnalysisCard = () => {
    const formatValue = (val: any) => {
      if (val === undefined || val === null || val === '') return '---';
      return typeof val === 'number' ? val.toFixed(2).replace('.', ',') : val;
    };

    const latestDate = analyses.length > 0 && analyses[0].date?.toDate 
      ? format(analyses[0].date.toDate(), "HH:mm") 
      : '--:--';

    const allProducts = [
      { id: 'ESPECIAL', label: 'ESPECIAL', color: 'text-blue-600' },
      { id: 'COMUM', label: 'COMUM', color: 'text-emerald-600' },
      { id: 'INTEIRA', label: 'INTEIRA', color: 'text-red-600' },
      { id: 'COLA', label: 'COLA', color: 'text-slate-900' },
      { id: 'TRIGO', label: 'TRIGO', color: 'text-amber-700', isPh: true },
      { id: 'FARELO', label: 'FARELO', color: 'text-orange-700', noColor: true }
    ];

    // Get the products that have at least one analysis
    const activeProducts = allProducts
      .filter(p => !!latestAnalysesByType[p.id])
      .sort((a, b) => {
        if (a.id === 'TRIGO') return 1;
        if (b.id === 'TRIGO') return -1;
        if (a.id === 'FARELO') return 1;
        if (b.id === 'FARELO') return -1;
        return 0;
      });

    return (
      <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden h-full flex flex-col">
        {/* Banners */}
        <div className="absolute top-[18px] -left-[42px] -rotate-45 bg-blue-600 w-[140px] text-center text-white text-[9px] font-black py-1 shadow-sm z-20 uppercase tracking-[0.2em]">
          COR
        </div>
        <div className="absolute top-[18px] -right-[42px] rotate-45 bg-cyan-500 w-[140px] text-center text-white text-[9px] font-black py-1 shadow-sm z-20 uppercase tracking-[0.2em]">
          UMIDADE
        </div>

        {/* Decorative circle */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-blue-50/50 transition-colors duration-500" />

        <div className="relative z-10 flex flex-col h-full">
          {/* Icons */}
          <div className="flex justify-around items-center mb-6 mt-1">
            <div className="p-3.5 bg-blue-50 rounded-[1.25rem] text-blue-600 group-hover:scale-110 transition-transform duration-500">
              <Microscope size={26} />
            </div>
            <div className="p-3.5 bg-cyan-50 rounded-[1.25rem] text-cyan-600 group-hover:scale-110 transition-transform duration-500">
              <Droplets size={26} />
            </div>
          </div>

          {/* Data Rows */}
          <div className="space-y-3 px-1 flex-grow">
            {activeProducts.length > 0 ? activeProducts.map(product => {
              const data = latestAnalysesByType[product.id];
              return (
                <div key={product.id} className="grid grid-cols-[0.8fr_1fr_1fr] items-center gap-2 border-b border-slate-50 pb-2 last:border-0">
                  <span className={`text-[9px] font-black uppercase tracking-tight ${product.color}`}>
                    {product.label}
                  </span>
                  <div className="flex items-center gap-1 justify-center">
                    {!product.noColor && (
                      <>
                        <span className={`text-[8px] font-bold ${product.color} opacity-40 uppercase`}>{product.isPh ? 'PH' : 'L'}:</span>
                        <span className={`text-lg font-black tracking-tighter ${product.color} tabular-nums`}>
                          {formatValue(data.color)}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <span className={`text-[8px] font-bold ${product.color} opacity-40 uppercase`}>U:</span>
                    <span className={`text-lg font-black tracking-tighter ${product.color} tabular-nums`}>
                      {formatValue(data.moisture)}%
                    </span>
                  </div>
                </div>
              );
            }) : (
              <div className="flex items-center justify-center h-full py-10">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sem análises recentes</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center gap-2">
            <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400">
              <Clock size={12} />
            </div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{latestDate}</span>
          </div>
        </div>
      </div>
    );
  };

  const ExtractionCard = ({ latest }: { latest: any }) => {
    if (!latest) return (
      <StatCard 
        title="Rendimento Médio" 
        value={avgExtraction} 
        unit="%" 
        icon={<TrendingUp />} 
        color="text-blue-600"
        subValue="Sem extração recente"
        banner="Extração"
        bannerColor="bg-purple-600"
      />
    );

    const breakdown = [
      { label: 'Comum', value: latest.flourCommon || 0, color: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-100/50' },
      { label: 'Especial', value: latest.flourSpecial || 0, color: 'text-blue-600', bg: 'bg-blue-50/50', border: 'border-blue-100/50' },
      { label: 'Inteira', value: latest.flourWhole || 0, color: 'text-red-600', bg: 'bg-red-50/50', border: 'border-red-100/50' },
      { label: 'Cola', value: latest.flourGlue || 0, color: 'text-slate-900', bg: 'bg-slate-50/50', border: 'border-slate-100/50' }
    ];
    
    return (
      <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden h-full flex flex-col">
        {/* Banner */}
        <div className="absolute top-[18px] -right-[42px] rotate-45 bg-purple-600 w-[140px] text-center text-white text-[9px] font-black py-1 shadow-sm z-20 uppercase tracking-[0.2em]">
          Extração
        </div>

        {/* Decorative circle */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-purple-50/50 transition-colors duration-500" />

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 rounded-[1.5rem] bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform duration-500">
              <TrendingUp size={28} />
            </div>
            <div className="text-right">
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-4xl font-black text-slate-900 tracking-tighter">
                  {latest.yieldPercentage?.toFixed(1).replace('.', ',')}
                </span>
                <span className="text-sm font-bold text-slate-400 uppercase">%</span>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] block">Rendimento Industrial</span>
            </div>
          </div>

          <div className="space-y-3 flex-grow">
            {/* Flour Types Grid */}
            <div className="grid grid-cols-2 gap-3">
              {breakdown.map((item) => (
                <div key={item.label} className={`${item.bg} p-3 rounded-2xl border ${item.border}`}>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">{item.label}</span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-lg font-black tracking-tighter ${item.color}`}>
                      {item.value.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">kg/h</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Totals Section */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-orange-50/50 p-3 rounded-2xl border border-orange-100/50">
                <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest block mb-1">Farelo</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black tracking-tighter text-orange-600">
                    {(latest.bran || 0).toLocaleString('pt-BR')}
                  </span>
                  <span className="text-[8px] font-bold text-orange-400 uppercase">kg/h</span>
                </div>
              </div>
              <div className="bg-slate-900 p-3 rounded-2xl shadow-lg shadow-slate-200">
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest block mb-1">Total Farinha</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black tracking-tighter text-white">
                    {(latest.flour || 0).toLocaleString('pt-BR')}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">kg/h</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400">
              <Clock size={12} />
            </div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              {latest.date?.toDate ? latest.date.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recente'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fadeIn space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Página Inicial Operacional</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Monitoramento em tempo real do Moinho</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white px-4 py-2 rounded-2xl border border-slate-200 flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-all group">
            <FileText size={16} className="text-blue-600" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Relatórios</span>
          </button>
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 flex items-center gap-3 shadow-sm">
            <Calendar size={16} className="text-blue-600" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 flex items-center gap-3 shadow-sm">
            <Clock size={16} className="text-blue-600" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ExtractionCard latest={latestExtraction} />
        <StatCard 
          title="Estoque Farinha" 
          value={totalStock} 
          unit="Bags" 
          icon={<Package />} 
          color="text-emerald-600"
          subValue={`Ocupação ${occupancyPercent}% | Total: ${totalStockWeight.toLocaleString('pt-BR')} kg`}
          banner="Farinha"
          bannerColor="bg-blue-800"
        />
        <StatCard 
          title="Caixa de Farelo" 
          value={branStockKg.toLocaleString('pt-BR')} 
          unit="kg" 
          icon={<ArrowRightLeft />} 
          color="text-amber-600"
          subValue={`Ocupação ${branOccupancyPercent}%`}
          banner="Farelo"
          bannerColor="bg-[#795548]"
          bannerSide="right"
        />
        <AnalysisCard />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stock Distribution (Now Larger) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-none border border-slate-200 shadow-sm flex flex-col min-h-[500px]">
          <div className="mb-10 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Distribuição de Estoque</h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Saldo detalhado por categoria de produto</p>
            </div>
            <div className="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
               <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Capacidade: {TOTAL_CAPACITY} Bags</span>
            </div>
          </div>
          
          <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {stockData.map((item) => (
              <div key={item.name} className="group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 ${item.lightBg} rounded-2xl border-2 border-white shadow-md flex items-center justify-center p-3 group-hover:scale-110 transition-transform duration-300 overflow-hidden bg-white`}>
                      <img 
                        src={item.img} 
                        alt={item.name} 
                        className="w-full h-full object-contain"
                        style={{ imageRendering: '-webkit-optimize-contrast' }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h4 className={`text-base font-black uppercase tracking-wider ${item.color}`}>{item.name}</h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Farinha de Trigo</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex flex-col items-end">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-800 tracking-tighter">{item.value}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase">Bags</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                        ~{(item.value * item.weight).toLocaleString('pt-BR')} kg
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="h-5 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner p-1">
                  <div 
                    className={`h-full ${item.bg} rounded-full transition-all duration-1000 ease-out shadow-sm`}
                    style={{ width: `${(item.value / maxStockValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-slate-100 flex justify-between items-center">
             <div className="flex items-center gap-8">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ocupação Total</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-800 uppercase">{occupancyPercent}%</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase">Ocupado</span>
                  </div>
               </div>
               <div className="h-12 w-[1px] bg-slate-100 hidden sm:block"></div>
               <div className="flex flex-col hidden sm:flex">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total em Estoque</span>
                  <div className="flex items-baseline gap-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-800 uppercase">{totalStock}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase">Bags</span>
                    </div>
                    <span className="text-sm font-black text-slate-400 uppercase">
                      ({totalStockWeight.toLocaleString('pt-BR')} kg)
                    </span>
                  </div>
               </div>
             </div>
             <button 
              onClick={() => onNavigate('stock-view')}
              className="bg-blue-600 text-white p-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
             >
                Gestão Completa <ChevronRight size={14} />
             </button>
          </div>
        </div>

        {/* Main Extraction Chart (Now Smaller) */}
        <div className="bg-white p-8 rounded-none border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">Extração</h2>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Últimas 7 medições</p>
            </div>
            <button 
              onClick={() => onNavigate('industrial-control')}
              className="p-2 hover:bg-slate-50 rounded-xl text-blue-600 transition-colors"
            >
              <Maximize2 size={18} />
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recentHistory}>
                <defs>
                  <linearGradient id="colorExt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                  domain={['auto', 'auto']}
                  width={25}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                  labelStyle={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="extracao" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorExt)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-auto pt-6 border-t border-slate-100">
             <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Média Atual</span>
                <span className="text-lg font-black text-blue-600">{avgExtraction}%</span>
             </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-8">
          {/* Industrial Balance Summary */}
          <div className="bg-white p-8 rounded-none border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <BarChart3 className="text-emerald-600" size={20} />
                </div>
                <div>
                  <h3 className="text-slate-800 font-black text-xs uppercase tracking-widest">Balanço Industrial</h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Extração Real vs Estimada</p>
                </div>
              </div>
              <button 
                onClick={() => onNavigate('industrial-control')}
                className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:underline"
              >
                Detalhes
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Extração Real</span>
                  <span className="text-2xl font-black text-slate-800">{industrialStats.realExtraction.toFixed(1)}%</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Trigo Processado</span>
                  <span className="text-2xl font-black text-slate-800">{industrialStats.totalWheat.toLocaleString('pt-BR')} kg</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Balanço de Massa</span>
                  <span className={`text-2xl font-black ${industrialStats.massBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {industrialStats.massBalance.toLocaleString('pt-BR')} kg
                  </span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          <button 
            onClick={() => onNavigate('production-batch')}
            className="bg-blue-600 p-6 rounded-none text-white flex flex-col items-center justify-center gap-4 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 group"
          >
            <div className="p-4 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform">
              <TrendingUp size={32} />
            </div>
            <div className="text-center">
              <span className="block font-black text-sm uppercase tracking-widest">Sistema de Pedido</span>
            </div>
          </button>

          <button 
            onClick={() => onNavigate('wheat-entry')}
            className="bg-white p-6 rounded-none border border-slate-200 flex flex-col items-center justify-center gap-4 hover:border-amber-200 hover:bg-amber-50 transition-all active:scale-95 group"
          >
            <div className="p-2 bg-amber-50 rounded-2xl group-hover:scale-110 transition-transform w-16 h-16 flex items-center justify-center overflow-hidden relative bg-white border border-amber-100">
              <img 
                src="https://i.ibb.co/DgbmXFt0/image.png" 
                alt="Logo Trigo" 
                className="w-full h-full object-contain p-1 mb-1"
                style={{ imageRendering: '-webkit-optimize-contrast' }}
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-amber-600 py-0.5 flex items-center justify-center">
                <span className="text-[8px] font-black text-white uppercase tracking-tighter">Trigo</span>
              </div>
            </div>
            <div className="text-center">
              <span className="block font-black text-sm text-slate-800 uppercase tracking-widest">Entrada de Trigo</span>
            </div>
          </button>

          <button 
            onClick={() => onNavigate('stock-control')}
            className="bg-white p-6 rounded-none border border-slate-200 flex flex-col items-center justify-center gap-4 hover:border-blue-200 hover:bg-blue-50 transition-all active:scale-95 group"
          >
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center p-2 group-hover:scale-110 transition-transform overflow-hidden relative">
              <img 
                src="https://i.ibb.co/3yYgYdjn/image.png" 
                alt="Logo Farinha" 
                className="w-full h-full object-contain p-1"
                style={{ imageRendering: '-webkit-optimize-contrast' }}
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-blue-600 py-0.5 flex items-center justify-center">
                <span className="text-[8px] font-black text-white uppercase tracking-tighter">Farinha</span>
              </div>
            </div>
            <div className="text-center">
              <span className="block font-black text-sm text-slate-800 uppercase tracking-widest text-center">Saída de Farinha</span>
            </div>
          </button>

          <button 
            onClick={() => onNavigate('subproducts')}
            className="bg-white p-6 rounded-none border border-slate-200 flex flex-col items-center justify-center gap-4 hover:border-slate-200 hover:bg-slate-50 transition-all active:scale-95 group"
          >
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center p-2 group-hover:scale-110 transition-transform overflow-hidden relative">
              <img 
                src="https://i.ibb.co/chcGNGq8/image.png" 
                alt="Logo Farelo" 
                className="w-full h-full object-contain p-1"
                style={{ imageRendering: '-webkit-optimize-contrast' }}
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-amber-800 py-0.5 flex items-center justify-center">
                <span className="text-[8px] font-black text-white uppercase tracking-tighter">Subprod.</span>
              </div>
            </div>
            <div className="text-center">
              <span className="block font-black text-sm text-slate-800 uppercase tracking-widest text-center">Saída de Subproduto</span>
            </div>
          </button>

          <button 
            onClick={() => onNavigate('industrial-control')}
            className="bg-white p-6 rounded-none border border-slate-200 flex flex-col items-center justify-center gap-4 hover:border-emerald-200 hover:bg-emerald-50 transition-all active:scale-95 group"
          >
            <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
              <BarChart3 size={32} />
            </div>
            <div className="text-center">
              <span className="block font-black text-sm text-slate-800 uppercase tracking-widest">Painel de Controle</span>
            </div>
          </button>

          <button 
            onClick={() => onNavigate('entities')}
            className="bg-white p-6 rounded-none border border-slate-200 flex flex-col items-center justify-center gap-4 hover:border-indigo-200 hover:bg-indigo-50 transition-all active:scale-95 group"
          >
            <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform">
              <Users size={32} />
            </div>
            <div className="text-center">
              <span className="block font-black text-sm text-slate-800 uppercase tracking-widest">Clientes / Fornecedores</span>
            </div>
          </button>

          <button 
            onClick={() => onNavigate('returns')}
            className="bg-sky-50/20 p-6 rounded-none border border-dashed border-indigo-200 flex flex-col items-center justify-center gap-4 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all active:scale-95 group"
          >
            <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform">
              <Undo2 size={32} />
            </div>
            <div className="text-center">
              <span className="block font-black text-sm text-slate-800 uppercase tracking-widest">Retorno / Devolução</span>
            </div>
          </button>

          <button 
            onClick={() => onNavigate('additives')}
            className="bg-white p-6 rounded-none border border-slate-200 flex flex-col items-center justify-center gap-4 hover:border-blue-200 hover:bg-blue-50 transition-all active:scale-95 group"
          >
            <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
              <FlaskConical size={32} />
            </div>
            <div className="text-center">
              <span className="block font-black text-sm text-slate-800 uppercase tracking-widest">Controle de Aditivos</span>
            </div>
          </button>

          <button 
            onClick={() => onNavigate('mocca-docs')}
            className="bg-slate-900 p-6 rounded-none text-white flex flex-col items-center justify-center gap-4 hover:bg-slate-800 transition-all shadow-lg active:scale-95 group"
          >
            <div className="p-4 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform text-white">
              <FileText size={32} />
            </div>
            <div className="text-center">
              <span className="block font-black text-sm uppercase tracking-widest">DOCS MOCCA</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
