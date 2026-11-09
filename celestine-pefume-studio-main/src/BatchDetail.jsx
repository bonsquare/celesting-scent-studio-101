import {useEffect,useState} from 'react';
import {ArrowLeft,Pencil,Trash2} from 'lucide-react';
import {money,num} from './logic';
import {localDate,batchStatuses} from './production';
import {agingView,applyAgingAction} from './aging';
import AgingBars,{formatDay,statusClass} from './AgingBars';

const stamp=iso=>{const date=new Date(iso);return Number.isNaN(date.getTime())?iso:`${date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})} @ ${date.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}`};

// What can be done to this batch right now, each with the rules for date and reason.
const actionsFor=(batch,view)=>{
  const list=[];
  if(!batch.macerationDoneOn)list.push({id:'macerationDone',label:'Mark maceration completed',date:true});else list.push({id:'reopenMaceration',label:'Reopen maceration',reason:true});
  if(!batch.maturationDoneOn)list.push({id:'maturationDone',label:'Mark maturation completed',date:true});else list.push({id:'reopenMaturation',label:'Reopen maturation',reason:true});
  list.push(batch.onHold?{id:'resume',label:'Resume batch'}:{id:'hold',label:'Put batch on hold',reason:true});
  list.push(batch.archived?{id:'unarchive',label:'Restore from archive'}:{id:'archive',label:'Archive batch'});
  return list;
};

export default function BatchDetail({batch,by,focusUpdate,onBack,onEdit,onAction,onStatus,onDelete}){
  const view=agingView(batch);
  const actions=actionsFor(batch,view);
  const [action,setAction]=useState(actions[0].id),[date,setDate]=useState(localDate()),[reason,setReason]=useState(''),[deleting,setDeleting]=useState(false);
  useEffect(()=>{if(focusUpdate)document.getElementById('batch-update')?.scrollIntoView({block:'center'})},[focusUpdate]);
  const chosen=actions.find(item=>item.id===action)||actions[0];
  const invalid=(chosen.reason&&!reason.trim())||(chosen.date&&(!date||date<(view.schedule.macerationStart||'')));
  const apply=()=>{onAction(batch,chosen.id,{date,reason:reason.trim(),by});setReason('');setAction(actions[0].id)};
  const history=[...(batch.history||[])].reverse();
  return <section className="card batch-detail">
    <div className="card-head"><div><p className="eyebrow">BATCH DETAILS</p><h2>{batch.batchNumber}</h2></div><button type="button" className="btn" onClick={onBack}><ArrowLeft size={15}/> Back</button></div>
    <div className="bd-title"><strong>{batch.name}</strong><span className={`aging-pill ${statusClass(view.status)}`}>{view.status}</span></div>
    <div className="bd-facts">
      <div><span>Production date</span><strong>{formatDay(batch.date)}</strong></div>
      <div><span>Actual yield</span><strong>{num(batch.actualYield)} ml</strong></div>
      <div><span>Expected yield</span><strong>{num(batch.expectedYield).toFixed(1)} ml</strong></div>
      <div><span>Expected ready</span><strong>{formatDay(view.overall.expectedReadyDate)}</strong></div>
      <div><span>Raw material cost</span><strong>{money(batch.calculation?.ingredientCost)}</strong></div>
      <div><span>Created by</span><strong>{batch.createdBy||'—'}</strong></div>
    </div>
    {batch.notes&&<p className="bd-notes">{batch.notes}</p>}
    <AgingBars view={view}/>
    <div className="bd-actions"><button type="button" className="btn" onClick={()=>onEdit(batch)}><Pencil size={14}/> Edit schedule</button></div>
    <div className={`bd-update${focusUpdate?' is-focus':''}`} id="batch-update"><h3>Update batch</h3>
      <div className="bf-grid">
        <label className="bf-wide"><span>Action</span><select value={chosen.id} onChange={event=>setAction(event.target.value)}>{actions.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        {chosen.date&&<label><span>Completion date</span><input type="date" value={date} onChange={event=>setDate(event.target.value)}/></label>}
        <label className={chosen.date?'':'bf-wide'}><span>Reason {chosen.reason?'(required)':'(optional)'}</span><input value={reason} onChange={event=>setReason(event.target.value)}/></label>
      </div>
      <button type="button" className="btn primary" disabled={Boolean(invalid)} onClick={apply}>Apply update</button>
    </div>
    <div className="bd-production"><h3>Production status</h3>
      <div className="bd-status-row"><select className={`batch-status status-${(batch.status||'Planned').toLowerCase()}`} value={batch.status||'Planned'} onChange={event=>onStatus(batch,event.target.value)}>{batchStatuses.map(status=><option key={status}>{status}</option>)}</select><small>{batch.inventoryDeducted?'Inventory deducted':'Setting Completed deducts raw materials and supplies from inventory.'}</small></div>
    </div>
    <div className="bd-history"><h3>Change history</h3>
      {history.length?<ul>{history.map(item=><li key={item.id+item.at}><div><strong>{item.label}</strong><span>{item.from} → {item.to}</span></div><small>{stamp(item.at)} · {item.by}{item.reason?` · ${item.reason}`:''}</small></li>)}</ul>:<p className="empty">No changes recorded yet.</p>}
    </div>
    <div className="bd-danger">{deleting
      ?<div className="batch-delete-confirm"><small>{batch.inventoryDeducted?'Stock already deducted stays deducted.':'Delete this batch for good?'}</small><button type="button" className="btn" onClick={()=>setDeleting(false)}>Cancel</button><button type="button" className="btn danger" onClick={()=>onDelete(batch)}>Delete</button></div>
      :<button type="button" className="btn" onClick={()=>setDeleting(true)}><Trash2 size={14}/> Delete batch</button>}</div>
  </section>;
}
