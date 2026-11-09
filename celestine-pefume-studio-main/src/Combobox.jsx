import {useEffect,useId,useMemo,useRef,useState} from 'react';
import {Plus} from 'lucide-react';
import {rankOptions} from './suggestions';

// A text field that suggests values you have used before.
// options: [{value, hint?, count?, record?}]. onPick(option) fires when a suggestion is chosen.
// newLabel: when set, typing something new shows a "Use “text”" row (e.g. "Use as new supplier").
export default function Combobox({label,value,onChange,onPick,options=[],placeholder,newLabel,wide=false,avatar=false,maxLength=80,inputRef}){
  const id=useId(),root=useRef(null);
  const [open,setOpen]=useState(false),[active,setActive]=useState(-1);
  const text=String(value??'').trim().replace(/\s+/g,' ');
  const matches=useMemo(()=>rankOptions(options,text),[options,text]);
  const exact=options.some(option=>option?.value&&option.value.toLowerCase()===text.toLowerCase());
  const showNew=Boolean(newLabel)&&Boolean(text)&&!exact;
  const rows=[...matches.map(option=>({kind:'option',option,value:option.value})),...(showNew?[{kind:'new',value:text}]:[])];
  // Nothing useful to show when the only match is exactly what is typed.
  const visible=open&&rows.length>0&&!(matches.length===1&&exact&&!showNew);
  const close=()=>{setOpen(false);setActive(-1)};
  const choose=row=>{onChange(row.value);if(row.kind==='option')onPick?.(row.option);close()};
  useEffect(()=>{
    if(!open)return;
    const away=event=>{if(!root.current?.contains(event.target))close()};
    document.addEventListener('mousedown',away);
    return()=>document.removeEventListener('mousedown',away);
  },[open]);
  const keyDown=event=>{
    if(event.key==='ArrowDown'){event.preventDefault();setOpen(true);setActive(current=>Math.min(current+1,rows.length-1))}
    else if(event.key==='ArrowUp'){event.preventDefault();setActive(current=>Math.max(current-1,0))}
    else if(event.key==='Enter'&&visible&&active>=0){event.preventDefault();choose(rows[active])}
    else if(event.key==='Escape'&&visible){event.stopPropagation();close()}
  };
  return <div className={`field combobox${wide?' wide':''}`} ref={root}>
    <span>{label}</span>
    <span className="input-wrap"><input ref={inputRef} role="combobox" aria-label={label} aria-expanded={visible} aria-controls={id} aria-autocomplete="list" aria-activedescendant={visible&&active>=0?`${id}-${active}`:undefined} autoComplete="off" maxLength={maxLength} value={value??''} placeholder={placeholder} onChange={event=>{onChange(event.target.value);setOpen(true);setActive(-1)}} onFocus={()=>setOpen(true)} onKeyDown={keyDown} onBlur={event=>{if(!root.current?.contains(event.relatedTarget))close()}}/></span>
    {visible&&<ul className="combobox-list" id={id} role="listbox" aria-label={`${label} suggestions`}>
      {rows.map((row,index)=><li key={`${row.kind}:${row.value}`} id={`${id}-${index}`} role="option" aria-selected={index===active} className={`${index===active?'active':''}${row.kind==='new'?' is-new':''}`} onMouseDown={event=>event.preventDefault()} onMouseEnter={()=>setActive(index)} onClick={()=>choose(row)}>
        {row.kind==='new'
          ?<><span className="combobox-avatar"><Plus size={13}/></span><span className="combobox-text"><strong>{newLabel} “{row.value}”</strong></span></>
          :<>{avatar&&<span className="combobox-avatar">{row.value.charAt(0).toUpperCase()}</span>}<span className="combobox-text"><strong>{row.value}</strong>{row.option.hint&&<small>{row.option.hint}</small>}</span></>}
      </li>)}
    </ul>}
  </div>;
}
