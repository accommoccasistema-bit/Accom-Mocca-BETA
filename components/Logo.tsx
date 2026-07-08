
import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  imgClassName?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = '', imgClassName = '' }) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className={`flex flex-col items-center justify-center select-none w-full ${className}`}>
      <div className="w-full max-w-[240px] flex items-center justify-center p-2">
        {!imgFailed ? (
          <img 
            src="logo.png" 
            alt="MOCCA" 
            className={`w-full h-auto object-contain transition-all duration-500 relative ${imgClassName}`}
            style={{ imageRendering: 'auto' }}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="logo-fallback text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
            <span className="bg-slate-900 text-white px-1.5 py-0.5 rounded">MO</span>
            <span>CCA</span>
          </div>
        )}
      </div>
    </div>
  );
};
