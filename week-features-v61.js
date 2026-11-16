(()=>{
 'use strict';
 const by=id=>document.getElementById(id),M=KUWeekModel;
 const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,handler,cls)=>{const b=node('button',text,cls);b.type='button';b.onclick=handler;return b;};
 let showingAll=false,refreshing=false;
 function init(){
  if(!Array.isArray(state.syllabusInbox))state.syllabusInbox=[];
  if(!state.studyReminders||typeof state.studyReminders!=='object')state.studyReminders={enabled:true,time:'18:00',sessions:true,browser:false};
  if(!state.studyReminderLog||typeof state.studyReminderLog!=='object'||Array.isArray(state.studyReminderLog))state.studyReminderLog={};
 }
 function renderPriority(){
  const list=by('priorityList'),tasks=M.priorities(state.events,week);list.replaceChildren();
  by('priorityWeek').textContent=pretty(week)+' – '+pretty(shift(week,6));
  if(!tasks.length){list.append(node('li','No unfinished assignments due in this week.','priority-empty'));return;}
  tasks.forEach((task,i)=>{
   const row=node('li',undefined,'priority-row'),copy=node('div',undefined,'priority-copy');row.append(node('span',String(i+1),'priority-rank'));
   const title=button(task.title,()=>openEditor(task),'priority-title');copy.append(title,node('p',pretty(task.date)+' at '+task.start+' · '+(task.effort||'Not set')+'h preparation'));
   const select=node('select');select.setAttribute('aria-label','Priority for '+task.title);for(const [value,label]of [['high','High'],['normal','Normal'],['low','Low']])select.append(new Option(label,value));select.value=['high','low'].includes(task.priority)?task.priority:'normal';
   select.onchange=()=>{task.priority=select.value;save();invalidateSuggestions();render();};
   const complete=button('Mark complete',()=>{task.done=true;save();invalidateSuggestions();render();},'priority-complete');complete.setAttribute('aria-label','Mark '+task.title+' complete');
   row.append(copy,select,complete);list.append(row);
  });
 }
 function renderInbox(){
  const today=nowDate(),pending=state.syllabusInbox.filter(i=>i.status==='pending'),due=M.ready(pending,today),list=by('syllabusInboxRows');list.replaceChildren();
  by('syllabusInboxPanel').hidden=!pending.length;by('inboxReadyCount').textContent=due.length?due.length+' ready to review':'Saved for later';
  by('inboxDescription').textContent=due.length?'These assessments have reached their review week. Add a confirmed date and time, review next week, or skip them.':'Your assessments are saved on this device. A review prompt appears here when their chosen week begins.';
  by('toggleInbox').textContent=showingAll?'Show ready only':'Show all saved ('+pending.length+')';by('toggleInbox').hidden=pending.length===due.length;
  const visible=(showingAll?pending.slice().sort((a,b)=>a.reviewWeek.localeCompare(b.reviewWeek)):due);
  if(!visible.length)list.append(node('p','Nothing needs your decision yet. You can open all saved items to approve one early.','muted'));
  for(const item of visible){
   const row=node('article',undefined,'inbox-row'),copy=node('div');copy.append(node('h3',item.course+' · '+item.title),node('p',(item.reviewWeek<monday(today)?'Review was due':'Review week')+' · '+pretty(item.reviewWeek)+' · Syllabus: '+item.timing));
   const detail=node('details');detail.append(node('summary','Check syllabus source'),node('p',item.source||'No source text saved.','syllabus-source'));copy.append(detail);
   const actions=node('div',undefined,'actions');actions.append(button('Add date & time',()=>KUSyllabusReader.reviewSaved(item.id),'primary'),button('Review next week',()=>{item.reviewWeek=shift(monday(today),7);save();renderInbox();}),button('Skip this item',()=>{item.status='dismissed';item.decidedOn=nowDate();save();renderInbox();by('notice').textContent='Assessment skipped. Nothing was added to your schedule.';}));row.append(copy,actions);list.append(row);
  }
 }
 function planStudy(reminder){
  const event=reminder?.eventId?state.events.find(e=>e.id===reminder.eventId):null;openEditor(event||undefined);
  if(!event&&reminder?.taskId){by('taskLink').value=reminder.taskId;refreshFields();}
 }
 async function sendBrowser(reminder){
  const record=state.studyReminderLog[reminder.id]||{};
  if(!state.studyReminders.browser||!('Notification' in window)||Notification.permission!=='granted'||record.notifiedAt)return;
  // Mark before sending so repeated timer ticks do not create repeated alerts.
  record.notifiedAt=Date.now();state.studyReminderLog[reminder.id]=record;save();
  const options={body:reminder.body,tag:'ku-planner-'+reminder.id,icon:new URL('icon-192.png',location.href).href,data:{url:new URL('index.html',location.href).href}};
  try{
   const registration='serviceWorker' in navigator?await navigator.serviceWorker.getRegistration():null;
   if(registration?.active&&registration.showNotification)await registration.showNotification(reminder.title,options);
   else{const notification=new Notification(reminder.title,options);notification.onclick=()=>{window.focus();notification.close();};}
  }catch{/* In-app reminders remain available if system alerts are unsupported. */}
 }
 function renderReminders(now=new Date()){
  const currentWeek=monday(M.localDate(now)),occurrences=[...eventsForWeek(state,currentWeek),...eventsForWeek(state,shift(currentWeek,7))];
  const reminders=M.reminders(state,now,occurrences),area=by('studyReminderCards');area.replaceChildren();
  by('studyReminderCount').textContent=state.studyReminders.enabled===false?'Paused':reminders.length?reminders.length+' reminder'+(reminders.length===1?'':'s'):'Ready when you are';
  if(!reminders.length)area.append(node('p',state.studyReminders.enabled===false?'Study reminders are paused. You can switch them on below.':'Your daily reminder appears at '+(state.studyReminders.time||'18:00')+' local time. Study-session reminders appear 15 minutes before the start.','muted'));
  for(const reminder of reminders){
   const card=node('article',undefined,'study-reminder-card');card.append(node('h3',reminder.title),node('p',reminder.body));const actions=node('div',undefined,'actions');
   actions.append(button(reminder.kind==='session'?'Open session':'Plan study time',()=>planStudy(reminder),'primary'),button('Snooze 15 min',()=>{state.studyReminderLog[reminder.id]={...(state.studyReminderLog[reminder.id]||{}),snoozeUntil:Date.now()+15*60000,notifiedAt:null};save();renderReminders();}),button('Dismiss',()=>{state.studyReminderLog[reminder.id]={...(state.studyReminderLog[reminder.id]||{}),dismissedAt:Date.now()};save();renderReminders();}));card.append(actions);area.append(card);sendBrowser(reminder);
  }
  if(document.activeElement?.closest('#studyReminderSettings'))return;
  by('studyRemindersEnabled').checked=state.studyReminders.enabled!==false;by('studyReminderTime').value=state.studyReminders.time||'18:00';by('studySessionReminders').checked=state.studyReminders.sessions!==false;
  const supported='Notification' in window&&window.isSecureContext&&location.protocol!=='file:';
  by('enableStudyAlerts').hidden=!supported||!!state.studyReminders.browser;by('disableStudyAlerts').hidden=!state.studyReminders.browser;
  by('studyAlertsStatus').textContent=!supported?'In-planner reminders are available. Optional browser alerts are available on the secure website in supported browsers.':state.studyReminders.browser&&Notification.permission==='granted'?'Browser alerts enabled while this planner stays open.':Notification.permission==='denied'?'Browser alerts are blocked in this browser. In-planner reminders still work.':'Browser alerts are optional. They require your browser’s permission.';
 }
 function refresh(){if(refreshing)return;refreshing=true;try{init();renderPriority();renderInbox();renderReminders();}finally{refreshing=false;}}
 by('toggleInbox').onclick=()=>{showingAll=!showingAll;renderInbox();};
 by('studyReminderSettings').addEventListener('submit',e=>{e.preventDefault();init();state.studyReminders={...state.studyReminders,enabled:by('studyRemindersEnabled').checked,time:by('studyReminderTime').value||'18:00',sessions:by('studySessionReminders').checked};save();by('studyReminderSaveStatus').textContent='Reminder preferences saved for this device.';renderReminders();});
 by('enableStudyAlerts').onclick=async()=>{if(!('Notification' in window))return;try{const permission=await Notification.requestPermission();state.studyReminders.browser=permission==='granted';save();renderReminders();}catch{by('studyAlertsStatus').textContent='Browser alerts could not be enabled. In-planner reminders still work.';}};
 by('disableStudyAlerts').onclick=()=>{state.studyReminders.browser=false;save();renderReminders();};
 document.addEventListener('ku-planner-render',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});window.addEventListener('focus',refresh);
 // A sleeping/background tab catches up on focus; a closed page cannot run a timer.
 setInterval(()=>{init();renderInbox();renderReminders();},30000);
 window.KUWeekFeatures={refresh,renderInbox,renderReminders};refresh();save();
})();
