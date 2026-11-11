import {useMemo,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,Pencil} from 'lucide-react';
import {calculate,num} from './logic';
import {addDays,daysBetween,localDate} from './production';
import {formulaOutputVolume,measurementUnit} from './production';
import {buildSchedule,scheduleChanged,scheduleOf,validateBatch} from './aging';
import {formatDay,formatRange} from './AgingBars';

function FormulaDetails({formula,data,referenceVolume,targetVolume,targetUnit}){
  const rows=(formula.ingredients||[]).map(row=>({...row,material:data.ingredients.find(item=>item.id===row.materialId)}));
  const oil=rows.filter(row=>row.material?.category==='Fragrance Oil');
  const other=rows.filter(row=>row.material?.category!=='Fragrance Oil');
  const inspiredBy=formula.inspiredBy||oil.find(row=>row.material?.inspiredBy)?.material.inspiredBy;
  const oilPercentage=oil.reduce((sum,row)=>sum+num(row.percentage),0);
  const ingredient=row=><div className="bf-formula-ingredient" key={row.id}><span>{row.material?.name||row.name||'Material'}</span><strong>{num(row.percentage).toFixed(2)}%</strong></div>;
  return <div className="bf-wide bf-formula-details" aria-label="Selected formula details">
    <div className="bf-formula-details-head"><div><small>SELECTED FORMULA</small><strong>{formula.name}</strong>{inspiredBy&&<span className="bf-formula-inspired">Inspired by {inspiredBy}</span>}</div>{formula.code&&<span>{formula.code}</span>}</div>
    <div className="bf-formula-facts"><div><strong>{num(targetVolume).toFixed(2)} <em>{targetUnit}</em></strong><span>Volume to create</span></div><div><strong>{oilPercentage.toFixed(2)}<em>%</em></strong><span>Fragrance oil</span></div><div><strong>{rows.length}</strong><span>Materials</span></div></div>
    <details className="bf-formula-ingredient-toggle"><summary>View ingredients <span>{rows.length}</span></summary><div className="bf-formula-ingredient-groups"><section><h4>Fragrance oil</h4>{oil.map(ingredient)}</section><section><h4>Other raw materials</h4>{other.map(ingredient)}</section></div></details>
  </div>;
}

function UsageRow({row,planned,editing,onChange,onToggle}){
  return <div className="bf-usage-row">
    <div className="bf-usage-name"><strong>{row.name}</strong><small>{num(planned?.percentage).toFixed(2)}% of formula</small>{row.density>0&&<small>Density {num(row.density).toFixed(2)} g/mL</small>}</div>
    <div className="bf-usage-amount"><input aria-label={`Quantity used for ${row.name} in ${row.unit}`} readOnly={!editing} type="number" min="0" step="any" value={row.quantity} onChange={event=>onChange(event.target.value)}/><span>{row.unit}</span></div>
    <button type="button" className="bf-usage-edit" aria-label={`${editing?'Save':'Edit'} quantity for ${row.name}`} onClick={event=>onToggle(row.materialId,event.currentTarget)}>{editing?<Check size={16}/>:<Pencil size={16}/>}</button>
    <small className="bf-usage-planned">Planned {num(planned?.quantity).toFixed(2)} {row.unit}</small>
  </div>;
}

// The Add New Batch page. The same page edits an existing batch (the scent is then fixed and a reason is asked for schedule changes).
export default function BatchForm({data,batch,onSave,onCancel}){
  const editing=Boolean(batch);
  const [f,setF]=useState(()=>{
    if(editing){
      const s=scheduleOf(batch);
      const basis=batch.targetBasis||'output',target=batch.targetAmount??batch.expectedYield??'',actual=batch.actualYield??'';
      return {formulaId:batch.formulaId||'',date:batch.date,targetBasis:basis,targetUnit:batch.targetUnit||measurementUnit(data.formulas.find(item=>item.id===batch.formulaId)),targetAmount:String(target),bottleSize:String(batch.bottleSize??''),bottles:String(batch.bottles??''),actualYield:String(actual),actualMaterialUsage:batch.actualMaterialUsage||[],notes:batch.notes||'',
        macerationStart:s.macerationStart===batch.date?'':s.macerationStart,macerationDays:String(s.macerationDays),
        maturationStart:s.maturationStart===(s.macerationDate?addDays(s.macerationDate,1):'')?'':s.maturationStart,maturationDays:String(s.maturationDays)};
    }
    const first=data.formulas[0];
    const firstAmount=first&&!first.formulationOnly?String(Math.round(calculate(first,data).volume*100)/100):'';
    return {formulaId:first?.id||'',date:localDate(),targetBasis:'output',targetUnit:'g',targetAmount:firstAmount,bottleSize:'',bottles:'',actualYield:firstAmount,actualMaterialUsage:[],notes:'',macerationStart:'',macerationDays:'14',maturationStart:'',maturationDays:'30'};
  });
  const [search,setSearch]=useState(''),[override,setOverride]=useState(false),[reason,setReason]=useState('');
  const [editingUsage,setEditingUsage]=useState(()=>new Set());
  const [step,setStep]=useState(0);
  const set=patch=>setF(current=>({...current,...patch}));
  const formula=data.formulas.find(item=>item.id===f.formulaId);
  const name=editing?batch.name:formula?.name||'';
  const input={name,date:f.date,targetBasis:f.targetBasis,targetUnit:f.targetUnit,targetAmount:num(f.targetAmount),bottleSize:num(f.bottleSize),bottles:num(f.bottles),actualYield:editing&&num(batch.actualYield)>0?num(batch.actualYield):(formula?formulaOutputVolume(formula,data,f.targetAmount,f.targetBasis,f.targetUnit):0),actualMaterialUsage:f.actualMaterialUsage,notes:f.notes,macerationStart:f.macerationStart||f.date,macerationDays:f.macerationDays,maturationStart:f.maturationStart,maturationDays:f.maturationDays,macerationDoneOn:batch?.macerationDoneOn||''};
  const schedule=useMemo(()=>buildSchedule({productionDate:f.date,macerationStart:input.macerationStart,macerationDays:f.macerationDays,maturationStart:f.maturationStart,maturationDays:f.maturationDays}),[f.date,input.macerationStart,f.macerationDays,f.maturationStart,f.maturationDays]);
  const problems=validateBatch(input,{override}).map(problem=>problem==='Actual yield must be more than 0 ml.'?(f.targetBasis==='oil'?'Enter a fragrance oil amount greater than 0.':'Enter a volume to make greater than 0 mL.'):problem);
  const needsReason=editing&&scheduleChanged(batch,input);
  const blocked=problems.length>0||(needsReason&&!reason.trim());
  const totalDays=schedule.macerationStart&&schedule.maturationDate?Math.max(0,daysBetween(schedule.macerationStart,schedule.maturationDate)):0;
  const scents=data.formulas.filter(item=>item.name?.toLowerCase().includes(search.trim().toLowerCase()));
  const materialUnit=f.targetUnit==='mL'?'mL':'g',targetUnit=f.targetBasis==='oil'?materialUnit:'mL';
  const referenceVolume=formula?calculate(formula,data).volume:0;
  const targetVolume=formula?formulaOutputVolume(formula,data,f.targetAmount,f.targetBasis,f.targetUnit):0;
  const oilPercentage=(formula?.ingredients||[]).filter(row=>data.ingredients.find(item=>item.id===row.materialId)?.category==='Fragrance Oil').reduce((sum,row)=>sum+num(row.percentage),0);
  const oilVolume=targetVolume*oilPercentage/100;
  const plannedCalculation=formula?calculate({...formula,nominalVolume:targetVolume||referenceVolume},data):null;
  const plannedUsage=(plannedCalculation?.rows||[]).map(row=>({materialId:row.materialId,name:row.name,unit:materialUnit,density:num(row.density),percentage:num(row.percentage),quantity:Number((materialUnit==='g'?num(row.grams):num(row.ml)).toFixed(2))}));
  const oilGrams=(plannedCalculation?.rows||[]).filter(row=>data.ingredients.find(item=>item.id===row.materialId)?.category==='Fragrance Oil').reduce((sum,row)=>sum+num(row.grams),0);
  const usage=(f.actualMaterialUsage?.length?f.actualMaterialUsage:plannedUsage).map(row=>({...row,density:num(row.density)||num(data.ingredients.find(item=>item.id===row.materialId)?.density)}));
  const totalMaterialGrams=usage.reduce((sum,row)=>sum+(row.unit==='g'?num(row.quantity):num(row.quantity)*num(row.density)),0);
  const oilUsage=usage.filter(row=>data.ingredients.find(item=>item.id===row.materialId)?.category==='Fragrance Oil');
  const otherUsage=usage.filter(row=>!oilUsage.includes(row));
  const toggleUsageEdit=(id,button)=>{const wasEditing=editingUsage.has(id);setEditingUsage(current=>{const next=new Set(current);if(wasEditing)next.delete(id);else next.add(id);return next});if(!wasEditing)requestAnimationFrame(()=>button.parentElement?.querySelector('input')?.focus())};
  const pickScent=id=>{const next=data.formulas.find(item=>item.id===id),volume=next?Math.round(calculate(next,data).volume*100)/100:0,amount=next&&!next.formulationOnly?String(volume):'';set({formulaId:id,targetAmount:f.targetBasis==='output'?amount:'',actualYield:f.targetBasis==='output'?amount:''})};
  const changeBasis=basis=>{const nextTarget=basis==='output'?(formula&&!formula.formulationOnly?String(Math.round(referenceVolume*100)/100):''):'';set({targetBasis:basis,targetAmount:nextTarget,actualYield:nextTarget})};
  const changeUnit=unit=>set({targetUnit:unit,targetAmount:f.targetBasis==='oil'&&num(f.targetAmount)>0?(unit==='g'?oilGrams:oilVolume).toFixed(2):f.targetAmount,actualMaterialUsage:[]});
  return <section className="card batch-form">
    <div className="card-head"><div><p className="eyebrow">{editing?'EDIT PRODUCTION':'NEW PRODUCTION'}</p><h2>{editing?batch.code||batch.productionCode:'Production Process'}</h2></div><button type="button" className="btn" onClick={onCancel}><ArrowLeft size={15}/> Back</button></div>
    <nav className="bf-steps" aria-label="Production process">{['Batch Planning','Materials','Aging & Review'].map((label,index)=><button type="button" key={label} className={`bf-step${step===index?' active':index<step?' done':''}`} aria-current={step===index?'step':undefined} onClick={()=>setStep(index)}><span className="bf-step-dot">{index<step?<Check size={14} strokeWidth={3}/>:index+1}</span><span>{label}</span></button>)}</nav>
    {step===0&&<details className="bf-group bf-production-info" open><summary><h3>Production information</h3><span className="bf-sum"><strong>{name||'No formula chosen'}</strong><small>{formatDay(f.date)} · {targetVolume.toFixed(2)} mL planned</small></span></summary>
      <div className="bf-grid">
        {editing&&<div className="bf-wide bf-auto-number"><span>Batch number</span><strong>{batch.batchNumber}</strong></div>}
        <div className="bf-wide bf-section-label">Scent and formula</div>
        {editing
          ?<label className="bf-wide"><span>Scent</span><input value={batch.name} disabled/></label>
          :<>
            <label className="bf-wide"><span>Find a scent</span><input type="search" placeholder="Search scents" value={search} onChange={event=>setSearch(event.target.value)}/></label>
            <label className="bf-wide bf-scent-select"><span>Selected formula</span><select value={f.formulaId} onChange={event=>pickScent(event.target.value)}>{scents.length?scents.map(item=><option key={item.id} value={item.id}>{item.name||'Untitled'}{item.code?` (${item.code})`:''}</option>):<option value="">No matching scent</option>}</select></label>
            {formula&&<FormulaDetails formula={formula} data={data} referenceVolume={referenceVolume} targetVolume={targetVolume} targetUnit={f.targetUnit}/>} 
          </>}
        <div className="bf-wide bf-section-label">Batch plan</div><label><span>Production date</span><input type="date" value={f.date} onChange={event=>set({date:event.target.value})}/></label>
<label className="bf-basis-field"><span>Calculation basis</span><select value={f.targetBasis} onChange={event=>changeBasis(event.target.value)}><option value="output">Volume to Make</option><option value="oil">By Fragrance Oil</option></select></label>
        <label className="bf-target-field"><span>{f.targetBasis==='oil'?'Fragrance oil amount':'Volume to make'}</span><span className="bf-target-input"><input type="number" min="0" step="any" placeholder={f.targetBasis==='oil'?'e.g. 85':'e.g. 500'} value={f.targetAmount} onChange={event=>set({targetAmount:event.target.value})}/><em>{targetUnit}</em></span></label>
        <label className="bf-unit-field"><span>Measure materials in</span><select value={materialUnit} onChange={event=>changeUnit(event.target.value)}><option value="g">Grams (g)</option><option value="mL">Milliliters (mL)</option></select></label>
        {f.targetBasis==='oil'&&num(f.targetAmount)>0&&<div className="bf-wide bf-planned-output"><div className="bf-calculation-facts"><div><small>1 · Fragrance oil</small><b>{num(f.targetAmount).toFixed(2)} {f.targetUnit}</b></div><div><small>2 · Oil volume</small><b>{oilVolume.toFixed(2)} mL</b></div><div><small>3 · Concentration</small><b>{oilPercentage.toFixed(2)}%</b></div></div><div className="bf-calculation-total"><span>Volume to make</span><strong>{targetVolume.toFixed(2)} mL</strong></div></div>}
      </div>
    </details>}
    {step===1&&<section className="bf-group bf-material-step"><h3>Materials to measure</h3>
<div className="bf-wide bf-measure-panel"><div className="bf-usage-concentration"><div><span>Target volume to make</span><strong>{targetVolume.toFixed(2)} {f.targetUnit}</strong><small>For this production batch</small></div><div><span>Total material used</span><strong>{totalMaterialGrams.toFixed(2)} g</strong><small>Combined material weight</small></div></div>
<div className="bf-wide bf-usage-block"><p>Quantities for this batch. Use the pencil to adjust an amount actually used.</p><div className="bf-material-usage">{[['Fragrance oil',oilUsage],['Other raw materials',otherUsage]].map(([title,rows])=>rows.length>0&&<section className="bf-usage-group" key={title}><h4>{title}</h4>{rows.map(row=><UsageRow key={row.materialId} row={row} planned={plannedUsage.find(item=>item.materialId===row.materialId)} editing={editingUsage.has(row.materialId)} onChange={value=>set({actualMaterialUsage:usage.map(item=>item.materialId===row.materialId?{...item,quantity:value}:item)})} onToggle={toggleUsageEdit}/>)}</section>)}</div></div></div><label className="bf-wide"><span>Production notes (optional)</span><textarea rows="2" value={f.notes} onChange={event=>set({notes:event.target.value})}/></label>
    </section>}
    {step===2&&<>
    <details className="bf-group bf-maceration" open><summary><h3>Maceration</h3><span className="bf-sum"><strong>{formatRange(schedule.macerationStart,schedule.macerationDate)}</strong><small>{schedule.macerationDays||0} day{schedule.macerationDays===1?'':'s'}</small></span></summary>
      <div className="bf-grid">
        <label><span>Start date</span><input type="date" value={f.macerationStart||f.date} min={f.date||undefined} onChange={event=>set({macerationStart:event.target.value})}/></label>
        <label><span>Duration (days)</span><input type="number" min="1" step="1" inputMode="numeric" value={f.macerationDays} onChange={event=>set({macerationDays:event.target.value})}/></label>
        <div className="bf-readout bf-wide"><span>End date</span><strong>{formatDay(schedule.macerationDate)}</strong></div>
      </div>
    </details>
    <details className="bf-group bf-maturation" open><summary><h3>Maturation</h3><span className="bf-sum"><strong>{formatRange(schedule.maturationStart,schedule.maturationDate)}</strong><small>{schedule.maturationDays||0} day{schedule.maturationDays===1?'':'s'}</small></span></summary>
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
        <div><dt>Planned output</dt><dd>{targetVolume>0?`${targetVolume.toFixed(2)} mL`:'Set a batch target'}</dd></div>
      </dl>
    </div>
    {needsReason&&<label className="bf-wide bf-reason"><span>Reason for changing the schedule or yield (required)</span><input value={reason} placeholder="For example: needs a longer maceration" onChange={event=>setReason(event.target.value)}/></label>}
    {problems.length>0&&<ul className="bf-problems">{problems.map(problem=><li key={problem}>{problem}</li>)}</ul>}
    </>}
    {step===0&&(!formula||targetVolume<=0)&&<p className="warning" role="status">{!formula?'Choose a formula to continue.':'Enter a batch amount greater than zero to continue.'}</p>}
    {step===2&&needsReason&&!reason.trim()&&<p className="warning" role="status">Enter a reason for the changes before saving.</p>}
    <div className="bf-actions"><button type="button" className="btn" onClick={step===0?onCancel:()=>setStep(step-1)}>{step===0?'Cancel':'Back'}</button>{step<2?<button type="button" className="btn primary" disabled={step===0&&(!formula||targetVolume<=0)} onClick={()=>setStep(step+1)}>Next <ArrowRight size={15}/></button>:<button type="button" className="btn primary" disabled={blocked} onClick={()=>onSave({...input,formulaId:f.formulaId},{reason:reason.trim(),override})}>{editing?'Save changes':'Save production'}</button>}</div>
  </section>;
}
