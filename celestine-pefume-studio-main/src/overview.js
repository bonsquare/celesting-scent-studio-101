import {calculate,num} from './logic';
import {calculatePricingTiers,defaultPricingTiers} from './pricing';
import {stockRows} from './stock';

const activeStatuses=['Planned','Mixing','Maceration','Maturing','Bottling'];
const localDate=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

// What needs doing, for the Dashboard banner. Every number is a count of things to look at.
//  lowStock: materials or supplies at or under their low-stock level
//  ready: batches in Maturing whose maturation date has arrived
//  needBottle: formulas with no bottle size chosen in Costing
//  unsavedPrice: formulas whose current prices are not saved (or differ from the saved price)
export function dashboardAlerts(data,now=new Date()){
  const formulas=data?.formulas||[],batches=data?.batches||[],today=localDate(now);
  let needBottle=0,unsavedPrice=0;
  for(const formula of formulas){
    const calc=calculate(formula,data),summary=formulaOverview(formula,calc);
    if(!summary.hasBottle){needBottle+=1;continue}
    const tiers=calculatePricingTiers(calc.unitBottleCost,formula.pricingQuantity??calc.bottles,formula.pricingTiers?.length?formula.pricingTiers:defaultPricingTiers());
    const saved=formula.pricingHistory?.at(-1);
    const matches=Boolean(saved)&&tiers.every((tier,index)=>Math.abs(num(tier.result.finalPrice)-num(saved.tiers?.[index]?.result?.finalPrice))<0.005);
    if(!matches)unsavedPrice+=1;
  }
  return {
    formulas:formulas.length,
    lowStock:data?stockRows(data).filter(row=>row.low).length:0,
    ready:batches.filter(batch=>!batch.archived&&!batch.onHold&&['Maturing','Bottling'].includes(batch.status)&&batch.maturationDate&&batch.maturationDate<=today).length,
    inProgress:batches.filter(batch=>!batch.archived&&activeStatuses.includes(batch.status)).length,
    needBottle,
    unsavedPrice
  };
}
export const attentionCount=alerts=>alerts.lowStock+alerts.ready+alerts.needBottle+alerts.unsavedPrice;

// The most recently updated formula (ties keep the earlier one in the list).
export const latestFormula=formulas=>(formulas||[]).reduce((best,formula)=>!best||(formula.updatedAt||'')>(best.updatedAt||'')?formula:best,undefined);

const isCompleted=batch=>(batch.status||'Completed')==='Completed';

// Formulas ranked by profit per bottle, from completed batches only.
// Batches are matched to a formula by id (or by name for older batches); a deleted formula still shows by its batch name.
export function topFormulas(data,limit=5){
  const formulas=data?.formulas||[],byId=new Map(formulas.map(formula=>[formula.id,formula])),groups=new Map();
  for(const batch of data?.batches||[]){
    if(!isCompleted(batch))continue;
    const id=batch.formula?.id&&byId.has(batch.formula.id)?batch.formula.id:formulas.find(formula=>formula.name===batch.name)?.id||null;
    const key=id||`name:${batch.name||'Unnamed'}`,live=id?byId.get(id):null;
    const group=groups.get(key)||{key,id,name:live?.name||batch.name||'Unnamed formula',scentName:live?.scentName||'',batches:0,bottles:0,cost:0,profit:0};
    group.batches+=1;group.bottles+=num(batch.bottles);group.cost+=num(batch.productionCost);group.profit+=num(batch.projectedGrossProfit);
    groups.set(key,group);
  }
  return [...groups.values()].filter(group=>group.bottles>0)
    .map(group=>({...group,costPerBottle:group.cost/group.bottles,profitPerBottle:group.profit/group.bottles,totalProfit:group.profit}))
    .sort((a,b)=>b.profitPerBottle-a.profitPerBottle||b.totalProfit-a.totalProfit)
    .slice(0,limit);
}

// The numbers shown on the dashboard for the current formula. They come from the same calculations as
// Costing -> Pricing, so both screens always agree:
//  - rawMaterialCost: what the raw materials cost at today's library prices (whole batch)
//  - costOfProduction: raw materials + labour + overhead + other costs + packaging (whole batch)
//  - costPerBottle: cost of one finished bottle (its share of the content plus its own packaging)
//  - suggestedPrice: the Retail price from the Pricing tab, based on that finished-bottle cost
// Per-bottle figures need a bottle size chosen in Costing; until then they are null.
export function formulaOverview(form,calc){
  const hasBottle=num(calc.bottleSize)>0&&num(calc.unitBottleCost)>0;
  const quantity=form?.pricingQuantity??calc.bottles;
  const tier=hasBottle?calculatePricingTiers(calc.unitBottleCost,quantity,form?.pricingTiers)[0]:null;
  return {
    volume:num(calc.volume),
    bottles:num(calc.bottles),
    rawMaterialCost:num(calc.ingredientCost),
    costOfProduction:num(calc.productionCost),
    hasBottle,
    costPerBottle:hasBottle?num(calc.unitBottleCost):null,
    tierName:tier?.name||'Retail',
    suggestedPrice:tier?tier.result.finalPrice:null,
    profitPerBottle:tier?tier.result.profit:null
  };
}
