import React from 'react';
import { Sparkles, FilePlus, Trophy, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'catalog' | 'custom' | 'history';
  setActiveTab: (tab: 'catalog' | 'custom' | 'history') => void;
  openLeaderboardModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, openLeaderboardModal }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0F172A]/95 backdrop-blur-lg border-t border-white/10 px-2 py-1 flex items-center justify-around shadow-2xl pb-safe">
      <button
        onClick={() => setActiveTab('catalog')}
        className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-3 py-1 rounded-xl text-[10px] font-bold transition-all ${
          activeTab === 'catalog' ? 'text-purple-400 bg-purple-500/15' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Sparkles className="w-4 h-4" />
        <span className="mt-0.5">Question Bank</span>
      </button>

      <button
        onClick={() => setActiveTab('custom')}
        className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-3 py-1 rounded-xl text-[10px] font-bold transition-all ${
          activeTab === 'custom' ? 'text-purple-400 bg-purple-500/15' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <FilePlus className="w-4 h-4" />
        <span className="mt-0.5">Custom Builder</span>
      </button>

      <button
        onClick={openLeaderboardModal}
        className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-3 py-1 rounded-xl text-[10px] font-bold text-slate-400 hover:text-amber-400 transition-all active:scale-95"
      >
        <Trophy className="w-4 h-4 text-amber-400" />
        <span className="mt-0.5">Merit Board</span>
      </button>
    </div>
  );
};
