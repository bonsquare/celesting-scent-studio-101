import {describe,expect,it} from 'vitest';
import {calculate,initial,newFormula} from './logic';
import {snapshotPricing} from './pricing';
import {attentionCount,dashboardAlerts} from './overview';

const NOW=new Date(2026,10,5,12,0);
const stocked=()=>initial.ingredients.map(item=>({...item,stockQuantity:500,reorderLevel:10}));
const base=patch=>({...initial,ingredients:stocked(),supplies:[],stockLog:[],formulas:[],batches:[],...patch});
const withBottle=patch=>({...newFormula(),id:'f1',costingBottleSize:50,...patch});

describe('dashboardAlerts',()=>{
  it('reports nothing to do for an empty workspace',()=>{
    const alerts=dashboardAlerts(base(),NOW);
    expect(alerts).toMatchObject({formulas:0,lowStock:0,ready:0,inProgress:0,needBottle:0,unsavedPrice:0});
    expect(attentionCount(alerts)).toBe(0);
  });
  it('counts formulas that still need a bottle size',()=>{
    const alerts=dashboardAlerts(base({formulas:[newFormula(),withBottle()]}),NOW);
    expect(alerts.needBottle).toBe(1);
  });
  it('counts formulas whose prices have not been saved, and clears once they match the saved price',()=>{
    const data=base({formulas:[withBottle()]});
    expect(dashboardAlerts(data,NOW).unsavedPrice).toBe(1);
    const calc=calculate(data.formulas[0],data);
    const saved={...data.formulas[0],pricingHistory:[snapshotPricing(calc.unitBottleCost,calc.bottles)]};
    expect(dashboardAlerts(base({formulas:[saved]}),NOW).unsavedPrice).toBe(0);
  });
  it('flags a saved price that no longer matches the current prices',()=>{
    const data=base({formulas:[withBottle()]});
    const calc=calculate(data.formulas[0],data);
    const stale={...data.formulas[0],pricingHistory:[snapshotPricing(calc.unitBottleCost+50,calc.bottles)]};
    expect(dashboardAlerts(base({formulas:[stale]}),NOW).unsavedPrice).toBe(1);
  });
  it('counts low-stock materials and supplies',()=>{
    const ingredients=stocked();ingredients[0]={...ingredients[0],stockQuantity:5,reorderLevel:10};
    const supplies=[{id:'s1',name:'Bottle',category:'Bottle',stockQuantity:3,reorderLevel:20,unitCost:20,usedPerBottle:1}];
    expect(dashboardAlerts(base({ingredients,supplies}),NOW).lowStock).toBe(2);
  });
  it('counts maturing batches whose date has arrived, but not future or other-status batches',()=>{
    const batches=[
      {id:'a',status:'Maturing',maturationDate:'2026-11-01'},
      {id:'b',status:'Maturing',maturationDate:'2026-11-05'},
      {id:'c',status:'Maturing',maturationDate:'2026-11-20'},
      {id:'d',status:'Mixing',maturationDate:'2026-11-01'},
      {id:'e',status:'Completed',maturationDate:'2026-11-01'},
      {id:'f',status:'Maturing'}
    ];
    const alerts=dashboardAlerts(base({batches}),NOW);
    expect(alerts.ready).toBe(2);
    expect(alerts.inProgress).toBe(5);
  });
  it('adds up everything that needs attention',()=>{
    const alerts={lowStock:2,ready:1,needBottle:3,unsavedPrice:4,inProgress:9,formulas:5};
    expect(attentionCount(alerts)).toBe(10);
  });
  it('handles missing data',()=>{
    expect(dashboardAlerts(undefined,NOW)).toMatchObject({formulas:0,lowStock:0,ready:0,needBottle:0,unsavedPrice:0});
  });
});
