// Color themes you can pick in Settings. Each one is a set of CSS variables defined in themes.css.
export const themes=[
  {id:'pastel',name:'Soft Pastel',note:'Light lavender, pink and mint',dark:false,swatch:['#f4eeff','#8b93f2','#fdeef5','#7fd6a8'],bar:'#f4eeff'},
  {id:'steel',name:'Steel and Ember',note:'Midnight navy, steel blue, ember orange',dark:true,swatch:['#0a1220','#4fb3ff','#ff7a45','#223450'],bar:'#0a1220'},
  {id:'dusk',name:'Dusk Sky',note:'Twilight blue with a sunset glow',dark:true,swatch:['#173a5e','#f5b942','#ff7f7f','#4a4a82'],bar:'#173a5e'},
  {id:'aurora',name:'Aurora Pop',note:'Vivid teal, violet and coral',dark:true,swatch:['#3a3f9c','#2ee6d0','#ff7aa8','#b45cf0'],bar:'#3a3f9c'},
  {id:'grove',name:'Emerald Grove',note:'Sage and deep green with gold',dark:false,swatch:['#0c3b2e','#6d9773','#b46617','#ffba00'],bar:'#0c3b2e'},
  {id:'plum',name:'Plum and Sand',note:'Deep plum with sand and salmon',dark:true,swatch:['#312c51','#48426d','#f0c38e','#f1aa9b'],bar:'#312c51'},
  {id:'sky',name:'Sky Glass',note:'Airy white with bright azure blue',dark:false,swatch:['#e3f2ff','#2f9bf0','#7cc6ff','#14365a'],bar:'#e3f2ff'},
  {id:'violet',name:'Violet Glow',note:'Rich violet with a magenta spark',dark:true,swatch:['#4b3fc0','#7a6df0','#e254f5','#c3b8ff'],bar:'#4b3fc0'},
  {id:'night',name:'Night Pulse',note:'Near-black with violet, coral and mint',dark:true,swatch:['#0b0c14','#8b6cf5','#ff6f7f','#2fd6a0'],bar:'#0b0c14'},
  {id:'lavender',name:'Lavender Peach',note:'Soft lavender with peach and rose',dark:false,swatch:['#f3efff','#a898f0','#ffb3b0','#3b3270'],bar:'#f3efff'}
];
export const themeKey='celestine-theme';
export const defaultTheme='pastel';
export const isTheme=id=>themes.some(theme=>theme.id===id);

export function readStoredTheme(){try{const id=localStorage.getItem(themeKey);return isTheme(id)?id:defaultTheme}catch{return defaultTheme}}

// Sets the theme on the page right away and remembers it on this device.
export function applyTheme(id){
  const theme=themes.find(item=>item.id===id)||themes[0];
  document.documentElement.dataset.theme=theme.id;
  document.documentElement.style.colorScheme=theme.dark?'dark':'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme.bar);
  try{localStorage.setItem(themeKey,theme.id)}catch{/* remembering is optional */}
}

// Show this device's last theme straight away, before the app has loaded its data.
if(typeof document!=='undefined')applyTheme(readStoredTheme());
