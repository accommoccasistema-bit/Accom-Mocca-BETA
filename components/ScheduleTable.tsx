
import React from 'react';
import { RestScheduleItem } from '../types';
import { CalendarClock, Droplets, Thermometer, Clock, Wifi } from 'lucide-react';

interface Props {
  schedule: RestScheduleItem[];
  date: string;
}

const ScheduleTable: React.FC<Props> = ({ schedule, date }) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full font-sans">
      <div className="bg-slate-800 p-4 text-white">
         <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-400" />
            <div>
               <h3 className="font-black text-sm uppercase tracking-widest">Previsão Repouso</h3>
               <p className="text-[8px] text-slate-400 font-bold uppercase">{date} • {schedule.length} Horas</p>
            </div>
         </div>
      </div>
      
      <div className="max-h-[300px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
           <thead className="bg-slate-50 sticky top-0 z-10">
              <tr className="text-[8px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                 <th className="px-4 py-2">Hora</th>
                 <th className="px-4 py-2">Temp</th>
                 <th className="px-4 py-2">Umid</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-50">
              {schedule.slice(0, 12).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                   <td className="px-4 py-2 text-[10px] font-bold text-slate-600">{row.timeLabel}</td>
                   <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                         <Thermometer className="w-3 h-3 text-red-400" />
                         <span className="text-[10px] font-black text-slate-800">{row.temp.toFixed(1)}°</span>
                      </div>
                   </td>
                   <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                         <Droplets className="w-3 h-3 text-blue-400" />
                         <span className="text-[10px] font-black text-slate-800">{row.humidity}%</span>
                      </div>
                   </td>
                </tr>
              ))}
           </tbody>
        </table>
      </div>

      <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2">
         <Wifi className="w-3 h-3 text-blue-500" />
         <span className="text-[8px] font-bold text-slate-400 uppercase">Sincronizado Open-Meteo</span>
      </div>
    </div>
  );
};

export default ScheduleTable;
