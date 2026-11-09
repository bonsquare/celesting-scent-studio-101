import {describe,expect,it} from 'vitest';
import {calculate,initial,newFormula} from './logic';
import {formulaOverview} from './overview';

const build=patch=>{const form={...newFormula(),...patch};return formulaOverview(form,calculate(form,initial))};

describe('formulaOverview',()=>{
  it('gives raw material cost and cost of production for the batch',()=>{
    const overview=build({costingBottleSize:50});
    expect(overview.volume).toBe(500);
    expect(overview.rawMaterialCost).toBeCloseTo(318,6);
    expect(overview.costOfProduction).toBeCloseTo(1318,6);
    expect(overview.bottles).toBe(10);
  });
  it('bases cost per bottle and price on the finished bottle, matching the Pricing tab',()=>{
    const overview=build({costingBottleSize:50});
    expect(overview.hasBottle).toBe(true);
    expect(overview.costPerBottle).toBeCloseTo(131.8,6);
    expect(overview.tierName).toBe('Retail');
    expect(overview.suggestedPrice).toBe(264);
    expect(overview.profitPerBottle).toBeCloseTo(264-131.8,6);
  });
  it('follows the bottle cost chosen in Costing',()=>{
    const overview=build({costingBottleSize:50,costingBottleCost:60});
    expect(overview.costPerBottle).toBeCloseTo(66.8+60+30,6);
    expect(overview.suggestedPrice).toBeGreaterThan(overview.costPerBottle);
  });
  it('has no per-bottle figures until a bottle size is chosen',()=>{
    const overview=build({});
    expect(overview.hasBottle).toBe(false);
    expect(overview.costPerBottle).toBeNull();
    expect(overview.suggestedPrice).toBeNull();
    expect(overview.profitPerBottle).toBeNull();
    expect(overview.costOfProduction).toBeGreaterThan(0);
  });
});
