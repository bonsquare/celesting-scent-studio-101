import {useState} from 'react';
import {Check,ChevronDown} from 'lucide-react';
import {themes} from './themes';

// Settings > Appearance. Picking a theme applies at once and is saved with your data so it follows you to other devices.
// The list can be collapsed; the header then shows the theme in use.
export default function ThemePicker({value,onChange}){
  const [open,setOpen]=useState(false);
  const current=themes.find(theme=>theme.id===value)||themes[0];
  return <section className={`card theme-picker${open?' is-open':''}`} aria-label="Appearance">
    <button type="button" className="theme-toggle" aria-expanded={open} aria-controls="theme-list" onClick={()=>setOpen(state=>!state)}>
      <span className="theme-toggle-text"><span className="eyebrow">APPEARANCE</span><strong>Color theme</strong></span>
      <span className="theme-current"><span className="theme-swatches" aria-hidden="true">{current.swatch.map((color,index)=><i key={index} style={{background:color}}/>)}</span><small>{current.name}</small></span>
      <ChevronDown size={18} className="theme-chevron" aria-hidden="true"/>
    </button>
    {open&&<div id="theme-list">
      <p className="muted">Choose how the app looks. It changes instantly.</p>
      <div className="theme-list" role="radiogroup" aria-label="Color theme">
        {themes.map(theme=><button type="button" key={theme.id} role="radio" aria-checked={value===theme.id} className={`theme-row${value===theme.id?' is-selected':''}`} onClick={()=>onChange(theme.id)}>
          <span className="theme-swatches" aria-hidden="true">{theme.swatch.map((color,index)=><i key={index} style={{background:color}}/>)}</span>
          <span className="theme-copy"><strong>{theme.name}</strong><small>{theme.note}</small></span>
          <span className="theme-check" aria-hidden="true">{value===theme.id&&<Check size={16}/>}</span>
        </button>)}
      </div>
    </div>}
  </section>;
}
