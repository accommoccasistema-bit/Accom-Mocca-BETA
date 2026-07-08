const fs = require('fs');
const f = 'components/ProductionReportView.tsx';
let txt = fs.readFileSync(f, 'utf8');
const start = txt.indexOf('groupedActiveMovements.map(');
const endObj = txt.indexOf('</tbody>', start);
const repl = `groupedActiveMovements.map((group, idx) => {
                                              return (
                                                 <tr key={idx} className="border-b border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-[#0f172a] font-mono text-[10px] whitespace-nowrap">
                                                       {data.lote}
                                                    </td>
                                                    <td className="px-6 py-4 font-black text-slate-900 uppercase text-[10px] tracking-wider leading-tight">
                                                       {group.category === 'ENTRADA' ? 'FORN: ' : 'CLI: '}{group.partner}
                                                    </td>
                                                    <td className="px-6 py-4 text-[10px] font-bold">
                                                       <span className={\`inline-block px-2 py-1 rounded border uppercase tracking-wider text-[9px] whitespace-nowrap \${group.category === 'ENTRADA' ? 'text-amber-800 bg-amber-50 border-amber-200' : 'text-slate-700 bg-slate-50 border-slate-200'}\`}>
                                                          {group.product}
                                                       </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-slate-700 font-mono text-[11px]">
                                                        {group.totalBags ? (
                                                           <div className="flex flex-col items-end gap-1">
                                                              <span>{group.totalBags.toLocaleString('pt-BR')} bags</span>
                                                              {group.category === 'SAÍDA' && (
                                                                 <div className="flex flex-col items-end mt-1">
                                                                    {group.bagsBreakdown.especial > 0 && <span className="text-[8px] text-slate-400 font-medium">ESP: {group.bagsBreakdown.especial.toLocaleString('pt-BR')}</span>}
                                                                    {group.bagsBreakdown.comum > 0 && <span className="text-[8px] text-slate-400 font-medium">COM: {group.bagsBreakdown.comum.toLocaleString('pt-BR')}</span>}
                                                                    {group.bagsBreakdown.inteira > 0 && <span className="text-[8px] text-slate-400 font-medium">INT: {group.bagsBreakdown.inteira.toLocaleString('pt-BR')}</span>}
                                                                    {group.bagsBreakdown.cola > 0 && <span className="text-[8px] text-slate-400 font-medium">COL: {group.bagsBreakdown.cola.toLocaleString('pt-BR')}</span>}
                                                                 </div>
                                                              )}
                                                           </div>
                                                        ) : <span className="text-slate-300">---</span>}
                                                     </td>
                                                     <td className="px-6 py-4 text-right font-black text-blue-600 font-mono text-[11px] whitespace-nowrap bg-blue-50/10">
                                                       {group.totalDistance ? \`\${Math.round(group.totalDistance).toLocaleString('pt-BR')} km\` : <span className="text-slate-300">---</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-black text-emerald-700 font-mono text-sm whitespace-nowrap bg-emerald-50/10">
                                                       {group.totalWeight.toLocaleString('pt-BR')} kg
                                                    </td>
                                                 </tr>
                                              );
                                           })
                                        )
                                      `;
fs.writeFileSync(f, txt.substring(0, start) + repl + "\n" + txt.substring(endObj), 'utf8');
