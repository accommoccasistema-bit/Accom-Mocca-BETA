
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Globe, 
  Building2, 
  Phone, 
  MapPin, 
  Navigation,
  ChevronLeft,
  X,
  CheckCircle2,
  MoreVertical,
  Building,
  Info,
  Copy,
  Check,
  Image as ImageIcon
} from 'lucide-react';
import { useData } from '../src/shared/contexts/DataContext';
import { saveEntity, updateEntity, deleteEntity } from '../firebase';
import { Entity } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface EntityViewProps {
  onBack: () => void;
}

export const EntityView: React.FC<EntityViewProps> = ({ onBack }) => {
  const { entities, loadingEntities } = useData();
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let el = document.getElementById('portal-root');
    if (!el) {
      el = document.createElement('div');
      el.id = 'portal-root';
      document.body.appendChild(el);
    }
    setPortalTarget(el);
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'CLIENTE' | 'FORNECEDOR'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [viewingEntity, setViewingEntity] = useState<Entity | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };
  const [formData, setFormData] = useState<Omit<Entity, 'id' | 'createdAt' | 'userId'>>({
    name: '',
    companyName: '',
    cnpj: '',
    phone: '',
    city: '',
    state: '',
    address: '',
    distanceKm: 0,
    type: 'CLIENTE',
    logo: undefined
  });

  const filteredEntities = entities.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         e.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'ALL' || e.type === filterType || e.type === 'AMBOS';
    return matchesSearch && matchesFilter;
  });

  const handleOpenModal = (entity?: Entity) => {
    if (entity) {
      setEditingEntity(entity);
      setFormData({
        name: entity.name,
        companyName: entity.companyName || '',
        cnpj: entity.cnpj || '',
        phone: entity.phone || '',
        city: entity.city,
        state: entity.state,
        address: entity.address,
        distanceKm: entity.distanceKm,
        type: entity.type,
        logo: entity.logo
      });
    } else {
      setEditingEntity(null);
      setFormData({
        name: '',
        companyName: '',
        cnpj: '',
        phone: '',
        city: '',
        state: '',
        address: '',
        distanceKm: 0,
        type: 'CLIENTE',
        logo: undefined
      });
    }
    setIsModalOpen(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 120;
        const MAX_HEIGHT = 120;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL('image/jpeg', 0.8); // Low quality, tiny base64
          setFormData(prev => ({ ...prev, logo: base64 }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEntity) {
      await updateEntity(editingEntity.id, formData);
    } else {
      await saveEntity(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja realmente excluir este registro?')) {
      await deleteEntity(id);
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all active:scale-95 shadow-sm"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight leading-none">Clientes / Fornecedores</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Gestão de Parceiros Comerciais e Logísticos</p>
          </div>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-blue-200 active:scale-95 transition-all"
        >
          <Plus size={18} /> Novo Cadastro
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-grow w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar por nome ou razão social..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-full md:w-auto">
          {(['ALL', 'CLIENTE', 'FORNECEDOR'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {type === 'ALL' ? 'Todos' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Entities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredEntities.map(entity => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={entity.id}
              className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                   <button onClick={() => handleOpenModal(entity)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"><Edit2 size={14} /></button>
                   <button onClick={() => handleDelete(entity.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>

              <div className="flex items-start gap-4 mb-6">
                 <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100/80 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110 shrink-0">
                    {entity.logo ? (
                      <img src={entity.logo} alt={entity.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${entity.type === 'FORNECEDOR' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                        {entity.type === 'FORNECEDOR' ? <Building2 size={24} /> : <Building size={24} />}
                      </div>
                    )}
                 </div>
                 <div className="min-w-0 flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                       <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-[0.1em] ${entity.type === 'FORNECEDOR' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{entity.type}</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight truncate leading-tight">{entity.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{entity.companyName || 'Razão Social não informada'}</p>
                 </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-50">
                 <div className="flex items-center gap-3 text-slate-500">
                    <MapPin size={14} className="text-slate-400 flex-shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-wide truncate">{entity.address}, {entity.city} - {entity.state}</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-500">
                       <Navigation size={14} className="text-slate-400 flex-shrink-0" />
                       <span className="text-[10px] font-black uppercase tracking-widest">{entity.distanceKm} KM ao Moinho</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                       <span className="text-[9px] font-black text-slate-400 uppercase">{2} VIAGENS (ID E VOLTA)</span>
                       <span className="text-[10px] font-black text-blue-600">{entity.distanceKm * 2} KM TOTAL</span>
                    </div>
                 </div>
                 <button
                      type="button"
                      onClick={() => setViewingEntity(entity)}
                      className="w-full mt-2 py-3 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-black uppercase tracking-wider text-[9px] border border-slate-100 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                    >
                      <Info size={13} className="text-slate-400" />
                      Informações
                    </button>
                  {entity.phone && (
                   <div className="flex items-center gap-3 text-slate-500">
                      <Phone size={14} className="text-slate-400 flex-shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{entity.phone}</span>
                   </div>
                 )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {loadingEntities && entities.length === 0 && (
         <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600"></div>
         </div>
      )}

      {/* Modal rendered in Portal to bypass zoom-positioning bugs */}
      {portalTarget && createPortal(<>
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.15 }}
                className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
              >
                <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
                  <div className="px-8 py-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                        <Users size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">{editingEntity ? 'Editar Cadastro' : 'Novo Cadastro'}</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5">Parceiro Comercial Moinho Mocca</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors shrink-0"><X size={24} /></button>
                  </div>

                  <div className="p-8 space-y-6 overflow-y-auto flex-1 min-h-0">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="col-span-full">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Tipo de Parceiro</label>
                         <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                            {(['CLIENTE', 'FORNECEDOR', 'AMBOS'] as const).map(t => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setFormData({...formData, type: t})}
                                className={`flex-grow py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.type === t ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                {t}
                              </button>
                            ))}
                         </div>
                      </div>

                      <div className="col-span-full bg-slate-50/50 p-6 rounded-[2rem] border-2 border-dashed border-slate-200/60 flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative w-20 h-20 rounded-2xl bg-white border border-slate-150 shadow-sm flex items-center justify-center overflow-hidden shrink-0 group">
                          {formData.logo ? (
                            <>
                              <img src={formData.logo} alt="Logo Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, logo: undefined })}
                                className="absolute inset-0 bg-red-600/85 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-[10px] uppercase tracking-wider"
                              >
                                Remover
                              </button>
                            </>
                          ) : (
                            <div className="text-slate-300 flex flex-col items-center justify-center gap-1">
                              <ImageIcon size={22} className="text-slate-400" />
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Sem Logo</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-grow space-y-1 text-center sm:text-left">
                          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Logotipo / Imagem</h4>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide leading-relaxed">
                            Opcional: Envie uma imagem PNG/JPG em baixa resolução. Ela é comprimida automaticamente para carregar instantaneamente.
                          </p>
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
                            <label className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-black uppercase tracking-widest text-[9px] rounded-xl cursor-pointer active:scale-95 transition-all shadow-sm">
                              Escolher Logotipo
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoChange}
                                className="hidden"
                              />
                            </label>
                            {formData.logo && (
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, logo: undefined })}
                                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-black uppercase tracking-widest text-[9px] rounded-xl active:scale-95 transition-all"
                              >
                                Remover
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="md:col-span-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Nome de Exibição (Apelido)</label>
                        <input 
                          type="text" 
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-200 transition-all"
                        />
                      </div>
                      
                      <div className="md:col-span-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Razão Social</label>
                        <input 
                          type="text" 
                          value={formData.companyName}
                          onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-200 transition-all"
                        />
                      </div>

                      <div className="md:col-span-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">CNPJ</label>
                        <input 
                          type="text" 
                          value={formData.cnpj}
                          onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-200 transition-all"
                          placeholder="00.000.000/0000-00"
                        />
                      </div>

                      <div className="md:col-span-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Telefone</label>
                        <input 
                          type="text" 
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-200 transition-all"
                        />
                      </div>
                    </div>

                    {/* Logistics Info */}
                    <div className="pt-6 border-t border-slate-100">
                      <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                         <Navigation size={14} className="text-blue-600" /> Logística e Localização
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                         <div className="lg:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Endereço Completo</label>
                            <input 
                              type="text" 
                              required
                              value={formData.address}
                              onChange={(e) => setFormData({...formData, address: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-200 transition-all"
                            />
                         </div>
                         <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Distância ao Moinho (KM)</label>
                            <div className="relative">
                              <input 
                                type="number" 
                                required
                                value={formData.distanceKm}
                                onChange={(e) => setFormData({...formData, distanceKm: Number(e.target.value)})}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pr-12 text-sm font-black text-slate-800 outline-none focus:bg-white focus:border-blue-200 transition-all"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">KM</span>
                            </div>
                            <p className="text-[8px] font-black text-slate-400 uppercase mt-1.5 ml-1">A distância será multiplicada por 2 no cálculo logístico.</p>
                         </div>
                         <div className="lg:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Cidade</label>
                            <input 
                              type="text" 
                              required
                              value={formData.city}
                              onChange={(e) => setFormData({...formData, city: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-200 transition-all"
                            />
                         </div>
                         <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Estado (UF)</label>
                            <input 
                              type="text" 
                              maxLength={2}
                              required
                              value={formData.state}
                              onChange={(e) => setFormData({...formData, state: e.target.value.toUpperCase()})}
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-200 transition-all text-center"
                              placeholder="PR"
                            />
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 border-t border-slate-50 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-200 transition-all active:scale-95"
                    >
                      {editingEntity ? 'Salvar Alterações' : 'Concluir Cadastro'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {viewingEntity && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.15 }}
                className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
              >
                <div className="px-8 py-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-700/50 flex items-center justify-center overflow-hidden shrink-0">
                      {viewingEntity.logo ? (
                        <img src={viewingEntity.logo} alt={viewingEntity.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${viewingEntity.type === 'FORNECEDOR' ? 'bg-amber-600' : 'bg-blue-600'}`}>
                          {viewingEntity.type === 'FORNECEDOR' ? <Building2 size={22} /> : <Building size={22} />}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight">{viewingEntity.name}</h3>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5">
                        {viewingEntity.type === 'FORNECEDOR' ? 'Fornecedor' : viewingEntity.type === 'CLIENTE' ? 'Cliente' : 'Parceiro Comercial'}
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setViewingEntity(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors shrink-0">
                    <X size={20} />
                  </button>
                </div>

                <div className="p-8 space-y-6 overflow-y-auto flex-1 min-h-0 font-sans">
                  {/* Razão Social */}
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Razão Social</h4>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 gap-2">
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wide truncate">{viewingEntity.companyName || 'NÃO INFORMADA'}</p>
                      {viewingEntity.companyName && (
                        <button 
                          type="button"
                          onClick={() => handleCopy(viewingEntity.companyName!, 'companyName')}
                          className="p-1.5 hover:bg-slate-200/50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                          title="Copiar Razão Social"
                        >
                          {copiedField === 'companyName' ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* CNPJ */}
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CNPJ</h4>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 gap-2">
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">{viewingEntity.cnpj || 'NÃO INFORMADO'}</p>
                      {viewingEntity.cnpj && (
                        <button 
                          type="button"
                          onClick={() => handleCopy(viewingEntity.cnpj!, 'cnpj')}
                          className="p-1.5 hover:bg-slate-200/50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                          title="Copiar CNPJ"
                        >
                          {copiedField === 'cnpj' ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Endereço */}
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Endereço Completo</h4>
                    <div className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800 uppercase tracking-wide leading-relaxed">{viewingEntity.address}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{viewingEntity.city} - {viewingEntity.state}</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleCopy(`${viewingEntity.address}, ${viewingEntity.city} - ${viewingEntity.state}`, 'address')}
                        className="p-1.5 hover:bg-slate-200/50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors shrink-0 self-center"
                        title="Copiar Endereço"
                      >
                        {copiedField === 'address' ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Logística */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Distância</h4>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-sm font-black text-slate-800 tracking-tight">{viewingEntity.distanceKm} KM</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Distância ao Moinho</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rotas de Viagem</h4>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-sm font-black text-blue-600 tracking-tight">{viewingEntity.distanceKm * 2} KM</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">2 Viagens (Ida e Volta)</p>
                      </div>
                    </div>
                  </div>

                  {/* Telefone */}
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contato / Telefone</h4>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 gap-2">
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">{viewingEntity.phone || 'NÃO INFORMADO'}</p>
                      {viewingEntity.phone && (
                        <button 
                          type="button"
                          onClick={() => handleCopy(viewingEntity.phone!, 'phone')}
                          className="p-1.5 hover:bg-slate-200/50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                          title="Copiar Telefone"
                        >
                          {copiedField === 'phone' ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewingEntity(null)}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black uppercase tracking-wider text-xs py-4 px-6 rounded-2xl transition-all active:scale-[0.98]"
                  >
                    Fechar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        </>,
        portalTarget
      )}
    </div>
  );
};
