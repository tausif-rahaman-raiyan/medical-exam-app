import React from 'react';
import { Stethoscope } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-white/10 bg-slate-950/80 py-5 px-4 text-center text-slate-400 text-xs w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-1.5">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <div className="w-6 h-6 rounded-lg bg-purple-600 flex items-center justify-center text-white">
            <Stethoscope className="w-3.5 h-3.5" />
          </div>
          Medical Secret Files
        </div>
        
        <p className="max-w-2xl text-slate-400 text-xs leading-relaxed font-siliguri">
          মেডিকেল ভর্তি পরীক্ষা প্রস্তুতি • ১১৪টি অধ্যায়ভিত্তিক এবং সাবজেক্ট ফাইনাল মডেল টেস্ট • নেগেটিভ মার্কিং (-০.২৫) ও ওএমআর শিট সিমুলেটর
        </p>

        <p className="text-[11px] text-slate-400 font-semibold pt-1">
          Made by <strong className="text-slate-200">Tausif Rahaman Raiyan</strong> • Medical Secret Files <span className="font-mono text-purple-300">v05.10.08</span>
        </p>
        <p className="text-[10px] text-slate-600 font-mono">
          © {new Date().getFullYear()} Medical Secret Files Engine. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
