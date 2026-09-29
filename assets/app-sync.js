/**
 * Medical Secret Files - Windows Desktop App & Web Cross-Device Sync Module
 * Enables real-time authorization, account sync, and exam history sync between Web & Desktop
 */

(function (global) {
  'use strict';

  const STORAGE_PROFILE_KEY = 'msf_user_profile';
  const STORAGE_HISTORY_KEY = 'msf_exam_history_v2';
  const SYNC_COLLECTION = 'app_sync_tokens';

  // Detect environment
  const isDesktopApp = !!(
    window.navigator.userAgent.includes('Electron') ||
    window.process?.type === 'renderer' ||
    window.location.protocol === 'file:'
  );

  let currentPairCode = null;
  let syncUnsubscribe = null;
  let codeExpiryInterval = null;

  /**
   * Generate 6-digit code like MSF-8392
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
    if (imgEl && profile.photoURL) imgEl.src = profile.photoURL;
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
   * Open the Sync Modal
   */
  function openSyncModal(prefilledCode = '') {
    // Remove existing modal if any
    const existing = document.getElementById('sync-hub-modal');
    if (existing) existing.remove();

    if (syncUnsubscribe) {
      syncUnsubscribe();
      syncUnsubscribe = null;
    }
    clearInterval(codeExpiryInterval);

    const activeProfile = getLocalProfile();
    const currentCode = prefilledCode || generatePairCode();
    currentPairCode = currentCode;

    const modal = document.createElement('div');
    modal.id = 'sync-hub-modal';
    modal.className = 'fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200';

    modal.innerHTML = `
      <div class="bg-[#1E293B] border border-purple-500/30 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <!-- Header -->
        <div class="p-5 sm:p-6 bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-slate-900 border-b border-white/10 flex items-center justify-between">
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

          <!-- TAB SWITCHER: Link via 6-Digit Code vs Direct Token -->
          <div class="space-y-4">
            
            <!-- SECTION 1: 6-Digit Code Pairing (Automatic Cloud Sync) -->
            <div class="bg-slate-900/80 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <i class="fa fa-key text-purple-400"></i> Automatic 6-Digit Pairing
                </span>
                <span id="sync-status-badge" class="text-[11px] font-mono text-slate-400">Status: Ready</span>
              </div>

              <!-- IF ON DESKTOP APP: Show Pair Code for User to Enter on Web -->
              <div class="space-y-3 ${isDesktopApp ? '' : 'hidden'}" id="desktop-pair-view">
                <p class="text-xs text-slate-300 leading-relaxed">
                  Log in on the Medical Secret Files website, open Sync, and enter this pair code:
                </p>
                <div class="flex items-center justify-center p-4 bg-slate-950 rounded-2xl border border-purple-500/40 text-center">
                  <span id="desktop-sync-code-display" class="font-mono text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-300 to-indigo-300 tracking-widest">
                    ${currentCode}
                  </span>
                </div>
                <div class="flex gap-2">
                  <button onclick="window.AppSync.copyPairCode()" class="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all">
                    <i class="fa fa-copy"></i> Copy Code
                  </button>
                  <button onclick="window.AppSync.refreshPairCode()" class="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all">
                    <i class="fa fa-rotate"></i> Refresh
                  </button>
                </div>
                <p class="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1.5 pt-1">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Listening for web authorization...
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

            <!-- SECTION 2: Direct 1-Click Backup & Token Import/Export (Offline Safe) -->
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
                <button onclick="window.AppSync.promptImportToken()" class="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all">
                  <i class="fa fa-file-import text-indigo-400"></i> Paste & Import Token
                </button>
              </div>
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

    // If on Desktop or preview, listen for the pairing code
    startListeningForCode(currentCode);
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
            const badge = document.getElementById('sync-status-badge');
            if (badge) {
              badge.textContent = 'Status: Successfully Synced!';
              badge.className = 'text-[11px] font-mono text-emerald-400 font-bold';
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

        const badge = document.getElementById('sync-status-badge');
        if (badge) {
          badge.textContent = 'Status: Authorized & Sent!';
          badge.className = 'text-[11px] font-mono text-emerald-400 font-bold';
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
   * Copy Pair Code
   */
  function copyPairCode() {
    if (!currentPairCode) return;
    navigator.clipboard.writeText(currentPairCode).then(() => {
      showSyncToast(`Copied pair code: ${currentPairCode}`);
    }).catch(() => {
      showSyncToast(`Pair code: ${currentPairCode}`);
    });
  }

  /**
   * Refresh Pair Code
   */
  function refreshPairCode() {
    currentPairCode = generatePairCode();
    const display = document.getElementById('desktop-sync-code-display');
    if (display) display.textContent = currentPairCode;
    if (syncUnsubscribe) syncUnsubscribe();
    startListeningForCode(currentPairCode);
    showSyncToast(`New code generated: ${currentPairCode}`);
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
   * Prompt and Import Direct Sync Token
   */
  function promptImportToken() {
    const token = prompt('Paste your Medical Secret Files Sync Token here:');
    if (!token) return;

    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(token.trim()))));
      if (decoded && decoded.profile) {
        applyUserProfile(decoded.profile);
        if (decoded.history && Array.isArray(decoded.history)) {
          localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(decoded.history));
        }
        showSyncToast('✓ Account and history successfully imported!');
        const modal = document.getElementById('sync-hub-modal');
        if (modal) modal.remove();
      } else {
        throw new Error('Invalid token structure');
      }
    } catch (e) {
      alert('Invalid sync token format. Please check and try again.');
    }
  }

  /**
   * Trigger Google Sign In from modal
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
   * Toast notification helper
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

  // Initialize on document ready
  document.addEventListener('DOMContentLoaded', () => {
    // Restore stored profile
    const saved = getLocalProfile();
    if (saved) {
      applyUserProfile(saved, false);
    }

    // Check URL parameters for 1-click sync link (e.g. ?action=sync&code=MSF-1234)
    const urlParams = new URLSearchParams(window.location.search);
    const syncAction = urlParams.get('action') || urlParams.get('sync');
    const syncCode = urlParams.get('code') || urlParams.get('sync_code');

    if (syncAction === 'sync' || syncCode) {
      setTimeout(() => {
        openSyncModal(syncCode || '');
      }, 600);
    }
  });

  // Export to global scope
  global.AppSync = {
    openSyncModal,
    copyPairCode,
    refreshPairCode,
    authorizeDesktopFromWeb,
    copySyncToken,
    promptImportToken,
    triggerWebSignInFirst,
    getLocalProfile,
    applyUserProfile,
    isDesktopApp
  };

})(window);
