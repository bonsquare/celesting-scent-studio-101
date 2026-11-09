import {describe,expect,it} from 'vitest';
import {calculatePriceTier,calculatePricingTiers,defaultPricingTiers,recommendedTiers,structureFloors} from './pricing';

const COST=103.93487450462351;
const tier=patch=>({name:'T',method:'markup',rate:30,rounding:'none',manualPrice:'',manualOverride:'',discountType:'percent',discount:0,maxDiscount:30,minMargin:0,...patch});

describe('discount-from-Retail method',()=>{
  it('prices a tier a set percentage below Retail',()=>{
    expect(calculatePriceTier(COST,1,tier({method:'discount',rate:15}),{retailPrice:200}).finalPrice).toBeCloseTo(170,6);
  });
  it('warns when Retail is not set or the discount is invalid',()=>{
    expect(calculatePriceTier(COST,1,tier({method:'discount',rate:15})).warnings.join(' ')).toMatch(/Retail price first/);
    expect(calculatePriceTier(COST,1,tier({method:'discount',rate:100}),{retailPrice:200}).warnings.join(' ')).toMatch(/below 100/);
    expect(calculatePriceTier(COST,1,tier({method:'discount',rate:-5}),{retailPrice:200}).warnings.join(' ')).toMatch(/at least 0/);
  });
});

describe('recommended structure with a Retail price of 200',()=>{
  const tiers=recommendedTiers(defaultPricingTiers(),200);
  const results=calculatePricingTiers(COST,1,tiers);
  it('gives 200 / 170 / 150 / 130',()=>{
    expect(results.map(t=>Math.round(t.result.finalPrice*100)/100)).toEqual([200,170,150,130]);
  });
  it('keeps every tier profitable and above its minimum margin, with no warnings',()=>{
    results.forEach((t,i)=>{
      expect(t.result.profit).toBeGreaterThan(0);
      expect(t.result.actualMargin).toBeGreaterThanOrEqual(structureFloors[i]);
      expect(t.result.warnings).toEqual([]);
    });
  });
  it('reports the margins and markups worked out in the plan',()=>{
    expect(results[0].result.actualMargin).toBeCloseTo(48.03,1);
    expect(results[1].result.actualMargin).toBeCloseTo(38.86,1);
    expect(results[2].result.actualMargin).toBeCloseTo(30.71,1);
    expect(results[3].result.actualMargin).toBeCloseTo(20.05,1);
    expect(results[0].result.actualMarkup).toBeCloseTo(92.43,1);
  });
  it('moves every tier when Retail changes',()=>{
    const higher=calculatePricingTiers(COST,1,recommendedTiers(tiers,300));
    expect(higher.map(t=>Math.round(t.result.finalPrice))).toEqual([300,255,225,195]);
  });
  it('keeps names and ids',()=>{
    const original=defaultPricingTiers();
    const next=recommendedTiers(original,200);
    expect(next.map(t=>t.id)).toEqual(original.map(t=>t.id));
    expect(next.map(t=>t.name)).toEqual(original.map(t=>t.name));
  });
});

describe('safety nets',()=>{
  it('warns when a tier is not priced below the one above it',()=>{
    const results=calculatePricingTiers(COST,1,[tier({name:'Retail',method:'manual',manualPrice:'150'}),tier({name:'Wholesale',method:'manual',manualPrice:'160'})]);
    expect(results[1].result.warnings.join(' ')).toMatch(/Wholesale should be priced below Retail/);
  });
  it('does not warn when tiers are in order',()=>{
    const results=calculatePricingTiers(COST,1,[tier({name:'Retail',rate:100}),tier({name:'Wholesale',rate:50})]);
    expect(results[1].result.warnings).toEqual([]);
  });
  it('warns when a price is under its minimum margin, and below cost',()=>{
    const low=calculatePriceTier(100,1,tier({method:'manual',manualPrice:'110',minMargin:25}));
    expect(low.warnings.join(' ')).toMatch(/minimum required margin/);
    const under=calculatePriceTier(100,1,tier({method:'manual',manualPrice:'90'}));
    expect(under.warnings.join(' ')).toMatch(/below production cost/);
  });
});
