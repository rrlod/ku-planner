(() => {
  const appRoot = new URL('.', document.currentScript.src);
  const onDownloadPage = document.body.classList.contains('install-page');
  const hiddenKey = 'ku-planner-notice-dismissed-v5';
  let dismissed = false;
  try { dismissed = localStorage.getItem(hiddenKey) === 'yes'; } catch {}
  let status = null;
  if (!onDownloadPage && !dismissed) {
    const bar = document.createElement('aside');
    bar.className = 'desktop-app-bar';
    bar.setAttribute('aria-label', 'Planner information');
    bar.innerHTML = '<div class="desktop-app-copy"><strong>KuPlannerV5.0</strong><small id="desktopAppStatus" role="status">Your plans and Passport progress stay on this device.</small></div><div class="desktop-app-actions"><a class="desktop-app-download" href="'+new URL('KuPlannerV5.0.zip',appRoot).href+'" download>Download ZIP</a><button id="dismissAppNotice" class="desktop-app-dismiss" type="button" aria-label="Dismiss planner banner" title="Dismiss">×</button></div>';
    const main = document.querySelector('main');
    if (main) main.before(bar); else document.body.prepend(bar);
    status = bar.querySelector('#desktopAppStatus');
    bar.querySelector('#dismissAppNotice').addEventListener('click', () => {
      try { localStorage.setItem(hiddenKey, 'yes'); } catch {}
      bar.remove(); status = null;
    });
  }
  window.addEventListener('beforeinstallprompt', event => event.preventDefault());
  let offlineReady = false;
  const update = () => {
    if (!status) return;
    status.textContent = offlineReady
      ? (navigator.onLine ? 'Offline access ready · Your data stays on this device.' : 'You’re offline · Planner and Passport are available.')
      : 'Your plans and Passport progress stay on this device.';
  };
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  if ('serviceWorker' in navigator && window.isSecureContext && location.protocol !== 'file:') {
    const alreadyControlled = !!navigator.serviceWorker.controller;
    let refreshed = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (alreadyControlled && !refreshed) { refreshed = true; location.reload(); }
    });
    navigator.serviceWorker.register(new URL('sw.js', appRoot), {scope: appRoot.pathname}).then(async registration => {
      const watch = () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'redundant' && !offlineReady && status) status.textContent = 'Offline setup needs a retry. Reopen while connected.';
        });
      };
      watch(); registration.addEventListener('updatefound', watch);
      await navigator.serviceWorker.ready;
      offlineReady = true; update();
    }).catch(() => { if (status) status.textContent = 'Your data stays on this device. Offline setup will retry next time.'; });
  }
})();
