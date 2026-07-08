
import React from 'react';

interface ResultCardProps {
  label: string;
  value: string;
  unit: string;
  colorTheme: 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'brown' | 'emerald' | 'amber' | 'black';
}

export const ResultCard: React.FC<ResultCardProps> = ({ label, value, unit, colorTheme }) => {
  const getThemeClasses = () => {
    switch (colorTheme) {
      case 'blue': return 'bg-blue-50 text-blue-800 border-blue-100';
      case 'emerald': return 'bg-emerald-50 text-emerald-800 border-emerald-100';
      case 'red': return 'bg-red-50 text-red-900 border-red-100';
      case 'black': return 'bg-slate-50 text-slate-900 border-slate-200';
      case 'brown': return 'bg-stone-50 text-stone-800 border-stone-200';
      case 'green': return 'bg-green-50 text-green-900 border-green-200';
      case 'yellow': return 'bg-yellow-50 text-yellow-900 border-yellow-200';
      default: return 'bg-gray-50 text-gray-900 border-gray-200';
    }
  };

  return (
    <div className={`${getThemeClasses()} p-2 rounded-2xl shadow-sm border flex flex-col items-center justify-center text-center transition-all active:scale-[0.98]`}>
      <span className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-0.5 truncate w-full px-1 leading-none">{label}</span>
      <div className="flex flex-col items-center leading-none">
        <span className="text-base font-black tracking-tighter">{value}</span>
        {unit && unit !== 'final' && <span className="text-[7px] font-bold opacity-40 mt-0.5 uppercase tracking-tighter">{unit}</span>}
      </div>
    </div>
  );
};
