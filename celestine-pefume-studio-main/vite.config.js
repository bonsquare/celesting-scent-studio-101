import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {VitePWA} from 'vite-plugin-pwa';

const shortcut=(name,page)=>({name,short_name:name,url:`/?page=${encodeURIComponent(page)}`,icons:[{src:'/icon-192.png',sizes:'192x192',type:'image/png'}]});

export default defineConfig({plugins:[react(),VitePWA({
  registerType:'prompt',
  includeAssets:['icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png','celestine-logo.jpg'],
  manifest:{
    id:'/',
    name:'Celestine & Co. Perfume Studio',
    short_name:'Celestine Studio',
    description:'Perfume formulation, production costing, pricing and inventory. Works offline.',
    lang:'en-PH',
    theme_color:'#093622',
    background_color:'#093622',
    display:'standalone',
    orientation:'any',
    start_url:'/',
    scope:'/',
    categories:['business','productivity'],
    icons:[
      {src:'/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},
      {src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},
      {src:'/icon-maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}
    ],
    shortcuts:[
      shortcut('Formulation','Formulation'),
      shortcut('Costing','Costing'),
      shortcut('Inventory','Inventory of Raw Materials'),
      shortcut('Batches','Batches')
    ]
  },
  workbox:{globPatterns:['**/*.{js,css,html,svg,png,jpg,jpeg,ico,webmanifest}'],navigateFallback:'/index.html',cleanupOutdatedCaches:true}
})]});
