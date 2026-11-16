/* Pure helpers for weekly priorities, review weeks and local study reminders. */
(function(root){
 'use strict';
 const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
 const add=(s,n)=>{const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
 const monday=s=>{const d=new Date(s+'T12:00:00Z');return add(s,-((d.getUTCDay()+6)%7));};
 const localDate=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 const rank={high:0,normal:1,low:2};
 function priorities(events,week){return events.filter(e=>e.type==='assignment'&&!e.done&&e.date>=week&&e.date<=add(week,6)).slice().sort((a,b)=>(rank[a.priority]??1)-(rank[b.priority]??1)||((a.date||'')+(a.start||'23:59')).localeCompare((b.date||'')+(b.start||'23:59'))||(Number(b.effort)||0)-(Number(a.effort)||0)||String(a.title).localeCompare(String(b.title)));}
 function reviewWeek(item,weekOne){
  if(!validDate(weekOne))return '';
  const source=(item.source||'')+' '+(item.timing||'');
  const found=source.match(/\bdue\s+(?:weeks?|wk\.?)\s*(\d{1,2})\b/i)||source.match(/\b(?:weeks?|wk\.?)\s*(\d{1,2})\b/i);
  const n=Number(found?.[1]);return n>=1&&n<=52?add(monday(weekOne),(n-1)*7):'';
 }
 function reviewKey(course,title,weekOne){return [course,title,weekOne].map(x=>String(x||'').toLowerCase().replace(/\s+/g,' ').trim()).join('|');}
 const ready=(inbox,today)=>inbox.filter(i=>i.status==='pending'&&validDate(i.reviewWeek)&&i.reviewWeek<=monday(today)).sort((a,b)=>a.reviewWeek.localeCompare(b.reviewWeek)||a.course.localeCompare(b.course)||a.title.localeCompare(b.title));
 function reminders(state,now,occurrences){
  const prefs=state.studyReminders||{},log=state.studyReminderLog||{};if(prefs.enabled===false)return [];
  const today=localDate(now),result=[],clock=String(prefs.time||'18:00');
  if(/^\d{2}:\d{2}$/.test(clock)&&now>=new Date(today+'T'+clock)){
   const first=priorities(state.events,monday(today))[0];result.push({id:'daily@'+today,kind:'daily',date:today,title:'Time for a little focused study',body:first?'Start with '+first.title+', or work toward your weekly study goal.':'Make time for your weekly study goal. Choose a session that fits your day.',taskId:first?.id||''});
  }
  if(prefs.sessions!==false)for(const e of occurrences){
   if(e.type!=='study'||e.done||!validDate(e.date)||!/^\d{2}:\d{2}$/.test(e.start||''))continue;
   const start=new Date(e.date+'T'+e.start),end=e.end?new Date(e.date+'T'+e.end):new Date(start.getTime()+45*60000),trigger=new Date(start.getTime()-15*60000);
   if(now>=trigger&&now<end)result.push({id:'session@'+e.id+'@'+e.date,kind:'session',date:e.date,title:now<start?'Study starts soon':'Your study session is now',body:e.title+' · '+e.start+(e.end?'–'+e.end:''),eventId:e.id,taskId:e.taskId||''});
  }
  return result.filter(r=>{const record=log[r.id];return !record?.dismissedAt&&!(record?.snoozeUntil>now.getTime());});
 }
 const api={validDate,add,monday,localDate,priorities,reviewWeek,reviewKey,ready,reminders};root.KUWeekModel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
