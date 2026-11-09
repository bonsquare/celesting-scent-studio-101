import {agingView} from './aging';
import {localDate} from './production';
import {formatDay,statusClass} from './AgingBars';

const finished=batch=>['Completed','Cancelled'].includes(batch.status||'Planned');

// Dashboard card: batches still aging, soonest-ready first. Progress comes from each batch's own dates.
export default function BatchTracker({batches,onGo}){
  const today=localDate();
  const rows=batches.filter(batch=>!batch.archived&&!finished(batch)).map(batch=>({batch,aging:agingView(batch,today)})).sort((a,b)=>(a.aging.schedule.expectedReadyDate||'9999').localeCompare(b.aging.schedule.expectedReadyDate||'9999')).slice(0,4);
  return <section className="card batch-tracker">
    <div className="card-head"><div><p className="eyebrow">PRODUCTION</p><h2>Batches in production</h2></div>{batches.length>0&&<button className="dashboard-text-action" onClick={()=>onGo('Batches')}>View all</button>}</div>
    {rows.length?<ul className="tracker-list">{rows.map(({batch,aging})=><li key={batch.id}><button type="button" onClick={()=>onGo('Batches')}>
      <span className="tracker-name"><strong>{batch.name}</strong><small>{batch.batchNumber}</small></span>
      <span className="tracker-phase"><span className={`aging-pill ${statusClass(aging.status)}`}>{aging.status}</span><small>{aging.overall.percent}% · ready {formatDay(aging.overall.expectedReadyDate)}</small></span>
      <span className="timeline-bar"><i style={{width:`${aging.overall.percent}%`}}/></span>
    </button></li>)}</ul>:<p className="empty">No batches in production. Add a batch to track its maceration and maturation here.</p>}
  </section>;
}
