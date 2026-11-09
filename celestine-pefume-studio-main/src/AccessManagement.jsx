import {useEffect,useState} from 'react';
import {Check,ShieldCheck,X} from 'lucide-react';
import {listAccessProfiles,setUserApproval} from './supabase';

export default function AccessManagement(){
 const[profiles,setProfiles]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState('');
 const refresh=()=>{setLoading(true);setError('');return listAccessProfiles().then(setProfiles).catch(err=>setError(err.message)).finally(()=>setLoading(false))};
 useEffect(()=>{refresh()},[]);
 const change=async(profile,approved)=>{setBusy(profile.user_id);setError('');try{await setUserApproval(profile.user_id,approved);setProfiles(items=>items.map(item=>item.user_id===profile.user_id?{...item,approved,status:approved?'approved':'rejected'}:item))}catch(err){setError(err.message)}finally{setBusy('')}};
 return <section className="card access-card"><div className="card-head"><div><p className="eyebrow">MASTER ACCOUNT</p><h2>User access</h2></div><ShieldCheck size={22}/></div><p className="muted">Accept or reject accounts requesting access to the workspace.</p>{loading?<p className="access-status">Loading accounts…</p>:profiles.length?<div className="access-list">{profiles.map(profile=><div className="access-row" key={profile.user_id}><div><strong>{profile.email}</strong><small>{profile.role==='master'?'Master account':profile.status==='rejected'?'Rejected':profile.approved?'Accepted':'Waiting for approval'}</small></div>{profile.role==='master'?<span className="access-badge approved">Master</span>:<div className="access-actions"><button className="btn primary" disabled={busy===profile.user_id||profile.approved} onClick={()=>change(profile,true)}><Check size={15}/> Accept</button><button className="btn reject" disabled={busy===profile.user_id||profile.status==='rejected'} onClick={()=>change(profile,false)}><X size={15}/> Reject</button></div>}</div>)}</div>:<p className="empty">No accounts have requested access yet.</p>}{error&&<p className="warning" role="alert">{error}</p>}</section>
}
