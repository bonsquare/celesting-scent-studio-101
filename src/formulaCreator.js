export function withFormulaCreator(formula,user){
 if(formula.createdBy)return formula;
 return {...formula,createdBy:{name:user?.name||'Local workspace',email:user?.email||''}};
}

export function creatorLabel(creator){
 return creator?.name||'Unknown creator';
}

export function blankZero(value){
 return Number(value)===0?'':value;
}
