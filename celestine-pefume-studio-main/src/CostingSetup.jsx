export default function CostingSetup({productions,production,selectedId,onSelect,onCreate}){
 return <section className="costing-setup card">
  <div className="costing-setup-heading"><div><p className="eyebrow">COSTING</p><h2>Choose a production</h2></div><span>{productions.length} saved</span></div>
  {productions.length?<>
   <div className="costing-current"><div><span>{selectedId?'Selected production':'First step'}</span><strong>{selectedId?production?.name:'Choose a production'}{selectedId&&production?.code&&<span className="formula-code-tag">{production.code}</span>}</strong><small>{selectedId?'Every cost and packaging item below belongs to this production record.':'Create a production first, then calculate its actual cost.'}</small></div><label className="costing-formula-select"><span>Choose production</span><select value={selectedId||''} onChange={event=>onSelect(event.target.value)}><option value="" disabled>Select production</option>{productions.map(item=><option key={item.id} value={item.id}>{item.code||item.productionCode} · {item.name||'Untitled'} · {item.date||'No date'}</option>)}</select></label></div>
  </>:<div className="costing-empty"><p>Create a production from a saved formula to start costing its actual output and packaging.</p><button className="btn primary" onClick={onCreate}>Open Production</button></div>}
 </section>;
}
