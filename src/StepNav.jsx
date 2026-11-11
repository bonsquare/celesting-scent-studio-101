import {ArrowLeft,ArrowRight} from 'lucide-react';

// Back / Next buttons at the bottom of each Costing step.
export default function StepNav({back,next,onGo}){
  return <nav className="step-nav" aria-label="Costing steps">
    {back?<button type="button" className="btn secondary" onClick={()=>onGo(back.tab)}><ArrowLeft size={16}/> Back: {back.label}</button>:<span/>}
    {next&&<button type="button" className="btn primary" onClick={()=>onGo(next.tab)}>Next: {next.label} <ArrowRight size={16}/></button>}
  </nav>;
}
