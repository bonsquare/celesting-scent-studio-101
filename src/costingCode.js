const PREFIX='C-';
const numberOf=value=>{const match=/^C-(\d+)$/i.exec(String(value||'').trim());return match?Number(match[1]):0};
export const formatCostingCode=value=>`${PREFIX}${String(Math.max(1,Math.floor(Number(value)||1))).padStart(4,'0')}`;
export const nextCostingCode=costings=>formatCostingCode((costings||[]).reduce((max,row)=>Math.max(max,numberOf(row.code||row.costingCode)),0)+1);
export function withCostingCodes(costings){let counter=(costings||[]).reduce((max,row)=>Math.max(max,numberOf(row.code||row.costingCode)),0);const seen=new Set();return (costings||[]).map(row=>{const current=String(row.code||row.costingCode||'').toUpperCase();if(numberOf(current)&&!seen.has(current)){seen.add(current);return {...row,code:current,costingCode:current}}counter+=1;const code=formatCostingCode(counter);return {...row,code,costingCode:code}})}
