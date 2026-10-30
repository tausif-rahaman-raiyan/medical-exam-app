import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, History, LogIn, LogOut, FilePlus, Sparkles, ChevronDown, RefreshCw, CheckCircle, ArrowDownCircle, ShieldCheck, Maximize2, Minimize2, Type, Smartphone } from 'lucide-react';

interface HeaderProps {
  activeTab: 'catalog' | 'custom' | 'history';
  setActiveTab: (tab: 'catalog' | 'custom' | 'history') => void;
  openLeaderboardModal: () => void;
}

const CURRENT_VERSION = '05.10.08';
const GITHUB_REPO = 'tausif-rahaman-raiyan/medical-exam-app';

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, openLeaderboardModal }) => {
  const { user, loginAsGoogleUser, logout, updateProfileName, examHistory, isGmailUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user.displayName);
  
  // Smooth scroll hide/reveal state
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Explanation font size state (Default 17px)
  const [explanationFontSize, setExplanationFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('msf_explanation_font_size');
      if (saved) return parseInt(saved, 10);
    } catch {}
    return 17;
  });

  // Auto-update checker states
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{
    available: boolean;
    latestVer: string;
    checked: boolean;
    releaseUrl?: string;
  }>({
    available: false,
    latestVer: CURRENT_VERSION,
    checked: false
  });

  // Apply explanation font size to document root
  useEffect(() => {
    document.documentElement.style.setProperty('--concept-font-size', `${explanationFontSize}px`);
    document.documentElement.style.setProperty('--reference-font-size', `${Math.max(13, explanationFontSize - 1)}px`);
    localStorage.setItem('msf_explanation_font_size', String(explanationFontSize));
  }, [explanationFontSize]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Smooth scroll listener: hide header smoothly on scroll down, show on scroll up or at top
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= 25) {
        setHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setHeaderVisible(false);
        setDropdownOpen(false);
      } else if (currentScrollY < lastScrollY) {
        setHeaderVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileName(nameInput);
    setEditingName(false);
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    try {
      let latest = CURRENT_VERSION;
      let url = `https://github.com/${GITHUB_REPO}/releases`;

      try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
          headers: { 'Accept': 'application/vnd.github.v3+json' }
        });
        if (res.ok) {
          const data = await res.json();
          latest = (data.tag_name || data.name || '').replace(/^v/i, '').trim();
          if (data.html_url) url = data.html_url;
        }
      } catch {}

      if (latest === CURRENT_VERSION) {
        try {
          const pkgRes = await fetch(`https://raw.githubusercontent.com/${GITHUB_REPO}/main/package.json`);
          if (pkgRes.ok) {
            const pkgData = await pkgRes.json();
            if (pkgData.version && pkgData.version !== CURRENT_VERSION) {
              latest = pkgData.version;
            }
          }
        } catch {}
      }

      const isNewer = compareVersions(latest, CURRENT_VERSION) > 0;
      setUpdateInfo({
        available: isNewer,
        latestVer: latest,
        checked: true,
        releaseUrl: url
      });
    } catch {
      setUpdateInfo({
        available: false,
        latestVer: CURRENT_VERSION,
        checked: true
      });
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleSimulateUpdate = () => {
    const parts = CURRENT_VERSION.split('.').map(n => parseInt(n, 10));
    parts[2] = (parts[2] + 1) % 100;
    const simVer = parts.map(n => String(n).padStart(2, '0')).join('.');
    setUpdateInfo({
      available: true,
      latestVer: simVer,
      checked: true,
      releaseUrl: `https://github.com/${GITHUB_REPO}/releases`
    });
  };

  const handleApplyUpdate = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(k => caches.delete(k)));
      } catch {}
    }
    if ('serviceWorker' in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          await reg.unregister();
        }
      } catch {}
    }
    alert(`Applying Medical Secret Files update (v${updateInfo.latestVer}). Refreshing to new version...`);
    window.location.reload();
  };

  const handleSyncToApps = () => {
    const syncPayload = {
      profile: user,
      historyCount: examHistory.length,
      syncedAt: new Date().toISOString(),
      version: CURRENT_VERSION
    };
    try {
      localStorage.setItem('msf_desktop_sync_bundle', JSON.stringify(syncPayload));
      // Try BroadcastChannel for Electron / Windows App
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('msf_account_sync');
        bc.postMessage(syncPayload);
      }
      navigator.clipboard?.writeText(JSON.stringify(syncPayload));
      alert(`Account Synced!\nGmail Account: ${user.email}\nLogged in as: ${user.displayName}\nData pushed to desktop/apps channel & copied to clipboard.`);
    } catch {
      alert(`Sync completed for ${user.email}.`);
    }
  };

  function compareVersions(v1: string, v2: string) {
    const p1 = v1.replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
    const p2 = v2.replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
      const a = p1[i] || 0;
      const b = p2[i] || 0;
      if (a > b) return 1;
      if (a < b) return -1;
    }
    return 0;
  }

  // If in fullscreen mode, completely hide the upper bar as requested
  if (isFullscreen) {
    return (
      <div className="fixed top-2 right-2 z-[200] opacity-30 hover:opacity-100 transition-opacity">
        <button
          onClick={toggleFullScreen}
          title="Exit Fullscreen"
          className="p-2 rounded-xl bg-slate-900/90 border border-white/20 text-slate-300 hover:text-white"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <header className={`sticky top-0 z-50 bg-[#0F172A]/95 backdrop-blur-md border-b border-white/10 px-4 py-3 shadow-xl transition-all duration-400 ease-out ${
      headerVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo & Version Info */}
        <button 
          onClick={() => setActiveTab('catalog')}
          className="flex items-center gap-3 text-left group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/40 group-hover:scale-105 transition-transform">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5 leading-none">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-fuchsia-300 to-indigo-300">
                Medical Secret Files
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                v{CURRENT_VERSION}
              </span>
            </h1>
            <p className="text-[11px] text-purple-300/80 font-medium mt-0.5 font-mono">
              Precision Medical Admission Engine
            </p>
          </div>
        </button>

        {/* Navigation Tabs (Desktop) - Only Question Bank & Custom MCQ Builder */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'catalog'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Question Bank (114 Exams)
          </button>
          
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'custom'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <FilePlus className="w-4 h-4 text-purple-400" /> Custom MCQ Builder
          </button>
        </nav>

        {/* Right User Actions & Profile */}
        <div className="relative flex items-center gap-2 sm:gap-3">
          
          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullScreen}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-sm"
            title="Toggle Fullscreen (Hides top bar for full focus)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Quick Results Trigger (Leaderboard / My Results) */}
          <button
            onClick={openLeaderboardModal}
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-xs font-bold text-slate-200 flex items-center gap-2 transition-all shadow-sm"
            title="View Test History & Merit Board"
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-purple-300">
              {examHistory.length > 0 ? `${examHistory.length} Exams` : 'Results'}
            </span>
          </button>

          {/* Profile Dropdown Toggle */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 transition-all focus:outline-none"
          >
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover ring-2 ring-purple-500/50"
            />
            <span className="hidden lg:inline text-xs font-bold text-slate-200 max-w-[120px] truncate">
              {user.displayName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Profile Menu Dropdown */}
          {dropdownOpen && (
            <div 
              className="absolute right-0 top-12 w-80 bg-[#1E293B] border border-white/10 rounded-2xl p-4 shadow-2xl z-50 space-y-3 animate-fadeIn"
            >
              {/* Authenticated User Details */}
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-purple-500"
                />
                <div className="min-w-0 flex-1">
                  {editingName ? (
                    <form onSubmit={handleSaveName} className="flex items-center gap-1">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full bg-slate-950 border border-purple-500 rounded px-2 py-1 text-xs text-white"
                        autoFocus
                      />
                      <button type="submit" className="text-xs text-purple-400 font-bold px-1">
                        Save
                      </button>
                    </form>
                  ) : (
                    <div 
                      onClick={() => { setEditingName(true); setNameInput(user.displayName); }}
                      className="cursor-pointer group"
                    >
                      <h3 className="text-sm font-bold text-white group-hover:text-purple-400 truncate">
                        {user.displayName}
                      </h3>
                      <p className="text-[11px] text-purple-300 font-semibold truncate font-siliguri">
                        {user.displayName}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate font-mono">
                        {user.email}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-2 text-center bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
                <div>
                  <div className="text-xs font-black text-purple-400 font-mono">{examHistory.length}</div>
                  <div className="text-[9px] text-slate-400 uppercase font-semibold">Exams</div>
                </div>
                <div>
                  <div className="text-xs font-black text-emerald-400 font-mono">{user.avgScore}</div>
                  <div className="text-[9px] text-slate-400 uppercase font-semibold">Avg Score</div>
                </div>
                <div>
                  <div className="text-xs font-black text-amber-400 font-mono">{user.highestScore}</div>
                  <div className="text-[9px] text-slate-400 uppercase font-semibold">Best</div>
                </div>
              </div>

              {/* Interactive Explanation & Concept Font Size Selector */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-white/10 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1 font-siliguri">
                    <Type className="w-3.5 h-3.5 text-purple-400" /> ব্যাখ্যা ও কনসেপ্ট সাইজ:
                  </span>
                  <span className="text-[10px] font-mono text-purple-300 font-bold bg-purple-950 px-2 py-0.5 rounded-md border border-purple-800">
                    {explanationFontSize}px
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  {[13, 15, 17, 19].map((size) => (
                    <button
                      key={size}
                      onClick={() => setExplanationFontSize(size)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold font-mono transition-all border ${
                        explanationFontSize === size
                          ? 'bg-purple-600 text-white border-purple-400 shadow-md ring-2 ring-purple-400/40'
                          : 'bg-slate-800 text-slate-400 border-white/5 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {size}px
                    </button>
                  ))}
                </div>
              </div>

              {/* Gmail Sync to Apps Logic */}
              <button
                onClick={handleSyncToApps}
                className="w-full px-3 py-2 rounded-xl bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center justify-between transition-all"
                title="Sync Gmail Account & Test History to Windows App & Devices"
              >
                <span className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Sync Account to Apps</span>
                </span>
                <span className="text-[10px] font-mono bg-indigo-900/80 px-2 py-0.5 rounded text-indigo-200">Push</span>
              </button>

              {/* GitHub Auto-Update Section */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> App Version:
                  </span>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300">
                    v{CURRENT_VERSION}
                  </span>
                </div>

                {updateInfo.checked && updateInfo.available ? (
                  <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-[11px] text-emerald-200 space-y-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Update to v{updateInfo.latestVer}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300">New high-yield question sets and UI enhancements are ready.</p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handleApplyUpdate}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md w-full justify-center"
                      >
                        <ArrowDownCircle className="w-3.5 h-3.5" /> Update & Replace Now
                      </button>
                    </div>
                  </div>
                ) : updateInfo.checked && !updateInfo.available ? (
                  <div className="flex items-center justify-between text-[11px] text-emerald-300 bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/20">
                    <span className="flex items-center gap-1 font-bold">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Up to date
                    </span>
                    <button
                      onClick={handleSimulateUpdate}
                      className="text-[10px] text-purple-400 hover:underline"
                    >
                      Simulate Update
                    </button>
                  </div>
                ) : null}

                <button
                  onClick={handleCheckUpdate}
                  disabled={checkingUpdate}
                  className="w-full py-1.5 px-3 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${checkingUpdate ? 'animate-spin' : ''}`} />
                  <span>{checkingUpdate ? 'Checking GitHub...' : 'Check for Updates'}</span>
                </button>
              </div>

              {/* Actions */}
              <div className="space-y-1.5 pt-1">
                {!isGmailUser ? (
                  <button
                    onClick={async () => {
                      await loginAsGoogleUser();
                      setDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:from-purple-500 hover:to-indigo-500 transition-all active:scale-95"
                  >
                    <LogIn className="w-4 h-4" /> Sign in with Google
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};

export default Header;
