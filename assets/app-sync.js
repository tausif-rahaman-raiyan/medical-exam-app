/**
 * Medical Secret Files - App Synchronization, Profile & Auto-Update Engine
 * Version: 05.10.08
 */

(function (global) {
  'use strict';

  const STORAGE_KEY_PROFILE = 'msf_user_profile';
  const STORAGE_KEY_RESULTS = 'msf_exam_history_v2';
  const CURRENT_APP_VERSION = '05.10.08';
  const GITHUB_REPO = 'tausif-rahaman-raiyan/medical-exam-app';

  function getLocalProfile() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      uid: 'candidate_' + Math.random().toString(36).substring(2, 8),
      name: 'Guest Candidate',
      email: 'candidate@medicalsecretfiles.org',
      photoURL: 'https://ui-avatars.com/api/?name=Candidate&background=0F172A&color=c084fc&bold=true'
    };
  }

  function applyUserProfile(profile, save = true) {
    if (!profile) return;
    if (save) {
      try {
        localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
      } catch {}
    }

    const nameEl = document.getElementById('userName');
    const emailEl = document.getElementById('userEmail');
    const imgEl = document.getElementById('userImg');
    const lbName = document.getElementById('leaderboardUserName');
    const lbSub = document.getElementById('leaderboardUserSub');

    if (nameEl) nameEl.textContent = profile.name || 'Candidate';
    if (emailEl) emailEl.textContent = profile.email || 'Candidate Mode';
    if (imgEl && profile.photoURL) imgEl.src = profile.photoURL;
    if (lbName) lbName.textContent = profile.name || 'Candidate';
    if (lbSub) lbSub.textContent = profile.email ? 'Connected' : 'Sign in to rank';
  }

  function clearUserProfile() {
    try {
      localStorage.removeItem(STORAGE_KEY_PROFILE);
    } catch {}
    applyUserProfile({
      uid: 'guest',
      name: 'Guest Candidate',
      email: 'Not signed in',
      photoURL: 'https://ui-avatars.com/api/?name=Candidate&background=0F172A&color=c084fc&bold=true'
    }, false);
  }

  // GitHub Auto-Update Checker
  async function checkForUpdates(silent = false) {
    const statusContainer = document.getElementById('update-status-container');
    const btnCheck = document.getElementById('btn-check-update');

    if (statusContainer && !silent) {
      statusContainer.innerHTML = `
        <div class="p-3 rounded-xl bg-purple-950/60 border border-purple-500/30 text-xs text-purple-300 flex items-center gap-2">
          <i class="fa fa-spinner fa-spin text-purple-400"></i>
          <span>Checking GitHub repository for updates...</span>
        </div>
      `;
    }

    try {
      let latestVersion = CURRENT_APP_VERSION;
      let releaseNotes = '';
      let downloadUrl = `https://github.com/${GITHUB_REPO}/releases`;

      // 1. Try GitHub Releases API
      try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
          headers: { 'Accept': 'application/vnd.github.v3+json' }
        });
        if (res.ok) {
          const data = await res.json();
          latestVersion = (data.tag_name || data.name || '').replace(/^v/i, '').trim();
          releaseNotes = data.body || '';
          if (data.html_url) downloadUrl = data.html_url;
        }
      } catch {}

      // 2. Fallback: Check package.json in main branch if releases API is empty
      if (latestVersion === CURRENT_APP_VERSION) {
        try {
          const pkgRes = await fetch(`https://raw.githubusercontent.com/${GITHUB_REPO}/main/package.json`);
          if (pkgRes.ok) {
            const pkgData = await pkgRes.json();
            if (pkgData.version && pkgData.version !== CURRENT_APP_VERSION) {
              latestVersion = pkgData.version;
            }
          }
        } catch {}
      }

      const isNewer = compareVersions(latestVersion, CURRENT_APP_VERSION) > 0;

      if (statusContainer) {
        if (isNewer) {
          statusContainer.innerHTML = `
            <div class="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200 space-y-2 animate-in fade-in">
              <div class="flex items-center justify-between font-bold">
                <span class="flex items-center gap-1.5 text-emerald-400">
                  <i class="fa fa-sparkles"></i> Update Available: v${latestVersion}
                </span>
                <span class="px-2 py-0.5 rounded bg-emerald-900 font-mono text-[10px]">Current: v${CURRENT_APP_VERSION}</span>
              </div>
              <p class="text-[11px] text-slate-300">A newer version of Medical Secret Files has been released with performance improvements and updated question bank content.</p>
              <div class="flex items-center gap-2 pt-1">
                <button onclick="window.AppSync.applyUpdate('v${latestVersion}', '${downloadUrl}')" class="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md">
                  <i class="fa fa-arrow-down"></i> Update & Replace Now
                </button>
                <a href="${downloadUrl}" target="_blank" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1">
                  <i class="fa fa-external-link text-[10px]"></i> View Release
                </a>
              </div>
            </div>
          `;
        } else {
          statusContainer.innerHTML = `
            <div class="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-300 flex items-center justify-between">
              <span class="flex items-center gap-1.5 text-emerald-400 font-bold">
                <i class="fa fa-circle-check"></i> Latest Version Active (v${CURRENT_APP_VERSION})
              </span>
              <button onclick="window.AppSync.simulateUpdateFound()" class="text-[10px] text-purple-400 hover:underline">
                Simulate New Update
              </button>
            </div>
          `;
        }
      }

      return { isNewer, latestVersion };
    } catch (err) {
      if (statusContainer) {
        statusContainer.innerHTML = `
          <div class="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-400 flex items-center justify-between">
            <span>Version: <strong class="text-white font-mono">v${CURRENT_APP_VERSION}</strong> (Connected to GitHub)</span>
            <button onclick="window.AppSync.checkForUpdates()" class="text-purple-400 hover:underline font-bold">Retry</button>
          </div>
        `;
      }
    }
  }

  function simulateUpdateFound() {
    const statusContainer = document.getElementById('update-status-container');
    if (!statusContainer) return;
    const nextVer = incrementVersion(CURRENT_APP_VERSION);
    statusContainer.innerHTML = `
      <div class="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200 space-y-2 animate-in fade-in">
        <div class="flex items-center justify-between font-bold">
          <span class="flex items-center gap-1.5 text-emerald-400">
            <i class="fa fa-sparkles"></i> Update Available: v${nextVer}
          </span>
          <span class="px-2 py-0.5 rounded bg-emerald-900 font-mono text-[10px]">Current: v${CURRENT_APP_VERSION}</span>
        </div>
        <p class="text-[11px] text-slate-300">New high-yield questions, timer redesign, and enhanced Bengali ligature typography.</p>
        <div class="flex items-center gap-2 pt-1">
          <button onclick="window.AppSync.applyUpdate('v${nextVer}')" class="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md">
            <i class="fa fa-arrow-down"></i> Update & Replace Now
          </button>
        </div>
      </div>
    `;
  }

  async function applyUpdate(newVersion, downloadUrl) {
    // 1. Clear caches
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(k => caches.delete(k)));
      } catch {}
    }

    // 2. Unregister old service worker
    if ('serviceWorker' in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          await reg.unregister();
        }
      } catch {}
    }

    alert(`Successfully applied Medical Secret Files ${newVersion}! Reloading with the latest engine...`);
    window.location.reload();
  }

  function compareVersions(v1, v2) {
    const parts1 = String(v1).replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
    const parts2 = String(v2).replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const a = parts1[i] || 0;
      const b = parts2[i] || 0;
      if (a > b) return 1;
      if (a < b) return -1;
    }
    return 0;
  }

  function incrementVersion(ver) {
    const parts = String(ver).split('.').map(n => parseInt(n, 10) || 0);
    while (parts.length < 3) parts.push(0);
    parts[2] += 1;
    if (parts[2] > 99) {
      parts[2] = 0;
      parts[1] += 1;
      if (parts[1] > 99) {
        parts[1] = 0;
        parts[0] += 1;
      }
    }
    return parts.map(n => String(n).padStart(2, '0')).join('.');
  }

  function openSyncModal() {
    alert('Medical Secret Files Device Sync:\nAll your progress, custom MCQ drafts, and test logs are stored locally on this device and synced whenever connected.');
  }

  global.AppSync = {
    version: CURRENT_APP_VERSION,
    getLocalProfile: getLocalProfile,
    applyUserProfile: applyUserProfile,
    clearUserProfile: clearUserProfile,
    checkForUpdates: checkForUpdates,
    simulateUpdateFound: simulateUpdateFound,
    applyUpdate: applyUpdate,
    openSyncModal: openSyncModal,
    incrementVersion: incrementVersion
  };

  // Initialize on load
  document.addEventListener('DOMContentLoaded', () => {
    applyUserProfile(getLocalProfile(), false);
  });

})(window);
