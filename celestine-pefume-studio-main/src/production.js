import {num} from './logic';

export const batchStatuses=['Planned','Mixing','Maceration','Maturing','Bottling','Completed','Cancelled'];
export const materialUsage=calculation=>(calculation?.rows||[]).map(row=>({materialId:row.materialId,name:row.name,unit:row.unit,quantity:row.unit==='g'?num(row.grams):num(row.ml)}));
export function inventoryShortages(ingredients,calculation){return materialUsage(calculation).map(usage=>{const material=ingredients.find(item=>item.id===usage.materialId),available=num(material?.stockQuantity);return {...usage,available,shortage:Math.max(0,usage.quantity-available)}}).filter(item=>item.shortage>1e-9)}
export function completeBatchInventory(ingredients,batch){if(batch.inventoryDeducted)return ingredients;const usage=materialUsage(batch.calculation);return ingredients.map(material=>{const consumed=usage.filter(item=>item.materialId===material.id).reduce((sum,item)=>sum+item.quantity,0);return consumed?{...material,stockQuantity:Math.max(0,num(material.stockQuantity)-consumed)}:material})}
const pad=value=>String(value).padStart(2,'0');
export const localDate=(date=new Date())=>`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
export const addDays=(iso,days)=>{const date=new Date(`${iso}T00:00:00`);date.setDate(date.getDate()+num(days));return localDate(date)};
export const daysBetween=(from,to)=>Math.round((new Date(`${to}T00:00:00`)-new Date(`${from}T00:00:00`))/864e5);

// The next free batch number for a day, so a deleted number is never reused by mistake and no ID repeats.
export function nextBatchNumber(batches,today=localDate()){
  const prefix=`B-${today.replaceAll('-','')}-`;
  const highest=batches.reduce((max,batch)=>String(batch.batchNumber||'').startsWith(prefix)?Math.max(max,parseInt(String(batch.batchNumber).slice(prefix.length),10)||0):max,0);
  return `${prefix}${String(highest+1).padStart(3,'0')}`;
}
// Raw material cost of one bottle: the materials in the formula only (no labor, overhead, or packaging).
export function rawMaterialPerBottle(batch){
  const calc=batch.calculation||{},volume=num(calc.volume),size=num(calc.bottleSize);
  if(volume>0&&size>0)return num(calc.ingredientCost)/volume*size;
  return num(calc.bottles)>0?num(calc.ingredientCost)/num(calc.bottles):0;
}
export const batchWastage=batch=>Math.max(0,num(batch.expectedYield)-num(batch.actualYield));
