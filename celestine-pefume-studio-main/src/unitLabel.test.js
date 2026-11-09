import {describe,expect,it} from 'vitest';
import {unitLabel} from './logic';

describe('unitLabel',()=>{
  it('shows mL as ML',()=>{
    expect(unitLabel('mL')).toBe('ML');
    expect(unitLabel('ml')).toBe('ML');
  });
  it('shows g and grams as GRAMS',()=>{
    expect(unitLabel('g')).toBe('GRAMS');
    expect(unitLabel('grams')).toBe('GRAMS');
    expect(unitLabel('Gram')).toBe('GRAMS');
  });
  it('leaves other values unchanged',()=>{
    expect(unitLabel('₱')).toBe('₱');
    expect(unitLabel('g/mL')).toBe('g/mL');
    expect(unitLabel('%')).toBe('%');
  });
  it('does not change stored values',()=>{
    const stored={contentUnit:'mL'};
    unitLabel(stored.contentUnit);
    expect(stored.contentUnit).toBe('mL');
  });
});
