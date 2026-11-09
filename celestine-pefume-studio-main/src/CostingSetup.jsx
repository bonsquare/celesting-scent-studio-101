import {agingView} from './aging';
import {formatDay} from './AgingBars';
import {num} from './logic';

export default function CostingSetup({productions,production,selectedId,onSelect,onCreate}){
 const aging=production?agingView(production):null;
 const facts=production?[
  ['Batch ID',production.batchNumber||production.code||'—'],
  ['Batch volume',`${num(production.expectedYield??production.actualYield).toFixed(2)} mL`],
  ['Produced',formatDay(production.date)],
  ['Ready for distribution',formatDay(aging.overall.expectedReadyDate)]
 ]:[];
 return <section className="costing-setup card">
  <div className="costing-setup-heading"><div><p className="eyebrow">COSTING</p><h2>Choose a production</h2></div><span>{productions.length} saved</span></div>
  {productions.length?<>
   <div className="costing-current">
    <div className="costing-current-main"><span>{selectedId?'Selected production':'First step'}</span><strong>{selectedId?production?.name:'Choose a production'}{selectedId&&production?.code&&<span className="formula-code-tag">{production.code}</span>}</strong><small>{selectedId?'Every cost and packaging item below belongs to this production record.':'Create a production first, then calculate its actual cost.'}</small></div>
    <label className="costing-formula-select"><span>Choose production</span><select value={selectedId||''} onChange={event=>onSelect(event.target.value)}><option value="" disabled>Select production</option>{productions.map(item=><option key={item.id} value={item.id}>{item.code||item.productionCode} · {item.name||'Untitled'} · {item.date||'No date'}</option>)}</select></label>
    {production&&<div className="costing-production-details"><span className="costing-production-status">{aging.status}{production.statusMode==='manual'?' · Manual':''}</span><dl>{facts.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></div>}
   </div>
  </>:<div className="costing-empty"><p>Create a production from a saved formula to start costing its actual output and packaging.</p><button className="btn primary" onClick={onCreate}>Open Production</button></div>}
 </section>;
}
