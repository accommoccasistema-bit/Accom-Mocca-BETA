
export interface MillingBoxDetails {
  date: string;
  startHour: string;
  flowRate: number;
  wheatType: string;
  scale: number;
  water: number;
  molhagemStart: string;
  totalKg: number;
  operator: string;
}

export interface MillingBoxData {
  id: number;
  isRunning: boolean;
  isPaused: boolean;
  isFinished: boolean;
  startTime: number | null; 
  elapsedTime: number; 
  details: MillingBoxDetails;
}
