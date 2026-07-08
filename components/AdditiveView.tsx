import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../src/shared/contexts/DataContext';
import { 
  saveAdditive, 
  deleteAdditive, 
  saveAdditiveEntry, 
  saveAdditiveOutput, 
  saveAdditiveApplication 
} from '../firebase';
import { 
  Additive, 
  AdditiveEntry, 
  AdditiveOutput, 
  AdditiveApplication, 
  AdditiveLot, 
  Entity, 
  Batch 
} from '../types';
import { Toast, ToastType } from './Toast';
import { 
  FlaskConical, 
  LayoutGrid, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Droplets, 
  Package, 
  History, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  CheckCircle2, 
  Printer, 
  Download, 
  X, 
  Calendar, 
  Clock, 
  FileText, 
  ArrowRightLeft, 
  Users, 
  ChevronRight,
  TrendingUp,
  TrendingDown
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
  Cell,
  Legend
} from 'recharts';

interface AdditiveViewProps {
  onBack: () => void;
}

type TabType = 'dashboard' | 'register' | 'entry' | 'output' | 'application' | 'stock' | 'history';

export const AdditiveView: React.FC<AdditiveViewProps> = ({ onBack }) => {
  const { 
    additives, 
    additiveEntries, 
    additiveOutputs, 
    additiveApplications, 
    additiveLots, 
    entities, 
    batches,
    loadingAdditives,
    loadingAdditiveEntries,
    loadingAdditiveOutputs,
    loadingAdditiveApplications,
    loadingAdditiveLots
  } = useData();

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
  };

  // State for Modals
  const [showAddAdditiveModal, setShowAddAdditiveModal] = useState(false);
  const [editingAdditive, setEditingAdditive] = useState<Additive | null>(null);

  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [showAddOutputModal, setShowAddOutputModal] = useState(false);
  const [showAddApplicationModal, setShowAddApplicationModal] = useState(false);
  const [showLotDetailsModal, setShowLotDetailsModal] = useState<AdditiveLot | null>(null);

  // Form States - Additive Registry
  const [addName, setAddName] = useState('');
  const [addTechnicalName, setAddTechnicalName] = useState('');
  const [addManufacturer, setAddManufacturer] = useState('');
  const [addSupplier, setAddSupplier] = useState('');
  const [addCategory, setAddCategory] = useState('Melhorador');
  const [addUnit, setAddUnit] = useState('Kg');
  const [addRecommendedDosage, setAddRecommendedDosage] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addStatus, setAddStatus] = useState<'Ativo' | 'Inativo'>('Ativo');
  const [addObservations, setAddObservations] = useState('');
  const [addMinStock, setAddMinStock] = useState('');
  const [isSavingAdditive, setIsSavingAdditive] = useState(false);

  // Form States - Entry
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryTime, setEntryTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [entryAdditiveId, setEntryAdditiveId] = useState('');
  const [entrySupplierId, setEntrySupplierId] = useState('');
  const [entryInvoice, setEntryInvoice] = useState('');
  const [entryQty, setEntryQty] = useState('');
  const [entryMfgLot, setEntryMfgLot] = useState('');
  const [entryMfgDate, setEntryMfgDate] = useState('');
  const [entryExpDate, setEntryExpDate] = useState('');
  const [entryStorage, setEntryStorage] = useState('Almoxarifado Aditivos');
  const [entryReceiver, setEntryReceiver] = useState('');
  const [entryNotes, setEntryNotes] = useState('');
  const [isSavingEntry, setIsSavingEntry] = useState(false);

  // Combined New Additive inside Entry form
  const [isNewAdditive, setIsNewAdditive] = useState(false);
  const [newAddName, setNewAddName] = useState('');
  const [newAddTechnicalName, setNewAddTechnicalName] = useState('');
  const [newAddManufacturer, setNewAddManufacturer] = useState('');
  const [newAddCategory, setNewAddCategory] = useState('Melhorador');
  const [newAddUnit, setNewAddUnit] = useState('Kg');
  const [newAddRecommendedDosage, setNewAddRecommendedDosage] = useState('');
  const [newAddDescription, setNewAddDescription] = useState('');
  const [newAddObservations, setNewAddObservations] = useState('');
  const [newAddMinStock, setNewAddMinStock] = useState('');

  // Form States - Manual Output
  const [outDate, setOutDate] = useState(new Date().toISOString().split('T')[0]);
  const [outTime, setOutTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [outAdditiveId, setOutAdditiveId] = useState('');
  const [outLotInternalCode, setOutLotInternalCode] = useState('');
  const [outQty, setOutQty] = useState('');
  const [outResponsible, setOutResponsible] = useState('');
  const [outReason, setOutReason] = useState('Descarte por Validade');
  const [isSavingOutput, setIsSavingOutput] = useState(false);

  // Form States - Application
  const [appDate, setAppDate] = useState(new Date().toISOString().split('T')[0]);
  const [appTime, setAppTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [appOperator, setAppOperator] = useState('');
  const [appAdditiveId, setAppAdditiveId] = useState('');
  const [appLotInternalCode, setAppLotInternalCode] = useState('');
  const [appQty, setAppQty] = useState('');
  const [appFlourBatchId, setAppFlourBatchId] = useState('');
  const [isSavingApplication, setIsSavingApplication] = useState(false);

  // Filter States - History Tab
  const [histStartDate, setHistStartDate] = useState('');
  const [histEndDate, setHistEndDate] = useState('');
  const [histSupplier, setHistSupplier] = useState('');
  const [histAdditiveId, setHistAdditiveId] = useState('');
  const [histLotCode, setHistLotCode] = useState('');
  const [histOperator, setHistOperator] = useState('');
  const [histExpDate, setHistExpDate] = useState('');
  const [histType, setHistType] = useState<'all' | 'entry' | 'output' | 'application'>('all');

  // Supplier List from Entities
  const supplierEntities = useMemo(() => {
    return entities.filter(e => e.type === 'FORNECEDOR' || e.type === 'AMBOS');
  }, [entities]);

  // Active Flour Batches in Production
  const activeFlourBatches = useMemo(() => {
    return batches.filter(b => b.status === 'OPEN');
  }, [batches]);

  // Selected entry aditivo unit pre-fill
  const selectedEntryUnit = useMemo(() => {
    if (isNewAdditive) return newAddUnit;
    const selected = additives.find(a => a.id === entryAdditiveId);
    return selected ? selected.unit : 'Kg';
  }, [entryAdditiveId, additives, isNewAdditive, newAddUnit]);

  const selectedEntrySupplierName = useMemo(() => {
    const selected = entities.find(e => e.id === entrySupplierId);
    return selected ? selected.name : '';
  }, [entrySupplierId, entities]);

  // Selected output aditivo unit & lots pre-fill
  const selectedOutputLots = useMemo(() => {
    if (!outAdditiveId) return [];
    return additiveLots.filter(l => l.additiveId === outAdditiveId && l.currentStock > 0);
  }, [outAdditiveId, additiveLots]);

  const selectedOutputUnit = useMemo(() => {
    const selected = additives.find(a => a.id === outAdditiveId);
    return selected ? selected.unit : 'Kg';
  }, [outAdditiveId, additives]);

  // Selected application aditivo unit & lots pre-fill
  const selectedAppLots = useMemo(() => {
    if (!appAdditiveId) return [];
    return additiveLots.filter(l => l.additiveId === appAdditiveId && l.currentStock > 0);
  }, [appAdditiveId, additiveLots]);

  const selectedAppUnit = useMemo(() => {
    const selected = additives.find(a => a.id === appAdditiveId);
    return selected ? selected.unit : 'Kg';
  }, [appAdditiveId, additives]);


  // --- HANDLERS ---

  // Add/Update Additive Register
  const handleOpenAddAdditive = (add: Additive | null = null) => {
    if (add) {
      setEditingAdditive(add);
      setAddName(add.name);
      setAddTechnicalName(add.technicalName);
      setAddManufacturer(add.manufacturer);
      setAddSupplier(add.supplier);
      setAddCategory(add.category);
      setAddUnit(add.unit);
      setAddRecommendedDosage(add.recommendedDosage);
      setAddDescription(add.description);
      setAddStatus(add.status);
      setAddObservations(add.observations);
      setAddMinStock(add.minStock?.toString() || '');
    } else {
      setEditingAdditive(null);
      setAddName('');
      setAddTechnicalName('');
      setAddManufacturer('');
      setAddSupplier('');
      setAddCategory('Melhorador');
      setAddUnit('Kg');
      setAddRecommendedDosage('');
      setAddDescription('');
      setAddStatus('Ativo');
      setAddObservations('');
      setAddMinStock('');
    }
    setShowAddAdditiveModal(true);
  };

  const handleSaveAdditiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName || !addTechnicalName || !addManufacturer || !addUnit) {
      showToast("Preencha todos os campos obrigatórios!", "error");
      return;
    }

    setIsSavingAdditive(true);
    const data = {
      name: addName.toUpperCase(),
      technicalName: addTechnicalName.toUpperCase(),
      manufacturer: addManufacturer.toUpperCase(),
      supplier: addSupplier.toUpperCase(),
      category: addCategory,
      unit: addUnit,
      recommendedDosage: addRecommendedDosage,
      description: addDescription,
      status: addStatus,
      observations: addObservations,
      minStock: Number(addMinStock) || 0
    };

    const success = await saveAdditive(data, editingAdditive?.id);
    setIsSavingAdditive(false);

    if (success) {
      showToast(editingAdditive ? "Aditivo atualizado com sucesso!" : "Aditivo cadastrado com sucesso!", "success");
      setShowAddAdditiveModal(false);
    } else {
      showToast("Erro ao salvar cadastro do aditivo.", "error");
    }
  };

  const handleDeleteAdditiveClick = async (id: string, name: string) => {
    if (window.confirm(`Deseja realmente excluir o aditivo "${name}"? Esta ação não pode ser desfeita.`)) {
      const success = await deleteAdditive(id);
      if (success) {
        showToast("Aditivo excluído com sucesso!", "success");
      } else {
        showToast("Erro ao excluir aditivo.", "error");
      }
    }
  };

  // Submit entry
  const handleSaveEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (isNewAdditive) {
      if (!newAddName || !newAddTechnicalName || !newAddManufacturer || !entryQty || !entryReceiver || !entryMfgLot || !entryExpDate) {
        showToast("Preencha todos os campos obrigatórios (*) do aditivo e da entrada", "error");
        return;
      }
    } else {
      if (!entryAdditiveId || !entryQty || !entryReceiver || !entryMfgLot || !entryExpDate) {
        showToast("Preencha os campos obrigatórios (*)", "error");
        return;
      }
    }

    setIsSavingEntry(true);
    let finalAdditiveId = entryAdditiveId;
    let finalAdditiveName = '';

    if (isNewAdditive) {
      // 1. Register the additive first
      const additiveData = {
        name: newAddName.toUpperCase(),
        technicalName: newAddTechnicalName.toUpperCase(),
        manufacturer: newAddManufacturer.toUpperCase(),
        supplier: selectedEntrySupplierName || entrySupplierId.toUpperCase() || 'NÃO ESPECIFICADO',
        category: newAddCategory,
        unit: newAddUnit,
        recommendedDosage: newAddRecommendedDosage,
        description: newAddDescription,
        status: 'Ativo' as const,
        observations: newAddObservations,
        minStock: Number(newAddMinStock) || 0
      };

      const result = await saveAdditive(additiveData);
      if (typeof result === 'string') {
        finalAdditiveId = result;
        finalAdditiveName = newAddName.toUpperCase();
      } else {
        setIsSavingEntry(false);
        showToast("Erro ao cadastrar novo aditivo no ato da entrada.", "error");
        return;
      }
    } else {
      const selectedAdditive = additives.find(a => a.id === entryAdditiveId);
      finalAdditiveName = selectedAdditive?.name || '';
    }

    const entryData = {
      date: entryDate,
      time: entryTime,
      additiveId: finalAdditiveId,
      additiveName: finalAdditiveName,
      supplier: selectedEntrySupplierName || entrySupplierId.toUpperCase() || 'NÃO ESPECIFICADO',
      invoiceNumber: entryInvoice,
      qtyReceived: Number(entryQty.replace(/\./g, '').replace(',', '.')) || 0,
      unit: selectedEntryUnit,
      manufacturerLot: entryMfgLot.toUpperCase(),
      manufacturingDate: entryMfgDate,
      expiryDate: entryExpDate,
      storageLocation: entryStorage,
      receiver: entryReceiver.toUpperCase(),
      observations: entryNotes
    };

    const success = await saveAdditiveEntry(entryData);
    setIsSavingEntry(false);

    if (success) {
      showToast(isNewAdditive 
        ? "Novo aditivo cadastrado e entrada registrada com sucesso!" 
        : "Entrada registrada e lote interno gerado com sucesso!", "success");
      
      setShowAddEntryModal(false);
      
      // Reset entry fields
      setEntryQty('');
      setEntryMfgLot('');
      setEntryInvoice('');
      setEntryReceiver('');
      setEntryNotes('');
      setEntryAdditiveId('');
      
      // Reset new additive fields
      setIsNewAdditive(false);
      setNewAddName('');
      setNewAddTechnicalName('');
      setNewAddManufacturer('');
      setNewAddCategory('Melhorador');
      setNewAddUnit('Kg');
      setNewAddRecommendedDosage('');
      setNewAddDescription('');
      setNewAddObservations('');
      setNewAddMinStock('');
    } else {
      showToast("Erro ao registrar entrada de aditivos.", "error");
    }
  };

  // Submit Outbound
  const handleSaveOutputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outAdditiveId || !outLotInternalCode || !outQty || !outResponsible) {
      showToast("Preencha todos os campos obrigatórios (*)", "error");
      return;
    }

    const selectedLot = additiveLots.find(l => l.id === outLotInternalCode || l.lotInternalCode === outLotInternalCode);
    if (!selectedLot) {
      showToast("Lote do aditivo não encontrado.", "error");
      return;
    }

    const outputQty = Number(outQty.replace(/\./g, '').replace(',', '.')) || 0;
    if (outputQty > selectedLot.currentStock) {
      showToast(`Estoque insuficiente! Saldo disponível no lote: ${selectedLot.currentStock.toLocaleString('pt-BR')} ${selectedLot.unit}`, "error");
      return;
    }

    setIsSavingOutput(true);
    const selectedAdditive = additives.find(a => a.id === outAdditiveId);

    const outputData = {
      date: outDate,
      time: outTime,
      additiveId: outAdditiveId,
      additiveName: selectedAdditive?.name || '',
      lotInternalCode: selectedLot.lotInternalCode,
      qty: outputQty,
      unit: selectedOutputUnit,
      responsible: outResponsible.toUpperCase(),
      reason: outReason
    };

    const success = await saveAdditiveOutput(outputData, selectedLot.id);
    setIsSavingOutput(false);

    if (success) {
      showToast("Saída de estoque registrada com sucesso!", "success");
      setShowAddOutputModal(false);
      setOutQty('');
      setOutResponsible('');
    } else {
      showToast("Erro ao registrar saída de aditivos.", "error");
    }
  };

  // Submit Application
  const handleSaveApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appAdditiveId || !appLotInternalCode || !appQty || !appOperator || !appFlourBatchId) {
      showToast("Preencha todos os campos obrigatórios (*)", "error");
      return;
    }

    const selectedLot = additiveLots.find(l => l.id === appLotInternalCode || l.lotInternalCode === appLotInternalCode);
    if (!selectedLot) {
      showToast("Lote do aditivo não encontrado.", "error");
      return;
    }

    const applyQty = Number(appQty.replace(/\./g, '').replace(',', '.')) || 0;
    if (applyQty > selectedLot.currentStock) {
      showToast(`Estoque insuficiente! Saldo disponível no lote: ${selectedLot.currentStock.toLocaleString('pt-BR')} ${selectedLot.unit}`, "error");
      return;
    }

    setIsSavingApplication(true);
    const selectedAdditive = additives.find(a => a.id === appAdditiveId);
    const selectedFlourBatch = batches.find(b => b.id === appFlourBatchId);

    const applicationData = {
      date: appDate,
      time: appTime,
      operator: appOperator.toUpperCase(),
      additiveId: appAdditiveId,
      additiveName: selectedAdditive?.name || '',
      lotInternalCode: selectedLot.lotInternalCode,
      qtyApplied: applyQty,
      unit: selectedAppUnit,
      flourBatchId: appFlourBatchId,
      flourBatchName: selectedFlourBatch?.name || ''
    };

    const success = await saveAdditiveApplication(applicationData, selectedLot.id);
    setIsSavingApplication(false);

    if (success) {
      showToast("Aplicação na produção lançada com sucesso!", "success");
      setShowAddApplicationModal(false);
      setAppQty('');
      setAppOperator('');
    } else {
      showToast("Erro ao salvar lançamento de aplicação.", "error");
    }
  };


  // --- CALCULATIONS FOR ESTIMATIONS & METRICS (DASHBOARD & ESTOQUE) ---

  const todayStr = new Date().toISOString().split('T')[0];

  // Expirations
  const upcomingLotsCount = useMemo(() => {
    const limit = new Date();
    limit.setDate(limit.getDate() + 30);
    const limitStr = limit.toISOString().split('T')[0];

    return additiveLots.filter(l => l.currentStock > 0 && l.expiryDate >= todayStr && l.expiryDate <= limitStr).length;
  }, [additiveLots, todayStr]);

  const expiredLotsCount = useMemo(() => {
    return additiveLots.filter(l => l.currentStock > 0 && l.expiryDate < todayStr).length;
  }, [additiveLots, todayStr]);

  const lowStockAlertsCount = useMemo(() => {
    // Group active stocks by additiveId
    const stocks: Record<string, number> = {};
    additiveLots.forEach(l => {
      stocks[l.additiveId] = (stocks[l.additiveId] || 0) + l.currentStock;
    });

    return additives.filter(a => a.status === 'Ativo' && (stocks[a.id] || 0) <= a.minStock).length;
  }, [additives, additiveLots]);

  // Total current active inventory in KG (assuming all units are in KG or treating them with their nominal sum)
  const totalStockQty = useMemo(() => {
    return additiveLots.reduce((acc, curr) => acc + curr.currentStock, 0);
  }, [additiveLots]);

  // Consumption analysis (Entries, Manual Outputs, and Applications)
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM
  const monthEntriesSum = useMemo(() => {
    return additiveEntries
      .filter(e => e.date.startsWith(currentMonthStr))
      .reduce((acc, curr) => acc + curr.qtyReceived, 0);
  }, [additiveEntries, currentMonthStr]);

  const monthOutputsSum = useMemo(() => {
    const manualSum = additiveOutputs
      .filter(o => o.date.startsWith(currentMonthStr))
      .reduce((acc, curr) => acc + curr.qty, 0);

    const appSum = additiveApplications
      .filter(a => a.date.startsWith(currentMonthStr))
      .reduce((acc, curr) => acc + curr.qtyApplied, 0);

    return manualSum + appSum;
  }, [additiveOutputs, additiveApplications, currentMonthStr]);

  // Daily average of last 7 active days
  const dailyAverageConsumption = useMemo(() => {
    // Get last 7 days of applications + outputs
    const last7Days: Record<string, number> = {};
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - 7);
    const limitStr = dateLimit.toISOString().split('T')[0];

    additiveApplications
      .filter(a => a.date >= limitStr)
      .forEach(a => {
        last7Days[a.date] = (last7Days[a.date] || 0) + a.qtyApplied;
      });

    additiveOutputs
      .filter(o => o.date >= limitStr)
      .forEach(o => {
        last7Days[o.date] = (last7Days[o.date] || 0) + o.qty;
      });

    const values = Object.values(last7Days);
    if (values.length === 0) return 0;
    const total = values.reduce((acc, v) => acc + v, 0);
    return total / 7;
  }, [additiveApplications, additiveOutputs]);

  // Aggregate active stock per additive for low stock alerts check
  const additiveAggregatedStock = useMemo(() => {
    const balances: Record<string, number> = {};
    additiveLots.forEach(l => {
      balances[l.additiveId] = (balances[l.additiveId] || 0) + l.currentStock;
    });
    return balances;
  }, [additiveLots]);


  // --- CHART DATABASES ---

  const monthlyConsumptionChartData = useMemo(() => {
    // Generate last 6 months list
    const data: Record<string, { month: string; value: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mLabel = d.toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
      const mKey = d.toISOString().substring(0, 7); // YYYY-MM
      data[mKey] = { month: mLabel, value: 0 };
    }

    // Add applications
    additiveApplications.forEach(a => {
      const key = a.date.substring(0, 7);
      if (data[key]) {
        data[key].value += a.qtyApplied;
      }
    });

    // Add manual outputs
    additiveOutputs.forEach(o => {
      const key = o.date.substring(0, 7);
      if (data[key]) {
        data[key].value += o.qty;
      }
    });

    return Object.values(data);
  }, [additiveApplications, additiveOutputs]);

  const annualAdditiveChartData = useMemo(() => {
    // Top additives consumed in the current year
    const currentYear = new Date().getFullYear().toString();
    const map: Record<string, number> = {};

    additiveApplications
      .filter(a => a.date.startsWith(currentYear))
      .forEach(a => {
        map[a.additiveName] = (map[a.additiveName] || 0) + a.qtyApplied;
      });

    additiveOutputs
      .filter(o => o.date.startsWith(currentYear))
      .forEach(o => {
        map[o.additiveName] = (map[o.additiveName] || 0) + o.qty;
      });

    return Object.entries(map).map(([name, value]) => ({
      name,
      consumo: Math.round(value)
    })).sort((a, b) => b.consumo - a.consumo).slice(0, 6);
  }, [additiveApplications, additiveOutputs]);


  // --- RECENT ACTIVITIES FEED ---

  const recentActivities = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'ENTRADA' | 'SAIDA' | 'APLICACAO';
      title: string;
      subtitle: string;
      qty: number;
      unit: string;
      date: string;
      time: string;
      operator: string;
    }> = [];

    // Map entries
    additiveEntries.slice(0, 10).forEach(e => {
      list.push({
        id: e.id,
        type: 'ENTRADA',
        title: `Entrada de ${e.additiveName}`,
        subtitle: `Lote: ${e.lotInternalCode} • Fornec: ${e.supplier}`,
        qty: e.qtyReceived,
        unit: e.unit,
        date: e.date,
        time: e.time,
        operator: e.receiver
      });
    });

    // Map outputs
    additiveOutputs.slice(0, 10).forEach(o => {
      list.push({
        id: o.id,
        type: 'SAIDA',
        title: `Saída de ${o.additiveName}`,
        subtitle: `Lote: ${o.lotInternalCode} • Motivo: ${o.reason}`,
        qty: o.qty,
        unit: o.unit,
        date: o.date,
        time: o.time,
        operator: o.responsible
      });
    });

    // Map applications
    additiveApplications.slice(0, 10).forEach(a => {
      list.push({
        id: a.id,
        type: 'APLICACAO',
        title: `Aplicação de ${a.additiveName}`,
        subtitle: `Lote Aditivo: ${a.lotInternalCode} • Lote Farinha: ${a.flourBatchName}`,
        qty: a.qtyApplied,
        unit: a.unit,
        date: a.date,
        time: a.time,
        operator: a.operator
      });
    });

    // Sort descending by date & time
    return list.sort((a, b) => {
      const dtA = `${a.date}T${a.time}`;
      const dtB = `${b.date}T${b.time}`;
      return dtB.localeCompare(dtA);
    }).slice(0, 5);
  }, [additiveEntries, additiveOutputs, additiveApplications]);


  // --- TRACEABILITY (LOT DETAILS MODAL) ---

  const lotDetailsTrace = useMemo(() => {
    if (!showLotDetailsModal) return null;
    const lotCode = showLotDetailsModal.lotInternalCode;

    const entries = additiveEntries.filter(e => e.lotInternalCode === lotCode);
    const outputs = additiveOutputs.filter(o => o.lotInternalCode === lotCode);
    const applications = additiveApplications.filter(a => a.lotInternalCode === lotCode);

    return {
      entries,
      outputs,
      applications
    };
  }, [showLotDetailsModal, additiveEntries, additiveOutputs, additiveApplications]);


  // --- HISTORY TAB FILTERS APPLICATION ---

  const filteredHistoryList = useMemo(() => {
    const list: Array<{
      id: string;
      transactionType: 'ENTRADA' | 'SAIDA' | 'APLICACAO';
      date: string;
      time: string;
      additiveName: string;
      lotInternalCode: string;
      qty: number;
      unit: string;
      supplierOrBatch: string;
      responsible: string;
      notesOrReason: string;
    }> = [];

    // Push all
    if (histType === 'all' || histType === 'entry') {
      additiveEntries.forEach(e => {
        list.push({
          id: e.id,
          transactionType: 'ENTRADA',
          date: e.date,
          time: e.time,
          additiveName: e.additiveName,
          lotInternalCode: e.lotInternalCode,
          qty: e.qtyReceived,
          unit: e.unit,
          supplierOrBatch: e.supplier,
          responsible: e.receiver,
          notesOrReason: e.observations || 'N/A'
        });
      });
    }

    if (histType === 'all' || histType === 'output') {
      additiveOutputs.forEach(o => {
        list.push({
          id: o.id,
          transactionType: 'SAIDA',
          date: o.date,
          time: o.time,
          additiveName: o.additiveName,
          lotInternalCode: o.lotInternalCode,
          qty: o.qty,
          unit: o.unit,
          supplierOrBatch: '---',
          responsible: o.responsible,
          notesOrReason: o.reason
        });
      });
    }

    if (histType === 'all' || histType === 'application') {
      additiveApplications.forEach(a => {
        list.push({
          id: a.id,
          transactionType: 'APLICACAO',
          date: a.date,
          time: a.time,
          additiveName: a.additiveName,
          lotInternalCode: a.lotInternalCode,
          qty: a.qtyApplied,
          unit: a.unit,
          supplierOrBatch: `Lote Farinha: ${a.flourBatchName}`,
          responsible: a.operator,
          notesOrReason: 'Aplicação Direta'
        });
      });
    }

    // Filter list
    return list.filter(item => {
      if (histStartDate && item.date < histStartDate) return false;
      if (histEndDate && item.date > histEndDate) return false;
      if (histAdditiveId && item.additiveName !== additives.find(a => a.id === histAdditiveId)?.name) return false;
      if (histLotCode && !item.lotInternalCode.toLowerCase().includes(histLotCode.toLowerCase())) return false;
      if (histOperator && !item.responsible.toLowerCase().includes(histOperator.toLowerCase())) return false;
      
      if (histSupplier) {
        if (item.transactionType === 'ENTRADA') {
          if (!item.supplierOrBatch.toLowerCase().includes(histSupplier.toLowerCase())) return false;
        } else {
          return false; // manual outputs or applications do not match supplier filter
        }
      }

      return true;
    }).sort((a, b) => {
      const dtA = `${a.date}T${a.time}`;
      const dtB = `${b.date}T${b.time}`;
      return dtB.localeCompare(dtA);
    });
  }, [additiveEntries, additiveOutputs, additiveApplications, histType, histStartDate, histEndDate, histAdditiveId, histLotCode, histOperator, histSupplier, additives]);


  // --- EXPORT TO EXCEL (CSV) ---

  const handleExportCSV = () => {
    if (filteredHistoryList.length === 0) {
      showToast("Não há dados filtrados para exportar.", "info");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "TIPO;DATA;HORA;ADITIVO;LOTE INTERNO;QUANTIDADE;UN;FORNECEDOR/LOTE DE PRODUCAO;RESPONSAVEL;OBS/MOTIVO\n";

    filteredHistoryList.forEach(r => {
      const row = [
        r.transactionType,
        r.date,
        r.time,
        r.additiveName,
        r.lotInternalCode,
        r.qty,
        r.unit,
        r.supplierOrBatch.replace(/;/g, ','),
        r.responsible,
        r.notesOrReason.replace(/;/g, ',')
      ].join(";");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mocca_aditivos_historico_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Histórico exportado com sucesso (CSV)!", "success");
  };


  // --- HELPER NUMBER FORMAT ---

  const formatNumberInput = (val: string) => {
    const numeric = val.replace(/\D/g, '');
    if (!numeric) return '';
    return (Number(numeric) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };


  return (
    <div className="w-full px-2 sm:px-4 pb-12 animate-fadeIn font-inter text-slate-800">
      
      {/* Toast Alert */}
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={() => setToast(prev => ({ ...prev, visible: false }))} />

      {/* Header View */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pt-4">
        <div className="flex items-center">
          <button 
            onClick={onBack} 
            className="p-3 mr-4 text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition-all"
            id="back_btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="text-blue-600 stroke-[2.5]" size={24} />
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Gestão de Aditivos</h2>
            </div>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">PRODUÇÃO & MOAGEM</p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setShowAddEntryModal(true)} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-black py-3 px-5 rounded-xl shadow-lg shadow-blue-100 flex items-center gap-2 uppercase text-[10px] tracking-wider active:scale-95 transition-all"
          >
            <ArrowDownLeft size={16} /> Registrar Entrada
          </button>
          <button 
            onClick={() => setShowAddApplicationModal(true)} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-5 rounded-xl shadow-lg shadow-emerald-100 flex items-center gap-2 uppercase text-[10px] tracking-wider active:scale-95 transition-all"
          >
            <Droplets size={16} /> Lançar Aplicação
          </button>
          <button 
            onClick={() => setShowAddOutputModal(true)} 
            className="bg-slate-800 hover:bg-slate-900 text-white font-black py-3 px-5 rounded-xl shadow-lg shadow-slate-100 flex items-center gap-2 uppercase text-[10px] tracking-wider active:scale-95 transition-all"
          >
            <ArrowUpRight size={16} /> Saída Diversa
          </button>
        </div>
      </div>

      {/* Tabs Menu Navigation */}
      <div className="flex flex-wrap gap-1 bg-white p-1 rounded-2xl border border-slate-200 mb-8 overflow-x-auto scrollbar-hide">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid size={16} /> },
          { id: 'stock', label: 'Estoque de Lotes', icon: <Package size={16} /> },
          { id: 'history', label: 'Histórico', icon: <History size={16} /> },
          { id: 'register', label: 'Cadastro Aditivos', icon: <FlaskConical size={16} /> }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as TabType)}
            className={`flex items-center gap-2 py-3 px-5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === t.id 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>


      {/* ==================================== */}
      {/* 1. DASHBOARD TAB                     */}
      {/* ==================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          
          {/* Key Metrics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Stock Total */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total em Estoque</span>
                <span className="text-3xl font-black text-slate-800 tracking-tight block">
                  {totalStockQty.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-[10px] font-semibold text-slate-500">Saldo global acumulado</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Package size={18} />
                </div>
              </div>
            </div>

            {/* Consumption Month */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Consumo no Mês</span>
                <span className="text-3xl font-black text-slate-800 tracking-tight block">
                  {monthOutputsSum.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-[10px] font-semibold text-slate-500">Média diária: {Math.round(dailyAverageConsumption).toLocaleString('pt-BR')} / dia</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <TrendingDown size={18} />
                </div>
              </div>
            </div>

            {/* Expiration warning */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Validade Crítica (30d)</span>
                <span className="text-3xl font-black text-amber-600 tracking-tight block">
                  {upcomingLotsCount} Lotes
                </span>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-[10px] font-semibold text-red-600 font-bold uppercase">{expiredLotsCount} Lotes Vencidos</span>
                <div className={`p-2 rounded-xl ${expiredLotsCount > 0 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                  <AlertTriangle size={18} />
                </div>
              </div>
            </div>

            {/* Low stock alerts count */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Alertas Estoque Mínimo</span>
                <span className={`text-3xl font-black tracking-tight block ${lowStockAlertsCount > 0 ? 'text-red-500' : 'text-slate-800'}`}>
                  {lowStockAlertsCount} Alertas
                </span>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-[10px] font-semibold text-slate-500">Abaixo da margem de segurança</span>
                <div className={`p-2 rounded-xl ${lowStockAlertsCount > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'}`}>
                  <AlertTriangle size={18} />
                </div>
              </div>
            </div>

          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Chart - Monthly Consumption */}
            <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Consumo Mensal de Aditivos</h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Lançamentos de Saída & Aplicação nos últimos 6 meses</p>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyConsumptionChartData}>
                    <defs>
                      <linearGradient id="colorConsumo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '10px', fontWeight: 'bold' }} />
                    <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorConsumo)" name="Consumo" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right Chart - Top consumed */}
            <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Maiores Consumos (Ano)</h3>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Ranking dos aditivos mais utilizados em moagem</p>
              </div>
              <div className="h-72 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={annualAdditiveChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} width={90} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '10px' }} />
                    <Bar dataKey="consumo" fill="#3b82f6" radius={[0, 8, 8, 0]} name="Consumido">
                      {annualAdditiveChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#1d4ed8' : index === 1 ? '#2563eb' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Recent Feeds and Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Feed of recent activities */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Atividades Recentes</h3>
              <div className="space-y-4">
                {recentActivities.length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center py-8">Nenhuma movimentação cadastrada.</p>
                ) : (
                  recentActivities.map(act => (
                    <div key={act.id} className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-blue-100 hover:bg-blue-50/10 transition-all">
                      <div className={`p-3 rounded-xl flex-shrink-0 ${
                        act.type === 'ENTRADA' ? 'bg-blue-100 text-blue-600' :
                        act.type === 'SAIDA' ? 'bg-slate-200 text-slate-700' :
                        'bg-emerald-100 text-emerald-600'
                      }`}>
                        {act.type === 'ENTRADA' ? <ArrowDownLeft size={16} /> :
                         act.type === 'SAIDA' ? <ArrowUpRight size={16} /> :
                         <Droplets size={16} />}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{act.title}</h4>
                          <span className="text-[9px] font-black text-slate-400 whitespace-nowrap">
                            {act.date.split('-').reverse().join('/')} {act.time}
                          </span>
                        </div>
                        <p className="text-[10px] font-medium text-slate-500 mt-0.5">{act.subtitle}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Resp: <span className="text-slate-700">{act.operator}</span></span>
                          <span className="text-xs font-black text-blue-600 ml-auto">
                            {act.type === 'ENTRADA' ? '+' : '-'}{act.qty.toLocaleString('pt-BR')} {act.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Critical Lots Alerts */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Validades & Estoques Críticos</h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  
                  {/* Expired Lots */}
                  {additiveLots.filter(l => l.currentStock > 0 && l.expiryDate < todayStr).map(l => (
                    <div key={l.id} className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                      <AlertTriangle className="text-red-500 shrink-0" size={16} />
                      <div className="flex-grow overflow-hidden">
                        <span className="text-[10px] font-black text-red-900 block uppercase truncate">{l.additiveName} - {l.lotInternalCode}</span>
                        <span className="text-[8px] font-bold text-red-600 uppercase">VENCIDO EM: {l.expiryDate.split('-').reverse().join('/')}</span>
                      </div>
                      <span className="text-[10px] font-black text-red-700 shrink-0">{l.currentStock.toLocaleString('pt-BR')} {l.unit}</span>
                    </div>
                  ))}

                  {/* Soon Expiring */}
                  {additiveLots.filter(l => {
                    const lim = new Date();
                    lim.setDate(lim.getDate() + 30);
                    const limStr = lim.toISOString().split('T')[0];
                    return l.currentStock > 0 && l.expiryDate >= todayStr && l.expiryDate <= limStr;
                  }).map(l => (
                    <div key={l.id} className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                      <AlertTriangle className="text-amber-500 shrink-0" size={16} />
                      <div className="flex-grow overflow-hidden">
                        <span className="text-[10px] font-black text-amber-900 block uppercase truncate">{l.additiveName} - {l.lotInternalCode}</span>
                        <span className="text-[8px] font-bold text-amber-600 uppercase">VENCE EM: {l.expiryDate.split('-').reverse().join('/')}</span>
                      </div>
                      <span className="text-[10px] font-black text-amber-700 shrink-0">{l.currentStock.toLocaleString('pt-BR')} {l.unit}</span>
                    </div>
                  ))}

                  {/* Low stock indicators */}
                  {additives.filter(a => a.status === 'Ativo' && (additiveAggregatedStock[a.id] || 0) <= a.minStock).map(a => (
                    <div key={a.id} className="flex items-center gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                      <Package className="text-blue-500 shrink-0" size={16} />
                      <div className="flex-grow overflow-hidden">
                        <span className="text-[10px] font-black text-blue-900 block uppercase truncate">{a.name}</span>
                        <span className="text-[8px] font-bold text-blue-600 uppercase">MÍNIMO EXIGIDO: {a.minStock.toLocaleString('pt-BR')} {a.unit}</span>
                      </div>
                      <span className="text-[10px] font-black text-blue-700 shrink-0">Saldo: {(additiveAggregatedStock[a.id] || 0).toLocaleString('pt-BR')} {a.unit}</span>
                    </div>
                  ))}

                  {/* No critical situations */}
                  {additiveLots.filter(l => l.currentStock > 0 && l.expiryDate < todayStr).length === 0 && 
                   additiveLots.filter(l => {
                     const lim = new Date();
                     lim.setDate(lim.getDate() + 30);
                     const limStr = lim.toISOString().split('T')[0];
                     return l.currentStock > 0 && l.expiryDate >= todayStr && l.expiryDate <= limStr;
                   }).length === 0 && 
                   additives.filter(a => a.status === 'Ativo' && (additiveAggregatedStock[a.id] || 0) <= a.minStock).length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                      <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-600">Estoques e Validades Conformes</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Sem alertas críticos detectados</span>
                    </div>
                  )}

                </div>
              </div>
              <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-4 text-center border-t border-slate-100 pt-3">
                Rastreabilidade Completa Mocca
              </div>
            </div>

          </div>

        </div>
      )}


      {/* ==================================== */}
      {/* 2. ESTOQUE DE LOTES TAB              */}
      {/* ==================================== */}
      {activeTab === 'stock' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Estoque Físico de Lotes de Aditivo</h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Todos os lotes de aditivos com saldo ativo e validades de armazenamento</p>
            </div>
            
            <button 
              onClick={() => window.print()}
              className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-black py-2.5 px-4 rounded-xl text-[9px] uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-all"
            >
              <Printer size={14} /> Imprimir Inventário
            </button>
          </div>

          {/* Lots table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="py-4 px-4 text-[9px] font-black uppercase tracking-wider text-slate-400">Lote Interno</th>
                  <th className="py-4 px-4 text-[9px] font-black uppercase tracking-wider text-slate-400">Aditivo</th>
                  <th className="py-4 px-4 text-[9px] font-black uppercase tracking-wider text-slate-400">Fornecedor</th>
                  <th className="py-4 px-4 text-[9px] font-black uppercase tracking-wider text-slate-400 text-right">Qtd. Inicial</th>
                  <th className="py-4 px-4 text-[9px] font-black uppercase tracking-wider text-slate-400 text-right">Saldo Atual</th>
                  <th className="py-4 px-4 text-[9px] font-black uppercase tracking-wider text-slate-400 text-center">Data Fabricação</th>
                  <th className="py-4 px-4 text-[9px] font-black uppercase tracking-wider text-slate-400 text-center">Data Validade</th>
                  <th className="py-4 px-4 text-[9px] font-black uppercase tracking-wider text-slate-400 text-center">Status</th>
                  <th className="py-4 px-4 text-[9px] font-black uppercase tracking-wider text-slate-400 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {additiveLots.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
                      Nenhum lote de aditivo cadastrado no momento.
                    </td>
                  </tr>
                ) : (
                  additiveLots.map(lot => {
                    const isExpired = lot.expiryDate < todayStr;
                    const lim = new Date();
                    lim.setDate(lim.getDate() + 30);
                    const limStr = lim.toISOString().split('T')[0];
                    const isSoonExpiring = lot.expiryDate >= todayStr && lot.expiryDate <= limStr;

                    return (
                      <tr key={lot.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4 font-black text-xs text-blue-600 truncate max-w-[150px]">{lot.lotInternalCode}</td>
                        <td className="py-4 px-4">
                          <span className="text-xs font-black text-slate-800 block uppercase">{lot.additiveName}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">Lote Fabr: {lot.manufacturerLot}</span>
                        </td>
                        <td className="py-4 px-4 text-xs font-medium text-slate-500 uppercase">{lot.supplier}</td>
                        <td className="py-4 px-4 text-xs font-bold text-slate-500 text-right">{lot.initialQty.toLocaleString('pt-BR')} {lot.unit}</td>
                        <td className="py-4 px-4 text-xs font-black text-slate-800 text-right">{lot.currentStock.toLocaleString('pt-BR')} {lot.unit}</td>
                        <td className="py-4 px-4 text-xs font-semibold text-slate-500 text-center">
                          {lot.manufacturingDate ? lot.manufacturingDate.split('-').reverse().join('/') : '---'}
                        </td>
                        <td className="py-4 px-4 text-xs font-semibold text-slate-500 text-center">
                          {lot.expiryDate.split('-').reverse().join('/')}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {lot.currentStock === 0 ? (
                            <span className="inline-block py-1 px-2.5 bg-slate-100 text-slate-400 rounded-lg text-[8px] font-black uppercase">Esgotado</span>
                          ) : isExpired ? (
                            <span className="inline-block py-1 px-2.5 bg-red-100 text-red-700 rounded-lg text-[8px] font-black uppercase">Vencido</span>
                          ) : isSoonExpiring ? (
                            <span className="inline-block py-1 px-2.5 bg-amber-100 text-amber-700 rounded-lg text-[8px] font-black uppercase">Crítico</span>
                          ) : (
                            <span className="inline-block py-1 px-2.5 bg-emerald-100 text-emerald-700 rounded-lg text-[8px] font-black uppercase">Apto</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button 
                            onClick={() => setShowLotDetailsModal(lot)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-black py-1.5 px-3 rounded-lg text-[9px] uppercase tracking-wider active:scale-95 transition-all"
                          >
                            Rastrear
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* ==================================== */}
      {/* 3. HISTÓRICO TRANSAÇÕES TAB          */}
      {/* ==================================== */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          
          {/* Filters Form Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Filter size={16} /> Filtros de Rastreabilidade
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              
              {/* Type */}
              <div>
                <label className="block text-[8px] font-black text-slate-400 mb-1.5 uppercase">Tipo de Movimentação</label>
                <select 
                  value={histType} 
                  onChange={e => setHistType(e.target.value as any)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="all">Todas as Movimentações</option>
                  <option value="entry">Entradas (Recebimento)</option>
                  <option value="output">Saídas (Ajustes / Descarte)</option>
                  <option value="application">Aplicações (Farinha Lote)</option>
                </select>
              </div>

              {/* Start date */}
              <div>
                <label className="block text-[8px] font-black text-slate-400 mb-1.5 uppercase">Data Início</label>
                <input 
                  type="date" 
                  value={histStartDate} 
                  onChange={e => setHistStartDate(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" 
                />
              </div>

              {/* End date */}
              <div>
                <label className="block text-[8px] font-black text-slate-400 mb-1.5 uppercase">Data Fim</label>
                <input 
                  type="date" 
                  value={histEndDate} 
                  onChange={e => setHistEndDate(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" 
                />
              </div>

              {/* Aditivo Selection */}
              <div>
                <label className="block text-[8px] font-black text-slate-400 mb-1.5 uppercase">Aditivo específico</label>
                <select 
                  value={histAdditiveId} 
                  onChange={e => setHistAdditiveId(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="">Todos os Aditivos</option>
                  {additives.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              {/* Search lot */}
              <div>
                <label className="block text-[8px] font-black text-slate-400 mb-1.5 uppercase">Buscar Lote Interno</label>
                <input 
                  type="text" 
                  value={histLotCode} 
                  onChange={e => setHistLotCode(e.target.value)} 
                  placeholder="Código Lote..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 uppercase" 
                />
              </div>

              {/* Operator */}
              <div>
                <label className="block text-[8px] font-black text-slate-400 mb-1.5 uppercase">Operador / Recebedor</label>
                <input 
                  type="text" 
                  value={histOperator} 
                  onChange={e => setHistOperator(e.target.value)} 
                  placeholder="Nome do operador..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 uppercase" 
                />
              </div>

              {/* Supplier (Entries only) */}
              {histType !== 'output' && histType !== 'application' && (
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1.5 uppercase">Fornecedor (Origem)</label>
                  <input 
                    type="text" 
                    value={histSupplier} 
                    onChange={e => setHistSupplier(e.target.value)} 
                    placeholder="Nome fornecedor..." 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 uppercase" 
                  />
                </div>
              )}

              {/* Reset Filters button */}
              <div className="flex items-end">
                <button 
                  onClick={() => {
                    setHistStartDate('');
                    setHistEndDate('');
                    setHistAdditiveId('');
                    setHistLotCode('');
                    setHistOperator('');
                    setHistSupplier('');
                    setHistType('all');
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-3 px-5 rounded-xl text-[10px] uppercase tracking-wider transition-all"
                >
                  Limpar Filtros
                </button>
              </div>

            </div>
          </div>

          {/* Results list */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Resultado da Pesquisa</h3>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Registros de moagem e movimentações que satisfazem as condições selecionadas</p>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={handleExportCSV}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-2.5 px-4 rounded-xl text-[9px] uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95"
                >
                  <Download size={14} /> Exportar Excel
                </button>
                <button 
                  onClick={() => window.print()}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-black py-2.5 px-4 rounded-xl text-[9px] uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 shadow-md"
                >
                  <Printer size={14} /> Imprimir Relatório
                </button>
              </div>
            </div>

            {/* Results table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="py-4 px-4 text-[9px] font-black uppercase tracking-wider text-slate-400">Tipo</th>
                    <th className="py-4 px-4 text-[9px] font-black uppercase tracking-wider text-slate-400">Data / Hora</th>
                    <th className="py-4 px-4 text-[9px] font-black uppercase tracking-wider text-slate-400">Aditivo</th>
                    <th className="py-4 px-4 text-[9px] font-black uppercase tracking-wider text-slate-400">Lote Interno</th>
                    <th className="py-4 px-4 text-[9px] font-black uppercase tracking-wider text-slate-400 text-right">Qtd. Movimentada</th>
                    <th className="py-4 px-4 text-[9px] font-black uppercase tracking-wider text-slate-400">Vínculo / Origem / Destino</th>
                    <th className="py-4 px-4 text-[9px] font-black uppercase tracking-wider text-slate-400">Operador</th>
                    <th className="py-4 px-4 text-[9px] font-black uppercase tracking-wider text-slate-400">Nota/Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistoryList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
                        Nenhuma movimentação corresponde aos filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredHistoryList.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4">
                          <span className={`inline-block py-1 px-2.5 rounded-lg text-[8px] font-black uppercase ${
                            item.transactionType === 'ENTRADA' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            item.transactionType === 'SAIDA' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                            'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {item.transactionType}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs font-semibold text-slate-500 whitespace-nowrap">
                          {item.date.split('-').reverse().join('/')} {item.time}
                        </td>
                        <td className="py-4 px-4 text-xs font-black text-slate-800 uppercase">{item.additiveName}</td>
                        <td className="py-4 px-4 text-xs font-black text-blue-600">{item.lotInternalCode}</td>
                        <td className="py-4 px-4 text-right">
                          <span className={`text-xs font-black ${
                            item.transactionType === 'ENTRADA' ? 'text-blue-600' : 'text-slate-800'
                          }`}>
                            {item.transactionType === 'ENTRADA' ? '+' : '-'}{item.qty.toLocaleString('pt-BR')} {item.unit}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs font-medium text-slate-500 uppercase truncate max-w-[200px]" title={item.supplierOrBatch}>
                          {item.supplierOrBatch}
                        </td>
                        <td className="py-4 px-4 text-xs font-bold text-slate-600 uppercase">{item.responsible}</td>
                        <td className="py-4 px-4 text-xs font-medium text-slate-400 uppercase truncate max-w-[150px]" title={item.notesOrReason}>
                          {item.notesOrReason}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}


      {/* ==================================== */}
      {/* 4. CADASTRO DE ADITIVOS TAB          */}
      {activeTab === 'register' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Catálogo de Aditivos Registrados</h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Lista de substâncias e melhoradores ativos no controle operacional</p>
            </div>
            
            <button 
              onClick={() => handleOpenAddAdditive(null)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-4 rounded-xl text-[9px] uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-all shadow-md shadow-blue-100"
            >
              <Plus size={14} /> Novo Aditivo Comercial
            </button>
          </div>

          {/* Catalog list */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additives.length === 0 ? (
              <div className="col-span-full text-center py-12 text-xs text-slate-400 font-bold uppercase tracking-widest">
                Nenhum aditivo comercial cadastrado no catálogo.
              </div>
            ) : (
              additives.map(add => (
                <div key={add.id} className="border border-slate-200 rounded-3xl p-6 bg-slate-50/30 flex flex-col justify-between hover:border-blue-200 hover:shadow-xl hover:bg-white transition-all duration-300">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-4">
                      <span className={`inline-block py-1 px-2.5 rounded-lg text-[8px] font-black uppercase ${
                        add.status === 'Ativo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        {add.status}
                      </span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{add.category}</span>
                    </div>

                    <h4 className="text-sm font-black text-slate-800 uppercase leading-snug">{add.name}</h4>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">{add.technicalName}</p>

                    <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100">
                      <div>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Fabricante</span>
                        <span className="text-xs font-black text-slate-700 uppercase">{add.manufacturer}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Fornecedor</span>
                        <span className="text-xs font-black text-slate-700 uppercase truncate block">{add.supplier || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Unidade Padrão</span>
                        <span className="text-xs font-black text-slate-700 uppercase">{add.unit}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Estoque Mínimo</span>
                        <span className="text-xs font-black text-slate-700 uppercase">{add.minStock.toLocaleString('pt-BR')} {add.unit}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Dosagem Recomendada</span>
                      <span className="text-xs font-bold text-slate-600 block">{add.recommendedDosage || 'Sob Consulta'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => handleOpenAddAdditive(add)}
                      className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-black py-2 rounded-xl text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <Edit3 size={12} /> Editar
                    </button>
                    <button 
                      onClick={() => handleDeleteAdditiveClick(add.id, add.name)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 font-black py-2 px-3 rounded-xl transition-all active:scale-95"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}


      {/* ==================================================== */}
      {/* MODALS SECTION (DIALOGS AND FORMS)                   */}
      {/* ==================================================== */}

      {/* 1. Modal: CADASTRO/EDIÇÃO DE ADITIVO */}
      {showAddAdditiveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddAdditiveModal(false)} />
          <div className="bg-white rounded-none w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-scaleIn">
            <div className="bg-slate-800 p-8 text-white text-center">
              <h3 className="text-2xl font-black uppercase tracking-tighter">
                {editingAdditive ? "Editar Aditivo" : "Cadastrar Aditivo"}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-2">Especificação Técnica de Matéria-Prima</p>
            </div>
            
            <form onSubmit={handleSaveAdditiveSubmit} className="p-8 space-y-4 max-h-[500px] overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Nome Comercial *</label>
                  <input type="text" value={addName} onChange={e => setAddName(e.target.value)} placeholder="Ex: AMILASE SUPER" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 uppercase" required />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Nome Técnico *</label>
                  <input type="text" value={addTechnicalName} onChange={e => setAddTechnicalName(e.target.value)} placeholder="Ex: ALFA-AMILASE FUNGICA" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 uppercase" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Fabricante *</label>
                  <input type="text" value={addManufacturer} onChange={e => setAddManufacturer(e.target.value)} placeholder="Ex: NOVONESIS" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 uppercase" required />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Fornecedor Preferencial</label>
                  <input type="text" value={addSupplier} onChange={e => setAddSupplier(e.target.value)} placeholder="Ex: MCASSAB" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 uppercase" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Categoria</label>
                  <select value={addCategory} onChange={e => setAddCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500">
                    <option value="Melhorador">Melhorador</option>
                    <option value="Enzima">Enzima</option>
                    <option value="Vitamina">Vitamina</option>
                    <option value="Cloro / Sanitizante">Cloro / Sanit.</option>
                    <option value="Ácido Fólico">Ácido Fólico</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Unidade Medida</label>
                  <select value={addUnit} onChange={e => setAddUnit(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500">
                    <option value="Kg">Kg</option>
                    <option value="g">g</option>
                    <option value="Litros">Litros</option>
                    <option value="mL">mL</option>
                    <option value="Sacos">Sacos</option>
                  </select>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[8px] font-black text-slate-400 uppercase">Dosagem Rec.</label>
                    <button
                      type="button"
                      onClick={() => setAddRecommendedDosage('SOB DEMANDA')}
                      className="text-[8px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-wider transition-colors"
                    >
                      + Sob Demanda
                    </button>
                  </div>
                  <input type="text" value={addRecommendedDosage} onChange={e => setAddRecommendedDosage(e.target.value)} placeholder="Ex: 10g/t ou Sob Demanda" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Estoque Mínimo Alerta *</label>
                  <input type="number" value={addMinStock} onChange={e => setAddMinStock(e.target.value)} placeholder="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" required />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Status de Atividade</label>
                  <select value={addStatus} onChange={e => setAddStatus(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500">
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Descrição Técnica</label>
                <textarea value={addDescription} onChange={e => setAddDescription(e.target.value)} placeholder="Descreva os componentes, pureza, etc..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 h-16" />
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Observações Gerais</label>
                <textarea value={addObservations} onChange={e => setAddObservations(e.target.value)} placeholder="Instruções específicas de manuseio ou estocagem..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 h-16" />
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddAdditiveModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-4 px-8 rounded-xl text-[10px] uppercase tracking-wider transition-all active:scale-95">
                  Cancelar
                </button>
                <button type="submit" disabled={isSavingAdditive} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-8 rounded-xl text-[10px] uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                  {isSavingAdditive ? "Salvando..." : "Confirmar Registro"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: REGISTRAR ENTRADA (RECEBIMENTO) */}
      {showAddEntryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddEntryModal(false)} />
          <div className="bg-white rounded-none w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-scaleIn">
            <div className="bg-slate-800 p-8 text-white text-center">
              <h3 className="text-2xl font-black uppercase tracking-tighter">Registrar Entrada</h3>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-2">Entrada física no estoque com geração de Lote Interno</p>
            </div>
            
            <form onSubmit={handleSaveEntrySubmit} className="p-8 space-y-4 max-h-[500px] overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Data Entrada *</label>
                  <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" required />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Hora Entrada *</label>
                  <input type="text" value={entryTime} onChange={e => setEntryTime(e.target.value)} placeholder="00:00" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" required />
                </div>
              </div>

              <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-xl border border-blue-100 mb-2">
                <span className="text-[10px] font-black text-blue-900 uppercase tracking-wider">Novo Aditivo Comercial?</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isNewAdditive} 
                    onChange={e => {
                      setIsNewAdditive(e.target.checked);
                      if (e.target.checked) {
                        setEntryAdditiveId('');
                      }
                    }} 
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {isNewAdditive ? (
                <div className="bg-blue-50/20 p-4 border border-blue-100 rounded-2xl space-y-4">
                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest block mb-2">Dados Cadastrais do Novo Aditivo</span>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Nome Comercial *</label>
                      <input 
                        type="text" 
                        value={newAddName} 
                        onChange={e => setNewAddName(e.target.value)} 
                        placeholder="Ex: AMILASE SUPER" 
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 uppercase" 
                        required={isNewAdditive} 
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Nome Técnico *</label>
                      <input 
                        type="text" 
                        value={newAddTechnicalName} 
                        onChange={e => setNewAddTechnicalName(e.target.value)} 
                        placeholder="Ex: ALFA-AMILASE FUNGICA" 
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 uppercase" 
                        required={isNewAdditive} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Fabricante *</label>
                      <input 
                        type="text" 
                        value={newAddManufacturer} 
                        onChange={e => setNewAddManufacturer(e.target.value)} 
                        placeholder="Ex: NOVONESIS" 
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 uppercase" 
                        required={isNewAdditive} 
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[8px] font-black text-slate-400 uppercase">Dosagem Recomendada</label>
                        <button
                          type="button"
                          onClick={() => setNewAddRecommendedDosage('SOB DEMANDA')}
                          className="text-[8px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-wider transition-colors"
                        >
                          + Sob Demanda
                        </button>
                      </div>
                      <input 
                        type="text" 
                        value={newAddRecommendedDosage} 
                        onChange={e => setNewAddRecommendedDosage(e.target.value)} 
                        placeholder="Ex: 10g/t ou Sob Demanda" 
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Categoria</label>
                      <select 
                        value={newAddCategory} 
                        onChange={e => setNewAddCategory(e.target.value)} 
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                      >
                        <option value="Melhorador">Melhorador</option>
                        <option value="Enzima">Enzima</option>
                        <option value="Vitamina">Vitamina</option>
                        <option value="Cloro / Sanitizante">Cloro / Sanit.</option>
                        <option value="Ácido Fólico">Ácido Fólico</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Unidade</label>
                      <select 
                        value={newAddUnit} 
                        onChange={e => setNewAddUnit(e.target.value)} 
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                      >
                        <option value="Kg">Kg</option>
                        <option value="g">g</option>
                        <option value="Litros">Litros</option>
                        <option value="mL">mL</option>
                        <option value="Sacos">Sacos</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Estoq. Mínimo *</label>
                      <input 
                        type="number" 
                        value={newAddMinStock} 
                        onChange={e => setNewAddMinStock(e.target.value)} 
                        placeholder="0" 
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" 
                        required={isNewAdditive} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Descrição Técnica</label>
                      <input 
                        type="text" 
                        value={newAddDescription} 
                        onChange={e => setNewAddDescription(e.target.value)} 
                        placeholder="Pureza, compostos, etc..." 
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Observações Gerais</label>
                      <input 
                        type="text" 
                        value={newAddObservations} 
                        onChange={e => setNewAddObservations(e.target.value)} 
                        placeholder="Instruções de manuseio..." 
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" 
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Aditivo Comercial *</label>
                  <select 
                    value={entryAdditiveId} 
                    onChange={e => setEntryAdditiveId(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" 
                    required={!isNewAdditive}
                  >
                    <option value="">Selecione o aditivo...</option>
                    {additives.filter(a => a.status === 'Ativo').map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.technicalName})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Fornecedor *</label>
                  <select value={entrySupplierId} onChange={e => setEntrySupplierId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" required>
                    <option value="">Selecione o fornecedor...</option>
                    {supplierEntities.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                    <option value="OUTRO">OUTRO (ESPECIFICAR NAS OBSERVAÇÕES)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Número Nota Fiscal</label>
                  <input type="text" value={entryInvoice} onChange={e => setEntryInvoice(e.target.value)} placeholder="Ex: NF-2856" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 uppercase" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Quantidade Recebida *</label>
                  <input type="tel" inputMode="decimal" value={entryQty} onChange={e => setEntryQty(formatNumberInput(e.target.value))} placeholder="0,00" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-black text-slate-700 outline-none focus:border-blue-500" required />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Unidade Medida</label>
                  <input type="text" value={selectedEntryUnit} className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs font-black text-slate-400 outline-none" disabled />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Lote Fabricante *</label>
                  <input type="text" value={entryMfgLot} onChange={e => setEntryMfgLot(e.target.value)} placeholder="Ex: LOT-58A" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 uppercase" required />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Fabricação</label>
                  <input type="date" value={entryMfgDate} onChange={e => setEntryMfgDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Validade *</label>
                  <input type="date" value={entryExpDate} onChange={e => setEntryExpDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Local Armazenamento</label>
                  <input type="text" value={entryStorage} onChange={e => setEntryStorage(e.target.value)} placeholder="Ex: Galpão A" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 uppercase" />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Resp. Recebimento *</label>
                  <input type="text" value={entryReceiver} onChange={e => setEntryReceiver(e.target.value)} placeholder="Nome do responsável..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 uppercase" required />
                </div>
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Observações de Recebimento</label>
                <textarea value={entryNotes} onChange={e => setEntryNotes(e.target.value)} placeholder="Anote avarias na embalagem, desvios de temperatura, etc..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 h-16" />
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddEntryModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-4 px-8 rounded-xl text-[10px] uppercase tracking-wider transition-all active:scale-95">
                  Cancelar
                </button>
                <button type="submit" disabled={isSavingEntry} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-8 rounded-xl text-[10px] uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                  {isSavingEntry ? "Processando..." : "Salvar Entrada"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: LANÇAR APLICAÇÃO NA PRODUÇÃO */}
      {showAddApplicationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddApplicationModal(false)} />
          <div className="bg-white rounded-none w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-scaleIn">
            <div className="bg-slate-800 p-8 text-white text-center">
              <h3 className="text-2xl font-black uppercase tracking-tighter">Lançar Aplicação</h3>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-2">Vinculação direta a lotes de farinha em vigência</p>
            </div>
            
            <form onSubmit={handleSaveApplicationSubmit} className="p-8 space-y-4 max-h-[500px] overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Data Aplicação *</label>
                  <input type="date" value={appDate} onChange={e => setAppDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" required />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Hora Aplicação *</label>
                  <input type="text" value={appTime} onChange={e => setAppTime(e.target.value)} placeholder="00:00" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Lote Farinha em Produção *</label>
                  <select value={appFlourBatchId} onChange={e => setAppFlourBatchId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" required>
                    <option value="">Selecione o Lote...</option>
                    {activeFlourBatches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Operador Responsável *</label>
                  <input type="text" value={appOperator} onChange={e => setAppOperator(e.target.value)} placeholder="Nome do operador..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 uppercase" required />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Aditivo *</label>
                <select value={appAdditiveId} onChange={e => {
                  setAppAdditiveId(e.target.value);
                  setAppLotInternalCode('');
                }} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" required>
                  <option value="">Selecione o aditivo...</option>
                  {additives.filter(a => a.status === 'Ativo').map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              {appAdditiveId && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Lote Interno Disponível *</label>
                    <select value={appLotInternalCode} onChange={e => setAppLotInternalCode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" required>
                      <option value="">Selecione o lote com saldo...</option>
                      {selectedAppLots.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.lotInternalCode} (Saldo: {l.currentStock.toLocaleString('pt-BR')} {l.unit})
                        </option>
                      ))}
                    </select>
                    {selectedAppLots.length === 0 && (
                      <span className="text-[9px] text-red-500 font-bold block mt-1 uppercase">Sem lotes ativos com estoque!</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Quantidade Aplicada *</label>
                    <div className="relative">
                      <input type="tel" inputMode="decimal" value={appQty} onChange={e => setAppQty(formatNumberInput(e.target.value))} placeholder="0,00" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-black text-slate-700 outline-none focus:border-blue-500 pr-10" required />
                      <span className="absolute right-3 top-3.5 text-xs font-bold text-slate-400">{selectedAppUnit}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddApplicationModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-4 px-8 rounded-xl text-[10px] uppercase tracking-wider transition-all active:scale-95">
                  Cancelar
                </button>
                <button type="submit" disabled={isSavingApplication || !appLotInternalCode} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-8 rounded-xl text-[10px] uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-emerald-100 flex items-center justify-center gap-2">
                  {isSavingApplication ? "Salvando..." : "Confirmar Aplicação"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: SAÍDA DIVERSA (AJUSTE) */}
      {showAddOutputModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddOutputModal(false)} />
          <div className="bg-white rounded-none w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-scaleIn">
            <div className="bg-slate-800 p-8 text-white text-center">
              <h3 className="text-2xl font-black uppercase tracking-tighter">Saída de Estoque</h3>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-2">Registro de descarte, perdas de lote, vencidos ou devolução</p>
            </div>
            
            <form onSubmit={handleSaveOutputSubmit} className="p-8 space-y-4 max-h-[500px] overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Data Saída *</label>
                  <input type="date" value={outDate} onChange={e => setOutDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" required />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Hora Saída *</label>
                  <input type="text" value={outTime} onChange={e => setOutTime(e.target.value)} placeholder="00:00" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" required />
                </div>
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Aditivo *</label>
                <select value={outAdditiveId} onChange={e => {
                  setOutAdditiveId(e.target.value);
                  setOutLotInternalCode('');
                }} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" required>
                  <option value="">Selecione o aditivo...</option>
                  {additives.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              {outAdditiveId && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Lote Interno Ativo *</label>
                    <select value={outLotInternalCode} onChange={e => setOutLotInternalCode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" required>
                      <option value="">Selecione o lote...</option>
                      {selectedOutputLots.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.lotInternalCode} (Saldo: {l.currentStock.toLocaleString('pt-BR')} {l.unit})
                        </option>
                      ))}
                    </select>
                    {selectedOutputLots.length === 0 && (
                      <span className="text-[9px] text-red-500 font-bold block mt-1 uppercase">Sem lotes ativos com estoque!</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Quantidade Baixa *</label>
                    <div className="relative">
                      <input type="tel" inputMode="decimal" value={outQty} onChange={e => setOutQty(formatNumberInput(e.target.value))} placeholder="0,00" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-black text-slate-700 outline-none focus:border-blue-500 pr-10" required />
                      <span className="absolute right-3 top-3.5 text-xs font-bold text-slate-400">{selectedOutputUnit}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Responsável Saída *</label>
                  <input type="text" value={outResponsible} onChange={e => setOutResponsible(e.target.value)} placeholder="Nome do operador..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 uppercase" required />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">Motivo Baixa *</label>
                  <select value={outReason} onChange={e => setOutReason(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500">
                    <option value="Descarte por Validade">Descarte por Validade</option>
                    <option value="Embalagem Rompida">Embalagem Rompida / Avaria</option>
                    <option value="Ajuste de Inventário">Ajuste de Inventário</option>
                    <option value="Devolvido ao Fornecedor">Devolvido ao Fornecedor</option>
                    <option value="Outros">Outros motivos</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddOutputModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-4 px-8 rounded-xl text-[10px] uppercase tracking-wider transition-all active:scale-95">
                  Cancelar
                </button>
                <button type="submit" disabled={isSavingOutput || !outLotInternalCode} className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-black py-4 px-8 rounded-xl text-[10px] uppercase tracking-wider transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2">
                  {isSavingOutput ? "Confirmando..." : "Registrar Baixa"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 5. Modal: RASTREABILIDADE INTEGRAL DO LOTE INTERNO */}
      {showLotDetailsModal && lotDetailsTrace && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm print:hidden" onClick={() => setShowLotDetailsModal(null)} />
          <div className="bg-white rounded-none w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden animate-scaleIn printable-card">
            <div className="bg-slate-900 p-8 text-white relative">
              <button onClick={() => setShowLotDetailsModal(null)} className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white print:hidden">
                <X size={20} />
              </button>
              <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest block mb-1">Rastreabilidade Integral de Lote</span>
              <h3 className="text-2xl font-black uppercase tracking-tight">{showLotDetailsModal.lotInternalCode}</h3>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Substância: {showLotDetailsModal.additiveName}</p>
            </div>

            <div className="p-8 space-y-6 max-h-[500px] overflow-y-auto print-scroll-reset">
              
              {/* Header metadata summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Fornecedor Origem</span>
                  <span className="text-xs font-black text-slate-800 uppercase truncate block">{showLotDetailsModal.supplier}</span>
                </div>
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Lote Fabricante</span>
                  <span className="text-xs font-black text-slate-800 uppercase block">{showLotDetailsModal.manufacturerLot}</span>
                </div>
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Fabricação / Validade</span>
                  <span className="text-xs font-bold text-slate-600 block">
                    {showLotDetailsModal.expiryDate.split('-').reverse().join('/')}
                  </span>
                </div>
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Saldo Físico</span>
                  <span className="text-xs font-black text-blue-600 block">
                    {showLotDetailsModal.currentStock.toLocaleString('pt-BR')} / {showLotDetailsModal.initialQty.toLocaleString('pt-BR')} {showLotDetailsModal.unit}
                  </span>
                </div>
              </div>

              {/* Transactions Timeline */}
              <div className="space-y-4">
                
                {/* 1. Receipts details */}
                <div>
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1.5 flex items-center gap-2">
                    <ArrowDownLeft size={14} className="text-blue-500" /> Registro de Recebimento (Origem)
                  </h4>
                  {lotDetailsTrace.entries.map(e => (
                    <div key={e.id} className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 text-xs text-slate-600">
                      <div className="flex justify-between font-black text-slate-700 uppercase mb-2">
                        <span>Recebido em {e.date.split('-').reverse().join('/')} às {e.time}</span>
                        <span className="text-blue-600">+{e.qtyReceived.toLocaleString('pt-BR')} {e.unit}</span>
                      </div>
                      <p><strong>Nota Fiscal:</strong> {e.invoiceNumber || 'Não informada'}</p>
                      <p><strong>Responsável pelo recebimento:</strong> {e.receiver}</p>
                      <p className="mt-1 text-slate-400 italic">" {e.observations || 'Sem observações adicionais' } "</p>
                    </div>
                  ))}
                </div>

                {/* 2. Applications details */}
                <div>
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1.5 flex items-center gap-2">
                    <Droplets size={14} className="text-emerald-500" /> Utilizações em Lotes de Farinha (Moagem)
                  </h4>
                  {lotDetailsTrace.applications.length === 0 ? (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-2">Este lote de aditivo ainda não foi utilizado em moagem.</p>
                  ) : (
                    <div className="space-y-2">
                      {lotDetailsTrace.applications.map(a => (
                        <div key={a.id} className="flex justify-between items-center p-3 bg-emerald-50/30 border border-emerald-100 rounded-xl text-xs text-slate-600">
                          <div>
                            <span className="font-black text-slate-800 uppercase block">Farinha Lote: {a.flourBatchName}</span>
                            <span className="text-[9px] text-slate-400 font-semibold uppercase">Aplicado em {a.date.split('-').reverse().join('/')} às {a.time} • Operador: {a.operator}</span>
                          </div>
                          <span className="font-black text-emerald-700 shrink-0">-{a.qtyApplied.toLocaleString('pt-BR')} {a.unit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Manual Outputs details */}
                <div>
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1.5 flex items-center gap-2">
                    <ArrowUpRight size={14} className="text-slate-500" /> Outras Saídas / Baixas Manuais
                  </h4>
                  {lotDetailsTrace.outputs.length === 0 ? (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-2">Nenhum descarte ou ajuste manual registrado para este lote.</p>
                  ) : (
                    <div className="space-y-2">
                      {lotDetailsTrace.outputs.map(o => (
                        <div key={o.id} className="flex justify-between items-center p-3 bg-slate-100/50 border border-slate-200 rounded-xl text-xs text-slate-600">
                          <div>
                            <span className="font-black text-slate-800 uppercase block">Baixa: {o.reason}</span>
                            <span className="text-[9px] text-slate-400 font-semibold uppercase">Data {o.date.split('-').reverse().join('/')} às {o.time} • Responsável: {o.responsible}</span>
                          </div>
                          <span className="font-black text-slate-700 shrink-0">-{o.qty.toLocaleString('pt-BR')} {o.unit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              <div className="flex pt-6 border-t border-slate-100 print:hidden">
                <button 
                  onClick={() => window.print()}
                  className="bg-slate-800 hover:bg-slate-900 text-white w-full font-black py-4 px-8 rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                >
                  <Printer size={16} /> Imprimir Rastreabilidade de Lote
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
