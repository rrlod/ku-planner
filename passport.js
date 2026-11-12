(()=>{
  const KEY='kuCampusPassportV2';
  const LEGACY_KEY='kuCampusPassportV1';
  const PASSPORT_SIZE=8;
  const SKIP_COST=10;

  const challengePool=[
    {id:'activity-room',icon:'🏓',title:'Activity Room Break',category:'Recreation',text:'Spend part of a break using a KU activity-room option such as table tennis, billiards, or another available recreation activity.',points:25},
    {id:'gym',icon:'🏋️',title:'KU Fitness Visit',category:'Wellbeing',text:'Do at least 20 minutes of movement or exercise using an available KU fitness space.',points:30},
    {id:'court-sport',icon:'🏸',title:'Court Challenge',category:'Recreation',text:'Try an available KU court sport such as badminton, basketball, volleyball, or squash.',points:35},
    {id:'mind-body',icon:'🧘',title:'Move Differently',category:'Wellbeing',text:'Try a different movement activity, such as yoga or a martial-arts session, when available at KU.',points:35},
    {id:'club-discovery',icon:'🧭',title:'Discover a KU Club',category:'Explore',text:'Find one KU student club you did not know about before and learn what it does.',points:20},
    {id:'club-event',icon:'🎟️',title:'Club Moment',category:'Connect',text:'Attend, visit, or stop by a KU student-club activity or event.',points:35},
    {id:'question-mark',icon:'❓',title:'Puzzle Break',category:'Fun',text:'Solve a riddle, trivia question, mystery, or logic challenge with another KU student.',points:20},
    {id:'chess',icon:'♟️',title:'Chess Challenge',category:'Fun',text:'Play a game of chess or learn one new chess idea with someone on campus.',points:25},
    {id:'board-game',icon:'🎲',title:'Board Game Break',category:'Social',text:'Play a board or card game with classmates or friends during a campus break.',points:25},
    {id:'photo-walk',icon:'📸',title:'KU Photo Walk',category:'Creative',text:'Take a short campus photo walk and capture one interesting KU detail or place. Avoid photographing people without permission.',points:25},
    {id:'arts',icon:'🎭',title:'Creative KU',category:'Creative',text:'Explore a KU arts, music, theatre, or creative activity, event, or student project.',points:30},
    {id:'sustainability',icon:'🌱',title:'Green KU Action',category:'Impact',text:'Do one small sustainability action on campus, such as reducing waste, reusing an item, or learning about a KU sustainability initiative.',points:25},
    {id:'healthy-life',icon:'💚',title:'Healthy Life Check',category:'Wellbeing',text:'Choose one healthy action during your KU day: hydrate, take a screen-free break, walk, stretch, or choose a balanced meal.',points:20},
    {id:'coffee-tea',icon:'☕',title:'Coffee & Conversation',category:'Social',text:'Use a campus break to have coffee, tea, or another drink with a classmate and talk about something outside coursework.',points:20},
    {id:'cooking',icon:'🍳',title:'Taste & Culture',category:'Culture',text:'Explore a food, cooking, or cultural-food activity connected to KU student life when one is available.',points:30},
    {id:'innovation',icon:'💡',title:'Idea Spotting',category:'Explore',text:'Find a student innovation, startup idea, project display, hackathon, or entrepreneurship activity at KU and learn one thing about it.',points:30},
    {id:'toastmasters',icon:'🎤',title:'Speak Up',category:'Growth',text:'Practice a one-minute impromptu talk with a friend or take part in a speaking, debate, or communication activity at KU.',points:25},
    {id:'empowerment',icon:'🚀',title:'Growth Challenge',category:'Growth',text:'Attend or learn about a KU workshop, leadership activity, personal-development session, or student initiative.',points:30},
    {id:'adventure',icon:'🥾',title:'Adventure Mode',category:'Explore',text:'Learn about or take part in a KU-linked outdoor, recreation, or exploration activity when one is available.',points:30},
    {id:'clubs-day',icon:'🧩',title:'Clubs Day Explorer',category:'Events',text:'During Clubs Day, visit a club you would normally walk past. Outside Clubs Day, browse KU clubs and choose one you would like to visit.',points:25},
    {id:'global-day',icon:'🌍',title:'Global KU',category:'Culture',text:'During KU Global Day or another cultural activity, discover a tradition, cuisine, or perspective that is new to you.',points:30},
    {id:'national-day',icon:'🇦🇪',title:'UAE Culture Moment',category:'Culture',text:'Take part in or learn something new from a KU cultural or UAE National Day activity when available.',points:30},
    {id:'bazaar',icon:'🛍️',title:'KU Bazaar Discoverer',category:'Events',text:'At KU Bazaar or a student showcase, discover a student-made product, creative idea, or entrepreneurial project.',points:30},
    {id:'gaming',icon:'🎮',title:'Game Social',category:'Fun',text:'Join a friendly game, e-game, or casual competition with other KU students.',points:25},
    {id:'campus-connection',icon:'🤝',title:'New Campus Connection',category:'Social',text:'Have a friendly conversation with a KU student you do not usually speak with.',points:25},
    {id:'gratitude',icon:'💬',title:'KU Appreciation',category:'Community',text:'Thank a student, instructor, staff member, or teammate who made your KU day better.',points:20},
    {id:'new-space',icon:'🗺️',title:'New KU Space',category:'Explore',text:'Spend part of a break in a KU campus area, seating space, or facility you do not usually use.',points:20},
    {id:'student-service',icon:'🧑‍🤝‍🧑',title:'Know Your KU',category:'Community',text:'Learn about one KU student service, support resource, or campus office that you have not used before.',points:25}
  ];

  const root=document.getElementById('passportExperience');
  if(!root)return;
  const $=id=>document.getElementById(id);
  const safeParse=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
  const shuffle=(arr)=>{
    const a=[...arr];
    for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  };
  const newCycleIds=()=>shuffle(challengePool).slice(0,PASSPORT_SIZE).map(c=>c.id);
  const challengeById=id=>challengePool.find(c=>c.id===id);
  const todayText=()=>new Intl.DateTimeFormat(undefined,{year:'numeric',month:'long',day:'numeric'}).format(new Date());
  const certNumber=n=>`KU-LIFE-${String(n).padStart(3,'0')}`;

  let state=safeParse(KEY);
  if(!state){
    const legacy=safeParse(LEGACY_KEY);
    state={
      name:'',
      cycleIds:newCycleIds(),
      completed:[],
      active:null,
      currentPoints:0,
      lifetimePoints:legacy&&typeof legacy.totalPoints==='number'?legacy.totalPoints:0,
      streak:0,
      completedCycles:0,
      lastCertificate:null
    };
  }
  if(typeof state.name!=='string')state.name='';
  if(!Array.isArray(state.cycleIds)||state.cycleIds.length!==PASSPORT_SIZE)state.cycleIds=newCycleIds();
  if(!Array.isArray(state.completed))state.completed=[];
  state.completed=state.completed.filter(id=>state.cycleIds.includes(id));
  if(typeof state.currentPoints!=='number')state.currentPoints=0;
  if(typeof state.lifetimePoints!=='number')state.lifetimePoints=0;
  if(typeof state.streak!=='number')state.streak=0;
  if(typeof state.completedCycles!=='number')state.completedCycles=0;

  const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
  const currentChallenges=()=>state.cycleIds.map(challengeById).filter(Boolean);
  const remaining=()=>currentChallenges().filter(c=>!state.completed.includes(c.id));

  function setName(name){
    state.name=name.trim().replace(/\s+/g,' ');
    save();
    render();
  }

  function pick(){
    const pool=remaining();
    if(!pool.length)return;
    let chosen=pool[Math.floor(Math.random()*pool.length)];
    if(pool.length>1&&chosen.id===state.active){chosen=pool[(pool.indexOf(chosen)+1)%pool.length];}
    state.active=chosen.id;
    save();renderChallenge();
    const card=$('passportChallenge');
    card.classList.remove('passport-pop');void card.offsetWidth;card.classList.add('passport-pop');
  }

  function finishCycle(){
    const finished=currentChallenges();
    state.completedCycles+=1;
    state.streak+=1;
    state.lastCertificate={
      name:state.name,
      number:state.completedCycles,
      date:todayText(),
      streak:state.streak,
      challengeIds:finished.map(c=>c.id),
      points:state.currentPoints
    };
    // The requested behavior: finished passport stamps reset automatically.
    state.cycleIds=newCycleIds();
    state.completed=[];
    state.active=null;
    state.currentPoints=0;
    save();
    render();
    showCertificate(state.lastCertificate);
  }

  function complete(){
    const c=challengeById(state.active);if(!c||!state.cycleIds.includes(c.id))return;
    if(state.completed.includes(c.id))return;
    state.completed.push(c.id);
    state.currentPoints+=c.points;
    state.lifetimePoints+=c.points;
    save();
    const isFinished=state.completed.length>=PASSPORT_SIZE;
    if(isFinished){
      finishCycle();
      return;
    }
    render();
    const msg=$('passportMessage');
    msg.textContent=`Stamp unlocked: ${c.title} · +${c.points} KU Life Points`;
    msg.classList.remove('passport-celebrate');void msg.offsetWidth;msg.classList.add('passport-celebrate');
  }

  function skipChallenge(){
    const current=challengeById(state.active);
    if(!current||!state.cycleIds.includes(current.id)||state.completed.includes(current.id))return;
    const used=new Set(state.cycleIds);
    const candidates=challengePool.filter(c=>!used.has(c.id));
    if(!candidates.length)return;
    const replacement=candidates[Math.floor(Math.random()*candidates.length)];
    const index=state.cycleIds.indexOf(current.id);
    state.cycleIds[index]=replacement.id;
    state.active=replacement.id;
    state.currentPoints-=SKIP_COST;
    state.lifetimePoints-=SKIP_COST;
    save();
    render();
    const msg=$('passportMessage');
    msg.textContent=`Challenge skipped: ${current.title} · -${SKIP_COST} KU Life Points. New challenge: ${replacement.title}`;
  }

  function renderChallenge(){
    const c=challengeById(state.active);
    const card=$('passportChallenge');
    if(!c||!state.cycleIds.includes(c.id)){
      card.hidden=true;return;
    }
    $('passportChallengeIcon').textContent=c.icon;
    $('passportChallengeCategory').textContent=c.category.toUpperCase();
    $('passportChallengeTitle').textContent=c.title;
    $('passportChallengeText').textContent=c.text;
    $('passportChallengePoints').textContent=`+${c.points} points`;
    const completed=state.completed.includes(c.id);
    $('passportComplete').disabled=completed;
    $('passportComplete').textContent=completed?'Stamp collected ✓':'I completed it';
    $('passportSkip').disabled=completed;
    $('passportSkip').textContent=`Skip challenge (-${SKIP_COST} pts)`;
    card.hidden=false;
  }

  function renderStamps(){
    const grid=$('passportStamps');grid.replaceChildren();
    for(const c of currentChallenges()){
      const earned=state.completed.includes(c.id);
      const stamp=document.createElement('div');
      stamp.className='passport-stamp '+(earned?'earned':'locked');
      stamp.innerHTML=`<span class="stamp-icon">${earned?c.icon:'?'}</span><strong>${c.title}</strong><small>${earned?'STAMPED':'Not yet'}</small>`;
      stamp.title=earned?c.text:'Spin or open the stamp list to discover this challenge.';
      grid.append(stamp);
    }
  }

  function renderList(){
    const list=$('passportListItems');list.replaceChildren();
    for(const c of currentChallenges()){
      const earned=state.completed.includes(c.id);
      const item=document.createElement('div');
      item.className='passport-list-item '+(earned?'done':'');
      item.innerHTML=`<span class="passport-list-icon">${c.icon}</span><div><strong>${c.title}</strong><small>${c.category} · ${c.points} points</small><p>${c.text}</p></div><span class="passport-list-status">${earned?'✓ Stamped':'Open'}</span>`;
      list.append(item);
    }
  }

  function render(){
    const hasName=Boolean(state.name.trim());
    $('passportWelcome').hidden=hasName;
    root.hidden=!hasName;
    if(!hasName){$('passportNameInput').value='';return;}
    $('passportHolderName').textContent=state.name;
    const done=state.completed.length;
    $('passportCount').textContent=`${done} / ${PASSPORT_SIZE} stamps`;
    $('passportStreak').textContent=state.streak;
    $('passportLifetimePoints').textContent=state.lifetimePoints;
    $('passportCompletedCycles').textContent=state.completedCycles;
    $('passportPoints').textContent=state.currentPoints;
    $('passportProgress').max=PASSPORT_SIZE;
    $('passportProgress').value=done;
    $('passportProgressText').textContent=`${done} / ${PASSPORT_SIZE}`;
    renderChallenge();renderStamps();
  }

  function showCertificate(cert){
    if(!cert)return;
    $('certificateName').textContent=cert.name;
    $('certificateNumber').textContent=certNumber(cert.number);
    $('certificateStreak').textContent=cert.streak;
    $('certificateDate').textContent=cert.date;
    const row=$('certificateStampRow');row.replaceChildren();
    for(const id of cert.challengeIds){
      const c=challengeById(id);if(!c)continue;
      const span=document.createElement('span');
      span.className='certificate-mini-stamp';span.title=c.title;span.textContent=c.icon;row.append(span);
    }
    $('passportCertificateDialog').showModal();
  }

  $('passportNameForm').addEventListener('submit',e=>{
    e.preventDefault();
    const name=$('passportNameInput').value.trim();
    if(name)setName(name);
  });
  $('passportChangeName').addEventListener('click',()=>{
    $('passportExperience').hidden=true;
    $('passportWelcome').hidden=false;
    $('passportNameInput').value=state.name;
    $('passportNameInput').focus();
  });
  $('passportSpin').addEventListener('click',pick);
  $('passportComplete').addEventListener('click',complete);
  $('passportSkip').addEventListener('click',skipChallenge);
  $('passportShowAll').addEventListener('click',()=>{renderList();$('passportListDialog').showModal();});
  $('passportListClose').addEventListener('click',()=>$('passportListDialog').close());
  $('passportCertificateClose').addEventListener('click',()=>$('passportCertificateDialog').close());
  $('passportContinue').addEventListener('click',()=>$('passportCertificateDialog').close());
  $('passportPrintCertificate').addEventListener('click',()=>window.print());

  save();render();
})();
