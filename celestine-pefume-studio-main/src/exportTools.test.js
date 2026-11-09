import {describe,expect,it} from 'vitest';
import {csvCell,toCsv,materialsCsv,batchesCsv,formulasCsv} from './exportTools';

describe('csv export',()=>{
  it('quotes commas, quotes and newlines',()=>{
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('x\ny')).toBe('"x\ny"');
    expect(csvCell(null)).toBe('');
  });
  it('neutralises spreadsheet formulas but keeps negative numbers',()=>{
    expect(csvCell('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(csvCell('@cmd')).toBe("'@cmd");
    expect(csvCell(-5)).toBe('-5');
  });
  it('joins rows with CRLF',()=>{
    expect(toCsv(['a','b'],[[1,2],[3,4]])).toBe('a,b\r\n1,2\r\n3,4');
  });
  it('exports materials with cost per unit',()=>{
    const csv=materialsCsv({ingredients:[{name:'Oil, rich',category:'Fragrance Oil',make:'M',supplier:'S',contentQuantity:100,contentUnit:'mL',purchasePrice:250,density:0.95,stockQuantity:40,reorderLevel:10}]});
    const [header,row]=csv.split('\r\n');
    expect(header.startsWith('Name,Category')).toBe(true);
    expect(row).toContain('"Oil, rich"');
    expect(row).toContain(',2.5,');
  });
  it('exports batches and formulas',()=>{
    const batches=batchesCsv({batches:[{batchNumber:'B-1',name:'Cloud',date:'2026-11-05',status:'Completed',bottles:10,expectedYield:500,actualYield:480,productionCost:1318,costPerBottle:131.8,projectedGrossProfit:1000,inventoryDeducted:true}]});
    expect(batches.split('\r\n')[1]).toContain('B-1,Cloud,2026-11-05,Completed');
    expect(batches).toContain('Yes');
    const formulas=formulasCsv({ingredients:[{id:'i1',name:'Oil'}],formulas:[{code:'F-0001',name:'F',scentName:'Dream Mist',inspiredBy:'Cloud - Ariana Grande',updatedAt:'2026-11-05T01:00:00Z',ingredients:[{materialId:'i1',percentage:20}]}]});
    expect(formulas.split('\r\n')[1]).toBe('F-0001,F,Dream Mist,Cloud - Ariana Grande,Oil,20,2026-11-05');
  });
  it('handles empty data',()=>{
    expect(materialsCsv({}).split('\r\n')).toHaveLength(1);
  });
});
