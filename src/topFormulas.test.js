import {describe,expect,it} from 'vitest';
import {latestFormula,topFormulas} from './overview';

const batch=(formulaId,name,bottles,productionCost,profit,status='Completed')=>({status,formula:formulaId?{id:formulaId}:undefined,name,bottles,productionCost,projectedGrossProfit:profit});

describe('latestFormula',()=>{
  it('picks the most recently updated formula',()=>{
    const formulas=[{id:'a',updatedAt:'2026-01-01'},{id:'b',updatedAt:'2026-06-01'},{id:'c',updatedAt:'2026-03-01'}];
    expect(latestFormula(formulas).id).toBe('b');
  });
  it('keeps the first formula when none has a date, and handles empty lists',()=>{
    expect(latestFormula([{id:'a'},{id:'b'}]).id).toBe('a');
    expect(latestFormula([])).toBeUndefined();
    expect(latestFormula(undefined)).toBeUndefined();
  });
});

describe('topFormulas',()=>{
  const data={
    formulas:[{id:'f1',name:'Dream Mist',scentName:'Dream Mist'},{id:'f2',name:'Ocean'},{id:'f3',name:'Unused'}],
    batches:[
      batch('f1','Dream Mist',10,1000,1500),
      batch('f1','Dream Mist',10,1200,1100),
      batch('f2','Ocean',20,2000,2000),
      batch('f2','Ocean',20,2000,9999,'Planned'),
      batch('f2','Ocean',5,500,500,'Cancelled')
    ]
  };
  it('ranks by profit per bottle using completed batches only',()=>{
    const rows=topFormulas(data);
    expect(rows.map(r=>r.name)).toEqual(['Dream Mist','Ocean']);
    expect(rows[0]).toMatchObject({id:'f1',batches:2,bottles:20,totalProfit:2600});
    expect(rows[0].profitPerBottle).toBeCloseTo(130,6);
    expect(rows[0].costPerBottle).toBeCloseTo(110,6);
    expect(rows[1]).toMatchObject({batches:1,bottles:20});
    expect(rows[1].profitPerBottle).toBeCloseTo(100,6);
  });
  it('leaves out formulas with no completed batches',()=>{
    expect(topFormulas(data).some(r=>r.name==='Unused')).toBe(false);
  });
  it('treats a batch with no status as completed, matches older batches by name, and keeps deleted formulas by batch name',()=>{
    const older={formulas:[{id:'f1',name:'Cloud'}],batches:[{name:'Cloud',bottles:10,productionCost:500,projectedGrossProfit:500},{name:'Old Scent',bottles:4,productionCost:100,projectedGrossProfit:400,formula:{id:'gone'}}]};
    const rows=topFormulas(older);
    expect(rows.find(r=>r.name==='Cloud').id).toBe('f1');
    const gone=rows.find(r=>r.name==='Old Scent');
    expect(gone.id).toBeNull();
    expect(gone.profitPerBottle).toBeCloseTo(100,6);
  });
  it('respects the limit and handles missing data',()=>{
    expect(topFormulas(data,1)).toHaveLength(1);
    expect(topFormulas(null)).toEqual([]);
    expect(topFormulas({formulas:[],batches:[batch('x','Zero',0,0,0)]})).toEqual([]);
  });
});
