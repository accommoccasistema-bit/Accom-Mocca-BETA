import React from 'react';

interface BigBagIconProps {
  className?: string;
  color?: string;
  withEditBadge?: boolean;
}

export const BigBagIcon: React.FC<BigBagIconProps> = ({ className = "w-10 h-10", color = "currentColor", withEditBadge = false }) => {
  return (
    <div className="relative inline-block">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
      >
        {/* Alças do Big Bag */}
        <path d="M9 6V4a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v2" />
        
        {/* Corpo do Saco */}
        <path d="M6 6h12l1 14a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2l1 -14Z" />
        
        {/* Detalhe de costura/dobra para dar volume */}
        <path d="M6 10h12" strokeDasharray="2 2" opacity="0.5" />
        <path d="M9 16l2 2l4 -4" opacity="0.2" />
      </svg>
      
      {/* Badge de Edição (Lápis) se solicitado */}
      {withEditBadge && (
        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-slate-100">
           <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
           </svg>
        </div>
      )}
    </div>
  );
};