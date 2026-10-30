import React, { useState, useEffect, useRef } from 'react';
import { ExamItem, Question, UserAnswerMap, ExamResult } from '../types/exam';
import { loadExamQuestions } from '../utils/questionFetcher';
import { Clock, ArrowLeft, Send, Loader2, Flag, RotateCcw, AlertTriangle, CheckCircle2, ListOrdered, Sparkles, Type } from 'lucide-react';

interface ExamEngineProps {
  examItem: ExamItem;
  onFinishExam: (result: ExamResult, questions: Question[], userAnswers: UserAnswerMap) => void;
  onExit: () => void;
}

export const ExamEngine: React.FC<ExamEngineProps> = ({ examItem, onFinishExam, onExit }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userAnswers, setUserAnswers] = useState<UserAnswerMap>({});
  const [flagged, setFlagged] = useState<{ [id: number]: boolean }>({});
  
  const [timeRemaining, setTimeRemaining] = useState<number>(50 * 60); // seconds
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);

  // Question and options font size for laptop view (13px, 15px, 17px default, 19px)
  const [questionFontSize, setQuestionFontSize] = useState<number>(() => {
    try {
      const s = localStorage.getItem('msf_exam_question_font_size');
      if (s) return parseInt(s, 10);
    } catch {}
    return 17; // standard default for laptop view
  });

  const handleSetQFontSize = (size: number) => {
    setQuestionFontSize(size);
    try {
      localStorage.setItem('msf_exam_question_font_size', String(size));
    } catch {}
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load questions and set countdown duration
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    loadExamQuestions(examItem)
      .then((loadedQuestions) => {
        if (!isMounted) return;
        setQuestions(loadedQuestions);
        setLoading(false);

        // Auto duration: 30 seconds per question or specified duration
        const totalDurationMins = examItem.duration || Math.ceil((loadedQuestions.length * 30) / 60) || 50;
        const totalSecs = totalDurationMins * 60;
        setTimeRemaining(totalSecs);
      })
      .catch((err) => {
        console.error('Error loading exam questions:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examItem]);

  // Countdown timer effect
  useEffect(() => {
    if (loading || questions.length === 0) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
      setTimeSpentSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, questions]);

  const handleSelectAnswer = (qId: number, optionKey: 'a' | 'b' | 'c' | 'd') => {
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: optionKey
    }));
  };

  const handleClearAnswer = (qId: number) => {
    setUserAnswers((prev) => {
      const copy = { ...prev };
      delete copy[qId];
      return copy;
    });
  };

  const toggleFlag = (qId: number) => {
    setFlagged((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const scrollToQuestion = (idx: number) => {
    const el = document.getElementById(`q-card-${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSubmitExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    let correctCount = 0;
    let wrongCount = 0;

    questions.forEach((q) => {
      const userAns = userAnswers[q.id];
      if (userAns !== undefined) {
        if (userAns === q.ans) {
          correctCount += 1;
        } else {
          wrongCount += 1;
        }
      }
    });

    const unattemptedCount = questions.length - (correctCount + wrongCount);
    const rawScore = correctCount * 1 - wrongCount * 0.25;
    const finalScore = Math.max(0, Math.round(rawScore * 100) / 100);
    const percentage = Math.round((finalScore / (questions.length || 100)) * 100);

    const resultData: ExamResult = {
      id: 'res_' + Date.now(),
      topicName: examItem.t,
      examCode: examItem.c,
      category: 'Medical Exam',
      score: finalScore,
      totalQuestions: questions.length,
      correctCount: correctCount,
      wrongCount: wrongCount,
      unattemptedCount: unattemptedCount,
      percentage: percentage,
      timeSpentSeconds: timeSpentSeconds,
      date: new Date().toISOString(),
      displayName: '',
      attempt: 1
    };

    onFinishExam(resultData, questions, userAnswers);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(userAnswers).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-16 text-center w-full">
        <div className="w-16 h-16 rounded-3xl bg-purple-900/40 border border-purple-500/40 flex items-center justify-center mb-4 animate-pulse">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white mb-2 font-siliguri">
          Preparing {examItem.t}
        </h2>
        <p className="text-sm text-slate-400">Loading all {examItem.qCount || 100} MCQs in single-page card view...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 pb-20">
      
      {/* ALWAYS STICKY Command Header (Never hides on scroll during exam as requested) */}
      <header className="sticky top-0 z-50 bg-[#0F172A]/95 backdrop-blur-md border-b border-purple-500/30 px-3 sm:px-6 py-3 shadow-2xl shadow-purple-950/40">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Left: Exit & Exam Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={() => setShowExitConfirm(true)}
              className="px-3 sm:px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all flex-shrink-0 shadow-sm border border-white/10 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" /> Exit
            </button>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-white truncate font-siliguri leading-tight">
                {examItem.t}
              </h2>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-400 font-mono">
                <span>Code: {examItem.c}</span>
                <span className="hidden sm:inline text-slate-600">•</span>
                <span className="hidden sm:inline text-purple-400">{questions.length} Questions</span>
              </div>
            </div>
          </div>

          {/* Center: Standard Prominent Rounded Pill Timer Bar (Always visible) */}
          <div className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-slate-900/95 border-2 border-purple-500/70 shadow-xl shadow-purple-950/70 text-purple-200 flex items-center gap-2 sm:gap-3 ring-2 ring-purple-500/20 whitespace-nowrap flex-shrink-0">
            <Clock className="w-4 sm:w-5 h-4 sm:h-5 text-purple-400 animate-pulse flex-shrink-0" />
            <span className="text-base sm:text-2xl font-mono font-black tracking-widest text-white">
              {formatTimer(timeRemaining)}
            </span>
          </div>

          {/* Right: Answered Counter & Submit Button */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-white/10 text-xs font-mono">
              <span className="text-slate-400">Answered:</span>
              <strong className="text-emerald-400 font-black">{answeredCount}</strong>
              <span className="text-slate-600">/</span>
              <span className="text-slate-400">{questions.length}</span>
            </div>

            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-emerald-900/50 transition-all flex items-center gap-1.5 transform active:scale-95"
            >
              <Send className="w-3.5 h-3.5" /> Submit
            </button>
          </div>

        </div>
      </header>

      {/* Main Single-Page Card Stream (Wider Container: max-w-[1400px]) */}
      <main className="max-w-[1400px] mx-auto px-3 sm:px-6 pt-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: All 100 Question Cards Stream */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            
            {/* Header info badge & Question/Options Font Size Selector for Laptop View */}
            <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2.5">
                <ListOrdered className="w-5 h-5 text-purple-400" />
                <span className="text-xs sm:text-sm font-bold text-slate-200 font-siliguri">
                  Full Question Stream (All {questions.length} Cards in One Page)
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-lg shadow-sm">
                  {answeredCount} / {questions.length} Answered
                </span>
              </div>

              {/* Laptop View Question & Option Font Size Selector (13px, 15px, 17px default, 19px) */}
              <div className="flex items-center gap-2 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-white/10 self-start sm:self-auto">
                <span className="text-[11px] font-bold text-slate-300 font-siliguri flex items-center gap-1">
                  <Type className="w-3.5 h-3.5 text-purple-400" /> প্রশ্ন ও অপশন সাইজ:
                </span>
                <div className="flex items-center gap-1">
                  {[13, 15, 17, 19].map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleSetQFontSize(size)}
                      className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                        questionFontSize === size
                          ? 'bg-purple-600 text-white border-purple-400 shadow ring-1 ring-purple-400'
                          : 'bg-slate-900 text-slate-400 border-white/5 hover:text-white'
                      }`}
                    >
                      {size}px
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {questions.map((q, idx) => {
              const userAns = userAnswers[q.id];
              const isFlagged = flagged[q.id];
              const isAnswered = userAns !== undefined;

              // Attractive card colors and accent borders
              let cardBg = 'bg-gradient-to-br from-[#131d36]/90 via-[#0f172a] to-[#121d34] border-indigo-500/30 border-l-4 border-l-indigo-500 shadow-indigo-950/20';
              if (isAnswered) {
                cardBg = 'bg-gradient-to-br from-[#0c232c]/80 via-[#0f172a] to-[#102436] border-emerald-500/40 border-l-4 border-l-emerald-500 shadow-emerald-950/20 ring-1 ring-emerald-500/20';
              } else if (isFlagged) {
                cardBg = 'bg-gradient-to-br from-[#2a1d0f]/80 via-[#0f172a] to-[#1e1728] border-amber-500/40 border-l-4 border-l-amber-500 shadow-amber-950/20 ring-1 ring-amber-500/20';
              }

              return (
                <article
                  key={q.id}
                  id={`q-card-${idx}`}
                  className={`border rounded-3xl p-5 sm:p-7 shadow-xl space-y-5 scroll-mt-24 transition-all duration-200 ${cardBg}`}
                >
                  {/* Card Header: Question Number Badge & Action Controls */}
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3.5">
                    <div className="flex items-center gap-2">
                      <span className="px-3.5 py-1 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-mono font-black text-xs sm:text-sm shadow-md">
                        Question #{idx + 1}
                      </span>
                      {isAnswered && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 font-mono shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Answered
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isAnswered && (
                        <button
                          onClick={() => handleClearAnswer(q.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-xs font-semibold border border-white/10 transition-all flex items-center gap-1 shadow-sm"
                          title="Clear Selected Answer"
                        >
                          <RotateCcw className="w-3 h-3" /> Clear
                        </button>
                      )}

                      <button
                        onClick={() => toggleFlag(q.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                          isFlagged
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : 'bg-slate-900/90 text-slate-400 border-white/10 hover:text-white'
                        }`}
                      >
                        <Flag className="w-3 h-3" />
                        {isFlagged ? 'Flagged' : 'Flag'}
                      </button>
                    </div>
                  </div>

                  {/* Question Stem in Bengali Typography with dynamic font size */}
                  <h3 
                    style={{ fontSize: `${questionFontSize + 3}px` }}
                    className="font-black text-white font-siliguri leading-relaxed break-words"
                    dangerouslySetInnerHTML={{ __html: q.q }}
                  />

                  {/* 4 MCQ Option Boxes with Generous Badge Width and dynamic font size */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {[
                      { key: 'a', label: '(ক)', text: q.a },
                      { key: 'b', label: '(খ)', text: q.b },
                      { key: 'c', label: '(গ)', text: q.c },
                      { key: 'd', label: '(ঘ)', text: q.d }
                    ].map((opt) => {
                      const isSelected = userAns === opt.key;

                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => handleSelectAnswer(q.id, opt.key as 'a' | 'b' | 'c' | 'd')}
                          className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 transform active:scale-[0.99] select-none ${
                            isSelected
                              ? 'bg-gradient-to-r from-purple-700/80 via-purple-800/80 to-indigo-800/80 border-purple-400 text-white shadow-lg ring-2 ring-purple-500/50'
                              : 'bg-slate-950/80 border-white/10 text-slate-200 hover:bg-slate-800/80 hover:border-purple-400/40'
                          }`}
                        >
                          {/* Option Badge with generous width: Bengali '১', 'ক', etc. never overlap */}
                          <span className={`w-8 h-8 min-w-[2rem] rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 mt-0.5 ${
                            isSelected ? 'bg-purple-500 text-white font-black shadow' : 'bg-slate-800 text-purple-300 border border-white/5'
                          }`}>
                            {opt.label}
                          </span>
                          <span 
                            style={{ fontSize: `${questionFontSize}px` }}
                            className="flex-1 min-w-0 font-siliguri font-medium leading-relaxed text-slate-100 pl-1 break-words"
                            dangerouslySetInnerHTML={{ __html: opt.text }} 
                          />
                        </button>
                      );
                    })}
                  </div>
                </article>
              );
            })}

            {/* Bottom Stream Action Bar */}
            <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 p-7 rounded-3xl text-center space-y-3 shadow-xl">
              <h4 className="text-lg font-bold text-white font-siliguri">
                Completed Reviewing All Questions?
              </h4>
              <p className="text-xs sm:text-sm text-slate-300">
                You have answered <strong className="text-emerald-400 font-mono">{answeredCount}</strong> out of <strong className="text-purple-300 font-mono">{questions.length}</strong> questions.
              </p>
              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-950/60 transition-all flex items-center gap-2 mx-auto active:scale-95"
              >
                <Send className="w-4 h-4" /> Final Submit Examination
              </button>
            </div>

          </div>

          {/* Right Column: Sticky Question Navigator Palette (1-100) */}
          <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 self-start space-y-4">
            
            <div className="bg-slate-900 border border-purple-500/30 p-5 rounded-3xl shadow-xl space-y-4">
              
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ListOrdered className="w-4 h-4 text-purple-400" /> Question Navigator
                </h4>
                <span className="text-purple-300 font-mono text-xs font-bold">
                  {answeredCount}/{questions.length}
                </span>
              </div>

              {/* Grid of numbers 1-100 */}
              <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-5 gap-1.5 max-h-[62vh] overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const isAnswered = userAnswers[q.id] !== undefined;
                  const isFlagged = flagged[q.id];

                  let btnStyle = 'bg-slate-950 border-white/10 text-slate-400 hover:border-purple-500/50 hover:text-white';
                  if (isAnswered) {
                    btnStyle = 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300 font-bold shadow-sm';
                  } else if (isFlagged) {
                    btnStyle = 'bg-amber-950/90 border-amber-500/60 text-amber-300 font-bold';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => scrollToQuestion(idx)}
                      className={`h-9 rounded-xl border text-xs font-mono transition-all flex items-center justify-center transform active:scale-95 ${btnStyle}`}
                      title={`Jump to Question #${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Palette Legend */}
              <div className="grid grid-cols-3 gap-1.5 text-[10px] text-slate-400 pt-2 border-t border-white/5 font-medium text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Answered
                </div>
                <div className="flex items-center justify-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-white/20 inline-block" /> Blank
                </div>
                <div className="flex items-center justify-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Flagged
                </div>
              </div>

              {/* Submit Quick Button */}
              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Submit Exam
              </button>

            </div>

          </aside>

        </div>

      </main>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-black text-white">Exit Examination?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your current test progress will be lost. Are you sure you want to return to catalog?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
              >
                Continue Exam
              </button>
              <button
                onClick={onExit}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md"
              >
                Yes, Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center mx-auto">
              <Send className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black text-white">Ready to Submit Exam?</h3>
              <p className="text-xs text-slate-400 mt-1">
                You have answered <strong className="text-emerald-400 font-mono">{answeredCount}</strong> of <strong className="text-white font-mono">{questions.length}</strong> questions.
                {questions.length - answeredCount > 0 && (
                  <span className="block text-amber-400 font-semibold mt-1">
                    Note: {questions.length - answeredCount} unattempted questions will receive 0 marks.
                  </span>
                )}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
              >
                Review Answers
              </button>
              <button
                onClick={() => {
                  setShowSubmitConfirm(false);
                  handleSubmitExam();
                }}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-900/40"
              >
                Confirm & Grade
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
