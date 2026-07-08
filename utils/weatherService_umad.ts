
import { HourlyForecast } from '../types';

const DEFAULT_LAT = -25.1561;
const DEFAULT_LON = -53.8475;

interface ForecastResult {
  avgTemp: number;
  avgHumidity: number;
  city: string;
  hourlyPoints: HourlyForecast[];
}

export const getForecastAverage = async (hoursAhead: number): Promise<ForecastResult> => {
  return new Promise((resolve, reject) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchForecast(position.coords.latitude, position.coords.longitude, hoursAhead, "Local")
            .then(resolve)
            .catch(reject);
        },
        () => {
          fetchForecast(DEFAULT_LAT, DEFAULT_LON, hoursAhead, "Céu Azul")
            .then(resolve)
            .catch(reject);
        }
      );
    } else {
      fetchForecast(DEFAULT_LAT, DEFAULT_LON, hoursAhead, "Céu Azul")
        .then(resolve)
        .catch(reject);
    }
  });
};

const fetchForecast = async (lat: number, lon: number, hours: number, cityName: string): Promise<ForecastResult> => {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m&timezone=America%2FSao_Paulo&forecast_days=3`
    );
    const data = await response.json();
    if (!data.hourly) throw new Error("API Offline");

    const temps = data.hourly.temperature_2m as number[];
    const hums = data.hourly.relative_humidity_2m as number[];
    const times = data.hourly.time as string[];
    const currentHourIndex = new Date().getHours();
    
    let sumTemp = 0;
    let sumHum = 0;
    let count = 0;
    const hourlyPoints: HourlyForecast[] = [];

    for (let i = currentHourIndex; i < currentHourIndex + hours; i++) {
      if (temps[i] !== undefined) {
        sumTemp += temps[i];
        sumHum += hums[i];
        count++;
        hourlyPoints.push({
          time: new Date(times[i]).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          temp: temps[i],
          humidity: hums[i]
        });
      }
    }

    if (count === 0) return { avgTemp: 25, avgHumidity: 60, city: cityName, hourlyPoints: [] };

    return {
      avgTemp: parseFloat((sumTemp / count).toFixed(1)),
      avgHumidity: Math.round(sumHum / count),
      city: cityName,
      hourlyPoints
    };
  } catch (error) {
    console.error("Erro clima:", error);
    throw error;
  }
};
