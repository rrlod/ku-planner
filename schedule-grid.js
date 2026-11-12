// Read the geometry of colored timetable cells against an OCR time axis.
const ScheduleGrid=(()=>{
 const dayPattern=/^(sun(?:day)?|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?)\.?$/i;
 const median=a=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)];};
 const cx=w=>(w.bbox.x0+w.bbox.x1)/2,cy=w=>(w.bbox.y0+w.bbox.y1)/2;
 function headers(words){const separated=words.flatMap(w=>{const matches=[...w.text.matchAll(/Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday/gi)];return matches.length>1?matches.map(m=>({...w,text:m[0],bbox:{...w.bbox,x0:w.bbox.x0+(w.bbox.x1-w.bbox.x0)*m.index/w.text.length,x1:w.bbox.x0+(w.bbox.x1-w.bbox.x0)*(m.index+m[0].length)/w.text.length}})):[w];});const possible=separated.filter(w=>dayPattern.test(w.text.trim()));if(possible.length<2)return[];const clusters=possible.map(w=>possible.filter(v=>Math.abs(cy(v)-cy(w))<Math.max(20,w.bbox.y1-w.bbox.y0)));return clusters.sort((a,b)=>b.length-a.length)[0].sort((a,b)=>cx(a)-cx(b));}
 function coloredCells(image){const {width,height,data}=image,seen=new Uint8Array(width*height),queue=new Uint32Array(width*height),rects=[];
  const color=i=>{const p=i*4,r=data[p],g=data[p+1],b=data[p+2];return data[p+3]>200&&Math.max(r,g,b)-Math.min(r,g,b)>38&&Math.max(r,g,b)>85;};
  for(let seed=0;seed<seen.length;seed++){if(seen[seed])continue;seen[seed]=1;if(!color(seed))continue;const base=seed*4,r=data[base],g=data[base+1],b=data[base+2];let first=0,last=1,x0=seed%width,x1=x0,y0=Math.floor(seed/width),y1=y0;queue[0]=seed;
   const offer=i=>{if(i<0||i>=seen.length||seen[i]||!color(i))return;const p=i*4;if(Math.abs(data[p]-r)>18||Math.abs(data[p+1]-g)>18||Math.abs(data[p+2]-b)>18)return;seen[i]=1;queue[last++]=i;};
   while(first<last){const i=queue[first++],x=i%width,y=Math.floor(i/width);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);if(x>0)offer(i-1);if(x<width-1)offer(i+1);offer(i-width);offer(i+width);}
   const w=x1-x0+1,h=y1-y0+1;if(w>Math.max(18,width*.025)&&h>Math.max(6,height*.005)&&last>w*h*.40)rects.push({x0,x1:x1+1,y0,y1:y1+1});
  }return rects;
 }
 function getAxis(words,head,image){const gap=median(head.slice(1).map((w,i)=>cx(w)-cx(head[i]))),top=Math.max(...head.map(w=>w.bbox.y1)),leftLimit=cx(head[0])-gap*.4;
  const axisWords=words.filter(w=>cx(w)<leftLimit&&cy(w)>top+12).sort((a,b)=>cy(a)-cy(b)),lines=[];
  for(const word of axisWords){let line=lines.find(l=>Math.abs(l.y-cy(word))<12);if(!line){line={y:cy(word),words:[]};lines.push(line);}line.words.push(word);}
  let previous=-1;const labels=[];for(const line of lines){const text=line.words.sort((a,b)=>cx(a)-cx(b)).map(w=>w.text).join(' ').trim(),m=text.match(/^(\d{1,2})(?::([0-5]\d))?\s*([ap]\.?m\.?)?$/i);if(!m)continue;let h=Number(m[1]);const ap=(m[3]||'').replace(/\./g,'').toLowerCase();if(h>23||ap&&(h<1||h>12))continue;if(ap)h=h%12+(ap==='pm'?12:0);let minute=h*60+Number(m[2]||0);if(!ap&&minute<previous&&h<12)minute+=720;if(minute<=previous)continue;previous=minute;labels.push({minute,y:line.y});}
  if(labels.length<3)return null;const slopes=[];for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++)slopes.push((labels[j].y-labels[i].y)/(labels[j].minute-labels[i].minute));const initial=median(slopes);if(initial<.15||initial>8)return null;
  const score=y=>{let best=0;for(const day of head){const start=Math.max(0,Math.floor(cx(day)-gap*.22)),end=Math.min(image.width,Math.ceil(cx(day)+gap*.22));let grey=0,count=0;for(let x=start;x<end;x+=2){const p=(y*image.width+x)*4,r=image.data[p],g=image.data[p+1],b=image.data[p+2];if(r>=170&&r<245&&Math.max(r,g,b)-Math.min(r,g,b)<8)grey++;count++;}best=Math.max(best,grey/count);}return best;};
  // Hour labels sit inside their rows; align them to solid horizontal grid lines.
  const aligned=labels.map(label=>{let y=null;for(let row=Math.floor(label.y)-2;row>=Math.max(top+1,Math.floor(label.y-initial*36));row--){if(score(row)>.74){y=row;break;}}return {...label,y:y??label.y};});
  const consistent=aligned.filter((a,i)=>Math.abs(a.y-labels[i].y)>2);const points=consistent.length>=3?consistent:labels.map(l=>({...l,y:l.y-initial*15}));
  const fits=[];for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++)fits.push((points[j].y-points[i].y)/(points[j].minute-points[i].minute));const slope=median(fits),intercept=median(points.map(p=>p.y-slope*p.minute));
  if(points.some(p=>Math.abs(p.y-(slope*p.minute+intercept))>initial*15))return null;
  return {slope,intercept,approximate:consistent.length<3};
 }
 function parse(data,image,titles=[],geometry=null){if(!image?.data)return[];const words=ScheduleParser.wordsOf(data),head=headers(words);if(head.length<2)return[];const axis=getAxis(words,head,image);if(!axis)return[];const top=Math.max(...head.map(w=>w.bbox.y1)),entries=[];
  const clock=y=>{const value=Math.round(((y-axis.intercept)/axis.slope)/5)*5;return value>=0&&value<1440?String(Math.floor(value/60)).padStart(2,'0')+':'+String(value%60).padStart(2,'0'):'';};
  for(const rect of (geometry?.cells||coloredCells(image))){if(rect.y0<=top)continue;const middle=(rect.x0+rect.x1)/2,dayWord=[...head].sort((a,b)=>Math.abs(cx(a)-middle)-Math.abs(cx(b)-middle))[0];const day=ScheduleParser.dayNames.findIndex(d=>d.slice(0,3).toLowerCase()===dayWord.text.slice(0,3).toLowerCase());if(day<0)continue;
   const inside=words.filter(w=>cx(w)>rect.x0&&cx(w)<rect.x1&&cy(w)>rect.y0&&cy(w)<rect.y1).sort((a,b)=>Math.abs(cy(a)-cy(b))<12?cx(a)-cx(b):cy(a)-cy(b));
   const cellTitle=titles.find(item=>Math.abs(item.rect.x0-rect.x0)<3&&Math.abs(item.rect.y0-rect.y0)<3);const text=(cellTitle?cellTitle.text.trim():inside.map(w=>w.text).join(' ')).replace(/[✓✔✅]/g,'').replace(/^[^A-Za-z0-9]+/,'').replace(/^[JvV4]\s+(?=[A-Z][a-z])/,'').replace(/_/g,' ').replace(/^[\s_;:,|~]+/,'').replace(/\b[Il]{2,3}\b(?=\s*$)/,match=>'I'.repeat(match.length)).replace(/\s\|$/,' I').replace(/\s+/g,' ').trim();const explicit=ScheduleParser.range(text),title=explicit?text.replace(explicit.raw,'').trim():text,start=explicit?.start||clock(rect.y0),duration=Math.round((rect.y1-rect.y0)/axis.slope/5)*5,endMinute=start?Number(start.slice(0,2))*60+Number(start.slice(3))+duration:0,end=explicit?.end||(endMinute>0&&endMinute<1440?String(Math.floor(endMinute/60)).padStart(2,'0')+':'+String(endMinute%60).padStart(2,'0'):'');if(!start||!end||end<=start)continue;
   entries.push({title:title.slice(0,100),preview:cellTitle?.preview||null,needsReview:!!cellTitle?.clipped||!title,day,type:/\blab(?:oratory)?\b/i.test(title)?'lab':'lecture',start,end,source:'color-grid',review:(cellTitle?.clipped?'Course name may be clipped or unclear. Check it against the original block above. ':!title?'Course name could not be read. Enter it below. ':'')+'Approximate times from the left axis and block edges, rounded to 5 minutes. Image compression can shift times. Confirm times and lecture/lab category.'});
  }// Repeated near-identical readings can repair a letter without changing course levels.
  const editDistance=(a,b)=>{let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));row=next;}return row[b.length];};
  const counts=new Map();for(const e of entries)counts.set(e.title,(counts.get(e.title)||0)+1);
  for(const e of entries){const tokens=e.title.split(' ');const candidates=[...counts].filter(([title,count])=>{const other=title.split(' ');return count>=2&&count>(counts.get(e.title)||0)&&other.length===tokens.length&&other.every((word,i)=>word===tokens[i]||word.length>=5&&tokens[i].length>=5&&editDistance(word.toLowerCase(),tokens[i].toLowerCase())<=2);}).sort((a,b)=>b[1]-a[1]);if(candidates.length)e.title=candidates[0][0];}
  return entries.sort((a,b)=>a.day-b.day||a.start.localeCompare(b.start));
 }
 // Locate the table's vertical rules independently of course names and colors.
 function detectLayout(image,knownHead=[]){
  const {width,height,data}=image,raw=coloredCells(image).filter(r=>r.x1-r.x0>width*.045&&r.x1-r.x0<width*.5&&r.y1-r.y0>height*.01);
  const rows=knownHead.length>=2?raw.filter(r=>r.y0>Math.max(...knownHead.map(w=>w.bbox.y1))):raw.filter(r=>raw.filter(q=>Math.abs(q.y0-r.y0)<Math.max(5,height*.012)&&Math.abs(q.x0-r.x0)>width*.06).length>=1);if(!rows.length)return null;
  const firstBody=Math.min(...rows.map(r=>r.y0)),lastBody=Math.max(...raw.filter(r=>r.y0>=firstBody).map(r=>r.y1)),radius=Math.max(2,Math.round(width/600)),lines=[];
  const light=(x,y)=>{const p=(y*width+x)*4;return (data[p]+data[p+1]+data[p+2])/3;};
  const rule=(x,y)=>{const p=(y*width+x)*4,r=data[p],g=data[p+1],b=data[p+2],l=(r+g+b)/3;return l>120&&l<245&&Math.max(r,g,b)-Math.min(r,g,b)<18&&Math.max(Math.abs(light(x-radius,y)-l),Math.abs(light(x+radius,y)-l))>8;};
  for(let x=radius;x<width-radius;x++){let count=0;for(let y=firstBody;y<lastBody;y+=2)if(rule(x,y))count++;if(count>(lastBody-firstBody)*.075){const prev=lines.at(-1);if(prev&&x-prev.x1<=radius){prev.x1=x;if(count>prev.count)Object.assign(prev,{x,count});}else lines.push({x,x1:x,count});}}
  if(lines.length<4)return null;
  const starts=[],ends=[];for(const line of lines){let last=firstBody;for(let y=firstBody;y>=0;y--){if(rule(line.x,y))last=y;if(last-y>Math.max(12,height*.012))break;}starts.push(last);last=lastBody;for(let y=lastBody;y<height;y++){if(rule(line.x,y))last=y;if(y-last>Math.max(12,height*.012))break;}ends.push(last);}
  const top=median(starts),bottom=median(ends),selected=[];for(const l of lines){const prev=selected.at(-1);if(!prev||l.x-prev.x>width*.03)selected.push(l);else if(l.count>prev.count)selected[selected.length-1]=l;}
  const courseRects=raw.filter(r=>r.y0>=firstBody),typical=median(courseRects.map(r=>r.x1-r.x0)),edges=courseRects.filter(r=>r.x1-r.x0>typical*.65).flatMap(r=>[r.x0,r.x1]).sort((a,b)=>a-b),clusters=[];
  for(const x of edges){const c=clusters.at(-1);if(c&&x-c.at(-1)<=Math.max(4,width*.004))c.push(x);else clusters.push([x]);}
  for(const c of clusters)if(c.length>=2){const x=median(c);if(!selected.some(l=>Math.abs(l.x-x)<width*.018))selected.push({x,count:c.length});}
  const boundaries=selected.map(l=>l.x).sort((a,b)=>a-b);
  if(boundaries.length<4)return null;
  let headerBottom=Math.min(firstBody,top+Math.max(20,height*.035));for(let y=Math.ceil(top+8);y<Math.min(firstBody+1,top+height*.1);y++){let n=0,total=0;for(let x=boundaries[0];x<boundaries.at(-1);x+=3){const p=(y*width+x)*4,r=data[p],g=data[p+1],b=data[p+2];if(r>150&&r<245&&Math.max(r,g,b)-Math.min(r,g,b)<15)n++;total++;}if(n/total>.6){headerBottom=y;break;}}
  return {top,bottom,headerBottom,bodyTop:firstBody,boundaries};
 }
 function whiteGap(image,a,b){let white=0,total=0;for(let y=a.y1;y<b.y0;y++)for(let x=a.x0;x<a.x1;x+=2){const p=(y*image.width+x)*4,r=image.data[p],g=image.data[p+1],v=image.data[p+2];if(Math.min(r,g,v)>235)white++;total++;}return total>0&&white/total>.6;}
 function tableCells(image,layout){
  if(!layout)return coloredCells(image);const {width,data}=image,out=[],gapLimit=Math.max(2,Math.round(width/500));
  for(let c=0;c<layout.boundaries.length-1;c++){const left=layout.boundaries[c]+2,right=layout.boundaries[c+1]-2,w=right-left;if(w<15)continue;let active=null;
   const finish=()=>{if(active&&active.last-active.y0>=Math.max(6,image.height*.005))out.push({x0:left,x1:right,y0:active.y0,y1:active.last+1,color:active.color});active=null;};
   for(let y=layout.bodyTop;y<=layout.bottom;y++){const bins=new Map();for(let x=left;x<right;x++){const p=(y*width+x)*4,r=data[p],g=data[p+1],b=data[p+2];if(Math.max(r,g,b)-Math.min(r,g,b)<35||Math.max(r,g,b)<95)continue;const key=[r,g,b].map(v=>Math.round(v/24)).join(',');let bin=bins.get(key);if(!bin){bin={n:0,r:0,g:0,b:0};bins.set(key,bin);}bin.n++;bin.r+=r;bin.g+=g;bin.b+=b;}
    const best=[...bins.values()].sort((a,b)=>b.n-a.n)[0],color=best&&best.n>w*.12?[best.r/best.n,best.g/best.n,best.b/best.n]:null;
    if(color){if(active&&color.some((v,i)=>Math.abs(v-active.color[i])>38))finish();if(!active)active={y0:y,last:y,color};else active.last=y;}else if(active&&y-active.last>gapLimit)finish();
   }finish();
  }const merged=[];for(const cell of out){const prev=merged.at(-1);if(prev&&prev.x0===cell.x0&&cell.y0-prev.y1<=Math.max(8,image.height*.04)&&!whiteGap(image,prev,cell)&&cell.color.every((v,i)=>Math.abs(v-prev.color[i])<40))prev.y1=cell.y1;else merged.push(cell);}return merged;
 }

 return {parse,coloredCells,getAxis,headers,detectLayout,tableCells};
})();
if(typeof module!=='undefined')module.exports=ScheduleGrid;
