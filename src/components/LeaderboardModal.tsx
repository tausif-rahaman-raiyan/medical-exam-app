import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { subjectData } from '../data/subjectData';
import { X, RotateCcw, CheckCircle2, XCircle, Target, RefreshCw, Sparkles, Calendar } from 'lucide-react';
import { parseExamSessionYear, toBengaliDigits } from '../utils/bengaliFormatter';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const { examHistory, globalHistory, user, isGmailUser } = useAuth();
  const [boardType, setBoardType] = useState<'personal' | 'global'>('personal');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  if (!isOpen) return null;

  // Base list depending on active tab
  const baseList = boardType === 'personal' ? examHistory : (globalHistory.length > 0 ? globalHistory : examHistory);

  // Filter exam results
  let filteredResults = [...baseList];
  if (selectedSubject !== 'all') {
    const sub = subjectData.find(s => s.cat === selectedSubject);
    if (sub) {
      const topicNames = sub.items.map(i => i.t);
      filteredResults = filteredResults.filter(r => topicNames.some(t => r.topicName.includes(t)) || r.category === selectedSubject);
    }
  }

  if (selectedTopic !== 'all') {
    filteredResults = filteredResults.filter(r => r.topicName.includes(selectedTopic));
  }

  const handleResetFilters = () => {
    setSelectedSubject('all');
    setSelectedTopic('all');
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const userInitial = (user.displayName || 'S').charAt(0).toUpperCase();

  // Find subject for a result if missing
  const getSubjectName = (res: any) => {
    if (res.category && res.category !== 'Medical Exam') return res.category;
    for (const sub of subjectData) {
      if (sub.items.some(i => i.t === res.topicName || i.c === res.examCode)) {
        return sub.cat;
      }
    }
    return 'মেডিকেল স্পেশাল';
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden">
      <div className="bg-[#0B132B] border border-white/10 w-full max-w-5xl max-h-[96vh] sm:max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all animate-fadeIn">
        
        {/* Top Header - Sticky with prominent close button */}
        <div className="sticky top-0 z-30 p-4 sm:p-6 bg-[#0B132B]/95 backdrop-blur-md border-b border-white/5 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3 min-w-0">
            {/* User Avatar Circle */}
            {user.photoURL && user.photoURL.trim() !== '' && isGmailUser ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border-2 border-purple-500/60 object-cover shadow-lg shrink-0"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg shadow-purple-950/60 shrink-0">
                {userInitial}
              </div>
            )}

            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-black text-white leading-tight truncate">
                {isGmailUser ? (user.displayName || 'Tausif Rahaman (Raiyan)') : 'Guest Candidate'}
              </h3>
              <p className="text-[11px] sm:text-xs text-purple-300/80 mt-0.5 truncate font-mono">
                {isGmailUser ? user.email : 'Sign in with Gmail to save & rank'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-bold items-center gap-1.5 shadow-sm font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live Firebase
            </span>
            <span className="hidden md:inline-flex px-2.5 py-1 rounded-full bg-slate-900 border border-white/10 text-slate-400 text-xs font-mono font-bold">
              v05.10.08
            </span>

            {/* Prominent High-Contrast Close Button */}
            <button
              onClick={onClose}
              aria-label="Close Merit Board"
              className="w-10 h-10 sm:w-9 sm:h-9 rounded-2xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-200 hover:text-white flex items-center justify-center font-bold transition-all shadow-md active:scale-95 shrink-0"
              title="Close (বন্ধ করুন)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto flex-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
          
          {/* 2 Pills Tab Bar (My Exam History vs Global Leaderboard) */}
          <div className="px-4 sm:px-6 pt-5 pb-2">
            <div className="grid grid-cols-2 bg-[#080D1A] p-1.5 rounded-2xl border border-white/5 shadow-inner">
              <button
                onClick={() => setBoardType('personal')}
                className={`py-3 text-xs sm:text-sm font-black rounded-xl transition-all text-center flex items-center justify-center gap-2 font-siliguri ${
                  boardType === 'personal'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/60'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                My Exam History ({examHistory.length}টি)
              </button>
              <button
                onClick={() => setBoardType('global')}
                className={`py-3 text-xs sm:text-sm font-black rounded-xl transition-all text-center flex items-center justify-center gap-2 font-siliguri ${
                  boardType === 'global'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/60'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Global Leaderboard (মেরিট বোর্ড)
              </button>
            </div>
          </div>

          {/* Filter Controls Row (Subject / Category & Chapter / Exam Paper + Reset) */}
          <div className="px-4 sm:px-6 py-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                SUBJECT / CATEGORY
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedTopic('all');
                }}
                className="w-full bg-[#080D1A] border border-white/10 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-purple-500 font-siliguri shadow-sm"
              >
                <option value="all">All Subjects (সব বিষয়)</option>
                {subjectData.map(s => (
                  <option key={s.cat} value={s.cat}>{s.cat}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                CHAPTER / EXAM PAPER
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full bg-[#080D1A] border border-white/10 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-purple-500 font-siliguri shadow-sm truncate"
              >
                <option value="all">All Chapters (সকল অধ্যায়)</option>
                {selectedSubject !== 'all' 
                  ? subjectData.find(s => s.cat === selectedSubject)?.items.map(item => (
                      <option key={item.c} value={item.t}>{item.t}</option>
                    ))
                  : subjectData.flatMap(s => s.items).slice(0, 30).map(item => (
                      <option key={item.c} value={item.t}>{item.t}</option>
                    ))
                }
              </select>
            </div>

            <div className="sm:col-span-2">
              <button
                onClick={handleResetFilters}
                className="w-full py-3 px-3 rounded-2xl bg-[#080D1A] hover:bg-slate-900 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Counter & Refresh Bar */}
          <div className="px-4 sm:px-6 py-1 flex items-center justify-between text-xs text-slate-400 font-semibold border-b border-white/5 pb-3">
            <span className="font-mono text-slate-300">
              Showing {filteredResults.length} ({toBengaliDigits(filteredResults.length)}টি) of {baseList.length} ({toBengaliDigits(baseList.length)}টি) total attempts
            </span>
            <button
              onClick={handleRefresh}
              className="px-3 py-1.5 rounded-xl bg-[#080D1A] hover:bg-slate-900 border border-purple-500/30 text-purple-300 hover:text-purple-200 font-bold flex items-center gap-1.5 transition-all text-xs shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Exam Attempt Cards Stream */}
          <div className="p-4 sm:p-6 space-y-4">
            {filteredResults.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <RotateCcw className="w-12 h-12 text-purple-400/30 mx-auto" />
                <h4 className="text-base font-bold text-white font-siliguri">কোনো পরীক্ষার রেকর্ড পাওয়া যায়নি</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto font-siliguri">
                  প্রশ্নব্যাংক থেকে যেকোনো ১০০ এমসিকিউ মক টেস্ট সম্পন্ন করলে এখানে আপনার বিস্তারিত স্কোরকার্ড ও র‍্যাংকিং প্রদর্শিত হবে।
                </p>
              </div>
            ) : (
              filteredResults.map((res, index) => {
                const attemptDate = new Date(res.date);
                const formattedDate = attemptDate.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                });
                const formattedTime = attemptDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                });

                const subjectCat = getSubjectName(res);
                const isHigh = res.score >= 50;
                const sessionInfo = parseExamSessionYear(res.topicName);

                return (
                  <div
                    key={res.id || index}
                    className="bg-[#0D182E] border border-white/10 hover:border-purple-500/40 rounded-3xl p-4 sm:p-6 transition-all shadow-xl space-y-4"
                  >
                    {/* Top Line: Attempt Pill, User Badge, Subject Pill, Code & Timestamp */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Attempt Pill */}
                        <span className="px-3 py-1 rounded-full bg-[#162544] border border-purple-500/30 text-purple-200 text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm">
                          <RotateCcw className="w-3 h-3 text-purple-400" /> Attempt #{res.attempt || 1} ({toBengaliDigits(res.attempt || 1)}ম)
                        </span>

                        {/* Candidate Avatar & Verified Name */}
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#162544] border border-white/5 text-xs font-bold text-white shadow-sm">
                          <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-[9px] font-black text-white">
                            T
                          </span>
                          <span className="truncate max-w-[130px] sm:max-w-none">{res.displayName || user.displayName || 'Tausif Rahaman (Raiyan)'}</span>
                          <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-black shrink-0">
                            ✓
                          </span>
                        </div>

                        {/* Subject Pill */}
                        <span className="px-3 py-1 rounded-full bg-purple-950/90 border border-purple-500/40 text-purple-200 text-xs font-bold font-siliguri shadow-sm">
                          {subjectCat}
                        </span>
                      </div>

                      {/* Right: Exam Code & Formatted Date Time */}
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono shrink-0">
                        <span className="text-slate-300">#{res.examCode || '1020325015'}</span>
                        <span>{formattedDate} {formattedTime}</span>
                      </div>
                    </div>

                    {/* Middle Line: Bengali Exam Title on Left with Year Box if applicable */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
                      <div className="flex-1 min-w-0">
                        {sessionInfo.hasYear ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 border border-purple-500/50 text-purple-200 text-xs sm:text-sm font-black bn-year-badge shadow-md shadow-purple-950/40">
                              <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                              <span>সেশন: {sessionInfo.sessionYear}</span>
                            </span>
                            <h3 className="text-lg sm:text-2xl font-black text-white font-siliguri leading-snug break-words">
                              {sessionInfo.displayTitle}
                            </h3>
                          </div>
                        ) : (
                          <h3 className="text-lg sm:text-2xl font-black text-white font-siliguri leading-snug break-words">
                            {res.topicName}
                          </h3>
                        )}
                      </div>

                      {/* NET SCORE Box */}
                      <div className="text-left sm:text-right shrink-0 bg-slate-950/60 p-2.5 sm:p-0 rounded-2xl sm:bg-transparent border border-white/5 sm:border-0">
                        <div className={`text-2xl sm:text-4xl font-black font-mono leading-none ${
                          res.score > 0 ? (isHigh ? 'text-emerald-400' : 'text-amber-400') : res.score < 0 ? 'text-rose-400' : 'text-slate-200'
                        }`}>
                          {res.score} <span className="text-xs sm:text-sm text-slate-400 font-normal">/ {res.totalQuestions || 100}</span>
                        </div>
                        <div className="text-[9px] uppercase font-black tracking-widest text-slate-400 mt-1">
                          NET SCORE
                        </div>
                      </div>
                    </div>

                    {/* Bottom Line: The 4 Metrics Bar as requested */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs font-bold font-mono">
                      {/* Correct */}
                      <div className="p-2.5 rounded-2xl bg-[#091F26] border border-emerald-500/30 flex items-center justify-between px-3.5">
                        <span className="text-emerald-400 flex items-center gap-1.5 text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Correct
                        </span>
                        <span className="text-white font-black text-sm">{res.correctCount || 0}</span>
                      </div>

                      {/* Wrong */}
                      <div className="p-2.5 rounded-2xl bg-[#260F1A] border border-rose-500/30 flex items-center justify-between px-3.5">
                        <span className="text-rose-400 flex items-center gap-1.5 text-xs">
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" /> Wrong
                        </span>
                        <span className="text-white font-black text-sm">{res.wrongCount || 0}</span>
                      </div>

                      {/* Accuracy Rate */}
                      <div className="p-2.5 rounded-2xl bg-[#21123D] border border-purple-500/30 flex items-center justify-between px-3.5">
                        <span className="text-purple-300 flex items-center gap-1.5 text-xs">
                          <Target className="w-4 h-4 text-purple-400 shrink-0" /> Accuracy Rate
                        </span>
                        <span className="text-white font-black text-sm">{res.percentage || 0}%</span>
                      </div>

                      {/* Final Marks (out of 100) */}
                      <div className="p-2.5 rounded-2xl bg-[#162544] border border-indigo-500/30 flex items-center justify-between px-3.5">
                        <span className="text-indigo-300 flex items-center gap-1.5 text-xs">
                          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" /> Final Marks
                        </span>
                        <span className="text-white font-black text-sm">{res.score} / {res.totalQuestions || 100}</span>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default LeaderboardModal;
