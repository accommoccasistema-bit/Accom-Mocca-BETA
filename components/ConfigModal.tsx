import React, { useState } from 'react';
import { saveFirebaseConfiguration, resetFirebaseConfiguration, isFirebaseReady } from '../firebase';
import { ConfirmModal } from './ConfirmModal';
import { Toast, ToastType } from './Toast';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose }) => {
  const [configInput, setConfigInput] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [isReady] = useState(isFirebaseReady());
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
  };

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setConfigInput(val);

    // Detecção de códigos errados comuns
    if (val.includes("firebase-admin") || val.includes("serviceAccount") || val.includes("credential: admin")) {
      setWarning("⚠️ Isso parece código de SERVIDOR (Node.js/Admin). Você precisa da configuração WEB (Client).");
    } else if (val.includes("google-services") || val.includes("implementation platform") || val.includes("apply plugin")) {
      setWarning("⚠️ Isso parece configuração de ANDROID/GRADLE. Procure pelo ícone de Web (</>).");
    } else if (val.includes("FileInputStream") || val.includes("FirebaseOptions")) {
      setWarning("⚠️ Isso parece código JAVA. Você precisa da configuração JAVASCRIPT.");
    } else if (val.includes("struct") || val.includes("FirebaseApp.configure")) {
      setWarning("⚠️ Isso parece código iOS/Swift. Procure a versão WEB.");
    } else {
      setWarning(null);
    }
  };

  const handleSave = () => {
    if (!configInput.trim()) return;
    
    const success = saveFirebaseConfiguration(configInput);
    if (success) {
      showToast("Configuração salva com sucesso! Recarregando...", "success");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      showToast("Erro ao salvar configuração.", "error");
    }
  };

  const handleReset = () => {
    resetFirebaseConfiguration();
    showToast("Configuração removida.", "info");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] my-auto">
        
        {/* Header */}
        <div className="bg-[#2563eb] p-6 text-white flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold uppercase tracking-widest flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configurar Nuvem
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {isReady ? (
            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Aplicativo Conectado!</h3>
              <p className="text-slate-600 mb-6 text-sm">
                As chaves do Firebase estão configuradas. Você pode salvar suas extrações e acessar o histórico.
              </p>
              
              <button 
                onClick={() => setShowConfirmReset(true)}
                className="w-full border border-red-200 text-red-600 hover:bg-red-50 font-bold py-3 px-4 rounded-xl transition-colors text-sm uppercase tracking-wide"
              >
                Remover Configuração
              </button>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
                <h4 className="text-[#2563eb] font-bold text-sm mb-2 uppercase tracking-wide">Como configurar:</h4>
                <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside font-medium">
                  <li>Acesse o <b>Firebase Console</b> do seu projeto.</li>
                  <li>Vá em <b>Project Settings</b> (Ícone de engrenagem) &gt; Aba <b>General</b>.</li>
                  <li>Role até a seção <b>"Your apps"</b>.</li>
                  <li>Se não houver app, clique no ícone <b>Web (&lt;/&gt;)</b>.</li>
                  <li>Copie o trecho <code className="bg-white px-1 py-0.5 rounded border border-blue-200">const firebaseConfig = &#123; ... &#125;;</code></li>
                  <li>Cole no campo abaixo.</li>
                </ol>
              </div>

              {warning && (
                <div className="bg-amber-50 text-amber-900 text-xs p-3 rounded-xl border border-amber-200 mb-4 font-bold flex items-start gap-2 shadow-sm animate-fadeIn">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                   </svg>
                   <span>{warning}</span>
                </div>
              )}

              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                 Cole a configuração WEB aqui
              </label>
              <textarea
                value={configInput}
                onChange={handleInputChange}
                placeholder='const firebaseConfig = { apiKey: "AIza...", ... };'
                className={`w-full h-40 bg-slate-50 border ${warning ? 'border-amber-400 focus:ring-amber-400' : 'border-slate-300 focus:ring-[#2563eb]'} text-slate-700 text-xs rounded-xl focus:ring-2 block p-3 shadow-inner transition-all outline-none resize-none mb-4`}
              />

              <button
                onClick={handleSave}
                disabled={!configInput || !!warning}
                className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-400 text-white font-bold py-4 px-4 rounded-xl shadow-lg transition-all transform active:scale-[0.98] uppercase tracking-wider text-sm"
              >
                Salvar e Conectar
              </button>
              
              <p className="text-[10px] text-slate-400 text-center mt-4">
                Seus dados de configuração são salvos apenas no seu dispositivo.
              </p>
            </>
          )}
        </div>
      </div>

      <ConfirmModal 
        isOpen={showConfirmReset}
        onClose={() => setShowConfirmReset(false)}
        onConfirm={handleReset}
        title="Remover Configuração"
        message="Tem certeza que deseja remover as chaves salvas? Você precisará inseri-las novamente para salvar dados."
        confirmText="Remover"
        variant="danger"
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