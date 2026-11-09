import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {defaultTheme,isTheme,themes} from './themes';

const css=readFileSync(new URL('./themes.css',import.meta.url),'utf8');

describe('color themes',()=>{
  it('has unique ids, a default, and four swatches each',()=>{
    expect(new Set(themes.map(theme=>theme.id)).size).toBe(themes.length);
    expect(isTheme(defaultTheme)).toBe(true);
    expect(isTheme('nope')).toBe(false);
    themes.forEach(theme=>expect(theme.swatch).toHaveLength(4));
  });
  it('defines every variable for every theme in themes.css',()=>{
    const vars=['--t-page','--t-card','--t-card-a','--t-glass','--t-ink','--t-ink2','--t-ink3','--t-muted','--t-brand','--t-brand2','--t-btn','--t-btn-ink','--t-soft','--t-tint','--t-line','--t-line2','--t-chip','--t-chip-ink','--t-c-total','--t-c-mac','--t-c-mat','--t-c-ready','--t-c-hold'];
    for(const theme of themes){
      const start=css.indexOf(theme.id==='pastel'?':root,html[data-theme="pastel"]{':`html[data-theme="${theme.id}"]{`);
      expect(start,`${theme.id} block`).toBeGreaterThan(-1);
      const block=css.slice(start,css.indexOf('}',start));
      for(const name of vars)expect(block,`${theme.id} ${name}`).toContain(`${name}:`);
    }
  });
});