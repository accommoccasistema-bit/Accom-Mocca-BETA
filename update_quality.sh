sed -i '339,364c\
  // Quality metrics based strictly on active loads\
  const qualityCalculations = useMemo(() => {\
    const activeFlourIds = new Set(activeMovements.filter(m => m.category === '"'SAÍDA'"' && m.originalType !== '"'SUBPRODUCT'"').map(m => m.rawId));\
    const activeBatchLoads = currentBatchLoads.filter(l => activeFlourIds.has(l.id));\
\
    const loadsWithHumidity = activeBatchLoads.filter(\
      l => l.humidity !== undefined && l.humidity !== null && !isNaN(l.humidity) && l.humidity > 0 && l.type !== '"'CL'"'\
    );\
    const avgHumidity = loadsWithHumidity.length > 0\
      ? loadsWithHumidity.reduce((sum, l) => sum + (l.humidity || 0), 0) / loadsWithHumidity.length\
      : null;\
\
    const loadsWithColor = activeBatchLoads.filter(l => {\
      if (!l.color) return false;\
      if (l.type === '"'CL'"') return false;\
      const val = parseFloat(l.color.replace('\'','\'', '\''.\''));\
      return !isNaN(val) && val > 0;\
    });\
    const avgColor = loadsWithColor.length > 0\
      ? loadsWithColor.reduce((sum, l) => sum + parseFloat((l.color || '\'\''').replace('\'','\'', '\''.\'')), 0) / loadsWithColor.length\
      : null;\
\
    const getAvgForType = (type: string) => {\
      const typeLoads = activeBatchLoads.filter(l => l.type === type);\
      const loadsWithHum = typeLoads.filter(\
        l => l.humidity !== undefined && l.humidity !== null && !isNaN(l.humidity) && l.humidity > 0\
      );\
      const avgHum = loadsWithHum.length > 0\
        ? loadsWithHum.reduce((sum, l) => sum + (l.humidity || 0), 0) / loadsWithHum.length\
        : null;\
\
      const loadsWithCol = typeLoads.filter(l => {\
        if (!l.color) return false;\
        const val = parseFloat(l.color.replace('\'','\'', '\''.\''));\
        return !isNaN(val) && val > 0;\
      });\
      const avgCol = loadsWithCol.length > 0\
        ? loadsWithCol.reduce((sum, l) => sum + parseFloat((l.color || '\'\''').replace('\'','\'', '\''.\'')), 0) / loadsWithCol.length\
        : null;\
\
      return { avgHumidity: avgHum, avgColor: avgCol };\
    };\
\
    return {\
      avgHumidity,\
      avgColor,\
      especial: getAvgForType('"'E'"'),\
      comum: getAvgForType('"'C'"'),\
      inteira: getAvgForType('"'I'"'),\
      cola: getAvgForType('"'CL'"'),\
    };\
  }, [currentBatchLoads, activeMovements]);' components/ProductionReportView.tsx
