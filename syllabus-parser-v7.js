/* Local, review-first syllabus suggestions. No date is inferred for scheduling. */
(function(root){
 'use strict';
 const clean=s=>String(s||'').replace(/[\u200b-\u200d\ufeff]/g,'').replace(/\u00a0/g,' ').trim();
 const kindRE=/\b(quizz?(?:es)?|quiz|assignments?|homework|case stud(?:y|ies)|(?:mid[- ]?term|semester|final)\s+(?:exams?|examinations?|assessments?)|exams?|examinations?|presentations?|essays?|reports?|reflections?|studio activities|preparatory activities|exploration of GC problems|GC meetings|GC teamwork)\b/i;
 const stopRE=/^(?:grading scheme|contribution to|course learning|instructor policy|course policy|teaching plan|honor code|academic integrity|course expectations|attendance policy|structure and learning|laboratory and|references? materials?|textbooks?)\b/i;
 const weekRE=/\b(?:weeks?|wk\.?)\s*\d+(?:\s*(?:[-–—]|to|and|,)\s*(?:(?:weeks?|wk\.?)\s*)?\d+)*/ig;
 function courseFrom(text,filename=''){
  const sample=text.slice(0,4500)+' '+filename;
  const code=sample.match(/\b(GENS|GEN|ENGL|ENGLISH|MATH|PHYS|COSC|CHEM|BIOL|ENGR|ENG)\s*[-_ ]?\s*(\d{3}[A-Z]?)\b/i);
  if(!code)return '';
  const prefix=/^ENGLISH$|^ENG$/i.test(code[1])?'ENGL':/^GEN$/i.test(code[1])?'GENS':code[1].toUpperCase();
  return prefix+' '+code[2].toUpperCase();
 }
 function keyOf(title){
  return title.toLowerCase().replace(/\b(?:examination|exam|assessment)\b/g,'exam').replace(/\bsemester\b/g,'midterm').replace(/[^a-z0-9]+/g,' ').trim();
 }
 function titleOf(line){
  let s=clean(line).replace(/^[•*\-\d.\s]+/,'').replace(/^(?:coursework|grand challenge solution|grand challenge milestones)\s*:\s*/i,'');
  s=s.replace(/^Grand Challenge(?: Solution| Milestones)?\s{3,}/i,'');
  if(/^Final Examination\s{3,}Final Exam/i.test(s))s=s.replace(/^Final Examination\s{3,}/i,'');
  if(/^coursework\s{2,}/i.test(s))s=s.replace(/^coursework\s+/i,'');
  s=s.replace(/\b(?:weeks?|wk\.?)\s*\d+.*$/i,'').replace(/\b(?:TBD|TBA|TBC)\b.*$/i,'');
  s=s.split(/\s{3,}/)[0].replace(/\s*\([^)]*\d\s*%.*$/,'').replace(/\s*\d+(?:\.\d+)?\s*%.*$/,'').replace(/[*:;,\s]+$/,'');
  if(s.includes('(')&&!s.includes(')'))s=s.slice(0,s.indexOf('('));
  return clean(s).slice(0,140);
 }
 function parse(pages,filename=''){
  if(typeof pages==='string')pages=[pages];
  const all=pages.join('\n'),rows=[];
  pages.forEach((page,p)=>page.split(/\r?\n/).forEach(line=>rows.push({line:clean(line),page:p+1})));
  const candidates=[];let active=!rows.some(r=>/^assessment(?:\s+methodology)?\s*:?$/i.test(r.line)),detailed=false,section=0;
  for(let i=0;i<rows.length;i++){
   const {line,page}=rows[i];if(!line)continue;
   if(/^assessment(?:\s+methodology)?\s*:?$/i.test(line)){active=true;detailed=/methodology/i.test(line);section++;continue;}
   if(active&&stopRE.test(line)){active=false;continue;}
   if(!active||!kindRE.test(line)||line.length>230)continue;
   if(/^(?:all course|assessment instruments|assessment tools|these assignments|\*?the lowest|weight|tentative dates)|\b(?:no make-up|if you|students (?:must|who|should)|will receive|late submission|preparation|policy|responsib|dropped|formative)\b/i.test(line))continue;
   let title=titleOf(line);if(!title||!kindRE.test(title)||title.length<4)continue;
   if(/^coursework\s*\(/i.test(title)||/\b(?:reading assignments, quizzes|quizzes and activities)\b/i.test(title))continue;
   let source=line;
   // DOCX tables may place the assessment name and teaching week on separate lines.
   for(let k=i+1;k<Math.min(i+4,rows.length);k++){
    const next=rows[k].line;if(!next)continue;
    if(kindRE.test(next)||stopRE.test(next)||/^assessment/i.test(next))break;
    if(/^(?:wk\.?|week|\d+(?:\.\d+)?\s*%|TBD|TBA|TBC)/i.test(next)){source+=' · '+next;break;}
   }
   const hints=[...source.matchAll(weekRE)].map(m=>m[0]);
   const calendar=source.match(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sept?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2}\b/ig)||[];
   const timing=[...hints,...calendar].join(' · ')||(/\b(?:TBD|TBA|TBC)\b/i.test(source)?'Date to be confirmed':'No date specified');
   const kind=/quizz?|quiz/i.test(title)?'Quiz':/mid[- ]?term|semester examination/i.test(title)?'Midterm exam':/final (?:exam|examination|assessment)/i.test(title)?'Final exam':/exam|examination|assessment/i.test(title)?'Assessment':/presentation/i.test(title)?'Presentation':/report/i.test(title)?'Report':'Assignment';
   candidates.push({title,kind,timing,source:source.slice(0,400),page,detailed,section,key:keyOf(title)});
  }
  // Prefer the instructor's detailed assessment table over the grading summary.
  const detailedItems=candidates.filter(c=>c.detailed);
  const pool=detailedItems.length?detailedItems:candidates;
  const unique=[];
  for(const c of pool){
   const prior=unique.find(x=>x.key===c.key);
   if(prior){if(prior.timing==='No date specified'&&c.timing!==prior.timing)Object.assign(prior,c);continue;}
   unique.push(c);
  }
  return {course:courseFrom(all,filename),items:unique.map(({detailed,section,key,...item})=>item)};
 }
 const api={parse,courseFrom};root.KUSyllabusParser=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
