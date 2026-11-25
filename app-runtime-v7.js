/* Online cache updates only. The portable edition does not need this script. */
(()=>{
 'use strict';
 window.addEventListener('beforeinstallprompt',event=>event.preventDefault());
 if(location.protocol==='file:'||!window.isSecureContext||!('serviceWorker' in navigator))return;
 const root=new URL('.',document.currentScript.src);
 // All changed V7 assets have new filenames. Activating an update does not need
 // to reload the page and interrupt a student's in-progress form or import.
 navigator.serviceWorker.register(new URL('sw.js',root),{scope:root.pathname,updateViaCache:'none'}).catch(()=>{});
})();
