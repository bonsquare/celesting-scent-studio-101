// Helpers for installing the app and opening it on a chosen page (used by the app shortcuts).

// Open /?page=Costing and the app starts on that page. Anything unknown falls back to the Dashboard.
export function pageFromSearch(search,names,fallback='Dashboard'){
  try{
    const wanted=new URLSearchParams(search).get('page');
    return names.includes(wanted)?wanted:fallback;
  }catch{return fallback}
}

// The browser offers the install prompt once, early. Keep it so the Install button can use it later.
let deferred=null;
const listeners=new Set();
const notify=()=>listeners.forEach(listener=>listener());
if(typeof window!=='undefined'){
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferred=event;notify()});
  window.addEventListener('appinstalled',()=>{deferred=null;notify()});
}
export const installPrompt=()=>deferred;
export const clearInstallPrompt=()=>{deferred=null;notify()};
export const onInstallChange=listener=>{listeners.add(listener);return()=>listeners.delete(listener)};

export const isStandalone=()=>typeof window!=='undefined'&&(window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true);
export const isIos=()=>typeof navigator!=='undefined'&&(/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1));
