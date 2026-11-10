import {useEffect,useState} from 'react';
import {Check,ShieldCheck,X} from 'lucide-react';
import {listAccessProfiles,setUserApproval} from './supabase';

export function accessStatus(profile){
 if(profile.role==='master')return {label:'Master account',tone:'master'};
 if(profile.status==='rejected')return {label:'Rejected',tone:'rejected'};
 if(profile.approved)return {label:'Accepted',tone:'accepted'};
 return {label:'Pending approval',tone:'pending'};
}

export function accessSummary(profiles){
 return profiles.reduce((summary,profile)=>({
  members:summary.members+(profile.role==='master'?0:1),
  master:summary.master+(profile.role==='master'?1:0),
  pending:summary.pending+(profile.role!=='master'&&!profile.approved&&profile.status!=='rejected'?1:0),
 }),{members:0,master:0,pending:0});
}

export default function AccessManagement(){
 const[profiles,setProfiles]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState('');
 const refresh=()=>{setLoading(true);setError('');return listAccessProfiles().then(setProfiles).catch(err=>setError(err.message)).finally(()=>setLoading(false))};
 useEffect(()=>{refresh()},[]);
 const change=async(profile,approved)=>{if(profile.role==='master')return;if(!confirm(`${approved?'Accept':profile.approved?'Remove access for':'Reject'} ${profile.email}?${profile.approved&&!approved?' They will no longer be able to open the workspace.':''}`))return;setBusy(profile.user_id);setError('');try{await setUserApproval(profile.user_id,approved);setProfiles(items=>items.map(item=>item.user_id===profile.user_id?{...item,approved,status:approved?'approved':'rejected'}:item))}catch(err){setError(err.message)}finally{setBusy('')}};
 const summary=accessSummary(profiles);
 return <section className="card access-card"><div className="card-head"><div><p className="eyebrow">MASTER ACCOUNT</p><h2>Workspace access</h2><p className="access-subtitle">Manage who can open your studio.</p></div><span className="access-shield"><ShieldCheck size={22}/></span></div><div className="access-summary" aria-label="Access summary"><div><strong>{summary.members}</strong><span>Members</span></div><div><strong>{summary.pending}</strong><span>Pending</span></div><div><strong>{summary.master}</strong><span>Master</span></div></div>{loading?<p className="access-status">Loading accounts…</p>:profiles.length?<div className="access-list">{profiles.map(profile=>{const state=accessStatus(profile);return <div className={`access-row access-row-${state.tone}`} key={profile.user_id}><div className="access-identity"><span className="access-avatar" aria-hidden="true">{profile.email?.slice(0,1).toUpperCase()}</span><span><strong>{profile.email}</strong><small>{state.label}</small></span></div>{profile.role==='master'?<span className="access-badge master"><ShieldCheck size={14}/> Master</span>:profile.approved||profile.status==='rejected'?<div className="access-actions"><span className={`access-badge ${state.tone}`}>{state.label}</span>{profile.approved?<button type="button" className="btn reject" disabled={busy===profile.user_id} onClick={()=>change(profile,false)}>Remove access</button>:<button type="button" className="btn" disabled={busy===profile.user_id} onClick={()=>change(profile,true)}>Restore access</button>}</div>:<div className="access-actions"><button className="btn primary" disabled={busy===profile.user_id} onClick={()=>change(profile,true)}><Check size={15}/> Accept</button><button className="btn reject" disabled={busy===profile.user_id} onClick={()=>change(profile,false)}><X size={15}/> Reject</button></div>}</div>})}</div>:<p className="empty">No accounts have requested access yet.</p>}{error&&<p className="warning" role="alert">{error}</p>}</section>
}
