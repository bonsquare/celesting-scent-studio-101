// Christmas versions of the Dashboard banner scenes: snow, decorated trees and twinkling lights.

const bulbColors=['#ff4d5a','#ffd45a','#4be38a','#5aa8ff'];

// A string of lights hanging across the top edge.
const Garland=()=><g aria-hidden="true">
  <path d="M0 4 Q25 20 50 6 Q75 20 100 6 Q125 20 150 6 Q175 20 200 6 Q225 20 250 6 Q275 20 300 6 Q325 20 350 6 Q375 20 400 6" fill="none" stroke="#1f4a38" strokeWidth="1.3"/>
  {Array.from({length:16},(_,i)=>{const sag=i%2===0;const x=sag?25+Math.floor(i/2)*50:50+Math.floor(i/2)*50;const y=sag?12.5:6;return <circle key={i} className={i%2===0?'bulb bulb-a':'bulb bulb-b'} cx={x} cy={y+2} r="2.4" fill={bulbColors[i%4]}/>})}
</g>;

const flakes=[[24,-1,7],[58,-4,8.5],[92,-2,7.5],[130,-6,9],[168,-3,6.5],[204,-5,8],[240,-2,7],[276,-7,6.5],[312,-4,9],[350,-3,7.5],[382,-6,8],[110,-9,10],[260,-10,10.5],[40,-11,9.5],[330,-1,8.5],[190,-8,9]];
const Snow=()=><g className="snowfall" fill="#fff" aria-hidden="true">{flakes.map(([x,delay,duration],i)=><circle key={i} className="flake" cx={x} cy={4+i%4*8} r={1.1+i%3*.55} style={{animationDelay:`${delay}s`,animationDuration:`${duration}s`}}/>)}</g>;

const SnowHills=({back,mid,front})=><>
  <path d="M0 132 Q70 108 140 124 T270 118 T400 126 V170 H0Z" fill={back}/>
  <path d="M0 146 Q90 124 180 142 T340 136 T400 144 V170 H0Z" fill={mid}/>
  <path d="M0 158 Q110 144 210 156 T400 152 V170 H0Z" fill={front}/>
</>;

// A decorated tree with a star, snow on the branches and coloured ornaments.
const Tree=({x,y,s=1,green='#2e7d5b',glow=false})=><g transform={`translate(${x} ${y}) scale(${s})`}>
  {glow&&<circle cx="0" cy="-2" r="30" fill="#ffd45a" opacity=".13"/>}
  <rect x="-3" y="24" width="6" height="7" fill="#6b4a2f"/>
  <path d="M0 -26 L13 -4 H-13Z" fill={green}/>
  <path d="M0 -14 L17 10 H-17Z" fill={green}/>
  <path d="M0 -2 L21 26 H-21Z" fill={green}/>
  <path d="M-6 -17 Q0 -22 6 -17 L9 -10 Q0 -6 -9 -10Z" fill="#fff" opacity=".9"/>
  <path d="M-9 -3 Q0 -9 9 -3 L12 4 Q0 8 -12 4Z" fill="#fff" opacity=".85"/>
  <path d="M0 -37 L2.3 -31.2 L8.4 -30.8 L3.7 -26.8 L5.2 -20.9 L0 -24 L-5.2 -20.9 L-3.7 -26.8 L-8.4 -30.8 L-2.3 -31.2Z" fill="#ffd45a"/>
  <g><circle className="bulb bulb-a" cx="-8" cy="19" r="2.2" fill="#ff4d5a"/><circle className="bulb bulb-b" cx="7" cy="21" r="2.2" fill="#ffd45a"/><circle className="bulb bulb-a" cx="0" cy="9" r="2.2" fill="#5aa8ff"/><circle className="bulb bulb-b" cx="-8" cy="5" r="2" fill="#ffd45a"/><circle className="bulb bulb-a" cx="8" cy="4" r="2" fill="#ff4d5a"/><circle className="bulb bulb-b" cx="0" cy="-7" r="1.9" fill="#ff4d5a"/><circle className="bulb bulb-a" cx="14" cy="18" r="1.8" fill="#4be38a"/><circle className="bulb bulb-b" cx="-15" cy="19" r="1.8" fill="#5aa8ff"/></g>
</g>;

const Snowman=({x,y})=><g transform={`translate(${x} ${y})`}>
  <circle cx="0" cy="-2" r="9" fill="#fff"/><circle cx="0" cy="-17" r="6.5" fill="#fff"/><circle cx="0" cy="-27" r="4.8" fill="#fff"/>
  <path d="M-4 -31 h8 v-5 h-8z" fill="#2b2f4a"/><rect x="-6" y="-31.5" width="12" height="2" fill="#2b2f4a"/>
  <path d="M0 -27 l7 1.6 l-7 1.2z" fill="#ff8a3d"/>
  <circle cx="-1.8" cy="-28.4" r=".8" fill="#222"/><circle cx="1.8" cy="-28.4" r=".8" fill="#222"/>
  <path d="M-6 -20 q6 4 12 0 l1 3 q-7 4 -14 0z" fill="#e23b4a"/>
  <circle cx="0" cy="-5" r=".9" fill="#222"/><circle cx="0" cy="0" r=".9" fill="#222"/>
</g>;

const Cabin=()=><g>
  <rect x="294" y="130" width="26" height="19" fill="#0a1230"/><path d="M290 131 L307 116 L324 131z" fill="#0a1230"/><path d="M290 131 L307 118 L324 131 L320 131 L307 121 L294 131z" fill="#fff" opacity=".9"/>
  <rect x="313" y="114" width="5" height="9" fill="#0a1230"/>
  <rect x="302" y="137" width="7" height="8" fill="#ffd36e"/><rect x="311" y="139" width="5" height="6" fill="#ffb347"/>
  <path d="M315 112 q-3 -6 1 -10 q4 -4 0 -9" fill="none" stroke="#ffffff66" strokeWidth="2" strokeLinecap="round"/>
</g>;

const Sleigh=()=><g transform="translate(262 50) scale(.95)" fill="#0b1230">
  <path d="M-2 22 q10 5 34 0" fill="none" stroke="#0b1230" strokeWidth="1.8" strokeLinecap="round"/>
  <path d="M0 8 q4 -6 14 -5 l10 -6 l2 5 q-2 1 -3 4 q-1 9 -10 9 H4z"/>
  <circle cx="12" cy="-1" r="3"/><path d="M9 -3 l3 -5 l3 5z" fill="#e23b4a"/>
  <path d="M30 10 H46" fill="none" stroke="#0b1230" strokeWidth="1"/>
  <ellipse cx="52" cy="10" rx="6" ry="3.1"/><circle cx="58.5" cy="6.5" r="2.1"/><path d="M58 4.6 l-1.6 -4.4 M60 5 l1.6 -4.2 M56.6 .2 l-2 1.2" fill="none" stroke="#0b1230" strokeWidth=".9" strokeLinecap="round"/>
  <path d="M48 12.5 l-1.6 6 M55 12.5 l1.6 6" fill="none" stroke="#0b1230" strokeWidth="1.1" strokeLinecap="round"/>
  <ellipse cx="74" cy="6" rx="6" ry="3.1"/><circle cx="80.5" cy="2.5" r="2.1"/><path d="M80 .6 l-1.6 -4.4 M82 1 l1.6 -4.2" fill="none" stroke="#0b1230" strokeWidth=".9" strokeLinecap="round"/>
  <path d="M70 8.5 l-1.6 6 M77 8.5 l1.6 6" fill="none" stroke="#0b1230" strokeWidth="1.1" strokeLinecap="round"/>
  <path d="M58 9 H68" fill="none" stroke="#0b1230" strokeWidth="1"/>
</g>;

const frame={viewBox:'0 0 400 170',preserveAspectRatio:'xMidYMid slice',className:'scene-art',focusable:'false','aria-hidden':'true'};

export const christmasScenes={
  morning:<svg {...frame}>
    <defs>
      <linearGradient id="xmasMorningSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7fa8f2"/><stop offset=".55" stopColor="#d8c8f0"/><stop offset="1" stopColor="#ffd2d8"/></linearGradient>
      <radialGradient id="xmasMorningSun"><stop offset="0" stopColor="#fff6d6"/><stop offset=".4" stopColor="#ffe6a8" stopOpacity=".85"/><stop offset="1" stopColor="#ffe6a8" stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="400" height="170" fill="url(#xmasMorningSky)"/>
    <circle cx="316" cy="108" r="74" fill="url(#xmasMorningSun)"/><circle cx="316" cy="108" r="22" fill="#fff3c6"/>
    <SnowHills back="#f4f7ff" mid="#e1e9fb" front="#cfdcf5"/>
    <Tree x={46} y={134} s={.95}/><Tree x={72} y={142} s={.62} green="#3a8d68"/><Tree x={358} y={132} s={1}/><Tree x={338} y={144} s={.6} green="#3a8d68"/>
    <Snow/><Garland/>
  </svg>,
  afternoon:<svg {...frame}>
    <defs>
      <linearGradient id="xmasAfternoonSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3b82e0"/><stop offset=".6" stopColor="#7fbcf4"/><stop offset="1" stopColor="#d4ecff"/></linearGradient>
      <radialGradient id="xmasAfternoonSun"><stop offset="0" stopColor="#fffbe6"/><stop offset=".35" stopColor="#ffeb99" stopOpacity=".9"/><stop offset="1" stopColor="#ffeb99" stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="400" height="170" fill="url(#xmasAfternoonSky)"/>
    <circle cx="88" cy="42" r="60" fill="url(#xmasAfternoonSun)"/><circle cx="88" cy="42" r="17" fill="#fff8c4"/>
    <g fill="#fff" opacity=".9"><ellipse cx="206" cy="40" rx="30" ry="10"/><ellipse cx="190" cy="32" rx="15" ry="10"/><ellipse cx="220" cy="30" rx="17" ry="12"/><ellipse cx="320" cy="70" rx="24" ry="8" opacity=".8"/></g>
    <SnowHills back="#ffffff" mid="#eef4ff" front="#dce8fa"/>
    <Tree x={44} y={134} s={1}/><Tree x={338} y={132} s={1.05}/><Tree x={366} y={143} s={.62} green="#3a8d68"/><Snowman x={290} y={150}/>
    <Snow/><Garland/>
  </svg>,
  evening:<svg {...frame}>
    <defs>
      <linearGradient id="xmasEveningSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0c1238"/><stop offset=".55" stopColor="#222f6e"/><stop offset="1" stopColor="#5d4f94"/></linearGradient>
      <radialGradient id="xmasMoon"><stop offset="0" stopColor="#fffbe8"/><stop offset=".4" stopColor="#fff2c2" stopOpacity=".8"/><stop offset="1" stopColor="#fff2c2" stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="400" height="170" fill="url(#xmasEveningSky)"/>
    <circle cx="322" cy="70" r="52" fill="url(#xmasMoon)"/><circle cx="322" cy="70" r="20" fill="#fff9df"/>
    <g fill="#fff" className="stars"><circle cx="38" cy="26" r="1.5"/><circle cx="92" cy="48" r="1"/><circle cx="144" cy="20" r="1.6"/><circle cx="190" cy="42" r="1"/><circle cx="238" cy="24" r="1.3"/><circle cx="66" cy="76" r="1.1"/><circle cx="120" cy="66" r="1.4"/><circle cx="212" cy="80" r="1"/><circle cx="376" cy="86" r="1"/><circle cx="14" cy="56" r="1.2"/></g>
    <Sleigh/>
    <SnowHills back="#8d9fd8" mid="#6e82c4" front="#52669f"/>
    <Cabin/>
    <Tree x={46} y={134} s={.98} green="#1f6a4c" glow/><Tree x={74} y={143} s={.62} green="#2a7a58" glow/><Tree x={362} y={134} s={.92} green="#1f6a4c" glow/><Tree x={196} y={146} s={.6} green="#2a7a58" glow/>
    <Snow/><Garland/>
  </svg>
};
