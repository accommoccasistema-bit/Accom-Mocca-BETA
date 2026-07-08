sed -i '/<Wheat className="w-32 h-32 text-amber-500" \/>/i\
                              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500 z-20"></div>' components/ProductionReportView.tsx

sed -i '/<Factory className="w-32 h-32 text-\[#5C3A21\]" \/>/i\
                              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#5C3A21] z-20"></div>' components/ProductionReportView.tsx

sed -i '/<ShoppingBag className="w-32 h-32 text-sky-500" \/>/i\
                              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-sky-600 z-20"></div>' components/ProductionReportView.tsx
