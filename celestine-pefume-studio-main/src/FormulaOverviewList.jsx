import {useMemo,useState} from 'react';
import {calculate,money} from './logic';
import {formulaOverview} from './overview';

const Stat=({label,value})=><div className="stat"><span>{label}</span><strong>{value}</strong></div>;
const visibleCount=4;

function FormulaOverviewCard({formula,data,isCurrent,onManage}){
  const overview=useMemo(()=>formulaOverview(formula,calculate(formula,data)),[formula,data]);
  return <section className={`card formula-overview-card${isCurrent?' current':''}`}>
    <div className="formula-overview-head">
      <div className="formula-overview-title"><strong className="dashboard-formula-name">{formula.name}</strong>{formula.code&&<span className="formula-code-tag">{formula.code}</span>}{isCurrent&&<span className="current-tag">Current</span>}</div>
      <button type="button" className="dashboard-text-action" onClick={()=>onManage(formula)}>Manage</button>
    </div>
    {!overview.hasBottle&&<p className="overview-note">Choose a bottle size in Costing to see the cost per finished bottle and the suggested price.</p>}
    <details className="overview-disclosure"><summary>Details</summary>
      <div className="dashboard-formula-stats overview-stats">
        <Stat label="Batch volume" value={`${overview.volume.toFixed(1)} ML`}/>
        <Stat label="Raw material cost" value={money(overview.rawMaterialCost)}/>
        <Stat label="Cost of production" value={money(overview.costOfProduction)}/>
        <Stat label="Cost per bottle (finished)" value={overview.hasBottle?money(overview.costPerBottle):'Not set'}/>
        <Stat label={`Suggested ${overview.tierName.toLowerCase()} price`} value={overview.hasBottle?money(overview.suggestedPrice):'Not set'}/>
        <Stat label="Profit per bottle" value={overview.hasBottle?money(overview.profitPerBottle):'Not set'}/>
      </div>
      {overview.hasBottle&&<p className="overview-note">Cost of production covers raw materials, labour, overhead and packaging for the whole batch. The suggested price is the Retail price from Costing → Pricing, based on the cost of one finished bottle.</p>}
    </details>
  </section>;
}

// One card per formula, newest first. The current formula (the one in the banner) is tagged.
export default function FormulaOverviewList({formulas,data,currentId,onManage}){
  const [showAll,setShowAll]=useState(false);
  const sorted=useMemo(()=>[...formulas].sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||'')),[formulas]);
  if(!sorted.length)return null;
  const shown=showAll?sorted:sorted.slice(0,visibleCount);
  return <div className="formula-overview-list">
    {shown.map(formula=><FormulaOverviewCard key={formula.id} formula={formula} data={data} isCurrent={formula.id===currentId} onManage={onManage}/>)}
    {sorted.length>visibleCount&&<button type="button" className="btn secondary formula-overview-more" onClick={()=>setShowAll(!showAll)}>{showAll?'Show fewer formulas':`Show all ${sorted.length} formulas`}</button>}
  </div>;
}
