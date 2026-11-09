import {num} from './logic';
import {addDays,daysBetween,localDate} from './production';

// Aging statuses are worked out from dates and recorded completion events. On Hold and Archived are explicit overrides.
export const agingStatuses=['Scheduled','Macerating','Maturing','On Hold','Ready for Bottling','Archived'];
const finished=batch=>['Completed','Cancelled'].includes(batch.status||'Planned');

// Every batch has its own schedule. Older batches only stored end dates, so durations are worked out from them.
export function scheduleOf(batch){
  const productionDate=batch.date||'';
  const macerationStart=batch.macerationStart||productionDate;
  const macerationDate=batch.macerationDate||'';
  const macerationDays=batch.macerationDays??(macerationDate&&macerationStart?daysBetween(macerationStart,macerationDate):0);
  const maturationStart=batch.maturationStart||(macerationDate?addDays(macerationDate,1):macerationStart);
  const maturationDate=batch.maturationDate||'';
  const maturationDays=batch.maturationDays??(maturationDate&&maturationStart?daysBetween(maturationStart,maturationDate):0);
  return {productionDate,macerationStart,macerationDays,macerationDate,maturationStart,maturationDays,maturationDate,expectedReadyDate:maturationDate};
}

// Dates always follow from start + duration. Maturation starts the day after maceration ends unless you set it.
export function buildSchedule({productionDate,macerationStart,macerationDays,maturationStart,maturationDays}){
  const macStart=macerationStart||productionDate,macDays=Math.trunc(num(macerationDays)),matDays=Math.trunc(num(maturationDays));
  const macEnd=macStart&&macDays>0?addDays(macStart,macDays):'';
  const matStart=maturationStart||(macEnd?addDays(macEnd,1):'');
  const matEnd=matStart&&matDays>0?addDays(matStart,matDays):'';
  return {macerationStart:macStart,macerationDays:macDays,macerationDate:macEnd,maturationStart:matStart,maturationDays:matDays,maturationDate:matEnd,expectedReadyDate:matEnd};
}

// Returns a list of problems (empty when the batch can be saved).
export function validateBatch(input,{override=false}={}){
  const problems=[];
  if(!input.name)problems.push('Choose a scent.');
  if(!input.date)problems.push('Enter the production date.');
  if(!(num(input.actualYield)>0))problems.push('Actual yield must be more than 0 ml.');
  const s=buildSchedule({productionDate:input.date,macerationStart:input.macerationStart,macerationDays:input.macerationDays,maturationStart:input.maturationStart,maturationDays:input.maturationDays});
  if(!(Number.isInteger(num(input.macerationDays))&&num(input.macerationDays)>=1))problems.push('Maceration duration must be at least 1 whole day.');
  if(!(Number.isInteger(num(input.maturationDays))&&num(input.maturationDays)>=1))problems.push('Maturation duration must be at least 1 whole day.');
  if(input.date&&s.macerationStart&&s.macerationStart<input.date)problems.push('Maceration cannot start before the production date.');
  const macerationEnd=input.macerationDoneOn||s.macerationDate;// the day maceration actually finished, once recorded
  if(macerationEnd&&s.maturationStart&&s.maturationStart<=macerationEnd&&!override)problems.push('Maturation starts before maceration ends. Tick the override box to allow it.');
  if(s.maturationStart&&s.macerationStart&&s.maturationStart<s.macerationStart)problems.push('Maturation cannot start before maceration starts.');
  return problems;
}

const clamp=value=>Math.min(100,Math.max(0,value));

// Progress is always calculated from today's date: elapsed days / total days. Nothing is stored.
export function stageProgress(start,end,actualEnd,today=localDate()){
  if(!start||!end)return {state:'Not set',percent:actualEnd?100:0,daysLeft:null,start,end,completedOn:actualEnd||''};
  const total=Math.max(1,daysBetween(start,end)),elapsed=daysBetween(start,today),daysLeft=Math.max(0,daysBetween(today,end));
  if(actualEnd)return {state:'Completed',percent:100,daysLeft:0,start,end,completedOn:actualEnd};
  if(today<start)return {state:'Scheduled',percent:0,daysLeft:daysBetween(today,end),start,end,completedOn:''};
  if(today>=end)return {state:'Completed',percent:100,daysLeft:0,start,end,completedOn:end,auto:true};
  return {state:'In progress',percent:Math.round(clamp(elapsed/total*100)),daysLeft,start,end,completedOn:''};
}

export function agingView(batch,today=localDate()){
  const s=scheduleOf(batch);
  const maceration=stageProgress(s.macerationStart,s.macerationDate,batch.macerationDoneOn||'',today);
  const maturation=stageProgress(s.maturationStart,s.maturationDate,batch.maturationDoneOn||'',today);
  const macDone=maceration.state==='Completed',matDone=maturation.state==='Completed'&&Boolean(s.maturationDate||batch.maturationDoneOn);
  let status='Macerating';
  if(batch.archived)status='Archived';
  else if(batch.onHold)status='On Hold';
  else if(matDone)status='Ready for Bottling';
  else if(macDone)status='Maturing';
  else if(maceration.state==='Scheduled')status='Scheduled';
  const first=s.macerationStart,last=s.maturationDate,total=first&&last?Math.max(1,daysBetween(first,last)):0;
  const percent=matDone?100:total?Math.round(clamp(daysBetween(first,today)/total*100)):0;
  const planned=first&&last?daysBetween(first,last):0;
  return {status,schedule:s,maceration,maturation,overall:{percent,planned,stage:status,expectedReadyDate:s.expectedReadyDate}};
}

// The production status you already use (Mixing, Maturing, Bottling, Completed) follows the aging schedule forward, never backward.
const rank={Planned:0,Mixing:1,Maceration:2,Maturing:3,Bottling:4};
export function syncProductionStatus(batch,today=localDate()){
  if(finished(batch)||batch.archived||batch.onHold||!(batch.status in rank))return batch;
  const {status}=agingView(batch,today),target=status==='Ready for Bottling'?'Bottling':status==='Maturing'?'Maturing':status==='Macerating'?'Maceration':null;
  return target&&rank[batch.status]<rank[target]?{...batch,status:target}:batch;
}
export function syncProductionStatuses(batches,today=localDate()){
  let changed=false;
  const next=batches.map(batch=>{const result=syncProductionStatus(batch,today);if(result!==batch)changed=true;return result});
  return changed?next:batches;
}

// Counters for the top of the Batches page.
export function agingCounts(batches,today=localDate()){
  const counts={total:0,macerating:0,maturing:0,ready:0,onHold:0,archived:0};
  for(const batch of batches){
    const {status}=agingView(batch,today);
    if(status==='Archived'){counts.archived+=1;continue}
    counts.total+=1;
    if(finished(batch))continue;
    if(status==='Macerating')counts.macerating+=1;
    else if(status==='Maturing')counts.maturing+=1;
    else if(status==='Ready for Bottling')counts.ready+=1;
    else if(status==='On Hold')counts.onHold+=1;
  }
  return counts;
}

// ---- Change history. Each entry keeps the previous value, the new value, who changed it, when, and why. ----
const fieldLabels={actualYield:'Actual yield (ml)',date:'Production date',macerationStart:'Maceration start',macerationDays:'Maceration duration (days)',macerationDate:'Maceration end',maturationStart:'Maturation start',maturationDays:'Maturation duration (days)',maturationDate:'Maturation end',expectedReadyDate:'Expected ready date',macerationDoneOn:'Maceration completed on',maturationDoneOn:'Maturation completed on',onHold:'On hold',archived:'Archived',notes:'Notes'};
const shown=value=>value===undefined||value===null||value===''?'—':value===true?'Yes':value===false?'No':String(value);
export function historyEntries(before,after,fields,{by,reason,now=new Date()}){
  return fields.filter(field=>shown(before[field])!==shown(after[field])).map(field=>({id:`${now.getTime()}-${field}`,at:now.toISOString(),by,field,label:fieldLabels[field]||field,from:shown(before[field]),to:shown(after[field]),reason:reason||''}));
}
export const scheduleFields=['date','actualYield','macerationStart','macerationDays','macerationDate','maturationStart','maturationDays','maturationDate','expectedReadyDate'];

// Manual updates. Each returns the new batch with its history recorded. A schedule change moves the expected ready date.
export function applyAgingAction(batch,action,{date=localDate(),reason='',by='Local workspace',now=new Date()}={}){
  let next={...batch},fields=[];
  const s=scheduleOf(batch);
  if(action==='macerationDone'){
    next.macerationDoneOn=date;fields.push('macerationDoneOn');
    // Maturation follows the day after maceration actually ended, keeping its own length.
    if(!batch.maturationDoneOn&&s.maturationDays>0){const sched=buildSchedule({productionDate:s.productionDate,macerationStart:s.macerationStart,macerationDays:s.macerationDays,maturationStart:addDays(date,1),maturationDays:s.maturationDays});Object.assign(next,{maturationStart:sched.maturationStart,maturationDate:sched.maturationDate,expectedReadyDate:sched.expectedReadyDate});fields.push('maturationStart','maturationDate','expectedReadyDate')}
  }
  else if(action==='maturationDone'){next.maturationDoneOn=date;fields.push('maturationDoneOn')}
  else if(action==='reopenMaceration'){next.macerationDoneOn='';fields.push('macerationDoneOn')}
  else if(action==='reopenMaturation'){next.maturationDoneOn='';fields.push('maturationDoneOn')}
  else if(action==='hold'){next.onHold=true;next.holdReason=reason;fields.push('onHold')}
  else if(action==='resume'){next.onHold=false;next.holdReason='';fields.push('onHold')}
  else if(action==='archive'){next.archived=true;fields.push('archived')}
  else if(action==='unarchive'){next.archived=false;fields.push('archived')}
  else return batch;
  const entries=historyEntries(batch,next,fields,{by,reason,now});
  return syncProductionStatus({...next,updatedBy:by,updatedAt:now.toISOString(),history:[...(batch.history||[]),...entries]});
}

// Saving the form: only the batch with this ID changes. Every changed schedule value is written to its history.
export function applyBatchEdit(batch,input,{by='Local workspace',reason='',now=new Date()}={}){
  const sched=buildSchedule({productionDate:input.date,macerationStart:input.macerationStart,macerationDays:input.macerationDays,maturationStart:input.maturationStart,maturationDays:input.maturationDays});
  const next={...batch,date:input.date,targetBasis:input.targetBasis||batch.targetBasis||'output',targetAmount:num(input.targetAmount??batch.targetAmount),bottleSize:num(input.bottleSize??batch.bottleSize),bottles:num(input.bottles??batch.bottles),actualYield:num(input.actualYield),actualMaterialUsage:input.actualMaterialUsage||batch.actualMaterialUsage||[],notes:input.notes||'',...sched,updatedBy:by,updatedAt:now.toISOString()};
  const entries=historyEntries(batch,next,[...scheduleFields,'notes'],{by,reason,now});
  return syncProductionStatus({...next,history:[...(batch.history||[]),...entries]});
}
export const scheduleChanged=(batch,input)=>{
  const sched=buildSchedule({productionDate:input.date,macerationStart:input.macerationStart,macerationDays:input.macerationDays,maturationStart:input.maturationStart,maturationDays:input.maturationDays});
  const before=scheduleOf(batch);
  return ['macerationStart','macerationDays','macerationDate','maturationStart','maturationDays','maturationDate'].some(key=>shown(before[key])!==shown(sched[key]))||shown(batch.date)!==shown(input.date)||num(batch.actualYield)!==num(input.actualYield);
};
