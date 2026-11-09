import {num,uid} from './logic';

export const pricingTierNames=['Retail','Wholesale','Reseller','Promotional'];
export const defaultPricingTiers=()=>pricingTierNames.map((name,index)=>({id:uid(),name,method:'markup',rate:[100,50,40,25][index],rounding:index===0?'peso':'none',manualPrice:'',discountType:'percent',discount:0,maxDiscount:30,minMargin:0}));

const finite=value=>Number.isFinite(value)?value:0;
export const roundPrice=(price,mode)=>{const value=Math.max(0,finite(price));if(mode==='peso')return Math.ceil(value);if(mode==='5')return Math.ceil(value/5)*5;if(mode==='10')return Math.ceil(value/10)*10;if(mode==='ending9'){const rounded=Math.ceil(value);const candidate=Math.ceil((rounded+1)/10)*10-1;return candidate<value?candidate+10:candidate}return value};

// context.retailPrice is the final Retail price, used by the "discount" method (a set % below Retail).
export function calculatePriceTier(cost,quantity,tier,context={}){
 const unitCost=Math.max(0,num(cost)),qty=Math.max(0,Math.floor(num(quantity))),rate=num(tier.rate),method=['markup','margin','manual','discount'].includes(tier.method)?tier.method:'markup';
 const warnings=[];let suggested=unitCost;
 if(unitCost<=0)warnings.push('Missing production cost information.');
 if(method==='margin'){
  if(rate<0||rate>=100){warnings.push('Target margin must be at least 0% and below 100%.');suggested=0}else suggested=unitCost/(1-rate/100);
 }else if(method==='manual')suggested=Math.max(0,num(tier.manualPrice));
 else if(method==='discount'){
  const retail=Math.max(0,num(context.retailPrice));
  if(!(retail>0)){warnings.push('Set the Retail price first. This tier is a discount from Retail.');suggested=0}
  else if(rate<0||rate>=100){warnings.push('The discount from Retail must be at least 0% and below 100%.');suggested=0}
  else suggested=retail*(1-rate/100);
 }
 else suggested=unitCost*(1+Math.max(0,rate)/100);
 const override=tier.manualOverride!==''&&tier.manualOverride!=null?Math.max(0,num(tier.manualOverride)):null;
 const beforeDiscount=override??roundPrice(suggested,tier.rounding);
 const discountValue=Math.max(0,num(tier.discount));
 const discountAmount=tier.discountType==='fixed'?discountValue:beforeDiscount*discountValue/100;
 const finalPrice=Math.max(0,beforeDiscount-discountAmount),profit=finalPrice-unitCost;
 const actualMarkup=unitCost>0?profit/unitCost*100:0,actualMargin=finalPrice>0?profit/finalPrice*100:0;
 if(finalPrice<unitCost)warnings.push('Selling price is below production cost.');
 if(profit<0)warnings.push('This price produces a negative gross profit.');
 if(discountValue>Math.max(0,num(tier.maxDiscount)))warnings.push('Discount exceeds the configured limit.');
 if(actualMargin+1e-9<Math.max(0,num(tier.minMargin)))warnings.push('Selling price is below the minimum required margin.');
 return {suggested,priceBeforeDiscount:beforeDiscount,discountAmount,finalPrice,profit,actualMarkup,actualMargin,revenue:finalPrice*qty,projectedProfit:profit*qty,quantity:qty,warnings};
}

// Tiers are calculated in order. The first tier is Retail; later tiers may be a % below Retail.
// Safety net: each tier should be priced below the one before it, so a warning is added when it is not.
export function calculatePricingTiers(cost,quantity,tiers){
 const list=tiers?.length?tiers:defaultPricingTiers(),results=[];
 list.forEach((tier,index)=>{
  const result=calculatePriceTier(cost,quantity,tier,{retailPrice:results[0]?.finalPrice});
  if(index>0&&result.finalPrice>0&&results[index-1].finalPrice>0&&result.finalPrice>=results[index-1].finalPrice-1e-9)result.warnings.push(`${tier.name||'This tier'} should be priced below ${list[index-1].name||'the tier above it'}.`);
  results.push(result);
 });
 return list.map((tier,index)=>({...tier,result:results[index]}));
}

// One saved price per formula. Saving again replaces it (keeping its id), so copies never pile up.
export function upsertPriceRecord(history,record){
 const last=(history||[]).at(-1);
 return {history:[last?{...record,id:last.id}:record],updated:Boolean(last)};
}

// Older data may hold several saved prices for one formula. Keep only the newest one.
export const collapsePriceHistory=formula=>(formula?.pricingHistory?.length>1?{...formula,pricingHistory:[formula.pricingHistory.at(-1)]}:formula);

// The structure to apply: Retail is a fixed price, and the other tiers are a set % below Retail,
// each with a minimum-margin floor. Names, ids, bottle costs and saved history are untouched.
export const structureDiscounts=[0,15,25,35];
export const structureFloors=[40,30,25,20];
export function recommendedTiers(tiers,retailPrice){
 const list=tiers?.length?tiers:defaultPricingTiers();
 return list.map((tier,index)=>{
  const slot=Math.min(index,structureDiscounts.length-1);
  return index===0
   ?{...tier,method:'manual',manualPrice:String(Math.max(0,num(retailPrice))),manualOverride:'',rounding:'none',discount:0,minMargin:structureFloors[0],allowBelowCost:false}
   :{...tier,method:'discount',rate:structureDiscounts[slot],manualPrice:'',manualOverride:'',rounding:'peso',discount:0,minMargin:structureFloors[slot],allowBelowCost:false};
 });
}
export function snapshotPricing(cost,quantity,tiers){return {savedAt:new Date().toISOString(),costPerBottle:num(cost),quantity:Math.max(0,Math.floor(num(quantity))),tiers:structuredClone(calculatePricingTiers(cost,quantity,tiers))}}
