import React from 'react';
import { Stethoscope, Sparkles, FilePlus, History, Smartphone, RefreshCw, X, ShieldCheck } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'catalog' | 'custom' | 'history';
  setActiveTab: (tab: 'catalog' | 'custom' | 'history') => void;
  openLeaderboardModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  openLeaderboardModal
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 z-[140] bg-slate-950/70 backdrop-blur-sm lg:hidden animate-fadeIn"
      />

      {/* AI Studio Style Collapsible Left Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-[150] w-72 bg-[#0B132B] border-r border-white/10 shadow-2xl flex flex-col animate-slideRight">
        
        {/* Sidebar Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-tight">AI Studio Console</h2>
              <p className="text-[10px] text-purple-300 font-mono">Medical Secret Files v05.10.08</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 pb-1 font-mono">
            Navigation Menu
          </div>

          <button
            onClick={() => {
              setActiveTab('catalog');
              onClose();
            }}
            className={`w-full px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-3 transition-all ${
              activeTab === 'catalog'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/60'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-300" />
            <span>Question Bank (114 Exams)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('custom');
              onClose();
            }}
            className={`w-full px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-3 transition-all ${
              activeTab === 'custom'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/60'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <FilePlus className="w-4 h-4 text-purple-400" />
            <span>Custom MCQ Builder</span>
          </button>

          <button
            onClick={() => {
              openLeaderboardModal();
              onClose();
            }}
            className="w-full px-4 py-3 rounded-2xl text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-all"
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span>Merit Leaderboard & History</span>
          </button>
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-white/10 bg-slate-950/60 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Firebase Engine
            </span>
            <span className="text-emerald-400 font-bold">Connected</span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            hazera-taju-degree-college.firebaseapp.com
          </p>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;
