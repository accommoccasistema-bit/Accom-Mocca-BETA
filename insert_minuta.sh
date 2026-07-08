sed -i '/BAGS NA CARGA/{N;N;a\
                    {load.invoice && (\
                      <div className="flex flex-col border-b-2 border-slate-900 text-right">\
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">NOTA FISCAL</span>\
                        <span className="text-xs font-black leading-tight text-slate-900">{load.invoice}</span>\
                      </div>\
                    )}
}' components/FlourStockControl.tsx
