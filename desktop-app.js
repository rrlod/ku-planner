(() => {
  const appRoot = new URL('.', document.currentScript.src);
  const onInstallPage = document.body.classList.contains('install-page');
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const bar = document.createElement('aside');
  bar.className = 'desktop-app-bar';
  bar.setAttribute('aria-label', 'KU Planner desktop app');
  bar.innerHTML = '<div class="desktop-app-copy"><strong>KU Planner · V4.0</strong><small id="desktopAppStatus" role="status">Your plans and Passport progress stay on this device.</small></div><div class="desktop-app-actions"><button id="desktopAppInstall" class="primary" type="button">Install KU Planner</button><button id="desktopAppHelp" type="button">App help</button></div>';
  const main = document.querySelector('main');
  if (onInstallPage) document.querySelector('.get-footer').before(bar);
  else if (main) main.before(bar); else document.body.prepend(bar);
  const status = bar.querySelector('#desktopAppStatus');
  const install = bar.querySelector('#desktopAppInstall');
  const help = document.createElement('dialog');
  help.className = 'desktop-app-help';
  help.innerHTML = '<h2>Install KU Planner</h2><p>No account or payment is needed.</p><ol><li>Open this page in <strong>Microsoft Edge</strong> or <strong>Google Chrome</strong> on your PC.</li><li>In Edge, open <strong>… → More tools → Apps → Install this site as an app</strong>. Some Edge versions show Apps directly in the menu. In Chrome, look for <strong>Install</strong> in the address bar or under <strong>Cast, save and share</strong>.</li><li>Confirm installation, then choose a desktop shortcut or pin it to Start.</li></ol><p>After offline access is ready, the planner, Passport and calendar work without internet. Photo recognition and KU website links need a connection.</p><p>Saved plans stay on your device in this browser profile. To uninstall, use the app menu or your browser’s app manager.</p><p><a href="'+new URL('KUplannerV4.0_Offline.zip',appRoot).href+'" download>Download the offline ZIP instead</a></p><button type="button" class="primary">Got it</button>';
  document.body.append(help);
  help.querySelector('button').addEventListener('click', () => help.close());
  bar.querySelector('#desktopAppHelp').addEventListener('click', () => help.showModal());
  let prompt = null, offlineReady = false;
  const update = () => {
    install.hidden = !!standalone();
    status.textContent = offlineReady
      ? (navigator.onLine ? 'Offline access ready · Your data stays on this device.' : 'You’re offline · Planner and Passport are available.')
      : (navigator.onLine ? 'Preparing offline access…' : 'Connect once to prepare offline access.');
  };
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); prompt = event; });
  window.addEventListener('appinstalled', () => { prompt = null; install.hidden = true; });
  const installButtons = [install,...document.querySelectorAll('[data-install-app]')];
  const feedback = document.querySelector('[data-install-feedback]');
  installButtons.forEach(button => button.addEventListener('click', async () => {
    if (!prompt) { help.showModal(); return; }
    const request = prompt; prompt = null;
    try {
      await request.prompt();
      const choice = await request.userChoice;
      if (feedback) feedback.textContent = choice.outcome === 'accepted' ? 'KU Planner is being installed. Choose a desktop shortcut when your browser offers it.' : 'You can install later or keep using the planner in your browser.';
    } catch { help.showModal(); }
  }));
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  matchMedia('(display-mode: standalone)').addEventListener('change', update);
  update();
  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register(new URL('sw.js', appRoot), {scope: appRoot.pathname}).then(async registration => {
      const watch = () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'redundant' && !offlineReady) status.textContent = 'Offline setup needs a retry. Reopen while connected.';
        });
      };
      watch(); registration.addEventListener('updatefound', watch);
      await navigator.serviceWorker.ready;
      offlineReady = true; update();
    }).catch(() => { status.textContent = 'Offline setup unavailable. You can keep using the planner while connected.'; });
  } else {
    status.textContent = 'Open the hosted app in Edge to install it and enable offline access.';
  }
})();
