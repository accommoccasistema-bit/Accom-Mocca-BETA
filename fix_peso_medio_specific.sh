# Fix Comum
sed -i '/{bagsComum > 0 && (/,/bg-\[#007a4d\] h-2/ s/{bagsEspecial > 0 ? (calculations.kgEspecial \/ bagsEspecial).toLocaleString('\''pt-BR'\'', { maximumFractionDigits: 0 }) : '\''-'\''}/{bagsComum > 0 ? (calculations.kgComum \/ bagsComum).toLocaleString('\''pt-BR'\'', { maximumFractionDigits: 0 }) : '\''-'\''}/g' components/ProductionReportView.tsx

# Fix Inteira
sed -i '/{bagsInteira > 0 && (/,/bg-\[#cc0000\] h-2/ s/{bagsEspecial > 0 ? (calculations.kgEspecial \/ bagsEspecial).toLocaleString('\''pt-BR'\'', { maximumFractionDigits: 0 }) : '\''-'\''}/{bagsInteira > 0 ? (calculations.kgInteira \/ bagsInteira).toLocaleString('\''pt-BR'\'', { maximumFractionDigits: 0 }) : '\''-'\''}/g' components/ProductionReportView.tsx

# Fix Cola
sed -i '/{bagsCola > 0 && (/,/bg-\[#475569\] h-2/ s/{bagsEspecial > 0 ? (calculations.kgEspecial \/ bagsEspecial).toLocaleString('\''pt-BR'\'', { maximumFractionDigits: 0 }) : '\''-'\''}/{bagsCola > 0 ? (calculations.kgCola \/ bagsCola).toLocaleString('\''pt-BR'\'', { maximumFractionDigits: 0 }) : '\''-'\''}/g' components/ProductionReportView.tsx
