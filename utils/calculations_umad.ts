
import { MillingState, CalculationResultUmad, RestScheduleItem } from '../types';
const WHEAT_FACTOR: Record<string, number> = {
  'Soft': 1.0,
  'Hard': 1.1,
  'Durum': 1.2
};

export const calculateMillingLoss = (temp: number, humidity: number): number => {
  let loss = 1.8;
  const tempDiff = temp - 25;
  loss += tempDiff * 0.04;
  const humidityDiff = 60 - humidity;
  loss += humidityDiff * 0.02;
  return Math.min(Math.max(loss, 0.5), 4.0);
};

export const calculateStorageLoss = (hours: number, temp: number): number => {
  if (hours <= 0) return 0;
  const baseRate = 0.008; 
  const tempFactor = Math.max(0.5, 1 + (temp - 25) * 0.04);
  const totalLoss = hours * baseRate * tempFactor;
  return Math.min(parseFloat(totalLoss.toFixed(2)), 2.0);
};

export const calculateWaterDosage = (state: MillingState): CalculationResultUmad => {
  const {
    flowRate,
    initialMoisture,
    targetFlourMoisture,
    airTemperature,
    relativeHumidity,
    manualLossOverride,
    wheatType,
    restTime,
    hourlyForecast,
    weatherMode
  } = state;

  const estimatedLoss = manualLossOverride !== null 
    ? manualLossOverride 
    : calculateMillingLoss(airTemperature, relativeHumidity);

  const storageLoss = calculateStorageLoss(restTime, airTemperature);
  const targetAtFirstBreak = targetFlourMoisture + estimatedLoss;
  const compensatedDampeningMoisture = targetAtFirstBreak + storageLoss;

  let litersPerHour = 0;
  let waterPerTon = 0;
  
  const moistureDiff = compensatedDampeningMoisture - initialMoisture;
  if (moistureDiff > 0) {
    litersPerHour = flowRate * ( (compensatedDampeningMoisture - initialMoisture) / (100 - compensatedDampeningMoisture) );
    const typeFactor = WHEAT_FACTOR[wheatType] || 1.0;
    litersPerHour = litersPerHour * typeFactor;
    litersPerHour = Math.round(litersPerHour);
    waterPerTon = parseFloat((litersPerHour / (flowRate / 1000)).toFixed(1));
  }

  const schedule: RestScheduleItem[] = [];
  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const hoursToGenerate = Math.max(1, Math.round(restTime));

  for (let i = 0; i < hoursToGenerate; i++) {
    const futureDate = new Date();
    futureDate.setHours(currentHour + i);
    futureDate.setMinutes(currentMin);
    const timeStr = futureDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    let temp = airTemperature;
    let hum = relativeHumidity;
    let source: 'AUTO' | 'MANUAL' = 'MANUAL';

    if (weatherMode === 'AUTO' && hourlyForecast && hourlyForecast[i]) {
       temp = hourlyForecast[i].temp;
       hum = hourlyForecast[i].humidity;
       source = 'AUTO';
    }

    schedule.push({ hourOffset: i, timeLabel: timeStr, temp, humidity: hum, source });
  }

  return {
    estimatedLoss: parseFloat(estimatedLoss.toFixed(2)),
    targetTemperingMoisture: parseFloat(targetAtFirstBreak.toFixed(2)),
    compensatedDampeningMoisture: parseFloat(compensatedDampeningMoisture.toFixed(2)),
    litersPerHour,
    waterPerTon,
    storageLoss: parseFloat(storageLoss.toFixed(2)),
    projectedFlourMoisture: targetFlourMoisture,
    schedule
  };
};
