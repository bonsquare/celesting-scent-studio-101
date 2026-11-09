// A short, readable Formula ID such as F-0001. It is separate from the internal id, never changes,
// and lets two formulas share the same scent name but still be told apart.

const PREFIX='F-';
const pattern=/^F-(\d+)$/i;

export const formatFormulaCode=number=>`${PREFIX}${String(Math.max(1,Math.floor(Number(number)||1))).padStart(4,'0')}`;

const numberOf=code=>{const match=pattern.exec(String(code||'').trim());return match?Number(match[1]):0};

// The next unused ID.
export const nextFormulaCode=formulas=>formatFormulaCode((formulas||[]).reduce((max,formula)=>Math.max(max,numberOf(formula.code)),0)+1);

// Give every formula an ID. Formulas that already have a unique one keep it; the rest are numbered in list order.
export function withFormulaCodes(formulas){
  const list=formulas||[],seen=new Set();
  const kept=list.map(formula=>{
    const code=String(formula.code||'').trim().toUpperCase();
    if(numberOf(code)&&!seen.has(code)){seen.add(code);return code}
    return '';
  });
  let counter=kept.reduce((max,code)=>Math.max(max,numberOf(code)),0);
  return list.map((formula,index)=>{
    if(kept[index]){return formula.code===kept[index]?formula:{...formula,code:kept[index]}}
    counter+=1;
    return {...formula,code:formatFormulaCode(counter)};
  });
}

// "Nov 5, 2026 @ 3:36 PM"
export function formatStamp(value){
  const date=new Date(value);
  if(!value||Number.isNaN(date.getTime()))return '';
  const day=date.toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'});
  const time=date.toLocaleTimeString('en-PH',{hour:'numeric',minute:'2-digit',hour12:true}).replace(/\s?(am|pm)$/i,(match,part)=>` ${part.toUpperCase()}`);
  return `${day} @ ${time}`;
}
