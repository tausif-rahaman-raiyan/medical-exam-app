import React, { useState } from 'react';
import { ExamItem, Question } from '../types/exam';
import { subjectData } from '../data/subjectData';
import { generateHighYieldQuestions } from '../utils/questionFetcher';
import { Sparkles, Plus, Trash2, Play, Sliders, CheckCircle2 } from 'lucide-react';

interface CustomMcqCreatorProps {
  onStartCustomExam: (exam: ExamItem) => void;
}

export const CustomMcqCreator: React.FC<CustomMcqCreatorProps> = ({ onStartCustomExam }) => {
  const [selectedCat, setSelectedCat] = useState<string>(subjectData[0].cat);
  const [title, setTitle] = useState<string>('Custom Special Medical Mock Test');
  const [duration, setDuration] = useState<number>(30);
  const [qCount, setQCount] = useState<number>(30);
  const [mode, setMode] = useState<'random' | 'manual'>('random');

  // Manual questions builder state
  const [manualQuestions, setManualQuestions] = useState<Question[]>([
    {
      id: 1,
      q: 'নিম্নের কোন অঙ্গাণুটি কোষের শক্তির ঘর (Powerhouse) হিসেবে কাজ করে?',
      a: 'মাইটোকন্ড্রিয়া',
      b: 'গলগি বডি',
      c: 'রাইবোজোম',
      d: 'লাইসোজোম',
      ans: 'a',
      exp: 'রেফারেন্স: কোষ ও এর গঠন। কনসেপ্ট: মাইটোকন্ড্রিয়াতে শ্বসনের প্রধান ধাপগুলো সম্পন্ন হয় তাই একে পাওয়ার হাউস বলে।'
    }
  ]);

  const [newQText, setNewQText] = useState('');
  const [newA, setNewA] = useState('');
  const [newB, setNewB] = useState('');
  const [newC, setNewC] = useState('');
  const [newD, setNewD] = useState('');
  const [newAns, setNewAns] = useState<'a' | 'b' | 'c' | 'd'>('a');
  const [newExp, setNewExp] = useState('');

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText.trim() || !newA.trim() || !newB.trim()) return;

    const newQ: Question = {
      id: manualQuestions.length + 1,
      q: newQText.trim(),
      a: newA.trim(),
      b: newB.trim(),
      c: newC.trim() || 'অন্যান্য',
      d: newD.trim() || 'উপরের সবগুলো',
      ans: newAns,
      exp: newExp.trim() || 'রেফারেন্স: কাস্টম সাধারণ মেডিকেল প্রশ্নব্যাংক।'
    };

    setManualQuestions([...manualQuestions, newQ]);
    setNewQText('');
    setNewA('');
    setNewB('');
    setNewC('');
    setNewD('');
    setNewExp('');
  };

  const handleRemoveQuestion = (id: number) => {
    setManualQuestions(manualQuestions.filter(q => q.id !== id));
  };

  const handleLaunch = () => {
    let finalQuestions: Question[] = [];

    if (mode === 'random') {
      finalQuestions = generateHighYieldQuestions(title, qCount);
    } else {
      if (manualQuestions.length === 0) return;
      finalQuestions = manualQuestions;
    }

    const customExam: ExamItem = {
      t: title,
      c: 'CUST_' + Math.floor(100000 + Math.random() * 900000),
      qCount: finalQuestions.length,
      duration: duration,
      customQuestions: finalQuestions
    };

    onStartCustomExam(customExam);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      
      {/* Title Header */}
      <div className="bg-gradient-to-r from-purple-900/60 via-slate-900 to-indigo-900/60 border border-purple-500/30 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Interactive MCQ Builder
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white font-siliguri">
            নিজের মতো কাস্টম মেডিকেল প্র্যাকটিস টেস্ট তৈরি করুন
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            বিষয়ভিত্তিক চ্যাপ্টার, সময়সীমা এবং প্রশ্নসংখ্যা ঠিক করে সরাসরি ওএমআর ও টাইমার টেস্ট শুরু করুন।
          </p>
        </div>
      </div>

      {/* Test Setup Form */}
      <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl shadow-xl space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
          <Sliders className="w-4 h-4 text-purple-400" /> ১. পরীক্ষার সাধারণ কনফিগারেশন
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">পরীক্ষার শিরোনাম (Test Title)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
              placeholder="e.g. Physics 1st Paper Special Rapid Test"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">বিষয় শ্রেণি (Category)</label>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
            >
              {subjectData.map(s => (
                <option key={s.cat} value={s.cat}>{s.cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">পরীক্ষার সময়সীমা (Duration Mins)</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-slate-950 border border-white/10 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
            >
              <option value={10}>10 Minutes (Quick Quiz)</option>
              <option value={20}>20 Minutes</option>
              <option value={30}>30 Minutes</option>
              <option value={50}>50 Minutes (Standard Medical Exam)</option>
              <option value={60}>60 Minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">পরীক্ষার ধরন (Question Generation)</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('random')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  mode === 'random'
                    ? 'bg-purple-600 text-white border-purple-500'
                    : 'bg-slate-950 text-slate-400 border-white/10'
                }`}
              >
                Auto Generate
              </button>
              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  mode === 'manual'
                    ? 'bg-purple-600 text-white border-purple-500'
                    : 'bg-slate-950 text-slate-400 border-white/10'
                }`}
              >
                Manual Input
              </button>
            </div>
          </div>
        </div>

        {mode === 'random' && (
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">মোট প্রশ্নসংখ্যা: {qCount} MCQs</label>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={qCount}
              onChange={(e) => setQCount(Number(e.target.value))}
              className="w-full accent-purple-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>10 MCQs</span>
              <span>50 MCQs</span>
              <span>100 MCQs</span>
            </div>
          </div>
        )}
      </div>

      {/* Manual Input Builder */}
      {mode === 'manual' && (
        <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <Plus className="w-4 h-4 text-emerald-400" /> ২. ম্যানুয়াল প্রশ্ন যোগ করুন ({manualQuestions.length} added)
          </h3>

          <form onSubmit={handleAddQuestion} className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-white/5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">প্রশ্ন (Question Prompt)</label>
              <input
                type="text"
                value={newQText}
                onChange={(e) => setNewQText(e.target.value)}
                placeholder="e.g. রক্তের অণুপাটিকার স্বাভাবিক আয়ুষ্কাল কতদিন?"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="text"
                  value={newA}
                  onChange={(e) => setNewA(e.target.value)}
                  placeholder="(ক) অপশন A"
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={newB}
                  onChange={(e) => setNewB(e.target.value)}
                  placeholder="(খ) অপশন B"
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={newC}
                  onChange={(e) => setNewC(e.target.value)}
                  placeholder="(গ) অপশন C"
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={newD}
                  onChange={(e) => setNewD(e.target.value)}
                  placeholder="(ঘ) অপশন D"
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">সঠিক উত্তর Key</label>
                <select
                  value={newAns}
                  onChange={(e) => setNewAns(e.target.value as 'a' | 'b' | 'c' | 'd')}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  <option value="a">Option (ক)</option>
                  <option value="b">Option (খ)</option>
                  <option value="c">Option (গ)</option>
                  <option value="d">Option (ঘ)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">কনসেপ্ট ব্যাখ্যা (Explanation)</label>
                <input
                  type="text"
                  value={newExp}
                  onChange={(e) => setNewExp(e.target.value)}
                  placeholder="e.g. রেফারেন্স: রক্ত ও সংবহন। কনসেপ্ট: রক্তের অণুপাটিকা ৫-১০ দিন বাঁচে।"
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add MCQ to Test
            </button>
          </form>

          {/* List of Added Questions */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {manualQuestions.map((q, idx) => (
              <div key={q.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5 text-xs text-slate-200">
                <div className="min-w-0 flex-1 pr-3">
                  <span className="font-bold text-purple-400 mr-1.5">#{idx + 1}</span>
                  <span className="font-siliguri truncate">{q.q}</span>
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px]">Ans: ({q.ans.toUpperCase()})</span>
                </div>
                <button
                  onClick={() => handleRemoveQuestion(q.id)}
                  className="p-1.5 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-400 transition-all flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Start Exam CTA */}
      <div className="text-center pt-2">
        <button
          onClick={handleLaunch}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-wider shadow-2xl shadow-purple-900/50 transition-all transform active:scale-95 inline-flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4 fill-current" /> Start Custom Medical Exam ({mode === 'random' ? qCount : manualQuestions.length} MCQs)
        </button>
      </div>

    </div>
  );
};
