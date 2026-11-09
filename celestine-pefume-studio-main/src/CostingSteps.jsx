import {Check,History} from 'lucide-react';

const steps=[['content','Costs','Raw materials and expenses'],['bottling','Bottling','Bottle and packaging'],['pricing','Price','Selling price'],['history','Saved prices','Price history']];

// The costing process: three numbered steps, then the saved prices. Finished steps show a check mark.
export default function CostingSteps({tab,ready,onChange}){
  const active=steps.findIndex(([id])=>id===tab);
  return <nav className="costing-steps" aria-label="Costing steps">
    {steps.map(([id,label,hint],index)=>{
      const isHistory=id==='history',done=ready&&!isHistory&&index<active&&active<=3;
      const state=!ready?'locked':index===active?'active':done?'done':'todo';
      return <button type="button" key={id} disabled={!ready} title={hint} aria-current={index===active?'step':undefined} className={`cs-step cs-${state}${isHistory?' cs-history':''}`} onClick={()=>onChange(id)}>
        <span className="cs-dot">{done?<Check size={14} strokeWidth={3}/>:isHistory?<History size={14}/>:index+1}</span>
        <span className="cs-label">{label}</span>
      </button>;
    })}
  </nav>;
}
