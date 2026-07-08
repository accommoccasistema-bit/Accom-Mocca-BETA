const fs = require('fs');
const filePath = 'src/apps/mobile/AppMobile.tsx';
let txt = fs.readFileSync(filePath, 'utf8');

// 1. Remove handleShareDirectPNG
const shareStartStr = `  const handleShareDirectPNG = async () => {`;
const shareEndStr = "setIsSharing(false);\n    }\n  };\n";
if (txt.includes(shareStartStr)) {
  const startIdx = txt.indexOf(shareStartStr);
  let endIdx = txt.indexOf(shareEndStr, startIdx);
  if (endIdx !== -1) {
    endIdx += shareEndStr.length;
    txt = txt.substring(0, startIdx) + txt.substring(endIdx);
  } else {
    console.log("Could not find end of share");
  }
} else {
  console.log("Could not find start of share");
}

// 2. Remove the "Compartilhar Extração" button
const btnShareStartStr = `                <button \n                  onClick={handleShareDirectPNG}`;
const btnShareEndStr = `                </button>\n              </div>`;
if (txt.includes(btnShareStartStr)) {
  const startIdx = txt.indexOf(btnShareStartStr);
  const endIdx = txt.indexOf(btnShareEndStr, startIdx) + `                </button>\n`.length;
  txt = txt.substring(0, startIdx) + txt.substring(endIdx);
} else {
  console.log("Could not find button");
}

// 3. Remove "const [isSharing, setIsSharing] = useState(false);"
txt = txt.replace("const [isSharing, setIsSharing] = useState(false);\n", "");

// 4. Remove html2canvas import if exists
txt = txt.replace(/import html2canvas from 'html2canvas';\n?/g, "");

// 5. Remove the "EXTRAÇÃO REAL DE FARINHAS" hero element
const heroStartStr = `                {/* Main Extraction Hero */}\n                <div className="bg-slate-900 rounded-none p-8 text-center relative overflow-hidden border border-slate-800 shadow-2xl">`;
const heroEndStr = `              {/* Analytics Section - High Performance Design */}\n              <div className="bg-white rounded-none p-8 shadow-sm border border-slate-100 space-y-8">`;
if (txt.includes(heroStartStr)) {
  const startIdx = txt.indexOf(heroStartStr);
  const endIdx = txt.indexOf(heroEndStr, startIdx);
  txt = txt.substring(0, startIdx) + txt.substring(endIdx);
} else {
  console.log("Could not find hero");
}

// 6. Remove the Detailed Breakdown below pie chart
const breakdownStartStr = `                {/* Elegant Legend Grid */}\n                <div className="grid grid-cols-2 gap-y-4 gap-x-6 border-t border-slate-50 pt-8">`;
const breakdownEndStr = `                </div>\n              </div>\n\n              {/* Detailed Breakdown */}`;
if (txt.includes(breakdownStartStr)) {
  const startIdx = txt.indexOf(breakdownStartStr);
  const endIdx = txt.indexOf(breakdownEndStr, startIdx);
  txt = txt.substring(0, startIdx) + txt.substring(endIdx);
} else {
  console.log("Could not find legend");
}

fs.writeFileSync(filePath, txt, 'utf8');
console.log("Success");
