
import React, { useState, useEffect, useRef } from 'react';
import { MillingState, WheatType } from '../types';
import { 
  Settings, Thermometer, Droplet, Clock, Zap, Scale, 
  RotateCcw, Sprout, Target
} from 'lucide-react';

interface Props {
  state: MillingState;
  onChange: (key: keyof MillingState, value: any) => void;
  isLoadingWeather?: boolean;
}

const InputCapsule = React.memo(({ icon: Icon, label, value, onInputChange, suffix = "" }: any) => {
  const [localValue, setLocalValue] = useState(value === undefined || value === 0 ? '' : value.toString());
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setLocalValue(value === undefined || value === 0 ? '' : value.toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9.,]/g, '');
    setLocalValue(val);
    const normalized = val.replace(',', '.');
    if (normalized && !isNaN(parseFloat(normalized))) {
      onInputChange(parseFloat(normalized));
    } else if (normalized === '') {
      onInputChange(0);
    }
  };

  return (
    <div className="space-y-1">
       <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{label}</label>
       <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <Icon className="h-4 w-4 text-slate-400" />
          </div>
          <input 
            type="text" 
            inputMode="decimal"
            value={localValue}
            onFocus={() => { isFocused.current = true; }}
            onBlur={() => { isFocused.current = false; }}
            onChange={handleChange}
            placeholder="0"
            className="block w-full pl-9 pr-8 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-base rounded-2xl py-3 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all appearance-none"
          />
          {suffix && (
             <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-[10px] font-bold text-slate-400">{suffix}</span>
             </div>
          )}
       </div>
    </div>
  );
});

const ControlPanel: React.FC<Props> = ({ state, onChange, isLoadingWeather }) => {
  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-4 sm:p-5 font-sans mb-4">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">Controles</h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Configurações</p>
          </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <InputCapsule icon={Zap} label="Vazão" value={state.flowRate} onInputChange={(val: number) => onChange('flowRate', val)} suffix="kg" />
           <InputCapsule icon={Scale} label="Umid. Inic" value={state.initialMoisture} onInputChange={(val: number) => onChange('initialMoisture', val)} suffix="%" />
        </div>

        <div className="space-y-2">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1">
              <Sprout className="w-3 h-3" /> Tipo de Trigo
           </label>
           <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
              {Object.values(WheatType).map((type) => (
                <button
                  key={type}
                  onClick={() => onChange('wheatType', type)}
                  className={`py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${state.wheatType === type ? 'bg-white text-blue-600 shadow-md border border-blue-100' : 'text-slate-400'}`}
                >
                  {type}
                </button>
              ))}
           </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-3xl border border-slate-200">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ambiente</h3>
              <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                  <button onClick={() => onChange('weatherMode', 'MANUAL')} className={`px-3 py-1 rounded-lg text-[9px] font-bold transition-all ${state.weatherMode === 'MANUAL' ? 'bg-slate-100 text-slate-800' : 'text-slate-400'}`}>MAN</button>
                  <button onClick={() => onChange('weatherMode', 'AUTO')} className={`px-3 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all ${state.weatherMode === 'AUTO' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                    {isLoadingWeather && <RotateCcw className="w-2.5 h-2.5 animate-spin" />} AUTO
                  </button>
              </div>
           </div>

           <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 ${state.weatherMode === 'AUTO' ? 'opacity-40 pointer-events-none' : ''}`}>
              <InputCapsule icon={Thermometer} label="Temp." value={state.airTemperature} onInputChange={(val: number) => onChange('airTemperature', val)} suffix="°C" />
              <InputCapsule icon={Droplet} label="Umid. Ar" value={state.relativeHumidity} onInputChange={(val: number) => onChange('relativeHumidity', val)} suffix="%" />
           </div>

           <InputCapsule icon={Clock} label="Tempo Repouso" value={state.restTime} onInputChange={(val: number) => onChange('restTime', val)} suffix="h" />
        </div>

        <div className="bg-slate-900 rounded-3xl p-5 text-white shadow-xl">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-400" /> Meta Final
            </h3>
            <div className="text-center mb-4">
                 <div className="flex items-center justify-center gap-1">
                    <span className="text-4xl font-black text-white">{state.targetFlourMoisture.toFixed(1)}</span>
                    <span className="text-base font-bold text-blue-400">%</span>
                 </div>
                 <input type="range" min="13.0" max="15.5" step="0.1" value={state.targetFlourMoisture} onChange={(e) => onChange('targetFlourMoisture', parseFloat(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-4" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
