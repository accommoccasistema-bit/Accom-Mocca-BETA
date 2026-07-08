import React from 'react';
import { Logo } from './Logo';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center h-screen w-screen overflow-hidden">
      {/* Background with Brand Color */}
      <div className="absolute inset-0 bg-slate-900" />
      
      {/* Decorative pulse element */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
      </div>

      <div className="relative z-10 scale-150 transform transition-all duration-1000 animate-fadeIn">
        <Logo />
      </div>
      
      <div className="absolute bottom-16 z-10 flex flex-col items-center gap-4">
         <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin shadow-xl"></div>
         <p className="text-white text-[10px] font-black tracking-[0.4em] uppercase opacity-80 animate-pulse drop-shadow-md">
           Carregando Sistema
         </p>
      </div>
    </div>
  );
};