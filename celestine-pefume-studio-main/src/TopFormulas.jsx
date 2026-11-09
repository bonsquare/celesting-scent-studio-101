import {money} from './logic';
import {plural} from './suggestions';

// Ranks formulas by profit per bottle. Clicking a row makes it the dashboard's current formula.
export default function TopFormulas({rows,selectedId,onSelect}){
  return <section className="card top-formulas">
    <div className="card-head"><div><p className="eyebrow">PERFORMANCE</p><h2>Top formulas</h2></div><span className="muted">by profit per bottle</span></div>
    {rows.length
      ?<ol className="top-formula-list">{rows.map((row,index)=><li key={row.key}><button type="button" className={row.id&&row.id===selectedId?'active':''} disabled={!row.id} onClick={()=>onSelect(row.id)}>
        <span className="top-rank">{index+1}</span>
        <span className="top-formula-name"><strong>{row.name}</strong><small>{[row.scentName&&row.scentName!==row.name?row.scentName:'',`${plural(row.batches,'batch')} · ${plural(row.bottles,'bottle')}`].filter(Boolean).join(' · ')}</small></span>
        <span className="top-formula-value"><strong>{money(row.profitPerBottle)}</strong><small>profit per bottle · cost {money(row.costPerBottle)}</small></span>
      </button></li>)}</ol>
      :<p className="empty">Complete a production batch to rank your formulas by profit.</p>}
  </section>;
}
