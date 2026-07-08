
import React from 'react';
import { FileText, Download, Filter, Calendar, ChevronRight, BarChart3, PieChart, Table, Database } from 'lucide-react';
import { motion } from 'motion/react';

interface ReportsViewProps {
  onBack: () => void;
  onNavigate: (view: any) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onBack, onNavigate }) => {
  const reports = [
    { id: 'extraction', title: 'Relatório de Extração', description: 'Histórico detalhado de rendimento por turno', icon: <BarChart3 className="text-blue-600" /> },
    { id: 'production-report', title: 'Laudo de Produção', description: 'Certificado de rendimento industrial por lote', icon: <FileText className="text-emerald-600" /> },
    { id: 'stock-movement-report', title: 'Movimentação de Estoque', description: 'Entradas e saídas de bags de farinha', icon: <PieChart className="text-emerald-600" /> },
    { id: 'wheat', title: 'Entrada de Trigo', description: 'Registros de recebimento e análises de qualidade', icon: <Table className="text-amber-600" /> },
    { id: 'backup', title: 'Sistema de Backup', description: 'Log completo de todas as operações (Entradas/Saídas)', icon: <Database className="text-slate-600" /> },
  ];

  return (
    <div className="w-full animate-fadeIn font-inter">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Central de Relatórios</h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Geração e exportação de dados operacionais</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all">
            <Filter size={14} /> Filtrar Período
          </button>
          <button className="bg-blue-600 px-6 py-2.5 rounded-xl text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
            <Download size={14} /> Exportar Tudo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onNavigate(report.id as any)}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                {React.cloneElement(report.icon as React.ReactElement, { size: 32 })}
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-1">{report.title}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-relaxed">{report.description}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                <ChevronRight size={20} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-md">
            <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Relatórios Agendados</h3>
            <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6">Configure o envio automático de relatórios diários ou semanais diretamente para o seu e-mail ou sistema central.</p>
            <button className="bg-white text-slate-900 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-50 transition-all">
              Configurar Agendamento
            </button>
          </div>
          <div className="flex-shrink-0 bg-white/5 p-8 rounded-[2rem] border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Calendar className="text-white" size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Próximo Envio</p>
                <p className="text-lg font-black uppercase">Segunda, 08:00</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-300 uppercase">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Fechamento Semanal
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-300 uppercase">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Balanço de Estoque
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
