import {createClient} from '@supabase/supabase-js';

const url=import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey=import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
export const MASTER_EMAIL='bonie.office@gmail.com';

export const supabaseConfigured=Boolean(url&&anonKey);
export const supabase=supabaseConfigured?createClient(url,anonKey,{
 auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'},
}):null;

export async function signInWithGoogle(){
 if(!supabase)throw new Error('Supabase is not configured.');
 const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin}});
 if(error)throw error;
}

export async function signOut(){
 if(!supabase)return;
 const {error}=await supabase.auth.signOut();
 if(error)throw error;
}

export async function getAccessProfile(user){
 if(!user)return null;
 if(user.email?.toLowerCase()===MASTER_EMAIL)return {user_id:user.id,email:user.email,approved:true,status:'approved',role:'master'};
 const {data,error}=await supabase.from('profiles').select('user_id,email,approved,status,role').eq('user_id',user.id).maybeSingle();
 if(error)throw error;
 return data||{user_id:user.id,email:user.email,approved:false,status:'pending',role:'user'};
}

export async function listAccessProfiles(){
 const {data,error}=await supabase.from('profiles').select('user_id,email,approved,status,role,created_at').order('created_at',{ascending:true});
 if(error)throw error;
 return data||[];
}

export async function setUserApproval(userId,approved){
 const {error}=await supabase.from('profiles').update({approved,status:approved?'approved':'rejected',updated_at:new Date().toISOString()}).eq('user_id',userId).neq('role','master');
 if(error)throw error;
}

export async function updateUserInformation(metadata){const {data,error}=await supabase.auth.updateUser({data:metadata});if(error)throw error;return data.user}
export async function updateUserPassword(password){const {error}=await supabase.auth.updateUser({password});if(error)throw error}
