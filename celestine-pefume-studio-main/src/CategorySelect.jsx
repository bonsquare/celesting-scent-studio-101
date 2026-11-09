import {useEffect,useRef,useState} from 'react';
import {Check,ChevronDown,Plus} from 'lucide-react';

// A dropdown that lets you pick an existing category or type a new one.
export default function CategorySelect({value,options,onChange,label='Category',addLabel='Add new category'}){
  const [open,setOpen]=useState(false),[adding,setAdding]=useState(false),[text,setText]=useState('');
  const root=useRef(null),input=useRef(null);
  const close=()=>{setOpen(false);setAdding(false);setText('')};
  useEffect(()=>{
    if(!open)return;
    const away=event=>{if(!root.current?.contains(event.target))close()};
    // Capture phase so Escape closes only the menu, not the dialog around it.
    const key=event=>{if(event.key==='Escape'){event.stopPropagation();close()}};
    document.addEventListener('mousedown',away);
    document.addEventListener('keydown',key,true);
    return()=>{document.removeEventListener('mousedown',away);document.removeEventListener('keydown',key,true)};
  },[open]);
  useEffect(()=>{if(adding)input.current?.focus()},[adding]);
  const choose=next=>{onChange(next);close()};
  const addNew=()=>{
    const name=text.trim().replace(/\s+/g,' ').slice(0,40);
    if(!name)return;
    choose(options.find(option=>option.toLowerCase()===name.toLowerCase())||name);
  };
  return <div className="field category-select" ref={root}>
    <span>{label}</span>
    <button type="button" className="category-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={()=>setOpen(current=>!current)}><span>{value||'Choose a category'}</span><ChevronDown size={16}/></button>
    {open&&<div className="category-menu" role="listbox" aria-label={label}>
      {options.map(option=><button type="button" role="option" aria-selected={option===value} key={option} className={option===value?'selected':''} onClick={()=>choose(option)}><span>{option}</span>{option===value&&<Check size={15}/>}</button>)}
      <div className="category-add">{adding
        ?<div className="category-add-form"><input ref={input} value={text} maxLength={40} placeholder="New category name" aria-label="New category name" onChange={event=>setText(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();addNew()}}}/><button type="button" className="btn primary" onClick={addNew}>Add</button></div>
        :<button type="button" className="category-add-trigger" onClick={()=>setAdding(true)}><Plus size={15}/> {addLabel}</button>}</div>
    </div>}
  </div>;
}
