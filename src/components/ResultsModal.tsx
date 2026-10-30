import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Question, UserAnswerMap, ExamResult } from '../types/exam';
import { parseExplanation } from '../utils/scienceFormatter';
import { Award, CheckCircle2, XCircle, MinusCircle, Clock, RotateCcw, Home, BookOpen, Filter, Sparkles, BookBookmark, Lightbulb } from 'lucide-react';

interface ResultsModalProps {
  questions: Question[];
  userAnswers: UserAnswerMap;
  examResult: ExamResult;
  onRetake: () => void;
  onBackToCatalog: () => void;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  questions,
  userAnswers,
  examResult,
  onRetake,
  onBackToCatalog
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'correct' | 'wrong' | 'unattempted'>('all');

  useEffect(() => {
    // Trigger confetti on high scores (>60%)
    if (examResult.percentage >= 50) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [examResult]);

  // Filter questions for review
  const filteredQuestions = questions.filter((q) => {
    const userAns = userAnswers[q.id];
    if (filterMode === 'correct') return userAns === q.ans;
    if (filterMode === 'wrong') return userAns !== undefined && userAns !== q.ans;
    if (filterMode === 'unattempted') return userAns === undefined;
    return true;
  });

  const getMeritBadge = (pct: number) => {
    if (pct >= 80) return { label: 'Outstanding (Top DMC Standard)', color: 'text-amber-400 border-amber-500/40 bg-amber-950/40' };
    if (pct >= 60) return { label: 'Passed (Competitive Rank)', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40' };
    if (pct >= 40) return { label: 'Good Effort (Review Concept Boxes)', color: 'text-purple-400 border-purple-500/40 bg-purple-950/40' };
    return { label: 'Needs Practice (Repeat Chapter Test)', color: 'text-rose-400 border-rose-500/40 bg-rose-950/40' };
  };

  const merit = getMeritBadge(examResult.percentage);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6 animate-fadeIn">
      
      {/* Top Results Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-purple-950 to-slate-950 border border-purple-500/30 p-6 sm:p-8 shadow-2xl text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Exam Complete & Evaluated
        </div>

        <h2 className="text-xl sm:text-3xl font-black text-white font-siliguri leading-snug">
          {examResult.topicName}
        </h2>

        {/* Merit Grade Badge */}
        <div className={`inline-block px-4 py-1.5 rounded-xl border text-xs font-bold ${merit.color}`}>
          {merit.label}
        </div>

        {/* Score Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 text-center">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {examResult.score}
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold mt-1">
              Final Marks (out of {examResult.totalQuestions})
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 text-center">
            <div className="text-2xl sm:text-3xl font-black text-purple-400 font-mono">
              {examResult.percentage}%
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold mt-1">
              Accuracy Rate
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 text-center">
            <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono flex items-center justify-center gap-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 inline" /> {examResult.correctCount}
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold mt-1">
              Correct (+1)
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 text-center">
            <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono flex items-center justify-center gap-1">
              <XCircle className="w-5 h-5 text-rose-400 inline" /> {examResult.wrongCount}
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold mt-1">
              Wrong (-0.25 Neg)
            </div>
          </div>

        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onRetake}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 flex items-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4 text-purple-400" /> Retake Test
          </button>
          <button
            onClick={onBackToCatalog}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-purple-900/40 transition-all"
          >
            <Home className="w-4 h-4" /> Return to Question Bank
          </button>
        </div>
      </div>

      {/* Answer Key Review Header & Filters */}
      <div className="bg-slate-900 border border-white/10 p-5 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-400" /> In-Depth Solutions & Answer Key ({filteredQuestions.length} Questions)
          </h3>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-white/10 text-xs font-bold">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-xl transition-all ${filterMode === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              All ({questions.length})
            </button>
            <button
              onClick={() => setFilterMode('correct')}
              className={`px-3 py-1.5 rounded-xl transition-all ${filterMode === 'correct' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Correct ({examResult.correctCount})
            </button>
            <button
              onClick={() => setFilterMode('wrong')}
              className={`px-3 py-1.5 rounded-xl transition-all ${filterMode === 'wrong' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Wrong ({examResult.wrongCount})
            </button>
            <button
              onClick={() => setFilterMode('unattempted')}
              className={`px-3 py-1.5 rounded-xl transition-all ${filterMode === 'unattempted' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Unanswered ({examResult.unattemptedCount})
            </button>
          </div>
        </div>

        {/* Questions Detailed List */}
        <div className="space-y-4">
          {filteredQuestions.map((q) => {
            const userAns = userAnswers[q.id];
            const isCorrect = userAns === q.ans;
            const isUnattempted = userAns === undefined;
            const { reference, concept } = parseExplanation(q.exp);

            return (
              <div
                key={q.id}
                className={`p-5 rounded-2xl bg-slate-950/80 border transition-all ${
                  isUnattempted
                    ? 'border-white/10'
                    : isCorrect
                    ? 'border-emerald-500/40 bg-emerald-950/10'
                    : 'border-rose-500/40 bg-rose-950/10'
                }`}
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-800 text-purple-300">
                      #{q.id}
                    </span>
                    <h4 
                      className="text-sm sm:text-base font-bold text-white font-siliguri leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: q.q }}
                    />
                  </div>

                  <span className="flex-shrink-0">
                    {isUnattempted ? (
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <MinusCircle className="w-3.5 h-3.5" /> Unanswered
                      </span>
                    ) : isCorrect ? (
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+1)
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-rose-400 bg-rose-950/80 border border-rose-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Wrong (-0.25)
                      </span>
                    )}
                  </span>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-4">
                  {[
                    { key: 'a', label: '(ক)', text: q.a },
                    { key: 'b', label: '(খ)', text: q.b },
                    { key: 'c', label: '(গ)', text: q.c },
                    { key: 'd', label: '(ঘ)', text: q.d }
                  ].map((opt) => {
                    const isSelected = userAns === opt.key;
                    const isCorrectKey = q.ans === opt.key;

                    let optionStyle = 'bg-slate-900 border-white/5 text-slate-300';
                    if (isCorrectKey) {
                      optionStyle = 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200 font-bold';
                    } else if (isSelected && !isCorrectKey) {
                      optionStyle = 'bg-rose-950/80 border-rose-500/60 text-rose-200 line-through';
                    }

                    return (
                      <div
                        key={opt.key}
                        className={`p-2.5 rounded-xl border flex items-start gap-2 ${optionStyle}`}
                      >
                        <span className="font-bold text-purple-400">{opt.label}</span>
                        <span dangerouslySetInnerHTML={{ __html: opt.text }} />
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Boxes: Cyan Reference & Amber Concept */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  {/* Line 1: রেফারেন্স in Cyan */}
                  <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-start gap-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 flex-shrink-0">
                      <BookBookmark className="w-3 h-3" /> রেফারেন্স
                    </span>
                    <div 
                      className="text-xs sm:text-sm font-semibold text-cyan-100 font-siliguri leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: reference }}
                    />
                  </div>

                  {/* Line 2: কনসেপ্ট in Amber */}
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 flex-shrink-0">
                      <Lightbulb className="w-3 h-3" /> কনসেপ্ট
                    </span>
                    <div 
                      className="text-xs sm:text-sm font-normal text-amber-100 font-siliguri leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: concept }}
                    />
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
