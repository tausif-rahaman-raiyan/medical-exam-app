// ═══════════════════════════════════════════════════════════════════
//  HARD OMR EXAM  —  Auto-detect corners + instant scan
//  No API Key  •  No Server  •  Works fully offline
//  Upload → auto-align → scan (no manual drag handles)
// ═══════════════════════════════════════════════════════════════════
(function (global) {
'use strict';

// ── 1. Open the camera/upload modal ────────────────────────────────
global.openHardOMRCamera = () => {
    document.getElementById('entry-modal').classList.add('hidden');
    const cm = document.getElementById('camera-modal');
    cm.classList.remove('hidden');
    cm.classList.add('flex');
};

// ── 2. User picks an image → auto-detect corners → scan ────────────
global.processHardOMR = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';   // reset so same file can be re-selected

    // Close the camera modal
    const cm = document.getElementById('camera-modal');
    cm.classList.add('hidden');
    cm.classList.remove('flex');

    // Auto-detect corners silently; fall back to null (no warp) if it fails
    let corners = null;
    let layout  = 'auto';

    try {
        if (typeof OMRProcessor !== 'undefined') {
            _showDetectingSpinner();
            const detected = await OMRProcessor.detectCornersAndLayout(file);
            corners = detected.corners  || null;
            layout  = detected.layout   || 'auto';
        }
    } catch (e) {
        console.warn('[OMR] Corner auto-detect failed:', e);
    }

    _runScan(file, corners, layout);
};

// ── Tiny "Detecting corners…" overlay shown while auto-detect runs ──
function _showDetectingSpinner() {
    const existing = document.getElementById('omr-detect-spinner');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.id = 'omr-detect-spinner';
    el.style.cssText = [
        'position:fixed;inset:0;z-index:9998;background:rgba(10,10,10,.82)',
        'display:flex;flex-direction:column;align-items:center;justify-content:center',
        'font-family:-apple-system,BlinkMacSystemFont,sans-serif'
    ].join(';');
    el.innerHTML = `
      <svg style="animation:omr-spin 1s linear infinite;width:60px;height:60px;margin-bottom:18px"
           viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="40" stroke="#10b981" stroke-width="9"
                stroke-dasharray="70 190" stroke-linecap="round"/>
      </svg>
      <p style="color:#d4d4d8;font-size:15px;font-weight:700;margin:0 0 6px">
        Auto-aligning sheet…</p>
      <p style="color:#71717a;font-size:12px;margin:0">
        Detecting corner markers</p>
      <style>
        @keyframes omr-spin { to { transform:rotate(360deg) } }
      </style>`;
    document.body.appendChild(el);
}

function _removeDetectingSpinner() {
    const el = document.getElementById('omr-detect-spinner');
    if (el) el.remove();
}

// ═══════════════════════════════════════════════════════════════════
//  RUN SCAN  (auto-detected corners passed in; null = no warp)
// ═══════════════════════════════════════════════════════════════════
async function _runScan(file, corners, layout) {
    _removeDetectingSpinner();

    document.getElementById('sticky-header').classList.add('hidden');
    const qList = document.getElementById('questions-list');

    const layoutLabel = layout === '4col' ? '4×25'
                      : layout === '2col' ? '2×50'
                      : 'Auto';
    const cornerStatus = corners
        ? '<span style="color:#34d399;font-weight:800">✓ corners auto-detected</span>'
        : '<span style="color:#f59e0b;font-weight:800">⚠ no markers found — using full sheet</span>';

    qList.innerHTML = `
      <div style="text-align:center;padding:80px 24px">
        <div style="width:88px;height:88px;margin:0 auto 20px;position:relative">
          <svg style="animation:omr-spin 1s linear infinite;width:100%;height:100%"
               viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="44" stroke="#10b981" stroke-width="8"
                    stroke-dasharray="80 200" stroke-linecap="round"/>
          </svg>
          <i class="fa fa-dot-circle" style="color:#10b981;font-size:28px;
             position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)"></i>
        </div>
        <h2 style="font-size:22px;font-weight:900;color:#fff;margin:0 0 8px">Scanning OMR…</h2>
        <p style="font-size:12px;color:#71717a;margin:0 0 6px">
          Layout: ${layoutLabel} &nbsp;•&nbsp; ${cornerStatus}</p>
        <p style="font-size:11px;color:#52525b;margin:0 0 20px">No internet needed</p>
        <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap">
          ${['Align','Warp','Threshold','Grid','Score'].map(function(s) {
            return '<span style="padding:3px 10px;border-radius:99px;background:#27272a;color:#71717a;font-size:10px;font-weight:700">' + s + '</span>';
          }).join('<span style="color:#3f3f46">→</span>')}
        </div>
      </div>
      <style>@keyframes omr-spin{to{transform:rotate(360deg)}}</style>`;

    try {
        if (typeof OMRProcessor === 'undefined')
            throw new Error('OMR engine not loaded — please refresh and try again.');

        const answerKey  = questions.map(function(q) { return q.ans; });
        const scanResult = await OMRProcessor.processImage(file, answerKey,
                                  { corners: corners, layout: layout });
        const summary         = scanResult.summary;
        const detailedResults = scanResult.detailedResults;
        const detectedLayout  = scanResult.detectedLayout;

        // ── Populate userAnswers ────────────────────────────────────
        Object.keys(userAnswers).forEach(function(k) { delete userAnswers[k]; });
        detailedResults.forEach(function(r, i) {
            if      (r.status === 'skipped') { /* leave undefined */ }
            else if (r.status === 'invalid') userAnswers[i] = '__invalid__';
            else                             userAnswers[i] = r.user;
        });

        // ── Score stat boxes ───────────────────────────────────────
        const totalPenalised = summary.wrong + summary.invalid;
        document.getElementById('res-correct').innerText = summary.correct;
        document.getElementById('res-wrong').innerText   = totalPenalised;
        document.getElementById('res-time').innerText    =
            summary.invalid > 0
                ? '⚠ ' + summary.invalid + ' Invalid'
                : summary.skipped + ' Skipped';
        document.getElementById('res-score').innerText =
            summary.finalScore + '/' + summary.totalQuestions;

        // Small breakdown under Wrong
        const wrongBox = document.getElementById('res-wrong').parentElement;
        if (wrongBox) {
            const existingBp = wrongBox.querySelector('.omr-breakdown');
            if (existingBp) existingBp.remove();
            const parts = [];
            if (summary.wrong   > 0) parts.push(summary.wrong   + ' wrong');
            if (summary.invalid > 0) parts.push(summary.invalid + ' invalid');
            if (summary.skipped > 0) parts.push(summary.skipped + ' skip');
            if (parts.length > 1) {
                const bp         = document.createElement('p');
                bp.className     = 'omr-breakdown';
                bp.style.cssText = 'font-size:9px;text-transform:uppercase;font-weight:700;opacity:.5;margin-top:2px';
                bp.textContent   = parts.join(' · ');
                wrongBox.appendChild(bp);
            }
        }

        // Layout badge
        const timeEl = document.getElementById('res-time');
        if (timeEl) {
            const existingLb = timeEl.parentElement.querySelector('.omr-layout-badge');
            if (!existingLb) {
                const lb         = document.createElement('p');
                lb.className     = 'omr-layout-badge';
                lb.style.cssText = 'font-size:9px;text-transform:uppercase;font-weight:700;opacity:.5;margin-top:2px';
                lb.textContent   = detectedLayout === '4col' ? 'Layout: 4×25' : 'Layout: 2×50';
                timeEl.parentElement.appendChild(lb);
            }
        }

        document.getElementById('results-card').classList.remove('hidden');
        currentMode = 'sol';
        renderQuestions();

        // ── Yellow highlight for invalid answers ───────────────────
        if (summary.invalid > 0) {
            requestAnimationFrame(function() {
                const cards = document.querySelectorAll('#questions-list .question-card');
                detailedResults.forEach(function(r, i) {
                    if (r.status === 'invalid' && cards[i]) {
                        cards[i].style.cssText +=
                            ';border-left:4px solid #eab308!important;box-shadow:0 0 0 1px rgba(234,179,8,.2)';
                        const badge = cards[i].querySelector('.status-badge');
                        if (badge) {
                            badge.style.background = 'rgba(234,179,8,.15)';
                            badge.style.color      = '#ca8a04';
                            badge.style.border     = '1px solid rgba(234,179,8,.3)';
                        }
                    }
                });
            });
        }

        // ── OMR result banner ──────────────────────────────────────
        const banner = document.createElement('div');
        banner.id    = 'omr-result-banner';
        const cornerBadge = corners
            ? '<span style="background:rgba(52,211,153,.15);color:#34d399;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700;border:1px solid rgba(52,211,153,.3)">✓ Auto-aligned</span>'
            : '<span style="background:rgba(245,158,11,.15);color:#f59e0b;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700;border:1px solid rgba(245,158,11,.3)">⚠ No markers</span>';
        banner.style.cssText = [
            'position:fixed;bottom:80px;left:50%;transform:translateX(-50%)',
            'z-index:8888;background:#18181b;border:1px solid #27272a',
            'border-radius:20px;padding:10px 18px;display:flex;align-items:center',
            'gap:10px;box-shadow:0 8px 32px rgba(0,0,0,.5);max-width:92vw'
        ].join(';');
        banner.innerHTML = `
          <span style="color:#10b981;font-size:18px">📊</span>
          <div>
            <p style="margin:0;color:#fff;font-size:13px;font-weight:800">
              OMR Scanned &nbsp; ${cornerBadge}</p>
            <p style="margin:2px 0 0;color:#71717a;font-size:11px">
              Score: <strong style="color:#10b981">${summary.finalScore}</strong>
              &nbsp;|&nbsp; Correct: ${summary.correct}
              &nbsp;·&nbsp; Wrong: ${summary.wrong}
              &nbsp;·&nbsp; Skipped: ${summary.skipped}</p>
          </div>
          <button onclick="this.parentElement.remove()"
            style="margin-left:auto;color:#71717a;background:none;border:none;
                   font-size:16px;cursor:pointer;padding:4px 6px;border-radius:8px">✕</button>`;
        document.body.appendChild(banner);
        setTimeout(function() { if (banner.parentElement) banner.remove(); }, 12000);

        // Scroll to top of questions
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
        qList.innerHTML = `
          <div style="text-align:center;padding:80px 24px">
            <div style="font-size:48px;margin-bottom:16px">⚠️</div>
            <h2 style="color:#f87171;font-size:20px;font-weight:900;margin:0 0 8px">Scan Failed</h2>
            <p style="color:#71717a;font-size:13px;margin:0 0 24px">${err.message}</p>
            <button onclick="document.getElementById('sticky-header').classList.remove('hidden');openHardOMRCamera()"
              style="padding:14px 28px;background:#7c3aed;color:#fff;border-radius:14px;
                     border:none;font-size:14px;font-weight:800;cursor:pointer">
              Try Again</button>
          </div>`;
    }
}

})(window);
