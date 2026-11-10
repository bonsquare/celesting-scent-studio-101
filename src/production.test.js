import {describe,it,expect} from 'vitest';
import {batchWastage,completeBatchInventory,fragranceOilVolume,formulaOutputVolume,inventoryShortages,materialUsage,nextBatchNumber,addDays,daysBetween} from './production';

const calculation={rows:[{materialId:'oil',name:'Oil',unit:'mL',ml:20,grams:19},{materialId:'powder',name:'Powder',unit:'g',ml:5,grams:6}]};
describe('production inventory',()=>{
 it('uses each material purchase unit',()=>expect(materialUsage(calculation).map(x=>x.quantity)).toEqual([20,6]));
 it('detects insufficient stock',()=>expect(inventoryShortages([{id:'oil',stockQuantity:10},{id:'powder',stockQuantity:8}],calculation)).toMatchObject([{materialId:'oil',shortage:10}]));
 it('deducts inventory once',()=>{const ingredients=[{id:'oil',stockQuantity:30},{id:'powder',stockQuantity:10}],batch={calculation};const deducted=completeBatchInventory(ingredients,batch);expect(deducted.map(x=>x.stockQuantity)).toEqual([10,4]);expect(completeBatchInventory(deducted,{...batch,inventoryDeducted:true})).toEqual(deducted)});
 it('calculates production wastage',()=>expect(batchWastage({expectedYield:500,actualYield:480})).toBe(20));
});

describe('production measurement targets',()=>{
 const formula={targetUnit:'g',concentration:20,ingredients:[{materialId:'oil',percentage:20},{materialId:'alc',percentage:80}]};
 const data={ingredients:[{id:'oil',category:'Fragrance Oil',density:.95},{id:'alc',category:'Alcohol',density:.8}]};
 it('converts a fragrance-oil gram target using oil density and volume percentage',()=>expect(fragranceOilVolume(formula,data,20)).toBeCloseTo(105.26,2));
 it('matches the spreadsheet volume method for 20 g oil at 0.85 g/mL',()=>expect(fragranceOilVolume(formula,{ingredients:[{id:'oil',category:'Fragrance Oil',density:.85},{id:'alc',category:'Alcohol',density:1}]},20)).toBeCloseTo(117.65,2));
 it('uses mL directly when the formula is measured in mL',()=>expect(fragranceOilVolume({...formula,targetUnit:'mL'},data,120)).toBeCloseTo(600));
 it('accepts an oil gram target in production regardless of the formula display unit',()=>expect(formulaOutputVolume({...formula,targetUnit:'mL'},data,20,'oil','g')).toBeCloseTo(105.26,2));
 it('keeps total-output targets in mL even when raw materials use grams',()=>expect(formulaOutputVolume(formula,data,500,'output')).toBe(500));
});

describe('batch IDs and dates',()=>{
 it('gives every batch a unique ID even after a delete',()=>{const list=[{batchNumber:'B-20261105-001'},{batchNumber:'B-20261105-003'}];expect(nextBatchNumber(list,'2026-11-05')).toBe('B-20261105-004');expect(nextBatchNumber(list,'2026-11-06')).toBe('B-20261106-001')});
 it('adds days and counts days',()=>{expect(addDays('2026-11-05',30)).toBe('2026-12-05');expect(daysBetween('2026-11-05','2026-12-05')).toBe(30)});
});
