import {useMemo,useState} from 'react';
import {ArrowLeft} from 'lucide-react';
import {calculate,num} from './logic';
import {addDays,daysBetween,localDate} from './production';
import {formulaOutputVolume,measurementUnit} from './production';
import {buildSchedule,scheduleChanged,scheduleOf,validateBatch} from './aging';
import {formatDay,formatRange} from './AgingBars';

// The Add New Batch page. The same page edits an existing batch (the scent is then fixed and a reason is asked for schedule changes).
export default function BatchForm({data,batch,onSave,onCancel}){
  const editing=Boolean(batch);
  const [f,setF]=useState(()=>{
    if(editing){
      const s=scheduleOf(batch);
      const basis=batch.targetBasis||'output',target=batch.targetAmount??batch.expectedYield??'',actual=batch.actualYield??'';
      return {formulaId:batch.formulaId||'',date:batch.date,targetBasis:basis,targetAmount:String(target),bottleSize:String(batch.bottleSize??''),bottles:String(batch.bottles??''),actualYield:String(actual),actualMaterialUsage:batch.actualMaterialUsage||[],notes:batch.notes||'',
        macerationStart:s.macerationStart===batch.date?'':s.macerationStart,macerationDays:String(s.macerationDays),
        maturationStart:s.maturationStart===(s.macerationDate?addDays(s.macerationDate,1):'')?'':s.maturationStart,maturationDays:String(s.maturationDays)};
    }
    const first=data.formulas[0];
    const firstAmount=first&&!first.formulationOnly?String(Math.round(calculate(first,data).volume*100)/100):'';
    return {formulaId:first?.id||'',date:localDate(),targetBasis:'output',targetAmount:firstAmount,bottleSize:'',bottles:'',actualYield:firstAmount,actualMaterialUsage:[],notes:'',macerationStart:'',macerationDays:'14',maturationStart:'',maturationDays:'30'};
  });
  const [search,setSearch]=useState(''),[override,setOverride]=useState(false),[reason,setReason]=useState('');
  const set=patch=>setF(current=>({...current,...patch}));
  const formula=data.formulas.find(item=>item.id===f.formulaId);
  const name=editing?batch.name:formula?.name||'';
  const input={name,date:f.date,targetBasis:f.targetBasis,targetAmount:num(f.targetAmount),bottleSize:num(f.bottleSize),bottles:num(f.bottles),actualYield:f.actualYield,actualMaterialUsage:f.actualMaterialUsage,notes:f.notes,macerationStart:f.macerationStart||f.date,macerationDays:f.macerationDays,maturationStart:f.maturationStart,maturationDays:f.maturationDays,macerationDoneOn:batch?.macerationDoneOn||''};
  const schedule=useMemo(()=>buildSchedule({productionDate:f.date,macerationStart:input.macerationStart,macerationDays:f.macerationDays,maturationStart:f.maturationStart,maturationDays:f.maturationDays}),[f.date,input.macerationStart,f.macerationDays,f.maturationStart,f.maturationDays]);
  const problems=validateBatch(input,{override});
  const needsReason=editing&&scheduleChanged(batch,input);
  const blocked=problems.length>0||(needsReason&&!reason.trim());
  const totalDays=schedule.macerationStart&&schedule.maturationDate?Math.max(0,daysBetween(schedule.macerationStart,schedule.maturationDate)):0;
  const scents=data.formulas.filter(item=>item.name?.toLowerCase().includes(search.trim().toLowerCase()));
  const materialUnit=measurementUnit(formula),targetUnit=f.targetBasis==='oil'?materialUnit:'mL';
  const referenceVolume=formula?calculate(formula,data).volume:0;
  const targetVolume=formula?formulaOutputVolume(formula,data,f.targetAmount,f.targetBasis):0;
  const actualVolume=formula?formulaOutputVolume(formula,data,f.actualYield,'output'):0;
  const plannedCalculation=formula?calculate({...formula,nominalVolume:actualVolume||targetVolume||referenceVolume},data):null;
  const oilPercentage=num(formula?.concentration)||0,gramTotal=materialUnit==='g'&&f.targetBasis==='oil'&&oilPercentage>0?num(f.targetAmount)/(oilPercentage/100):0;
  const plannedUsage=(plannedCalculation?.rows||[]).map(row=>({materialId:row.materialId,name:row.name,unit:materialUnit==='g'?'g':row.unit,quantity:materialUnit==='g'?(gramTotal?gramTotal*num(row.percentage)/100:num(row.grams)):num(row.ml)}));
  const usage=f.actualMaterialUsage?.length?f.actualMaterialUsage:plannedUsage;
  const pickScent=id=>{const next=data.formulas.find(item=>item.id===id),volume=next?Math.round(calculate(next,data).volume*100)/100:0,amount=next&&!next.formulationOnly?String(volume):'';set({formulaId:id,targetAmount:f.targetBasis==='output'?amount:'',actualYield:f.targetBasis==='output'?amount:''})};
  const changeBasis=basis=>{const nextTarget=basis==='output'?(formula&&!formula.formulationOnly?String(Math.round(referenceVolume*100)/100):''):'';set({targetBasis:basis,targetAmount:nextTarget,actualYield:nextTarget})};
  return <section className="card batch-form">
    <div className="card-head"><div><p className="eyebrow">{editing?'EDIT PRODUCTION':'NEW PRODUCTION'}</p><h2>{editing?batch.code||batch.productionCode:'Create Production'}</h2></div><button type="button" className="btn" onClick={onCancel}><ArrowLeft size={15}/> Back</button></div>
    <details className="bf-group" open={!editing}><summary><h3>Production information</h3><span className="bf-sum"><strong>{name||'No formula chosen'}</strong><small>{formatDay(f.date)} · {num(f.actualYield)} mL actual</small></span></summary>
      <div className="bf-grid">
        <label className="bf-wide"><span>Batch number</span><input value={editing?batch.batchNumber:'Assigned automatically when saved'} disabled/></label>
        {editing
          ?<label className="bf-wide"><span>Scent</span><input value={batch.name} disabled/></label>
          :<>
            <label className="bf-wide"><span>Scent</span><input type="search" placeholder="Search scents" value={search} onChange={event=>setSearch(event.target.value)}/></label>
            <label className="bf-wide"><span>Choose scent</span><select value={f.formulaId} onChange={event=>pickScent(event.target.value)}>{scents.length?scents.map(item=><option key={item.id} value={item.id}>{item.name||'Untitled'}{item.code?` (${item.code})`:''}</option>):<option value="">No matching scent</option>}</select></label>
          </>}
        <label><span>Production date</span><input type="date" value={f.date} onChange={event=>set({date:event.target.value})}/></label>
<label><span>Desired output basis</span><select value={f.targetBasis} onChange={event=>changeBasis(event.target.value)}><option value="oil">By fragrance oil</option><option value="output">By total output</option></select></label>
        <label><span>{f.targetBasis==='oil'?'Fragrance oil target':'Total output target'} ({targetUnit})</span><input type="number" min="0" step="any" value={f.targetAmount} onChange={event=>set({targetAmount:event.target.value})}/></label>
        <label><span>Bottle size (mL)</span><input type="number" min="0" step="any" value={f.bottleSize} onChange={event=>set({bottleSize:event.target.value})}/></label>
        <label><span>Number of bottles</span><input type="number" min="0" step="1" value={f.bottles} onChange={event=>set({bottles:event.target.value})}/></label>
        <label><span>Actual output (mL)</span><input type="number" min="0" step="any" inputMode="decimal" value={f.actualYield} onChange={event=>set({actualYield:event.target.value})}/></label>
<div className="bf-wide"><span>Actual material quantities used</span><small className="bf-usage-note">Planned quantities are based on the selected batch size. Adjust each value to record what was actually used.</small><div className="bf-material-usage">{usage.map(row=>{const planned=plannedUsage.find(item=>item.materialId===row.materialId);return <label key={row.materialId}><span>{row.name} ({row.unit})<small>Planned: {num(planned?.quantity)} {row.unit}</small></span><input aria-label={`Actual quantity used for ${row.name}`} type="number" min="0" step="any" value={row.quantity} onChange={event=>set({actualMaterialUsage:usage.map(item=>item.materialId===row.materialId?{...item,quantity:event.target.value}:item)})}/></label>})}</div></div>
        <label className="bf-wide"><span>Production notes (optional)</span><textarea rows="2" value={f.notes} onChange={event=>set({notes:event.target.value})}/></label>
      </div>
    </details>
    <details className="bf-group" open={!editing}><summary><h3>Maceration</h3><span className="bf-sum"><strong>{formatRange(schedule.macerationStart,schedule.macerationDate)}</strong><small>{schedule.macerationDays||0} day{schedule.macerationDays===1?'':'s'}</small></span></summary>
      <div className="bf-grid">
        <label><span>Start date</span><input type="date" value={f.macerationStart||f.date} min={f.date||undefined} onChange={event=>set({macerationStart:event.target.value})}/></label>
        <label><span>Duration (days)</span><input type="number" min="1" step="1" inputMode="numeric" value={f.macerationDays} onChange={event=>set({macerationDays:event.target.value})}/></label>
        <div className="bf-readout bf-wide"><span>End date</span><strong>{formatDay(schedule.macerationDate)}</strong></div>
      </div>
    </details>
    <details className="bf-group" open={!editing}><summary><h3>Maturation</h3><span className="bf-sum"><strong>{formatRange(schedule.maturationStart,schedule.maturationDate)}</strong><small>{schedule.maturationDays||0} day{schedule.maturationDays===1?'':'s'}</small></span></summary>
      <div className="bf-grid">
        <label><span>Start date {!f.maturationStart&&<em>(day after maceration)</em>}</span><input type="date" value={f.maturationStart||schedule.maturationStart||''} onChange={event=>set({maturationStart:event.target.value})}/></label>
        <label><span>Duration (days)</span><input type="number" min="1" step="1" inputMode="numeric" value={f.maturationDays} onChange={event=>set({maturationDays:event.target.value})}/></label>
        <div className="bf-readout bf-wide"><span>End date</span><strong>{formatDay(schedule.maturationDate)}</strong></div>
      </div>
      {f.maturationStart&&<button type="button" className="btn bf-reset" onClick={()=>set({maturationStart:''})}>Start the day after maceration ends</button>}
      <label className="bf-check"><input type="checkbox" checked={override} onChange={event=>setOverride(event.target.checked)}/> Allow maturation to start before maceration ends (override)</label>
    </details>
    <div className="bf-summary" aria-label="Schedule summary">
      <div className="bf-hero"><span>Expected ready date</span><strong>{formatDay(schedule.expectedReadyDate)}</strong><small>{totalDays} total aging day{totalDays===1?'':'s'}</small></div>
      <dl className="bf-rows">
        <div><dt>Maceration</dt><dd>{formatRange(schedule.macerationStart,schedule.macerationDate)}<small>{schedule.macerationDays||0} day{schedule.macerationDays===1?'':'s'}</small></dd></div>
        <div><dt>Maturation</dt><dd>{formatRange(schedule.maturationStart,schedule.maturationDate)}<small>{schedule.maturationDays||0} day{schedule.maturationDays===1?'':'s'}</small></dd></div>
        <div><dt>Actual output</dt><dd>{num(f.actualYield)} mL</dd></div><div><dt>Planned bottles</dt><dd>{num(f.bottles)||'—'}</dd></div>
      </dl>
    </div>
    {needsReason&&<label className="bf-wide bf-reason"><span>Reason for changing the schedule or yield (required)</span><input value={reason} placeholder="For example: needs a longer maceration" onChange={event=>setReason(event.target.value)}/></label>}
    {problems.length>0&&<ul className="bf-problems">{problems.map(problem=><li key={problem}>{problem}</li>)}</ul>}
    <div className="bf-actions"><button type="button" className="btn" onClick={onCancel}>Cancel</button><button type="button" className="btn primary" disabled={blocked} onClick={()=>onSave({...input,formulaId:f.formulaId},{reason:reason.trim(),override})}>{editing?'Save changes':'Save production'}</button></div>
  </section>;
}
