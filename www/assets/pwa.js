/* Progressive Web App install handling and cautious offline cache. */
(function () {
  'use strict';
  window.MSF_APP_CONFIG = window.MSF_APP_CONFIG || { androidApkUrl: '' };
  var deferredPrompt = null;
  var button, status;
  function setStatus(text) { if (status) status.textContent = text; }
  function refresh() {
    button = document.getElementById('installPwaButton');
    status = document.getElementById('installPwaStatus');
    var apkButton = document.getElementById('downloadApkButton');
    var apkUrl = String(window.MSF_APP_CONFIG.androidApkUrl || '').trim();
    if (apkButton) {
      if (/^https:\/\//i.test(apkUrl)) {
        apkButton.disabled = false;
        apkButton.className = 'px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-sm';
        apkButton.textContent = 'Download Android APK';
        apkButton.onclick = function () { window.open(apkUrl, '_blank', 'noopener,noreferrer'); };
      } else {
        apkButton.disabled = true;
        apkButton.className = 'px-5 py-3 rounded-xl bg-slate-800 border border-white/10 text-slate-500 font-black text-sm cursor-not-allowed';
        apkButton.textContent = 'APK link not configured';
        apkButton.onclick = null;
      }
    }
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) setStatus('App is already installed.');
    else if (deferredPrompt) setStatus('Ready to install this web app.');
    else setStatus('If no prompt appears, use your browser menu → Install app / Add to Home Screen.');
  }
  window.refreshInstallPanel = refresh;
  window.refreshProfilePanel = function () {
    var profile = null;
    try { profile = JSON.parse(localStorage.getItem('msf_user_profile') || 'null'); } catch (_) {}
    var user = window.firebaseAuth && window.firebaseAuth.currentUser;
    if (user) profile = { name:user.displayName || 'Medical Aspirant', email:user.email || '', photoURL:user.photoURL || '' };
    var name = document.getElementById('profilePanelName');
    var email = document.getElementById('profilePanelEmail');
    var avatar = document.getElementById('profilePanelAvatar');
    var logout = document.getElementById('profilePanelLogout');
    if (name) name.textContent = profile && profile.name ? profile.name : 'Guest Candidate';
    if (email) email.textContent = profile && profile.email ? profile.email : 'Not signed in';
    if (avatar) avatar.src = profile && profile.photoURL ? profile.photoURL : 'https://ui-avatars.com/api/?name=Candidate&background=0F172A&color=5eead4&bold=true';
    if (logout) logout.classList.toggle('hidden', !(profile && profile.name && profile.name !== 'Guest Candidate'));
  };
  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredPrompt = event;
    refresh();
  });
  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    refresh();
    setStatus('Install completed. Welcome!');
  });
  document.addEventListener('DOMContentLoaded', function () {
    refresh();
    window.refreshProfilePanel();
    if (window.firebaseAuth && window.firebaseAuth.onAuthStateChanged) window.firebaseAuth.onAuthStateChanged(function(){ window.refreshProfilePanel(); });
    document.getElementById('installPwaButton')?.addEventListener('click', async function () {
      if (!deferredPrompt) {
        setStatus('No install prompt is available. Try browser menu → Install app / Add to Home Screen.');
        return;
      }
      deferredPrompt.prompt();
      try {
        var choice = await deferredPrompt.userChoice;
        setStatus(choice && choice.outcome === 'accepted' ? 'Install accepted.' : 'Install was cancelled; you can try again later.');
      } catch (_) { setStatus('Please use your browser menu to install the app.'); }
      deferredPrompt = null;
      refresh();
    });
    var isLocalFile = location.protocol === 'file:';
    if ('serviceWorker' in navigator && !isLocalFile && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('./service-worker.js').catch(function (err) {
        console.warn('PWA service worker registration failed:', err);
      });
    }
  });
})();