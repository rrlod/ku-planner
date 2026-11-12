// Pure date, recurrence and scheduling helpers; used by the app and its checks.
const Planning = (() => {
 const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 const parse=s=>new Date(s+'T12:00:00');
 const shift=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return iso(d)};
 const monday=s=>{const d=parse(s);d.setDate(d.getDate()-((d.getDay()+6)%7));return iso(d)};
 const minutes=s=>Number(s.slice(0,2))*60+Number(s.slice(3));
 const time=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
 const duration=e=>e.end?Math.max(0,minutes(e.end)-minutes(e.start)):0;
 function eventsForWeek(state,week){
  const result=[];
  for(const e of state.events){if(e.recurring){const offset=(parse(e.date).getDay()+6)%7,date=shift(week,offset);const academic=typeof AcademicCalendar!=='undefined'&&['lecture','lab'].includes(e.type);if(date>=e.date&&(!academic||AcademicCalendar.classAllowed(e,date)))result.push({...e,date,done:!!state.completed?.[e.id+'@'+date]});}
   else if(e.date>=week&&e.date<=shift(week,6))result.push({...e});}
  return result;
 }
 function prepareRemaining(state,task,now){
  const allocated=state.events.filter(e=>e.type==='study'&&e.taskId===task.id&&(e.done||new Date(e.date+'T'+e.start)>=now)).reduce((s,e)=>s+duration(e),0);
  return Math.max(0,Math.round((task.effort||0)*60)-allocated);
 }
 const styles=[{name:'Morning focus',description:'30-minute blocks · 08:00–12:00',from:480,to:720,block:30},{name:'Afternoon balance',description:'60-minute blocks · 13:00–18:00',from:780,to:1080,block:60},{name:'Evening focus',description:'90-minute blocks · 17:00–21:00',from:1020,to:1260,block:90}];
 function suggest(state,week,styleIndex,now=new Date(),preferences=null){
  const focus=Number.isFinite(state.focusMinutes)&&state.focusMinutes>=10&&state.focusMinutes<=180?Math.floor(state.focusMinutes/5)*5:45;
  const windows={any:[480,1260],morning:[480,720],afternoon:[780,1080],evening:[1020,1260]};
  const window=windows[preferences?.period]||windows.any;
  const style=preferences?{name:'Your personalized plan',from:window[0],to:window[1],block:focus}:styles[styleIndex],block=Math.min(style.block,focus),existing=eventsForWeek(state,week),planned=existing.filter(e=>e.type==='study').reduce((s,e)=>s+duration(e),0);
  const shortBreak=preferences?[15,20,30].includes(Number(preferences.shortBreak))?Number(preferences.shortBreak):15:15;
  const longBreak=preferences?[30,45,60].includes(Number(preferences.longBreak))?Math.max(shortBreak,Number(preferences.longBreak)):45:45;
  const consecutive=preferences?[1,2,3].includes(Number(preferences.consecutive))?Number(preferences.consecutive):2:Infinity;
  const dailyCap=preferences?[60,120,180].includes(Number(preferences.dailyCap))?Number(preferences.dailyCap):180:180;
  let budget=Math.max(0,Math.round((state.goal||0)*60)-planned);
  const tasks=state.events.filter(e=>e.type==='assignment'&&!e.done&&new Date(e.date+'T'+e.start)>now).sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));
  const needs=tasks.map(task=>({task,minutes:prepareRemaining(state,task,now)}));
  const overdue=state.events.filter(e=>e.type==='assignment'&&!e.done&&new Date(e.date+'T'+e.start)<=now).length;
  const daysOff=new Set(Array.isArray(state.daysOff)?state.daysOff:[]),minimum=Math.min(15,block),sessions=[],occupied=existing.map(e=>({date:e.date,start:minutes(e.start),end:e.end?minutes(e.end):minutes(e.start)+30}));
  const studySlots=existing.filter(e=>e.type==='study').map(e=>({date:e.date,start:minutes(e.start),end:minutes(e.end)}));
  function breaksAllowed(date,start,length){
   const entry={date,start,end:start+length},ordered=[...studySlots.filter(e=>e.date===date),entry].sort((a,b)=>a.start-b.start),index=ordered.indexOf(entry);
   if((index>0&&start-ordered[index-1].end<shortBreak)||(index<ordered.length-1&&ordered[index+1].start-entry.end<shortBreak))return false;
   let left=index,right=index;
   while(left>0&&ordered[left].start-ordered[left-1].end<longBreak)left--;
   while(right<ordered.length-1&&ordered[right+1].start-ordered[right].end<longBreak)right++;
   return right-left+1<=consecutive;
  }
  const days=Array.from({length:7},(_,index)=>{const date=shift(week,index),entries=existing.filter(e=>e.date===date),classes=entries.filter(e=>e.type==='lecture'||e.type==='lab').reduce((sum,e)=>sum+duration(e),0);return {date,index,classes,study:entries.filter(e=>e.type==='study').reduce((sum,e)=>sum+duration(e),0),cap:Math.min(dailyCap,classes>=360?120:180)};}).filter(day=>!daysOff.has(day.index)&&!(state.skipHolidays!==false&&typeof AcademicCalendar!=='undefined'&&AcademicCalendar.holiday(day.date)));
  function candidate(day,need){
   const target=Math.min(budget,need?need.minutes:budget),capacity=day.cap-day.study;if(target<minimum||capacity<minimum)return null;
   for(let start=style.from;start+minimum<=style.to;start+=15){
    if(new Date(day.date+'T'+time(start))<new Date(now.getTime()+15*60000))continue;
    let length=Math.min(block,target,capacity,style.to-start);
    if(need)length=Math.min(length,Math.floor((new Date(need.task.date+'T'+need.task.start)-new Date(day.date+'T'+time(start)))/60000));
    // Keep a lunch and evening meal window free, and leave transition/break buffers.
    const blocked=[...occupied.filter(e=>e.date===day.date),{start:720,end:780},{start:1080,end:1140}];
    length=Math.floor(length/5)*5;while(length>=minimum&&blocked.some(e=>start<e.end+15&&start+length>e.start-15))length-=5;
    if(target>length&&target-length<minimum)length=Math.floor((target-minimum)/5)*5;
    if(length<minimum||!breaksAllowed(day.date,start,length))continue;return {day,start,length};
   }return null;
  }
  function addSession(need){
   const choices=days.map(day=>candidate(day,need)).filter(Boolean).sort((a,b)=>(a.day.study+a.day.classes*.25)-(b.day.study+b.day.classes*.25)||a.day.date.localeCompare(b.day.date)||a.start-b.start);
   const choice=choices[0];if(!choice)return false;const {day,start,length}=choice;
   sessions.push({title:need?'Prepare: '+need.task.title:'General revision',type:'study',date:day.date,start:time(start),end:time(start+length),done:false,taskId:need?.task.id||null});occupied.push({date:day.date,start,end:start+length});studySlots.push({date:day.date,start,end:start+length});day.study+=length;budget-=length;if(need)need.minutes-=length;return true;
  }
  // Rotate between assignments, starting each round with the earliest deadline.
  // No assignment has to be completed before another receives preparation time.
  let progress=true;
  while(progress&&budget>=minimum){progress=false;for(const need of needs){if(need.minutes>=minimum&&budget>=minimum&&addSession(need))progress=true;}}
  // Even if a task cannot fit before its deadline, spare future time can be revision.
  while(budget>=minimum&&addSession(null)){}
  sessions.sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));
  return {style,focus,block,sessions,minutes:sessions.reduce((s,e)=>s+duration(e),0),unfilled:budget,remaining:needs.filter(n=>n.minutes>0).map(n=>({title:n.task.title,hours:n.minutes/60})),overdue,daysOff:[...daysOff],dailyCap,shortBreak,longBreak,consecutive};
 }
 return {iso,parse,shift,monday,minutes,time,duration,eventsForWeek,prepareRemaining,styles,suggest};
})();
if(typeof module!=='undefined')module.exports=Planning;
