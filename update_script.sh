sed -i '823,969c\
                        {/* Detailed Flour Grid Layout */}\
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">\
                           {/* Especial */}\
                           {bagsEspecial > 0 && (\
                              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden relative shadow-sm flex flex-col p-4 pl-5">\
                                 <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#0052cc]"></div>\
                                 <div className="flex items-center gap-3 mb-4">\
                                    <div className="w-12 h-12 relative flex-shrink-0">\
                                       <img src={logoEspecialUrl || '\''https://i.ibb.co/3yYgYdjn/image.png'\''} alt="Especial" className="w-full h-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />\
                                    </div>\
                                    <h4 className="text-sm font-black text-[#0052cc] uppercase tracking-widest">Farinha Especial</h4>\
                                 </div>\
                                 <div className="flex flex-col items-center mb-1">\
                                    <div className="flex items-baseline gap-1">\
                                       <span className="text-4xl font-black text-[#0052cc] tracking-tight">{calculations.kgEspecial.toLocaleString('\''pt-BR'\'', { maximumFractionDigits: 0 })}</span>\
                                       <span className="text-lg font-black text-[#0052cc]">kg</span>\
                                    </div>\
                                    <span className="text-sm font-bold text-slate-700">{calculations.pctEspecialTrigo.toFixed(2)}% do trigo</span>\
                                 </div>\
                                 <hr className="border-slate-200 my-4 w-full" />\
                                 <div className="flex items-center justify-between mb-4 px-2">\
                                    <div className="flex items-center gap-2">\
                                       <Calendar className="w-5 h-5 text-slate-600" />\
                                       <div className="flex items-baseline gap-1">\
                                          <span className="text-lg font-black text-slate-800">{bagsEspecial}</span>\
                                          <span className="text-xs font-bold text-slate-700">BAGS</span>\
                                       </div>\
                                    </div>\
                                    <div className="flex flex-col items-end">\
                                       <span className="text-[9px] font-black text-[#0052cc] uppercase tracking-widest mb-0.5">Peso Médio</span>\
                                       <div className="flex items-baseline gap-1">\
                                          <span className="text-sm font-black text-slate-800">{calculations.pesoMedioBag.toLocaleString('\''pt-BR'\'', { maximumFractionDigits: 0 })}</span>\
                                          <span className="text-[10px] font-bold text-slate-600">kg/bag</span>\
                                       </div>\
                                    </div>\
                                 </div>\
                                 <div className="w-full bg-slate-200 rounded-full h-2 mt-auto">\
                                    <div className="bg-[#0052cc] h-2 rounded-full" style={{ width: `${calculations.pctEspecialTrigo}%` }}></div>\
                                 </div>\
                              </div>\
                           )}\
                           {/* Comum */}\
                           {bagsComum > 0 && (\
                              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden relative shadow-sm flex flex-col p-4 pl-5">\
                                 <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#007a4d]"></div>\
                                 <div className="flex items-center gap-3 mb-4">\
                                    <div className="w-12 h-12 relative flex-shrink-0">\
                                       <img src={logoComumUrl || '\''https://i.ibb.co/r2PbxJbz/image.png'\''} alt="Comum" className="w-full h-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />\
                                    </div>\
                                    <h4 className="text-sm font-black text-[#007a4d] uppercase tracking-widest">Farinha Comum</h4>\
                                 </div>\
                                 <div className="flex flex-col items-center mb-1">\
                                    <div className="flex items-baseline gap-1">\
                                       <span className="text-4xl font-black text-[#007a4d] tracking-tight">{calculations.kgComum.toLocaleString('\''pt-BR'\'', { maximumFractionDigits: 0 })}</span>\
                                       <span className="text-lg font-black text-[#007a4d]">kg</span>\
                                    </div>\
                                    <span className="text-sm font-bold text-slate-700">{calculations.pctComumTrigo.toFixed(2)}% do trigo</span>\
                                 </div>\
                                 <hr className="border-slate-200 my-4 w-full" />\
                                 <div className="flex items-center justify-between mb-4 px-2">\
                                    <div className="flex items-center gap-2">\
                                       <Calendar className="w-5 h-5 text-slate-600" />\
                                       <div className="flex items-baseline gap-1">\
                                          <span className="text-lg font-black text-slate-800">{bagsComum}</span>\
                                          <span className="text-xs font-bold text-slate-700">BAGS</span>\
                                       </div>\
                                    </div>\
                                    <div className="flex flex-col items-end">\
                                       <span className="text-[9px] font-black text-[#007a4d] uppercase tracking-widest mb-0.5">Peso Médio</span>\
                                       <div className="flex items-baseline gap-1">\
                                          <span className="text-sm font-black text-slate-800">{calculations.pesoMedioBag.toLocaleString('\''pt-BR'\'', { maximumFractionDigits: 0 })}</span>\
                                          <span className="text-[10px] font-bold text-slate-600">kg/bag</span>\
                                       </div>\
                                    </div>\
                                 </div>\
                                 <div className="w-full bg-slate-200 rounded-full h-2 mt-auto">\
                                    <div className="bg-[#007a4d] h-2 rounded-full" style={{ width: `${calculations.pctComumTrigo}%` }}></div>\
                                 </div>\
                              </div>\
                           )}\
                           {/* Inteira */}\
                           {bagsInteira > 0 && (\
                              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden relative shadow-sm flex flex-col p-4 pl-5">\
                                 <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#cc0000]"></div>\
                                 <div className="flex items-center gap-3 mb-4">\
                                    <div className="w-12 h-12 relative flex-shrink-0">\
                                       <img src={logoInteiraUrl || '\''https://i.ibb.co/Xn0XLJM/image.png'\''} alt="Inteira" className="w-full h-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />\
                                    </div>\
                                    <h4 className="text-sm font-black text-[#cc0000] uppercase tracking-widest">Farinha Inteira</h4>\
                                 </div>\
                                 <div className="flex flex-col items-center mb-1">\
                                    <div className="flex items-baseline gap-1">\
                                       <span className="text-4xl font-black text-[#cc0000] tracking-tight">{calculations.kgInteira.toLocaleString('\''pt-BR'\'', { maximumFractionDigits: 0 })}</span>\
                                       <span className="text-lg font-black text-[#cc0000]">kg</span>\
                                    </div>\
                                    <span className="text-sm font-bold text-slate-700">{calculations.pctInteiraTrigo.toFixed(2)}% do trigo</span>\
                                 </div>\
                                 <hr className="border-slate-200 my-4 w-full" />\
                                 <div className="flex items-center justify-between mb-4 px-2">\
                                    <div className="flex items-center gap-2">\
                                       <Calendar className="w-5 h-5 text-slate-600" />\
                                       <div className="flex items-baseline gap-1">\
                                          <span className="text-lg font-black text-slate-800">{bagsInteira}</span>\
                                          <span className="text-xs font-bold text-slate-700">BAGS</span>\
                                       </div>\
                                    </div>\
                                    <div className="flex flex-col items-end">\
                                       <span className="text-[9px] font-black text-[#cc0000] uppercase tracking-widest mb-0.5">Peso Médio</span>\
                                       <div className="flex items-baseline gap-1">\
                                          <span className="text-sm font-black text-slate-800">{calculations.pesoMedioBag.toLocaleString('\''pt-BR'\'', { maximumFractionDigits: 0 })}</span>\
                                          <span className="text-[10px] font-bold text-slate-600">kg/bag</span>\
                                       </div>\
                                    </div>\
                                 </div>\
                                 <div className="w-full bg-slate-200 rounded-full h-2 mt-auto">\
                                    <div className="bg-[#cc0000] h-2 rounded-full" style={{ width: `${calculations.pctInteiraTrigo}%` }}></div>\
                                 </div>\
                              </div>\
                           )}\
                           {/* Cola */}\
                           {bagsCola > 0 && (\
                              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden relative shadow-sm flex flex-col p-4 pl-5">\
                                 <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#475569]"></div>\
                                 <div className="flex items-center gap-3 mb-4">\
                                    <div className="w-12 h-12 relative flex-shrink-0">\
                                       <img src={logoColaUrl || '\''https://i.ibb.co/8LDzkhh8/image.png'\''} alt="Cola" className="w-full h-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />\
                                    </div>\
                                    <h4 className="text-sm font-black text-[#475569] uppercase tracking-widest">Farinha Cola</h4>\
                                 </div>\
                                 <div className="flex flex-col items-center mb-1">\
                                    <div className="flex items-baseline gap-1">\
                                       <span className="text-4xl font-black text-[#475569] tracking-tight">{calculations.kgCola.toLocaleString('\''pt-BR'\'', { maximumFractionDigits: 0 })}</span>\
                                       <span className="text-lg font-black text-[#475569]">kg</span>\
                                    </div>\
                                    <span className="text-sm font-bold text-slate-700">{calculations.pctColaTrigo.toFixed(2)}% do trigo</span>\
                                 </div>\
                                 <hr className="border-slate-200 my-4 w-full" />\
                                 <div className="flex items-center justify-between mb-4 px-2">\
                                    <div className="flex items-center gap-2">\
                                       <Calendar className="w-5 h-5 text-slate-600" />\
                                       <div className="flex items-baseline gap-1">\
                                          <span className="text-lg font-black text-slate-800">{bagsCola}</span>\
                                          <span className="text-xs font-bold text-slate-700">BAGS</span>\
                                       </div>\
                                    </div>\
                                    <div className="flex flex-col items-end">\
                                       <span className="text-[9px] font-black text-[#475569] uppercase tracking-widest mb-0.5">Peso Médio</span>\
                                       <div className="flex items-baseline gap-1">\
                                          <span className="text-sm font-black text-slate-800">{calculations.pesoMedioBag.toLocaleString('\''pt-BR'\'', { maximumFractionDigits: 0 })}</span>\
                                          <span className="text-[10px] font-bold text-slate-600">kg/bag</span>\
                                       </div>\
                                    </div>\
                                 </div>\
                                 <div className="w-full bg-slate-200 rounded-full h-2 mt-auto">\
                                    <div className="bg-[#475569] h-2 rounded-full" style={{ width: `${calculations.pctColaTrigo}%` }}></div>\
                                 </div>\
                              </div>\
                           )}\
                           {/* Farelo */}\
                           {subproductTotal > 0 && (\
                              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden relative shadow-sm flex flex-col p-4 pl-5">\
                                 <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#ea580c]"></div>\
                                 <div className="flex items-center gap-3 mb-4">\
                                    <div className="w-12 h-12 relative flex-shrink-0">\
                                       <img src={logoFareloUrl || '\''https://i.ibb.co/chcGNGq8/image.png'\''} alt="Farelo" className="w-full h-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />\
                                    </div>\
                                    <h4 className="text-sm font-black text-[#ea580c] uppercase tracking-widest">Farelo (Subproduto)</h4>\
                                 </div>\
                                 <div className="flex flex-col items-center mb-1">\
                                    <div className="flex items-baseline gap-1">\
                                       <span className="text-4xl font-black text-[#ea580c] tracking-tight">{subproductTotal.toLocaleString('\''pt-BR'\'', { maximumFractionDigits: 0 })}</span>\
                                       <span className="text-lg font-black text-[#ea580c]">kg</span>\
                                    </div>\
                                    <span className="text-sm font-bold text-slate-700">{calculations.pctFareloTrigo.toFixed(2)}% do trigo</span>\
                                 </div>\
                                 <hr className="border-slate-200 my-4 w-full" />\
                                 <div className="flex items-center justify-between mb-4 px-2">\
                                    <div className="flex items-center gap-2">\
                                       <span className="text-xs font-medium text-slate-400 italic">Não se aplica bags</span>\
                                    </div>\
                                    <div className="flex flex-col items-end">\
                                       <span className="text-[9px] font-black text-[#ea580c] uppercase tracking-widest mb-0.5">% da Produção</span>\
                                       <div className="flex items-baseline gap-1">\
                                          <span className="text-sm font-black text-slate-800">{calculations.pctFareloTotal.toFixed(2)}</span>\
                                          <span className="text-[10px] font-bold text-slate-600">%</span>\
                                       </div>\
                                    </div>\
                                 </div>\
                                 <div className="w-full bg-slate-200 rounded-full h-2 mt-auto">\
                                    <div className="bg-[#ea580c] h-2 rounded-full" style={{ width: `${calculations.pctFareloTrigo}%` }}></div>\
                                 </div>\
                              </div>\
                           )}\
                        </div>' components/ProductionReportView.tsx
