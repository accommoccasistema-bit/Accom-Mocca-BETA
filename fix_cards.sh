sed -i 's/p-6 relative overflow-hidden flex justify-center items-center border-2 border-slate-300 flex-col gap-3/p-4 relative overflow-hidden flex justify-center items-center border-2 border-slate-300 flex-col gap-1.5/g' components/ProductionReportView.tsx
sed -i 's/<Wheat className="w-6 h-6 text-amber-500 mb-2" \/>/<Wheat className="w-5 h-5 text-amber-500 mb-1" \/>/g' components/ProductionReportView.tsx
sed -i 's/<Factory className="w-6 h-6 text-\[#5C3A21\] mb-2" \/>/<Factory className="w-5 h-5 text-\[#5C3A21\] mb-1" \/>/g' components/ProductionReportView.tsx
sed -i 's/<ShoppingBag className="w-6 h-6 text-sky-500 mb-2" \/>/<ShoppingBag className="w-5 h-5 text-sky-500 mb-1" \/>/g' components/ProductionReportView.tsx
sed -i 's/text-3xl font-black text-slate-900 tracking-tight/text-2xl font-black text-slate-900 tracking-tight/g' components/ProductionReportView.tsx
