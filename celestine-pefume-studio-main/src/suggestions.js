// Suggestions are built from what is already saved, so they follow your data across devices.

const clean=value=>String(value??'').trim().replace(/\s+/g,' ');

// One option per distinct value (ignoring capitalisation). `count` is how many records use it;
// `record` is the first record that used it. `hint` is optional small text shown beside the value.
export function uniqueOptions(records,pick,hint){
  const found=new Map();
  for(const record of records||[]){
    const value=clean(pick(record));
    if(!value)continue;
    const key=value.toLowerCase(),entry=found.get(key)||{value,count:0,record};
    entry.count+=1;
    found.set(key,entry);
  }
  return [...found.values()].map(entry=>({...entry,hint:hint?hint(entry):''}));
}

export const plural=(count,word)=>`${count} ${word}${count===1?'':'s'}`;

// Best matches first: starts-with, then more-used, then alphabetical.
export function rankOptions(options,text,limit=8){
  const needle=clean(text).toLowerCase();
  return (options||[])
    .filter(option=>option&&option.value&&(!needle||option.value.toLowerCase().includes(needle)))
    .sort((a,b)=>{
      const aStart=a.value.toLowerCase().startsWith(needle)?0:1,bStart=b.value.toLowerCase().startsWith(needle)?0:1;
      return aStart-bStart||(b.count||0)-(a.count||0)||a.value.localeCompare(b.value);
    })
    .slice(0,limit);
}

// Choosing a known material name for a NEW material fills what the two share.
// Make, Inspired by and Scent name are only filled when still empty. Supplier, price and quantities are left alone.
export function prefillMaterial(draft,material){
  if(!material)return draft;
  const empty=value=>!String(value??'').trim();
  return {
    ...draft,
    category:material.category||draft.category,
    density:material.density??draft.density,
    contentUnit:material.contentUnit==='g'?'g':'mL',
    make:empty(draft.make)?(material.make||''):draft.make,
    inspiredBy:empty(draft.inspiredBy)?(material.inspiredBy||''):draft.inspiredBy,
    scentName:empty(draft.scentName)?(material.scentName||''):draft.scentName
  };
}
