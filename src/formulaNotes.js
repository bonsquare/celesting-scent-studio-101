import {uid,num} from './logic';

export const formulaStatuses=['Draft','Testing','Approved','Retired'];
export const scentFamilies=['Floral','Fruity','Citrus','Woody','Oriental / Amber','Gourmand','Fresh / Aquatic','Musky','Green','Spicy'];
export const maxVersions=25;

export const formulaStatus=formula=>formulaStatuses.includes(formula?.status)?formula.status:'Draft';

const rowsOf=formula=>(formula?.ingredients||[]).map(row=>({materialId:row.materialId||'',name:row.name||'',percentage:num(row.percentage)}));
const rowKey=row=>row.materialId||row.name;
const round=(value,places)=>Math.round(num(value)*10**places)/10**places;

// Recipe fingerprint: ingredient percentages and target only. Notes, status and trials do not create a version.
export function formulaFingerprint(formula){
  const rows=rowsOf(formula).map(row=>[rowKey(row),round(row.percentage,4)]).sort((a,b)=>String(a[0]).localeCompare(String(b[0])));
  return JSON.stringify({rows,basis:formula?.targetBasis||'',unit:formula?.targetUnit||'',amount:round(formula?.targetAmount,4)});
}
export const formulaChanged=(previous,next)=>formulaFingerprint(previous)!==formulaFingerprint(next);

export function versionSnapshot(formula,now=new Date().toISOString()){
  return {id:uid(),savedAt:formula.updatedAt||now,archivedAt:now,name:formula.name||'',targetBasis:formula.targetBasis||'',targetUnit:formula.targetUnit||'mL',targetAmount:num(formula.targetAmount),oilPercentage:num(formula.concentration),rows:rowsOf(formula)};
}
export const appendVersion=(versions,previous,now)=>[...(versions||[]),versionSnapshot(previous,now)].slice(-maxVersions);

// Compare two lists of {materialId,name,percentage}. Returns one entry per material.
export function diffRows(from,to){
  const before=new Map((from||[]).map(row=>[rowKey(row),row])),after=new Map((to||[]).map(row=>[rowKey(row),row]));
  const keys=[...new Set([...before.keys(),...after.keys()])];
  return keys.map(key=>{
    const a=before.get(key),b=after.get(key),name=(b||a).name||key;
    if(!a)return {name,from:null,to:num(b.percentage),delta:num(b.percentage),kind:'added'};
    if(!b)return {name,from:num(a.percentage),to:null,delta:-num(a.percentage),kind:'removed'};
    const delta=round(num(b.percentage)-num(a.percentage),4);
    return {name,from:num(a.percentage),to:num(b.percentage),delta,kind:delta===0?'same':'changed'};
  }).sort((a,b)=>({changed:0,added:1,removed:2,same:3}[a.kind]-{changed:0,added:1,removed:2,same:3}[b.kind])||a.name.localeCompare(b.name));
}
export const currentRows=formula=>rowsOf(formula);

export function newTrial({rating,note,date}={}){
  const stars=Math.min(5,Math.max(0,Math.round(num(rating))));
  return {id:uid(),date:date||new Date().toISOString().slice(0,10),rating:stars,note:String(note||'').trim()};
}
