import {useEffect,useState} from 'react';
import {supabase} from './supabase';
export default function CloudPinRequests(){
 const[requests,setRequests]=useState([]),[error,setError]=useState('');
 const refresh=async()=>{const{data,error}=await supabase.rpc('master_pin_requests');if(error)setError(error.message);else setRequests(data||[])};
 useEffect(()=>{refresh();const timer=setInterval(refresh,10000);return()=>clearInterval(timer)},[]);
 return <section className="card"><div className="card-head"><h2>PIN reset requests</h2><button className="btn" onClick={refresh}>Refresh</button></div>{requests.length?requests.map(item=><div className="access-row" key={item.user_id}><strong>{item.email}</strong><button className="btn" onClick={async()=>{if(!confirm(`Reset ${item.email} to temporary PIN 0000?`))return;const{error}=await supabase.rpc('approve_pin_reset',{target_user:item.user_id});if(error)setError(error.message);else refresh()}}>Approve PIN reset</button></div>):<p>No pending requests.</p>}{error&&<p role="alert">{error}</p>}</section>
}
