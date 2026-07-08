sed -i '/<div className="flex gap-2 w-full">/i \
          {load.step === 6 && (\
             <div className="space-y-3">\
                <div className="relative">\
                   <input \
                     type="text" \
                     disabled={isProcessing} placeholder="DIGITE O Nº DA NOTA FISCAL" \
                     value={invoiceInput[load.id] || load.invoice || ""}\
                     onChange={e => setInvoiceInput({...invoiceInput, [load.id]: e.target.value})}\
                     className="w-full bg-white border-2 border-blue-100 p-5 rounded-[1.5rem] font-black text-center text-lg outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all disabled:opacity-50 shadow-sm"\
                   />\
                </div>\
             </div>\
          )}\
' components/FlourStockControl.tsx
