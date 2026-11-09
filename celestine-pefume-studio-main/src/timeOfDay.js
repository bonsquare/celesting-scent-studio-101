// Morning 5:00 to 11:59, afternoon 12:00 to 17:59, evening 18:00 to 4:59.
export function timeOfDay(date=new Date()){
  const hour=date.getHours();
  if(hour>=5&&hour<12)return 'morning';
  if(hour>=12&&hour<18)return 'afternoon';
  return 'evening';
}

export const greetings={morning:'Good morning',afternoon:'Good afternoon',evening:'Good evening'};

// The Christmas theme runs from November 1 through December 31. On January 1 it returns to normal.
export const isChristmasSeason=(date=new Date())=>date.getMonth()===10||date.getMonth()===11;

// ?theme=christmas or ?theme=normal previews a theme any time. Otherwise Christmas shows during the season.
export function themeFromSearch(search,date=new Date()){
  try{
    const wanted=new URLSearchParams(search).get('theme');
    if(wanted==='christmas'||wanted==='normal')return wanted;
  }catch{/* fall through to the calendar */}
  return isChristmasSeason(date)?'christmas':'normal';
}

// ?scene=morning (or afternoon, evening) previews a scene at any hour. Anything else uses the clock.
export function sceneFromSearch(search,date=new Date()){
  try{
    const wanted=new URLSearchParams(search).get('scene');
    return wanted in greetings?wanted:timeOfDay(date);
  }catch{return timeOfDay(date)}
}
