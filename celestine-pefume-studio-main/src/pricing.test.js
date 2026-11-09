import {describe,it,expect} from 'vitest';
import {calculatePriceTier,calculatePricingTiers,roundPrice,snapshotPricing} from './pricing';

const tier=patch=>({method:'markup',rate:30,rounding:'none',manualPrice:'',manualOverride:'',discountType:'percent',discount:0,maxDiscount:30,minMargin:0,...patch});
describe('pricing calculations',()=>{
 it('calculates 30% markup on 85',()=>expect(calculatePriceTier(85,1,tier({})).finalPrice).toBeCloseTo(110.5));
 it('calculates 30% margin on 85',()=>expect(calculatePriceTier(85,1,tier({method:'margin'})).finalPrice).toBeCloseTo(121.428571));
 it('recalculates actual margin after rounding',()=>{const result=calculatePriceTier(85,1,tier({rounding:'10'}));expect(result.finalPrice).toBe(120);expect(result.actualMargin).toBeCloseTo(29.166667)});
 it('applies percentage and fixed discounts',()=>{expect(calculatePriceTier(100,1,tier({rate:50,discount:10})).finalPrice).toBe(135);expect(calculatePriceTier(100,1,tier({rate:50,discountType:'fixed',discount:10})).finalPrice).toBe(140)});
 it('prevents division by zero',()=>{const result=calculatePriceTier(0,1,tier({method:'margin'}));expect(Number.isFinite(result.actualMarkup)).toBe(true);expect(result.warnings.length).toBeGreaterThan(0)});
 it('rejects invalid margins',()=>expect(calculatePriceTier(85,1,tier({method:'margin',rate:100})).warnings[0]).toMatch(/below 100/));
 it('supports different bottle costs',()=>expect(calculatePriceTier(170,1,tier({})).finalPrice).toBeCloseTo(221));
 it('updates when production cost changes',()=>expect(calculatePriceTier(90,1,tier({})).finalPrice).not.toBe(calculatePriceTier(85,1,tier({})).finalPrice));
 it('preserves historical snapshots',()=>{const tiers=[tier({name:'Retail'})],snap=snapshotPricing(85,10,tiers);tiers[0].rate=90;expect(snap.tiers[0].result.finalPrice).toBeCloseTo(110.5)});
 it('calculates retail wholesale and reseller tiers',()=>{const results=calculatePricingTiers(100,2,[tier({name:'Retail',rate:100}),tier({name:'Wholesale',rate:50}),tier({name:'Reseller',rate:30})]);expect(results.map(x=>x.result.finalPrice)).toEqual([200,150,130])});
 it('supports all rounding options',()=>{expect(roundPrice(121.01,'peso')).toBe(122);expect(roundPrice(121.01,'5')).toBe(125);expect(roundPrice(121.01,'10')).toBe(130);expect(roundPrice(121.01,'ending9')).toBe(129)});
});
