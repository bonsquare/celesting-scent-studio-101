import {describe,expect,it} from 'vitest';
import {addStock,addSupply,deductSuppliesForBatch,removeSupply,setStockCount,stockDiffEntries,stockForm,stockRows,stockSummary,subgroupOrder,updateSupply} from './stock';

const base=()=>({
  ingredients:[{id:'m1',name:'Cloud',category:'Fragrance Oil',make:'Argeville',supplier:'Shop',contentQuantity:100,contentUnit:'mL',purchasePrice:250,stockQuantity:40,reorderLevel:20}],
  supplies:[],
  stockLog:[]
});
const NOW='2026-11-05T00:00:00.000Z';

describe('add stock',()=>{
  it('increases a raw material and logs it',()=>{
    const next=addStock(base(),'material','m1',60,' delivery ',NOW);
    expect(next.ingredients[0].stockQuantity).toBe(100);
    expect(next.stockLog).toHaveLength(1);
    expect(next.stockLog[0]).toMatchObject({name:'Cloud',change:60,balance:100,reason:'Added',note:'delivery',unit:'mL'});
  });
  it('ignores zero, negative and unknown items',()=>{
    const data=base();
    expect(addStock(data,'material','m1',0)).toBe(data);
    expect(addStock(data,'material','m1',-5)).toBe(data);
    expect(addStock(data,'material','nope',5)).toBe(data);
  });
  it('does not change the original object',()=>{
    const data=base();
    addStock(data,'material','m1',10,'',NOW);
    expect(data.ingredients[0].stockQuantity).toBe(40);
    expect(data.stockLog).toHaveLength(0);
  });
});

describe('supplies',()=>{
  it('adds a supply with opening stock',()=>{
    const next=addSupply(base(),{name:' 50 ML bottle ',category:'Bottle',reorderLevel:'20',unitCost:'35',usedPerBottle:'1'},100,NOW);
    expect(next.supplies).toHaveLength(1);
    expect(next.supplies[0]).toMatchObject({name:'50 ML bottle',category:'Bottle',stockQuantity:100,reorderLevel:20,unitCost:35,usedPerBottle:1});
    expect(next.stockLog[0]).toMatchObject({reason:'Opening',change:100,unit:'PCS'});
  });
  it('keeps a custom category, tidies it, and falls back to Other when blank',()=>{
    expect(addSupply(base(),{name:'Ribbon',category:'  Gift   Wrap '},0,NOW).supplies[0].category).toBe('Gift Wrap');
    expect(addSupply(base(),{name:'Ribbon',category:'x'.repeat(80)},0,NOW).supplies[0].category).toHaveLength(40);
    expect(addSupply(base(),{name:'Ribbon',category:'   '},0,NOW).supplies[0].category).toBe('Other');
  });
  it('keeps stock when editing',()=>{
    let data=addSupply(base(),{name:'Tape',category:'Other'},10,NOW);
    const id=data.supplies[0].id;
    data=updateSupply(data,id,{name:'Tape roll',unitCost:5});
    expect(data.supplies[0]).toMatchObject({name:'Tape roll',unitCost:5,stockQuantity:10,id});
  });
  it('removes a supply',()=>{
    let data=addSupply(base(),{name:'Box'},0,NOW);
    data=removeSupply(data,data.supplies[0].id);
    expect(data.supplies).toHaveLength(0);
  });
});

describe('set counted total',()=>{
  it('sets stock to the counted value and logs the difference',()=>{
    const next=setStockCount(base(),'material','m1',25,'stock take',NOW);
    expect(next.ingredients[0].stockQuantity).toBe(25);
    expect(next.stockLog[0]).toMatchObject({reason:'Counted',change:-15,balance:25});
  });
  it('rejects blank, negative and non-numeric counts',()=>{
    const data=base();
    expect(setStockCount(data,'material','m1','')).toBe(data);
    expect(setStockCount(data,'material','m1',-1)).toBe(data);
    expect(setStockCount(data,'material','m1','abc')).toBe(data);
  });
  it('makes no entry when the count matches',()=>{
    const data=base();
    expect(setStockCount(data,'material','m1',40)).toBe(data);
  });
});

describe('batch usage',()=>{
  it('deducts bottles x used per bottle and reports shortages',()=>{
    let data=addSupply(base(),{name:'Bottle',category:'Bottle',usedPerBottle:1},8,NOW);
    data=addSupply(data,{name:'Sticker',category:'Sticker / Label',usedPerBottle:2},100,NOW);
    data=addSupply(data,{name:'Tape',category:'Other',usedPerBottle:0},50,NOW);
    const result=deductSuppliesForBatch(data,10,'B-1',NOW);
    const byName=Object.fromEntries(result.data.supplies.map(s=>[s.name,s.stockQuantity]));
    expect(byName).toEqual({Bottle:0,Sticker:80,Tape:50});
    expect(result.short).toEqual(['Bottle']);
  });
  it('logs material changes from two stock lists',()=>{
    const before=base().ingredients,after=[{...before[0],stockQuantity:30}];
    const entries=stockDiffEntries(before,after,'material','Batch','B-1',NOW);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({change:-10,balance:30,reason:'Batch',note:'B-1'});
    expect(stockDiffEntries(before,before,'material','Batch')).toEqual([]);
  });
});

describe('liquid and non-liquid grouping',()=>{
  it('puts mL materials under liquid, and gram materials and supplies under non-liquid',()=>{
    let data={...base(),ingredients:[...base().ingredients,{id:'m2',name:'Ambroxan',category:'Fixative',contentQuantity:100,contentUnit:'g',purchasePrice:500,stockQuantity:50,reorderLevel:10},{id:'m3',name:'Mystery',category:'Other',contentQuantity:10,contentUnit:'mL',purchasePrice:10,stockQuantity:5,reorderLevel:1}]};
    data=addSupply(data,{name:'Label',category:'Sticker / Label'},10,NOW);
    data=addSupply(data,{name:'Tape',category:'Other'},10,NOW);
    const bySub=Object.fromEntries(stockRows(data).map(r=>[r.name,[r.group,r.subgroup]]));
    expect(bySub.Cloud).toEqual(['liquid','Fragrance Oil']);
    expect(bySub.Ambroxan).toEqual(['solid','Fixative']);
    expect(bySub.Mystery).toEqual(['liquid','Other materials']);
    expect(bySub.Label).toEqual(['solid','Sticker / Label']);
    expect(bySub.Tape).toEqual(['solid','Other supplies']);
  });
  it('lists every sub-heading exactly once, materials before supplies',()=>{
    expect(new Set(subgroupOrder).size).toBe(subgroupOrder.length);
    expect(subgroupOrder.indexOf('Fragrance Oil')).toBeLessThan(subgroupOrder.indexOf('Bottle'));
    expect(subgroupOrder).toContain('Other materials');
    expect(subgroupOrder).toContain('Other supplies');
  });
  it('labels the stock form for exports',()=>{
    expect(stockForm({group:'liquid'})).toBe('Liquid');
    expect(stockForm({group:'solid'})).toBe('Non-liquid');
  });
});

describe('rows and summary',()=>{
  it('lists materials and supplies with low-stock flags and value',()=>{
    let data=base();
    data=addSupply(data,{name:'Bottle',reorderLevel:20,unitCost:35},10,NOW);
    const rows=stockRows(data);
    expect(rows).toHaveLength(2);
    expect(rows.find(r=>r.kind==='material')).toMatchObject({unit:'mL',low:false,value:100});
    expect(rows.find(r=>r.kind==='supply')).toMatchObject({unit:'PCS',low:true,value:350});
    expect(stockSummary(rows)).toEqual({items:2,low:1,value:450});
  });
});
