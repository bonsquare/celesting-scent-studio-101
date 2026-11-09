import {num,materialUnit,materialRate,unitLabel} from './logic';
import {stockForm,stockRows} from './stock';

// Quote a value for CSV. Also neutralises spreadsheet formulas (=, +, -, @) so opened files cannot run them.
export const csvCell=value=>{
  let text=value==null?'':String(value);
  if(/^[=+\-@\t\r]/.test(text)&&!/^-?\d+(\.\d+)?$/.test(text))text=`'${text}`;
  return /[",\n\r]/.test(text)?`"${text.replaceAll('"','""')}"`:text;
};

export const toCsv=(headers,rows)=>[headers,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n');

const round=(value,places=2)=>Number(num(value).toFixed(places));

export const materialsCsv=data=>toCsv(
  ['Name','Category','Make','Supplier','Purchase quantity','Unit','Purchase price','Cost per unit','Density (g/mL)','Stock on hand','Low-stock level','Scent name','Inspired by'],
  (data.ingredients||[]).map(item=>[item.name,item.category,item.make,item.supplier,num(item.contentQuantity),unitLabel(materialUnit(item)),num(item.purchasePrice),round(materialRate(item),6),num(item.density),num(item.stockQuantity),num(item.reorderLevel),item.scentName,item.inspiredBy])
);

export const batchesCsv=data=>toCsv(
  ['Batch number','Name','Date','Status','Matures','Bottles','Expected yield (ML)','Actual yield (ML)','Production cost','Cost per bottle','Projected gross profit','Inventory deducted'],
  (data.batches||[]).map(batch=>[batch.batchNumber,batch.name,batch.date,batch.status||'Planned',batch.maturationDate,num(batch.bottles),round(batch.expectedYield,1),round(batch.actualYield??batch.expectedYield,1),round(batch.productionCost),round(batch.costPerBottle),round(batch.projectedGrossProfit),batch.inventoryDeducted?'Yes':'No'])
);

export const formulasCsv=data=>toCsv(
  ['Formula ID','Formula','Scent name','Inspired by','Ingredient','Percentage','Updated'],
  (data.formulas||[]).flatMap(formula=>(formula.ingredients||[]).map(row=>{
    const material=(data.ingredients||[]).find(item=>item.id===row.materialId);
    return [formula.code,formula.name,formula.scentName,formula.inspiredBy,material?.name||row.name,num(row.percentage),formula.updatedAt?String(formula.updatedAt).slice(0,10):''];
  }))
);

export const inventoryCsv=data=>toCsv(
  ['Type','Form','Name','Category','Details','Stock on hand','Unit','Low-stock level','Status','Stock value'],
  stockRows(data).map(row=>[row.kind==='material'?'Raw material':'Supply',stockForm(row),row.name,row.category,row.detail,round(row.stock,4),unitLabel(row.unit),round(row.reorder,4),row.low?'Low stock':'In stock',round(row.value)])
);

export const todayStamp=()=>new Date().toISOString().slice(0,10);

// Download text as a UTF-8 CSV (BOM so Excel shows the peso sign and accents correctly).
export function downloadCsv(filename,text){
  const blob=new Blob(['﻿',text],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;link.download=filename;
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
