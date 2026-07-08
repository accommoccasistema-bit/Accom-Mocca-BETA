
import React, { useState } from 'react';
import { useData } from '../src/shared/contexts/DataContext';
import { saveDriver, updateDriver, deleteDriver } from '../firebase';
import { User, Truck, Plus, Trash2, Edit2, X, Check, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toast, ToastType } from './Toast';

export const DriverManagement: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { drivers, loadingDrivers } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<{ id: string, name: string, plate: string } | null>(null);
  const [formData, setFormData] = useState({ name: '', plate: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.plate) return;

    setIsProcessing(true);
    try {
      let success = false;
      if (editingDriver) {
        success = await updateDriver(editingDriver.id, {
          name: formData.name,
          plate: formData.plate.toUpperCase()
        });
        if (success) showToast("Motorista atualizado com sucesso!", "success");
      } else {
        success = await saveDriver({
          name: formData.name,
          plate: formData.plate.toUpperCase()
        });
        if (success) showToast("Motorista cadastrado com sucesso!", "success");
      }

      if (success) {
        setFormData({ name: '', plate: '' });
        setShowAddModal(false);
        setEditingDriver(null);
      }
    } catch (error) {
      showToast("Erro ao processar solicitação.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este motorista?")) return;
    setIsProcessing(true);
    try {
      const success = await deleteDriver(id);
      if (success) showToast("Motorista excluído.", "success");
    } catch (error) {
      showToast("Erro ao excluir motorista.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const startEdit = (driver: any) => {
    setEditingDriver({ id: driver.id, name: driver.name, plate: driver.plate });
    setFormData({ name: driver.name, plate: driver.plate });
    setShowAddModal(true);
  };

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.plate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full pb-12 animate-fadeIn font-inter flex flex-col h-full bg-slate-50 min-h-screen pt-4 px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2.5 mr-4 bg-white rounded-xl border border-slate-200 shadow-sm active:scale-95 transition-all text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none">Cadastro de Motoristas</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Gestão de condutores e veículos</p>
          </div>
        </div>

        <button 
          onClick={() => {
            setEditingDriver(null);
            setFormData({ name: '', plate: '' });
            setShowAddModal(true);
          }}
          className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text"
          placeholder="PESQUISAR POR NOME OU PLACA..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
          className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-xs font-black text-slate-800 placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
        />
      </div>

      {/* Driver List */}
      <div className="space-y-3">
        {loadingDrivers ? (
          <div className="text-center py-12 bg-white rounded-[2rem] border border-slate-100 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Carregando Motoristas...</span>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200 flex flex-col items-center opacity-40">
            <User className="w-12 h-12 mb-3 text-slate-300" />
            <p className="font-black text-[10px] uppercase tracking-[0.2em]">Nenhum motorista encontrado</p>
          </div>
        ) : (
          filteredDrivers.map(driver => (
            <motion.div 
              key={driver.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{driver.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Truck className="w-3 h-3 text-slate-300" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{driver.plate}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => startEdit(driver)}
                  className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(driver.id)}
                  className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">
                    {editingDriver ? 'Editar Motorista' : 'Novo Cadastro'}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Preencha os dados abaixo
                  </p>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nome Completo</label>
                  <input 
                    autoFocus
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                    placeholder="DIGITE O NOME..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-black text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Placa do Veículo</label>
                  <input 
                    type="text"
                    required
                    value={formData.plate}
                    onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                    placeholder="AAA-0000..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-black text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : <Check className="w-5 h-5" />}
                  {editingDriver ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR CADASTRO'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
