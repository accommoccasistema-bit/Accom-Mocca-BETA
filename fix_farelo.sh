sed -i '/{subproductTotal > 0 && (/,/<\/div>/ {
  /<div className="flex items-center justify-between mb-4 px-2 pt-2 border-t border-slate-100">/,/<\/div>\n                                    <\/div>\n                                 <\/div>/ d
}' components/ProductionReportView.tsx
