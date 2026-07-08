# Fix Comum
sed -i '/{bagsComum > 0 && (/,/bg-\[#007a4d\] h-2/ s/qualityCalculations.especial/qualityCalculations.comum/g' components/ProductionReportView.tsx
sed -i '/{bagsComum > 0 && (/,/bg-\[#007a4d\] h-2/ s/text-\[#0052cc\]/text-\[#007a4d\]/g' components/ProductionReportView.tsx

# Fix Inteira
sed -i '/{bagsInteira > 0 && (/,/bg-\[#cc0000\] h-2/ s/qualityCalculations.especial/qualityCalculations.inteira/g' components/ProductionReportView.tsx
sed -i '/{bagsInteira > 0 && (/,/bg-\[#cc0000\] h-2/ s/text-\[#0052cc\]/text-\[#cc0000\]/g' components/ProductionReportView.tsx

# Fix Cola
sed -i '/{bagsCola > 0 && (/,/bg-\[#475569\] h-2/ s/qualityCalculations.especial/qualityCalculations.cola/g' components/ProductionReportView.tsx
sed -i '/{bagsCola > 0 && (/,/bg-\[#475569\] h-2/ s/text-\[#0052cc\]/text-\[#475569\]/g' components/ProductionReportView.tsx

# Fix Farelo (remove the color/humidity block from farelo)
sed -i '/{subproductTotal > 0 && (/,/<\/div>/ {
  /<div className="flex items-center justify-between mb-4 px-2 pt-2 border-t border-slate-100">/,/<\/div>\n                                    <\/div>\n                                 <\/div>/ d
}' components/ProductionReportView.tsx

