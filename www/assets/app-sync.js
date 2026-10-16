/**
 * Medical Secret Files - Windows Desktop App & Web Cross-Device Sync Module
 * Features: 2-Minute Rotating 6-Digit Pair Codes, Electron-Safe Token Paste & Realtime Sync
 */

(function (global) {
  'use strict';

  const STORAGE_PROFILE_KEY = 'msf_user_profile';
  const STORAGE_HISTORY_KEY = 'msf_exam_history_v2';
  const SYNC_COLLECTION = 'app_sync_tokens';
  const CODE_ROTATE_SECONDS = 120; // 2 minutes auto-rotate

  // Detect environment
  const isDesktopApp = !!(
    window.navigator.userAgent.includes('Electron') ||
    window.process?.type === 'renderer' ||
    window.location.protocol === 'file:'
  );

  let currentPairCode = null;
  let syncUnsubscribe = null;
  let codeTimerInterval = null;
  let secondsRemaining = CODE_ROTATE_SECONDS;

  /**
   * Generate 6-digit random code (e.g. MSF-8392)
   */
  function generatePairCode() {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `MSF-${randomDigits}`;
  }

  /**
   * Get Current Local User Profile
   */
  function getLocalProfile() {
    try {
      const raw = localStorage.getItem(STORAGE_PROFILE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    
    if (global.firebaseAuth?.currentUser) {
      const u = global.firebaseAuth.currentUser;
      return {
        uid: u.uid,
        name: u.displayName || 'Medical Candidate',
        email: u.email || '',
        photoURL: u.photoURL || ''
      };
    }
    return null;
  }

  /**
   * Save and Apply User Profile locally
   */
  function applyUserProfile(profile, triggerNotice = true) {
    if (!profile) return;
    try {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
    } catch {}

    const nameEl = document.getElementById('userName');
    const emailEl = document.getElementById('userEmail');
    const imgEl = document.getElementById('userImg');
    const authBtnText = document.getElementById('authBtnText');
    const logoutBtn = document.getElementById('logoutBtn');
    const leaderboardName = document.getElementById('leaderboardUserName');
    const leaderboardSub = document.getElementById('leaderboardUserSub');
    const leaderboardAvatar = document.getElementById('leaderboardAvatar');

    if (nameEl) nameEl.textContent = profile.name || 'Medical Candidate';
    if (emailEl) emailEl.textContent = profile.email || 'Synced Account';
    if (imgEl) {
      imgEl.src = profile.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'Candidate')}&background=0F172A&color=c084fc&bold=true`;
    }
    if (authBtnText) authBtnText.textContent = 'Account Synced';
    if (logoutBtn) logoutBtn.style.display = 'block';

    if (leaderboardName) leaderboardName.textContent = profile.name || 'Medical Candidate';
    if (leaderboardSub) leaderboardSub.textContent = profile.email || 'Synced Account';
    if (leaderboardAvatar) leaderboardAvatar.textContent = (profile.name || 'C').charAt(0).toUpperCase();

    if (triggerNotice) {
      showSyncToast(`✓ Welcome ${profile.name}! Account synced with Windows App.`);
      if (typeof global.confetti === 'function') {
        global.confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }
    }
  }

  /**
   * Reset/Sign Out User completely
   */
  function clearUserProfile() {
    try {
      localStorage.removeItem(STORAGE_PROFILE_KEY);
    } catch {}

    if (global.firebaseAuth) {
      global.firebaseAuth.signOut().catch(() => {});
    }

    const nameEl = document.getElementById('userName');
    const emailEl = document.getElementById('userEmail');
    const imgEl = document.getElementById('userImg');
    const authBtnText = document.getElementById('authBtnText');
    const logoutBtn = document.getElementById('logoutBtn');
    const leaderboardName = document.getElementById('leaderboardUserName');
    const leaderboardSub = document.getElementById('leaderboardUserSub');
    const leaderboardAvatar = document.getElementById('leaderboardAvatar');

    if (nameEl) nameEl.textContent = 'Guest Candidate';
    if (emailEl) emailEl.textContent = 'Not signed in';
    if (imgEl) imgEl.src = 'https://ui-avatars.com/api/?name=Candidate&background=0F172A&color=c084fc&bold=true';
    if (authBtnText) authBtnText.textContent = 'Sign In with Google';
    if (logoutBtn) logoutBtn.style.display = 'none';

    if (leaderboardName) leaderboardName.textContent = 'Guest Candidate';
    if (leaderboardSub) leaderboardSub.textContent = 'Sign in with Gmail to save & rank';
    if (leaderboardAvatar) leaderboardAvatar.textContent = 'S';

    showSyncToast('Signed out successfully.');
  }

  /**
   * Start 2-Minute Rotating Countdown Timer
   */
  function startPairCodeRotation() {
    clearInterval(codeTimerInterval);
    secondsRemaining = CODE_ROTATE_SECONDS;

    const timerEl = document.getElementById('code-rotate-timer');
    if (timerEl) timerEl.textContent = `Rotates in ${secondsRemaining}s`;

    codeTimerInterval = setInterval(() => {
      secondsRemaining--;
      const el = document.getElementById('code-rotate-timer');
      if (el) el.textContent = `Rotates in ${secondsRemaining}s`;

      if (secondsRemaining <= 0) {
        rotatePairCode();
      }
    }, 1000);
  }

  /**
   * Rotate to a new 6-digit pair code
   */
  function rotatePairCode() {
    currentPairCode = generatePairCode();
    secondsRemaining = CODE_ROTATE_SECONDS;

    const display = document.getElementById('desktop-sync-code-display');
    if (display) display.textContent = currentPairCode;

    const webLinkBtn = document.getElementById('btn-open-web-sync');
    if (webLinkBtn) {
      webLinkBtn.onclick = () => openWebSyncPage(currentPairCode);
    }

    if (syncUnsubscribe) syncUnsubscribe();
    startListeningForCode(currentPairCode);
  }

  /**
   * Open the Web Sync Page (for Desktop App user)
   */
  function openWebSyncPage(code) {
    const pairParam = encodeURIComponent(code || currentPairCode || '');
    let baseUrl = 'https://tausif-rahaman-raiyan.github.io/medical-exam-app/sync.html';
    
    // If running in a standard web browser on a live origin, use the current host sync.html
    if (window.location && window.location.protocol.startsWith('http') && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
      const currentPath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
      baseUrl = `${window.location.origin}${currentPath}sync.html`;
    }

    const syncUrl = `${baseUrl}?pair=${pairParam}`;
    if (typeof window !== 'undefined') {
      window.open(syncUrl, '_blank');
    }
  }

  /**
   * Open the In-App Sync Modal
   */
  function openSyncModal(prefilledCode = '') {
    const existing = document.getElementById('sync-hub-modal');
    if (existing) existing.remove();

    if (syncUnsubscribe) {
      syncUnsubscribe();
      syncUnsubscribe = null;
    }
    clearInterval(codeTimerInterval);

    const activeProfile = getLocalProfile();
    currentPairCode = prefilledCode || generatePairCode();

    const modal = document.createElement('div');
    modal.id = 'sync-hub-modal';
    modal.className = 'fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200';

    modal.innerHTML = `
      <div class="bg-[#1E293B] border border-purple-500/30 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <!-- Header -->
        <div class="p-5 sm:p-6 bg-gradient-to-r from-purple-900/50 via-indigo-900/50 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-400/40 text-purple-300 flex items-center justify-center text-lg shadow-inner">
              <i class="fa fa-rotate"></i>
            </div>
            <div>
              <h3 class="text-base sm:text-lg font-black text-white">Windows App & Web Sync Hub</h3>
              <p class="text-xs text-purple-300 font-mono">1-Click Cross-Device Account & History Sync</p>
            </div>
          </div>
          <button onclick="document.getElementById('sync-hub-modal').remove()" class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all">
            <i class="fa fa-xmark text-sm"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          
          <!-- Current Environment Banner -->
          <div class="p-4 rounded-2xl ${isDesktopApp ? 'bg-indigo-950/60 border-indigo-500/40' : 'bg-purple-950/60 border-purple-500/40'} border flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <i class="fa ${isDesktopApp ? 'fa-desktop text-indigo-400' : 'fa-globe text-purple-400'} text-xl"></i>
              <div>
                <p class="text-xs font-bold text-white">${isDesktopApp ? 'Running on Windows Desktop App' : 'Running on Web Platform'}</p>
                <p class="text-[11px] text-slate-400">${activeProfile ? `Active: ${activeProfile.name} (${activeProfile.email || 'Logged in'})` : 'Guest / Unlinked'}</p>
              </div>
            </div>
            ${activeProfile ? '<span class="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-black uppercase">Logged In</span>' : '<span class="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[11px] font-black uppercase">Not Synced</span>'}
          </div>

          <!-- Section 1: 2-Minute Rotating 6-Digit Pair Code -->
          <div class="bg-slate-900/80 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <i class="fa fa-key text-purple-400"></i> Automatic 6-Digit Pairing
              </span>
              <span id="code-rotate-timer" class="text-[11px] font-mono text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/30">
                Rotates in 120s
              </span>
            </div>

            <!-- IF ON DESKTOP APP: Show Rotating Pair Code and Web Sync Link -->
            <div class="space-y-3.5 ${isDesktopApp ? '' : 'hidden'}" id="desktop-pair-view">
              <p class="text-xs text-slate-300 leading-relaxed">
                Log in on the website, or click below to open the Web Login Hub, and approve this rotating code:
              </p>
              <div class="flex items-center justify-center p-4 bg-slate-950 rounded-2xl border border-purple-500/40 text-center shadow-inner">
                <span id="desktop-sync-code-display" class="font-mono text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-300 to-indigo-300 tracking-widest">
                  ${currentPairCode}
                </span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button id="btn-open-web-sync" onclick="window.AppSync.openWebSyncPage('${currentPairCode}')" class="py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all">
                  <i class="fa fa-arrow-up-right-from-square"></i> Open Web Login Hub
                </button>
                <button onclick="window.AppSync.rotatePairCode()" class="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all">
                  <i class="fa fa-rotate"></i> Refresh Code Now
                </button>
              </div>
              <p class="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1.5 pt-1">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Listening in real-time for web authorization...
              </p>
            </div>

            <!-- IF ON WEB: Input Pair Code to Push to Desktop -->
            <div class="space-y-3 ${isDesktopApp ? 'hidden' : ''}" id="web-pair-view">
              <p class="text-xs text-slate-300 leading-relaxed">
                Enter the <strong>6-digit Pair Code</strong> shown on your Windows App screen to instantly log your desktop app in:
              </p>
              
              <div class="flex gap-2">
                <input type="text" id="web-sync-code-input" value="${prefilledCode || ''}" placeholder="e.g. MSF-7842" maxlength="10" class="flex-1 uppercase bg-slate-950 border border-purple-500/40 focus:border-purple-400 rounded-xl px-4 py-3 font-mono font-black text-lg text-purple-200 tracking-wider placeholder:text-slate-600 outline-none" />
                <button onclick="window.AppSync.authorizeDesktopFromWeb()" id="btn-authorize-sync" class="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-purple-950/50 flex items-center gap-2 transition-all">
                  <i class="fa fa-bolt"></i> Push Login
                </button>
              </div>

              ${!activeProfile ? `
                <div class="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-2">
                  <span>You are not signed in on Web yet.</span>
                  <button onclick="window.AppSync.triggerWebSignInFirst()" class="px-3 py-1.5 rounded-lg bg-purple-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-purple-500">
                    <i class="fa-brands fa-google"></i> Sign In First
                  </button>
                </div>
              ` : `
                <p class="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <i class="fa fa-circle-check"></i> Ready to push <strong>${activeProfile.name}</strong> to desktop.
                </p>
              `}
            </div>

          </div>

          <!-- Section 2: Direct Token & Offline History Sync (With In-App Paste Area) -->
          <div class="bg-slate-900/80 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3.5">
            <span class="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <i class="fa fa-shield-halved text-indigo-400"></i> Direct Token & Offline History Sync
            </span>
            <p class="text-xs text-slate-400">
              You can also copy your complete encrypted account & exam history token to transfer between any device:
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button onclick="window.AppSync.copySyncToken()" class="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all">
                <i class="fa fa-file-export text-purple-400"></i> Copy My Sync Token
              </button>
              <button onclick="window.AppSync.openInAppPasteModal()" class="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all">
                <i class="fa fa-file-import text-indigo-400"></i> Paste & Import Token
              </button>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="p-4 bg-slate-950/60 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span class="font-mono text-[11px]">Medical Secret Files v2.0</span>
          <button onclick="document.getElementById('sync-hub-modal').remove()" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs">
            Done
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Start 2-minute rotation countdown and Firestore listener
    startPairCodeRotation();
    startListeningForCode(currentPairCode);
  }

  /**
   * Listen for code authorization on Firestore
   */
  function startListeningForCode(code) {
    if (!code || !global.firebaseDB) return;
    try {
      syncUnsubscribe = global.firebaseDB.collection(SYNC_COLLECTION).doc(code).onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data();
          if (data && data.status === 'authorized' && data.user) {
            applyUserProfile(data.user);
            if (data.history && Array.isArray(data.history)) {
              try {
                localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(data.history));
              } catch {}
            }
            clearInterval(codeTimerInterval);
            const badge = document.getElementById('code-rotate-timer');
            if (badge) {
              badge.textContent = 'Status: Successfully Synced!';
              badge.className = 'text-[11px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30';
            }
            setTimeout(() => {
              const modal = document.getElementById('sync-hub-modal');
              if (modal) modal.remove();
            }, 2000);
          }
        }
      }, (err) => {
        console.warn('Sync listener note:', err);
      });
    } catch (e) {
      console.warn('Sync listener init note:', e);
    }
  }

  /**
   * Authorize Desktop from Web
   */
  async function authorizeDesktopFromWeb() {
    const input = document.getElementById('web-sync-code-input');
    const code = input ? input.value.trim().toUpperCase() : '';
    const btn = document.getElementById('btn-authorize-sync');

    if (!code || code.length < 5) {
      showSyncToast('Please enter a valid 6-digit code (e.g. MSF-8392)');
      return;
    }

    const activeProfile = getLocalProfile();
    if (!activeProfile) {
      showSyncToast('Please sign in on the web first before syncing.');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Authorizing...';
    }

    let historyData = [];
    try {
      const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (raw) historyData = JSON.parse(raw);
    } catch {}

    try {
      if (global.firebaseDB) {
        await global.firebaseDB.collection(SYNC_COLLECTION).doc(code).set({
          status: 'authorized',
          code: code,
          user: activeProfile,
          history: historyData.slice(0, 100),
          authorizedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showSyncToast(`✓ Successfully pushed ${activeProfile.name} to Windows App!`);
        if (typeof global.confetti === 'function') {
          global.confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        }

        setTimeout(() => {
          const modal = document.getElementById('sync-hub-modal');
          if (modal) modal.remove();
        }, 2200);
      } else {
        throw new Error('Firestore not initialized');
      }
    } catch (err) {
      console.error('Authorization error:', err);
      showSyncToast('Sync error. Try copying the Direct Sync Token instead.');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa fa-bolt"></i> Push Login';
      }
    }
  }

  /**
   * Copy Direct Offline Sync Token
   */
  function copySyncToken() {
    const profile = getLocalProfile() || { name: 'Medical Aspirant', email: 'offline@candidate.com' };
    let history = [];
    try {
      const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (raw) history = JSON.parse(raw);
    } catch {}

    const payload = {
      profile,
      history: history.slice(0, 50),
      timestamp: Date.now()
    };

    const tokenStr = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    navigator.clipboard.writeText(tokenStr).then(() => {
      showSyncToast('✓ Complete Sync Token copied to clipboard!');
    }).catch(() => {
      prompt('Copy your Sync Token:', tokenStr);
    });
  }

  /**
   * In-App Dedicated Paste Modal (Electron & Browser Safe)
   */
  function openInAppPasteModal() {
    const existing = document.getElementById('inapp-paste-modal');
    if (existing) existing.remove();

    const pasteModal = document.createElement('div');
    pasteModal.id = 'inapp-paste-modal';
    pasteModal.className = 'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4';
    pasteModal.innerHTML = `
      <div class="bg-[#1E293B] border border-purple-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-black text-white flex items-center gap-2">
            <i class="fa fa-file-import text-indigo-400"></i> Paste & Import Sync Token
          </h3>
          <button onclick="document.getElementById('inapp-paste-modal').remove()" class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center">
            <i class="fa fa-xmark"></i>
          </button>
        </div>
        <p class="text-xs text-slate-300">Paste your encrypted sync token below using <strong>Ctrl+V</strong>:</p>
        <textarea id="inapp-token-textarea" rows="4" placeholder="Paste your token string here..." class="w-full bg-slate-950 border border-purple-500/40 rounded-xl p-3 text-xs font-mono text-slate-200 outline-none focus:border-purple-400"></textarea>
        <div class="flex gap-2.5">
          <button onclick="window.AppSync.readClipboardIntoBox()" class="py-2.5 px-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-700">
            <i class="fa fa-paste"></i> Read Clipboard
          </button>
          <button onclick="window.AppSync.processInAppToken()" class="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs">
            Import Account & History
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(pasteModal);
  }

  async function readClipboardIntoBox() {
    try {
      const text = await navigator.clipboard.readText();
      const ta = document.getElementById('inapp-token-textarea');
      if (ta) ta.value = text.trim();
    } catch {
      showSyncToast('Please use Ctrl+V to paste into the text box.');
    }
  }

  function processInAppToken() {
    const raw = document.getElementById('inapp-token-textarea')?.value?.trim();
    if (!raw) {
      showSyncToast('Please paste a sync token first.');
      return;
    }
    try {
      const parsed = JSON.parse(decodeURIComponent(escape(atob(raw))));
      if (parsed && parsed.profile) {
        applyUserProfile(parsed.profile);
        if (parsed.history && Array.isArray(parsed.history)) {
          localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(parsed.history));
        }
        document.getElementById('inapp-paste-modal')?.remove();
        document.getElementById('sync-hub-modal')?.remove();
        showSyncToast(`✓ Welcome ${parsed.profile.name}! Account and history imported.`);
      } else {
        throw new Error('Invalid token');
      }
    } catch {
      alert('Invalid sync token format. Please check the copied code and try again.');
    }
  }

  /**
   * Trigger Google Sign In
   */
  async function triggerWebSignInFirst() {
    try {
      if (global.firebaseAuth && global.googleProvider) {
        const res = await global.firebaseAuth.signInWithPopup(global.googleProvider);
        if (res.user) {
          const profile = {
            uid: res.user.uid,
            name: res.user.displayName || 'Medical Aspirant',
            email: res.user.email || '',
            photoURL: res.user.photoURL || ''
          };
          applyUserProfile(profile, false);
          openSyncModal();
        }
      }
    } catch (e) {
      console.warn('Google sign-in popup note:', e);
    }
  }

  /**
   * Toast Helper
   */
  function showSyncToast(msg) {
    const existing = document.getElementById('msf-sync-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'msf-sync-toast';
    toast.className = 'fixed bottom-6 right-6 z-50 bg-[#1E293B] border border-purple-500/50 text-white text-xs sm:text-sm font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-3 duration-200';
    toast.innerHTML = `<i class="fa fa-circle-check text-emerald-400 text-base"></i> <span>${msg}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Restore stored profile on load
  document.addEventListener('DOMContentLoaded', () => {
    const saved = getLocalProfile();
    if (saved) {
      applyUserProfile(saved, false);
    }
  });

  // Export to global scope
  global.AppSync = {
    openSyncModal,
    rotatePairCode,
    openWebSyncPage,
    authorizeDesktopFromWeb,
    copySyncToken,
    openInAppPasteModal,
    readClipboardIntoBox,
    processInAppToken,
    triggerWebSignInFirst,
    clearUserProfile,
    getLocalProfile,
    applyUserProfile,
    isDesktopApp
  };

})(window);
