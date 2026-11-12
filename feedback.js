(() => {
 const notice=document.getElementById('notice');if(!notice)return;
 let timeout;
 new MutationObserver(()=>{clearTimeout(timeout);if(notice.textContent&&!notice.textContent.startsWith('Browser storage'))timeout=setTimeout(()=>{notice.textContent='';},5500);}).observe(notice,{childList:true,characterData:true,subtree:true});
})();
