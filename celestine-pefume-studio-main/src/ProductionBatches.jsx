import {useEffect,useMemo,useState} from 'react';
import {Archive,Check,ChevronDown,Eye,Pencil,Plus,RefreshCw,Search} from 'lucide-react';
import {calculate,num,uid} from './logic';
import {snapshotPricing} from './pricing';
import {deductSuppliesForBatch,stockDiffEntries} from './stock';
import {completeBatchInventory,formulaOutputVolume,inventoryShortages,localDate,nextBatchNumber} from './production';
import {nextProductionCode} from './productionCode';
import {agingCounts,agingStatuses,agingView,applyAgingAction,applyBatchEdit,buildSchedule,historyEntries,resumeProductionStatus,syncProductionStatus} from './aging';
import AgingBars,{formatDay,statusClass} from './AgingBars';
import BatchForm from './BatchForm';
import BatchDetail from './BatchDetail';

const Counter=({label,title,value,tone,active,onClick})=><button type="button" title={title||label} aria-pressed={active} className={`bc-counter bc-${tone}${active?' is-active':''}`} onClick={onClick}><strong>{value}</strong><span>{label}</span></button>;

const ProductionStageSteps=({aging})=>{
  const steps=[
    ['Batch Planning',true,false],
    ['Materials',true,false],
    ['Aging & Review',true,false],
    ['Maceration',aging.maceration.state==='Completed',aging.status==='Macerating'],
    ['Matured',aging.maturation.state==='Completed',aging.status==='Maturing'],
    ['Ready',aging.status==='Ready for Distribution',false]
  ];
  return <div className="bc-stage-process"><strong>Production process stages</strong><div className="production-stage-steps costing-steps" role="list" aria-label="Production process stages">{steps.map(([label,done,active],index)=><div className={`cs-step ${done?'cs-done':active?'cs-active':'cs-todo'}`} role="listitem" key={label}><span className="cs-dot">{done?<Check size={14} strokeWidth={3}/>:index+1}</span><span className="cs-label">{label}</span></div>)}</div></div>;
};

export default function ProductionBatches({data,by='Local workspace',onChange,onNotice,initialView}){
  const [view,setView]=useState(()=>{let saved;try{saved=JSON.parse(sessionStorage.getItem('studio-production-view')||'null')}catch{}if(initialView?.id&&data.batches.some(batch=>batch.id===initialView.id))return initialView;return saved?.mode==='detail'&&data.batches.some(batch=>batch.id===saved.id)?saved:{mode:'list'}}),[query,setQuery]=useState(''),[scent,setScent]=useState('all'),[stage,setStage]=useState('active');
  useEffect(()=>{try{sessionStorage.setItem('studio-production-view',JSON.stringify(view.mode==='detail'?view:{mode:'list'}))}catch{}},[view]);
  const [open,setOpen]=useState(()=>new Set());
  useEffect(()=>{if(!['new','edit'].includes(view.mode))return;const warn=event=>{event.preventDefault();event.returnValue=''};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[view.mode]);
  const productions=data.productions||data.batches||[];
  const toggle=id=>setOpen(current=>{const next=new Set(current);if(next.has(id))next.delete(id);else next.add(id);return next});
  const today=localDate();
  const counts=useMemo(()=>agingCounts(productions,today),[productions,today]);
  const names=[...new Set(productions.map(batch=>batch.name||'Untitled'))].sort((a,b)=>a.localeCompare(b));
  const rows=productions.map(batch=>({batch,aging:agingView(batch,today)}));
  const shown=rows.filter(({batch,aging})=>{
    if(stage==='active'?aging.status==='Archived':stage!=='all'&&aging.status!==stage)return false;
    if(scent!=='all'&&(batch.name||'Untitled')!==scent)return false;
    const text=query.trim().toLowerCase();
    return !text||[batch.batchNumber,batch.name,aging.status,batch.notes].some(value=>String(value||'').toLowerCase().includes(text));
  }).reverse();
  const replace=(batch,next,extra={})=>{const nextList=productions.map(item=>item.id===batch.id?next:item);onChange({...data,...extra,productions:nextList,batches:nextList})};

  // A new batch always gets its own number, its own yield and its own schedule.
  const create=(input,{reason})=>{
    const formula=data.formulas.find(item=>item.id===input.formulaId);
    if(!formula){onNotice('Choose a scent first.');return}
    const calc=calculate(formula,data),quantity=formula.pricingQuantity??calc.bottles,pricingSnapshot=snapshotPricing(calc.unitBottleCost,quantity,formula.pricingTiers),now=new Date();
    const schedule=buildSchedule({productionDate:input.date,macerationStart:input.macerationStart,macerationDays:input.macerationDays,maturationStart:input.maturationStart,maturationDays:input.maturationDays});
    const productionCode=nextProductionCode(data.productions||data.batches),targetVolume=formulaOutputVolume(formula,data,input.targetAmount,input.targetBasis,input.targetUnit)||calc.volume,actualVolume=formulaOutputVolume(formula,data,input.actualYield,'output')||targetVolume,productionFormula={...formula,bottleSize:num(input.bottleSize)||formula.bottleSize,bottles:num(input.bottles)||quantity,nominalVolume:actualVolume};
    const actualCalculation=calculate(productionFormula,data),usage=input.actualMaterialUsage?.length?input.actualMaterialUsage.map(row=>({...row,quantity:num(row.quantity)})):actualCalculation.rows.map(row=>({materialId:row.materialId,name:row.name,unit:row.unit,quantity:row.unit==='g'?num(row.grams):num(row.ml)})),base={id:uid(),code:productionCode,productionCode,legacyBatchNumber:'',batchNumber:nextBatchNumber(data.batches,input.date),formulaId:formula.id,name:formula.name,date:input.date,status:'Planned',...schedule,notes:input.notes||'',targetBasis:input.targetBasis,targetUnit:input.targetUnit,targetAmount:num(input.targetAmount),bottleSize:num(input.bottleSize),bottles:num(input.bottles)||quantity,expectedYield:targetVolume,actualYield:num(input.actualYield),productionCost:actualCalculation.productionCost,costPerBottle:actualCalculation.unitBottleCost,projectedGrossProfit:pricingSnapshot.tiers[0]?.result.projectedProfit??0,formula:structuredClone(formula),formulaSnapshot:structuredClone(formula),calculation:structuredClone(actualCalculation),actualMaterialUsage:usage,pricingSnapshot,inventoryDeducted:false,createdBy:by,updatedBy:by,createdAt:now.toISOString(),updatedAt:now.toISOString()};
    const batch=syncProductionStatus({...base,history:[{id:`${now.getTime()}-created`,at:now.toISOString(),by,field:'created',label:'Production created',from:'—',to:base.code,reason:reason||''}]});
    onChange({...data,productions:[...(data.productions||data.batches),batch],batches:[...(data.productions||data.batches),batch]});
    onNotice(`Saved production ${batch.code}.`);setView({mode:'detail',id:batch.id});
  };
  // Saving the edit form changes only the batch with this ID and writes each change to its history.
  const saveEdit=(batch,input,{reason})=>{replace(batch,applyBatchEdit(batch,input,{by,reason}));onNotice(`Saved batch ${batch.batchNumber}.`);setView({mode:'detail',id:batch.id})};
  const act=(batch,action,options)=>{replace(batch,applyAgingAction(batch,action,options));onNotice(`Updated ${batch.batchNumber}.`)};
  const status=(batch,next)=>{
    const now=new Date(),mode=batch.statusMode||'auto';
    if(next==='auto'){
      const resumed=resumeProductionStatus(batch),entries=historyEntries({status:batch.status,statusMode:mode},{status:resumed.status,statusMode:'auto'},['statusMode','status'],{by,now});
      replace(batch,{...resumed,updatedBy:by,updatedAt:now.toISOString(),history:[...(batch.history||[]),...entries]});return;
    }
    const manualEntries=historyEntries({status:batch.status,statusMode:mode},{status:next==='manual'?batch.status:next,statusMode:'manual'},['statusMode','status'],{by,now});
    if(next==='manual'){
      replace(batch,{...batch,statusMode:'manual',updatedBy:by,updatedAt:now.toISOString(),history:[...(batch.history||[]),...manualEntries]});return;
    }
    if(next==='Completed'&&!batch.inventoryDeducted){
      const shortages=inventoryShortages(data.ingredients,batch.calculation);
      if(shortages.length){onNotice(`Cannot complete: insufficient ${shortages.map(item=>item.name).join(', ')}.`);return}
      const ingredients=completeBatchInventory(data.ingredients,batch),logged={...data,ingredients,stockLog:[...(data.stockLog||[]),...stockDiffEntries(data.ingredients,ingredients,'material','Batch',batch.batchNumber)]},used=deductSuppliesForBatch(logged,num(batch.bottles),batch.batchNumber);
      const nextList=productions.map(item=>item.id===batch.id?{...batch,status:next,statusMode:'manual',inventoryDeducted:true,updatedBy:by,updatedAt:now.toISOString(),history:[...(batch.history||[]),...manualEntries]}:item);onChange({...used.data,productions:nextList,batches:nextList});
      onNotice(used.short.length?`Batch completed. Not enough stock of: ${used.short.join(', ')}.`:'Batch completed and stock deducted.');return;
    }
    replace(batch,{...batch,status:next,statusMode:'manual',updatedBy:by,updatedAt:now.toISOString(),history:[...(batch.history||[]),...manualEntries]});
  };
  const remove=batch=>{const nextList=productions.filter(item=>item.id!==batch.id);onChange({...data,productions:nextList,batches:nextList});onNotice('Production deleted.');setView({mode:'list'})};

  if(view.mode==='new')return <BatchForm data={data} onSave={create} onCancel={()=>setView({mode:'list'})}/>;
  const current=view.id&&data.batches.find(item=>item.id===view.id);
  if(view.mode==='edit'&&current)return <BatchForm data={data} batch={current} onSave={(input,options)=>saveEdit(current,input,options)} onCancel={()=>setView({mode:'detail',id:current.id})}/>;
  if(view.mode==='detail'&&current)return <BatchDetail key={current.id} batch={current} by={by} focusUpdate={view.focus==='update'} onBack={()=>setView({mode:'list'})} onEdit={()=>setView({mode:'edit',id:current.id})} onAction={act} onStatus={status} onDelete={remove}/>;

  return <section className="card production-batches">
    <div className="card-head"><div><p className="eyebrow">PRODUCTION</p><h2>Production history</h2></div><button type="button" className="btn primary batch-add" disabled={!data.formulas.length} onClick={()=>setView({mode:'new'})}><Plus size={15}/> Create Production</button></div>
    <p className="bc-sep">Overview</p><div className="bc-counters">
      <Counter label="Total" title="Total batches" value={counts.total} tone="total" active={stage==='active'} onClick={()=>setStage('active')}/>
      <Counter label="Macerating" value={counts.macerating} tone="mac" active={stage==='Macerating'} onClick={()=>setStage(stage==='Macerating'?'active':'Macerating')}/>
      <Counter label="Maturing" value={counts.maturing} tone="mat" active={stage==='Maturing'} onClick={()=>setStage(stage==='Maturing'?'active':'Maturing')}/>
      <Counter label="Ready" title="Ready for distribution" value={counts.ready} tone="ready" active={stage==='Ready for Distribution'} onClick={()=>setStage(stage==='Ready for Distribution'?'active':'Ready for Distribution')}/>
      <Counter label="On hold" value={counts.onHold} tone="hold" active={stage==='On Hold'} onClick={()=>setStage(stage==='On Hold'?'active':'On Hold')}/>
    </div>
    {!data.formulas.length&&<p className="empty">Create a formula in the Formula Library first, then create production from it.</p>}
    {data.batches.length>0&&<p className="bc-sep">Search and filter</p>}{data.batches.length>0&&<div className="bc-filters"><span className="bc-filter-note">{shown.length} of {data.batches.length} batch{data.batches.length===1?'':'es'}{stage!=='active'||scent!=='all'||query?' · filtered':''}</span>
      <label className="bc-search"><Search size={15} aria-hidden="true"/><input type="search" placeholder="Search batch number or scent" value={query} onChange={event=>setQuery(event.target.value)}/></label>
      <select aria-label="Scent" value={names.includes(scent)?scent:'all'} onChange={event=>setScent(event.target.value)}><option value="all">All scents</option>{names.map(name=><option key={name} value={name}>{name}</option>)}</select>
      <select aria-label="Aging status" value={stage} onChange={event=>setStage(event.target.value)}><option value="active">All active</option><option value="all">Everything</option>{agingStatuses.map(item=><option key={item} value={item}>{item}</option>)}</select>
    </div>}
    <p className="bc-sep">Batch list{shown.length?` (${shown.length})`:''}</p>{shown.length?<div className="production-list">{shown.map(({batch,aging})=>{const isOpen=open.has(batch.id);return <article className={`production-record bc-row${isOpen?' is-open':''}`} key={batch.id}>
      <button type="button" className="bc-summary" aria-expanded={isOpen} onClick={()=>toggle(batch.id)}>
        <span className="bc-summary-top"><strong>{batch.name}</strong><span className={`aging-pill ${statusClass(aging.status)}`}>{aging.status}</span>{batch.statusMode==='manual'&&<small className="bc-manual-tag">Manual</small>}<ChevronDown size={16} className="bc-chevron" aria-hidden="true"/></span>
        <AgingBars view={aging} compact parts="overall"/>
      </button>
      {isOpen&&<><div className="bc-key-facts">
        <div><small>Batch ID</small><strong>{batch.batchNumber}</strong></div>
        <div><small>Batch volume</small><strong>{num(batch.expectedYield??batch.actualYield).toFixed(2)} mL</strong></div>
        <div><small>Production date</small><strong>{formatDay(batch.date)}</strong></div>
        <div><small>Ready for distribution</small><strong>{formatDay(aging.overall.expectedReadyDate)}</strong></div>
      </div>
      <ProductionStageSteps aging={aging}/>
      <AgingBars view={aging} compact parts="stages"/></>}
      {isOpen&&<div className="bc-actions">
        <button type="button" className="btn" onClick={()=>setView({mode:'detail',id:batch.id})}><Eye size={14}/> View</button>
        <button type="button" className="btn" onClick={()=>setView({mode:'edit',id:batch.id})}><Pencil size={14}/> Edit</button>
        <button type="button" className="btn" onClick={()=>setView({mode:'detail',id:batch.id,focus:'update'})}><RefreshCw size={14}/> Update</button>
        <button type="button" className="btn" onClick={()=>act(batch,aging.status==='Archived'?'unarchive':'archive',{by})}><Archive size={14}/> {aging.status==='Archived'?'Restore':'Archive'}</button>
      </div>}
    </article>})}</div>:<p className="empty">{data.batches.length?'No batches match your search or filters.':'Add a batch to track its maceration, maturation and expected ready date.'}</p>}
  </section>;
}
