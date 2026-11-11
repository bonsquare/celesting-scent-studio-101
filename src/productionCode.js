const PREFIX='P-';
const numberOf=value=>{const match=/^P-(\d+)$/i.exec(String(value||'').trim());return match?Number(match[1]):0};
export const formatProductionCode=value=>`${PREFIX}${String(Math.max(1,Math.floor(Number(value)||1))).padStart(4,'0')}`;
export const nextProductionCode=productions=>formatProductionCode((productions||[]).reduce((max,row)=>Math.max(max,numberOf(row.code||row.productionCode)),0)+1);
export function withProductionCodes(productions){let counter=(productions||[]).reduce((max,row)=>Math.max(max,numberOf(row.code||row.productionCode)),0);const seen=new Set();return (productions||[]).map(row=>{const current=String(row.code||row.productionCode||'').toUpperCase();if(numberOf(current)&&!seen.has(current)){seen.add(current);return {...row,code:current,productionCode:current}}counter+=1;const code=formatProductionCode(counter);return {...row,code,productionCode:code}})}
