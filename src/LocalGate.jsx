import {useState} from 'react';
import {accounts,register,saveAccounts} from './localAccounts';
export default function LocalGate({children}){
 const[resetVerified,setResetVerified]=useState(false);
 const[pendingPin,setPendingPin]=useState('');
 const requestReset=()=>{saveAccounts(accounts().map(x=>x.email===account.email?{...x,resetRequested:true}:x));setError('PIN reset requested. Ask the master to approve recovery.')};
 const[email,setEmail]=useState(localStorage.getItem('celestine.localEmail')||''),[account,setAccount]=useState(null),[digits,setDigits]=useState(['','','','']),[attempts,setAttempts]=useState(0),[error,setError]=useState(''),[user,setUser]=useState(null);
 if(user)return children(user,()=>{setUser(null);setAccount(null);setResetVerified(false);setDigits(['','','',''])});
 if(account&&(accounts().find(x=>x.email===account.email)?.locked))return <main className="login-page"><section className="login-card"><h2>Account locked</h2><p>{account.email}</p><p>Five incorrect PIN attempts.</p><button className="btn primary" onClick={requestReset}>Request PIN reset</button><button className="btn" onClick={()=>{setResetVerified(false);setPendingPin('');setAccount(null);setDigits(['','','',''])}}>Back to sign in</button>{error&&<p role="status">{error}</p>}</section></main>;
 const open=()=>{const normalized=email.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))return setError('Enter a valid email.');const next=register(normalized);if(!next.approved)return setError(next.status==='rejected'?'Registration rejected. Contact the master account.':'Registration saved. Waiting for master approval.');setAccount(next);setError('');setAttempts(next.failedAttempts||0);setResetVerified(false);setPendingPin('');setDigits(['','','','']);localStorage.setItem('celestine.localEmail',normalized)};
 const enter=(value)=>{
  if(!/^\d{4}$/.test(value))return;
  const current=accounts().find(x=>x.email===account.email);
  if(!current?.approved)return setError('Account access is not approved.');
  if(current.locked){setAttempts(current.failedAttempts||5);return setError(current.resetRequested?'PIN reset requested. Wait for master approval.':'Account locked. Click Request PIN reset.');}
  if((current.mustChangePin&&resetVerified)||!current.pin){
   if(value==='0000')return setError('Choose a personal PIN different from 0000.');
   if(!pendingPin){setPendingPin(value);setDigits(['','','','']);setError('Enter the new PIN again to confirm.');return;}
   if(value!==pendingPin){setPendingPin('');setDigits(['','','','']);return setError('PINs did not match. Enter a new PIN.');}
   saveAccounts(accounts().map(x=>x.email===current.email?{...x,pin:value,mustChangePin:false,failedAttempts:0}:x));setPendingPin('');setResetVerified(false);setUser({email:current.email,role:current.role});return;
  }
  if(current.pin&&current.pin!==value){
   const count=(current.failedAttempts||0)+1;
   saveAccounts(accounts().map(x=>x.email===current.email?{...x,failedAttempts:count,locked:count>=5,resetRequested:false}:x));
   setAttempts(count);setDigits(['','','','']);
   return setError(count>=5?'Account locked after 5 incorrect PINs. Click Request PIN reset.':'Incorrect PIN.');
  }
  if(current.mustChangePin){setResetVerified(true);setDigits(['','','','']);setError('Default PIN accepted. Enter your final new 4-digit PIN.');return;}
  saveAccounts(accounts().map(x=>x.email===current.email?{...x,pin:current.pin||value,failedAttempts:0}:x));setUser({email:current.email,role:current.role});
 };
 return <main className="login-page"><section className="login-card"><p className="eyebrow">CELESTINE & CO.</p><h2>{account?(account.pin?'Enter your PIN':'Set your own PIN'):'Sign in or register'}</h2><p>{account?account.email:'Enter your email. New registrations require master approval.'}</p>{!account?<form onSubmit={e=>{e.preventDefault();open()}}><input aria-label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/><button className="btn primary">Continue</button></form>:<><div className="pin-boxes">{digits.map((digit,i)=><input key={i} aria-label={`PIN digit ${i+1}`} type="password" inputMode="numeric" maxLength={1} value={digit} onChange={e=>{const next=[...digits];next[i]=e.target.value.replace(/\D/g,'').slice(-1);setDigits(next);setError('');if(next[i])e.target.nextElementSibling?.focus();enter(next.join(''))}} onKeyDown={e=>{if(e.key==='Backspace'){e.preventDefault();const next=[...digits];const target=next[i]?i:Math.max(0,i-1);next[target]='';setDigits(next);if(target!==i)e.target.previousElementSibling?.focus()}}}/>)}</div><p>Incorrect attempts: {attempts}</p><button className="btn" onClick={()=>{setAccount(null);setDigits(['','','','']);setError('')}}>Use another email</button>{attempts>=5&&<button className="btn" onClick={()=>{saveAccounts(accounts().map(x=>x.email===account.email?{...x,resetRequested:true}:x));setError('PIN reset requested. Ask the master to approve recovery.')}}>Forgot PIN?</button>}</>}{error&&<p role="status" className="warning">{error}</p>}</section></main>
}
