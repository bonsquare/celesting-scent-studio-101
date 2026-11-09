import {money,rateMoney,unitLabel} from './logic';

const display=value=>new Intl.NumberFormat('en-PH',{maximumFractionDigits:2}).format(Number(value)||0);

export default function CostingMaterials({calc,unit,onEdit}){return <div className="costing-materials"><div className="costing-material-list">{calc.rows.map(row=><div className="costing-material-row" key={row.id}><div><strong>{row.name}</strong><small>{display(row.percentage)}% · {display(unit==='g'?row.grams:row.ml)} {unitLabel(unit)}</small></div><div><small>{rateMoney(row.unitCost)} / {unitLabel(row.unit)}</small><strong>{money(row.cost)}</strong></div></div>)}</div><div className="costing-material-total"><span>Total raw materials</span><strong>{money(calc.ingredientCost)}</strong></div><button className="btn" onClick={onEdit}>Open formulation</button></div>}
