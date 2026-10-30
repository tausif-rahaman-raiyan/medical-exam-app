import React, { useState, useMemo } from 'react';
import { SubjectCategory, ExamItem } from '../types/exam';
import { subjectData } from '../data/subjectData';
import { Search, ChevronDown, BookOpen, Clock, ListChecks, Scale, Eye, Play, Sparkles, Target, Layers3, TrendingUp, X } from 'lucide-react';

interface CatalogViewProps {
  onStartExam: (exam: ExamItem) => void;
  onPreviewExam: (exam: ExamItem) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({ onStartExam, onPreviewExam }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openSubjectIndex, setOpenSubjectIndex] = useState<number | null>(null);

  // Category filters list
  const categoryFilters = [
    { id: 'all', label: 'All Subjects' },
    { id: 'উদ্ভিদবিজ্ঞান', label: 'Botany (উদ্ভিদবিজ্ঞান)' },
    { id: 'প্রাণিবিজ্ঞান', label: 'Zoology (প্রাণিবিজ্ঞান)' },
    { id: 'পদার্থবিজ্ঞান প্রথম পত্র', label: 'Physics 1st' },
    { id: 'পদার্থবিজ্ঞান দ্বিতীয় পত্র', label: 'Physics 2nd' },
    { id: 'রসায়ন প্রথম পত্র', label: 'Chemistry 1st' },
    { id: 'রসায়ন দ্বিতীয় পত্র', label: 'Chemistry 2nd' },
    { id: 'সাধারণ জ্ঞান', label: 'General Knowledge' },
    { id: 'ইংরেজি', label: 'English' },
    { id: 'সাবজেক্ট ফাইনাল', label: 'Subject Finals' },
    { id: 'পূর্ণাঙ্গ মডেল টেস্ট', label: 'Full Model Tests' },
    { id: 'বিগত ১২ বছরের মেডিকেল প্রশ্ন', label: 'Past 12 Years' }
  ];

  // Filter subject data based on search and selected category filter
  const filteredSubjects = useMemo(() => {
    let result = subjectData;

    // Filter by Category
    if (activeCategory !== 'all') {
      result = result.filter(s => s.cat === activeCategory || s.cat.includes(activeCategory));
    }

    // Filter by Search
    const q = searchQuery.trim().toLowerCase();
    if (!q) return result;

    return result
      .map(sub => {
        const catMatch = sub.cat.toLowerCase().includes(q);
        const matchingItems = sub.items.filter(item => 
          item.t.toLowerCase().includes(q) ||
          item.c.toLowerCase().includes(q) ||
          catMatch
        );

        if (matchingItems.length > 0) {
          return {
            ...sub,
            items: matchingItems
          };
        }
        return null;
      })
      .filter((s): s is SubjectCategory => s !== null);
  }, [searchQuery, activeCategory]);

  const totalExams = subjectData.reduce((total, subject) => total + subject.items.length, 0);
  const filteredExamCount = filteredSubjects.reduce((total, subject) => total + subject.items.length, 0);

  const toggleAccordion = (index: number) => {
    setOpenSubjectIndex(prev => (prev === index ? null : index));
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 space-y-6">
      
      {/* Dashboard Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-purple-950/80 to-slate-900 border border-purple-500/30 p-5 sm:p-8 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold mb-3 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Complete medical preparation hub
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white font-siliguri leading-tight tracking-tight">
              মেডিকেল ভর্তি পরীক্ষা প্রস্তুতি প্ল্যাটফর্ম
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 font-siliguri leading-relaxed max-w-2xl">
              অধ্যায়ভিত্তিক মক টেস্ট, সাবজেক্ট ফাইনাল ও পূর্ণাঙ্গ মডেল টেস্ট—সবকিছু এক জায়গায় সাজানো।
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:min-w-[360px]">
            <div className="rounded-2xl bg-slate-950/70 border border-white/10 p-3">
              <Layers3 className="w-4 h-4 text-purple-400 mb-2" />
              <p className="text-lg sm:text-xl font-black text-white font-mono">{totalExams}</p>
              <p className="text-[10px] text-slate-400 font-semibold">Exam sets</p>
            </div>
            <div className="rounded-2xl bg-slate-950/70 border border-white/10 p-3">
              <BookOpen className="w-4 h-4 text-cyan-400 mb-2" />
              <p className="text-lg sm:text-xl font-black text-white font-mono">{subjectData.length}</p>
              <p className="text-[10px] text-slate-400 font-semibold">Subjects</p>
            </div>
            <div className="rounded-2xl bg-slate-950/70 border border-white/10 p-3">
              <Target className="w-4 h-4 text-emerald-400 mb-2" />
              <p className="text-lg sm:text-xl font-black text-white font-mono">100</p>
              <p className="text-[10px] text-slate-400 font-semibold">MCQs / test</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-6 max-w-3xl">
          <label htmlFor="exam-search" className="sr-only">Search exams</label>
          <div className="relative">
            <Search className="w-5 h-5 text-purple-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="exam-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by chapter, topic title, or exam code..."
              className="w-full bg-slate-950/90 border border-purple-500/40 rounded-2xl pl-12 pr-12 py-3.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/60 shadow-xl transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Catalog Controls */}
      <section className="space-y-3" aria-label="Exam filters">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-300">Question bank</p>
            <h2 className="text-lg sm:text-xl font-black text-white mt-1">Choose a subject to begin</h2>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Showing <span className="font-bold text-slate-200">{filteredExamCount}</span> of {totalExams} exam sets
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categoryFilters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveCategory(filter.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                activeCategory === filter.id
                  ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-900/40'
                  : 'bg-slate-900/80 text-slate-300 border-white/10 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {/* Accordion List of Subjects */}
      <div className="space-y-3">
        {filteredSubjects.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-white/10 shadow-xl">
            <Search className="w-8 h-8 text-purple-400/40 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No matching exams found</h3>
            <p className="text-xs text-slate-400 mt-1">Try searching by topic, chapter code (e.g. 1020325001), or title</p>
          </div>
        ) : (
          filteredSubjects.map((subject, subjectIdx) => {
            const isOpen = openSubjectIndex === subjectIdx || Boolean(searchQuery.trim());

            return (
              <div
                key={subject.cat}
                className="bg-gradient-to-br from-slate-900 via-[#0F172A] to-slate-950 rounded-2xl sm:rounded-3xl border border-white/10 shadow-xl overflow-hidden transition-all hover:border-purple-500/30"
              >
                {/* Accordion Header */}
                <button
                  onClick={() => toggleAccordion(subjectIdx)}
                  className="w-full p-4 sm:p-5 font-bold flex justify-between items-center gap-3 text-white hover:bg-purple-950/20 transition-colors text-left"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br ${subject.color || 'from-purple-600 to-indigo-600'} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                      <i className={`fa ${subject.icon || 'fa-book-medical'} text-base`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="text-base sm:text-lg font-black block text-slate-100 leading-snug font-siliguri">
                        {subject.cat}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 block mt-0.5">
                        {subject.items.length} topics available · 100 MCQs per exam
                      </span>
                      <div className="mt-2 inline-flex flex-wrap items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-700/60 text-purple-200">
                        <span>100 Questions</span>
                        <span className="text-purple-400">•</span>
                        <span>50 Minutes</span>
                        <span className="text-purple-400">•</span>
                        <span>-0.25 Negative Marking</span>
                      </div>
                    </div>
                  </div>

                  <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex-shrink-0">
                    <ChevronDown className={`w-4 h-4 text-purple-300 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </span>
                </button>

                {/* Accordion Content */}
                {isOpen && (
                  <div className="p-3 sm:p-4 space-y-2 border-t border-white/5 bg-slate-900/50">
                    {subject.items.map((item) => (
                      <div
                        key={item.c}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#1E293B] to-slate-900 border border-white/10 hover:border-purple-500/50 hover:bg-[#243248] transition-all gap-3 shadow-sm"
                      >
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm sm:text-base font-black text-white leading-snug font-siliguri mb-1.5">
                            {item.t}
                          </span>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
                            <span className="text-[10px] text-purple-200 font-mono font-black uppercase tracking-wider bg-purple-950/90 border border-purple-600/50 px-2 py-0.5 rounded-lg">
                              Code: {item.c}
                            </span>
                            <span className="text-slate-300 font-semibold flex items-center gap-1">
                              <ListChecks className="w-3.5 h-3.5 text-purple-400" /> 100 Questions
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-300 font-semibold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-cyan-400" /> 50 Mins
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-amber-300 font-bold bg-amber-950/50 border border-amber-500/40 px-2 py-0.5 rounded-lg flex items-center gap-1">
                              <Scale className="w-3.5 h-3.5 text-amber-400" /> Full Marks: 100 (-0.25 Neg)
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
                          <button
                            onClick={() => onPreviewExam(item)}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-white/10 flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5 text-purple-400" /> Preview
                          </button>
                          <button
                            onClick={() => onStartExam(item)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-900/40 transition-all flex items-center justify-center gap-1.5 transform active:scale-95"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" /> Start Exam
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
