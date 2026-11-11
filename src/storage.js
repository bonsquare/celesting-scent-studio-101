import {openDB} from 'idb';
import {initial,inferMaterialCategory} from './logic';
import {withFormulaCodes} from './formulaCode';
import {collapsePriceHistory} from './pricing';
import {migrateBatches,normalizeCostings} from './migration';
import {supabase,supabaseConfigured} from './supabase';
const db=()=>openDB('perfume-studio',1,{upgrade(database){if(!database.objectStoreNames.contains('app'))database.createObjectStore('app')}});
const withTimeout=(promise,ms)=>Promise.race([promise,new Promise(resolve=>setTimeout(()=>resolve({timeout:true}),ms))]);
export function normalizeData(saved){const data={...structuredClone(initial),...saved};data.ingredients=(data.ingredients||[]).map(x=>{const material={...(x.contentQuantity!==undefined?x:{...x,contentQuantity:1,contentUnit:'mL',purchasePrice:x.unitCost??0}),category:x.category||inferMaterialCategory(x.name),supplier:x.supplier||'',make:x.make||''};return {...material,stockQuantity:material.stockQuantity??material.contentQuantity,reorderLevel:material.reorderLevel??numOrZero(material.contentQuantity)*.2}});data.formulas=(data.formulas||[]).map(f=>({...f,formulationOnly:true,targetAmount:null,summarySnapshot:f.summarySnapshot?{...f.summarySnapshot,formula:{...(f.summarySnapshot.formula||{}),formulationOnly:true}}:f.summarySnapshot,ingredients:(f.ingredients||[]).map(x=>x.materialId?x:{...x,materialId:data.ingredients.find(m=>m.name===x.name)?.id})}));data.formulas=withFormulaCodes(data.formulas).map(collapsePriceHistory);const legacy=data.productions||data.batches||[];data.productions=migrateBatches(legacy,data.formulas).map(batch=>({...batch,status:batch.status||'Completed',expectedYield:batch.expectedYield??batch.calculation?.volume,actualYield:batch.actualYield??batch.calculation?.volume,inventoryDeducted:batch.inventoryDeducted??true}));data.batches=data.productions;data.costings=normalizeCostings(data.costings||[]);return data}
const numOrZero=value=>Number.isFinite(Number(value))?Number(value):0;
export {supabaseConfigured};
export async function loadData(){
 const d=await db(),local=normalizeData(await d.get('app','data')||initial);
 if(!supabase)return local;
 const auth=await withTimeout(supabase.auth.getUser(),5000);
 if(auth?.timeout)return local;
 const {data:{user}}=auth;
 if(!user)return local;
 const remote=await withTimeout(supabase.from('shared_workspace').select('data').eq('workspace_id','celestine').maybeSingle(),5000);
 if(remote?.timeout)return local;
 const {data:row,error}=remote;
 if(error)throw new Error(`Supabase load failed: ${error.message}`);
 if(row?.data){const cloud=normalizeData(row.data);await d.put('app',cloud,'data');return cloud}
 const {error:seedError}=await supabase.from('shared_workspace').insert({workspace_id:'celestine',data:local});
 if(seedError){
  const {data:shared,error:retryError}=await supabase.from('shared_workspace').select('data').eq('workspace_id','celestine').maybeSingle();
  if(retryError||!shared?.data)throw new Error(`Supabase setup failed: ${seedError.message}`);
  const cloud=normalizeData(shared.data);await d.put('app',cloud,'data');return cloud;
 }
 return local;
}
export async function saveData(data){
 const normalized=normalizeData(data);const d=await db();await d.put('app',normalized,'data');
 if(!supabase)return;
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return;
 const {error}=await supabase.from('shared_workspace').upsert({workspace_id:'celestine',data:normalized,updated_at:new Date().toISOString()},{onConflict:'workspace_id'});
 if(error)throw new Error(`Supabase save failed: ${error.message}`);
}
export function exportData(data){const blob=new Blob([JSON.stringify({format:'perfume-studio',version:1,exportedAt:new Date().toISOString(),data},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`perfume-studio-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export async function importData(file){const parsed=JSON.parse(await file.text());if(parsed.format!=='perfume-studio'||parsed.version!==1||!parsed.data||!Array.isArray(parsed.data.batches))throw Error('This is not a supported Perfume Studio backup.');return normalizeData(parsed.data)}
