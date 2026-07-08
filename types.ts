
// CalculationResult interface
export interface CalculationResult {
  flourPerHour: number;
  branPerHour: number;
  totalPerHour: number;
  yieldPercentage: number;
  breakdown: {
    common: number;
    special: number;
    whole: number;
    glue: number;
  }
}

// LoadType and Load interface
export type LoadType = 'E' | 'C' | 'I' | 'CL';

export interface Load {
  id: string;
  loadId: string; // Ex: EQI14
  type: LoadType;
  quantity: number; // Target quantity
  currentQty: number; // Current bag count
  client?: string;
  weight?: number;
  step: number; // 1 a 7
  status: 'ATIVO' | 'FINALIZADO';
  createdAt: any;
  updatedAt: any;
  userId: string;
  batchId?: string;
  batchName?: string;
  entityId?: string; // ID of the Client/Supplier
  totalDistanceKm?: number; // Calculated as distanceKm * 2
  totalTrips?: number; // Always 2 as per requirement
  driverName?: string;
  vehiclePlate?: string;
  color?: string;
  humidity?: number;
  invoice?: string;
  isAmortized?: boolean;
  amortizedWeight?: number;
  consumedReturnWeight?: number;
  amortizedBran?: number;
  attachment?: {
    name: string;
    data: string; // Base64 string
    uploadedAt: number; // timestamp in ms
    size: number;
  };
}

// Added missing StockData interface
export interface StockData {
  common: number;
  special: number;
  whole: number;
  glue: number;
  branStock: number; // In kg
  returnFlourBalance?: number; // In kg
  returnBranBalance?: number; // In kg
  returnOtherBalance?: number; // In kg
  updatedAt?: any;
  userId?: string;
}

// Added missing Destination type
export type Destination = 'C' | 'E' | 'CL';

// Added missing Bica interface
export interface Bica {
  id: string;
  name: string;
  color: number;
  vazao: number;
  destination: Destination | null;
}

// Added missing SavedExtraction interface
export interface SavedExtraction {
  id: string;
  date: any;
  flour: number;
  bran: number;
  yieldPercentage: number;
  flourCommon?: number;
  flourSpecial?: number;
  flourWhole?: number;
  flourGlue?: number;
  userId: string;
}

// Added missing MoistureEntry interface
export interface MoistureEntry {
  id: string;
  wheat: number;
  flour: number;
  bran: number;
  date: any;
  userId: string;
}

export interface Analysis {
  id: string;
  type: string; // 'ESPECIAL', 'COMUM', 'INTEIRA', 'COLA', 'FARELO', 'TRIGO'
  color: number;
  moisture: number;
  date: any;
  userId: string;
}

export enum WheatType {
  Soft = 'Soft',
  Hard = 'Hard',
  Durum = 'Durum'
}

export interface RestScheduleItem {
  time?: string;
  action?: string;
  hourOffset?: number;
  timeLabel?: string;
  temp?: number;
  humidity?: number;
  source?: string;
}

export interface MillingState {
  flowRate: number;
  initialMoisture: number;
  targetFlourMoisture: number;
  airTemperature: number;
  relativeHumidity: number;
  manualLossOverride: number | null;
  restTime: number;
  hourlyForecast: HourlyForecast[];
  weatherMode: string;
  wheatType: WheatType;
}

export interface CalculationResultUmad {
  loss?: number;
  finalYield?: number;
  estimatedLoss?: number;
  targetTemperingMoisture?: number;
  compensatedDampeningMoisture?: number;
  litersPerHour?: number;
  waterPerTon?: number;
  storageLoss?: number;
  projectedFlourMoisture?: number;
  schedule?: RestScheduleItem[];
}

export interface HourlyForecast {
  time: string;
  temp: number;
  humidity: number;
}

// Added missing MillingBoxDetails interface
export interface MillingBoxDetails {
  date: string;
  startHour: string;
  flowRate: number;
  wheatType: string;
  water: number;
  molhagemStart: string;
  totalKg: number;
  operator: string;
}

// Added missing MillingBoxData interface
export interface MillingBoxData {
  id: number;
  isRunning: boolean;
  isPaused: boolean;
  isFinished: boolean;
  startTime: number | null; 
  elapsedTime: number; 
  details: MillingBoxDetails;
}

export interface CalculatorState {
  flourCommon: string;
  flourSpecial: string;
  flourWhole: string;
  flourGlue: string;
  branSample: string;
  step: 'form' | 'results';
  results: CalculationResult | null;
  updatedAt?: any;
}

export interface AppConfig {
  currentView: string;
  updatedAt?: any;
}

export interface Entity {
  id: string;
  name: string;
  companyName?: string;
  cnpj?: string;
  phone?: string;
  city: string;
  state: string;
  address: string;
  distanceKm: number;
  type: 'FORNECEDOR' | 'CLIENTE' | 'AMBOS';
  logo?: string; // Base64 string of compressed logo/icon
  createdAt: any;
  userId: string;
}

export interface Batch {
  id: string;
  name: string;
  targetWheat: number;
  currentWheat: number;
  targetFlour: number;
  currentFlour: number;
  targetSubproduct: number;
  currentSubproduct: number;
  status: 'OPEN' | 'CLOSED';
  createdAt: any;
  startDate?: any;
  estimatedEndDate?: any;
  closedAt?: any;
  // Summary fields for report
  totalBags?: number;
  wheatEntryCount?: number;
  flourLoadCount?: number;
  subproductLoadCount?: number;
  durationDays?: number;
  millingCapacity: number; // kg/h
}

export interface WheatEntry {
  id: string;
  ticket: string;
  driver: string;
  plate: string;
  description: string;
  entity: string;
  product: string;
  batchId?: string;
  entityId?: string;
  entryWeight: number;
  exitWeight: number;
  liquidWeight: number;
  moisture: number;
  impurity: number;
  triguilho: number;
  avariado: number;
  ph: number;
  discount: number;
  finalWeight: number;
  totalDistanceKm?: number;
  totalTrips?: number;
  date: any;
  entryTime?: string;
  userId: string;
}

export type SubproductType = 'FARELO' | 'RESIDUO' | 'OUTRO';

export interface SubproductLoad {
  id: string;
  loadId: string;
  type: SubproductType;
  otherName?: string;
  quantity: number;
  status: 'ATIVO' | 'FINALIZADO';
  createdAt: any;
  updatedAt: any;
  userId: string;
  batchId?: string;
  entityId?: string;
  totalDistanceKm?: number;
  totalTrips?: number;
  driverName?: string;
  vehiclePlate?: string;
  client?: string;
}

export interface Driver {
  id: string;
  name: string;
  plate: string;
  createdAt: any;
  userId: string;
}

export type WeighingStatus = 'EM_ANDAMENTO' | 'FINALIZADA';

export interface Weighing {
  id: string;
  ticketNumber: number;
  plate: string;
  driver: string;
  product: string;
  entity: string;
  observations?: string | null;
  taraWeight?: number | null;
  brutoWeight?: number | null;
  liquidWeight?: number | null;
  entryDate: any;
  exitDate?: any | null;
  status: WeighingStatus;
  userId: string;
}

export type ReturnProductType = 'FARINHA' | 'FARELO' | 'OUTROS';
export type ReturnMotivo = 'Embalagem danificada' | 'Análise reprovada' | 'Cor' | 'Umidade' | 'Outros';

export interface ReturnRecord {
  id: string;
  type: ReturnProductType;
  loadId: string;    // Ex: #L56/CSX19
  cleanLoadId: string; // Ex: CSX19
  loadDocId: string; // Firestore document ID of source load
  batchId: string;
  batchName: string;
  motivo: ReturnMotivo;
  bagsQty?: number;
  weightKg: number;
  qtyGeneral?: number;
  observations?: string;
  createdAt: any;
  userId: string;
}

export interface MoccaDocument {
  id: string;
  name: string;
  revisionDate: string; // DD/MM/YYYY or YYYY-MM-DD
  fileName: string;
  fileSize: number;
  fileData: string; // Base64 representation for printing and downloading
  createdAt: any; // Firestore Timestamp or date
  userId: string;
  isChunked?: boolean;
  numChunks?: number;
}

export interface Additive {
  id: string;
  userId: string;
  name: string; // Nome Comercial
  technicalName: string; // Nome Técnico
  manufacturer: string;
  supplier: string;
  category: string;
  unit: string;
  recommendedDosage: string;
  description: string;
  status: 'Ativo' | 'Inativo';
  observations: string;
  minStock: number;
  createdAt: any;
}

export interface AdditiveEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  additiveId: string;
  additiveName: string;
  supplier: string;
  invoiceNumber: string;
  qtyReceived: number;
  unit: string;
  manufacturerLot: string;
  manufacturingDate: string;
  expiryDate: string;
  storageLocation: string;
  receiver: string;
  observations: string;
  lotInternalCode: string;
  createdAt: any;
}

export interface AdditiveOutput {
  id: string;
  userId: string;
  date: string;
  time: string;
  additiveId: string;
  additiveName: string;
  lotInternalCode: string;
  qty: number;
  unit: string;
  responsible: string;
  reason: string;
  createdAt: any;
}

export interface AdditiveApplication {
  id: string;
  userId: string;
  date: string;
  time: string;
  operator: string;
  additiveId: string;
  additiveName: string;
  lotInternalCode: string;
  qtyApplied: number;
  unit: string;
  flourBatchId: string;
  flourBatchName: string;
  createdAt: any;
}

export interface AdditiveLot {
  id: string;
  userId: string;
  additiveId: string;
  additiveName: string;
  lotInternalCode: string;
  initialQty: number;
  currentStock: number;
  unit: string;
  expiryDate: string;
  manufacturingDate: string;
  manufacturerLot: string;
  supplier: string;
  createdAt: any;
}


