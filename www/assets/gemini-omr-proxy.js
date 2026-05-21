// --- HARD OMR EXAM (Pure CV — No API Key, No Server) ---
// Uses omr-processor.js for client-side bubble detection

window.openHardOMRCamera = () => {
    document.getElementById('entry-modal').classList.add('hidden');
    document.getElementById('camera-modal').classList.remove('hidden');
    document.getElementById('camera-modal').classList.add('flex');
};

window.processHardOMR = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById('camera-modal').classList.add('hidden');
    document.getElementById('sticky-header').classList.add('hidden');
    const qList = document.getElementById('questions-list');

    qList.innerHTML = `
        <div class="text-center py-28 px-6">
            <div class="w-24 h-24 mx-auto mb-6 relative">
                <svg class="animate-spin w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="44" stroke="#10b981" stroke-width="8" stroke-dasharray="80 200" stroke-linecap="round"/>
                </svg>
                <i class="fa fa-dot-circle text-emerald-500 text-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></i>
            </div>
            <h2 class="text-2xl font-black dark:text-white">Scanning OMR Sheet…</h2>
            <p class="text-sm opacity-50 dark:text-zinc-400 mt-2">Detecting bubble fills • No internet needed</p>
            <div class="mt-6 flex justify-center gap-2 text-xs opacity-40 dark:text-zinc-500">
                <span class="px-3 py-1 rounded-full bg-white/10">Greyscale</span>
                <span>→</span>
                <span class="px-3 py-1 rounded-full bg-white/10">Threshold</span>
                <span>→</span>
                <span class="px-3 py-1 rounded-full bg-white/10">Grid Map</span>
                <span>→</span>
                <span class="px-3 py-1 rounded-full bg-white/10">Score</span>
            </div>
        </div>`;

    try {
        if (typeof OMRProcessor === 'undefined') {
            throw new Error('OMR engine not loaded. Please refresh the page and try again.');
        }

        // Build answer key from the page's questions array
        const answerKey = questions.map(q => q.ans);

        // Run the CV pipeline
        const { summary, detailedResults, previewDataUrl } = await OMRProcessor.processImage(file, answerKey);

        // ── Populate userAnswers for renderQuestions() ──────────────────────
        // Clear any previous answers first
        Object.keys(userAnswers).forEach(k => delete userAnswers[k]);

        detailedResults.forEach((r, i) => {
            if (r.status === 'skipped') {
                // Leave undefined → renderQuestions shows "Skipped"
            } else if (r.status === 'invalid') {
                userAnswers[i] = '__invalid__'; // sentinel
            } else {
                userAnswers[i] = r.user; // 'a' | 'b' | 'c' | 'd'
            }
        });

        // ── Update result stats ──────────────────────────────────────────────
        document.getElementById('res-correct').innerText = summary.correct;
        document.getElementById('res-wrong').innerText   = summary.wrong;
        document.getElementById('res-time').innerText    = `⚠ ${summary.invalid} Invalid`;
        document.getElementById('res-score').innerText   = `${summary.finalScore}/${summary.totalQuestions}`;

        // Add skipped count next to wrong label if any
        const wrongBox = document.getElementById('res-wrong').parentElement;
        if (wrongBox && summary.skipped > 0) {
            const skipEl = wrongBox.querySelector('.omr-skip-count');
            if (!skipEl) {
                const sp = document.createElement('p');
                sp.className = 'omr-skip-count text-[9px] uppercase font-bold opacity-50 mt-0.5';
                sp.textContent = `${summary.skipped} skipped`;
                wrongBox.appendChild(sp);
            }
        }

        document.getElementById('results-card').classList.remove('hidden');

        currentMode = 'sol';
        renderQuestions();

        // ── Apply colour-coding for invalid (yellow) ─────────────────────────
        requestAnimationFrame(() => {
            const cards = document.querySelectorAll('#questions-list .question-card');
            detailedResults.forEach((r, i) => {
                if (r.status === 'invalid' && cards[i]) {
                    cards[i].style.cssText += ';border-left:4px solid #eab308 !important;box-shadow:0 0 0 1px rgba(234,179,8,0.2)';
                    const badge = cards[i].querySelector('.status-badge');
                    if (badge) {
                        badge.style.background = 'rgba(234,179,8,0.15)';
                        badge.style.color      = '#ca8a04';
                        badge.style.border     = '1px solid rgba(234,179,8,0.3)';
                        badge.textContent      = `Invalid (0.00) — ${r.user.toUpperCase()}`;
                    }
                }
            });
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
        saveResultToCloud(summary.finalScore, summary.correct, summary.wrong, 0);

    } catch (err) {
        console.error('OMR Scan Failed:', err);
        qList.innerHTML = `
            <div class="text-center py-24 px-6">
                <i class="fa fa-exclamation-triangle text-5xl text-rose-500 mb-4"></i>
                <h2 class="text-2xl font-black dark:text-white mb-2">Scan Failed</h2>
                <p class="font-mono text-xs text-red-400 bg-red-900/20 p-4 rounded-xl break-words mt-4 text-left">${err.message || err}</p>
                <button onclick="location.reload()" class="mt-6 px-6 py-3 font-bold bg-rose-500 text-white rounded-2xl hover:bg-rose-600 transition-all active:scale-95">
                    <i class="fa fa-redo mr-2"></i> Try Again
                </button>
            </div>`;
    }
};

// gradeAIOMR kept for compatibility (not used by CV path)
window.gradeAIOMR = (scannedAnswers) => {
    Object.keys(userAnswers).forEach(k => delete userAnswers[k]);
    questions.forEach((q, i) => {
        const qNum = (i + 1).toString();
        if (scannedAnswers[qNum]) userAnswers[i] = scannedAnswers[qNum].toLowerCase();
    });

    let correct = 0, wrong = 0;
    questions.forEach((q, i) => {
        if (userAnswers[i] === q.ans) correct++;
        else if (userAnswers[i] !== undefined) wrong++;
    });

    const finalScore = (correct - wrong * 0.25).toFixed(2);
    document.getElementById('res-correct').innerText = correct;
    document.getElementById('res-wrong').innerText   = wrong;
    document.getElementById('res-time').innerText    = 'AI Scanned';
    document.getElementById('res-score').innerText   = `${finalScore}/${questions.length}`;
    document.getElementById('results-card').classList.remove('hidden');
    currentMode = 'sol';
    renderQuestions();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    saveResultToCloud(finalScore, correct, wrong, 0);
};
