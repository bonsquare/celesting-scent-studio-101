import {useEffect,useRef} from 'react';
import {X} from 'lucide-react';
export default function WorkspaceDialog({title,onClose,children}){
 const panel=useRef(null),close=useRef(onClose);close.current=onClose;
 useEffect(()=>{const previous=document.activeElement,overflow=document.body.style.overflow;document.body.style.overflow='hidden';panel.current?.querySelector('button')?.focus();const key=event=>{if(event.key==='Escape')close.current();if(event.key==='Tab'){const controls=[...panel.current.querySelectorAll('button,input,select,textarea,a[href]')].filter(item=>!item.disabled&&item.getClientRects().length);const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}};document.addEventListener('keydown',key);return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',key);previous?.focus?.()}},[]);
 return <div className="formula-window-backdrop"><section ref={panel} className="formula-window" role="dialog" aria-modal="true" aria-label={title}><header className="formula-window-header"><h2>{title}</h2><button className="icon-button" aria-label={`Close ${title}`} onClick={onClose}><X size={20}/></button></header><div className="formula-window-body">{children}</div></section></div>;
}
