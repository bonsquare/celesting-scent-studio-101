import {describe,expect,it} from 'vitest';
import {withFormulaCreator,creatorLabel,blankZero} from './formulaCreator';

describe('formula creator attribution',()=>{
 it('assigns the logged-in account to a new formula',()=>{
  expect(withFormulaCreator({}, {name:'Bonifacio Orong',email:'bonie@example.com'})).toEqual({
   createdBy:{name:'Bonifacio Orong',email:'bonie@example.com'},
  });
 });

 it('keeps the original creator when an existing formula is edited',()=>{
  const original={name:'Summer Mist',createdBy:{name:'Ava',email:'ava@example.com'}};
  expect(withFormulaCreator(original,{name:'Bonifacio Orong',email:'bonie@example.com'})).toBe(original);
 });

 it('formats the creator name and email for display',()=>{
  expect(creatorLabel({name:'Bonifacio Orong',email:'bonie@example.com'})).toBe('Bonifacio Orong · bonie@example.com');
  expect(creatorLabel({name:'Bonifacio Orong',email:''})).toBe('Bonifacio Orong');
 });
});

describe('formula input display',()=>{
 it('renders zero numeric inputs as blank while preserving other values',()=>{
  expect(blankZero(0)).toBe('');
  expect(blankZero('0')).toBe('');
  expect(blankZero(20)).toBe(20);
 });
});
