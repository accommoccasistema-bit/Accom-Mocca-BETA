
import React from 'react';
import { 
  LayoutDashboard, 
  Calculator, 
  History, 
  Package, 
  ClipboardCheck, 
  Droplets, 
  Settings,
  Menu,
  X,
  ChevronRight,
  BarChart3,
  Truck,
  Wheat,
  FileText,
  Building2,
  ArrowRightLeft,
  TrendingUp,
  Database,
  Smartphone,
  Undo2,
  FlaskConical
} from 'lucide-react';
import { motion } from 'motion/react';
import { BigBagIcon } from './BigBagIcon';
import { Logo } from './Logo';
import { logout } from '../firebase';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: any) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isOpen, setIsOpen }) => {
  const handleLogout = async () => {
    await logout();
  };
  const menuItems = [
    { id: 'menu', label: 'Página Inicial', icon: <LayoutDashboard size={20} />, activeColor: 'bg-blue-600' },
    { id: 'production-batch', label: 'Sistema de Pedido', icon: <TrendingUp size={20} />, activeColor: 'bg-blue-600' },
    { id: 'industrial-control', label: 'Painel de Controle', icon: <BarChart3 size={20} />, activeColor: 'bg-indigo-600' },
    { id: 'wheat-entry', label: 'Entrada de Trigo', icon: <Wheat size={20} />, activeColor: 'bg-amber-600' },
    { id: 'stock-control', label: 'Saída de Farinha', icon: <Package size={20} />, activeColor: 'bg-blue-600' },
    { id: 'subproducts', label: 'Saída de Subproduto', icon: <ArrowRightLeft size={20} />, activeColor: 'bg-slate-600' },
    { id: 'returns', label: 'Retorno / Devolução', icon: <Undo2 size={20} />, activeColor: 'bg-indigo-600' },
    { id: 'additives', label: 'Controle de Aditivos', icon: <FlaskConical size={20} />, activeColor: 'bg-blue-600' },
    { id: 'stock-view', label: 'Estoque', icon: <BigBagIcon className="w-5 h-5" />, activeColor: 'bg-emerald-600' },
    { id: 'stock-movement-report', label: 'Relatórios Estoque', icon: <FileText size={20} />, activeColor: 'bg-emerald-600' },
    { id: 'drivers', label: 'Cadastro Motorista', icon: <Truck size={20} />, activeColor: 'bg-slate-800' },
    { id: 'analysis', label: 'Cor / Umidade', icon: <ClipboardCheck size={20} />, activeColor: 'bg-cyan-600' },
    { id: 'entities', label: 'Clientes / Fornecedores', icon: <Building2 size={20} />, activeColor: 'bg-indigo-700' },
    { id: 'mocca-docs', label: 'DOCS MOCCA', icon: <FileText size={20} className="stroke-[3]" />, activeColor: 'bg-slate-900' },
    { id: 'backup', label: 'Backup', icon: <Database size={20} />, activeColor: 'bg-slate-800' },
    { id: 'maintenance', label: 'Manutenção / Config', icon: <Settings size={20} />, activeColor: 'bg-slate-900' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[70] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 h-full bg-white border-r border-slate-100 z-[80] transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        ${isOpen ? 'w-72' : 'w-24'} 
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        shadow-[20px_0_40px_-20px_rgba(0,0,0,0.05)]
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`${isOpen ? 'min-h-[185px]' : 'min-h-[100px]'} py-5 flex items-center justify-center px-6 border-b border-slate-100 flex-shrink-0 bg-white transition-all duration-300`}>
            <div className="flex items-center justify-center w-full group cursor-pointer">
              <div className="relative w-full flex items-center justify-center">
                <div className="absolute -inset-4 bg-blue-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="transition-all duration-500 w-full flex justify-center">
                  <Logo imgClassName={isOpen ? "max-h-[140px]" : "max-h-[50px]"} />
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-grow pt-6 pb-10 px-6 space-y-2 overflow-y-auto scrollbar-hide">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  if (window.innerWidth < 1024) setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-4 px-4 py-4 rounded-[1.25rem] transition-all duration-300 group relative
                  ${currentView === item.id 
                    ? `${item.activeColor} text-white shadow-[0_10px_25px_-5px_rgba(59,130,246,0.4)] scale-[1.02]` 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <div className={`shrink-0 transition-transform duration-300 ${currentView === item.id ? 'text-white scale-110' : 'group-hover:scale-110 group-hover:text-blue-600'}`}>
                  {item.icon}
                </div>
                {isOpen && (
                  <span className={`font-bold text-[14px] uppercase tracking-tight truncate transition-all ${currentView === item.id ? 'opacity-100' : 'opacity-90 group-hover:opacity-100'}`}>
                    {item.label}
                  </span>
                )}
                {isOpen && currentView === item.id && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" 
                  />
                )}
              </button>
            ))}
          </nav>

          {/* Footer removed since login/logout was disabled */}
        </div>

        {/* Toggle Button (Desktop) */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="hidden lg:flex absolute -right-4 top-12 w-8 h-8 bg-white border border-slate-100 rounded-xl items-center justify-center shadow-md text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all z-50 group"
        >
          {isOpen ? <X size={12} className="group-hover:rotate-90 transition-transform" /> : <Menu size={12} />}
        </button>
      </aside>
    </>
  );
};
