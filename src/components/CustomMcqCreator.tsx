import React, { useState, useEffect } from 'react';
import { ExamItem, Question } from '../types/exam';
import { subjectData } from '../data/subjectData';
import { generateHighYieldQuestions, loadExamQuestions } from '../utils/questionFetcher';
import { Sparkles, Plus, Trash2, Play, Sliders, Shuffle, Layers, Code, CheckSquare, Square, Clock, AlertCircle, ChevronDown } from 'lucide-react';

interface CustomMcqCreatorProps {
  onStartCustomExam: (exam: ExamItem) => void;
}

const DEMO_JSON_QUESTIONS = [
  {
    "q": "মানবদেহের দীর্ঘতম ও সর্বাপেক্ষা শক্তিশালী অস্থি কোনটি?",
    "a": "টিবিয়া (Tibia)",
    "b": "ফিমার (Femur)",
    "c": "হিউমেরাস (Humerus)",
    "d": "ফিবুলা (Fibula)",
    "ans": "b",
    "exp": "রেফারেন্স: মানব শারীরতত্ত্ব ও কঙ্কালতন্ত্র। কনসেপ্ট: উরুর অস্থি ফিমার মানবদেহের দীর্ঘতম, সর্বাপেক্ষা ভারী ও শক্তিশালী অস্থি।"
  },
  {
    "q": "কোন এনজাইমটি দুগ্ধ প্রোটিন কেসিনকে প্যারাকেসিনে রূপান্তর করে?",
    "a": "পেপসিন",
    "b": "রেনিন (Rennin)",
    "c": "ট্রিপসিন",
    "d": "টায়ালিন",
    "ans": "b",
    "exp": "রেফারেন্স: পরিপাক ও শোষণ। কনসেপ্ট: পাকস্থলীতে নিঃসৃত রেনিন এনজাইম দুগ্ধ প্রোটিন কেসিনকে ক্যালসিয়াম প্যারাকেসিনে রূপান্তরিত করে জমাট বাঁধায়।"
  },
  {
    "q": "নিম্নের কোনটি তীব্র এসিড ও তীব্র ক্ষারের প্রশমন তাপের সঠিক মান?",
    "a": "-57.34 kJ/mol",
    "b": "-55.14 kJ/mol",
    "c": "-58.00 kJ/mol",
    "d": "-60.20 kJ/mol",
    "ans": "a",
    "exp": "রেফারেন্স: রসায়ন ১ম পত্র রাসায়নিক পরিবর্তন। কনসেপ্ট: তীব্র এসিড ও তীব্র ক্ষারের প্রশমন তাপ সর্বদা ধ্রুবক এবং এর মান প্রায় -57.34 kJ/mol।"
  },
  {
    "q": "আলোর ব্যতিচার (Interference) কোন প্রকৃতির তরঙ্গ ধর্ম প্রদর্শন করে?",
    "a": "কণা ধর্ম",
    "b": "তরঙ্গ প্রকৃতি ও উপরিপাতন",
    "c": "ফোটোইলেকট্রিক ধর্ম",
    "d": "কম্পটন ক্রিয়া",
    "ans": "b",
    "exp": "রেফারেন্স: ভৌত আলোকবিজ্ঞান। কনসেপ্ট: ব্যতিচার এবং অপবর্তন আলোর খাঁটি তরঙ্গ ধর্ম এবং উপরিপাতন নীতি প্রমাণ করে।"
  },
  {
    "q": "কোষ বিভাজনের কোন উপপর্যায়ে ক্রসিং ওভার (Crossing Over) সম্পন্ন হয়?",
    "a": "লেপ্টোটিন",
    "b": "জাইগোটিন",
    "c": "প্যাকাইটিন (Pachytene)",
    "d": "ডিপ্লোটিন",
    "ans": "c",
    "exp": "রেফারেন্স: কোষ বিভাজন মায়োসিস-১। কনসেপ্ট: মায়োসিস-১ এর প্রফেজ-১ এর প্যাকাইটিন উপপর্যায়ে নন-সিস্টার ক্রোমাটিডের মধ্যে অংশের বিনিময় অর্থাৎ ক্রসিং ওভার ঘটে।"
  }
];

export const CustomMcqCreator: React.FC<CustomMcqCreatorProps> = ({ onStartCustomExam }) => {
  const [activeMode, setActiveMode] = useState<'blend' | 'auto' | 'manual'>('blend');
  
  // Basic configurations
  const [title, setTitle] = useState<string>('Combined Multi-Subject Blend Mock Test');
  const [qCount, setQCount] = useState<number>(100);
  const [duration, setDuration] = useState<number>(50); // Auto-calculated 30s per question
  const [loadingBlend, setLoadingBlend] = useState<boolean>(false);

  // Auto-calculate duration whenever question count changes (30 seconds per question)
  useEffect(() => {
    const autoMins = Math.ceil((qCount * 30) / 60);
    setDuration(autoMins);
  }, [qCount]);

  // Blend Mode: Selected exams from 114 sets
  const allExamItems = subjectData.flatMap(s => s.items.map(item => ({ ...item, categoryName: s.cat })));
  const [selectedExamCodes, setSelectedExamCodes] = useState<string[]>(() => {
    // Default select first 5-8 exams for immediate blend
    return allExamItems.slice(0, 10).map(i => i.c);
  });

  const [openSubjectIndex, setOpenSubjectIndex] = useState<number | null>(0);

  // Manual Mode: Tab between Form and JSON
  const [manualInputMode, setManualInputMode] = useState<'json' | 'form'>('json');
  const [jsonText, setJsonText] = useState<string>(JSON.stringify(DEMO_JSON_QUESTIONS, null, 2));
  const [jsonError, setJsonError] = useState<string>('');

  // Form input questions
  const [formQuestions, setFormQuestions] = useState<Question[]>([
    {
      id: 1,
      q: 'নিম্নের কোন অঙ্গাণুটি কোষের শক্তির ঘর (Powerhouse) হিসেবে পরিচিত?',
      a: 'মাইটোকন্ড্রিয়া',
      b: 'গলগি বডি',
      c: 'রাইবোজোম',
      d: 'লাইসোজোম',
      ans: 'a',
      exp: 'রেফারেন্স: কোষ ও এর গঠন। কনসেপ্ট: মাইটোকন্ড্রিয়াতে শ্বসনের প্রধান ধাপগুলো সম্পন্ন হয় বিধায় একে শক্তিঘর বলা হয়।'
    }
  ]);
  const [newQText, setNewQText] = useState('');
  const [newA, setNewA] = useState('');
  const [newB, setNewB] = useState('');
  const [newC, setNewC] = useState('');
  const [newD, setNewD] = useState('');
  const [newAns, setNewAns] = useState<'a' | 'b' | 'c' | 'd'>('a');
  const [newExp, setNewExp] = useState('');

  // Auto Mode category
  const [selectedCat, setSelectedCat] = useState<string>(subjectData[0].cat);

  // Toggle selection for blend
  const toggleExamSelection = (code: string) => {
    setSelectedExamCodes(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const selectAllInSubject = (cat: string) => {
    const sub = subjectData.find(s => s.cat === cat);
    if (!sub) return;
    const codes = sub.items.map(i => i.c);
    const allSelected = codes.every(c => selectedExamCodes.includes(c));

    if (allSelected) {
      setSelectedExamCodes(prev => prev.filter(c => !codes.includes(c)));
    } else {
      setSelectedExamCodes(prev => Array.from(new Set([...prev, ...codes])));
    }
  };

  const selectAll114Exams = () => {
    if (selectedExamCodes.length === allExamItems.length) {
      setSelectedExamCodes([]);
    } else {
      setSelectedExamCodes(allExamItems.map(i => i.c));
    }
  };

  // Fisher-Yates Shuffle Algorithm for mixing questions thoroughly
  function shuffleArray<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // Load Demo JSON
  const handleLoadDemoJson = () => {
    setJsonText(JSON.stringify(DEMO_JSON_QUESTIONS, null, 2));
    setJsonError('');
    setQCount(DEMO_JSON_QUESTIONS.length);
  };

  // Add Form Question
  const handleAddFormQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText.trim() || !newA.trim() || !newB.trim()) return;

    const newQ: Question = {
      id: formQuestions.length + 1,
      q: newQText.trim(),
      a: newA.trim(),
      b: newB.trim(),
      c: newC.trim() || 'অন্যান্য',
      d: newD.trim() || 'সবগুলো সঠিক',
      ans: newAns,
      exp: newExp.trim() || 'রেফারেন্স: মেডিকেল স্পেশাল কাস্টম মক প্রশ্ন।'
    };

    const updated = [...formQuestions, newQ];
    setFormQuestions(updated);
    setQCount(updated.length);
    setNewQText('');
    setNewA('');
    setNewB('');
    setNewC('');
    setNewD('');
    setNewExp('');
  };

  // Launch the exam based on active mode
  const handleLaunchExam = async () => {
    let finalQuestions: Question[] = [];

    if (activeMode === 'blend') {
      if (selectedExamCodes.length === 0) {
        alert('Please select at least one exam set to blend.');
        return;
      }
      setLoadingBlend(true);

      try {
        const selectedItems = allExamItems.filter(i => selectedExamCodes.includes(i.c));
        let pool: Question[] = [];

        // Fetch questions from selected sets
        const promises = selectedItems.map(item => loadExamQuestions(item));
        const results = await Promise.all(promises);

        results.forEach(qs => {
          pool.push(...qs);
        });

        if (pool.length === 0) {
          pool = generateHighYieldQuestions(title, qCount);
        }

        // CRITICAL REQUIREMENT: Thoroughly SHUFFLE all questions so they are randomized, not serial!
        const shuffled = shuffleArray(pool);

        // Take target qCount
        const targetCount = Math.min(qCount, shuffled.length);
        finalQuestions = shuffled.slice(0, targetCount).map((q, idx) => ({
          ...q,
          id: idx + 1
        }));

      } catch (err) {
        console.error('Blend failed, falling back:', err);
        finalQuestions = generateHighYieldQuestions(title, qCount);
      } finally {
        setLoadingBlend(false);
      }

    } else if (activeMode === 'auto') {
      finalQuestions = generateHighYieldQuestions(title, qCount);

    } else if (activeMode === 'manual') {
      if (manualInputMode === 'json') {
        try {
          const parsed = JSON.parse(jsonText);
          if (!Array.isArray(parsed) || parsed.length === 0) {
            setJsonError('JSON must be a non-empty array of question objects.');
            return;
          }
          finalQuestions = parsed.map((item, idx) => ({
            id: idx + 1,
            q: item.q || item.question || `প্রশ্ন #${idx + 1}`,
            a: item.a || (item.options && item.options[0]?.text) || 'ক',
            b: item.b || (item.options && item.options[1]?.text) || 'খ',
            c: item.c || (item.options && item.options[2]?.text) || 'গ',
            d: item.d || (item.options && item.options[3]?.text) || 'ঘ',
            ans: (item.ans || item.answer || 'a').toLowerCase().trim()[0] || 'a',
            exp: item.exp || item.explanation || 'রেফারেন্স: মেডিকেল পাঠ্যবই।'
          }));
        } catch (e: any) {
          setJsonError('Invalid JSON format: ' + e.message);
          return;
        }
      } else {
        if (formQuestions.length === 0) {
          alert('Please add at least one question.');
          return;
        }
        finalQuestions = formQuestions;
      }
    }

    if (finalQuestions.length === 0) {
      alert('No questions available to start the exam.');
      return;
    }

    const customExam: ExamItem = {
      t: title,
      c: 'BLEND_' + Math.floor(100000 + Math.random() * 900000),
      qCount: finalQuestions.length,
      duration: duration,
      customQuestions: finalQuestions
    };

    onStartCustomExam(customExam);
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/30 p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Advanced Custom MCQ Engine
          </span>
          <h2 className="text-xl sm:text-3xl font-black text-white font-siliguri leading-tight">
            কাস্টম ও মাল্টি-সাবজেক্ট ব্লেন্ড এক্সাম বিল্ডার
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-siliguri">
            ১১৪ টি এক্সাম সেট থেকে ব্লেন্ড মোডে ১০০ টি শাফেলড প্রশ্ন নির্বাচন করুন অথবা সরাসরি JSON ইনপুট দিয়ে পরীক্ষা দিন।
          </p>
        </div>

        <button
          onClick={handleLaunchExam}
          disabled={loadingBlend}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-950/60 transition-all flex items-center gap-2 flex-shrink-0 active:scale-95 disabled:opacity-50"
        >
          {loadingBlend ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Blending Questions...
            </span>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              Start {qCount}-MCQ Exam Now
            </>
          )}
        </button>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center bg-slate-900/90 p-1.5 rounded-2xl border border-white/10 shadow-lg">
        <button
          onClick={() => {
            setActiveMode('blend');
            setTitle('Multi-Subject 100-MCQ Blend Exam');
            setQCount(100);
          }}
          className={`flex-1 py-3 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeMode === 'blend'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" /> 🔀 Blend Exam Mode (114 Sets)
        </button>

        <button
          onClick={() => {
            setActiveMode('manual');
            setTitle('Custom Manual & JSON Practice Test');
          }}
          className={`flex-1 py-3 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeMode === 'manual'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Code className="w-4 h-4" /> ✍️ Manual & JSON Input
        </button>

        <button
          onClick={() => {
            setActiveMode('auto');
            setTitle('Rapid Auto-Generated Topic Test');
            setQCount(50);
          }}
          className={`flex-1 py-3 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeMode === 'auto'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" /> 🎲 Quick Topic Generator
        </button>
      </div>

      {/* Main Configurations Box */}
      <div className="bg-slate-900 border border-white/10 p-5 sm:p-7 rounded-3xl shadow-xl space-y-5">
        <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
          <Sliders className="w-4 h-4 text-purple-400" /> পরীক্ষার কনফিগারেশন ও সময়সীমা
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-300 mb-1.5">পরীক্ষার নাম (Exam Title)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              পরীক্ষার সময়সীমা (Duration Mins)
            </label>
            <div className="relative">
              <input
                type="number"
                min={5}
                max={180}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-slate-950 border border-white/10 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-purple-400">
                Mins
              </span>
            </div>
            <p className="text-[11px] text-emerald-400 mt-1 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" /> Auto-calculated: 30s per MCQ ({qCount * 30}s = {duration}m)
            </p>
          </div>
        </div>

        {/* Question Count Selector for Blend / Auto */}
        {activeMode !== 'manual' && (
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
              <span>মোট প্রশ্নসংখ্যা (Target MCQs): <strong className="text-purple-300 font-mono text-sm">{qCount} Questions</strong></span>
              <span className="text-slate-400 font-mono text-[11px]">{duration} Minutes Limit</span>
            </div>
            <div className="flex gap-2">
              {[25, 50, 75, 100].map(cnt => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQCount(cnt)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border font-mono ${
                    qCount === cnt
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  {cnt} MCQs
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 1. BLEND EXAM MODE */}
      {activeMode === 'blend' && (
        <div className="bg-slate-900 border border-purple-500/30 p-5 sm:p-7 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-purple-400" /> ১১৪ টি এক্সাম থেকে চ্যাপ্টার নির্বাচন করুন
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                নির্বাচিত সকল চ্যাপ্টারের প্রশ্নসমূহ এলোমেলোভাবে (Shuffle) ব্লেন্ড করে ১০০ টি প্রশ্নে পরীক্ষা সাজানো হবে।
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={selectAll114Exams}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-purple-300 border border-white/10 transition-all flex items-center gap-1.5"
              >
                {selectedExamCodes.length === allExamItems.length ? <Square className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
                {selectedExamCodes.length === allExamItems.length ? 'Deselect All' : 'Select All 114'}
              </button>
              <span className="px-3 py-1.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-xs font-mono font-bold text-purple-200">
                {selectedExamCodes.length} Sets Selected
              </span>
            </div>
          </div>

          {/* Grouped Category Dropdown Accordions */}
          <div className="space-y-3 max-h-[58vh] overflow-y-auto pr-1">
            {subjectData.map((sub, sIdx) => {
              const subCodes = sub.items.map(i => i.c);
              const selectedCount = subCodes.filter(c => selectedExamCodes.includes(c)).length;
              const isAllInSub = selectedCount === subCodes.length;
              const isExpanded = openSubjectIndex === sIdx;

              return (
                <div key={sub.cat} className="bg-slate-950/80 border border-white/10 hover:border-purple-500/30 rounded-2xl overflow-hidden transition-all shadow-md">
                  
                  {/* Dropdown Header */}
                  <div 
                    onClick={() => setOpenSubjectIndex(isExpanded ? null : sIdx)}
                    className="flex items-center justify-between p-3.5 sm:p-4 cursor-pointer hover:bg-purple-950/20 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Checkbox to Select Entire Subject */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectAllInSubject(sub.cat);
                        }}
                        className="flex-shrink-0 flex items-center gap-1.5 p-1 rounded-lg hover:bg-white/10 transition-colors"
                        title="Select/Deselect Full Subject"
                      >
                        <span className={`w-5 h-5 rounded-lg flex items-center justify-center border text-xs font-bold ${
                          isAllInSub 
                            ? 'bg-purple-600 border-purple-500 text-white' 
                            : selectedCount > 0 
                            ? 'bg-purple-950 border-purple-500 text-purple-300' 
                            : 'bg-slate-900 border-white/20'
                        }`}>
                          {isAllInSub ? '✓' : selectedCount > 0 ? '−' : ''}
                        </span>
                      </button>

                      <div className="min-w-0 flex-1">
                        <span className="text-sm sm:text-base font-bold text-white font-siliguri block truncate">
                          {sub.cat}
                        </span>
                        <span className="text-[11px] font-mono text-purple-300 block">
                          {sub.items.length} Chapters Available
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="px-2.5 py-1 rounded-xl bg-purple-950/80 border border-purple-700/50 text-[11px] font-mono font-bold text-purple-200">
                        {selectedCount} / {sub.items.length} Selected
                      </span>
                      <span className="w-7 h-7 rounded-xl bg-slate-900 flex items-center justify-center text-slate-400">
                        <ChevronDown className={`w-4 h-4 text-purple-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                      </span>
                    </div>
                  </div>

                  {/* Dropdown Body: Chapters Grid */}
                  {isExpanded && (
                    <div className="p-3.5 sm:p-4 bg-slate-900/60 border-t border-white/5 space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1">
                        <span>Click chapters to include or exclude:</span>
                        <button
                          type="button"
                          onClick={() => selectAllInSubject(sub.cat)}
                          className="text-purple-400 hover:text-purple-300 font-bold"
                        >
                          {isAllInSub ? 'Deselect All' : 'Select All in ' + sub.cat}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {sub.items.map(item => {
                          const isChecked = selectedExamCodes.includes(item.c);

                          return (
                            <button
                              key={item.c}
                              type="button"
                              onClick={() => toggleExamSelection(item.c)}
                              className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-start gap-2 ${
                                isChecked
                                  ? 'bg-purple-950/80 border-purple-500/70 text-purple-200 shadow-sm'
                                  : 'bg-slate-950/70 border-white/5 text-slate-300 hover:border-white/20'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] mt-0.5 flex-shrink-0 font-bold ${
                                isChecked ? 'bg-purple-600 border-purple-400 text-white' : 'border-white/20 bg-slate-900'
                              }`}>
                                {isChecked ? '✓' : ''}
                              </span>
                              <span className="font-siliguri truncate flex-1 leading-snug">{item.t}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. MANUAL & JSON INPUT MODE */}
      {activeMode === 'manual' && (
        <div className="bg-slate-900 border border-white/10 p-5 sm:p-7 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setManualInputMode('json')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  manualInputMode === 'json' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                JSON Format Input
              </button>
              <button
                onClick={() => setManualInputMode('form')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  manualInputMode === 'form' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Interactive Form Input
              </button>
            </div>

            {manualInputMode === 'json' && (
              <button
                onClick={handleLoadDemoJson}
                className="px-3.5 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Load Demo JSON Questions
              </button>
            )}
          </div>

          {manualInputMode === 'json' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Paste or edit JSON question array [&#123; q, a, b, c, d, ans, exp &#125;]:</span>
                <span className="font-mono text-purple-300">Format: Standard JSON</span>
              </div>

              <textarea
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  setJsonError('');
                }}
                rows={12}
                className="w-full bg-slate-950 border border-white/10 focus:border-purple-500 rounded-2xl p-4 text-xs font-mono text-slate-200 focus:outline-none leading-relaxed"
                placeholder='[ { "q": "...", "a": "...", "b": "...", "c": "...", "d": "...", "ans": "a", "exp": "..." } ]'
              />

              {jsonError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{jsonError}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handleAddFormQuestion} className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-white/10">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">প্রশ্ন (Question Prompt)</label>
                  <input
                    type="text"
                    value={newQText}
                    onChange={(e) => setNewQText(e.target.value)}
                    placeholder="e.g. রক্তের অণুপাতিকার স্বাভাবিক আয়ুষ্কাল কতদিন?"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-siliguri"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newA}
                    onChange={(e) => setNewA(e.target.value)}
                    placeholder="(ক) অপশন A"
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-siliguri"
                  />
                  <input
                    type="text"
                    value={newB}
                    onChange={(e) => setNewB(e.target.value)}
                    placeholder="(খ) অপশন B"
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-siliguri"
                  />
                  <input
                    type="text"
                    value={newC}
                    onChange={(e) => setNewC(e.target.value)}
                    placeholder="(গ) অপশন C"
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-siliguri"
                  />
                  <input
                    type="text"
                    value={newD}
                    onChange={(e) => setNewD(e.target.value)}
                    placeholder="(ঘ) অপশন D"
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-siliguri"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">সঠিক উত্তর</label>
                    <select
                      value={newAns}
                      onChange={(e) => setNewAns(e.target.value as any)}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-siliguri"
                    >
                      <option value="a">(ক) অপশন A</option>
                      <option value="b">(খ) অপশন B</option>
                      <option value="c">(গ) অপশন C</option>
                      <option value="d">(ঘ) অপশন D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">ব্যাখ্যা (Explanation)</label>
                    <input
                      type="text"
                      value={newExp}
                      onChange={(e) => setNewExp(e.target.value)}
                      placeholder="রেফারেন্স ও কনসেপ্ট"
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-siliguri"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow"
                >
                  <Plus className="w-3.5 h-3.5" /> প্রশ্ন যোগ করুন
                </button>
              </form>

              {/* Form Questions List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase">যুক্তকৃত প্রশ্নসমূহ ({formQuestions.length})</h4>
                {formQuestions.map((q, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between gap-3 text-xs">
                    <span className="font-siliguri text-white truncate flex-1">
                      #{idx + 1}. {q.q}
                    </span>
                    <button
                      onClick={() => setFormQuestions(formQuestions.filter((_, i) => i !== idx))}
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. QUICK AUTO TOPIC GENERATOR */}
      {activeMode === 'auto' && (
        <div className="bg-slate-900 border border-white/10 p-5 sm:p-7 rounded-3xl shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <Sliders className="w-4 h-4 text-purple-400" /> বিষয়ভিত্তিক স্বয়ংক্রিয় প্রশ্ন নির্বাচন
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">মূল বিষয় (Subject Category)</label>
            <select
              value={selectedCat}
              onChange={(e) => {
                setSelectedCat(e.target.value);
                setTitle(`${e.target.value} Rapid Mock Exam`);
              }}
              className="w-full bg-slate-950 border border-white/10 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none font-siliguri"
            >
              {subjectData.map(s => (
                <option key={s.cat} value={s.cat}>{s.cat} ({s.items.length} চ্যাপ্টার)</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Bottom Start Action Bar */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/30 flex items-center justify-between gap-4 shadow-xl">
        <div>
          <h4 className="text-base font-bold text-white font-siliguri">পরীক্ষা শুরু করতে প্রস্তুত?</h4>
          <p className="text-xs text-slate-400">
            {activeMode === 'blend' ? `১১৪ টি সেটের মধ্যে ${selectedExamCodes.length} টি সেট থেকে ${qCount} টি প্রশ্ন শাফেল করা হবে।` : `${qCount} টি প্রশ্ন ও ${duration} মিনিট সময়সীমা নির্ধারিত হয়েছে।`}
          </p>
        </div>

        <button
          onClick={handleLaunchExam}
          disabled={loadingBlend}
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-950/60 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-current" /> Start Examination
        </button>
      </div>

    </div>
  );
};
