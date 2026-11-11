import {describe,expect,it} from 'vitest';
import {appendVersion,diffRows,formulaChanged,formulaStatus,maxVersions,newTrial,versionSnapshot} from './formulaNotes';

const formula=(rows,extra={})=>({name:'F',targetBasis:'oil',targetUnit:'mL',targetAmount:20,concentration:20,ingredients:rows.map(([materialId,name,percentage])=>({materialId,name,percentage})),...extra});

describe('formula status',()=>{
  it('defaults unknown status to Draft',()=>{
    expect(formulaStatus({})).toBe('Draft');
    expect(formulaStatus({status:'Nope'})).toBe('Draft');
    expect(formulaStatus({status:'Approved'})).toBe('Approved');
  });
});

describe('version detection',()=>{
  const base=formula([['a','Oil',20],['b','Alcohol',80]]);
  it('ignores row order, notes, status and trials',()=>{
    const same=formula([['b','Alcohol',80],['a','Oil',20]],{notes:'x',status:'Approved',trials:[{id:1}]});
    expect(formulaChanged(base,same)).toBe(false);
  });
  it('detects percentage and target changes',()=>{
    expect(formulaChanged(base,formula([['a','Oil',22],['b','Alcohol',78]]))).toBe(true);
    expect(formulaChanged(base,{...base,targetAmount:30})).toBe(true);
    expect(formulaChanged(base,{...base,targetUnit:'g'})).toBe(true);
  });
});

describe('version history',()=>{
  it('snapshots the recipe',()=>{
    const snap=versionSnapshot(formula([['a','Oil',20]],{updatedAt:'2026-11-01T00:00:00Z'}),'2026-11-05T00:00:00Z');
    expect(snap.savedAt).toBe('2026-11-01T00:00:00Z');
    expect(snap.archivedAt).toBe('2026-11-05T00:00:00Z');
    expect(snap.rows).toEqual([{materialId:'a',name:'Oil',percentage:20}]);
  });
  it('caps stored versions',()=>{
    let versions=[];
    for(let i=0;i<maxVersions+5;i++)versions=appendVersion(versions,formula([['a','Oil',i]]));
    expect(versions).toHaveLength(maxVersions);
    expect(versions.at(-1).rows[0].percentage).toBe(maxVersions+4);
  });
});

describe('diffRows',()=>{
  it('classifies added, removed, changed and same',()=>{
    const from=[{materialId:'a',name:'Oil',percentage:20},{materialId:'b',name:'Alcohol',percentage:75},{materialId:'c',name:'Water',percentage:5}];
    const to=[{materialId:'a',name:'Oil',percentage:22},{materialId:'b',name:'Alcohol',percentage:75},{materialId:'d',name:'Fixative',percentage:3}];
    const result=Object.fromEntries(diffRows(from,to).map(row=>[row.name,row]));
    expect(result.Oil).toMatchObject({kind:'changed',delta:2});
    expect(result.Alcohol.kind).toBe('same');
    expect(result.Water).toMatchObject({kind:'removed',to:null,delta:-5});
    expect(result.Fixative).toMatchObject({kind:'added',from:null,delta:3});
  });
  it('lists changes before unchanged rows',()=>{
    const rows=diffRows([{materialId:'a',name:'A',percentage:1},{materialId:'b',name:'B',percentage:1}],[{materialId:'a',name:'A',percentage:1},{materialId:'b',name:'B',percentage:2}]);
    expect(rows[0].name).toBe('B');
  });
});

describe('trials',()=>{
  it('clamps ratings and trims notes',()=>{
    expect(newTrial({rating:9,note:'  good  '})).toMatchObject({rating:5,note:'good'});
    expect(newTrial({rating:-3}).rating).toBe(0);
    expect(newTrial({rating:'x'}).rating).toBe(0);
  });
  it('defaults the date to today',()=>{
    expect(newTrial({}).date).toBe(new Date().toISOString().slice(0,10));
    expect(newTrial({date:'2026-01-02'}).date).toBe('2026-01-02');
  });
});
