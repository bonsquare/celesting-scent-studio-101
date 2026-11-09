import {uid,num,materialRate,calculate,unitLabel} from './logic';

export const emptyFormulaDraft=()=>({id:uid(),name:'',targetAmount:120,targetUnit:'mL',targetBasis:'oil',materials:[],markup:100,margin:50,fees:0,pricingMethod:'markup'});

export function draftFromFormula(formula,data){
  const current=calculate(formula,data),unit=formula.targetUnit==='g'?'g':'mL';
  let materials;
  if(formula.materials?.length){
    const oil=formula.materials.filter(row=>row.role==='oil'),other=formula.materials.filter(row=>row.role!=='oil');
    const oilParts=oil.reduce((sum,row)=>sum+num(row.parts),0),otherParts=other.reduce((sum,row)=>sum+num(row.parts),0),concentration=num(formula.concentration);
    materials=formula.materials.map(row=>({...row,percentage:row.percentage!==undefined?row.percentage:row.role==='oil'?(oilParts?num(row.parts)/oilParts*concentration:0):(otherParts?num(row.parts)/otherParts*(100-concentration):0)}));
  }else materials=(formula.ingredients||[]).map(row=>({id:row.id||uid(),materialId:row.materialId||'',role:(data.ingredients||[]).find(m=>m.id===row.materialId)?.category==='Fragrance Oil'?'oil':'other',percentage:num(row.percentage)}));
  const total=unit==='g'?current.grams:current.volume;
  const targetBasis=formula.targetBasis==='oil'?'oil':'output';
  const targetAmount=targetBasis==='output'&&unit==='g'?current.volume:formula.targetAmount??total;
  return {...formula,targetUnit:unit,targetBasis,targetAmount,materials};
}

export function calculateFormulaDraft(draft,data){
  const errors=[];
  const selected=(draft.materials||[]).map(row=>({...row,material:(data.ingredients||[]).find(item=>item.id===row.materialId),percentage:num(row.percentage)}));
  const percentage=selected.reduce((sum,row)=>sum+row.percentage,0),oilPercentage=selected.filter(row=>row.role==='oil').reduce((sum,row)=>sum+row.percentage,0);
  const unit=draft.targetUnit==='g'?'g':'mL',basis=draft.targetBasis==='oil'?'oil':'output',target=num(draft.targetAmount);
  if(!draft.name?.trim())errors.push('Enter a formula name.');
  if(!selected.length)errors.push('Add raw materials from the saved list.');
  if(!selected.some(row=>row.role==='oil'))errors.push('Add at least one fragrance oil.');
  if(selected.some(row=>!row.material))errors.push('Choose a saved raw material for every row.');
  if(selected.some(row=>row.percentage<0||row.percentage>100))errors.push('Each ingredient percentage must be between 0 and 100.');
  if(Math.abs(percentage-100)>.001)errors.push(`Ingredient percentages must total 100% (currently ${percentage.toFixed(2)}%).`);
  if(oilPercentage<=0)errors.push('Fragrance oil percentage must be greater than zero.');
  if(target<=0)errors.push(`${basis==='oil'?'Fragrance oil amount':'Target output'} must be greater than zero ${unitLabel(basis==='output'?'mL':unit)}.`);
  const averageDensity=selected.reduce((sum,row)=>sum+row.percentage/100*(num(row.material?.density)||1),0);
  const oilDensity=oilPercentage>0?selected.filter(row=>row.role==='oil').reduce((sum,row)=>sum+row.percentage/100*(num(row.material?.density)||1),0)/(oilPercentage/100):0;
  let volume=0;
  if(basis==='output')volume=target;
  else if(oilPercentage>0){const oilVolume=unit==='mL'?target:(oilDensity>0?target/oilDensity:0);volume=oilVolume/(oilPercentage/100)}
  if(!Number.isFinite(volume)||volume<0)volume=0;
  const totalDisplay=unit==='mL'?volume:volume*averageDensity,oilVolume=volume*oilPercentage/100,oilGrams=volume*selected.filter(row=>row.role==='oil').reduce((sum,row)=>sum+row.percentage/100*(num(row.material?.density)||1),0),oilDisplay=unit==='mL'?oilVolume:oilGrams;
  const formula={...draft,name:draft.name?.trim()||'',concentration:oilPercentage,bottleSize:volume,bottles:1,nominalVolume:volume,targetAmount:target,method:'percentage',ingredients:selected.map(row=>({id:row.id,materialId:row.materialId,name:row.material?.name||'',percentage:row.percentage,density:num(row.material?.density)||1,unitCost:row.material?materialRate(row.material):0})),updatedAt:new Date().toISOString()};
  const result=calculate(formula,data);
  const rowsDisplay=result.rows.map(row=>({...row,quantity:unit==='mL'?row.ml:row.grams}));
  return {errors,formula,result,unit,basis,percentage,oilPercentage,totalDisplay,outputMl:volume,oilDisplay,oilVolume,oilGrams,rowsDisplay};
}

export function snapshotFormulaCalculation(calculation){return {unit:calculation.unit,basis:calculation.basis,percentage:calculation.percentage,oilPercentage:calculation.oilPercentage,totalDisplay:calculation.totalDisplay,outputMl:calculation.outputMl,oilDisplay:calculation.oilDisplay,rowsDisplay:structuredClone(calculation.rowsDisplay),result:structuredClone(calculation.result),formula:{materials:structuredClone(calculation.formula.materials||[])},savedAt:new Date().toISOString()}}
