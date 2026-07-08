
import React, { useState } from 'react';
import { Settings, Trash2, AlertTriangle, RefreshCw, ShieldAlert, CheckCircle2, Navigation2, FileText, Smartphone } from 'lucide-react';
import { resetAllData } from '../firebase';

interface MaintenanceViewProps {
  onBack: () => void;
  onNavigate?: (view: string) => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ onBack, onNavigate }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleReset = async () => {
    setIsResetting(true);
    const success = await resetAllData();
    setIsResetting(false);
    if (success) {
      setStatus('success');
      setIsConfirming(false);
    } else {
      setStatus('error');
    }
  };

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-slate-800 text-white rounded-2xl shadow-lg">
          <Settings size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Manutenção do Sistema</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Configurações avançadas e limpeza de dados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Hidden Modules Card */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-indigo-50/50">
            <div className="flex items-center gap-3 text-indigo-600 mb-2">
              <Navigation2 size={20} />
              <h2 className="text-lg font-black uppercase tracking-tight">Módulos em Desenvolvimento</h2>
            </div>
            <p className="text-slate-500 text-sm font-medium">Estes módulos estão inacessíveis na barra lateral principal pois ainda estão passando por ajustes finos.</p>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button onClick={() => onNavigate && onNavigate('mobile')} className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600 transition-all active:scale-95 group">
                <Smartphone size={32} className="text-slate-400 group-hover:text-purple-600 mb-3" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-600 group-hover:text-purple-600 text-center">Mobile</span>
              </button>
              <button onClick={() => onNavigate && onNavigate('reports')} className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all active:scale-95 group">
                <FileText size={32} className="text-slate-400 group-hover:text-blue-600 mb-3" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-600 group-hover:text-blue-600 text-center">Relatórios</span>
              </button>
              <button onClick={() => onNavigate && onNavigate('production-report')} className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-all active:scale-95 group">
                <FileText size={32} className="text-slate-400 group-hover:text-emerald-600 mb-3 stroke-[3]" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-600 group-hover:text-emerald-600 text-center">Laudo de Produção</span>
              </button>
            </div>
          </div>
        </div>

        {/* Reset Data Card */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3 text-red-600 mb-2">
              <ShieldAlert size={20} />
              <h2 className="text-lg font-black uppercase tracking-tight">Zona de Perigo</h2>
            </div>
            <p className="text-slate-500 text-sm font-medium">Ações irreversíveis que afetam todo o banco de dados do moinho.</p>
          </div>

          <div className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-grow">
                <h3 className="text-base font-black text-slate-800 uppercase mb-2">Zerar Todos os Dados</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Esta ação irá apagar permanentemente **TODOS** os dados do sistema: **lotes**, **cargas de farinha**, **devoluções**, **saídas de subprodutos**, **entradas de trigo**, **extrações**, **histórico de umidade** e **coloração**. 
                  Os estoques serão zerados, os saldos de amortização serão limpos e as configurações de moagem serão resetadas.
                  Use com extrema cautela, pois os dados apagados não poderão ser recuperados.
                </p>
              </div>
              
              {!isConfirming ? (
                <button 
                  onClick={() => setIsConfirming(true)}
                  className="shrink-0 flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-black py-4 px-8 rounded-2xl transition-all active:scale-95 uppercase text-xs tracking-widest border border-red-100"
                >
                  <Trash2 size={18} />
                  Zerar Sistema
                </button>
              ) : (
                <div className="shrink-0 flex flex-col gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 mb-2">
                    <AlertTriangle size={16} />
                    <span className="text-[10px] font-black uppercase">Tem certeza absoluta?</span>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      disabled={isResetting}
                      onClick={handleReset}
                      className="flex-grow flex items-center justify-center gap-2 bg-red-600 text-white font-black py-4 px-6 rounded-2xl hover:bg-red-700 transition-all active:scale-95 uppercase text-xs tracking-widest shadow-lg shadow-red-200 disabled:opacity-50"
                    >
                      {isResetting ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      Sim, Apagar Tudo
                    </button>
                    <button 
                      disabled={isResetting}
                      onClick={() => setIsConfirming(false)}
                      className="flex-grow bg-slate-100 text-slate-600 font-black py-4 px-6 rounded-2xl hover:bg-slate-200 transition-all active:scale-95 uppercase text-xs tracking-widest"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {status === 'success' && (
              <div className="mt-8 p-6 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-4 animate-fadeIn">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h4 className="text-emerald-900 font-black uppercase text-sm">Dados Resetados com Sucesso</h4>
                  <p className="text-emerald-700/70 text-xs font-medium uppercase tracking-wider">O banco de dados foi limpo e está pronto para novos registros.</p>
                </div>
                <button 
                  onClick={() => setStatus('idle')}
                  className="ml-auto text-emerald-600 hover:text-emerald-800 font-black text-[10px] uppercase tracking-widest"
                >
                  Fechar
                </button>
              </div>
            )}

            {status === 'error' && (
              <div className="mt-8 p-6 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 animate-fadeIn">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h4 className="text-red-900 font-black uppercase text-sm">Erro ao Resetar</h4>
                  <p className="text-red-700/70 text-xs font-medium uppercase tracking-wider">Não foi possível completar a operação. Verifique sua conexão.</p>
                </div>
                <button 
                  onClick={() => setStatus('idle')}
                  className="ml-auto text-red-600 hover:text-red-800 font-black text-[10px] uppercase tracking-widest"
                >
                  Tentar Novamente
                </button>
              </div>
            )}
          </div>
        </div>

        {/* System Info Card */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-base font-black text-slate-800 uppercase mb-6">Informações do Terminal</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Versão do App</span>
              <span className="text-sm font-black text-slate-700 uppercase">v2.4.0-PC-PRO</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID da Equipe</span>
              <span className="text-sm font-black text-slate-700 uppercase">EQUIPE_MOCCA_GERAL</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status da Conexão</span>
              <span className="text-sm font-black text-emerald-600 uppercase">Sincronizado</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Última Manutenção</span>
              <span className="text-sm font-black text-slate-700 uppercase">{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
