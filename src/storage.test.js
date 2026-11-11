import {it,expect} from 'vitest';
import {normalizeData} from './storage';
import {calculate,newFormula,initial} from './logic';
it('gives every formula a unique Formula ID and keeps one saved price each when data loads',()=>{
  const a={...newFormula(),id:'a',name:'Dream Mist',pricingHistory:[{id:'r1',savedAt:'2026-11-05T05:28:00Z'},{id:'r2',savedAt:'2026-11-05T07:59:00Z'}]};
  const b={...newFormula(),id:'b',name:'Dream Mist',pricingHistory:[{id:'r3'}]};
  const c={...newFormula(),id:'c',name:'Ocean'};
  const data=normalizeData({...initial,formulas:[a,b,c]});
  expect(data.formulas.map(f=>f.code)).toEqual(['F-0001','F-0002','F-0003']);
  expect(data.formulas[0].name).toBe(data.formulas[1].name);
  expect(data.formulas[0].pricingHistory).toEqual([{id:'r2',savedAt:'2026-11-05T07:59:00Z'}]);
  expect(data.formulas[1].pricingHistory).toHaveLength(1);
  expect(data.formulas[2].pricingHistory).toBeUndefined();
  expect(normalizeData(data).formulas.map(f=>f.code)).toEqual(['F-0001','F-0002','F-0003']);
});
it('preserves legacy per-mL costs when adding purchase fields',()=>{const legacy={...initial,ingredients:[{id:'i1',name:'Fragrance oil',unitCost:2.5,density:.95}],formulas:[{...newFormula(),ingredients:[{id:'r1',name:'Fragrance oil',percentage:100,density:.95,unitCost:2.5}]}]};const data=normalizeData(legacy);expect(data.ingredients[0]).toMatchObject({contentQuantity:1,contentUnit:'mL',purchasePrice:2.5,category:'Fragrance Oil',supplier:'',make:''});expect(data.formulas[0].ingredients[0].materialId).toBe('i1');expect(calculate(data.formulas[0],data).rows[0].cost).toBe(1250)});
