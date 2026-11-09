import {useEffect,useState} from 'react';
import {Moon,Sun,Sunrise} from 'lucide-react';
import {attentionCount} from './overview';
import {christmasScenes} from './ChristmasScenes';
import {greetings,sceneFromSearch,themeFromSearch} from './timeOfDay';

const icons={morning:Sunrise,afternoon:Sun,evening:Moon};
const plural=(count,one,many)=>`${count} ${count===1?one:many}`;

const Hills=({back,mid,front,trees})=><>
  <path d="M0 132 Q70 104 140 122 T270 116 T400 124 V170 H0Z" fill={back}/>
  <path d="M0 146 Q90 122 180 142 T340 136 T400 144 V170 H0Z" fill={mid}/>
  <path d="M0 158 Q110 142 210 156 T400 152 V170 H0Z" fill={front}/>
  <g fill={trees}><path d="M34 156 l9-27 l9 27z"/><path d="M52 158 l7-20 l7 20z"/><path d="M356 154 l8-24 l8 24z"/><path d="M372 156 l6-17 l6 17z"/></g>
</>;

const Cloud=({x,y,scale=1,opacity=.9})=><g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity} fill="#fff"><ellipse cx="0" cy="0" rx="26" ry="9"/><ellipse cx="-12" cy="-7" rx="14" ry="9"/><ellipse cx="10" cy="-9" rx="16" ry="11"/></g>;

const Birds=({color})=><g fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round"><path d="M250 38 q5 -6 10 0 q5 -6 10 0"/><path d="M276 52 q4 -5 8 0 q4 -5 8 0"/></g>;

const scenes={
  morning:<svg viewBox="0 0 400 170" preserveAspectRatio="xMidYMid slice" className="scene-art" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="morningSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6bb8ff"/><stop offset=".55" stopColor="#b9e0ff"/><stop offset="1" stopColor="#ffd8ae"/></linearGradient>
      <radialGradient id="morningSun"><stop offset="0" stopColor="#fff7d0"/><stop offset=".35" stopColor="#ffe58f" stopOpacity=".95"/><stop offset="1" stopColor="#ffe58f" stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="400" height="170" fill="url(#morningSky)"/>
    <circle cx="316" cy="112" r="78" fill="url(#morningSun)"/>
    <circle cx="316" cy="112" r="24" fill="#fff3b8"/>
    <g className="clouds"><Cloud x={70} y={38} scale={1.1}/><Cloud x={205} y={62} scale={.8} opacity={.8}/><Cloud x={350} y={30} scale={.7} opacity={.85}/></g>
    <Birds color="#4a6a8a"/>
    <Hills back="#9bd9b0" mid="#66c08f" front="#3fa174" trees="#2b7a58"/>
  </svg>,
  afternoon:<svg viewBox="0 0 400 170" preserveAspectRatio="xMidYMid slice" className="scene-art" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="afternoonSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2b7de9"/><stop offset=".6" stopColor="#6fb6ff"/><stop offset="1" stopColor="#bfe4ff"/></linearGradient>
      <radialGradient id="afternoonSun"><stop offset="0" stopColor="#fffbe0"/><stop offset=".3" stopColor="#ffe980" stopOpacity=".95"/><stop offset="1" stopColor="#ffe980" stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="400" height="170" fill="url(#afternoonSky)"/>
    <circle cx="86" cy="42" r="64" fill="url(#afternoonSun)"/>
    <circle cx="86" cy="42" r="19" fill="#fff6b0"/>
    <g className="clouds"><Cloud x={190} y={40} scale={1.2}/><Cloud x={300} y={74} scale={.9} opacity={.85}/><Cloud x={30} y={92} scale={.7} opacity={.7}/><Cloud x={380} y={36} scale={.8}/></g>
    <Birds color="#ffffffcc"/>
    <Hills back="#86d27f" mid="#58b866" front="#3c9a52" trees="#2a7a40"/>
  </svg>,
  evening:<svg viewBox="0 0 400 170" preserveAspectRatio="xMidYMid slice" className="scene-art" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="eveningSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#15123f"/><stop offset=".55" stopColor="#3d2c78"/><stop offset="1" stopColor="#d77a92"/></linearGradient>
      <radialGradient id="eveningMoon"><stop offset="0" stopColor="#fff9df"/><stop offset=".4" stopColor="#fff1b8" stopOpacity=".8"/><stop offset="1" stopColor="#fff1b8" stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="400" height="170" fill="url(#eveningSky)"/>
    <circle cx="320" cy="46" r="52" fill="url(#eveningMoon)"/>
    <circle cx="320" cy="46" r="19" fill="#fff8dc"/>
    <circle cx="312" cy="41" r="4" fill="#efe2b6" opacity=".7"/><circle cx="327" cy="52" r="3" fill="#efe2b6" opacity=".6"/>
    <g fill="#fff" className="stars"><circle cx="40" cy="24" r="1.4"/><circle cx="90" cy="46" r="1"/><circle cx="140" cy="18" r="1.6"/><circle cx="188" cy="40" r="1"/><circle cx="236" cy="22" r="1.3"/><circle cx="262" cy="60" r="1"/><circle cx="68" cy="78" r="1.1"/><circle cx="120" cy="64" r="1.4"/><circle cx="210" cy="78" r="1"/><circle cx="372" cy="22" r="1.2"/><circle cx="380" cy="80" r="1"/><circle cx="16" cy="58" r="1.2"/></g>
    <path d="M0 120 L50 88 L96 118 L150 82 L214 122 L268 92 L330 124 L400 98 V170 H0Z" fill="#2d2a68" opacity=".9"/>
    <path d="M0 140 Q90 114 180 136 T340 130 T400 138 V170 H0Z" fill="#1d2552"/>
    <path d="M0 156 Q110 140 210 154 T400 150 V170 H0Z" fill="#111a3a"/>
    <g><rect x="296" y="132" width="22" height="16" fill="#0a1230"/><path d="M293 133 L307 120 L321 133z" fill="#0a1230"/><rect x="302" y="138" width="6" height="7" fill="#ffd36e"/></g>
    <g fill="#ffe27a"><circle cx="150" cy="144" r="1.5"/><circle cx="188" cy="150" r="1.2"/><circle cx="238" cy="146" r="1.5"/><circle cx="64" cy="150" r="1.2"/></g>
    <g fill="#0a1230"><path d="M34 156 l9-25 l9 25z"/><path d="M52 158 l7-19 l7 19z"/><path d="M356 154 l8-23 l8 23z"/></g>
  </svg>
};

// The top of the Dashboard: a time-of-day scene, a greeting and your name. Chips appear only when something needs attention.
export default function DashboardBanner({name,alerts,onGo}){
  const [now,setNow]=useState(()=>new Date());
  useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),60000);return()=>clearInterval(timer)},[]);
  const scene=sceneFromSearch(location.search,now),theme=themeFromSearch(location.search,now),christmas=theme==='christmas';
  const Icon=icons[scene];
  const items=[
    {key:'low',count:alerts.lowStock,text:plural(alerts.lowStock,'low-stock item','low-stock items'),page:'Inventory of Raw Materials'},
    {key:'ready',count:alerts.ready,text:plural(alerts.ready,'batch ready to bottle','batches ready to bottle'),page:'Batches'},
    {key:'bottle',count:alerts.needBottle,text:plural(alerts.needBottle,'formula needs a bottle size','formulas need a bottle size'),page:'Costing'},
    {key:'price',count:alerts.unsavedPrice,text:plural(alerts.unsavedPrice,'price not saved','prices not saved'),page:'Costing'}
  ].filter(item=>item.count>0);
  const showChips=attentionCount(alerts)>0||alerts.inProgress>0;
  return <section className={`dashboard-banner scene-${scene}${christmas?' theme-christmas':''}`} aria-label={`${greetings[scene]}, ${name||'welcome'}`}>
    {(christmas?christmasScenes:scenes)[scene]}
    <div className="banner-text">
      <p className="banner-greeting"><Icon size={18} aria-hidden="true"/> {greetings[scene]}</p>
      <h2 className="banner-name">{name||'Celestine Studio'}</h2>
    </div>
    {showChips&&<div className="banner-chips" role="list">
      {items.map(item=><button type="button" role="listitem" key={item.key} className="banner-chip warn" onClick={()=>onGo(item.page)}><strong>{item.count}</strong> {item.text.replace(/^\d+ /,'')}</button>)}
      {alerts.inProgress>0&&<button type="button" role="listitem" className="banner-chip" onClick={()=>onGo('Batches')}><strong>{alerts.inProgress}</strong> {alerts.inProgress===1?'batch':'batches'} in progress</button>}
    </div>}
  </section>;
}
