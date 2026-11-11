import {describe,expect,it} from 'vitest';
import {plural,prefillMaterial,rankOptions,uniqueOptions} from './suggestions';

describe('uniqueOptions',()=>{
  const records=[{s:'Fragrance Shop Ph'},{s:'fragrance shop ph '},{s:'Local Supplier'},{s:''},{s:null},{}];
  it('merges values that differ only by case or spacing and counts them',()=>{
    const options=uniqueOptions(records,r=>r.s);
    expect(options.map(o=>[o.value,o.count])).toEqual([['Fragrance Shop Ph',2],['Local Supplier',1]]);
  });
  it('keeps the first record and builds hints',()=>{
    const options=uniqueOptions(records,r=>r.s,e=>plural(e.count,'material'));
    expect(options[0].record).toBe(records[0]);
    expect(options[0].hint).toBe('2 materials');
    expect(options[1].hint).toBe('1 material');
  });
  it('handles missing input',()=>{
    expect(uniqueOptions(undefined,r=>r)).toEqual([]);
  });
});

describe('rankOptions',()=>{
  const options=[{value:'Argeville',count:1},{value:'Mary Kay',count:9},{value:'Vanilla House',count:5},{value:'Arabian Oud',count:3},{value:'Cloud',count:2}];
  it('returns everything (most used first) for empty text',()=>{
    expect(rankOptions(options,'').map(o=>o.value)).toEqual(['Mary Kay','Vanilla House','Arabian Oud','Cloud','Argeville']);
  });
  it('puts starts-with matches before contains matches',()=>{
    expect(rankOptions(options,'ar').map(o=>o.value)).toEqual(['Arabian Oud','Argeville','Mary Kay']);
  });
  it('is case-insensitive and trims',()=>{
    expect(rankOptions(options,'  CLOUD ').map(o=>o.value)).toEqual(['Cloud']);
  });
  it('respects the limit and handles no matches',()=>{
    expect(rankOptions(options,'',2)).toHaveLength(2);
    expect(rankOptions(options,'zzz')).toEqual([]);
  });
});

describe('prefillMaterial',()=>{
  const material={category:'Fragrance Oil',make:'Argeville',inspiredBy:'Cloud - Ariana Grande',scentName:'Dream Mist',density:0.95,contentUnit:'mL',supplier:'Shop A',purchasePrice:250};
  const blank={name:'Cloud',category:'Alcohol',make:'',inspiredBy:'',scentName:'',density:1,contentUnit:'g',supplier:'',purchasePrice:'',contentQuantity:''};
  it('fills shared fields but never supplier, price or quantity',()=>{
    const next=prefillMaterial(blank,material);
    expect(next).toMatchObject({category:'Fragrance Oil',make:'Argeville',inspiredBy:'Cloud - Ariana Grande',scentName:'Dream Mist',density:0.95,contentUnit:'mL'});
    expect(next.supplier).toBe('');
    expect(next.purchasePrice).toBe('');
    expect(next.contentQuantity).toBe('');
  });
  it('does not overwrite make, inspired by or scent name that you already typed',()=>{
    const next=prefillMaterial({...blank,make:'My Brand',scentName:'Mine'},material);
    expect(next.make).toBe('My Brand');
    expect(next.scentName).toBe('Mine');
    expect(next.inspiredBy).toBe('Cloud - Ariana Grande');
  });
  it('returns the draft unchanged without a material',()=>{
    expect(prefillMaterial(blank,undefined)).toBe(blank);
  });
});
