import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, Award, History, User, LogIn, LogOut, FilePlus, Sparkles, ChevronDown } from 'lucide-react';

interface HeaderProps {
  activeTab: 'catalog' | 'custom' | 'history';
  setActiveTab: (tab: 'catalog' | 'custom' | 'history') => void;
  openLeaderboardModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, openLeaderboardModal }) => {
  const { user, loginAsGoogleUser, logout, updateProfileName } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user.displayName);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileName(nameInput);
    setEditingName(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-md border-b border-white/10 px-4 py-3 shadow-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <button 
          onClick={() => setActiveTab('catalog')}
          className="flex items-center gap-3 text-left group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/40 group-hover:scale-105 transition-transform">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5 leading-none">
              Medical Secret Files
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                PRO v3.0
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Precision Medical Admission Test Catalog</p>
          </div>
        </button>

        {/* Navigation Tabs (Desktop) */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'catalog'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Question Bank
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

          <button
            onClick={openLeaderboardModal}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
          >
            <Award className="w-4 h-4 text-amber-400" /> Leaderboard
          </button>
        </nav>

        {/* Right User Actions & Profile */}
        <div className="relative flex items-center gap-2 sm:gap-3">
          
          {/* Quick Results Trigger */}
          <button
            onClick={openLeaderboardModal}
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-xs font-bold text-slate-200 flex items-center gap-2 transition-all"
            title="View Test History & Merit Board"
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline font-mono text-purple-300">
              {user.totalExams > 0 ? `${user.totalExams} Exams` : 'Results'}
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
              className="absolute right-0 top-12 w-72 bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-2xl z-50 space-y-3"
              onMouseLeave={() => setDropdownOpen(false)}
            >
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
                      <h3 className="text-sm font-bold text-white group-hover:text-purple-400 truncate flex items-center gap-1">
                        {user.displayName}
                      </h3>
                      <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-2 text-center bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
                <div>
                  <div className="text-xs font-black text-purple-400 font-mono">{user.totalExams}</div>
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

              {/* Actions */}
              <div className="space-y-1.5 pt-1">
                <button
                  onClick={() => { openLeaderboardModal(); setDropdownOpen(false); }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs font-bold text-slate-200 flex items-center gap-2 transition-all"
                >
                  <Award className="w-4 h-4 text-amber-400" /> View Merit & Results
                </button>

                {user.email.includes('medicalsecretfiles.org') ? (
                  <button
                    onClick={() => { loginAsGoogleUser(); setDropdownOpen(false); }}
                    className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:from-purple-500 hover:to-indigo-500 transition-all"
                  >
                    <LogIn className="w-4 h-4" /> Sign in with Google
                  </button>
                ) : (
                  <button
                    onClick={() => { logout(); setDropdownOpen(false); }}
                    className="w-full px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition-all"
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
