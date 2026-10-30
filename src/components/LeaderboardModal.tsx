import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { subjectData } from '../data/subjectData';
import { Award, History, X, Trash2, Calendar, Clock, Trophy, ChevronRight } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const { examHistory, clearHistory, user } = useAuth();
  const [viewMode, setViewMode] = useState<'personal' | 'global'>('personal');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');

  if (!isOpen) return null;

  // Filter results
  let filteredResults = examHistory;
  if (selectedTopic) {
    filteredResults = filteredResults.filter(r => r.topicName.includes(selectedTopic));
  } else if (selectedSubject) {
    const sub = subjectData.find(s => s.cat === selectedSubject);
    if (sub) {
      const topicNames = sub.items.map(i => i.t);
      filteredResults = filteredResults.filter(r => topicNames.some(t => r.topicName.includes(t)));
    }
  }

  // Simulated Global Leaderboard entries if in global mode
  const globalLeaderboardEntries = [
    { name: 'Dr. S. Rahman (DMC)', score: 96.25, topic: 'Medical Admission Model Test 01', attempt: 1, date: '2026-10-28T14:20:00' },
    { name: 'Tausif Rahaman Raiyan', score: 94.50, topic: 'কোষ ও এর গঠন', attempt: 1, date: '2026-10-29T10:15:00' },
    { name: 'Ayesha Siddiqua (SSMC)', score: 92.75, topic: 'জৈব রসায়ন', attempt: 2, date: '2026-10-27T18:40:00' },
    { name: 'Tanvir Hossain', score: 91.00, topic: 'রক্ত ও সংবহন', attempt: 1, date: '2026-10-29T16:05:00' },
    { name: user.displayName, score: user.highestScore || 88.5, topic: 'জীববিজ্ঞান পূর্ণাঙ্গ ফাইনাল', attempt: 1, date: '2026-10-30T08:00:00' }
  ].sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-white/10 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Leaderboard & Exam Results</h3>
              <p className="text-xs text-slate-400">Review your personal score logs and merit rankings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher & Filters */}
        <div className="p-4 bg-slate-900/80 border-b border-white/5 space-y-3">
          <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setViewMode('personal')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                viewMode === 'personal'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" /> My Exam History ({examHistory.length})
            </button>
            <button
              onClick={() => setViewMode('global')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                viewMode === 'global'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-400" /> Global Merit Board
            </button>
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedTopic('');
              }}
              className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">All Subjects</option>
              {subjectData.map(s => (
                <option key={s.cat} value={s.cat}>{s.cat}</option>
              ))}
            </select>

            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">All Chapter Topics</option>
              {selectedSubject && subjectData.find(s => s.cat === selectedSubject)?.items.map(item => (
                <option key={item.c} value={item.t}>{item.t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {viewMode === 'personal' ? (
            filteredResults.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <History className="w-10 h-10 opacity-30 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-400">No exams taken yet</p>
                <p className="text-xs text-slate-500 mt-1">Start an exam from the question bank to track your progress</p>
              </div>
            ) : (
              filteredResults.map((res) => (
                <div
                  key={res.id}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 flex items-center justify-between gap-4 hover:border-purple-500/40 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-purple-300 font-siliguri truncate">
                      {res.topicName}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 mt-1 font-mono">
                      <span className="bg-purple-950/80 border border-purple-600/40 px-2 py-0.5 rounded text-purple-200">
                        Attempt #{res.attempt || 1}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {new Date(res.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        {Math.floor(res.timeSpentSeconds / 60)}m {res.timeSpentSeconds % 60}s
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-black text-emerald-400 font-mono">
                      {res.score} <span className="text-xs text-slate-500 font-normal">/ {res.totalQuestions}</span>
                    </div>
                    <div className="text-[10px] font-bold text-purple-400 uppercase">
                      Accuracy: {res.percentage}%
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            /* Global Rankings */
            globalLeaderboardEntries.map((entry, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/5 flex items-center justify-between gap-3 hover:border-amber-500/40 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs font-mono flex-shrink-0 ${
                    idx === 0 ? 'bg-amber-500 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-300'
                  }`}>
                    #{idx + 1}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{entry.name}</h4>
                    <p className="text-[10px] text-slate-400 font-siliguri truncate">{entry.topic}</p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-base font-black text-emerald-400 font-mono">{entry.score}</div>
                  <div className="text-[9px] text-slate-500 uppercase font-semibold">Merit Score</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {viewMode === 'personal' && examHistory.length > 0 && (
          <div className="p-3 bg-slate-950 border-t border-white/10 flex justify-between items-center text-xs">
            <span className="text-slate-400 text-[11px]">
              Total Exams Logged: <strong className="text-white font-mono">{examHistory.length}</strong>
            </span>
            <button
              onClick={clearHistory}
              className="px-3 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-[11px] font-bold flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear History
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
