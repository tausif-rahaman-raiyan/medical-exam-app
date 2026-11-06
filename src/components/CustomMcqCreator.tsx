import React, { useState, useEffect } from 'react';
import { ExamItem, Question } from '../types/exam';
import { subjectData } from '../data/subjectData';
import { generateHighYieldQuestions, loadExamQuestions } from '../utils/questionFetcher';
import { Sparkles, Plus, Trash2, Play, Sliders, Shuffle, Layers, Code, CheckSquare, Square, Clock, AlertCircle, ChevronDown, Upload, FileText, Download, FileCheck, Check } from 'lucide-react';

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
  
  // Target MCQs: 100 (50 mins) or 50 (25 mins) at 30s per MCQ
  const [qCount, setQCount] = useState<100 | 50>(100);
  const duration = qCount === 100 ? 50 : 25;
  const [loadingBlend, setLoadingBlend] = useState<boolean>(false);

  // Blend Mode: Selected exams from 114 sets (Autoselect is OFF by default)
  const allExamItems = subjectData.flatMap(s => s.items.map(item => ({ ...item, categoryName: s.cat })));
  const [selectedExamCodes, setSelectedExamCodes] = useState<string[]>([]);

  // Auto-detect exam title based on selected subjects
  const getAutoDetectedTitle = () => {
    if (activeMode === 'manual') {
      if (manualInputMode === 'upload' && uploadedFileTitle) {
        return uploadedFileTitle;
      }
      return 'Custom Manual & JSON Practice Test';
    }
    if (activeMode === 'auto') {
      return `${selectedCat} Rapid Mock Exam`;
    }
    if (selectedExamCodes.length === 0) {
      return 'কাস্টম মাল্টি-সাবজেক্ট ব্লেন্ড টেস্ট (কোনো অধ্যায় নির্বাচন করা হয়নি)';
    }
    if (selectedExamCodes.length === allExamItems.length) {
      return 'All Subjects (114 Sets) Medical Blend Exam';
    }
    const selectedCats = Array.from(
      new Set(
        allExamItems
          .filter(i => selectedExamCodes.includes(i.c))
          .map(i => i.categoryName)
      )
    );
    if (selectedCats.length === 0) {
      return 'Custom Multi-Subject Blend Exam';
    }
    if (selectedCats.length <= 3) {
      return `${selectedCats.join(' + ')} Blend Test`;
    }
    return `${selectedCats.slice(0, 2).join(' + ')} + ${selectedCats.length - 2} more subjects Blend Test`;
  };

  // Dropdown Accordion: starts closed (null) by default
  const [openSubjectIndex, setOpenSubjectIndex] = useState<number | null>(null);

  // Manual Mode: Tab between Upload TXT and Direct JSON
  const [manualInputMode, setManualInputMode] = useState<'upload' | 'json'>('upload');
  const [jsonText, setJsonText] = useState<string>(JSON.stringify(DEMO_JSON_QUESTIONS, null, 2));
  const [jsonError, setJsonError] = useState<string>('');

  // TXT / JSON File Upload state
  const [uploadedQuestions, setUploadedQuestions] = useState<Question[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileTitle, setUploadedFileTitle] = useState<string>('');
  const [fileError, setFileError] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

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
  };

  // File Upload Handler (.txt or .json)
  const handleFileUpload = (file: File) => {
    setFileError('');
    if (!file) return;

    // Remove extension to determine initial exam title
    const titleWithoutExt = file.name.replace(/\.[^/.]+$/, "").trim();
    setUploadedFileName(file.name);
    setUploadedFileTitle(titleWithoutExt || 'Custom Uploaded Exam');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text || !text.trim()) {
          setFileError('ফাইলটি সম্পূর্ণ খালি।');
          return;
        }

        // Clean UTF-8 BOM if present
        const cleaned = text.replace(/^\uFEFF/, '').trim();
        const parsed = JSON.parse(cleaned);

        if (!Array.isArray(parsed) || parsed.length === 0) {
          setFileError('ফাইল ফরম্যাট সঠিক নয়: ফাইলে অবশ্যই প্রশ্নসমূহের একটি JSON array [...] থাকতে হবে।');
          return;
        }

        const normalized: Question[] = parsed.map((item: any, idx: number) => ({
          id: idx + 1,
          q: item.q || item.question || `প্রশ্ন #${idx + 1}`,
          a: item.a || (item.options && item.options[0]?.text) || 'ক',
          b: item.b || (item.options && item.options[1]?.text) || 'খ',
          c: item.c || (item.options && item.options[2]?.text) || 'গ',
          d: item.d || (item.options && item.options[3]?.text) || 'ঘ',
          ans: (item.ans || item.answer || 'a').toLowerCase().trim()[0] || 'a',
          exp: item.exp || item.explanation || 'রেফারেন্স ও কনসেপ্ট ব্যাখ্যা।'
        }));

        setUploadedQuestions(normalized);
        setJsonText(JSON.stringify(normalized, null, 2));
      } catch (err: any) {
        console.error('File parsing error:', err);
        setFileError('ফাইলটি পড়া সম্ভব হয়নি: ' + err.message + '। নিশ্চিত করুন যে ফাইলটিতে সঠিক JSON array ফরম্যাট রয়েছে।');
      }
    };
    reader.onerror = () => {
      setFileError('ফাইলটি পড়তে সমস্যা হয়েছে।');
    };
    reader.readAsText(file);
  };

  // Download Sample .txt file
  const handleDownloadSampleTxt = () => {
    const content = JSON.stringify(DEMO_JSON_QUESTIONS, null, 2);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Medical_Special_Sample_Questions.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          pool = generateHighYieldQuestions(getAutoDetectedTitle(), qCount);
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
        finalQuestions = generateHighYieldQuestions(getAutoDetectedTitle(), qCount);
      } finally {
        setLoadingBlend(false);
      }

    } else if (activeMode === 'auto') {
      finalQuestions = generateHighYieldQuestions(getAutoDetectedTitle(), qCount);

    } else if (activeMode === 'manual') {
      if (manualInputMode === 'upload') {
        if (uploadedQuestions.length === 0) {
          alert('অনুগ্রহ করে প্রথমে একটি বৈধ .txt ফাইল আপলোড করুন।');
          return;
        }
        finalQuestions = uploadedQuestions;
      } else if (manualInputMode === 'json') {
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
      }
    }

    if (finalQuestions.length === 0) {
      alert('No questions available to start the exam.');
      return;
    }

    const examTitle = (activeMode === 'manual' && manualInputMode === 'upload' && uploadedFileTitle)
      ? uploadedFileTitle
      : getAutoDetectedTitle();

    const examDuration = (activeMode === 'manual' && manualInputMode === 'upload')
      ? Math.max(1, Math.ceil((finalQuestions.length * 30) / 60))
      : duration;

    const customExam: ExamItem = {
      t: examTitle,
      c: (activeMode === 'manual' && manualInputMode === 'upload' ? 'TXT_' : 'CUSTOM_') + Math.floor(100000 + Math.random() * 900000),
      qCount: finalQuestions.length,
      duration: examDuration,
      customQuestions: finalQuestions
    };

    onStartCustomExam(customExam);
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      
      {/* Top Banner (Clean without duplicate launch button) */}
      <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/30 p-6 sm:p-8 rounded-3xl shadow-2xl">
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

      {/* Mode Switcher Tabs */}
      <div className="flex items-center bg-slate-900/90 p-1.5 rounded-2xl border border-white/10 shadow-lg">
        <button
          onClick={() => setActiveMode('blend')}
          className={`flex-1 py-3 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeMode === 'blend'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" /> 🔀 Blend Exam Mode (114 Sets)
        </button>

        <button
          onClick={() => setActiveMode('manual')}
          className={`flex-1 py-3 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeMode === 'manual'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Code className="w-4 h-4" /> ✍️ Manual & JSON Input
        </button>

        <button
          onClick={() => setActiveMode('auto')}
          className={`flex-1 py-3 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeMode === 'auto'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" /> 🎲 Quick Topic Generator
        </button>
      </div>

      {/* 1. BLEND EXAM MODE */}
      {activeMode === 'blend' && (
        <div className="bg-slate-900 border border-purple-500/30 p-5 sm:p-7 rounded-3xl shadow-xl space-y-4">
          
          {/* Integrated Header: Auto-Detected Title & Controls */}
          <div className="border-b border-white/10 pb-4 space-y-3.5">
            {/* Row 1: Section Title & Selection Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Shuffle className="w-5 h-5 text-purple-400" /> ১১৪ টি এক্সাম থেকে চ্যাপ্টার নির্বাচন করুন
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  নির্বাচিত সকল চ্যাপ্টারের প্রশ্নসমূহ এলোমেলোভাবে (Shuffle) ব্লেন্ড করে {qCount} টি প্রশ্নে পরীক্ষা সাজানো হবে।
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAll114Exams}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-purple-300 border border-white/10 transition-all flex items-center gap-1.5 active:scale-95"
                >
                  {selectedExamCodes.length === allExamItems.length ? <Square className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
                  {selectedExamCodes.length === allExamItems.length ? 'Deselect All' : 'Select All 114'}
                </button>
                <span className="px-3 py-1.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-xs font-mono font-bold text-purple-200">
                  {selectedExamCodes.length} Sets Selected
                </span>
              </div>
            </div>

            {/* Row 2: Auto-Detected Title & Target MCQs Segmented Toggle (100 vs 50) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 bg-slate-950/80 p-3.5 sm:p-4 rounded-2xl border border-white/5">
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-purple-300/80 uppercase tracking-wider block">
                  স্বয়ংক্রিয় পরীক্ষার নাম (Auto Detected Title)
                </span>
                <h4 className="text-sm font-bold text-white font-siliguri truncate">
                  {getAutoDetectedTitle()}
                </h4>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {/* Segmented Toggle for Target MCQs: 100 vs 50 */}
                <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setQCount(100)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      qCount === 100
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    100 MCQs (50 Min)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQCount(50)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      qCount === 50
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    50 MCQs (25 Min)
                  </button>
                </div>

                {/* Auto timing badge */}
                <span className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-[11px] font-mono text-emerald-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Auto-calculated: 30s per MCQ
                </span>
              </div>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setManualInputMode('upload')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  manualInputMode === 'upload' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" /> Upload TXT File (টিএক্সটি ফাইল আপলোড)
              </button>
              <button
                onClick={() => setManualInputMode('json')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  manualInputMode === 'json' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code className="w-3.5 h-3.5" /> JSON Format Input
              </button>
            </div>

            {manualInputMode === 'upload' ? (
              <button
                onClick={handleDownloadSampleTxt}
                className="px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                নমুনা .txt ফাইল ডাউনলোড
              </button>
            ) : (
              <button
                onClick={handleLoadDemoJson}
                className="px-3.5 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Load Demo JSON Questions
              </button>
            )}
          </div>

          {/* TAB 1: TXT / JSON FILE UPLOAD */}
          {manualInputMode === 'upload' ? (
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-purple-400 bg-purple-950/40 shadow-lg shadow-purple-900/30'
                    : 'border-white/15 bg-slate-950/70 hover:border-purple-500/50 hover:bg-slate-950'
                }`}
                onClick={() => document.getElementById('custom-txt-upload-input')?.click()}
              >
                <input
                  id="custom-txt-upload-input"
                  type="file"
                  accept=".txt,.json"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />

                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-950/50">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white font-siliguri">
                      আপনার .txt ফাইল নির্বাচন করতে ক্লিক করুন অথবা এখানে ড্রপ করুন
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 font-siliguri">
                      ফাইলের নাম স্বয়ংক্রিয়ভাবে পরীক্ষার নাম (Exam Title) হিসেবে যুক্ত হবে
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <span className="px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-[11px] font-mono text-purple-300">
                      ফরম্যাট: [&#123; q, a, b, c, d, ans, exp &#125;]
                    </span>
                    <span className="px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-[11px] font-mono text-cyan-300">
                      সাপোর্ট: .txt ও .json ফাইল
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {fileError && (
                <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 shadow-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{fileError}</span>
                </div>
              )}

              {/* Uploaded File Details & Question Preview */}
              {uploadedQuestions.length > 0 && (
                <div className="space-y-4 bg-slate-950/90 p-4 sm:p-5 rounded-2xl border border-emerald-500/40 shadow-xl">
                  {/* File Metadata Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                            {uploadedFileName}
                          </span>
                          <span className="text-xs font-bold text-white font-mono">
                            {uploadedQuestions.length} MCQs Loaded
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-siliguri block mt-0.5">
                          সময়সীমা: {Math.ceil((uploadedQuestions.length * 30) / 60)} মিনিট (স্বয়ংক্রিয়: ৩০ সেকেন্ড প্রতি MCQ)
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setUploadedQuestions([]);
                        setUploadedFileName('');
                        setUploadedFileTitle('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/70 border border-white/10 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> ফাইল পরিবর্তন করুন
                    </button>
                  </div>

                  {/* Exam Title (Auto-set from filename, editable if needed) */}
                  <div>
                    <label className="block text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-1 font-mono">
                      পরীক্ষার নাম (EXAM TITLE - ফাইলের নাম অনুযায়ী স্বয়ংক্রিয়ভাবে নির্ধারিত):
                    </label>
                    <input
                      type="text"
                      value={uploadedFileTitle}
                      onChange={(e) => setUploadedFileTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-siliguri font-bold focus:outline-none shadow-sm"
                      placeholder="e.g. উদ্ভিদবিজ্ঞান স্পেশাল মডেল টেস্ট"
                    />
                  </div>

                  {/* Sample Questions Preview */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-bold uppercase tracking-wider">
                        আপলোডকৃত প্রশ্ন প্রিভিউ (মোট {uploadedQuestions.length}টির মধ্যে প্রথম ৩টি):
                      </span>
                      <span className="font-mono text-emerald-400">
                        {uploadedQuestions.length} Questions Ready
                      </span>
                    </div>

                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {uploadedQuestions.slice(0, 3).map((q, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-white/5 text-xs space-y-1.5">
                          <p className="font-bold text-white font-siliguri leading-snug">
                            #{idx + 1}. {q.q}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px] font-siliguri">
                            <span>(ক) {q.a}</span>
                            <span>(খ) {q.b}</span>
                            <span>(গ) {q.c}</span>
                            <span>(ঘ) {q.d}</span>
                          </div>
                          <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-2">
                            <span className="bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                              সঠিক উত্তর: ({q.ans.toUpperCase()})
                            </span>
                            <span className="text-slate-400 truncate">{q.exp}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: JSON FORMAT INPUT */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>JSON প্রশ্ন অ্যারে পেস্ট অথবা এডিট করুন [&#123; q, a, b, c, d, ans, exp &#125;]:</span>
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
              onChange={(e) => setSelectedCat(e.target.value)}
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
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <h4 className="text-base font-bold text-white font-siliguri">পরীক্ষা শুরু করতে প্রস্তুত?</h4>
          <p className="text-xs text-slate-400">
            {activeMode === 'blend' 
              ? (selectedExamCodes.length === 0 
                  ? 'অনুগ্রহ করে উপরের ড্রপডাউন থেকে আপনার পছন্দমতো চ্যাপ্টার নির্বাচন করুন।' 
                  : `১১৪ টি সেটের মধ্যে ${selectedExamCodes.length} টি সেট থেকে ${qCount} টি প্রশ্ন শাফেল করা হবে (${duration} মিনিট)।`)
              : activeMode === 'manual' && manualInputMode === 'upload'
              ? (uploadedQuestions.length > 0 
                  ? `"${uploadedFileTitle}" পরীক্ষায় ${uploadedQuestions.length}টি প্রশ্ন রয়েছে (${Math.ceil((uploadedQuestions.length * 30)/60)} মিনিট)।`
                  : 'পরীক্ষা শুরু করতে অনুগ্রহ করে প্রথমে একটি .txt ফাইল আপলোড করুন।')
              : `${qCount} টি প্রশ্ন ও ${duration} মিনিট সময়সীমা নির্ধারিত হয়েছে।`}
          </p>
        </div>

        <button
          onClick={handleLaunchExam}
          disabled={
            loadingBlend || 
            (activeMode === 'blend' && selectedExamCodes.length === 0) || 
            (activeMode === 'manual' && manualInputMode === 'upload' && uploadedQuestions.length === 0)
          }
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4 fill-current" /> Start Examination
        </button>
      </div>

    </div>
  );
};
