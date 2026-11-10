export const masterEmail='bonie.office@gmail.com';
export function accounts(){try{return JSON.parse(localStorage.getItem('celestine.accounts'))||[{email:masterEmail,user_id:masterEmail,role:'master',approved:true,status:'approved',pin:'1234'}]}catch{return []}}
export function saveAccounts(items){localStorage.setItem('celestine.accounts',JSON.stringify(items))}
export function register(email){let items=accounts();let account=items.find(x=>x.email===email);if(!account){account={email,user_id:email,role:'user',approved:false,status:'pending'};saveAccounts([...items,account])}return account}
