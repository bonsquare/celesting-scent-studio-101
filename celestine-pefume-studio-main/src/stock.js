import {uid,num,materialUnit,materialRate,materialCategories} from './logic';

export const supplyCategories=['Bottle','Sticker / Label','Box','Cap / Sprayer','Other'];
// Order of the sub-headings inside the Liquid and Non-liquid sections.
export const subgroupOrder=[...materialCategories.filter(c=>c!=='Other'),'Other materials',...supplyCategories.filter(c=>c!=='Other'),'Other supplies'];
export const maxStockLog=500;

const round=(value,places=6)=>Math.round(num(value)*10**places)/10**places;
const listKeyOf=kind=>kind==='supply'?'supplies':'ingredients';
export const unitOf=(kind,item)=>kind==='supply'?'PCS':materialUnit(item);
export const isLow=item=>num(item.stockQuantity)<=num(item.reorderLevel);

// One flat list of everything in stock: raw materials plus bottles, stickers and other supplies.
export function stockRows(data){
  const materials=(data.ingredients||[]).map(item=>({kind:'material',id:item.id,name:item.name,group:materialUnit(item)==='mL'?'liquid':'solid',subgroup:item.category&&item.category!=='Other'?item.category:'Other materials',category:item.category||'Other',detail:[item.make,item.supplier].filter(Boolean).join(' · ')||item.category||'',unit:materialUnit(item),stock:num(item.stockQuantity),reorder:num(item.reorderLevel),value:num(item.stockQuantity)*materialRate(item),low:isLow(item),item}));
  const supplies=(data.supplies||[]).map(item=>({kind:'supply',id:item.id,name:item.name,group:'solid',subgroup:item.category&&item.category!=='Other'?item.category:'Other supplies',category:item.category||'Other',detail:item.category||'Other',unit:'PCS',stock:num(item.stockQuantity),reorder:num(item.reorderLevel),value:num(item.stockQuantity)*num(item.unitCost),low:isLow(item),item}));
  return [...materials,...supplies];
}

// Change one item's stock and record the movement. Stock never goes below zero.
function applyStock(data,kind,id,change,{reason,note='',now=new Date().toISOString()}={}){
  const key=listKeyOf(kind),item=(data[key]||[]).find(x=>x.id===id);
  if(!item||!Number.isFinite(change)||change===0)return data;
  const before=num(item.stockQuantity),after=Math.max(0,round(before+change));
  if(after===before)return data;
  const entry={id:uid(),date:now,kind,itemId:id,name:item.name,unit:unitOf(kind,item),change:round(after-before),balance:after,reason,note:String(note||'').trim()};
  return {...data,[key]:data[key].map(x=>x.id===id?{...x,stockQuantity:after}:x),stockLog:[...(data.stockLog||[]),entry].slice(-maxStockLog)};
}

export const addStock=(data,kind,id,quantity,note,now)=>num(quantity)>0?applyStock(data,kind,id,num(quantity),{reason:'Added',note,now}):data;

// Replace the on-hand quantity with a physical count.
export function setStockCount(data,kind,id,counted,note,now){
  const item=(data[listKeyOf(kind)]||[]).find(x=>x.id===id);
  if(!item||counted===''||counted==null||!Number.isFinite(Number(counted))||num(counted)<0)return data;
  return applyStock(data,kind,id,num(counted)-num(item.stockQuantity),{reason:'Counted',note,now});
}

export const newSupply=fields=>({id:fields.id||uid(),name:String(fields.name||'').trim(),category:String(fields.category||'').trim().replace(/\s+/g,' ').slice(0,40)||'Other',stockQuantity:0,reorderLevel:Math.max(0,num(fields.reorderLevel)),unitCost:Math.max(0,num(fields.unitCost)),usedPerBottle:Math.max(0,num(fields.usedPerBottle))});

export function addSupply(data,fields,openingStock,now){
  const supply=newSupply(fields),next={...data,supplies:[...(data.supplies||[]),supply]};
  return num(openingStock)>0?applyStock(next,'supply',supply.id,num(openingStock),{reason:'Opening',now}):next;
}
export const updateSupply=(data,id,fields)=>({...data,supplies:(data.supplies||[]).map(x=>x.id===id?{...newSupply({...x,...fields,id}),stockQuantity:x.stockQuantity}:x)});
export const removeSupply=(data,id)=>({...data,supplies:(data.supplies||[]).filter(x=>x.id!==id)});

// Movement entries for items whose stock changed between two lists (used when a batch deducts materials).
export function stockDiffEntries(before,after,kind,reason,note='',now=new Date().toISOString()){
  const previous=new Map((before||[]).map(x=>[x.id,x]));
  return (after||[]).flatMap(item=>{
    const old=previous.get(item.id);
    if(!old)return [];
    const change=round(num(item.stockQuantity)-num(old.stockQuantity));
    return change?[{id:uid(),date:now,kind,itemId:item.id,name:item.name,unit:unitOf(kind,item),change,balance:num(item.stockQuantity),reason,note}]:[];
  });
}

// When a batch completes, take bottles x "used per bottle" from each supply. Never blocks; reports what ran short.
export function deductSuppliesForBatch(data,bottles,note='',now){
  const short=[];
  let next=data;
  for(const supply of data.supplies||[]){
    const used=round(num(bottles)*num(supply.usedPerBottle));
    if(used<=0)continue;
    if(num(supply.stockQuantity)<used)short.push(supply.name);
    next=applyStock(next,'supply',supply.id,-used,{reason:'Batch',note,now});
  }
  return {data:next,short};
}

export const stockForm=row=>row.group==='liquid'?'Liquid':'Non-liquid';

export const stockSummary=rows=>({items:rows.length,low:rows.filter(row=>row.low).length,value:rows.reduce((sum,row)=>sum+row.value,0)});
