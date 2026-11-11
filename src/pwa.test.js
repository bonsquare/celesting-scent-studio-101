import {describe,expect,it} from 'vitest';
import {pageFromSearch} from './pwa';

const names=['Dashboard','Formulation','Costing','Batches','Inventory of Raw Materials','Raw Material Registration','Settings'];

describe('pageFromSearch',()=>{
  it('opens the page named in the link',()=>{
    expect(pageFromSearch('?page=Costing',names)).toBe('Costing');
    expect(pageFromSearch('?page=Inventory%20of%20Raw%20Materials',names)).toBe('Inventory of Raw Materials');
  });
  it('falls back to the Dashboard for unknown, empty or missing pages',()=>{
    expect(pageFromSearch('?page=Nope',names)).toBe('Dashboard');
    expect(pageFromSearch('?page=',names)).toBe('Dashboard');
    expect(pageFromSearch('',names)).toBe('Dashboard');
    expect(pageFromSearch('?other=1',names)).toBe('Dashboard');
  });
  it('is case sensitive, so look-alikes are ignored',()=>{
    expect(pageFromSearch('?page=costing',names)).toBe('Dashboard');
  });
  it('uses a custom fallback when given',()=>{
    expect(pageFromSearch('?page=Nope',names,'Settings')).toBe('Settings');
  });
});
