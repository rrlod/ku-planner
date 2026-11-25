/* Presentation only: existing planning and storage remain in the original modules. */
(() => {
  'use strict';
  const paths = {
    layers:'<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
    calendar:'<rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M7.5 3v4m9-4v4m-13 4h17m-12 4h.01M12 15h.01M16 15h.01M8 18h.01M12 18h.01"/>',
    flag:'<path d="M5 21V4m0 0c5-4 9 4 14 0v10c-5 4-9-4-14 0"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    file:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z"/><path d="M14 3v6h6M8 13h8m-8 4h5"/>',
    passport:'<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M5 6H3m2 6H3m2 6H3m7-1h5"/><circle cx="12.5" cy="10" r="3"/>',
    room:'<path d="M3 21h18M6 21V5l12-2v18M14 12h.01"/><path d="M6 6H4v15"/>',
    trophy:'<path d="M8 3h8v6a4 4 0 0 1-8 0V3Zm0 2H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 2v5m-4 3h8m-6-3h4v3"/>',
    shield:'<path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6l8-3Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    external:'<path d="M14 4h6v6M20 4l-9 9M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    sliders:'<path d="M4 7h7m5 0h4M4 17h3m5 0h8"/><circle cx="13.5" cy="7" r="2.5"/><circle cx="9.5" cy="17" r="2.5"/>'
  };
  const icon = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.calendar)+'</svg>';
  document.querySelectorAll('[data-icon]').forEach(node => { node.innerHTML = icon(node.dataset.icon); });
  const $ = id => document.getElementById(id);
  if (!$('survey')) return;
  const survey = $('survey'), sidebar = $('appSidebar'), toggle = $('menuToggle'), scrim = $('sidebarScrim');
  const mobile = window.matchMedia('(max-width: 900px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  function closeMenu(returnFocus = false) {
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','Open navigation');
    scrim.hidden=true;
    sidebar.inert=mobile.matches;
    if(returnFocus) toggle.focus();
  }
  function openMenu() {
    sidebar.inert=false;
    document.body.classList.add('nav-open');
    toggle.setAttribute('aria-expanded','true');
    toggle.setAttribute('aria-label','Close navigation');
    scrim.hidden=false;
    sidebar.querySelector('a').focus();
  }
  toggle.addEventListener('click', () => document.body.classList.contains('nav-open') ? closeMenu(true) : openMenu());
  scrim.addEventListener('click', () => closeMenu(true));
  mobile.addEventListener('change', () => closeMenu());
  closeMenu();
  document.addEventListener('keydown', event => {
    if(!document.body.classList.contains('nav-open') || document.querySelector('dialog[open]')) return;
    if(event.key==='Escape'){event.preventDefault();closeMenu(true);}
    if(event.key==='Tab'){
      const nodes=[...sidebar.querySelectorAll('a[href],button:not(:disabled)')].filter(n => n.getClientRects().length);
      const first=nodes[0],last=nodes[nodes.length-1];
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  sidebar.addEventListener('click', event => {
    const link=event.target.closest('.side-link');
    if(!link) return;
    if(mobile.matches) closeMenu();
    if(link.tagName==='A' && link.hash && link.pathname===location.pathname){
      sidebar.querySelectorAll('.side-link').forEach(n=>{n.classList.remove('active');n.removeAttribute('aria-current');});
      link.classList.add('active');link.setAttribute('aria-current','location');
      const target=document.getElementById(link.hash.slice(1));
      if(target){target.tabIndex=-1;target.focus({preventScroll:true});}
    }
  });
  // Native modal focus handling stays with the browser. Close the drawer before opening one.
  $('openSyllabus').addEventListener('click',()=>closeMenu(),{capture:true});
  const dateNode=$('workspaceDate');
  function updateDate(){dateNode.innerHTML=icon('calendar');dateNode.append(document.createTextNode(new Intl.DateTimeFormat(undefined,{weekday:'short',month:'short',day:'numeric'}).format(new Date())));}
  updateDate();window.addEventListener('focus',updateDate);document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateDate();});setInterval(updateDate,60000);
  function syncView(){
    const setup=!survey.hidden;
    document.body.classList.toggle('setup-mode',setup);
    $('setupLayout').hidden=!setup;
    $('workspaceHome').href=setup?'#survey':'#dashboard';
    $('welcomeEyebrow').textContent=setup?'LET’S MAKE IT YOURS':'YOUR PERSONAL WORKSPACE';
    $('welcomeTitle').textContent=setup?'A better week starts here.':'Your week, thoughtfully planned.';
    $('welcomeCopy').textContent=setup?'A little planning. More room for what matters.':'Classes, goals and a little breathing room. All in one place.';
    const active=[...$('steps').children].findIndex(n=>n.classList.contains('active'));
    $('setupStepCount').textContent='STEP '+(Math.max(0,active)+1)+' OF 4';
    const fallback=setup?'Your setup':'Weekly planner';
    $('workspaceHome').querySelectorAll('span')[1].textContent=fallback;
  }
  syncView();
  new MutationObserver(syncView).observe(survey,{attributes:true,attributeFilter:['hidden']});
  new MutationObserver(()=>{
    syncView();
    if(!reduced.matches){
      const content=$('surveyContent');
      content.classList.remove('survey-content-enter');
      requestAnimationFrame(()=>content.classList.add('survey-content-enter'));
    }
  }).observe($('surveyTitle'),{childList:true});
  // Make each new question available to assistive technology without moving input focus.
  $('surveyTitle').setAttribute('aria-live','polite');
})();
