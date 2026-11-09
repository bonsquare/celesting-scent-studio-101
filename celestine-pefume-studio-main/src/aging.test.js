import {describe,expect,it} from 'vitest';
import {agingCounts,agingView,applyAgingAction,applyBatchEdit,buildSchedule,scheduleChanged,scheduleOf,stageProgress,syncProductionStatus,syncProductionStatuses,validateBatch} from './aging';

const sched=buildSchedule({productionDate:'2026-11-01',macerationDays:14,maturationDays:30});
const batch=(extra={})=>({id:'a',batchNumber:'B-1',name:'Dream Mist',date:'2026-11-01',status:'Planned',actualYield:500,...sched,...extra});

describe('schedule',()=>{
  it('calculates end dates and starts maturation the day after maceration',()=>{
    expect(sched).toMatchObject({macerationStart:'2026-11-01',macerationDate:'2026-11-15',maturationStart:'2026-11-16',maturationDate:'2026-12-16',expectedReadyDate:'2026-12-16'});
  });
  it('lets maceration start later and maturation be set by hand',()=>{
    const s=buildSchedule({productionDate:'2026-11-01',macerationStart:'2026-11-03',macerationDays:10,maturationStart:'2026-11-20',maturationDays:5});
    expect(s).toMatchObject({macerationDate:'2026-11-13',maturationStart:'2026-11-20',maturationDate:'2026-11-25'});
  });
  it('works out durations for older batches that only stored end dates',()=>{
    const s=scheduleOf({date:'2026-11-05',macerationStart:'2026-11-05',macerationDate:'2026-11-19',maturationDate:'2026-12-05'});
    expect(s).toMatchObject({macerationDays:14,maturationStart:'2026-11-20',maturationDays:15});
  });
});

describe('validation',()=>{
  const input={name:'Dream Mist',date:'2026-11-01',actualYield:500,macerationDays:14,maturationDays:30};
  it('accepts a good batch',()=>expect(validateBatch(input)).toEqual([]));
  it('rejects bad yield, durations and dates',()=>{
    expect(validateBatch({...input,actualYield:0})).toHaveLength(1);
    expect(validateBatch({...input,macerationDays:-3}).join()).toMatch(/Maceration duration/);
    expect(validateBatch({...input,maturationDays:1.5}).join()).toMatch(/Maturation duration/);
    expect(validateBatch({...input,macerationStart:'2026-10-30'}).join()).toMatch(/before the production date/);
  });
  it('blocks maturation before maceration ends unless overridden',()=>{
    const early={...input,maturationStart:'2026-11-10'};
    expect(validateBatch(early).join()).toMatch(/override/);
    expect(validateBatch(early,{override:true})).toEqual([]);
  });
});

describe('progress is calculated from the date',()=>{
  it('stage progress is elapsed / total',()=>{
    expect(stageProgress('2026-11-01','2026-11-15','','2026-10-30')).toMatchObject({state:'Scheduled',percent:0});
    expect(stageProgress('2026-11-01','2026-11-15','','2026-11-08')).toMatchObject({state:'In progress',percent:50,daysLeft:7});
    expect(stageProgress('2026-11-01','2026-11-15','','2026-11-15')).toMatchObject({state:'Completed',percent:100});
    expect(stageProgress('2026-11-01','2026-11-15','','2027-03-01').percent).toBe(100);
  });
  it('moves Scheduled to Macerating to Maturing to Ready for Bottling by date alone',()=>{
    const b=batch();
    expect(agingView(b,'2026-10-31').status).toBe('Scheduled');
    expect(agingView(b,'2026-11-05').status).toBe('Macerating');
    expect(agingView(b,'2026-11-15').status).toBe('Maturing');
    expect(agingView(b,'2026-12-15').status).toBe('Maturing');
    expect(agingView(b,'2026-12-16').status).toBe('Ready for Bottling');
  });
  it('overall progress covers both stages',()=>{
    const view=agingView(batch(),'2026-11-23');// 22 of 45 days
    expect(view.overall).toMatchObject({percent:49,planned:45,expectedReadyDate:'2026-12-16'});
    expect(agingView(batch(),'2027-02-01').overall.percent).toBe(100);
  });
  it('On Hold and Archived override the dates',()=>{
    expect(agingView(batch({onHold:true}),'2026-12-20').status).toBe('On Hold');
    expect(agingView(batch({archived:true,onHold:true}),'2026-12-20').status).toBe('Archived');
  });
});

describe('manual updates keep history',()=>{
  const by='me@example.com',now=new Date(2026,10,10,9,0);
  it('marking maceration done early moves maturation and the expected ready date',()=>{
    const next=applyAgingAction(batch(),'macerationDone',{date:'2026-11-10',by,reason:'Smells ready',now});
    expect(next.macerationDoneOn).toBe('2026-11-10');
    expect(next.maturationStart).toBe('2026-11-11');expect(next.maturationDate).toBe('2026-12-11');expect(next.expectedReadyDate).toBe('2026-12-11');
    const done=next.history.find(h=>h.field==='macerationDoneOn');
    expect(done).toMatchObject({from:'—',to:'2026-11-10',by,reason:'Smells ready'});
    expect(next.history.find(h=>h.field==='expectedReadyDate')).toMatchObject({from:'2026-12-16',to:'2026-12-11'});
    expect(next.status).toBe('Maturing');
  });
  it('hold, resume and archive are recorded',()=>{
    let b=applyAgingAction(batch(),'hold',{by,reason:'Waiting for bottles',now});
    expect(agingView(b,'2026-11-05').status).toBe('On Hold');
    b=applyAgingAction(b,'resume',{by,now});expect(agingView(b,'2026-11-05').status).toBe('Macerating');
    b=applyAgingAction(b,'archive',{by,now});expect(agingView(b,'2026-11-05').status).toBe('Archived');
    expect(b.history.map(h=>`${h.field}:${h.from}>${h.to}`)).toEqual(['onHold:—>Yes','onHold:Yes>No','archived:—>Yes']);
  });
  it('editing the schedule records every changed value and never touches other batches',()=>{
    const a=batch(),other=batch({id:'b',batchNumber:'B-2'});
    const edited=applyBatchEdit(a,{date:'2026-11-01',actualYield:480,macerationDays:21,maturationDays:30,notes:''},{by,reason:'Needs longer',now});
    expect(edited.macerationDate).toBe('2026-11-22');expect(edited.expectedReadyDate).toBe('2026-12-23');
    expect(edited.history.map(h=>h.field)).toEqual(expect.arrayContaining(['actualYield','macerationDays','macerationDate','maturationStart','maturationDate','expectedReadyDate']));
    expect(edited.history.every(h=>h.reason==='Needs longer'&&h.by===by)).toBe(true);
    expect(other.macerationDate).toBe('2026-11-15');expect(other.history).toBeUndefined();
    expect(a.history).toBeUndefined();
  });
  it('detects when a form changes the schedule',()=>{
    const b=batch(),same={date:'2026-11-01',actualYield:500,macerationDays:14,maturationDays:30};
    expect(scheduleChanged(b,same)).toBe(false);expect(scheduleChanged(b,{...same,maturationDays:31})).toBe(true);
  });
});

describe('counters and production status',()=>{
  it('counts batches by aging status, excluding archived and finished ones',()=>{
    const list=[batch(),batch({id:'2',macerationDays:1,macerationStart:'2026-10-01',date:'2026-10-01',...buildSchedule({productionDate:'2026-10-01',macerationDays:1,maturationDays:40})}),batch({id:'3',onHold:true}),batch({id:'4',archived:true}),batch({id:'5',status:'Completed'})];
    expect(agingCounts(list,'2026-11-05')).toEqual({total:4,macerating:1,maturing:1,ready:0,onHold:1,archived:1});
  });
  it('production status follows forward only',()=>{
    expect(syncProductionStatus(batch(),'2026-11-05').status).toBe('Maceration');
    expect(syncProductionStatus(batch({status:'Mixing'}),'2026-11-05').status).toBe('Maceration');
    expect(syncProductionStatus(batch({status:'Maturing'}),'2026-11-05').status).toBe('Maturing');
    expect(syncProductionStatus(batch({status:'Planned'}),'2026-10-30').status).toBe('Planned');
    expect(syncProductionStatus(batch(),'2026-11-16').status).toBe('Maturing');
    expect(syncProductionStatus(batch(),'2026-12-16').status).toBe('Bottling');
    expect(syncProductionStatus(batch({status:'Bottling'}),'2026-11-16').status).toBe('Bottling');
    expect(syncProductionStatus(batch({status:'Completed'}),'2026-12-16').status).toBe('Completed');
    expect(syncProductionStatus(batch({onHold:true}),'2026-12-16').status).toBe('Planned');
    const list=[batch()];expect(syncProductionStatuses(list,'2026-10-30')).toBe(list);expect(syncProductionStatuses(list,'2026-11-05')).not.toBe(list);
  });
});


describe('validation uses the recorded maceration end',()=>{
  it('compares maturation start with the day maceration actually finished',()=>{
    const input={name:'x',date:'2026-11-01',actualYield:5,macerationDays:25,maturationDays:20,maturationStart:'2026-11-06',macerationDoneOn:'2026-11-05'};
    expect(validateBatch(input)).toEqual([]);
    expect(validateBatch({...input,macerationDoneOn:''}).join()).toMatch(/override/);
  });
});
