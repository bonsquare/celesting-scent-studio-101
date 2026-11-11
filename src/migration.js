import {uid,num} from './logic';
import {withProductionCodes} from './productionCode';
import {withCostingCodes} from './costingCode';

// Legacy batches are retained as production records. The formula snapshot is deliberately
// copied so later formula edits cannot rewrite production history.
export function migrateBatches(batches=[],formulas=[]){
  return withProductionCodes(batches.map(batch=>{
    const formula=formulas.find(item=>item.id===batch.formulaId);
    const code=batch.code||batch.productionCode;
    return {...batch,id:batch.id||uid(),code,productionCode:code,legacyBatchNumber:batch.legacyBatchNumber||batch.batchNumber||'',formulaSnapshot:batch.formulaSnapshot||structuredClone(batch.formula||formula||{}),targetBasis:batch.targetBasis||'output',targetAmount:batch.targetAmount??batch.expectedYield??batch.calculation?.volume??0,bottleSize:batch.bottleSize??batch.calculation?.bottleSize??0,bottles:batch.bottles??batch.calculation?.bottles??0,actualMaterialUsage:batch.actualMaterialUsage||batch.materialUsage||[],actualYield:num(batch.actualYield??batch.expectedYield??batch.calculation?.volume),status:batch.status||'Completed'};
  }));
}

export function normalizeCostings(costings=[]){return withCostingCodes(costings.map(costing=>({...costing,id:costing.id||uid(),productionId:costing.productionId||null,packaging:costing.packaging||[],createdAt:costing.createdAt||new Date().toISOString()})))}
