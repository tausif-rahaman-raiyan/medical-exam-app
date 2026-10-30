import React, { useState, useEffect, useRef } from 'react';
import { ExamItem, Question, UserAnswerMap, ExamResult } from '../types/exam';
import { loadExamQuestions } from '../utils/questionFetcher';
import { Clock, ArrowLeft, Send, LayoutGrid, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Flag, RotateCcw, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

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
  
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [mode, setMode] = useState<'card' | 'omr'>('card');
  const [timeRemaining, setTimeRemaining] = useState<number>(50 * 60); // seconds
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load questions and start timer
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    loadExamQuestions(examItem)
      .then((loadedQuestions) => {
        if (!isMounted) return;
        setQuestions(loadedQuestions);
        setLoading(false);

        // Set duration: default 50 mins or 30s per question
        const totalDurationMins = examItem.duration || 50;
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
    const percentage = Math.round((finalScore / questions.length) * 100);

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
        <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
          Preparing {examItem.t}
        </h2>
        <p className="text-sm text-slate-400">Loading 100 high-yield MCQs & Bengali typography...</p>
      </div>
    );
  }

  const currentQ = questions[activeIdx];

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 pb-12">
      
      {/* Sticky Command Header */}
      <div className="sticky top-0 z-50 bg-[#0F172A]/95 backdrop-blur-md border-b border-white/10 px-4 py-3 shadow-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          
          {/* Left: Exit & Exam Title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => setShowExitConfirm(true)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" /> Exit
            </button>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-white truncate font-siliguri leading-tight">
                {examItem.t}
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">Code: {examItem.c}</p>
            </div>
          </div>

          {/* Center: Live Timer */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-purple-500/40 text-purple-300 font-mono font-black text-xs sm:text-sm flex items-center gap-2 shadow-inner">
            <Clock className="w-4 h-4 text-purple-400 animate-pulse" />
            <span>{formatTimer(timeRemaining)}</span>
          </div>

          {/* Right: Mode Switcher & Submit */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:flex bg-slate-950 p-1 rounded-xl border border-white/10 text-xs font-bold">
              <button
                onClick={() => setMode('card')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  mode === 'card' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Card View
              </button>
              <button
                onClick={() => setMode('omr')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  mode === 'omr' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> OMR Sheet
              </button>
            </div>

            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/40 transition-all flex items-center gap-1.5 transform active:scale-95"
            >
              <Send className="w-3.5 h-3.5" /> Submit ({answeredCount}/{questions.length})
            </button>
          </div>

        </div>
      </div>

      {/* Main Exam View Container */}
      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Mobile View Toggle */}
        <div className="flex sm:hidden justify-center bg-slate-950 p-1 rounded-xl border border-white/10 text-xs font-bold max-w-xs mx-auto">
          <button
            onClick={() => setMode('card')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
              mode === 'card' ? 'bg-purple-600 text-white' : 'text-slate-400'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Card View
          </button>
          <button
            onClick={() => setMode('omr')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
              mode === 'omr' ? 'bg-purple-600 text-white' : 'text-slate-400'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> OMR Sheet
          </button>
        </div>

        {mode === 'card' ? (
          /* CARD VIEW MODE */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left: Active MCQ Card */}
            <div className="lg:col-span-3 space-y-4">
              {currentQ && (
                <div className="bg-slate-900 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
                  
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-4">
                    <span className="px-3 py-1 rounded-xl bg-purple-950 border border-purple-500/40 text-purple-300 font-mono font-bold text-xs">
                      Question #{activeIdx + 1} of {questions.length}
                    </span>

                    <button
                      onClick={() => toggleFlag(currentQ.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                        flagged[currentQ.id]
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-950 text-slate-400 border-white/10 hover:text-white'
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      {flagged[currentQ.id] ? 'Flagged' : 'Flag for Review'}
                    </button>
                  </div>

                  {/* Question Prompt */}
                  <h3 
                    className="text-lg sm:text-2xl font-bold text-white font-siliguri leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: currentQ.q }}
                  />

                  {/* Options List */}
                  <div className="grid grid-cols-1 gap-3 pt-2">
                    {[
                      { key: 'a', label: '(ক)', text: currentQ.a },
                      { key: 'b', label: '(খ)', text: currentQ.b },
                      { key: 'c', label: '(গ)', text: currentQ.c },
                      { key: 'd', label: '(ঘ)', text: currentQ.d }
                    ].map((opt) => {
                      const isSelected = userAnswers[currentQ.id] === opt.key;

                      return (
                        <button
                          key={opt.key}
                          onClick={() => handleSelectAnswer(currentQ.id, opt.key as 'a' | 'b' | 'c' | 'd')}
                          className={`w-full p-4 rounded-2xl border text-left font-siliguri text-sm sm:text-base transition-all flex items-start gap-3 transform active:scale-[0.99] ${
                            isSelected
                              ? 'bg-gradient-to-r from-purple-900/90 to-indigo-900/90 border-purple-500 text-white shadow-lg ring-2 ring-purple-500/50'
                              : 'bg-slate-950/80 border-white/10 text-slate-200 hover:bg-slate-800/80 hover:border-purple-500/40'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 ${
                            isSelected ? 'bg-purple-500 text-white' : 'bg-slate-800 text-purple-400'
                          }`}>
                            {opt.label}
                          </span>
                          <span className="flex-1" dangerouslySetInnerHTML={{ __html: opt.text }} />
                        </button>
                      );
                    })}
                  </div>

                  {/* Card Bottom Controls */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <button
                      onClick={() => handleClearAnswer(currentQ.id)}
                      disabled={userAnswers[currentQ.id] === undefined}
                      className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-xs font-bold border border-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Clear Answer
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveIdx((prev) => Math.max(0, prev - 1))}
                        disabled={activeIdx === 0}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" /> Previous
                      </button>

                      <button
                        onClick={() => setActiveIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                        disabled={activeIdx === questions.length - 1}
                        className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 shadow-md"
                      >
                        Next <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Right: Question Navigation Grid Palette */}
            <div className="space-y-4">
              <div className="bg-slate-900 border border-white/10 p-5 rounded-3xl shadow-xl space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                  <span>Question Navigator</span>
                  <span className="text-purple-400 font-mono">{answeredCount}/{questions.length}</span>
                </h4>

                <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-5 gap-2 max-h-96 overflow-y-auto pr-1">
                  {questions.map((q, idx) => {
                    const isAnswered = userAnswers[q.id] !== undefined;
                    const isActive = activeIdx === idx;
                    const isFlagged = flagged[q.id];

                    let btnStyle = 'bg-slate-950 border-white/10 text-slate-400 hover:border-purple-500/50';
                    if (isActive) {
                      btnStyle = 'ring-2 ring-purple-400 border-purple-500 bg-purple-950/80 text-white font-bold';
                    } else if (isAnswered) {
                      btnStyle = 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 font-bold';
                    } else if (isFlagged) {
                      btnStyle = 'bg-amber-950/80 border-amber-500/50 text-amber-300 font-bold';
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() => setActiveIdx(idx)}
                        className={`h-9 rounded-xl border text-xs font-mono transition-all flex items-center justify-center ${btnStyle}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-2 border-t border-white/5 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Answered
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-white/20 inline-block" /> Unanswered
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Flagged
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Active
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* OMR SHEET MODE */
          <div className="bg-slate-900 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
            <div className="text-center border-b border-white/10 pb-4">
              <h3 className="text-lg font-black text-white font-siliguri">
                মেডিকেল স্ট্যান্ডার্ড ওএমআর সিমুলেটর (OMR Sheet View)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                বৃত্ত ভরাট করতে (ক), (খ), (গ), (ঘ) বাবল সমূহে স্পর্শ করুন।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-2">
              {questions.map((q, idx) => {
                const userAns = userAnswers[q.id];

                return (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-mono font-bold text-xs text-purple-400 mr-2">#{idx + 1}</span>
                      <span 
                        className="text-xs font-bold text-slate-200 font-siliguri truncate inline-block max-w-[200px] sm:max-w-[260px] align-middle"
                        dangerouslySetInnerHTML={{ __html: q.q }}
                      />
                    </div>

                    {/* OMR Bubbles */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {['a', 'b', 'c', 'd'].map((key) => {
                        const isSelected = userAns === key;

                        return (
                          <button
                            key={key}
                            onClick={() => handleSelectAnswer(q.id, key as 'a' | 'b' | 'c' | 'd')}
                            className={`w-7 h-7 rounded-full text-[11px] font-bold font-mono border transition-all flex items-center justify-center ${
                              isSelected
                                ? 'bg-purple-500 border-purple-400 text-white scale-110 shadow-md ring-2 ring-purple-400/50'
                                : 'bg-slate-900 border-white/20 text-slate-400 hover:border-purple-400'
                            }`}
                          >
                            {key.toUpperCase()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Exit Exam Session?</h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to exit? Your ongoing timer and test answers will be lost.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Resume Exam
              </button>
              <button
                onClick={onExit}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all"
              >
                Confirm Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Submit Exam & Evaluate?</h3>
            <p className="text-xs text-slate-300">
              You have answered <strong className="text-emerald-400 font-mono">{answeredCount}</strong> out of <strong className="text-white font-mono">{questions.length}</strong> questions.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Continue Test
              </button>
              <button
                onClick={() => {
                  setShowSubmitConfirm(false);
                  handleSubmitExam();
                }}
                className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
