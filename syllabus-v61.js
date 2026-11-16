/* Course document reading stays on the student's device. */
(()=>{
 'use strict';
 const by=id=>document.getElementById(id),dialog=by('syllabusDialog');
 let busy=false,items=[],selected=null,readCourse='',fileLabel='',docx=false,autoCourse='',deferredChoice=null;
 const scriptRoot=new URL('.',document.currentScript.src),loaded=new Map();
 function load(name){if(!loaded.has(name))loaded.set(name,new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL(name,scriptRoot);script.onload=resolve;script.onerror=()=>{loaded.delete(name);script.remove();reject(new Error('A reader file could not load. Reconnect, or use the complete extracted ZIP.'));};document.head.append(script);}));return loaded.get(name);}
 function node(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
 const status=text=>{by('syllabusStatus').textContent=text;};
 function lock(on){busy=on;for(const id of ['readSyllabus','parseSyllabus','syllabusFile','syllabusCourse','syllabusText','closeSyllabus'])by(id).disabled=on;by('syllabusProgress').hidden=!on;}
 function resetReview(){items=[];selected=null;by('syllabusItems').replaceChildren();by('syllabusReview').hidden=true;by('syllabusSchedule').hidden=true;by('syllabusConfirmError').textContent='';by('syllabusDefer').hidden=true;deferredChoice=null;}
 function open(){dialog.showModal();}
 by('openSyllabus').onclick=open;by('closeSyllabus').onclick=()=>dialog.close();
 dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
 by('syllabusFile').addEventListener('change',()=>{resetReview();if(by('syllabusCourse').value===autoCourse)by('syllabusCourse').value='';autoCourse='';status('Ready to read. Your file stays on this device.');});
 async function pdfPages(bytes){
  await Promise.all([load('syllabus-pdf-v6.js'),load('syllabus-worker-v6.js')]);
  const port=KUCreateSyllabusWorker(),worker=new KUPDF.PDFWorker({port});
  let task;
  try{
   task=KUPDF.getDocument({data:bytes,worker,isEvalSupported:false,disableFontFace:true,useSystemFonts:false,verbosity:0});
   const pdf=await task.promise;if(pdf.numPages>100)throw new Error('Please use a syllabus of 100 pages or fewer.');
   const pages=[];
   for(let p=1;p<=pdf.numPages;p++){
    status('Reading syllabus · page '+p+' of '+pdf.numPages+'…');
    const page=await pdf.getPage(p),content=await page.getTextContent();
    const lines=[];
    for(const item of content.items){if(!('str' in item)||!item.str)continue;
     const y=item.transform[5],x=item.transform[4];let row=lines.find(r=>Math.abs(r.y-y)<Math.max(2,Math.abs(item.transform[3])*.22));
     if(!row){row={y,parts:[]};lines.push(row);}row.parts.push({x,width:item.width,text:item.str});
    }
    pages.push(lines.sort((a,b)=>b.y-a.y).map(r=>{let last=null;return r.parts.sort((a,b)=>a.x-b.x).map(part=>{const gap=last?part.x-last.x-last.width:0;const prefix=last?(gap>14?'     ':' '):'';last=part;return prefix+part.text;}).join('');}).join('\n'));
    page.cleanup();await new Promise(r=>setTimeout(r,0));
   }
   if(pages.join('').replace(/\s/g,'').length<60)throw new Error('This PDF has little readable text. For a scanned syllabus, copy its assessment table into “Paste syllabus text”, or upload a PDF with selectable text.');
   return pages;
  }finally{if(task)await task.destroy().catch(()=>{});worker.destroy();port.terminate();}
 }
 async function docxPages(bytes){
  await load('syllabus-zip-v6.js');
  const zip=await JSZip.loadAsync(bytes),entry=zip.file('word/document.xml');
  if(!entry)throw new Error('This file is not a readable DOCX document. Please save it as .docx or PDF and try again.');
  if(entry._data&&entry._data.uncompressedSize>4*1024*1024)throw new Error('The document text is too large. Please upload only the course syllabus.');
  const xml=await entry.async('string');if(xml.length>4*1024*1024)throw new Error('The document text is too large.');
  const dom=new DOMParser().parseFromString(xml,'application/xml');if(dom.getElementsByTagName('parsererror').length)throw new Error('The document could not be read. Try saving it as a PDF.');
  const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const textOf=el=>Array.from(el.getElementsByTagNameNS(ns,'t')).map(t=>t.textContent).join('');
  const lines=[],body=dom.getElementsByTagNameNS(ns,'body')[0];if(!body)throw new Error('No document text was found.');
  for(const child of body.children){
   if(child.localName==='p')lines.push(textOf(child));
   else if(child.localName==='tbl')for(const row of child.getElementsByTagNameNS(ns,'tr')){
    lines.push(Array.from(row.children).filter(c=>c.localName==='tc').map(cell=>{const paragraphs=Array.from(cell.getElementsByTagNameNS(ns,'p')).map(textOf);return paragraphs.join('\n')+(paragraphs.length>1?'\n':'');}).join('     '));
   }
  }
  return [lines.join('\n')];
 }
 function review(pages,filename){
  const text=(pages.join(' ').slice(0,10000)+' '+filename).toLowerCase().replace(/[^a-z0-9]+/g,'');const term=AcademicCalendar.terms.find(t=>text.includes(t.name.toLowerCase().replace(/[^a-z0-9]+/g,'')))||AcademicCalendar.termFor(nowDate());if(by('syllabusWeekOne').dataset.manual!=='yes'&&term)by('syllabusWeekOne').value=monday(term.start);
  const result=KUSyllabusParser.parse(pages,filename);items=result.items.map((item,i)=>({...item,id:i,decision:'pending'}));
  const manualCourse=by('syllabusCourse').value.trim();readCourse=manualCourse||result.course;if(!manualCourse)autoCourse=readCourse;by('syllabusCourse').value=readCourse;
  if(!items.length){status('No clear assessments were found. Paste the assessment table below, or add a plan manually. Nothing has been added.');return;}
  by('syllabusReview').hidden=false;render();
  status('Found '+items.length+' possible assessments. Check the course name and each suggestion. Nothing is added until you choose Yes and save a date and time.');
 }
 function render(){
  const container=by('syllabusItems');container.replaceChildren();
  const course=by('syllabusCourse').value.trim()||readCourse||'this course';
  for(const item of items){
   const card=node('article',undefined,'syllabus-item');card.dataset.item=String(item.id);
   const top=node('div',undefined,'syllabus-item-top');top.append(node('span',item.kind,'syllabus-type'),node('span',docx?'Document text':'Page '+item.page,'muted'));card.append(top,node('h4',item.title));
   card.append(node('p','From '+course+' · '+item.timing,'syllabus-timing'));
   const detail=node('details'),summary=node('summary','Check source text');detail.append(summary,node('p',item.source,'syllabus-source'));card.append(detail);
   if(item.decision==='pending'){
    card.append(node('p','Add this '+item.kind.toLowerCase()+' from '+course+' to your planner?'));
    const actions=node('div',undefined,'actions'),yes=node('button','Yes, choose date & time','primary'),no=node('button','No, skip'),later=node('button','Skip for now');
    yes.type=no.type='button';yes.onclick=()=>choose(item);no.onclick=()=>{item.decision='skipped';if(item.inboxId){const saved=state.syllabusInbox.find(i=>i.id===item.inboxId);if(saved){saved.status='dismissed';saved.decidedOn=nowDate();save();KUWeekFeatures.renderInbox();}}if(deferredChoice?.id===item.id){deferredChoice=null;by('syllabusDefer').hidden=true;}if(selected?.id===item.id){selected=null;by('syllabusSchedule').hidden=true;}render();};later.type='button';later.onclick=()=>defer(item);actions.append(yes,later,no);card.append(actions);
   }else{
    const label=node('p',item.decision==='added'?'✓ Added to your planner':item.decision==='deferred'?'Saved · Review week of '+pretty(item.reviewWeek):'Skipped · Nothing added','syllabus-decision');card.append(label);
    if(item.decision==='skipped'){const undo=node('button','Review again');undo.type='button';undo.onclick=()=>{item.decision='pending';if(item.inboxId){const saved=state.syllabusInbox.find(i=>i.id===item.inboxId);if(saved){saved.status='pending';save();KUWeekFeatures.renderInbox();}}render();};card.append(undo);}
   }
   container.append(card);
  }
  const done=items.filter(i=>i.decision!=='pending').length;by('syllabusReviewCount').textContent=done+' of '+items.length+' reviewed';
 }
 function choose(item){
  const course=by('syllabusCourse').value.trim();
  if(!course){status('Enter the course name above first, so the assessment is linked to the right course.');by('syllabusCourse').focus();return;}
  deferredChoice=null;by('syllabusDefer').hidden=true;selected=item;by('syllabusSchedule').hidden=false;by('syllabusEventTitle').value=course+' · '+item.title;
  by('syllabusHint').textContent='Syllabus says: '+item.timing+'. Confirm the actual date and time with your instructor.';
  by('syllabusDate').value='';by('syllabusTime').value='';by('syllabusEnd').value='';by('syllabusEffort').value='2';by('syllabusConfirmError').textContent='';
  by('syllabusSchedule').scrollIntoView({behavior:'smooth',block:'start'});by('syllabusDate').focus({preventScroll:true});
 }
 by('syllabusCourse').addEventListener('input',()=>{autoCourse='';if(items.length)render();});
 by('cancelSyllabusDate').onclick=()=>{selected=null;by('syllabusSchedule').hidden=true;};
 by('syllabusSchedule').addEventListener('submit',event=>{
  event.preventDefault();if(!selected||selected.decision!=='pending')return;
  const title=by('syllabusEventTitle').value.trim(),date=by('syllabusDate').value,start=by('syllabusTime').value,end=by('syllabusEnd').value,effort=Number(by('syllabusEffort').value);
  const error=by('syllabusConfirmError');error.textContent='';
  if(!title||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(start)||!Number.isFinite(effort)||effort<.5||effort>40){error.textContent='Enter a title, date, time and preparation estimate before adding.';return;}
  if(end&&end<=start){error.textContent='End time must be after the start time, or leave it blank for a deadline.';return;}
  const duplicate=state.events.some(e=>e.type==='assignment'&&e.title.toLowerCase()===title.toLowerCase()&&e.date===date&&e.start===start);
  if(duplicate){error.textContent='This assessment is already in your planner at the same date and time.';return;}
  state.events.push({id:crypto.randomUUID(),title,type:'assignment',date,start,end,done:false,recurring:false,effort,origin:3,assessmentKind:selected.kind});
  if(Array.isArray(state.syllabusInbox)){const key=KUWeekModel.reviewKey(by('syllabusCourse').value.trim(),selected.title,by('syllabusWeekOne').value);for(const saved of state.syllabusInbox)if(saved.id===selected.inboxId||saved.key===key){saved.status='added';saved.eventId=state.events[state.events.length-1].id;saved.decidedOn=nowDate();}}
  week=monday(date);save();invalidateSuggestions();updateViews();
  selected.decision='added';selected=null;by('syllabusSchedule').hidden=true;render();
  status('Assessment added. '+(state.setupDone?'Your planner is showing its week.':'Finish your setup to view your week.'));by('notice').textContent=title+' added for '+pretty(date)+' at '+start+'.';
 });
 by('readSyllabus').onclick=async()=>{
  if(busy)return;const file=by('syllabusFile').files[0];if(!file){status('Choose a PDF, DOCX or TXT syllabus first.');return;}
  resetReview();if(file.size>20*1024*1024){status('Please use a file smaller than 20 MB.');return;}
  const ext=file.name.split('.').pop().toLowerCase();if(!['pdf','docx','txt'].includes(ext)){status('Please upload a PDF, DOCX or TXT file. Older .doc files must be saved as .docx first.');return;}
  lock(true);status('Reading your syllabus on this device…');
  try{docx=ext==='docx';fileLabel=file.name;const bytes=new Uint8Array(await file.arrayBuffer());const pages=ext==='pdf'?await pdfPages(bytes):ext==='docx'?await docxPages(bytes):[new TextDecoder().decode(bytes)];by('syllabusText').value=pages.join('\n\n');review(pages,fileLabel);}
  catch(e){status(e.name==='PasswordException'?'This PDF is password protected. Use an unlocked copy of the syllabus.':e.message||'The syllabus could not be read. Try pasting the assessment table below.');}
  finally{lock(false);}
 };
 by('parseSyllabus').onclick=()=>{if(busy)return;resetReview();const text=by('syllabusText').value.trim();if(!text){status('Paste the assessment section from your syllabus first.');return;}if(text.length>500000){status('Please paste only the course assessment section (up to 500,000 characters).');return;}docx=true;review([text],'');};

 function defer(item){
  const course=by('syllabusCourse').value.trim(),weekOne=by('syllabusWeekOne').value;
  if(!course){status('Enter the course name before saving it for later.');by('syllabusCourse').focus();return;}
  if(!KUWeekModel.validDate(weekOne)||monday(weekOne)!==weekOne){status('Choose the first Monday of teaching week 1 above. This maps syllabus weeks to review weeks.');by('syllabusWeekOne').focus();return;}
  selected=null;by('syllabusSchedule').hidden=true;deferredChoice=item;by('syllabusDefer').hidden=false;
  by('syllabusDeferTitle').textContent=course+' · '+item.title;by('syllabusDeferHint').textContent='Syllabus: '+item.timing+'. Check the review week below. This will not create a calendar event.';
  const saved=item.inboxId?state.syllabusInbox.find(i=>i.id===item.inboxId):null;
  by('syllabusReviewWeek').value=saved?.reviewWeek||KUWeekModel.reviewWeek(item,weekOne);by('syllabusDeferError').textContent='';by('syllabusDefer').scrollIntoView({behavior:'smooth',block:'start'});by('syllabusReviewWeek').focus({preventScroll:true});
 }
 by('syllabusWeekOne').value=monday(AcademicCalendar.termFor(nowDate())?.start||nowDate());
 by('syllabusWeekOne').addEventListener('input',()=>{by('syllabusWeekOne').dataset.manual='yes';});
 by('cancelSyllabusDefer').onclick=()=>{deferredChoice=null;by('syllabusDefer').hidden=true;};
 by('syllabusDefer').addEventListener('submit',event=>{
  event.preventDefault();if(!deferredChoice||deferredChoice.decision!=='pending')return;
  const course=by('syllabusCourse').value.trim(),weekOne=by('syllabusWeekOne').value,reviewWeek=by('syllabusReviewWeek').value,error=by('syllabusDeferError');error.textContent='';
  if(!course||!KUWeekModel.validDate(weekOne)||monday(weekOne)!==weekOne||!KUWeekModel.validDate(reviewWeek)||monday(reviewWeek)!==reviewWeek){error.textContent='Enter the course and choose a Monday for teaching week 1 and the review week.';return;}
  if(!Array.isArray(state.syllabusInbox))state.syllabusInbox=[];
  const key=KUWeekModel.reviewKey(course,deferredChoice.title,weekOne),prior=state.syllabusInbox.find(i=>i.id===deferredChoice.inboxId||i.key===key);
  const saved={...(prior||{}),id:prior?.id||crypto.randomUUID(),key,course,title:deferredChoice.title,kind:deferredChoice.kind,timing:deferredChoice.timing,source:deferredChoice.source,page:deferredChoice.page,sourceType:docx?'text':'pdf',weekOne,reviewWeek,status:'pending'};
  if(prior)Object.assign(prior,saved);else state.syllabusInbox.push(saved);
  deferredChoice.decision='deferred';deferredChoice.reviewWeek=reviewWeek;deferredChoice=null;by('syllabusDefer').hidden=true;save();render();KUWeekFeatures.renderInbox();status('Saved for the week of '+pretty(reviewWeek)+'. It will appear in your syllabus review list when that week arrives.');
 });
 function reviewSaved(id){
  const saved=state.syllabusInbox.find(i=>i.id===id&&i.status==='pending');if(!saved)return;
  resetReview();docx=saved.sourceType==='text';by('syllabusCourse').value=saved.course;readCourse=saved.course;by('syllabusWeekOne').value=saved.weekOne;by('syllabusWeekOne').dataset.manual='yes';by('syllabusFile').value='';
  items=[{...saved,id:'saved-'+saved.id,inboxId:saved.id,decision:'pending'}];by('syllabusReview').hidden=false;if(!dialog.open)dialog.showModal();render();status('Saved syllabus suggestion · Nothing is added until you confirm a date and time.');choose(items[0]);
 }

 // Exposed for local regression checks; no document data is sent to a server.
 window.KUSyllabusReader={pdfPages,docxPages,reviewSaved};
})();
