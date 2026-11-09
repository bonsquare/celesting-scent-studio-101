export const formatDay=iso=>{if(!iso)return '—';const date=new Date(`${iso}T00:00:00`);return Number.isNaN(date.getTime())?iso:date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})};
// "Nov 5 → Nov 30, 2026": the year is shown once when both dates share it.
export const formatRange=(from,to)=>{
  if(!from||!to)return '—';
  const a=new Date(`${from}T00:00:00`),b=new Date(`${to}T00:00:00`);
  if(Number.isNaN(a.getTime())||Number.isNaN(b.getTime()))return `${from} → ${to}`;
  const short=date=>date.toLocaleDateString('en-US',{month:'short',day:'numeric'});
  return a.getFullYear()===b.getFullYear()?`${short(a)} → ${short(b)}, ${b.getFullYear()}`:`${formatDay(from)} → ${formatDay(to)}`;
};
export const statusClass=status=>`aging-${String(status).toLowerCase().replaceAll(' ','-')}`;
const days=count=>`${count} day${count===1?'':'s'}`;

function Bar({label,stage}){
  const note=stage.state==='Completed'?(stage.completedOn?`Completed ${formatDay(stage.completedOn)}`:'Completed'):stage.state==='Not set'?'Not set':stage.state==='Scheduled'?`Starts ${formatDay(stage.start)}`:`${days(stage.daysLeft)} left`;
  return <div className={`ab-stage ab-${stage.state.toLowerCase().replaceAll(' ','-')}`}>
    <div className="ab-stage-head"><strong>{label}</strong><span>{stage.percent}%</span></div>
    <div className="timeline-bar"><i style={{width:`${stage.percent}%`}}/></div>
    <div className="ab-stage-meta"><small>{stage.state==='Completed'?note:`${stage.state} · ${note}`}</small><small>{formatDay(stage.start)} → {formatDay(stage.end)}</small></div>
  </div>;
}

// Maceration, maturation and overall aging. Every number comes from the dates, so nothing here is stored.
// parts: "all" shows overall aging first, then maceration, then maturation. "overall" or "stages" shows just that part.
export default function AgingBars({view,compact=false,parts='all'}){
  return <div className={`aging-bars${compact?' is-compact':''}`}>
    {parts!=='stages'&&<div className="ab-stage ab-overall">
      <div className="ab-stage-head"><strong>Overall aging</strong><span>{view.overall.percent}%</span></div>
      <div className="timeline-bar"><i style={{width:`${view.overall.percent}%`}}/></div>
      <div className="ab-stage-meta"><small>Stage: {view.overall.stage}</small><small>Ready {formatDay(view.overall.expectedReadyDate)}</small></div>
    </div>}
    {parts!=='overall'&&<><Bar label="Maceration" stage={view.maceration}/><Bar label="Maturation" stage={view.maturation}/></>}
  </div>;
}
