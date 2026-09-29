/**
 * Medical Secret Files - Core In-Exam Single Page Engine
 * Large Crisp Typography • 1-Click Lock Rule • Negative Marking Allowed
 * Standard Box Spacing • Full-Width Zero-Margin Layout
 */

(function (global) {
  'use strict';

  const STORAGE_KEY_RESULTS = 'msf_exam_history_v2';

  const ExamState = {
    active: false,
    examData: null,
    questions: [],
    userAnswers: {},
    timeRemaining: 0,
    totalTimeSpent: 0,
    timerId: null,
    mode: 'card', // 'card' or 'omr'
    isSubmitted: false,
    activeQuestionIndex: 0
  };

  /**
   * Launch Exam from Local or Remote URL
   */
  async function launchExam(examItem) {
    if (!examItem) return;

    // Reset Exam State
    clearInterval(ExamState.timerId);
    ExamState.active = true;
    ExamState.examData = examItem;
    ExamState.questions = [];
    ExamState.userAnswers = {};
    ExamState.isSubmitted = false;
    ExamState.totalTimeSpent = 0;
    ExamState.activeQuestionIndex = 0;
    ExamState.mode = 'card';

    // Show Exam View & Hide Home View
    const homeView = document.getElementById('home-view');
    const examView = document.getElementById('exam-view');
    const creatorView = document.getElementById('creator-view');
    const mainContainer = document.querySelector('main');

    if (homeView) homeView.classList.add('hidden');
    if (creatorView) creatorView.classList.add('hidden');
    if (examView) examView.classList.remove('hidden');
    if (mainContainer) mainContainer.classList.add('exam-active-fullwidth');

    window.scrollTo({ top: 0, behavior: 'instant' });

    // Show Loading
    const container = document.getElementById('exam-render-container');
    if (container) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center min-h-[60vh] py-16 text-center w-full">
          <div class="w-16 h-16 rounded-3xl bg-purple-900/40 border border-purple-500/40 flex items-center justify-center mb-4 animate-pulse">
            <i class="fa fa-stethoscope text-2xl text-purple-400"></i>
          </div>
          <h2 class="text-xl sm:text-2xl font-black text-white mb-2">Preparing ${examItem.t || examItem.title || 'Medical Exam'}</h2>
          <p class="text-sm text-slate-400">Loading 100 high-yield questions & scientific models...</p>
        </div>
      `;
    }

    try {
      if (examItem.customQuestions && Array.isArray(examItem.customQuestions)) {
        ExamState.questions = examItem.customQuestions;
      } else if (examItem.url) {
        const res = await fetch(examItem.url);
        if (!res.ok) throw new Error('Exam file fetch error: ' + res.status);
        const html = await res.text();
        const regex = /(?:var|const|let)\s+questions\s*=\s*(\[[\s\S]*?\]);/m;
        const match = html.match(regex);
        if (match && match[1]) {
          const parsed = new Function('return ' + match[1])();
          ExamState.questions = normalizeQuestions(parsed);
        } else {
          throw new Error('Questions array regex not found in HTML');
        }
      } else {
        ExamState.questions = generateFallbackQuestions(examItem.t || examItem.title || 'Medical Test');
      }
    } catch (err) {
      console.warn('Fallback generator activated:', err);
      ExamState.questions = generateFallbackQuestions(examItem.t || examItem.title || 'Medical Test');
    }

    // Set Timer: 30 seconds per question
    const qCount = ExamState.questions.length || 100;
    ExamState.timeRemaining = qCount * 30;

    renderActiveExamInterface();
    startTimer();
    attachKeyboardShortcuts();
  }

  function normalizeQuestions(rawList) {
    const fmt = global.cleanAndFormatScience || ((s) => s);
    return rawList.map((item, index) => {
      let q = item.q || item.question || `প্রশ্ন #${index + 1}`;
      let a = item.a || (item.options && item.options[0]?.text) || 'অপশন ক';
      let b = item.b || (item.options && item.options[1]?.text) || 'অপশন খ';
      let c = item.c || (item.options && item.options[2]?.text) || 'অপশন গ';
      let d = item.d || (item.options && item.options[3]?.text) || 'অপশন ঘ';
      let ans = item.ans || item.answer || 'a';
      if (typeof ans === 'number') ans = ['a', 'b', 'c', 'd'][ans] || 'a';
      ans = String(ans).toLowerCase().trim()[0] || 'a';

      let exp = item.exp || item.explanation || `রেফারেন্স: মেডিকেল ভর্তি প্রশ্নব্যাংক ও এইচএসসি পাঠ্যবই। কনসেপ্ট: প্রশ্ন #${index + 1} এর তথ্য ও যৌক্তিকতা মেডিকেল কারিকুলাম অনুসারে সাজানো।`;

      return {
        id: index + 1,
        q: fmt(q),
        a: fmt(a),
        b: fmt(b),
        c: fmt(c),
        d: fmt(d),
        ans: ans,
        exp: exp
      };
    });
  }

  function generateFallbackQuestions(title) {
    const fmt = global.cleanAndFormatScience || ((s) => s);
    const list = [];
    for (let i = 1; i <= 100; i++) {
      list.push({
        id: i,
        q: fmt(`[${title}] প্রশ্ন #${i}: নিম্নের কোন তথ্যটি মেডিকেল পরীক্ষার ক্ষেত্রে সর্বাধিক নির্ভুল ও প্রযোজ্য?`),
        a: fmt('অপশন ক: প্রধান জৈবিক ও রাসায়নিক ক্রিয়াকলাপের সঠিক নির্দেশক।'),
        b: fmt('অপশন খ: পর্যায়বৃত্ত ধর্ম ও তাপগতীয় নিয়ম পরিপূর্ণভাবে মেনে চলে।'),
        c: fmt('অপশন গ: এনজাইম ও অনুঘটকীয় প্রভাবে দ্রুত শারীরবৃত্তীয় বিক্রিয়া ঘটায়।'),
        d: fmt('অপশন ঘ: কোষীয় গঠন ও মেটাবলিজমে সুনির্দিষ্ট সহায়তা প্রদান করে।'),
        ans: ['a', 'b', 'c', 'd'][(i - 1) % 4],
        exp: `রেফারেন্স: মেডিকেল ভর্তি প্রশ্নব্যাংক ও মূল পাঠ্যবই। কনসেপ্ট: প্রশ্ন #${i} এর তথ্য ও যৌক্তিকতা মেডিকেল কারিকুলাম অনুসারে সাজানো।`
      });
    }
    return list;
  }

  /**
   * Render Active Exam Screen (Full-Width, Large Fonts, Standard Spacing)
   */
  function renderActiveExamInterface() {
    const container = document.getElementById('exam-render-container');
    if (!container) return;

    const examTitle = ExamState.examData?.t || ExamState.examData?.title || 'Medical Examination';
    const examCat = ExamState.examData?.cat || ExamState.examData?.category || 'Medical';
    const examCode = ExamState.examData?.c || ExamState.examData?.code || '1020325001';

    container.innerHTML = `
      <!-- Sticky Command Header -->
      <div class="sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur-md border-b border-white/10 py-3 mb-6 w-full">
        <div class="flex flex-wrap items-center justify-between gap-3 w-full">
          <!-- Left: Title and Exam info -->
          <div class="flex items-center gap-3 min-w-0">
            <button onclick="window.ExamEngine.confirmExit()" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all">
              <i class="fa fa-arrow-left"></i> Exit
            </button>
            <div class="min-w-0">
              <h2 class="text-base sm:text-lg md:text-xl font-black text-white truncate">${examTitle}</h2>
              <p class="text-xs text-slate-400 font-mono flex items-center gap-2 truncate">
                <span class="text-purple-400 font-semibold">${examCat}</span> • Code: ${examCode}
              </p>
            </div>
          </div>

          <!-- Middle & Right Controls -->
          <div class="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <!-- Mode Switcher -->
            <div class="flex items-center bg-slate-900 border border-white/10 rounded-xl p-1">
              <button id="btn-mode-card" onclick="window.ExamEngine.setMode('card')" class="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all ${ExamState.mode === 'card' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}">
                <i class="fa fa-layer-group mr-1"></i> Quiz Mode
              </button>
              <button id="btn-mode-omr" onclick="window.ExamEngine.setMode('omr')" class="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all ${ExamState.mode === 'omr' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}">
                <i class="fa fa-circle-dot mr-1"></i> OMR Mode
              </button>
            </div>

            <!-- Timer Badge -->
            <div class="px-3 py-1.5 rounded-xl bg-slate-900 border border-purple-500/40 text-purple-300 font-mono font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-inner">
              <i class="fa fa-stopwatch text-purple-400 animate-pulse"></i>
              <span id="exam-live-timer">00:00</span>
            </div>

            <!-- Submit Button -->
            <button onclick="window.ExamEngine.confirmSubmit()" class="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-emerald-950/50 transition-all flex items-center gap-1.5">
              <i class="fa fa-paper-plane"></i> Submit
            </button>
          </div>
        </div>

        <!-- Progress Bar & Answered Counter -->
        <div class="mt-3 flex items-center justify-between gap-4 text-xs font-semibold text-slate-300">
          <div class="flex-1 bg-slate-900 rounded-full h-2 overflow-hidden border border-white/5">
            <div id="exam-progress-bar" class="bg-gradient-to-r from-purple-500 to-emerald-400 h-full transition-all duration-300" style="width: 0%"></div>
          </div>
          <span id="header-answered-stat" class="flex-shrink-0 text-slate-300 font-mono">
            Answered: <strong class="text-emerald-400 font-bold">0</strong>/${ExamState.questions.length}
          </span>
        </div>
      </div>

      <!-- 2-Column Responsive Layout: Left Questions, Right Sticky Palette -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
        
        <!-- Left Column: Main Questions Stream -->
        <div class="lg:col-span-8 xl:col-span-8 space-y-6 pb-20">
          <div id="questions-stream" class="space-y-6 w-full">
            ${renderQuestionsList()}
          </div>
        </div>

        <!-- Right Column: Sticky Question Navigation Palette (1-100) -->
        <div class="lg:col-span-4 xl:col-span-4 lg:sticky lg:top-24 space-y-4">
          <div class="bg-[#1E293B] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div class="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div>
                <h3 class="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                  <i class="fa fa-table-cells text-purple-400"></i> Question Palette (1-100)
                </h3>
                <p class="text-[10px] text-slate-400 mt-0.5">1-Click Lock • Negative (-0.25)</p>
              </div>
              <span class="px-2 py-0.5 rounded-lg bg-slate-900 text-purple-300 font-mono text-[11px] font-bold">
                100 MCQs
              </span>
            </div>

            <!-- Legend Indicators -->
            <div class="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-300 mb-3.5 pb-3 border-b border-white/5">
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-md bg-emerald-600 inline-block"></span>
                <span>Answered</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-md bg-slate-800 border border-white/10 inline-block"></span>
                <span>Unattempted</span>
              </div>
            </div>

            <!-- Palette Number Buttons Grid -->
            <div id="exam-nav-palette" class="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-1.5 max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin">
              ${renderPaletteButtons()}
            </div>
          </div>
        </div>

      </div>
    `;

    updateTimerDisplay();
  }

  /**
   * Render Questions List (Large Fonts, 2-Line / 2-Column Options Layout)
   */
  function renderQuestionsList() {
    return ExamState.questions.map((q, idx) => {
      const selected = ExamState.userAnswers[idx];
      const isLocked = selected !== undefined && selected !== null;

      if (ExamState.mode === 'card') {
        // Quiz Card Mode (Default) - 2-Column / 2-Line Options Grid
        return `
          <div id="q-card-${idx}" class="question-card bg-[#1E293B] border ${isLocked ? 'border-purple-500/50 shadow-purple-900/10' : 'border-white/10'} rounded-2xl p-5 sm:p-7 transition-all shadow-lg w-full mb-6">
            <div class="flex items-center justify-between mb-3.5">
              <span class="px-3 py-1 rounded-xl bg-purple-950/90 border border-purple-600/50 text-purple-200 text-xs font-black font-mono tracking-wider">
                QUESTION #${q.id}
              </span>
              <span class="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLocked ? 'text-emerald-400' : 'text-slate-500'}">
                ${isLocked ? '<i class="fa fa-lock text-emerald-400"></i> Locked' : '<i class="fa fa-circle text-slate-600"></i> Unattempted'}
              </span>
            </div>

            <!-- Standard Large Crisp Question Typography -->
            <p class="text-base sm:text-lg md:text-xl font-bold text-slate-100 leading-relaxed mb-5 font-siliguri">${q.q}</p>

            <!-- 2-Line 2-Column Options Grid (A & B on line 1, C & D on line 2) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              ${['a', 'b', 'c', 'd'].map(opt => {
                const isSelected = selected === opt;
                let btnStyle = 'bg-slate-900/80 border-white/10 text-slate-200 hover:border-purple-500/50 hover:bg-slate-900 cursor-pointer';

                if (isLocked) {
                  if (isSelected) {
                    btnStyle = 'bg-purple-600/30 border-purple-500 text-white font-bold cursor-not-allowed shadow-md ring-2 ring-purple-500/40';
                  } else {
                    btnStyle = 'bg-slate-900/40 border-white/5 text-slate-500 opacity-60 cursor-not-allowed';
                  }
                }

                return `
                  <button ${isLocked ? 'disabled' : `onclick="window.ExamEngine.selectOption(${idx}, '${opt}')"`} class="w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-center justify-between ${btnStyle}">
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                      <span class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${isSelected ? 'bg-purple-600 text-white font-black shadow-md' : 'bg-slate-800 text-slate-400'}">
                        ${opt.toUpperCase()}
                      </span>
                      <span class="text-sm sm:text-base font-medium break-words leading-relaxed text-slate-100 font-siliguri">${q[opt]}</span>
                    </div>
                    ${isSelected ? '<i class="fa fa-circle-check text-purple-400 text-base ml-2 flex-shrink-0"></i>' : '<i class="fa fa-circle text-slate-700 text-xs ml-2 flex-shrink-0"></i>'}
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        `;
      } else {
        // OMR Bubble Sheet Mode
        return `
          <div id="q-card-${idx}" class="question-card bg-[#1E293B] border ${isLocked ? 'border-purple-500/50' : 'border-white/10'} rounded-2xl p-5 sm:p-6 transition-all shadow-lg w-full mb-6">
            <div class="flex items-start gap-3.5">
              <span class="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-900/70 border border-purple-500/40 text-purple-300 font-mono font-bold text-sm flex items-center justify-center">
                ${q.id}
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-base sm:text-lg font-bold text-slate-100 leading-relaxed mb-3.5 font-siliguri">${q.q}</p>
                
                <!-- 2-Line 2-Column Options Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4 text-sm sm:text-base text-slate-200">
                  <div class="p-3 rounded-xl bg-slate-900/80 border border-white/5"><span class="font-black text-purple-400 mr-2">(A)</span> ${q.a}</div>
                  <div class="p-3 rounded-xl bg-slate-900/80 border border-white/5"><span class="font-black text-purple-400 mr-2">(B)</span> ${q.b}</div>
                  <div class="p-3 rounded-xl bg-slate-900/80 border border-white/5"><span class="font-black text-purple-400 mr-2">(C)</span> ${q.c}</div>
                  <div class="p-3 rounded-xl bg-slate-900/80 border border-white/5"><span class="font-black text-purple-400 mr-2">(D)</span> ${q.d}</div>
                </div>

                <!-- OMR Bubbles Row -->
                <div class="flex items-center justify-between sm:justify-start sm:gap-6 pt-3 border-t border-white/5">
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <i class="fa fa-fingerprint text-purple-400 text-sm"></i> ${isLocked ? 'Locked Bubble:' : 'Fill Bubble:'}
                  </span>
                  <div class="flex items-center gap-2.5 sm:gap-4">
                    ${['a', 'b', 'c', 'd'].map(opt => {
                      const isSelected = selected === opt;
                      let bubbleClass = 'bg-slate-900 border-slate-600 text-slate-300 hover:border-purple-400';
                      if (isLocked) {
                        if (isSelected) {
                          bubbleClass = 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-900/60 scale-105 ring-2 ring-purple-400/50';
                        } else {
                          bubbleClass = 'bg-slate-950 border-slate-800 text-slate-600 opacity-50 cursor-not-allowed';
                        }
                      }
                      return `
                        <button ${isLocked ? 'disabled' : `onclick="window.ExamEngine.selectOption(${idx}, '${opt}')"`} class="omr-bubble flex items-center justify-center focus:outline-none">
                          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 transition-all flex items-center justify-center font-black text-sm ${bubbleClass}">
                            ${opt.toUpperCase()}
                          </div>
                        </button>
                      `;
                    }).join('')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }
    }).join('');
  }

  function renderPaletteButtons() {
    return ExamState.questions.map((_, idx) => {
      const isAns = ExamState.userAnswers[idx] !== undefined && ExamState.userAnswers[idx] !== null;
      return `
        <button id="pal-btn-${idx}" onclick="window.ExamEngine.scrollToQuestion(${idx})" class="w-full py-1.5 rounded-lg font-mono font-black text-xs transition-all flex items-center justify-center ${isAns ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}">
          ${idx + 1}
        </button>
      `;
    }).join('');
  }

  /**
   * 1-Click Lock Selection
   */
  function selectOption(qIndex, optionKey) {
    if (ExamState.isSubmitted) return;
    if (ExamState.userAnswers[qIndex] !== undefined) return;

    ExamState.userAnswers[qIndex] = optionKey;
    ExamState.activeQuestionIndex = qIndex;

    const card = document.getElementById(`q-card-${qIndex}`);
    if (card) {
      const stream = document.getElementById('questions-stream');
      if (stream) {
        const temp = document.createElement('div');
        temp.innerHTML = renderQuestionsList();
        const updated = temp.querySelector(`#q-card-${qIndex}`);
        if (updated) card.replaceWith(updated);
      }
    }

    updateHeaderStats();
    updatePaletteButton(qIndex);
  }

  function updateHeaderStats() {
    const answeredCount = Object.keys(ExamState.userAnswers).length;
    const totalQ = ExamState.questions.length;
    const statEl = document.getElementById('header-answered-stat');
    const barEl = document.getElementById('exam-progress-bar');
    if (statEl) statEl.innerHTML = `Answered: <strong class="text-emerald-400 font-bold">${answeredCount}</strong>/${totalQ}`;
    if (barEl) barEl.style.width = `${(answeredCount / totalQ) * 100}%`;
  }

  function updatePaletteButton(idx) {
    const btn = document.getElementById(`pal-btn-${idx}`);
    if (!btn) return;
    const isAns = ExamState.userAnswers[idx] !== undefined && ExamState.userAnswers[idx] !== null;
    btn.className = `flex-shrink-0 w-8 sm:w-9 h-8 sm:h-9 rounded-xl font-mono font-black text-xs transition-all flex items-center justify-center ${isAns ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`;
  }

  function scrollToQuestion(idx) {
    ExamState.activeQuestionIndex = idx;
    const card = document.getElementById(`q-card-${idx}`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('ring-2', 'ring-purple-400');
      setTimeout(() => card.classList.remove('ring-2', 'ring-purple-400'), 1500);
    }
  }

  function setMode(mode) {
    ExamState.mode = mode;
    const btnCard = document.getElementById('btn-mode-card');
    const btnOmr = document.getElementById('btn-mode-omr');
    if (btnCard && btnOmr) {
      if (mode === 'card') {
        btnCard.className = 'px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all bg-purple-600 text-white shadow-md';
        btnOmr.className = 'px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all text-slate-400 hover:text-white';
      } else {
        btnOmr.className = 'px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all bg-purple-600 text-white shadow-md';
        btnCard.className = 'px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all text-slate-400 hover:text-white';
      }
    }
    const stream = document.getElementById('questions-stream');
    if (stream) stream.innerHTML = renderQuestionsList();
  }

  function startTimer() {
    clearInterval(ExamState.timerId);
    ExamState.timerId = setInterval(() => {
      if (ExamState.timeRemaining <= 0) {
        clearInterval(ExamState.timerId);
        submitExam(true);
        return;
      }
      ExamState.timeRemaining--;
      ExamState.totalTimeSpent++;
      updateTimerDisplay();
    }, 1000);
  }

  function updateTimerDisplay() {
    const el = document.getElementById('exam-live-timer');
    if (!el) return;
    const mins = Math.floor(ExamState.timeRemaining / 60);
    const secs = ExamState.timeRemaining % 60;
    el.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    if (ExamState.timeRemaining <= 300) {
      el.parentElement?.classList.add('border-rose-500/80', 'text-rose-400');
    }
  }

  /**
   * Keyboard Shortcuts (Desktop & Windows app)
   */
  function attachKeyboardShortcuts() {
    detachKeyboardShortcuts();
    window.addEventListener('keydown', handleExamKeydown);
  }

  function detachKeyboardShortcuts() {
    window.removeEventListener('keydown', handleExamKeydown);
  }

  function handleExamKeydown(e) {
    if (!ExamState.active || ExamState.isSubmitted) return;
    const key = e.key.toLowerCase();
    const cur = ExamState.activeQuestionIndex;

    if (['a', 'b', 'c', 'd'].includes(key)) {
      selectOption(cur, key);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (cur < ExamState.questions.length - 1) scrollToQuestion(cur + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      if (cur > 0) scrollToQuestion(cur - 1);
    }
  }

  function confirmSubmit() {
    const answeredCount = Object.keys(ExamState.userAnswers).length;
    const totalQ = ExamState.questions.length;
    const modalHtml = `
      <div id="confirm-submit-modal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-[#1E293B] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
          <div class="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-3 text-xl">
            <i class="fa fa-circle-check"></i>
          </div>
          <h3 class="text-lg font-black text-white mb-1">Submit Exam?</h3>
          <p class="text-xs text-slate-400 mb-4">You have completed <strong>${answeredCount}</strong> of <strong>${totalQ}</strong> questions.</p>
          <div class="flex gap-3">
            <button onclick="document.getElementById('confirm-submit-modal').remove()" class="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Resume</button>
            <button onclick="document.getElementById('confirm-submit-modal').remove(); window.ExamEngine.submitExam()" class="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs">Confirm Submit</button>
          </div>
        </div>
      </div>
    `;
    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div.firstElementChild);
  }

  function confirmExit() {
    const modalHtml = `
      <div id="confirm-exit-modal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-[#1E293B] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
          <div class="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mb-3 text-xl">
            <i class="fa fa-triangle-exclamation"></i>
          </div>
          <h3 class="text-lg font-black text-white mb-1">Exit Exam?</h3>
          <p class="text-xs text-slate-400 mb-5">Your current progress will be lost if not submitted.</p>
          <div class="flex gap-3">
            <button onclick="document.getElementById('confirm-exit-modal').remove()" class="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Stay</button>
            <button onclick="document.getElementById('confirm-exit-modal').remove(); window.ExamEngine.exitExam()" class="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs">Exit</button>
          </div>
        </div>
      </div>
    `;
    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div.firstElementChild);
  }

  /**
   * Final Score Calculation (Allows Negative Score)
   */
  function submitExam(isAuto = false) {
    clearInterval(ExamState.timerId);
    ExamState.isSubmitted = true;

    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    const details = [];

    ExamState.questions.forEach((q, idx) => {
      const userAns = ExamState.userAnswers[idx];
      const correctAns = q.ans.toLowerCase();

      if (!userAns) {
        skippedCount++;
        details.push({ id: q.id, status: 'skipped', user: '', correct: correctAns, q: q });
      } else if (userAns.toLowerCase() === correctAns) {
        correctCount++;
        details.push({ id: q.id, status: 'correct', user: userAns, correct: correctAns, q: q });
      } else {
        wrongCount++;
        details.push({ id: q.id, status: 'wrong', user: userAns, correct: correctAns, q: q });
      }
    });

    const totalQuestions = ExamState.questions.length;
    const positiveMarks = correctCount * 1.0;
    const negativeMarks = wrongCount * 0.25;
    const computedScore = Number((positiveMarks - negativeMarks).toFixed(2));
    const totalAttempted = correctCount + wrongCount;
    const accuracy = totalAttempted > 0 ? ((correctCount / totalAttempted) * 100).toFixed(1) : '0.0';

    const resultPayload = {
      examId: ExamState.examData?.c || ExamState.examData?.code || '1020325001',
      topicName: ExamState.examData?.t || ExamState.examData?.title || 'Medical Exam',
      category: ExamState.examData?.cat || ExamState.examData?.category || 'Medical',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      score: computedScore,
      correctCount,
      wrongCount,
      skippedCount,
      totalQuestions,
      accuracy: accuracy + '%',
      timeSpentSeconds: ExamState.totalTimeSpent
    };

    saveExamResult(resultPayload);
    renderResultsView(resultPayload, details);

    if (computedScore >= 60 && typeof global.confetti === 'function') {
      global.confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#10b981', '#f59e0b', '#3b82f6', '#ec4899']
      });
    }
  }

  function saveExamResult(payload) {
    let profile = null;
    try {
      const raw = localStorage.getItem('msf_user_profile');
      if (raw) profile = JSON.parse(raw);
    } catch {}
    const user = global.firebaseAuth?.currentUser;
    const isGoogleLoggedIn = !!((profile && profile.uid && profile.uid !== 'guest' && profile.email) || (user && user.email));

    const candidateName = profile?.name || (user ? (user.displayName || user.email) : 'Guest Candidate');
    const candidateEmail = profile?.email || (user ? user.email : '');
    const candidatePhoto = profile?.photoURL || (user ? user.photoURL : '');
    const candidateUid = profile?.uid || (user ? user.uid : 'guest');

    let history = [];
    try {
      history = JSON.parse(localStorage.getItem(STORAGE_KEY_RESULTS) || '[]');
    } catch (e) {}

    // Calculate attempt number for this specific topic / exam
    const sameExamAttempts = history.filter(h => (h.examId === payload.examId || h.topicName === payload.topicName));
    const attemptNumber = sameExamAttempts.length + 1;

    payload.attemptNumber = attemptNumber;
    payload.userName = candidateName;
    payload.userEmail = candidateEmail;
    payload.userPhoto = candidatePhoto;
    payload.userId = candidateUid;
    payload.isGoogleSaved = isGoogleLoggedIn;

    // Save to local device history
    try {
      history.unshift(payload);
      localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(history.slice(0, 200)));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    // ONLY save to Global Leaderboard in Firestore if user is authenticated with Google
    if (isGoogleLoggedIn && global.firebaseDB) {
      try {
        global.firebaseDB.collection('exam_results').add({
          userId: candidateUid,
          userName: candidateName,
          userEmail: candidateEmail,
          userPhoto: candidatePhoto || '',
          attemptNumber: attemptNumber,
          topicName: payload.topicName,
          category: payload.category,
          examCode: payload.examId,
          score: payload.score,
          correctCount: payload.correctCount,
          wrongCount: payload.wrongCount,
          skippedCount: payload.skippedCount,
          accuracy: payload.accuracy,
          timeSpentSeconds: payload.timeSpentSeconds,
          date: payload.date,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
          console.log(`Exam result for ${candidateName} (Attempt #${attemptNumber}) saved to Firestore.`);
        }).catch((err) => console.warn('Firestore sync note:', err));
      } catch (e) {
        console.warn('Firestore sync note:', e);
      }
    } else {
      console.log('Guest candidate exam completed. Sign in with Google to publish score to Global Leaderboard.');
    }
  }

  let currentExamReviewDetails = [];
  let currentReviewFilter = 'all';

  /**
   * Render Post-Exam Results Screen with Deep Review (Full Width, Distinct 2 Lines)
   */
  function renderResultsView(result, details) {
    const container = document.getElementById('exam-render-container');
    if (!container) return;

    currentExamReviewDetails = details || [];
    currentReviewFilter = 'all';

    const mins = Math.floor(result.timeSpentSeconds / 60);
    const secs = result.timeSpentSeconds % 60;
    const isNegative = result.score < 0;

    container.innerHTML = `
      <!-- Result Summary Hero Card -->
      <div class="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl mb-8 w-full">
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
          <div>
            <span class="px-3.5 py-1 rounded-full bg-purple-900/60 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-wider inline-block mb-2">
              ${result.category}
            </span>
            <h2 class="text-xl sm:text-2xl md:text-3xl font-black text-white">${result.topicName}</h2>
            <p class="text-xs text-slate-400 font-mono mt-1">Code: ${result.examId} • Completed on ${result.date}</p>
          </div>
          
          <div class="text-right">
            <p class="text-xs uppercase font-bold tracking-widest text-slate-400 mb-0.5">Final Net Score</p>
            <div class="text-4xl sm:text-5xl md:text-6xl font-black ${isNegative ? 'text-rose-500' : (result.score >= 60 ? 'text-emerald-400' : (result.score >= 40 ? 'text-amber-400' : 'text-rose-400'))}">
              ${result.score}<span class="text-xl sm:text-2xl text-slate-500">/${result.totalQuestions}</span>
            </div>
            <p class="text-xs text-slate-400 mt-1 font-semibold">${isNegative ? 'Negative Marks' : 'Net Marks (+1.00 / -0.25)'}</p>
          </div>
        </div>

        <!-- 4-Pillar Stat Box Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 mb-6">
          <div class="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center">
            <p class="text-2xl sm:text-3xl font-black text-emerald-400">${result.correctCount}</p>
            <p class="text-xs uppercase font-bold text-emerald-300/80">Correct (+${result.correctCount}.00)</p>
          </div>
          <div class="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-center">
            <p class="text-2xl sm:text-3xl font-black text-rose-400">${result.wrongCount}</p>
            <p class="text-xs uppercase font-bold text-rose-300/80">Wrong (-${(result.wrongCount * 0.25).toFixed(2)})</p>
          </div>
          <div class="p-4 rounded-2xl bg-slate-900/60 border border-white/5 text-center">
            <p class="text-2xl sm:text-3xl font-black text-slate-300">${result.skippedCount}</p>
            <p class="text-xs uppercase font-bold text-slate-400">Skipped (0.00)</p>
          </div>
          <div class="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-center">
            <p class="text-2xl sm:text-3xl font-black text-purple-300">${result.accuracy}</p>
            <p class="text-xs uppercase font-bold text-purple-300/80">Accuracy Rate</p>
          </div>
        </div>

        <!-- Action CTAs -->
        <div class="flex flex-wrap gap-3 pt-2">
          <button onclick="window.ExamEngine.exitExam()" class="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2">
            <i class="fa fa-house"></i> Return to Question Bank
          </button>
          <button onclick="window.openResultsModal()" class="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-900/40 transition-all flex items-center justify-center gap-2">
            <i class="fa fa-trophy"></i> View Leaderboard & History
          </button>
        </div>
      </div>

      <!-- Deep Solution & Reference Review Section Header + Interactive Filters -->
      <div class="bg-[#1E293B] border border-white/10 rounded-2xl p-4 sm:p-5 mb-6 shadow-xl w-full">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 mb-4">
          <h3 class="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <i class="fa fa-book-open-reader text-purple-400"></i> Deep Solution & Reference Review
          </h3>
          <span id="review-counter-badge" class="text-xs text-slate-400 font-semibold font-mono">
            Showing ${details.length} Questions
          </span>
        </div>

        <!-- Filter Buttons: All, Wrong, Correct, Skipped -->
        <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button id="filter-btn-all" onclick="window.ExamEngine.filterReview('all')" class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all bg-purple-600 text-white shadow-md">
            All Questions (${details.length})
          </button>
          <button id="filter-btn-wrong" onclick="window.ExamEngine.filterReview('wrong')" class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all bg-slate-900 text-rose-400 border border-rose-500/30 hover:bg-rose-950/40">
            <i class="fa fa-circle-xmark mr-1"></i> Wrong (${result.wrongCount})
          </button>
          <button id="filter-btn-correct" onclick="window.ExamEngine.filterReview('correct')" class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all bg-slate-900 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-950/40">
            <i class="fa fa-circle-check mr-1"></i> Correct (${result.correctCount})
          </button>
          <button id="filter-btn-skipped" onclick="window.ExamEngine.filterReview('skipped')" class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all bg-slate-900 text-slate-400 border border-white/10 hover:bg-slate-800">
            <i class="fa fa-circle-minus mr-1"></i> Skipped (${result.skippedCount})
          </button>
        </div>
      </div>

      <!-- Solutions Stream (Identical standard font sizes as live exam) -->
      <div id="review-questions-stream" class="space-y-6 pb-20 w-full">
        ${renderReviewQuestionsList('all')}
      </div>
    `;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function filterReview(filterType) {
    currentReviewFilter = filterType;
    const stream = document.getElementById('review-questions-stream');
    const badge = document.getElementById('review-counter-badge');

    // Update active button styling
    ['all', 'wrong', 'correct', 'skipped'].forEach(type => {
      const btn = document.getElementById(`filter-btn-${type}`);
      if (!btn) return;
      if (type === filterType) {
        btn.className = 'px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all bg-purple-600 text-white shadow-md';
      } else {
        if (type === 'wrong') btn.className = 'px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all bg-slate-900 text-rose-400 border border-rose-500/30 hover:bg-rose-950/40';
        else if (type === 'correct') btn.className = 'px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all bg-slate-900 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-950/40';
        else btn.className = 'px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all bg-slate-900 text-slate-400 border border-white/10 hover:bg-slate-800';
      }
    });

    if (stream) {
      stream.innerHTML = renderReviewQuestionsList(filterType);
    }
  }

  /**
   * Render Review List with Distinct 2 Lines for Reference & Concept (Exact Matching Exam Font Size)
   */
  function renderReviewQuestionsList(filterType = 'all') {
    const fmtExp = global.formatExplanation || ((exp) => exp);

    let filtered = currentExamReviewDetails;
    if (filterType !== 'all') {
      filtered = currentExamReviewDetails.filter(item => item.status === filterType);
    }

    const badge = document.getElementById('review-counter-badge');
    if (badge) {
      badge.textContent = `Showing ${filtered.length} of ${currentExamReviewDetails.length} Questions`;
    }

    if (filtered.length === 0) {
      return `
        <div class="bg-[#1E293B] border border-white/10 rounded-2xl p-10 text-center text-slate-400">
          <i class="fa fa-clipboard-check text-3xl text-purple-400/40 mb-2 block"></i>
          <p class="text-sm font-bold text-slate-300">No questions found in '${filterType.toUpperCase()}' category</p>
        </div>
      `;
    }

    return filtered.map(item => {
      const q = item.q;
      const isCorrect = item.status === 'correct';
      const isWrong = item.status === 'wrong';

      return `
        <div class="bg-[#1E293B] border ${isCorrect ? 'border-emerald-500/40' : (isWrong ? 'border-rose-500/40' : 'border-slate-700/60')} rounded-2xl p-5 sm:p-7 shadow-lg w-full mb-6">
          <div class="flex items-center justify-between mb-3.5">
            <div class="flex items-center gap-2">
              <span class="px-3 py-1 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono font-black text-slate-300">
                #${item.id}
              </span>
              <span class="text-xs font-bold ${isCorrect ? 'text-emerald-400' : (isWrong ? 'text-rose-400' : 'text-amber-400')}">
                ${isCorrect ? '✓ Correct (+1.00)' : (isWrong ? '✗ Wrong (-0.25)' : '— Skipped (0.00)')}
              </span>
            </div>
            <div class="text-xs font-mono text-slate-300">
              Ans: <strong class="text-emerald-400 text-sm font-bold">${item.correct.toUpperCase()}</strong>
            </div>
          </div>

          <!-- Question Text in Exam-Matching Font Size -->
          <p class="text-base sm:text-lg md:text-xl font-bold text-slate-100 leading-relaxed mb-5 font-siliguri">${q.q}</p>

          <!-- 2-Line / 2-Column Options Grid with Exact Exam Proportions -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            ${['a', 'b', 'c', 'd'].map(opt => {
              const isOptionCorrect = item.correct.toLowerCase() === opt;
              const isUserChoice = item.user.toLowerCase() === opt;

              let style = 'bg-slate-900/60 border-white/5 text-slate-300';
              let badge = '';

              if (isOptionCorrect) {
                style = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-100 font-bold';
                badge = '<span class="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-lg font-black ml-auto">CORRECT</span>';
              } else if (isUserChoice && !isCorrect) {
                style = 'bg-rose-950/40 border-rose-500/60 text-rose-100 font-bold';
                badge = '<span class="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-lg font-black ml-auto">YOUR PICK</span>';
              }

              return `
                <div class="p-3.5 sm:p-4 rounded-xl border flex items-center gap-3 ${style}">
                  <span class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${isOptionCorrect ? 'bg-emerald-500 text-slate-900 font-black' : 'bg-slate-800 text-slate-400'}">
                    ${opt.toUpperCase()}
                  </span>
                  <span class="flex-1 break-words font-medium font-siliguri leading-relaxed text-sm sm:text-base">${q[opt]}</span>
                  ${badge}
                </div>
              `;
            }).join('')}
          </div>

          <!-- Distinct 2 Lines for রেফারেন্স and কনসেপ্ট in 2 Colors -->
          <div class="mt-4 pt-3.5 border-t border-white/10 space-y-2">
            ${fmtExp(q.exp)}
          </div>
        </div>
      `;
    }).join('');
  }

  function exitExam() {
    clearInterval(ExamState.timerId);
    detachKeyboardShortcuts();
    const homeView = document.getElementById('home-view');
    const examView = document.getElementById('exam-view');
    const mainContainer = document.querySelector('main');
    if (examView) examView.classList.add('hidden');
    if (homeView) {
      homeView.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    if (mainContainer) {
      mainContainer.classList.remove('exam-active-fullwidth');
    }
  }

  // Global Engine Export
  global.ExamEngine = {
    launchExam,
    selectOption,
    setMode,
    scrollToQuestion,
    confirmSubmit,
    submitExam,
    confirmExit,
    exitExam
  };

})(typeof window !== 'undefined' ? window : this);
