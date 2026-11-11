import {useEffect,useRef} from 'react';
import {ChevronRight} from 'lucide-react';

// Each link sits under a named separator.
const sections={'Inventory of Raw Materials':'Stock','Raw Material Registration':'Materials','Settings':'Account'};
const project=(velocity,rate=.99)=>(velocity/1000)*rate/(1-rate);
const resist=(distance,height)=>distance*height*.55/(height+.55*Math.abs(distance));

export default function MoreSheet({pages,onNavigate,onClose}){
  const panel=useRef(null),frame=useRef(0),position=useRef(0),velocity=useRef(0),drag=useRef(null),closeButton=useRef(null);
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const move=y=>{position.current=y;if(panel.current)panel.current.style.transform=`translate3d(0,${y}px,0)`};
  const spring=(target,onDone)=>{
    cancelAnimationFrame(frame.current);
    if(reduced()){move(target);onDone?.();return}
    let previous=performance.now();
    const tick=now=>{const dt=Math.min((now-previous)/1000,.032);previous=now;const height=panel.current?.offsetHeight||1;const stiffness=340,damping=37;const acceleration=(target-position.current)*stiffness-velocity.current*damping;velocity.current+=acceleration*dt;move(Math.max(-height*.08,position.current+velocity.current*dt));if(Math.abs(position.current-target)<.5&&Math.abs(velocity.current)<4){move(target);velocity.current=0;onDone?.()}else frame.current=requestAnimationFrame(tick)};
    frame.current=requestAnimationFrame(tick);
  };
  useEffect(()=>{const height=panel.current?.offsetHeight||0;move(reduced()?0:height);spring(0);closeButton.current?.focus();const key=e=>{if(e.key==='Escape'){e.preventDefault();dismiss()}if(e.key==='Tab'){const controls=panel.current?.querySelectorAll('button');if(!controls?.length)return;const first=controls[0],last=controls[controls.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}};document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);cancelAnimationFrame(frame.current)}},[]);
  const dismiss=()=>spring(panel.current?.offsetHeight||500,()=>{onClose();document.querySelector('.bottom-nav button:last-child')?.focus()});
  const pointerDown=e=>{if(e.pointerType==='mouse'&&e.button!==0)return;cancelAnimationFrame(frame.current);velocity.current=0;drag.current={startY:e.clientY,startPosition:position.current,history:[{y:e.clientY,t:performance.now()}]};e.currentTarget.setPointerCapture(e.pointerId)};
  const pointerMove=e=>{if(!drag.current)return;const height=panel.current?.offsetHeight||1;const next=drag.current.startPosition+e.clientY-drag.current.startY;move(next<0?resist(next,height):Math.min(next,height));const history=drag.current.history;history.push({y:e.clientY,t:performance.now()});while(history.length>6||history.length>1&&performance.now()-history[0].t>100)history.shift()};
  const pointerUp=e=>{if(!drag.current)return;const history=drag.current.history;const first=history[0],last=history[history.length-1];velocity.current=last.t>first.t?(last.y-first.y)/(last.t-first.t)*1000:0;drag.current=null;const height=panel.current?.offsetHeight||1;const projected=position.current+project(velocity.current);if(projected>height*.35)spring(height,()=>{onClose();document.querySelector('.bottom-nav button:last-child')?.focus()});else spring(0)};
  return <div className="sheet-backdrop" onClick={dismiss}><div ref={panel} className="sheet" role="dialog" aria-modal="true" aria-label="More navigation" onClick={e=>e.stopPropagation()}><div className="sheet-grip-zone" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} aria-hidden="true"><span className="sheet-grip"/></div><div className="sheet-head"><div><p className="eyebrow">WORKSPACE</p><h2>More</h2></div><button ref={closeButton} onClick={dismiss} aria-label="Close menu">×</button></div><p className="sheet-intro">Manage the resources and settings behind your formulas.</p><div className="sheet-links">{pages.map(([name,Icon,description])=><div className="sheet-group" key={name}><p className="bc-sep">{sections[name]||'More'}</p><button className="sheet-link" onClick={()=>onNavigate(name)}><span className="sheet-link-icon"><Icon size={19}/></span><span className="sheet-link-copy"><strong>{name}</strong><small>{description}</small></span><ChevronRight className="sheet-link-arrow" size={18}/></button></div>)}</div></div></div>;
}
