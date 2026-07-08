
import React, { useState, useEffect, ErrorInfo, ReactNode, Component, useRef } from 'react';
import { DataProvider } from '../../shared/contexts/DataContext';
import { saveAppConfig, subscribeToAppConfig, subscribeToAuth, auth } from '../../../firebase';
import { Sidebar } from '../../../components/Sidebar';
import { Menu, X, Bell, User as UserIcon, Search, LayoutGrid, Maximize2, Settings, Plus, Minus, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useAudioAlerts } from '../../shared/hooks/useAudioAlerts';
import { User } from 'firebase/auth';

// --- Importações ---
import { Calculator } from '../../../components/Calculator';
import { HistoryView } from '../../../components/HistoryView';
import { HomeMenu } from '../../../components/HomeMenu';
import { FlourStockView } from '../../../components/FlourStockView';
import { FlourStockControl } from '../../../components/FlourStockControl';
import { ColorationView } from '../../../components/ColorationView';
import { MoistureView } from '../../../components/MoistureView';
import { MaintenanceView } from '../../../components/MaintenanceView';
import { WheatEntryView } from '../../../components/WheatEntryView';
import { ReportsView } from '../../../components/ReportsView';
import { IndustrialControlView } from '../../../components/IndustrialControlView';
import { SubproductControlView } from '../../../components/SubproductControlView';
import { EntityView } from '../../../components/EntityView';
import { ProductionBatchView } from '../../../components/ProductionBatchView';
import { SearchView } from '../../../components/SearchView';
import { BackupView } from '../../../components/BackupView';
import AnalysisControl from '../../../components/AnalysisControl';
import { DriverManagement } from '../../../components/DriverManagement';
import { ProductionReportView } from '../../../components/ProductionReportView';
import { ReturnsView } from '../../../components/ReturnsView';
import { MoccaDocsView } from '../../../components/MoccaDocsView';
import { AdditiveView } from '../../../components/AdditiveView';
import { StockMovementReportView } from '../../../components/StockMovementReportView';
import { AppMobile } from '../mobile/AppMobile';

// --- Error Boundary ---
interface ErrorBoundaryProps { children?: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: Error | null; }

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState;
  props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState { 
    return { hasError: true, error }; 
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) { 
    console.error("Uncaught error:", error, errorInfo); 
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[400px]">
          <div className="bg-red-50 p-10 rounded-[2rem] border border-red-100 max-w-md w-full shadow-xl">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <X size={32} />
            </div>
            <h2 className="text-2xl font-black text-red-900 mb-2 uppercase tracking-tight">Erro de Sistema</h2>
            <p className="text-red-700/70 text-[10px] font-black mb-4 uppercase tracking-[0.2em]">Ocorreu um problema inesperado ao carregar este módulo.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 px-8 rounded-2xl shadow-lg shadow-red-200 active:scale-95 transition-all uppercase text-[10px] tracking-[0.2em]"
            >
              Reiniciar Aplicação
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

type ViewState = 'stock-movement-report' | 'menu' | 'stock-view' | 'stock-control' | 'maintenance' | 'wheat-entry' | 'reports' | 'industrial-control' | 'subproducts' | 'returns' | 'production-batch' | 'backup' | 'analysis' | 'drivers' | 'production-report' | 'entities' | 'additives' | 'mobile';

export const AppDesktop: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('menu');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [zoom, setZoom] = useState(Number(localStorage.getItem('app_zoom') || 1));
  const [activeAlert, setActiveAlert] = useState<{ title: string; message: string } | null>(null);
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const isRemoteUpdate = useRef(false);

  useAudioAlerts((title, message) => {
    setActiveAlert({ title, message });
    setTimeout(() => {
      setActiveAlert(prev => (prev?.title === title ? null : prev));
    }, 10000);
  });

  useEffect(() => {
    const unsubAuth = subscribeToAuth((u) => {
      setUser(u);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    localStorage.setItem('app_zoom', zoom.toString());
  }, [zoom]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    let unsub: (() => void) | undefined;

    if (user) {
      unsub = subscribeToAppConfig((config) => {
        if (config.currentView) {
          isRemoteUpdate.current = true;
          // Filtering out mobile as this is desktop entry
          if (config.currentView !== 'mobile') {
            setCurrentView(config.currentView as ViewState);
          }
          setTimeout(() => { isRemoteUpdate.current = false; }, 100);
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (unsub) unsub();
    };
  }, [user]);

  useEffect(() => {
    if (!isRemoteUpdate.current && user) {
      saveAppConfig({ currentView });
    }
  }, [currentView, user]);

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
  };

  const handleBack = () => {
    setCurrentView('menu'); 
  };

  const renderContent = () => {
    const SafeRender = (Comp: any) => (
      <ErrorBoundary>
         <Comp 
          onBack={handleBack} 
          onNavigate={handleNavigate} 
        />
      </ErrorBoundary>
    );

    switch (currentView) {
      case 'stock-view': return SafeRender(FlourStockView);
      case 'stock-control': return SafeRender(FlourStockControl);
      case 'maintenance': return SafeRender(MaintenanceView);
      case 'wheat-entry': return SafeRender(WheatEntryView);
      case 'reports': return SafeRender(ReportsView);
      case 'industrial-control': return SafeRender(IndustrialControlView);
      case 'subproducts': return SafeRender(SubproductControlView);
      case 'returns': return SafeRender(ReturnsView);
      case 'entities': return SafeRender(EntityView);
      case 'production-batch': return SafeRender(ProductionBatchView);
      case 'backup': return SafeRender(BackupView);
      case 'analysis': return SafeRender(AnalysisControl);
      case 'drivers': return SafeRender(DriverManagement);
      case 'production-report': return SafeRender(ProductionReportView);
      case 'mocca-docs': return SafeRender(MoccaDocsView);
      case 'additives': return SafeRender(AdditiveView);
      case 'stock-movement-report': return SafeRender(StockMovementReportView);
      case 'mobile': return (
        <div className="flex justify-center bg-slate-100/50 min-h-screen py-10">
          <div className="w-full max-w-[430px] bg-white shadow-2xl rounded-[3rem] overflow-hidden border border-slate-200">
            <AppMobile />
          </div>
        </div>
      );
      case 'menu':
      default: return SafeRender(HomeMenu);
    }
  };

  return (
    <div 
      className="min-h-screen bg-slate-50 font-inter text-slate-800 flex overflow-hidden lg:flex"
      style={{ zoom: zoom }}
    >
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-[10px] font-black text-center py-1.5 z-[100] uppercase tracking-[0.3em] shadow-lg">
          ⚠️ Sistema em Modo Offline - Dados Locais Apenas
        </div>
      )}

      {/* Sidebar */}
      <Sidebar 
        currentView={currentView} 
        onNavigate={handleNavigate} 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
      />

      {/* Main Content Area */}
      <main className={`flex-grow flex flex-col transition-all duration-300 ease-in-out bg-[#F8FAFC] ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        
        {/* View Content */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-8 lg:p-10 bg-slate-50/50">
          <div className="max-w-7xl mx-auto h-full">
            {renderContent()}
          </div>
        </div>

        <AnimatePresence>
          {searchOpen && (
            <SearchView 
              onClose={() => setSearchOpen(false)} 
              onNavigate={handleNavigate} 
            />
          )}
        </AnimatePresence>

        {/* Zoom Controls */}
        <div className="fixed bottom-20 right-8 flex flex-col gap-2 z-[90]">
          <button 
            onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))}
            className="w-10 h-10 bg-white border border-slate-200 rounded-xl shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
          >
            <Plus size={20} />
          </button>
          <button 
            onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
            className="w-10 h-10 bg-white border border-slate-200 rounded-xl shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
          >
            <Minus size={20} />
          </button>
        </div>

        {/* Alert Modal */}
        <AnimatePresence>
          {activeAlert && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 max-w-sm w-full p-8 text-center"
              >
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle size={32} />
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                  {activeAlert.title}
                </h2>
                <p className="text-slate-500 text-xs font-bold mb-8 uppercase tracking-widest leading-relaxed">
                  {activeAlert.message}
                </p>
                <button 
                  onClick={() => setActiveAlert(null)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-8 rounded-xl transition-all uppercase text-[10px] tracking-[0.2em]"
                >
                  Entendi
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>


      </main>
    </div>
  );
};
