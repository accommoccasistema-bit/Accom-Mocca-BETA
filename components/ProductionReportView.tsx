
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Download, 
  Calculator, 
  Check,
  Info,
  FileText,
  X,
  ChevronLeft,
  Search,
  Calendar,
  Layers,
  TrendingUp,
  ShoppingBag,
  Truck,
  Plus,
  CheckCircle2,
  Wheat,
  Factory,
  Droplets,
  Palette
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { useData } from '../src/shared/contexts/DataContext';
import { motion, AnimatePresence } from 'motion/react';

// Types from the external system
interface ProductionReportData {
  lote: string;
  inicio: string;
  finalizacao: string;
  trigoRecebido: number;
  farinhaTotal: number;
  saidaSubproduto: number;
  entradasTrigo: number;
  saidasCargas: number;
  bagsComum: number;
  bagsEspecial: number;
  bagsInteira: number;
  bagsCola: number;
  umidade: string;
}

interface ProductionReportViewProps {
  onBack: () => void;
}

export const ProductionReportView: React.FC<ProductionReportViewProps> = ({ onBack }) => {
  const { batches, wheatEntries, subproductLoads, loads, analyses } = useData();
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [deselectedMovementIds, setDeselectedMovementIds] = useState<Set<string>>(new Set());

  // Reset selected/deselected states when batch changes
  useEffect(() => {
    setDeselectedMovementIds(new Set());
  }, [selectedBatchId]);

  const toggleMovement = (id: string) => {
    setDeselectedMovementIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  
  // Local state for manual overrides if needed
  const [data, setData] = useState<ProductionReportData>({
    lote: '',
    inicio: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    finalizacao: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    trigoRecebido: 0,
    farinhaTotal: 0,
    saidaSubproduto: 0,
    entradasTrigo: 0,
    saidasCargas: 0,
    bagsComum: 0,
    bagsEspecial: 0,
    bagsInteira: 0,
    bagsCola: 0,
    umidade: '---',
  });

  const [logoUrl, setLogoUrl] = useState<string | null>(localStorage.getItem('mocca_logo_url'));
  const [logoComumUrl, setLogoComumUrl] = useState<string | null>(localStorage.getItem('mocca_logo_comum_url') || 'https://i.ibb.co/r2PbxJbz/image.png');
  const [logoEspecialUrl, setLogoEspecialUrl] = useState<string | null>(localStorage.getItem('mocca_logo_especial_url') || 'https://i.ibb.co/3yYgYdjn/image.png');
  const [logoInteiraUrl, setLogoInteiraUrl] = useState<string | null>(localStorage.getItem('mocca_logo_inteira_url') || 'https://i.ibb.co/Xn0XLJM/image.png');
  const [logoColaUrl, setLogoColaUrl] = useState<string | null>(localStorage.getItem('mocca_logo_cola_url') || 'https://i.ibb.co/8LDzkhh8/image.png');
  const [logoFareloUrl, setLogoFareloUrl] = useState<string | null>(localStorage.getItem('mocca_logo_farelo_url') || 'https://i.ibb.co/chcGNGq8/image.png');
  
  const [reportScale, setReportScale] = useState(1);
  const reportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-populate data when batch changes
  useEffect(() => {
    if (!selectedBatchId) return;
    
    const batch = batches.find(b => b.id === selectedBatchId);
    if (!batch) return;

    // Filter relevant data
    const batchWheat = wheatEntries.filter(e => e.batchId === batch.id);
    const batchSubproducts = subproductLoads.filter(l => l.batchId === batch.id);
    const batchLoads = loads.filter(l => l.batchId === batch.id);
    
    // Find latest analyses for the batch period (approximate)
    const batchStart = batch.createdAt?.toDate ? batch.createdAt.toDate().getTime() : Date.now();
    const batchEnd = batch.closedAt?.toDate ? batch.closedAt.toDate().getTime() : Date.now();
    
    const batchAnalyses = analyses.filter(a => {
      const aDate = a.date?.toDate ? a.date.toDate().getTime() : 0;
      return aDate >= batchStart && (batch.status === 'OPEN' || aDate <= batchEnd);
    });

    const getLatestValue = (type: string) => {
      const filtered = batchAnalyses.filter(a => a.type === type).sort((a,b) => (b.date?.toDate ? b.date.toDate() : 0) - (a.date?.toDate ? a.date.toDate() : 0));
      return filtered[0];
    };

    const latestEspecial = getLatestValue('ESPECIAL');
    const latestComum = getLatestValue('COMUM');

    // Aggregate counts
    const bagsComumCount = batchLoads.filter(l => l.type === 'C').reduce((acc, l) => acc + (l.currentQty || 0), 0);
    const bagsEspecialCount = batchLoads.filter(l => l.type === 'E').reduce((acc, l) => acc + (l.currentQty || 0), 0);
    const bagsInteiraCount = batchLoads.filter(l => l.type === 'I').reduce((acc, l) => acc + (l.currentQty || 0), 0);
    const bagsColaCount = batchLoads.filter(l => l.type === 'CL').reduce((acc, l) => acc + (l.currentQty || 0), 0);

    setData({
      lote: batch.name,
      inicio: batch.createdAt?.toDate ? format(batch.createdAt.toDate(), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      finalizacao: batch.closedAt?.toDate ? format(batch.closedAt.toDate(), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      trigoRecebido: batch.currentWheat || 0,
      farinhaTotal: batch.currentFlour || 0,
      saidaSubproduto: batch.currentSubproduct || 0,
      entradasTrigo: batch.wheatEntryCount || batchWheat.length,
      saidasCargas: batch.flourLoadCount || batchLoads.length,
      bagsComum: bagsComumCount,
      bagsEspecial: bagsEspecialCount,
      bagsInteira: bagsInteiraCount,
      bagsCola: bagsColaCount,
      umidade: latestEspecial ? `${latestEspecial.moisture}%` : (latestComum ? `${latestComum.moisture}%` : '---'),
    });
  }, [selectedBatchId, batches, wheatEntries, subproductLoads, loads, analyses]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string | null) => void, key: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setter(base64String);
        localStorage.setItem(key, base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = (setter: (url: string | null) => void, key: string) => {
    setter(null);
    localStorage.removeItem(key);
  };

  // Scaling logic
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.clientWidth;
        const reportWidthPx = 800; // Original width of user's report
        const padding = 64; 
        const availableWidth = parentWidth - padding;
        
        if (availableWidth < reportWidthPx) {
          setReportScale(Math.max(0.1, availableWidth / reportWidthPx));
        } else {
          setReportScale(1);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Find currently selected batch's wheat entries
  const currentBatchWheat = useMemo(() => {
    if (!selectedBatchId) return [];
    return wheatEntries.filter(e => e.batchId === selectedBatchId);
  }, [wheatEntries, selectedBatchId]);

  // Find currently selected batch's flour loads
  const currentBatchLoads = useMemo(() => {
    if (!selectedBatchId) return [];
    return loads.filter(l => l.batchId === selectedBatchId);
  }, [loads, selectedBatchId]);

  // Find currently selected batch's subproduct (farelo) loads
  const currentBatchSubproductLoads = useMemo(() => {
    if (!selectedBatchId) return [];
    return subproductLoads.filter(l => l.batchId === selectedBatchId);
  }, [subproductLoads, selectedBatchId]);

  // Unified list of ALL movements in the batch (Entries from suppliers + Departures from clients)
  const allMovements = useMemo(() => {
    const list: Array<{
      id: string;
      rawId: string;
      category: 'ENTRADA' | 'SAÍDA';
      partner: string;
      product: string;
      bags: number;
      distance: number;
      weight: number;
      date: Date | null;
      originalType: string;
    }> = [];

    // 1. Wheat entries (Entradas de Fornecedores)
    currentBatchWheat.forEach((entry, idx) => {
      const id = `wheat-${entry.id || idx}`;
      const name = (entry.entity || 'FORNECEDOR GENERAL').trim().toUpperCase();
      const weight = entry.liquidWeight || entry.finalWeight || 0;
      const dist = entry.totalDistanceKm || 0;
      list.push({
        id,
        rawId: entry.id,
        category: 'ENTRADA',
        partner: name,
        product: (entry.product || 'TRIGO BRUTO').toUpperCase(),
        bags: 0,
        distance: dist,
        weight: weight,
        date: entry.createdAt?.toDate ? entry.createdAt.toDate() : null,
        originalType: 'WHEAT'
      });
    });

    // 2. Flour loads (Saídas de Farinha para Clientes)
    currentBatchLoads.forEach((load, idx) => {
      const id = `flour-${load.id || idx}`;
      const name = (load.client || 'CLIENTE GERAL').trim().toUpperCase();
      const estimatedWeight = (load.currentQty || 0) * (load.type === 'CL' ? 1050 : 1200);
      const weight = load.weight && load.weight > 0 ? load.weight : estimatedWeight;
      const dist = load.totalDistanceKm || 0;
      
      let pName = 'FARINHA';
      if (load.type === 'E') pName = 'FARINHA ESPECIAL';
      else if (load.type === 'C') pName = 'FARINHA COMUM';
      else if (load.type === 'I') pName = 'FARINHA INTEIRA';
      else if (load.type === 'CL') pName = 'FARINHA COLA';

      list.push({
        id,
        rawId: load.id,
        category: 'SAÍDA',
        partner: name,
        product: pName,
        bags: load.currentQty || 0,
        distance: dist,
        weight: weight,
        date: load.createdAt?.toDate ? load.createdAt.toDate() : null,
        originalType: load.type
      });
    });

    // 3. Subproduct loads (Saídas de Farelo)
    currentBatchSubproductLoads.forEach((sub, idx) => {
      const id = `sub-${sub.id || idx}`;
      const name = (sub.client || 'CLIENTE GERAL').trim().toUpperCase();
      const weight = sub.quantity || 0;
      const dist = sub.totalDistanceKm || 0;
      list.push({
        id,
        rawId: sub.id,
        category: 'SAÍDA',
        partner: name,
        product: (sub.type || 'FARELO').toUpperCase(),
        bags: 0,
        distance: dist,
        weight: weight,
        date: sub.createdAt?.toDate ? sub.createdAt.toDate() : null,
        originalType: 'SUBPRODUCT'
      });
    });

    // Sort: Entradas first, then Saídas
    return list.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category === 'ENTRADA' ? -1 : 1;
      }
      return a.partner.localeCompare(b.partner);
    });
  }, [currentBatchWheat, currentBatchLoads, currentBatchSubproductLoads]);

  // Selected movements after filtering out deselected checkboxes
  const activeMovements = useMemo(() => {
    return allMovements.filter(m => !deselectedMovementIds.has(m.id));
  }, [allMovements, deselectedMovementIds]);

  // Bags totals for Page 1 & Page 2
  const bagsEspecial = useMemo(() => activeMovements.filter(m => m.originalType === 'E').reduce((acc, m) => acc + m.bags, 0), [activeMovements]);
  const bagsComum = useMemo(() => activeMovements.filter(m => m.originalType === 'C').reduce((acc, m) => acc + m.bags, 0), [activeMovements]);
  const bagsInteira = useMemo(() => activeMovements.filter(m => m.originalType === 'I').reduce((acc, m) => acc + m.bags, 0), [activeMovements]);
  const bagsCola = useMemo(() => activeMovements.filter(m => m.originalType === 'CL').reduce((acc, m) => acc + m.bags, 0), [activeMovements]);

  // Dynamic weights totals with safe manual overrides/defaults fallback
  const wheatReceivedTotal = useMemo(() => {
    const activeWheat = activeMovements.filter(m => m.category === 'ENTRADA');
    if (activeWheat.length === 0) return data.trigoRecebido || 0;
    return activeWheat.reduce((acc, m) => acc + m.weight, 0);
  }, [activeMovements, data.trigoRecebido]);

  const subproductTotal = useMemo(() => {
    const activeSub = activeMovements.filter(m => m.category === 'SAÍDA' && m.originalType === 'SUBPRODUCT');
    if (activeSub.length === 0) return data.saidaSubproduto || 0;
    return activeSub.reduce((acc, m) => acc + m.weight, 0);
  }, [activeMovements, data.saidaSubproduto]);

  const dynamicFarinhaTotal = useMemo(() => {
    const activeFlour = activeMovements.filter(m => m.category === 'SAÍDA' && ['C', 'E', 'I', 'CL'].includes(m.originalType));
    if (activeFlour.length === 0) return data.farinhaTotal || 0;
    return activeFlour.reduce((acc, m) => acc + m.weight, 0);
  }, [activeMovements, data.farinhaTotal]);

  const dynamicSaidasCargas = useMemo(() => {
    const activeFlour = activeMovements.filter(m => m.category === 'SAÍDA' && ['C', 'E', 'I', 'CL'].includes(m.originalType));
    return Math.max(data.saidasCargas, activeFlour.length);
  }, [activeMovements, data.saidasCargas]);

  // Quality metrics based strictly on active loads
  const qualityCalculations = useMemo(() => {
    const activeFlourIds = new Set(activeMovements.filter(m => m.category === 'SAÍDA' && m.originalType !== 'SUBPRODUCT').map(m => m.rawId));
    const activeBatchLoads = currentBatchLoads.filter(l => activeFlourIds.has(l.id));

    const loadsWithHumidity = activeBatchLoads.filter(
      l => l.humidity !== undefined && l.humidity !== null && !isNaN(l.humidity) && l.humidity > 0 && l.type !== 'CL'
    );
    const avgHumidity = loadsWithHumidity.length > 0
      ? loadsWithHumidity.reduce((sum, l) => sum + (l.humidity || 0), 0) / loadsWithHumidity.length
      : null;

    const loadsWithColor = activeBatchLoads.filter(l => {
      if (!l.color) return false;
      if (l.type === 'CL') return false;
      const val = parseFloat(l.color.replace(',', '.'));
      return !isNaN(val) && val > 0;
    });
    const avgColor = loadsWithColor.length > 0
      ? loadsWithColor.reduce((sum, l) => sum + parseFloat((l.color || '').replace(',', '.')), 0) / loadsWithColor.length
      : null;

    const getAvgForType = (type: string) => {
      const typeLoads = activeBatchLoads.filter(l => l.type === type);
      const loadsWithHum = typeLoads.filter(
        l => l.humidity !== undefined && l.humidity !== null && !isNaN(l.humidity) && l.humidity > 0
      );
      const avgHum = loadsWithHum.length > 0
        ? loadsWithHum.reduce((sum, l) => sum + (l.humidity || 0), 0) / loadsWithHum.length
        : null;

      const loadsWithCol = typeLoads.filter(l => {
        if (!l.color) return false;
        const val = parseFloat(l.color.replace(',', '.'));
        return !isNaN(val) && val > 0;
      });
      const avgCol = loadsWithCol.length > 0
        ? loadsWithCol.reduce((sum, l) => sum + parseFloat((l.color || '').replace(',', '.')), 0) / loadsWithCol.length
        : null;

      return { avgHumidity: avgHum, avgColor: avgCol };
    };

    return {
      avgHumidity,
      avgColor,
      especial: getAvgForType('E'),
      comum: getAvgForType('C'),
      inteira: getAvgForType('I'),
      cola: getAvgForType('CL'),
    };
  }, [currentBatchLoads, activeMovements]);

  // Combined Page 2 Grouped list (Sourcing & Logistics operations grouped cleanly without emojis)
  const groupedActiveMovements = useMemo(() => {
    const groups: {
      [key: string]: {
        partner: string;
        category: 'ENTRADA' | 'SAÍDA';
        product: string;
        totalDistance: number;
        totalWeight: number;
        totalBags: number;
        bagsBreakdown: {
          especial: number;
          comum: number;
          inteira: number;
          cola: number;
        };
      }
    } = {};

    activeMovements.forEach((m) => {
      const key = `${m.partner}_${m.category}_${m.product}`;
      if (!groups[key]) {
        groups[key] = {
          partner: m.partner,
          category: m.category,
          product: m.product,
          totalDistance: 0,
          totalWeight: 0,
          totalBags: 0,
          bagsBreakdown: { especial: 0, comum: 0, inteira: 0, cola: 0 }
        };
      }

      groups[key].totalDistance += m.distance;
      groups[key].totalWeight += m.weight;
      groups[key].totalBags += m.bags;
      
      if (m.category === 'SAÍDA') {
        if (m.originalType === 'E') groups[key].bagsBreakdown.especial += m.bags;
        if (m.originalType === 'C') groups[key].bagsBreakdown.comum += m.bags;
        if (m.originalType === 'I') groups[key].bagsBreakdown.inteira += m.bags;
        if (m.originalType === 'CL') groups[key].bagsBreakdown.cola += m.bags;
      }
    });

    return Object.values(groups).sort((a, b) => {
      if (a.category !== b.category) {
        return a.category === 'ENTRADA' ? -1 : 1;
      }
      return a.partner.localeCompare(b.partner);
    });
  }, [activeMovements]);

  // Comprehensive mathematical derivations for performance metrics
  const calculations = useMemo(() => {
    const totalBags = bagsComum + bagsEspecial + bagsInteira + bagsCola;
    const rendimentoFarinha = wheatReceivedTotal > 0 ? (dynamicFarinhaTotal / wheatReceivedTotal) * 100 : 0;
    const rendimentoIndustrial = wheatReceivedTotal > 0 ? ((dynamicFarinhaTotal + subproductTotal) / wheatReceivedTotal) * 100 : 0;
    
    // Quebra = Trigo - Farinha - Subproduto
    const quebraKg = wheatReceivedTotal - dynamicFarinhaTotal - subproductTotal;
    const quebraPct = wheatReceivedTotal > 0 ? (quebraKg / wheatReceivedTotal) * 100 : 0;

    const pesoMedioBag = totalBags > 0 ? dynamicFarinhaTotal / totalBags : 0;
    
    const activeFlour = activeMovements.filter(m => m.category === 'SAÍDA' && ['C', 'E', 'I', 'CL'].includes(m.originalType));
    let kgComum = bagsComum * pesoMedioBag;
    let kgEspecial = bagsEspecial * pesoMedioBag;
    let kgInteira = bagsInteira * pesoMedioBag;
    let kgCola = bagsCola * pesoMedioBag;

    if (activeFlour.length > 0) {
      kgComum = activeMovements.filter(m => m.originalType === 'C').reduce((acc, m) => acc + m.weight, 0);
      kgEspecial = activeMovements.filter(m => m.originalType === 'E').reduce((acc, m) => acc + m.weight, 0);
      kgInteira = activeMovements.filter(m => m.originalType === 'I').reduce((acc, m) => acc + m.weight, 0);
      kgCola = activeMovements.filter(m => m.originalType === 'CL').reduce((acc, m) => acc + m.weight, 0);
    }
    
    const pctComumFarinha = dynamicFarinhaTotal > 0 ? (kgComum / dynamicFarinhaTotal) * 100 : 0;
    const pctEspecialFarinha = dynamicFarinhaTotal > 0 ? (kgEspecial / dynamicFarinhaTotal) * 100 : 0;
    const pctInteiraFarinha = dynamicFarinhaTotal > 0 ? (kgInteira / dynamicFarinhaTotal) * 100 : 0;
    const pctColaFarinha = dynamicFarinhaTotal > 0 ? (kgCola / dynamicFarinhaTotal) * 100 : 0;
    
    const pctComumTrigo = wheatReceivedTotal > 0 ? (kgComum / wheatReceivedTotal) * 100 : 0;
    const pctEspecialTrigo = wheatReceivedTotal > 0 ? (kgEspecial / wheatReceivedTotal) * 100 : 0;
    const pctInteiraTrigo = wheatReceivedTotal > 0 ? (kgInteira / wheatReceivedTotal) * 100 : 0;
    const pctColaTrigo = wheatReceivedTotal > 0 ? (kgCola / wheatReceivedTotal) * 100 : 0;

    const pctFareloTrigo = wheatReceivedTotal > 0 ? (subproductTotal / wheatReceivedTotal) * 100 : 0;
    const pctFareloTotal = (dynamicFarinhaTotal + subproductTotal) > 0 ? (subproductTotal / (dynamicFarinhaTotal + subproductTotal)) * 100 : 0;

    const activeEntradasCount = activeMovements.filter(m => m.category === 'ENTRADA').length;
    const entriesCount = activeEntradasCount > 0 ? activeEntradasCount : data.entradasTrigo;
    const mediaPorCarga = entriesCount > 0 ? wheatReceivedTotal / entriesCount : 0;
    
    const activeWheatEntries = activeMovements.filter(m => m.category === 'ENTRADA');
    const actualWheatKmSum = activeWheatEntries.reduce((sum, m) => sum + m.distance, 0);
    const kmRodadosTrigo = actualWheatKmSum > 0 ? actualWheatKmSum : entriesCount * 4;

    const activeSaidasCount = activeMovements.filter(m => m.category === 'SAÍDA' && m.originalType !== 'SUBPRODUCT').length;
    const sortiesCount = activeSaidasCount > 0 ? activeSaidasCount : dynamicSaidasCargas;
    const mediaPorSaida = sortiesCount > 0 ? dynamicFarinhaTotal / sortiesCount : 0;
    
    const activeFlourSorties = activeMovements.filter(m => m.category === 'SAÍDA' && ['C', 'E', 'I', 'CL'].includes(m.originalType));
    const actualFlourKmSum = activeFlourSorties.reduce((sum, m) => sum + m.distance, 0);
    const kmRodadosSaida = actualFlourKmSum > 0 ? actualFlourKmSum : sortiesCount * 60.2;

    const duracao = differenceInDays(parseISO(data.finalizacao), parseISO(data.inicio));

    return {
      totalBags,
      rendimentoFarinha,
      rendimentoIndustrial,
      quebraKg,
      quebraPct,
      pesoMedioBag,
      kgComum,
      kgEspecial,
      kgInteira,
      kgCola,
      pctComumFarinha,
      pctEspecialFarinha,
      pctInteiraFarinha,
      pctColaFarinha,
      pctComumTrigo,
      pctEspecialTrigo,
      pctInteiraTrigo,
      pctColaTrigo,
      pctFareloTrigo,
      pctFareloTotal,
      mediaPorCarga,
      kmRodadosTrigo,
      mediaPorSaida,
      kmRodadosSaida,
      duracao
    };
  }, [
    data,
    dynamicFarinhaTotal,
    dynamicSaidasCargas,
    activeMovements,
    bagsComum,
    bagsEspecial,
    bagsInteira,
    bagsCola,
    wheatReceivedTotal,
    subproductTotal
  ]);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    const scrollPos = window.scrollY;
    window.scrollTo(0, 0);
    
    const originalTransform = reportRef.current.style.transform;
    const originalTransformOrigin = reportRef.current.style.transformOrigin;
    const originalPosition = reportRef.current.style.position;
    
    reportRef.current.style.transform = 'none';
    reportRef.current.style.transformOrigin = 'initial';
    reportRef.current.style.position = 'relative';
    
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const pages = reportRef.current.querySelectorAll('.pdf-page');

      if (pages.length > 0) {
        for (let i = 0; i < pages.length; i++) {
          const page = pages[i] as HTMLElement;
          const canvas = await html2canvas(page, {
            scale: 4,
            useCORS: true,
            backgroundColor: '#FFFFFF',
            logging: false,
          });
          const imgData = canvas.toDataURL('image/png', 1.0);
          
          if (i > 0) {
            pdf.addPage();
          }
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }
      } else {
        const canvas = await html2canvas(reportRef.current, {
          scale: 4,
          useCORS: true,
          backgroundColor: '#FFFFFF',
          logging: false,
        });
        const imgData = canvas.toDataURL('image/png', 1.0);
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }
      
      pdf.save(`laudo-producao-${data.lote}.pdf`);
    } catch (error) {
      console.error("Erro PDF:", error);
    } finally {
      if (reportRef.current) {
        reportRef.current.style.transform = originalTransform;
        reportRef.current.style.transformOrigin = originalTransformOrigin;
        reportRef.current.style.position = originalPosition;
      }
      window.scrollTo(0, scrollPos);
    }
  };

  return (
    <div className="w-full animate-fadeIn font-inter flex flex-col gap-8 pb-20">
      <style dangerouslySetInnerHTML={{ __html: `
        .pdf-report-container {
          background-color: white !important;
          color: #0f172a !important;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif !important;
        }
        .pdf-report-container * {
          --tw-shadow-color: rgba(0,0,0,0.1) !important;
          --tw-ring-color: rgba(0,0,0,0.1) !important;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif !important;
          letter-spacing: normal !important;
        }
        .pdf-report-container .font-mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
        }
      `}} />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md active:scale-95 transition-all text-slate-500"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Emissão de Laudo</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Laudo Técnico de Produção Industrial</p>
          </div>
        </div>
        <button 
          onClick={handleExportPDF}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95"
        >
          <Download size={18} /> Exportar PDF
        </button>
      </div>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Search size={12} className="text-blue-600" /> Selección del Lote
              </h3>
              {selectedBatchId && (
                 <div className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black uppercase rounded-full">Activo</div>
              )}
            </div>
            
            <div className="relative">
              <select 
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-sm font-black text-slate-800 outline-none appearance-none focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer"
              >
                <option value="">Seleccione el Lote...</option>
                {batches.sort((a,b) => (b.createdAt?.toDate ? b.createdAt.toDate() : 0) - (a.createdAt?.toDate ? a.createdAt.toDate() : 0)).map(b => (
                  <option key={b.id} value={b.id}>{b.name} • {b.status === 'OPEN' ? 'EM VIGOR' : 'FINALIZADO'}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <Layers size={16} />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
             <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="col-span-2 lg:col-span-1">
                   <label className="text-[9px] font-black text-slate-300 uppercase block mb-1 ml-1">Logo Empresa</label>
                   <div className="flex items-center gap-2">
                      <label className={`cursor-pointer flex-grow h-10 rounded-xl border transition-all flex items-center justify-center ${logoUrl ? 'bg-white border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
                         <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, setLogoUrl, 'mocca_logo_url')} />
                         {logoUrl ? <img src={logoUrl} className="h-full object-contain p-1.5" /> : <span className="text-[8px] font-black text-slate-300">UPLOAD</span>}
                      </label>
                      {logoUrl && <button onClick={() => removeLogo(setLogoUrl, 'mocca_logo_url')} className="text-red-400 hover:text-red-600"><X size={14}/></button>}
                   </div>
                </div>
                <div>
                   <label className="text-[9px] font-black text-slate-300 uppercase block mb-1 ml-1">Lote ID</label>
                   <input type="text" value={data.lote} onChange={(e) => setData({...data, lote: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-black text-slate-800 outline-none focus:bg-white" />
                </div>
                <div>
                   <label className="text-[9px] font-black text-slate-300 uppercase block mb-1 ml-1">Trigo (KG)</label>
                   <input type="number" value={data.trigoRecebido} onChange={(e) => setData({...data, trigoRecebido: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-black text-slate-800 outline-none focus:bg-white" />
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="bg-slate-900 p-4 rounded-2xl text-white flex flex-col items-center">
              <span className="text-[7px] font-black uppercase text-slate-500 mb-1">Rend. Farinha</span>
              <span className="text-lg font-black text-blue-400">{calculations.rendimentoFarinha.toFixed(2)}%</span>
           </div>
           <div className="bg-slate-900 p-4 rounded-2xl text-white flex flex-col items-center">
              <span className="text-[7px] font-black uppercase text-slate-500 mb-1">Industrial</span>
              <span className="text-lg font-black text-emerald-400">{calculations.rendimentoIndustrial.toFixed(2)}%</span>
           </div>
           <div className="bg-slate-900 p-4 rounded-2xl text-white flex flex-col items-center">
              <span className="text-[7px] font-black uppercase text-slate-500 mb-1">Quebra Total</span>
              <span className="text-lg font-black text-red-400">{calculations.quebraPct.toFixed(2)}%</span>
           </div>
           <div className="bg-slate-900 p-4 rounded-2xl text-white flex flex-col items-center">
              <span className="text-[7px] font-black uppercase text-slate-500 mb-1">Total Bags</span>
              <span className="text-lg font-black text-amber-400">{calculations.totalBags}</span>
            </div>
         </div>

         <div className="contents">
            <div className="contents">
           </div>
        </div>

        <div className="flex flex-col items-center">
           <div className="w-full flex items-center justify-between mb-4 px-6 text-slate-400 font-bold uppercase text-[9px] tracking-[0.3em]">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                 <span>Laudo Técnico em Tempo Real</span>
              </div>
              <div className="flex items-center gap-4">
                 <span>Preview Oficial A4 (8.27" x 11.69")</span>
              </div>
           </div>
           
           <div 
             ref={containerRef}
             className="w-full bg-slate-800 rounded-[3rem] p-4 sm:p-16 shadow-2xl min-h-[800px] flex justify-center items-start overflow-hidden border border-slate-700 relative"
           >
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
              
              <div 
                className="relative z-10"
                style={{ 
                  transform: `scale(${reportScale})`,
                  transformOrigin: 'top center',
                  width: '800px',
                  height: '2300px',
                  imageRendering: '-webkit-optimize-contrast'
                }}
              >
                    <div 
                      ref={reportRef}
                      className="pdf-report-container space-y-8"
                      style={{ width: '800px', fontFamily: '"Inter", sans-serif' }}
                    >
                      {/* PAGE 1: RESUMO EXECUTIVO E INDUSTRIAL */}
                      <div className="bg-white shadow-[0_40px_100px_-12px_rgba(0,0,0,0.5)] relative flex flex-col p-12 border-[2mm] border-[#0f172a] pdf-page" style={{ width: '800px', height: '1132px' }}>
                        {/* Technical Frames */}
                        <div className="absolute top-4 left-4 right-4 h-1 border-t border-slate-200 opacity-50"></div>
                        <div className="absolute bottom-4 left-4 right-4 h-1 border-b border-slate-200 opacity-50"></div>
                        <div className="absolute left-4 top-4 bottom-4 w-1 border-l border-slate-200 opacity-50"></div>
                        <div className="absolute right-4 top-4 bottom-4 w-1 border-r border-slate-200 opacity-50"></div>

                        {/* Header Section */}
                        <div className="flex justify-between items-start mb-8 relative z-10">
                           <div className="flex flex-col">
                              <div className="max-w-[200px] mb-4">
                                {logoUrl ? (
                                  <img 
                                    src={logoUrl} 
                                    alt="Logo" 
                                    className="w-full h-auto object-contain" 
                                    style={{ imageRendering: 'auto' }}
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <img 
                                    src="logo.png" 
                                    alt="Logo" 
                                    className="w-full h-auto object-contain" 
                                    style={{ imageRendering: 'auto' }}
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                              </div>
                           </div>
                           
                           <div className="text-right">
                              <div className="flex flex-col items-end mb-4">
                                 <h1 className="text-[42px] font-black text-[#0f172a] leading-[0.8] tracking-tighter uppercase">
                                    Laudo de<br />Produção
                                 </h1>
                                 <div className="h-1.5 w-32 bg-blue-600 mt-3"></div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                 <div className="bg-[#0f172a] text-white px-5 py-2 rounded-none text-xl font-black inline-block shadow-md">
                                    LOTE: {data.lote || '---'}
                                 </div>
                                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">EMISSÃO: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                              </div>
                           </div>
                        </div>

                        {/* Summary Grid */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                           <div className="bg-slate-50/10 rounded-none p-4 relative overflow-hidden flex justify-center items-center border-2 border-slate-300 flex-col gap-1.5 text-center shadow-sm">
                              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500 z-20"></div>
                              <div className="absolute -left-4 -bottom-4 opacity-5 transform -rotate-12 translate-y-2">
                              
                                <Wheat className="w-32 h-32 text-amber-500" />
                              </div>
                              <div className="flex flex-col items-center relative z-10">
                                 <Wheat className="w-5 h-5 text-amber-500 mb-1" />
                                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Trigo Processado</span>
                              </div>
                              <div className="flex items-baseline gap-1.5 relative z-10 mt-1">
                                 <span className="text-2xl font-black text-slate-900 tracking-tight">{wheatReceivedTotal.toLocaleString('pt-BR')}</span>
                                 <span className="text-[10px] font-bold text-slate-400 uppercase">KG</span>
                              </div>
                           </div>
                           
                           <div className="bg-slate-50/10 rounded-none p-4 relative overflow-hidden flex justify-center items-center border-2 border-slate-300 flex-col gap-1.5 text-center shadow-sm">
                              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#5C3A21] z-20"></div>
                              <div className="absolute -left-4 -bottom-4 opacity-5 transform -rotate-12 translate-y-2">
                              
                                <Factory className="w-32 h-32 text-[#5C3A21]" />
                              </div>
                              <div className="flex flex-col items-center relative z-10">
                                 <Factory className="w-5 h-5 text-[#5C3A21] mb-1" />
                                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Farelo Produzido</span>
                              </div>
                              <div className="flex items-baseline gap-1.5 relative z-10 mt-1">
                                 <span className="text-2xl font-black text-slate-900 tracking-tight">{subproductTotal.toLocaleString('pt-BR')}</span>
                                 <span className="text-[10px] font-bold text-slate-400 uppercase">KG</span>
                              </div>
                           </div>

                           <div className="bg-slate-50/10 rounded-none p-4 relative overflow-hidden flex justify-center items-center border-2 border-slate-300 flex-col gap-1.5 text-center shadow-sm">
                              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-sky-600 z-20"></div>
                              <div className="absolute -right-4 -bottom-4 opacity-5 transform rotate-12 translate-y-2">
                              
                                <ShoppingBag className="w-32 h-32 text-sky-500" />
                              </div>
                              <div className="flex flex-col items-center relative z-10">
                                 <ShoppingBag className="w-5 h-5 text-sky-500 mb-1" />
                                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Farinha Produzida</span>
                              </div>
                              <div className="flex items-baseline gap-1.5 relative z-10 mt-1">
                                 <span className="text-2xl font-black text-slate-900 tracking-tight">{dynamicFarinhaTotal.toLocaleString('pt-BR')}</span>
                                 <span className="text-[10px] font-bold text-slate-400 uppercase">KG</span>
                              </div>
                           </div>
                        </div>

                        {/* Detailed Flour Grid Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                           {/* Especial */}
                           {bagsEspecial > 0 && (
                              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden relative shadow-sm flex flex-col p-2 pl-3">
                                 <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#0052cc]"></div>
                                 <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 relative flex-shrink-0">
                                       <img src={logoEspecialUrl || 'https://i.ibb.co/3yYgYdjn/image.png'} alt="Especial" className="w-full h-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                                    </div>
                                    <h4 className="text-sm font-black text-[#0052cc] uppercase tracking-widest">Farinha Especial</h4>
                                 </div>
                                 <div className="flex flex-col items-center mb-1">
                                    <div className="flex items-baseline gap-1">
                                       <span className="text-2xl font-black text-[#0052cc] tracking-tight">{calculations.kgEspecial.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                                       <span className="text-lg font-black text-[#0052cc]">kg</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{calculations.pctEspecialTrigo.toFixed(2)}% do trigo</span>
                                 </div>
                                 <hr className="border-slate-200 my-2 w-full" />
                                 <div className="flex items-center justify-between mb-2 px-2">
                                    <div className="flex items-center gap-2">
                                       <Calendar className="w-5 h-5 text-slate-600" />
                                       <div className="flex items-baseline gap-1">
                                          <span className="text-lg font-black text-slate-800">{bagsEspecial}</span>
                                          <span className="text-xs font-bold text-slate-700">BAGS</span>
                                       </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                       <span className="text-[9px] font-black text-[#0052cc] uppercase tracking-widest mb-0.5">Peso Médio</span>
                                       <div className="flex items-baseline gap-1">
                                          <span className="text-sm font-black text-slate-800">{bagsEspecial > 0 ? (calculations.kgEspecial / bagsEspecial).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : '-'}</span>
                                          <span className="text-[10px] font-bold text-slate-600">kg/bag</span>
                                       </div>
                                    </div>
                                 </div>
                                 <div className="flex items-center justify-between mb-2 px-2 pt-2 border-t border-slate-100">
                                    <div className="flex items-center gap-2">
                                       <div className="flex flex-col items-start">
                                          <span className="text-[9px] font-black text-[#0052cc] uppercase tracking-widest mb-0.5">Cor Média</span>
                                          <div className="flex items-baseline gap-1">
                                             <span className="text-sm font-black text-slate-800">{qualityCalculations.especial.avgColor ? qualityCalculations.especial.avgColor.toFixed(2) : '-'}</span>
                                          </div>
                                       </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                       <span className="text-[9px] font-black text-[#0052cc] uppercase tracking-widest mb-0.5">Umidade Média</span>
                                       <div className="flex items-baseline gap-1">
                                          <span className="text-sm font-black text-slate-800">{qualityCalculations.especial.avgHumidity ? qualityCalculations.especial.avgHumidity.toFixed(2) : '-'}</span>
                                          <span className="text-[10px] font-bold text-slate-600">%</span>
                                       </div>
                                    </div>
                                 </div>
                                 <div className="w-full bg-slate-200 rounded-full h-2 mt-auto">
                                    <div className="bg-[#0052cc] h-2 rounded-full" style={{ width: `${calculations.pctEspecialTrigo}%` }}></div>
                                 </div>
                              </div>
                           )}
                           {/* Comum */}
                           {bagsComum > 0 && (
                              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden relative shadow-sm flex flex-col p-2 pl-3">
                                 <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#007a4d]"></div>
                                 <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 relative flex-shrink-0">
                                       <img src={logoComumUrl || 'https://i.ibb.co/r2PbxJbz/image.png'} alt="Comum" className="w-full h-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                                    </div>
                                    <h4 className="text-sm font-black text-[#007a4d] uppercase tracking-widest">Farinha Comum</h4>
                                 </div>
                                 <div className="flex flex-col items-center mb-1">
                                    <div className="flex items-baseline gap-1">
                                       <span className="text-2xl font-black text-[#007a4d] tracking-tight">{calculations.kgComum.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                                       <span className="text-lg font-black text-[#007a4d]">kg</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{calculations.pctComumTrigo.toFixed(2)}% do trigo</span>
                                 </div>
                                 <hr className="border-slate-200 my-2 w-full" />
                                 <div className="flex items-center justify-between mb-2 px-2">
                                    <div className="flex items-center gap-2">
                                       <Calendar className="w-5 h-5 text-slate-600" />
                                       <div className="flex items-baseline gap-1">
                                          <span className="text-lg font-black text-slate-800">{bagsComum}</span>
                                          <span className="text-xs font-bold text-slate-700">BAGS</span>
                                       </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                       <span className="text-[9px] font-black text-[#007a4d] uppercase tracking-widest mb-0.5">Peso Médio</span>
                                       <div className="flex items-baseline gap-1">
                                          <span className="text-sm font-black text-slate-800">{bagsComum > 0 ? (calculations.kgComum / bagsComum).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : '-'}</span>
                                          <span className="text-[10px] font-bold text-slate-600">kg/bag</span>
                                       </div>
                                    </div>
                                 </div>
                                 <div className="flex items-center justify-between mb-2 px-2 pt-2 border-t border-slate-100">
                                    <div className="flex items-center gap-2">
                                       <div className="flex flex-col items-start">
                                          <span className="text-[9px] font-black text-[#007a4d] uppercase tracking-widest mb-0.5">Cor Média</span>
                                          <div className="flex items-baseline gap-1">
                                             <span className="text-sm font-black text-slate-800">{qualityCalculations.comum.avgColor ? qualityCalculations.comum.avgColor.toFixed(2) : '-'}</span>
                                          </div>
                                       </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                       <span className="text-[9px] font-black text-[#007a4d] uppercase tracking-widest mb-0.5">Umidade Média</span>
                                       <div className="flex items-baseline gap-1">
                                          <span className="text-sm font-black text-slate-800">{qualityCalculations.comum.avgHumidity ? qualityCalculations.comum.avgHumidity.toFixed(2) : '-'}</span>
                                          <span className="text-[10px] font-bold text-slate-600">%</span>
                                       </div>
                                    </div>
                                 </div>
                                 <div className="w-full bg-slate-200 rounded-full h-2 mt-auto">
                                    <div className="bg-[#007a4d] h-2 rounded-full" style={{ width: `${calculations.pctComumTrigo}%` }}></div>
                                 </div>
                              </div>
                           )}
                           {/* Inteira */}
                           {bagsInteira > 0 && (
                              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden relative shadow-sm flex flex-col p-2 pl-3">
                                 <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#cc0000]"></div>
                                 <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 relative flex-shrink-0">
                                       <img src={logoInteiraUrl || 'https://i.ibb.co/Xn0XLJM/image.png'} alt="Inteira" className="w-full h-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                                    </div>
                                    <h4 className="text-sm font-black text-[#cc0000] uppercase tracking-widest">Farinha Inteira</h4>
                                 </div>
                                 <div className="flex flex-col items-center mb-1">
                                    <div className="flex items-baseline gap-1">
                                       <span className="text-2xl font-black text-[#cc0000] tracking-tight">{calculations.kgInteira.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                                       <span className="text-lg font-black text-[#cc0000]">kg</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{calculations.pctInteiraTrigo.toFixed(2)}% do trigo</span>
                                 </div>
                                 <hr className="border-slate-200 my-2 w-full" />
                                 <div className="flex items-center justify-between mb-2 px-2">
                                    <div className="flex items-center gap-2">
                                       <Calendar className="w-5 h-5 text-slate-600" />
                                       <div className="flex items-baseline gap-1">
                                          <span className="text-lg font-black text-slate-800">{bagsInteira}</span>
                                          <span className="text-xs font-bold text-slate-700">BAGS</span>
                                       </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                       <span className="text-[9px] font-black text-[#cc0000] uppercase tracking-widest mb-0.5">Peso Médio</span>
                                       <div className="flex items-baseline gap-1">
                                          <span className="text-sm font-black text-slate-800">{bagsInteira > 0 ? (calculations.kgInteira / bagsInteira).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : '-'}</span>
                                          <span className="text-[10px] font-bold text-slate-600">kg/bag</span>
                                       </div>
                                    </div>
                                 </div>
                                 <div className="flex items-center justify-between mb-2 px-2 pt-2 border-t border-slate-100">
                                    <div className="flex items-center gap-2">
                                       <div className="flex flex-col items-start">
                                          <span className="text-[9px] font-black text-[#cc0000] uppercase tracking-widest mb-0.5">Cor Média</span>
                                          <div className="flex items-baseline gap-1">
                                             <span className="text-sm font-black text-slate-800">{qualityCalculations.inteira.avgColor ? qualityCalculations.inteira.avgColor.toFixed(2) : '-'}</span>
                                          </div>
                                       </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                       <span className="text-[9px] font-black text-[#cc0000] uppercase tracking-widest mb-0.5">Umidade Média</span>
                                       <div className="flex items-baseline gap-1">
                                          <span className="text-sm font-black text-slate-800">{qualityCalculations.inteira.avgHumidity ? qualityCalculations.inteira.avgHumidity.toFixed(2) : '-'}</span>
                                          <span className="text-[10px] font-bold text-slate-600">%</span>
                                       </div>
                                    </div>
                                 </div>
                                 <div className="w-full bg-slate-200 rounded-full h-2 mt-auto">
                                    <div className="bg-[#cc0000] h-2 rounded-full" style={{ width: `${calculations.pctInteiraTrigo}%` }}></div>
                                 </div>
                              </div>
                           )}
                           {/* Cola */}
                           {bagsCola > 0 && (
                              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden relative shadow-sm flex flex-col p-2 pl-3">
                                 <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#475569]"></div>
                                 <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 relative flex-shrink-0">
                                       <img src={logoColaUrl || 'https://i.ibb.co/8LDzkhh8/image.png'} alt="Cola" className="w-full h-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                                    </div>
                                    <h4 className="text-sm font-black text-[#475569] uppercase tracking-widest">Farinha Cola</h4>
                                 </div>
                                 <div className="flex flex-col items-center mb-1">
                                    <div className="flex items-baseline gap-1">
                                       <span className="text-2xl font-black text-[#475569] tracking-tight">{calculations.kgCola.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                                       <span className="text-lg font-black text-[#475569]">kg</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{calculations.pctColaTrigo.toFixed(2)}% do trigo</span>
                                 </div>
                                 <hr className="border-slate-200 my-2 w-full" />
                                 <div className="flex items-center justify-between mb-2 px-2">
                                    <div className="flex items-center gap-2">
                                       <Calendar className="w-5 h-5 text-slate-600" />
                                       <div className="flex items-baseline gap-1">
                                          <span className="text-lg font-black text-slate-800">{bagsCola}</span>
                                          <span className="text-xs font-bold text-slate-700">BAGS</span>
                                       </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                       <span className="text-[9px] font-black text-[#475569] uppercase tracking-widest mb-0.5">Peso Médio</span>
                                       <div className="flex items-baseline gap-1">
                                          <span className="text-sm font-black text-slate-800">{bagsCola > 0 ? (calculations.kgCola / bagsCola).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : '-'}</span>
                                          <span className="text-[10px] font-bold text-slate-600">kg/bag</span>
                                       </div>
                                    </div>
                                 </div>
                                 <div className="flex items-center justify-between mb-2 px-2 pt-2 border-t border-slate-100">
                                    <div className="flex items-center gap-2">
                                       <div className="flex flex-col items-start">
                                          <span className="text-[9px] font-black text-[#475569] uppercase tracking-widest mb-0.5">Cor Média</span>
                                          <div className="flex items-baseline gap-1">
                                             <span className="text-sm font-black text-slate-800">{qualityCalculations.cola.avgColor ? qualityCalculations.cola.avgColor.toFixed(2) : '-'}</span>
                                          </div>
                                       </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                       <span className="text-[9px] font-black text-[#475569] uppercase tracking-widest mb-0.5">Umidade Média</span>
                                       <div className="flex items-baseline gap-1">
                                          <span className="text-sm font-black text-slate-800">{qualityCalculations.cola.avgHumidity ? qualityCalculations.cola.avgHumidity.toFixed(2) : '-'}</span>
                                          <span className="text-[10px] font-bold text-slate-600">%</span>
                                       </div>
                                    </div>
                                 </div>
                                 <div className="w-full bg-slate-200 rounded-full h-2 mt-auto">
                                    <div className="bg-[#475569] h-2 rounded-full" style={{ width: `${calculations.pctColaTrigo}%` }}></div>
                                 </div>
                              </div>
                           )}
                           {/* Farelo */}
                           {subproductTotal > 0 && (
                              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden relative shadow-sm flex flex-col p-2 pl-3">
                                 <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#ea580c]"></div>
                                 <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 relative flex-shrink-0">
                                       <img src={logoFareloUrl || 'https://i.ibb.co/chcGNGq8/image.png'} alt="Farelo" className="w-full h-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                                    </div>
                                    <h4 className="text-sm font-black text-[#ea580c] uppercase tracking-widest">Farelo (Subproduto)</h4>
                                 </div>
                                 <div className="flex flex-col items-center mb-1">
                                    <div className="flex items-baseline gap-1">
                                       <span className="text-2xl font-black text-[#ea580c] tracking-tight">{subproductTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                                       <span className="text-lg font-black text-[#ea580c]">kg</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{calculations.pctFareloTrigo.toFixed(2)}% do trigo</span>
                                 </div>
                                 <hr className="border-slate-200 my-2 w-full" />
                                 <div className="flex items-center justify-between mb-2 px-2">
                                    <div className="flex items-center gap-2">
                                       <span className="text-xs font-medium text-slate-400 italic">Não se aplica bags</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                       <span className="text-[9px] font-black text-[#ea580c] uppercase tracking-widest mb-0.5">% da Produção</span>
                                       <div className="flex items-baseline gap-1">
                                          <span className="text-sm font-black text-slate-800">{calculations.pctFareloTotal.toFixed(2)}</span>
                                          <span className="text-[10px] font-bold text-slate-600">%</span>
                                       </div>
                                    </div>
                                 </div>
                                 <div className="w-full bg-slate-200 rounded-full h-2 mt-auto">
                                    <div className="bg-[#ea580c] h-2 rounded-full" style={{ width: `${calculations.pctFareloTrigo}%` }}></div>
                                 </div>
                              </div>
                           )}
                        </div>
                         <div className="mt-auto border-t border-slate-200 pt-3">


                            <div className="flex justify-between items-end">
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">
                                  SISTEMA MOCCA ERP • LAUDO DE PRODUÇÃO CONSOLIDADO
                                </p>
                               <div className="text-right">
                                  <p className="text-[10px] font-black text-[#0f172a] uppercase tracking-widest">PÁGINA 01/02</p>
                                  <p className="text-[7px] font-bold text-slate-300 uppercase mt-1">Resumo Industrial de Moagem</p>
                               </div>
                            </div>
                         </div>
                      </div>

                      {/* PAGE 2: LOGÍSTICA E QUALIDADE */}
                      <div className="bg-white shadow-[0_40px_100px_-12px_rgba(0,0,0,0.5)] relative flex flex-col p-12 border-[2mm] border-[#0f172a] pdf-page" style={{ width: '800px', height: '1132px' }}>
                        {/* Technical Frame */}
                        <div className="absolute top-4 left-4 right-4 h-1 border-t border-slate-200 opacity-50"></div>
                        <div className="absolute bottom-4 left-4 right-4 h-1 border-b border-slate-200 opacity-50"></div>
                        <div className="absolute left-4 top-4 bottom-4 w-1 border-l border-slate-200 opacity-50"></div>
                        <div className="absolute right-4 top-4 bottom-4 w-1 border-r border-slate-200 opacity-50"></div>


                        {/* Logistic Section */}
                        <div className="mb-8">
                           <h3 className="text-2xl font-black text-slate-800 uppercase tracking-[0.25em] mb-6 pt-4 border-b-2 border-slate-800 pb-4 text-center">
                              Registro de Fluxologia e Logística (CLI/FORN)
                           </h3>

                           {/* Shipments client-tracking table */}
                           <div className="mb-8 min-h-[100px] text-left">
                              <div className="flex justify-between items-center mb-4">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Balanço Técnico de Entradas e Saídas
                                 </span>
                                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">LOTE {data.lote}</span>
                              </div>
                              <table className="w-full text-left border-collapse">
                                 <thead>
                                    <tr className="border-b-2 border-slate-800 text-[10px] uppercase font-black tracking-widest text-slate-400">
                                       <th className="py-3 px-2 w-16">Lote</th>
                                       <th className="py-3 px-2">CLIENTE/FORNECEDOR</th>
                                       <th className="py-3 px-2 w-24">Produto</th>
                                       <th className="py-3 px-2 text-right w-20">Qtd. Bags</th>
                                       <th className="py-3 px-2 text-right w-24">Distância</th>
                                       <th className="py-3 px-2 text-right w-32">Peso Líquido (KG)</th>
                                     </tr>
                                 </thead>
                                 <tbody className="text-xs font-bold text-slate-700">
                                        {groupedActiveMovements.length === 0 ? (
                                           <tr>
                                              <td colSpan={6} className="py-8 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Nenhuma movimentação incluída para este lote.</td>
                                           </tr>
                                        ) : (
                                           groupedActiveMovements.map((group, idx) => {
                                              return (
                                                 <tr key={idx} className="border-b border-slate-100">
                                                    <td className="py-2.5 px-2 uppercase">
                                                       {data.lote}
                                                    </td>
                                                    <td className="py-2.5 px-2 uppercase">
                                                       {group.partner}
                                                    </td>
                                                    <td className="py-2.5 px-2 uppercase">
                                                       {group.product}
                                                    </td>
                                                    <td className="py-2.5 px-2 text-right">
                                                        {group.totalBags ? (
                                                           <div className="flex flex-col items-end gap-1">
                                                              <span>{group.totalBags.toLocaleString('pt-BR')} BAGS</span>
                                                              {group.category === 'SAÍDA' && (
                                                                 <div className="flex flex-col items-end mt-1">
                                                                    {group.bagsBreakdown.especial > 0 && <span className="text-[8px] text-slate-400 font-medium uppercase">ESP: {group.bagsBreakdown.especial.toLocaleString('pt-BR')}</span>}
                                                                    {group.bagsBreakdown.comum > 0 && <span className="text-[8px] text-slate-400 font-medium uppercase">COM: {group.bagsBreakdown.comum.toLocaleString('pt-BR')}</span>}
                                                                    {group.bagsBreakdown.inteira > 0 && <span className="text-[8px] text-slate-400 font-medium uppercase">INT: {group.bagsBreakdown.inteira.toLocaleString('pt-BR')}</span>}
                                                                    {group.bagsBreakdown.cola > 0 && <span className="text-[8px] text-slate-400 font-medium uppercase">COL: {group.bagsBreakdown.cola.toLocaleString('pt-BR')}</span>}
                                                                 </div>
                                                              )}
                                                           </div>
                                                        ) : <span className="text-slate-300">---</span>}
                                                     </td>
                                                     <td className="py-2.5 px-2 text-right uppercase">
                                                       {group.totalDistance ? `${Math.round(group.totalDistance).toLocaleString('pt-BR')} KM` : <span className="text-slate-300">---</span>}
                                                    </td>
                                                    <td className="py-2.5 px-2 text-right uppercase">
                                                       {group.totalWeight.toLocaleString('pt-BR')} KG
                                                    </td>
                                                 </tr>
                                              );
                                           })
                                        )}
                                      
                                 </tbody>
                              </table>
                           </div>
                     </div>

                        {/* Footer 2 */}
                        <div className="mt-auto flex justify-between items-end border-t border-slate-100 pt-10">
                           <div className="flex items-center gap-8">
                              <div className="text-center">
                                 <div className="w-48 h-[1px] bg-slate-400 mb-2"></div>
                                 <p className="text-[9px] font-black text-[#0f172a] uppercase">Supervisão Industrial</p>
                                 <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">VERIFICAÇÃO MOCCA APP</p>
                              </div>
                           </div>
                           
                           <div className="text-right">
                              <div className="flex flex-col items-end gap-3 mb-6">
                                 <img 
                                    src="https://i.ibb.co/chcGNGq8/image.png" 
                                    className="h-10 grayscale opacity-20"
                                    style={{ imageRendering: 'auto' }}
                                    referrerPolicy="no-referrer"
                                 />
                                 <div className="bg-blue-600 text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest shadow-lg">QUALIDADE ASSEGURADA</div>
                              </div>
                              <p className="text-[10px] font-black text-[#0f172a] uppercase tracking-widest">PÁGINA 02/02</p>
                           </div>
                        </div>
                      </div>
                    </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
