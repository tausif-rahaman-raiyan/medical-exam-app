import React, { useEffect, useState } from 'react';
import { ExamItem, Question } from '../types/exam';
import { loadExamQuestions } from '../utils/questionFetcher';
import { X, Play, FileText, Clock, AlertTriangle, Loader2 } from 'lucide-react';

interface PreviewModalProps {
  examItem: ExamItem | null;
  onClose: () => void;
  onStartExam: (exam: ExamItem) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ examItem, onClose, onStartExam }) => {
  const [samples, setSamples] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!examItem) return;
    let isMounted = true;
    setLoading(true);

    loadExamQuestions(examItem)
      .then((qs) => {
        if (isMounted) {
          setSamples(qs.slice(0, 3));
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [examItem]);

  if (!examItem) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-white/10 flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-purple-400 uppercase bg-purple-950/80 border border-purple-500/40 px-2.5 py-1 rounded-lg inline-block mb-1">
              Code: {examItem.c}
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white font-siliguri leading-snug">
              {examItem.t}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Exam Specifications */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-900/60 border-b border-white/5 text-center">
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/5">
            <FileText className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <div className="text-xs font-bold text-white">100 MCQs</div>
            <div className="text-[10px] text-slate-400">Total Questions</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/5">
            <Clock className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <div className="text-xs font-bold text-white">50 Minutes</div>
            <div className="text-[10px] text-slate-400">Duration Limit</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/5">
            <AlertTriangle className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <div className="text-xs font-bold text-white">-0.25</div>
            <div className="text-[10px] text-slate-400">Negative Mark</div>
          </div>
        </div>

        {/* Content Body: Sample Questions */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
            Sample Question Preview (First 3 Questions)
          </h4>

          {loading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
              <span className="text-xs">Loading sample questions & scientific models...</span>
            </div>
          ) : samples.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950 text-xs text-slate-400 text-center">
              100 Standard Medical Admission MCQs formatted with in-depth answers & explanations.
            </div>
          ) : (
            samples.map((q, idx) => (
              <div key={q.id} className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-3">
                <p 
                  className="text-xs sm:text-sm font-bold text-slate-100 font-siliguri leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: `#${idx + 1}. ${q.q}` }}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-900 border border-white/5 flex items-start gap-1.5">
                    <strong className="text-purple-400">(ক)</strong>
                    <span dangerouslySetInnerHTML={{ __html: q.a }} />
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-white/5 flex items-start gap-1.5">
                    <strong className="text-purple-400">(খ)</strong>
                    <span dangerouslySetInnerHTML={{ __html: q.b }} />
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-white/5 flex items-start gap-1.5">
                    <strong className="text-purple-400">(গ)</strong>
                    <span dangerouslySetInnerHTML={{ __html: q.c }} />
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-white/5 flex items-start gap-1.5">
                    <strong className="text-purple-400">(ঘ)</strong>
                    <span dangerouslySetInnerHTML={{ __html: q.d }} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onStartExam(examItem);
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-purple-900/40 transition-all transform active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Start Full Exam
          </button>
        </div>

      </div>
    </div>
  );
};
