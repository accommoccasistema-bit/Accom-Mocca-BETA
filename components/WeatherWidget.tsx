
import React, { useEffect, useState } from 'react';
import { Cloud, Sun, CloudRain, CloudLightning, Wind, Droplets, Loader2 } from 'lucide-react';

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
  city?: string;
}

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=-25.1561&longitude=-53.8475&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m&timezone=America%2FSao_Paulo`
        );
        const data = await response.json();
        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          humidity: data.current.relative_humidity_2m,
          windSpeed: Math.round(data.current.wind_speed_10m),
          weatherCode: data.current.weather_code,
          isDay: data.current.is_day === 1
        });
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  if (loading) return null;
  if (!weather) return null;

  return (
    <div className="bg-blue-600 rounded-2xl p-2 sm:p-4 text-white shadow-lg flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 sm:gap-3">
        <Sun className="w-5 h-5 sm:w-8 sm:h-8 text-amber-300 fill-amber-300" />
        <div>
          <span className="text-lg sm:text-2xl font-black leading-none">{weather.temperature}°C</span>
          <p className="text-[6px] sm:text-[8px] font-bold uppercase tracking-widest text-blue-100">Céu Azul - PR</p>
        </div>
      </div>
      <div className="flex gap-2 sm:gap-4">
        <div className="text-center">
          <Droplets className="w-2 h-2 sm:w-3 sm:h-3 mx-auto mb-0.5 sm:mb-1 text-blue-200" />
          <span className="text-[7px] sm:text-[10px] font-black">{weather.humidity}%</span>
        </div>
        <div className="text-center">
          <Wind className="w-2 h-2 sm:w-3 sm:h-3 mx-auto mb-0.5 sm:mb-1 text-blue-200" />
          <span className="text-[7px] sm:text-[10px] font-black">{weather.windSpeed} <span className="text-[5px] sm:text-[7px]">km/h</span></span>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
