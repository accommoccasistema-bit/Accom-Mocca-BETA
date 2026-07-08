import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Printer, 
  Download, 
  Calendar, 
  UploadCloud, 
  Loader2, 
  AlertCircle,
  FileCheck,
  Undo2,
  X,
  FileDown,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { subscribeToMoccaDocuments, saveMoccaDocument, deleteMoccaDocument, fetchMoccaDocumentData } from '../firebase';
import { MoccaDocument } from '../types';
import { Logo } from './Logo';

interface MoccaDocsViewProps {
  onBack: () => void;
}

export const MoccaDocsView: React.FC<MoccaDocsViewProps> = ({ onBack }) => {
  const [documents, setDocuments] = useState<MoccaDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Auto-filled states upon file selection
  const [docName, setDocName] = useState('');
  const [revisionDate, setRevisionDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number; base64: string } | null>(null);
  
  // Size limit warning alert modal
  const [limitWarning, setLimitWarning] = useState<{ name: string; size: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchingDocId, setFetchingDocId] = useState<string | null>(null);

  // States for password protected deletion
  const [deletingDoc, setDeletingDoc] = useState<{ id: string; name: string } | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to documents
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToMoccaDocuments(
      (data) => {
        setDocuments(data);
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao carregar documentos:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Process selected file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setErrorMessage(null);
      setLimitWarning(null);

      if (file.type !== 'application/pdf') {
        alert('Por favor, utilize apenas arquivos no formato PDF.');
        return;
      }

      // Support files up to 20MB using cloud chunking mechanism.
      if (file.size > 20 * 1024 * 1024) {
        setLimitWarning({
          name: file.name,
          size: file.size
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        setSelectedFile({
          name: file.name,
          size: file.size,
          base64: base64String
        });
        
        // Clean and autofill name
        let cleanName = file.name.replace(/\.[^/.]+$/, ""); // strip extension
        // Beautify spacing/capitalization
        setDocName(cleanName);
        setRevisionDate(new Date().toISOString().split('T')[0]);
        setIsConfirmModalOpen(true);
      };
      reader.onerror = () => {
        alert('Erro ao processar o arquivo PDF.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle submit document
  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !revisionDate || !selectedFile) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);

    const formattedDate = revisionDate.split('-').reverse().join('/');

    try {
      await saveMoccaDocument({
        name: docName.trim(),
        revisionDate: formattedDate,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileData: selectedFile.base64
      });

      // Reset
      setSelectedFile(null);
      setIsConfirmModalOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      console.error(error);
      setErrorMessage('Falha ao gravar arquivo no Firestore (Limite de cota excedido ou formato inválido).');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Document Confirmation Trigger
  const handleDeleteTrigger = (id: string, name: string) => {
    setDeletingDoc({ id, name });
    setDeletePassword('');
    setDeleteError(null);
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingDoc) return;

    if (deletePassword !== '1430') {
      setDeleteError('Senha incorreta! Não autorizado.');
      return;
    }

    setActionLoading(true);
    setDeleteError(null);
    try {
      await deleteMoccaDocument(deletingDoc.id);
      setDeletingDoc(null);
      setDeletePassword('');
    } catch (error: any) {
      console.error(error);
      let errMsg = 'Erro ao excluir do banco de dados.';
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.error && (parsed.error.includes('quota') || parsed.error.includes('resource-exhausted') || parsed.error.includes('Quota'))) {
          errMsg = 'Erro: Limite de cota diária do Firestore atingido! Tente novamente amanhã ou faça upgrade.';
        } else if (parsed.error) {
          errMsg = `Erro: ${parsed.error}`;
        }
      } catch (e) {
        if (error.message && (error.message.includes('quota') || error.message.includes('resource-exhausted'))) {
          errMsg = 'Erro: Limite de cota diária do Firestore atingido! Tente novamente amanhã ou faça upgrade.';
        }
      }
      setDeleteError(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Download PDF
  const handleDownload = async (doc: MoccaDocument) => {
    if (actionLoading || fetchingDocId) return;
    setFetchingDocId(doc.id);
    try {
      const fullData = await fetchMoccaDocumentData(doc.id, !!doc.isChunked, doc.fileData);
      const link = document.createElement('a');
      link.href = fullData;
      link.download = doc.fileName || `${doc.name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('Não foi possível realizar o download.');
    } finally {
      setFetchingDocId(null);
    }
  };

  // Print PDF 
  const handlePrint = async (doc: MoccaDocument) => {
    if (actionLoading || fetchingDocId) return;
    setFetchingDocId(doc.id);
    try {
      const fullData = await fetchMoccaDocumentData(doc.id, !!doc.isChunked, doc.fileData);
      const parts = fullData.split(';base64,');
      if (parts.length < 2) {
        throw new Error('Formato de dados base64 inválido.');
      }
      const contentType = parts[0].split(':')[1] || 'application/pdf';
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      
      const blob = new Blob([uInt8Array], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
            document.body.removeChild(iframe);
          }, 5000);
        } catch (e) {
          console.warn("Iframe printing blocked or failed, opening in new window:", e);
          const printWindow = window.open(blobUrl, '_blank');
          if (printWindow) {
            printWindow.focus();
          } else {
            alert('Por favor, autorize pop-ups para imprimir diretamente ou utilize a opção Baixar.');
          }
          setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
            document.body.removeChild(iframe);
          }, 5000);
        }
      };
    } catch (err) {
      console.error(err);
      alert('Impossível preparar impressão deste documento. Recomendamos realizar o download e imprimir localmente.');
    } finally {
      setFetchingDocId(null);
    }
  };

  // Filter docs
  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.revisionDate.includes(searchTerm)
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 w-full" id="mocca_docs_panel">
      
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-100 py-6 px-6 md:px-8 sticky top-0 z-40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4" id="mocca_header_main">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 hover:bg-slate-50 border border-slate-150 rounded-none text-slate-500 hover:text-slate-900 transition-all active:scale-95 flex items-center justify-center mr-1"
            title="Voltar ao Painel Principal"
          >
            <Undo2 size={18} />
          </button>

          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="p-1 px-2.5 bg-slate-900 text-white font-black text-lg rounded-sm">DOCS</span>
              <span className="text-slate-800">MOCCA</span>
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              PASTA DE DOCUMENTOS REVISADOS //ACCOM
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          
          {/* Search box */}
          <div className="relative min-w-[260px] sm:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <Search size={16} />
            </span>
            <input 
              type="text"
              placeholder="Pesquisar nos arquivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white text-sm outline-none transition-all placeholder:text-slate-400 font-medium rounded-none"
            />
          </div>

          {/* Trigger button (Anexar Revisão) */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={actionLoading}
            className="bg-emerald-600 hover:bg-emerald-750 text-white font-black px-6 py-3 rounded-none text-xs tracking-widest transition-all active:scale-95 uppercase flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-50 shrink-0"
            id="anexar_revisao_main_btn"
          >
            {actionLoading ? (
              <Loader2 size={16} className="animate-spin text-white" />
            ) : (
              <UploadCloud size={16} />
            )}
            Anexar Revisão
          </button>

          {/* Hidden Direct File Input */}
          <input 
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Full-width content wrapper */}
      <div className="flex-grow p-6 md:p-8 w-full max-w-full mx-auto" id="mocca_docs_table_scaffold">
        <div className="bg-white p-6 md:p-8 rounded-none border border-slate-200 shadow-sm min-h-[500px] flex flex-col justify-between">
          
          <div>
            {/* Folder heading row */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <FileText size={18} className="text-slate-700" />
                LISTA DE DOCUMENTOS ({filteredDocs.length})
              </h2>
              <div className="flex items-center gap-3">
                {searchTerm && (
                  <span className="text-[9px] font-black bg-blue-50 text-blue-700 px-2.5 py-1 uppercase rounded border border-blue-150">
                    Filtro Ativo
                  </span>
                )}
              </div>
            </div>

            {loading ? (
              /* Synchronizing Data Spinner */
              <div className="flex flex-col items-center justify-center py-32 text-slate-450 gap-3">
                <Loader2 size={38} className="animate-spin text-slate-750" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">
                  Conectando ao Firestore ACCOM...
                </p>
              </div>
            ) : filteredDocs.length === 0 ? (
              /* Empty list viewport */
              <div className="flex flex-col items-center justify-center py-24 text-slate-400 text-center px-4">
                <div className="p-4 bg-slate-50 border border-slate-150 mb-4 rounded-sm text-slate-300">
                  <FileText size={42} />
                </div>
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Nenhum Documento</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-2 max-w-[400px] uppercase tracking-wider leading-relaxed">
                  {searchTerm 
                    ? "Inicie outra busca ou remova os filtros de pesquisa acima para listar mais relatórios." 
                    : "Sua pasta de homologações está vazia. Clique no botão verde 'Anexar Revisão' acima para anexar um PDF técnico."}
                </p>
              </div>
            ) : (
              /* Premium Row-Based Dashboard Table (Full Width) */
              <div className="flex flex-col border border-slate-200 divide-y divide-slate-100 shadow-sm overflow-hidden bg-white rounded-none">
                {/* Header row (Desktop Only) */}
                <div className="hidden md:flex items-center justify-between px-5 py-4 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-205 gap-4">
                  <div className="flex-1 min-w-0 flex items-center gap-4">
                    <span className="w-10 block"></span>
                    <span className="flex-grow">Título do Documento</span>
                  </div>
                  <div className="w-48 text-left">Arquivo PDF</div>
                  <div className="w-28 text-center">Data Revisão</div>
                  <div className="w-24 text-right pr-4">Tamanho</div>
                  <div className="w-56 text-right">Ações Disponíveis</div>
                </div>

                {/* Rows listing */}
                {filteredDocs.map((doc) => (
                  <div 
                    key={doc.id}
                    className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-all duration-200 group relative"
                    id={`row_${doc.id}`}
                  >
                    {/* File Icon, Title & Base attributes */}
                    <div className="flex-1 min-w-0 flex items-center gap-4">
                      {/* Format tag badge */}
                      <div className="p-2 bg-red-50 border border-red-100 text-red-600 rounded-sm shrink-0 flex flex-col items-center justify-center text-[10px] font-black w-10 h-10 group-hover:bg-red-100/50 transition-colors">
                        <span className="text-[9px] uppercase">PDF</span>
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-black text-slate-800 tracking-tight group-hover:text-amber-955 transition-colors leading-snug">
                            {doc.name}
                          </h4>
                        </div>
                        {/* Mobile Details layout */}
                        <div className="flex md:hidden items-center gap-2 mt-1.5 text-[9px] text-slate-410 font-bold uppercase tracking-wider">
                          <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 border border-blue-100 rounded">
                            REV: {doc.revisionDate}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-slate-500 lowercase max-w-[150px] truncate">{doc.fileName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Meta Section: Filename (Desktop only) */}
                    <div className="hidden md:block w-48 text-left min-w-0 truncate">
                      <span className="font-mono text-[11px] text-slate-500 font-bold block truncate" title={doc.fileName}>
                        {doc.fileName}
                      </span>
                    </div>

                    {/* Meta Section: Revision Date (Desktop only) */}
                    <div className="hidden md:block w-28 text-center shrink-0">
                      <span className="text-xs font-black px-2.5 py-1 bg-amber-50 border border-amber-100 text-amber-800 uppercase tracking-widest rounded-sm">
                        {doc.revisionDate}
                      </span>
                    </div>

                    {/* Meta Section: Document File size (Desktop only) */}
                    <div className="hidden md:block w-24 text-right pr-4 shrink-0">
                      <span className="text-xs font-bold text-slate-400 font-mono">
                        {(doc.fileSize / 1024).toFixed(0)} KB
                      </span>
                    </div>

                    {/* Premium actions controllers bar */}
                    <div className="flex items-center gap-2 self-end md:self-auto shrink-0 w-full md:w-56 justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                      
                      {/* Print button */}
                      <button
                        onClick={() => handlePrint(doc)}
                        disabled={fetchingDocId !== null || actionLoading}
                        className="px-3.5 py-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300 transition-all flex items-center justify-center gap-1.5 text-xs font-black shadow-sm disabled:opacity-50"
                        title="Imprimir PDF"
                      >
                        {fetchingDocId === doc.id ? (
                          <Loader2 size={13} className="animate-spin text-slate-500" />
                        ) : (
                          <Printer size={13} />
                        )}
                        <span className="uppercase tracking-widest text-[8px]">
                          {fetchingDocId === doc.id ? 'Carregando...' : 'Imprimir'}
                        </span>
                      </button>

                      {/* Download button */}
                      <button
                        onClick={() => handleDownload(doc)}
                        disabled={fetchingDocId !== null || actionLoading}
                        className="px-3.5 py-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300 transition-all flex items-center justify-center gap-1.5 text-xs font-black shadow-sm disabled:opacity-50"
                        title="Fazer Download"
                      >
                        {fetchingDocId === doc.id ? (
                          <Loader2 size={13} className="animate-spin text-slate-500" />
                        ) : (
                          <Download size={13} />
                        )}
                        <span className="uppercase tracking-widest text-[8px]">
                          {fetchingDocId === doc.id ? 'Carregando...' : 'Baixar'}
                        </span>
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteTrigger(doc.id, doc.name)}
                        className="p-2.5 bg-red-50 border border-red-100 text-red-650 hover:text-red-750 hover:bg-red-100 transition-all flex items-center justify-center"
                        title="Remover permanentemente"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer information details */}
          <div className="mt-10 pt-4 border-t border-slate-100 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-2.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              SISTEMA INTEGRADO DE DOCUMENTAÇÃO ACCOM
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              • ARQUIVOS SALVOS NO CLOUD CRIPTOGRAFADOS EM SEGURANÇA
            </span>
          </div>

        </div>
      </div>

      {/* Confirmation and Naming Overlay Modal */}
      <AnimatePresence>
        {isConfirmModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto" id="mocca_confirm_modal">
            
            {/* Dim Backdrop hover banner */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" 
              onClick={() => {
                if (!actionLoading) setIsConfirmModalOpen(false);
              }}
            />

            {/* Modal Box wrapper */}
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <motion.div 
                initial={{ scale: 0.96, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 15 }}
                className="w-full max-w-lg transform overflow-hidden bg-white p-6 md:p-8 text-left align-middle shadow-2xl border border-slate-200 relative"
              >
                
                {/* Close modal control */}
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(false)}
                  disabled={actionLoading}
                  className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-none transition-colors border border-slate-200 disabled:opacity-50"
                >
                  <X size={16} />
                </button>

                <div className="mb-5">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <FileCheck size={20} className="text-emerald-600" />
                    Confirmar Envio Técnica
                  </h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Verifique name e data antes de enviar para a nuvem
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 mb-4 text-xs font-black bg-red-50 border border-red-150 text-red-800 flex items-start gap-2.5">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleConfirmSubmit} className="space-y-4">
                  
                  {/* Name field */}
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Identificação do Documento / Título
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="FISPQ - Farinha de Trigo Especial"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-205 rounded-none text-sm outline-none bg-slate-50 focus:bg-white focus:border-slate-400 transition-all font-sans font-medium"
                    />
                  </div>

                  {/* Date field */}
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Data Homologada ACCOM
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                        <Calendar size={15} />
                      </span>
                      <input 
                        type="date"
                        required
                        value={revisionDate}
                        onChange={(e) => setRevisionDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-205 rounded-none text-sm outline-none bg-slate-50 focus:bg-white focus:border-slate-400 transition-all font-sans font-medium"
                      />
                    </div>
                  </div>

                  {/* File info details preview metadata */}
                  <div className="p-4 bg-slate-50 border border-slate-150 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Nome do Arquivo:</span>
                      <span className="font-mono text-slate-650 max-w-[200px] truncate">{selectedFile?.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Tamanho do Arquivo:</span>
                      <span className="font-mono text-slate-650">
                        {selectedFile ? (selectedFile.size / 1024).toFixed(1) : 0} KB
                      </span>
                    </div>
                  </div>

                  {/* Confirm controller buttons */}
                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setIsConfirmModalOpen(false)}
                      className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-none text-xs tracking-wider hover:bg-slate-50 transition-all uppercase"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex-[2] bg-emerald-600 hover:bg-emerald-750 text-white font-black py-3.5 rounded-none text-xs tracking-widest transition-all active:scale-95 uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-50 disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-white" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <FileDown size={14} />
                          Salvar Arquivo
                        </>
                      )}
                    </button>
                  </div>
                </form>

              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Extreme Size Limit Warning Dialogue Modal (Firestore 1MB limitation) */}
      <AnimatePresence>
        {limitWarning && (
          <div className="fixed inset-0 z-[60] overflow-y-auto" id="mocca_limit_warning_modal">
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
              onClick={() => setLimitWarning(null)}
            />

            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <motion.div 
                initial={{ scale: 0.96, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 15 }}
                className="w-full max-w-md transform overflow-hidden bg-white p-7 text-left align-middle shadow-2xl border border-red-200 relative"
              >
                
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-650 flex items-center justify-center mb-4 border border-red-100">
                  <AlertCircle size={24} />
                </div>

                <h3 className="text-sm font-black text-red-800 uppercase tracking-widest mb-2">
                  Arquivo do PDF muito grande!
                </h3>
                
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-4">
                  O banco de dados do Sistema ACCOM permite anexos de no máximo 20 MB.
                </p>

                <div className="p-4 bg-slate-50 border border-slate-150 text-[11px] text-slate-600 space-y-2.5 font-sans mb-5 font-medium leading-relaxed">
                  <p>
                    O arquivo selecionado <strong>"{limitWarning.name}"</strong> possui{' '}
                    <span className="text-red-600 font-bold">
                      {(limitWarning.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                    , superando o limite máximo configurado de{' '}
                    <span className="text-slate-800 font-bold">20 MB</span>.
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider pt-1 border-t border-slate-200">
                    💡 POR QUE EXISTE ESSE LIMITE?
                  </p>
                  <p className="text-[10.5px] italic text-slate-500">
                    Para garantir que o carregamento e processamento dos relatórios em PDF permaneça rápido e estável para todos os usuários autorizados do sistema.
                  </p>
                </div>

                {/* Helpful guides and actions */}
                <div className="flex flex-col gap-3">
                  <a 
                    href="https://www.ilovepdf.com/pt/comprimir_pdf" 
                    target="_blank" 
                    referrerPolicy="no-referrer"
                    className="w-full bg-slate-900 text-white font-black py-3 text-xs tracking-widest hover:bg-slate-800 transition-all active:scale-95 uppercase flex items-center justify-center gap-2 shadow-md"
                  >
                    <ExternalLink size={14} />
                    Comprimir PDF no I Love PDF
                  </a>
                  <button
                    onClick={() => setLimitWarning(null)}
                    className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3 text-xs tracking-wider hover:bg-slate-50 transition-all uppercase"
                  >
                    Fechar e tentar outro
                  </button>
                </div>

              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Confirmation Deletion Modal */}
      <AnimatePresence>
        {deletingDoc && (
          <div className="fixed inset-0 z-[60] overflow-y-auto" id="mocca_delete_doc_modal">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
              onClick={() => {
                if (!actionLoading) setDeletingDoc(null);
              }}
            />

            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <motion.div 
                initial={{ scale: 0.96, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 15 }}
                className="w-full max-w-sm transform overflow-hidden bg-white p-6 text-left align-middle shadow-2xl border border-red-200 relative"
              >
                
                <button
                  type="button"
                  onClick={() => setDeletingDoc(null)}
                  disabled={actionLoading}
                  className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-none transition-colors border border-slate-200 disabled:opacity-50"
                >
                  <X size={14} />
                </button>

                <div className="mb-4">
                  <h3 className="text-sm font-black text-red-650 uppercase tracking-widest flex items-center gap-2">
                    <Trash2 size={18} />
                    Confirmar Exclusão
                  </h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Esta ação é permanente e irreversível.
                  </p>
                </div>

                <div className="p-3 bg-red-50/50 border border-red-100 text-[11px] text-slate-700 font-sans font-medium mb-4 leading-relaxed rounded-sm">
                  Deseja realmente excluir o documento: <strong className="text-red-750 font-black">{deletingDoc.name}</strong>?
                </div>

                {deleteError && (
                  <div className="p-2.5 mb-4 text-[11px] font-black bg-red-50 border border-red-150 text-red-800 flex items-start gap-2 rounded-sm">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{deleteError}</span>
                  </div>
                )}

                <form onSubmit={handleConfirmDelete} className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Senha de Autorização (Digite 1430)
                    </label>
                    <input 
                      type="password"
                      required
                      placeholder="••••"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-205 rounded-none text-center text-lg tracking-widest outline-none bg-slate-50 focus:bg-white focus:border-red-400 transition-all font-mono font-bold"
                      id="mocca_delete_pass_input"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setDeletingDoc(null)}
                      className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-2.5 rounded-none text-xs tracking-wider hover:bg-slate-50 transition-all uppercase"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading || !deletePassword}
                      className="flex-1 bg-red-600 hover:bg-red-750 text-white font-black py-2.5 rounded-none text-xs tracking-widest transition-all active:scale-95 uppercase flex items-center justify-center gap-1.5 shadow-lg shadow-red-50 disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <>
                          <Loader2 size={13} className="animate-spin text-white" />
                          Excluindo...
                        </>
                      ) : (
                        <>
                          Apagar
                        </>
                      )}
                    </button>
                  </div>
                </form>

              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
