(() => {
 const banner=document.getElementById('siteBanner'),space=document.getElementById('bannerSpace');
 if(!banner||!space)return;
 let scheduled=false;
 function updateSpace(){
  const full=banner.cloneNode(true);
  full.removeAttribute('id');
  full.classList.remove('banner-compact','banner-fixed');
  full.setAttribute('aria-hidden','true');
  full.inert=true;
  full.style.cssText='position:absolute;top:0;left:0;width:100%;visibility:hidden;pointer-events:none;transition:none;';
  document.body.append(full);
  space.style.height=full.offsetHeight+'px';
  full.remove();
 }
 function updateBanner(){
  scheduled=false;
  const y=Math.max(0,window.scrollY);
  // A clear threshold prevents tiny scroll movements from making the header feel jumpy.
  banner.classList.toggle('banner-compact',y>95);
 }
 updateSpace();
 banner.classList.add('banner-fixed');
 updateBanner();
 window.addEventListener('scroll',()=>{
  if(!scheduled){scheduled=true;requestAnimationFrame(updateBanner);}
 },{passive:true});
 window.addEventListener('resize',()=>{updateSpace();updateBanner();},{passive:true});
 const logo=banner.querySelector('img');
 if(logo&&!logo.complete)logo.addEventListener('load',updateSpace,{once:true});
 if(document.fonts?.ready)document.fonts.ready.then(updateSpace);
})();
