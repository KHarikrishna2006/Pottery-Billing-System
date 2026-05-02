/* ═══════════════════════════════════════
   PWA INSTALL — Works on localhost too
   Shows custom guide always
   ═══════════════════════════════════════ */

var deferredPrompt = null;

/* Capture native prompt (works on HTTPS/Android Chrome) */
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  deferredPrompt = e;
});

window.addEventListener('appinstalled', function() {
  localStorage.setItem('pwa_installed','1');
  hideAll();
  showToast('App installed! Open from home screen.', '#10B981');
});

/* ── SHOW ON LOAD ── */
document.addEventListener('DOMContentLoaded', function() {
  /* Skip if already installed or dismissed today */
  if (localStorage.getItem('pwa_installed')) return;
  var lastDismiss = localStorage.getItem('pwa_dismissed_at');
  if (lastDismiss && (Date.now() - parseInt(lastDismiss)) < 3600000) return; /* 1hr cooldown */

  setTimeout(showInstallCard, 2000);
});

function showInstallCard() {
  var el = document.getElementById('pwaNotif');
  if (!el) return;
  el.style.display = 'flex';
  requestAnimationFrame(function(){ requestAnimationFrame(function(){
    el.style.transform = 'translateY(0)';
    el.style.opacity = '1';
  }); });
}

function hideAll() {
  ['pwaNotif','pwaBanner','pwaGuide'].forEach(function(id){
    var el = document.getElementById(id);
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    setTimeout(function(){ el.style.display='none'; }, 280);
  });
}

function installApp() {
  /* If native prompt available (Android Chrome on HTTPS) */
  if (deferredPrompt) {
    hideAll();
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function(r) {
      if (r.outcome === 'accepted') {
        localStorage.setItem('pwa_installed','1');
        showToast('Installing... Check home screen!', '#10B981');
      }
      deferredPrompt = null;
    });
  } else {
    /* Show manual guide */
    hideAll();
    showGuide();
  }
}

function dismissInstall() {
  hideAll();
  localStorage.setItem('pwa_dismissed_at', Date.now().toString());
  /* Show small reminder banner after 30 mins */
  setTimeout(function(){
    if (localStorage.getItem('pwa_installed')) return;
    var b = document.getElementById('pwaBanner');
    if (b) {
      b.style.display = 'flex';
      requestAnimationFrame(function(){ requestAnimationFrame(function(){
        b.style.opacity = '1';
        b.style.transform = 'translateY(0)';
      }); });
    }
  }, 1800000);
}

function showGuide() {
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var isAndroid = /android/i.test(navigator.userAgent);
  var g = document.getElementById('pwaGuide');
  if (!g) return;

  var steps = '';
  if (isIOS) {
    steps =
      '<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">' +
        '<div style="width:28px;height:28px;background:#EEF2FF;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:700;color:#4F46E5;font-size:.8rem;">1</div>' +
        '<p style="color:#334155;font-size:.88rem;margin:4px 0 0;">Tap the <strong>Share</strong> button <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" style="vertical-align:middle"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> at the bottom of Safari</p>' +
      '</div>' +
      '<div style="display:flex;align-items:flex-start;gap:12px;">' +
        '<div style="width:28px;height:28px;background:#EEF2FF;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:700;color:#4F46E5;font-size:.8rem;">2</div>' +
        '<p style="color:#334155;font-size:.88rem;margin:4px 0 0;">Scroll down and tap <strong>"Add to Home Screen"</strong> then tap <strong>Add</strong></p>' +
      '</div>';
  } else if (isAndroid) {
    steps =
      '<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">' +
        '<div style="width:28px;height:28px;background:#EEF2FF;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:700;color:#4F46E5;font-size:.8rem;">1</div>' +
        '<p style="color:#334155;font-size:.88rem;margin:4px 0 0;">Tap the <strong>⋮ menu</strong> in top-right of Chrome</p>' +
      '</div>' +
      '<div style="display:flex;align-items:flex-start;gap:12px;">' +
        '<div style="width:28px;height:28px;background:#EEF2FF;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:700;color:#4F46E5;font-size:.8rem;">2</div>' +
        '<p style="color:#334155;font-size:.88rem;margin:4px 0 0;">Tap <strong>"Add to Home Screen"</strong> then <strong>Add</strong></p>' +
      '</div>';
  } else {
    steps =
      '<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">' +
        '<div style="width:28px;height:28px;background:#EEF2FF;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:700;color:#4F46E5;font-size:.8rem;">1</div>' +
        '<p style="color:#334155;font-size:.88rem;margin:4px 0 0;">Open this page in <strong>Chrome</strong> on your phone</p>' +
      '</div>' +
      '<div style="display:flex;align-items:flex-start;gap:12px;">' +
        '<div style="width:28px;height:28px;background:#EEF2FF;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:700;color:#4F46E5;font-size:.8rem;">2</div>' +
        '<p style="color:#334155;font-size:.88rem;margin:4px 0 0;">Tap <strong>⋮</strong> → <strong>"Add to Home Screen"</strong></p>' +
      '</div>';
  }

  document.getElementById('guideSteps').innerHTML = steps;
  g.style.display = 'flex';
  requestAnimationFrame(function(){ requestAnimationFrame(function(){
    g.style.opacity = '1';
    g.style.transform = 'scale(1)';
  }); });
}

function closeGuide() {
  var g = document.getElementById('pwaGuide');
  if (g) {
    g.style.opacity = '0';
    g.style.transform = 'scale(.96)';
    setTimeout(function(){ g.style.display='none'; }, 280);
  }
}

function showToast(msg, bg) {
  var t = document.createElement('div');
  t.style.cssText = 'position:fixed;top:72px;left:50%;transform:translateX(-50%) translateY(-8px);padding:10px 22px;border-radius:24px;background:'+(bg||'#4F46E5')+';color:white;font-size:.82rem;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.2);opacity:0;transition:all .3s;pointer-events:none;white-space:nowrap;';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(function(){ t.style.opacity='1'; t.style.transform='translateX(-50%) translateY(0)'; });
  setTimeout(function(){ t.style.opacity='0'; setTimeout(function(){ t.remove(); },300); }, 3200);
}

/* ── LISTEN FOR SW MESSAGES ── */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'SYNC_COMPLETE') {
      showToast('Bills synced successfully!', '#10B981');
    }
  });
}

/* ── ONLINE/OFFLINE BANNER ── */
function showOfflineBanner() {
  var b = document.getElementById('offlineBanner');
  if (b) { b.style.display = 'flex'; requestAnimationFrame(function(){ requestAnimationFrame(function(){ b.style.opacity='1'; }); }); }
}
function hideOfflineBanner() {
  var b = document.getElementById('offlineBanner');
  if (b) { b.style.opacity='0'; setTimeout(function(){ b.style.display='none'; },300); }
}
window.addEventListener('offline', showOfflineBanner);
window.addEventListener('online', function() {
  hideOfflineBanner();
  showToast('Back online!', '#10B981');
});
/* Check on load */
if (!navigator.onLine) showOfflineBanner();
