import {describe,expect,it} from 'vitest';
import {formatFormulaCode,formatStamp,nextFormulaCode,withFormulaCodes} from './formulaCode';
import {collapsePriceHistory,upsertPriceRecord} from './pricing';

describe('formula codes',()=>{
  it('formats a padded code',()=>{
    expect(formatFormulaCode(1)).toBe('F-0001');
    expect(formatFormulaCode(42)).toBe('F-0042');
    expect(formatFormulaCode(12345)).toBe('F-12345');
    expect(formatFormulaCode(0)).toBe('F-0001');
  });
  it('picks the next unused code',()=>{
    expect(nextFormulaCode([])).toBe('F-0001');
    expect(nextFormulaCode(undefined)).toBe('F-0001');
    expect(nextFormulaCode([{code:'F-0001'},{code:'F-0007'},{code:'junk'},{}])).toBe('F-0008');
  });
  it('numbers formulas that have none, in list order',()=>{
    const result=withFormulaCodes([{name:'A'},{name:'B'},{name:'C'}]);
    expect(result.map(f=>f.code)).toEqual(['F-0001','F-0002','F-0003']);
  });
  it('keeps existing codes and continues after the highest one',()=>{
    const result=withFormulaCodes([{name:'A',code:'F-0005'},{name:'B'},{name:'C',code:'F-0002'},{name:'D'}]);
    expect(result.map(f=>f.code)).toEqual(['F-0005','F-0006','F-0002','F-0007']);
  });
  it('gives a duplicated code to only the first formula, and fixes malformed codes',()=>{
    const result=withFormulaCodes([{name:'A',code:'F-0003'},{name:'B',code:'F-0003'},{name:'C',code:'abc'}]);
    expect(result.map(f=>f.code)).toEqual(['F-0003','F-0004','F-0005']);
    expect(new Set(result.map(f=>f.code)).size).toBe(3);
  });
  it('is stable: running it again changes nothing',()=>{
    const once=withFormulaCodes([{name:'A'},{name:'B'}]);
    const twice=withFormulaCodes(once);
    expect(twice.map(f=>f.code)).toEqual(once.map(f=>f.code));
    expect(twice[0]).toBe(once[0]);
  });
  it('lets two formulas share a scent name with different codes',()=>{
    const result=withFormulaCodes([{name:'Dream Mist'},{name:'Dream Mist'}]);
    expect(result[0].name).toBe(result[1].name);
    expect(result[0].code).not.toBe(result[1].code);
  });
  it('handles missing input',()=>{
    expect(withFormulaCodes(undefined)).toEqual([]);
  });
});

describe('formatStamp',()=>{
  it('writes the date and time once, in plain words',()=>{
    const text=formatStamp(new Date(2026,10,5,15,36).toISOString());
    expect(text).toBe('Nov 5, 2026 @ 3:36 PM');
  });
  it('uses AM and PM in capitals and handles midnight and noon',()=>{
    expect(formatStamp(new Date(2026,0,2,0,5).toISOString())).toBe('Jan 2, 2026 @ 12:05 AM');
    expect(formatStamp(new Date(2026,0,2,12,0).toISOString())).toBe('Jan 2, 2026 @ 12:00 PM');
  });
  it('returns an empty string for missing or invalid dates',()=>{
    expect(formatStamp('')).toBe('');
    expect(formatStamp(undefined)).toBe('');
    expect(formatStamp('nonsense')).toBe('');
  });
});

describe('save once per formula',()=>{
  it('adds the first record',()=>{
    const result=upsertPriceRecord([],{id:'new',price:1});
    expect(result).toEqual({history:[{id:'new',price:1}],updated:false});
  });
  it('replaces the saved record, keeping its id, and leaves a single record',()=>{
    const history=[{id:'a',price:1},{id:'b',price:2}];
    const result=upsertPriceRecord(history,{id:'zzz',price:3});
    expect(result.updated).toBe(true);
    expect(result.history).toEqual([{id:'b',price:3}]);
  });
  it('collapses older duplicate records down to the newest one',()=>{
    const formula={name:'Dream Mist',pricingHistory:[{id:'a',price:208},{id:'b',price:190},{id:'c',price:200}]};
    expect(collapsePriceHistory(formula).pricingHistory).toEqual([{id:'c',price:200}]);
    expect(formula.pricingHistory).toHaveLength(3);
  });
  it('leaves formulas with zero or one saved price untouched',()=>{
    const none={name:'A'},one={name:'B',pricingHistory:[{id:'x'}]};
    expect(collapsePriceHistory(none)).toBe(none);
    expect(collapsePriceHistory(one)).toBe(one);
    expect(collapsePriceHistory(undefined)).toBeUndefined();
  });
  it('never grows the list after the first save',()=>{
    let history=[];
    for(let i=0;i<5;i++)history=upsertPriceRecord(history,{id:'x'+i,price:i}).history;
    expect(history).toHaveLength(1);
    expect(history[0].price).toBe(4);
  });
  it('does not change the original list',()=>{
    const history=[{id:'a',price:1}];
    upsertPriceRecord(history,{id:'b',price:2});
    expect(history).toEqual([{id:'a',price:1}]);
  });
});
