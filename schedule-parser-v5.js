const ScheduleParser=(()=>{
 const dayNames=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
 const dayPattern=/\b(mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b/gi;
 const dayIndex=s=>dayNames.findIndex(d=>d.slice(0,3).toLowerCase()===s.slice(0,3).toLowerCase());
 const rangePattern=/\b(\d{1,2})(?::([0-5]\d))?\s*([ap]\.?m\.?)?\s*(?:[-–—]|\bto\b)\s*(\d{1,2})(?::([0-5]\d))?\s*([ap]\.?m\.?)?\b/i;
 function range(text){const m=text.match(rangePattern);if(!m)return null;let h1=Number(m[1]),h2=Number(m[4]),ap1=(m[3]||'').replace(/\./g,'').toLowerCase(),ap2=(m[6]||'').replace(/\./g,'').toLowerCase();
 if(h1>23||h2>23||((ap1||ap2)&&(h1<1||h1>12||h2<1||h2>12)))return null;
 if(!ap1&&ap2)ap1=ap2==='pm'&&h1>h2?'am':ap2;if(ap1&&!ap2)ap2=ap1;
 const convert=(h,ap)=>ap?(h%12)+(ap==='pm'?12:0):h,format=(h,min)=>String(h).padStart(2,'0')+':'+(min||'00');
 const start=format(convert(h1,ap1),m[2]),end=format(convert(h2,ap2),m[5]);if(end<=start)return null;
 return {start,end,raw:m[0],index:m.index,ambiguous:!ap1&&!ap2&&h1<=12&&h2<=12};
 }
 function titleOf(text,times){let title=times?text.replace(times.raw,' '):text;title=title.replace(dayPattern,' ').replace(/^[\s|,;:•\-]+|[\s|,;:•\-]+$/g,'').replace(/\s+/g,' ').trim();return title.slice(0,100);}
 function entry(title,day,times,source){return {title:title||'Untitled course',day,type:/\blab(?:oratory)?\b/i.test(title)?'lab':'lecture',start:times?.start||'',end:times?.end||'',review:!times?'Times not detected':times.ambiguous?'Check morning / afternoon times':'Review course and times',source};}
 function unique(entries){const keys=new Set();return entries.filter(e=>{const key=[e.title.toLowerCase(),e.day,e.start,e.end].join('|');if(keys.has(key))return false;keys.add(key);return true;});}
 function parseText(text){const entries=[];let context=null,previousTitle='';for(const raw of text.split(/[\n;]+/)){const line=raw.trim();if(!line)continue;const days=[...line.matchAll(dayPattern)].map(m=>dayIndex(m[0])),times=range(line);
 if(days.length&&!times){const stripped=titleOf(line,null);if(!stripped){context=days.length===1?days[0]:null;previousTitle='';continue;}if(days.length===1){context=days[0];previousTitle=stripped;}continue;}
 if(times){const title=titleOf(line,times)||previousTitle;const selected=days.length?days:context===null?[]:[context];if(title&&selected.length)for(const day of selected)entries.push(entry(title,day,times,'text'));previousTitle='';}
 else if(context!==null)previousTitle=line;
 }return unique(entries);}
 function wordsOf(data){return(data.blocks||[]).flatMap(b=>(b.paragraphs||[]).flatMap(p=>(p.lines||[]).flatMap(l=>l.words||[]))).filter(w=>w.text&&w.bbox);}
 const cy=w=>(w.bbox.y0+w.bbox.y1)/2,cx=w=>(w.bbox.x0+w.bbox.x1)/2;
 function parseGrid(data){const words=wordsOf(data);const headings=words.filter(w=>{const m=w.text.match(dayPattern);return m?.length===1&&w.text.replace(dayPattern,'').replace(/[^a-z]/gi,'')==='';});if(headings.length<2)return [];
 const groups=headings.map(w=>headings.filter(v=>Math.abs(cy(v)-cy(w))<Math.max(20,w.bbox.y1-w.bbox.y0)));const header=groups.sort((a,b)=>b.length-a.length)[0].sort((a,b)=>cx(a)-cx(b));const days=new Set(header.map(w=>dayIndex(w.text)));if(days.size<2)return [];
 const gap=(cx(header.at(-1))-cx(header[0]))/(header.length-1),top=Math.max(...header.map(w=>w.bbox.y1));const entries=[];
 for(let i=0;i<header.length;i++){const left=i?(cx(header[i-1])+cx(header[i]))/2:cx(header[i])-gap/2,right=i<header.length-1?(cx(header[i])+cx(header[i+1]))/2:cx(header[i])+gap/2;
 const column=words.filter(w=>cy(w)>top+4&&cx(w)>left&&cx(w)<right).sort((a,b)=>cy(a)-cy(b)||cx(a)-cx(b));if(!column.length)continue;
 const heights=column.map(w=>w.bbox.y1-w.bbox.y0).sort((a,b)=>a-b),height=heights[Math.floor(heights.length/2)]||15;const lines=[];for(const word of column){let line=lines.find(l=>Math.abs(l.y-cy(word))<height*.7);if(!line){line={y:cy(word),words:[]};lines.push(line);}line.words.push(word);}lines.sort((a,b)=>a.y-b.y);
 const cells=[];for(const line of lines){const text=line.words.sort((a,b)=>cx(a)-cx(b)).map(w=>w.text).join(' '),last=cells.at(-1);if(!last||line.y-last.bottom>height*2||range(last.text)&&!range(text)){cells.push({text,bottom:line.y});}else{last.text+=' '+text;last.bottom=line.y;}}
 for(const cell of cells){const times=range(cell.text),title=titleOf(cell.text,times);if(!title||/^(?:time|lunch|break|room|[\d\s:.-]+)$/i.test(title))continue;entries.push(entry(title,dayIndex(header[i].text),times,'grid'));}
 }return unique(entries);
 }
 function parse(data){const grid=parseGrid(data);return grid.length?grid:parseText(data.text||'');}
 return {dayNames,range,parseText,parseGrid,parse,wordsOf};
})();
if(typeof module!=='undefined')module.exports=ScheduleParser;
