import {useEffect,useState} from 'react';
import {Check,Download,Smartphone} from 'lucide-react';
import {clearInstallPrompt,installPrompt,isIos,isStandalone,onInstallChange} from './pwa';

// Settings card: install the app on this device, or explain how if the browser needs a manual step.
export default function InstallApp(){
  const [,refresh]=useState(0),[note,setNote]=useState('');
  useEffect(()=>onInstallChange(()=>refresh(n=>n+1)),[]);
  const installed=isStandalone(),prompt=installPrompt();
  const install=async()=>{
    if(!prompt)return;
    prompt.prompt();
    const choice=await prompt.userChoice.catch(()=>({outcome:'dismissed'}));
    setNote(choice.outcome==='accepted'?'Installing… look for Celestine Studio on your home screen or Start menu.':'Install cancelled. You can try again any time.');
    clearInstallPrompt();
  };
  return <section className="card install-card">
    <div className="card-head"><div><p className="eyebrow">THIS DEVICE</p><h2>Install the app</h2></div><Smartphone size={22}/></div>
    {installed
      ?<p className="install-status ok"><Check size={16}/> You're using the installed app. It opens fast and works offline.</p>
      :prompt
        ?<><p>Install Celestine Studio for quick access from your home screen or desktop. It opens full screen and keeps working without internet.</p><button type="button" className="btn primary" onClick={install}><Download size={16}/> Install app</button></>
        :isIos()
          ?<ol className="install-steps"><li>Tap the <strong>Share</strong> button in Safari.</li><li>Choose <strong>Add to Home Screen</strong>.</li><li>Tap <strong>Add</strong>.</li></ol>
          :<p>To install, open your browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>. If you don't see it, this browser may not support installing.</p>}
    {note&&<p className="install-status" role="status">{note}</p>}
    <p className="install-foot">After the first load, the app works offline. Your changes save on this device and sync when you're back online.</p>
  </section>;
}
