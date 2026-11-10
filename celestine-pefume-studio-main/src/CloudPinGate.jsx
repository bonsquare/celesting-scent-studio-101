import {useEffect,useState} from 'react';
import './pin.css';
import {supabase,signOut} from './supabase';
async function unlockKey(){const{data}=await supabase.auth.getSession();const session=data.session;if(!session)return null;try{const payload=JSON.parse(atob(session.access_token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));return payload.session_id?`studio-pin:${session.user.id}:${payload.session_id}`:null}catch{return null}}
const idleLimit=5*60*1000;
async function rememberUnlock(){const key=await unlockKey();if(key)try{sessionStorage.setItem(key,String(Date.now()))}catch{/* Storage is optional. */}}
export default function CloudPinGate({children}){
 const[state,setState]=useState('loading'),[digits,setDigits]=useState(['','','','']),[confirmation,setConfirmation]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[attempts,setAttempts]=useState(0);
 const call=async(action,pin)=>{const {data,error}=await supabase.rpc('pin_action',{action,supplied_pin:pin||null});if(error)throw error;return data};
 const refresh=()=>call('status').then(async data=>{const key=await unlockKey();let remembered=false;try{remembered=key&&Date.now()-Number(sessionStorage.getItem(key)||0)<idleLimit;if(key&&data.status!=='enter_pin')sessionStorage.removeItem(key)}catch{/* Storage is optional. */}setState(data.status==='enter_pin'&&remembered?'unlocked':data.status);setAttempts(data.attempts||0)}).catch(err=>{setError(err.message);setState('error')});
 useEffect(()=>{refresh()},[]);
 useEffect(()=>{if(!busy&&digits.every(digit=>digit==='')&&['enter_pin','setup','new_pin','temporary_pin'].includes(state))document.querySelector('.login-page .pin-boxes input')?.focus()},[digits,busy,state]);
 useEffect(()=>{
  if(state!=='unlocked')return;
  let last=Date.now(),key=null,active=true;
  unlockKey().then(value=>{if(active){key=value;try{const saved=Number(sessionStorage.getItem(key)||0);if(saved>0)last=saved}catch{}}});
  const lock=()=>{if(key)try{sessionStorage.removeItem(key)}catch{}setDigits(['','','','']);setState('enter_pin');setError('Locked after 5 minutes of inactivity. Enter your PIN to continue.');};
  let persisted=0;
  const persist=()=>{if(key&&Date.now()-last<idleLimit&&last!==persisted)try{sessionStorage.setItem(key,String(last));persisted=last}catch{}};
  const activity=()=>{if(Date.now()-last>=idleLimit){lock();return}last=Date.now()};
  const check=()=>{if(Date.now()-last>=idleLimit)lock()};
  const events=['pointerdown','keydown','scroll','touchstart'];
  events.forEach(event=>window.addEventListener(event,activity,{passive:true,capture:true}));
  document.addEventListener('visibilitychange',check);
  window.addEventListener('studio-lock',lock);
  const timer=setInterval(()=>{check();persist()},1000);
  window.addEventListener('pagehide',persist);
  return()=>{active=false;clearInterval(timer);events.forEach(event=>window.removeEventListener(event,activity,true));document.removeEventListener('visibilitychange',check);window.removeEventListener('studio-lock',lock);window.removeEventListener('pagehide',persist)};
 },[state]);
 if(state==='unlocked')return children;
 if(state==='loading')return <div className="loading" role="status"><img className="loading-logo" src="/celestine-logo.jpg" alt="Celestine & Co." width="84" height="84"/><span>Refreshing your workspace…</span></div>;
 const enter=async(value)=>{if(value.length!==4||busy)return;setError('');if(state==='setup'||state==='new_pin'){
  if(value==='0000'){setDigits(['','','','']);return setError('Choose a PIN different from 0000.');}
  if(!confirmation){setConfirmation(value);setDigits(['','','','']);return;}
  if(value!==confirmation){setConfirmation('');setDigits(['','','','']);return setError('PINs did not match. Choose your PIN again.');}
 }setBusy(true);try{const data=await call(state==='setup'||state==='new_pin'?'set_pin':'verify',value);setAttempts(data.attempts||0);if(data.status==='unlocked')await rememberUnlock();if(data.status==='incorrect')setError('Incorrect PIN.');else setState(data.status);setDigits(['','','','']);setConfirmation('')}catch(err){setError(err.message)}finally{setBusy(false)}};
 const locked=state==='locked'||state==='reset_requested';
 return <main className="login-page"><section className="login-card"><p className="eyebrow">CELESTINE & CO.</p><h2>{locked?'Account locked':confirmation?'Confirm your new PIN':state==='setup'||state==='new_pin'?'Create your personal PIN':state==='temporary_pin'?'Enter temporary PIN 0000':'Enter your PIN'}</h2><p>{locked?'Request a reset and wait for master approval.':state==='loading'?'Checking account…':'Use four digits to continue.'}</p>{!locked&&state!=='loading'&&state!=='error'&&<div className="pin-boxes">{digits.map((digit,index)=><input key={index} aria-label={`PIN digit ${index+1}`} type="password" inputMode="numeric" maxLength={1} disabled={busy} value={digit} onChange={e=>{const next=[...digits];next[index]=e.target.value.replace(/\D/g,'').slice(-1);setDigits(next);if(next[index])e.target.nextElementSibling?.focus();enter(next.join(''))}} onKeyDown={e=>{if(e.key==='Backspace'){e.preventDefault();const next=[...digits],target=next[index]?index:Math.max(0,index-1);next[target]='';setDigits(next);if(target!==index)e.target.previousElementSibling?.focus()}}}/>)}</div>}{attempts>0&&<p>Incorrect attempts: {attempts}/5</p>}{locked&&<><button className="btn primary" disabled={busy||state==='reset_requested'} onClick={async()=>{setBusy(true);try{await call('request_reset');setState('reset_requested');setError('Request sent to the master.')}catch(err){setError(err.message)}finally{setBusy(false)}}}>Request PIN reset</button><button className="btn" onClick={refresh}>Check approval</button></>}{state==='error'&&<button className="btn" onClick={refresh}>Retry</button>}{error&&<p role="alert" className="warning">{error}</p>}<button className="btn" onClick={()=>signOut()}>Sign out</button></section></main>
}
