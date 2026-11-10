// Visual viewport follows the keyboard on mobile browsers that don't resize layout.
const viewport=window.visualViewport;
let frame;
function update(){cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const root=document.documentElement;root.style.setProperty('--visible-height',`${viewport?.height||window.innerHeight}px`);root.style.setProperty('--visible-top',`${viewport?.offsetTop||0}px`);const editing=document.activeElement?.matches('input,textarea,select');root.classList.toggle('keyboard-open',Boolean(editing&&viewport&&window.innerHeight-viewport.height>120));})}
viewport?.addEventListener('resize',update,{passive:true});
viewport?.addEventListener('scroll',update,{passive:true});
window.addEventListener('resize',update,{passive:true});
document.addEventListener('focusin',update);
document.addEventListener('focusout',update);
update();
