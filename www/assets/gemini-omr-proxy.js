// ═══════════════════════════════════════════════════════════════════
//  HARD OMR EXAM  —  Corner-adjust UI + Pure CV Scan
//  No API Key  •  No Server  •  Works fully offline
// ═══════════════════════════════════════════════════════════════════

// ── 1. Open the camera/upload modal ────────────────────────────────
window.openHardOMRCamera = () => {
    document.getElementById('entry-modal').classList.add('hidden');
    const cm = document.getElementById('camera-modal');
    cm.classList.remove('hidden');
    cm.classList.add('flex');
};

// ── 2. User picks an image → show corner-adjustment overlay ────────
window.processHardOMR = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';   // reset so same file can be re-selected

    const cm = document.getElementById('camera-modal');
    cm.classList.add('hidden');
    cm.classList.remove('flex');

    _showCornerUI(file);
};

// ═══════════════════════════════════════════════════════════════════
//  CORNER-DRAG OVERLAY
// ═══════════════════════════════════════════════════════════════════

// Default corners (fraction of image): TL, TR, BL, BR
const _DEFAULT_CORNERS = [[0.02, 0.10], [0.98, 0.10], [0.02, 0.97], [0.98, 0.97]];
const _HANDLE_R        = 22;   // circle radius (px) — comfortable touch target
const _HANDLE_COLS     = ['#34d399', '#f59e0b', '#60a5fa', '#f472b6']; // TL TR BL BR
const _CORNER_LABELS   = ['TL', 'TR', 'BL', 'BR'];

function _showCornerUI(file) {
    // ── Build overlay DOM ──────────────────────────────────────────
    const ov = document.createElement('div');
    ov.id = 'omr-corner-ov';
    ov.style.cssText = [
        'position:fixed;inset:0;z-index:9999;background:#0a0a0a',
        'display:flex;flex-direction:column',
        'font-family:-apple-system,BlinkMacSystemFont,sans-serif'
    ].join(';');

    ov.innerHTML = `
      <!-- Header -->
      <div style="background:#18181b;padding:11px 14px;display:flex;align-items:center;
                  justify-content:space-between;border-bottom:1px solid #27272a;flex-shrink:0">
        <button id="omr-ci-cancel"
          style="color:#f87171;font-weight:700;font-size:14px;background:none;border:none;
                 cursor:pointer;padding:6px 10px;border-radius:8px;
                 -webkit-tap-highlight-color:transparent">✕ Cancel</button>

        <span style="color:#fff;font-size:14px;font-weight:800;letter-spacing:.02em">
          Adjust Corners</span>

        <button id="omr-ci-auto"
          style="color:#34d399;font-weight:700;font-size:12px;
                 background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.35);
                 cursor:pointer;padding:6px 11px;border-radius:8px;
                 -webkit-tap-highlight-color:transparent">Auto-Detect</button>
      </div>

      <!-- Tip bar -->
      <div style="background:#4c1d95;padding:5px 14px;text-align:center;flex-shrink:0">
        <span style="color:#e9d5ff;font-size:11px;font-weight:700">
          Drag the coloured handles to the 4 corners of your OMR sheet</span>
      </div>

      <!-- Image + canvas -->
      <div id="omr-ci-wrap"
        style="flex:1;position:relative;overflow:hidden;background:#111;touch-action:none">
        <img id="omr-ci-img"
          style="position:absolute;inset:0;width:100%;height:100%;
                 object-fit:contain;display:block;pointer-events:none">
        <canvas id="omr-ci-canvas"
          style="position:absolute;inset:0;width:100%;height:100%;touch-action:none">
        </canvas>
      </div>

      <!-- Footer controls -->
      <div style="background:#18181b;padding:11px 14px 14px;border-top:1px solid #27272a;flex-shrink:0">

        <!-- Layout row -->
        <div style="display:flex;align-items:center;gap:7px;margin-bottom:10px">
          <span style="color:#71717a;font-size:10px;font-weight:700;
                       text-transform:uppercase;letter-spacing:.06em;white-space:nowrap">
            Layout:</span>

          <button class="omr-lt-btn" data-layout="auto"
            style="flex:1;padding:5px 0;border-radius:99px;font-size:11px;font-weight:700;
                   cursor:pointer;border:none;-webkit-tap-highlight-color:transparent">Auto</button>

          <button class="omr-lt-btn" data-layout="4col"
            style="flex:1;padding:5px 0;border-radius:99px;font-size:11px;font-weight:700;
                   cursor:pointer;border:none;-webkit-tap-highlight-color:transparent">4×25</button>

          <button class="omr-lt-btn" data-layout="2col"
            style="flex:1;padding:5px 0;border-radius:99px;font-size:11px;font-weight:700;
                   cursor:pointer;border:none;-webkit-tap-highlight-color:transparent">2×50</button>

          <span id="omr-lt-badge"
            style="color:#34d399;font-size:10px;font-weight:700;min-width:44px;
                   text-align:right;opacity:0;transition:opacity .3s"></span>
        </div>

        <!-- Scan button -->
        <button id="omr-ci-scan"
          style="width:100%;padding:15px;
                 background:linear-gradient(135deg,#059669,#047857);
                 color:#fff;font-size:16px;font-weight:800;
                 border-radius:16px;border:none;cursor:pointer;
                 letter-spacing:.04em;-webkit-tap-highlight-color:transparent;
                 box-shadow:0 4px 20px rgba(5,150,105,.4)">
          📷  SCAN OMR
        </button>
      </div>`;

    document.body.appendChild(ov);

    // ── State ──────────────────────────────────────────────────────
    const state = {
        corners: _DEFAULT_CORNERS.map(c => [...c]),  // deep copy
        dragging: null,
        layout: 'auto',
        file,
        objUrl: null
    };

    // Apply initial layout button styles
    _applyLayoutStyles(ov, 'auto');

    // ── Load the image ─────────────────────────────────────────────
    const img    = ov.querySelector('#omr-ci-img');
    state.objUrl = URL.createObjectURL(file);
    img.onload   = () => _initCanvas(ov, state);
    img.src      = state.objUrl;

    // ── Cancel ────────────────────────────────────────────────────
    ov.querySelector('#omr-ci-cancel').addEventListener('click', () => {
        _closeOverlay(ov, state);
        const cm = document.getElementById('camera-modal');
        cm.classList.remove('hidden');
        cm.classList.add('flex');
    });

    // ── Auto-Detect button ────────────────────────────────────────
    ov.querySelector('#omr-ci-auto').addEventListener('click', async () => {
        const btn = ov.querySelector('#omr-ci-auto');
        btn.textContent = '…';
        btn.disabled    = true;

        try {
            if (typeof OMRProcessor === 'undefined')
                throw new Error('OMR engine not loaded');

            const { corners, layout } = await OMRProcessor.detectCornersAndLayout(file);

            if (corners) {
                state.corners = corners.map(c => [...c]);
                _redraw(ov, state);
            }

            if (layout) {
                state.layout = layout;
                _applyLayoutStyles(ov, layout);
                const badge = ov.querySelector('#omr-lt-badge');
                badge.textContent = layout === '4col' ? '4×25 ✓' : '2×50 ✓';
                badge.style.opacity = '1';
            }
        } catch (e) {
            console.warn('Auto-detect failed:', e);
        }

        btn.textContent = 'Auto-Detect';
        btn.disabled    = false;
    });

    // ── Layout toggle buttons ─────────────────────────────────────
    ov.querySelectorAll('.omr-lt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.layout = btn.dataset.layout;
            _applyLayoutStyles(ov, state.layout);
            const badge = ov.querySelector('#omr-lt-badge');
            badge.style.opacity = '0';
        });
    });

    // ── Scan ──────────────────────────────────────────────────────
    ov.querySelector('#omr-ci-scan').addEventListener('click', () => {
        _closeOverlay(ov, state);
        _runScan(state.file, state.corners, state.layout);
    });
}

function _closeOverlay(ov, state) {
    if (state.objUrl) URL.revokeObjectURL(state.objUrl);
    ov.remove();
}

function _applyLayoutStyles(ov, active) {
    ov.querySelectorAll('.omr-lt-btn').forEach(btn => {
        const on = btn.dataset.layout === active;
        btn.style.background = on ? '#7c3aed' : '#3f3f46';
        btn.style.color      = on ? '#fff'    : '#a1a1aa';
    });
}

// ── Canvas init + drag logic ────────────────────────────────────────
function _initCanvas(ov, state) {
    const wrap   = ov.querySelector('#omr-ci-wrap');
    const canvas = ov.querySelector('#omr-ci-canvas');

    // Size canvas to physical pixels
    canvas.width  = wrap.offsetWidth;
    canvas.height = wrap.offsetHeight;

    _redraw(ov, state);

    // ── Coordinate helpers ────────────────────────────────────────
    function imgBounds() {
        const img   = ov.querySelector('#omr-ci-img');
        const cW    = wrap.offsetWidth, cH = wrap.offsetHeight;
        const iW    = img.naturalWidth, iH = img.naturalHeight;
        const scale = Math.min(cW / iW, cH / iH);
        const dW    = iW * scale, dH = iH * scale;
        return { x: (cW - dW) / 2, y: (cH - dH) / 2, w: dW, h: dH };
    }

    function fracToCanvas([fx, fy]) {
        const b = imgBounds();
        return [b.x + fx * b.w, b.y + fy * b.h];
    }

    function canvasToFrac(cx, cy) {
        const b = imgBounds();
        return [
            Math.max(0, Math.min(1, (cx - b.x) / b.w)),
            Math.max(0, Math.min(1, (cy - b.y) / b.h))
        ];
    }

    function evtPt(e) {
        const r   = canvas.getBoundingClientRect();
        const src = e.touches ? e.touches[0] : e;
        return [src.clientX - r.left, src.clientY - r.top];
    }

    function nearestCorner(pt) {
        let best = -1, bestD = _HANDLE_R * 2.5;
        state.corners.forEach((c, i) => {
            const cp = fracToCanvas(c);
            const d  = Math.hypot(pt[0] - cp[0], pt[1] - cp[1]);
            if (d < bestD) { bestD = d; best = i; }
        });
        return best;
    }

    // ── Pointer events (covers both mouse & touch) ────────────────
    canvas.addEventListener('pointerdown', e => {
        e.preventDefault();
        const pt = evtPt(e);
        state.dragging = nearestCorner(pt);
        if (state.dragging >= 0) canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener('pointermove', e => {
        e.preventDefault();
        if (state.dragging === null || state.dragging < 0) return;
        const pt = evtPt(e);
        state.corners[state.dragging] = canvasToFrac(pt[0], pt[1]);
        _redraw(ov, state);
    });

    canvas.addEventListener('pointerup', e => {
        e.preventDefault();
        state.dragging = null;
    });

    canvas.addEventListener('pointercancel', () => { state.dragging = null; });
}

// ── Draw the corner overlay ─────────────────────────────────────────
function _redraw(ov, state) {
    const wrap   = ov.querySelector('#omr-ci-wrap');
    const canvas = ov.querySelector('#omr-ci-canvas');
    if (!canvas) return;

    // Keep canvas resolution in sync (handles orientation changes)
    if (canvas.width !== wrap.offsetWidth)  canvas.width  = wrap.offsetWidth;
    if (canvas.height !== wrap.offsetHeight) canvas.height = wrap.offsetHeight;

    const ctx = canvas.getContext('2d');
    const W   = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const img   = ov.querySelector('#omr-ci-img');
    const cW    = wrap.offsetWidth, cH = wrap.offsetHeight;
    const scale = Math.min(cW / img.naturalWidth, cH / img.naturalHeight);
    const dW    = img.naturalWidth * scale, dH = img.naturalHeight * scale;
    const bx    = (cW - dW) / 2, by = (cH - dH) / 2;

    function cp([fx, fy]) { return [bx + fx * dW, by + fy * dH]; }

    const [tl, tr, bl, br] = state.corners.map(cp);

    // ── Dark vignette outside the quad ────────────────────────────
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.60)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.moveTo(...tl); ctx.lineTo(...tr); ctx.lineTo(...br); ctx.lineTo(...bl);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ── Quad border ───────────────────────────────────────────────
    ctx.save();
    ctx.strokeStyle = 'rgba(52,211,153,0.9)';
    ctx.lineWidth   = 2.5;
    ctx.setLineDash([9, 5]);
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur  = 8;
    ctx.beginPath();
    ctx.moveTo(...tl); ctx.lineTo(...tr); ctx.lineTo(...br); ctx.lineTo(...bl);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // ── Corner handles ────────────────────────────────────────────
    state.corners.map(cp).forEach(([cx, cy], i) => {
        const col      = _HANDLE_COLS[i];
        const isActive = state.dragging === i;
        const r        = isActive ? _HANDLE_R + 5 : _HANDLE_R;

        // Shadow ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fill();
        ctx.restore();

        // Filled circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle   = col;
        ctx.shadowColor = col;
        ctx.shadowBlur  = isActive ? 18 : 10;
        ctx.fill();
        ctx.restore();

        // White border
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth   = 2;
        ctx.stroke();
        ctx.restore();

        // Label
        ctx.save();
        ctx.fillStyle    = '#000';
        ctx.font         = `bold ${Math.max(9, r * 0.55)}px -apple-system,sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(_CORNER_LABELS[i], cx, cy);
        ctx.restore();
    });

    // ── Corner legend (bottom of quad) ────────────────────────────
    const legY = Math.max(...[tl, tr, bl, br].map(p => p[1])) + 14;
    if (legY < H - 10) {
        const cx = (tl[0] + tr[0]) / 2;
        ctx.save();
        ctx.fillStyle    = 'rgba(255,255,255,0.55)';
        ctx.font         = 'bold 11px -apple-system,sans-serif';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Drag handles to sheet corners', cx, legY);
        ctx.restore();
    }
}

// ═══════════════════════════════════════════════════════════════════
//  RUN SCAN  (called after user confirms corners)
// ═══════════════════════════════════════════════════════════════════
async function _runScan(file, corners, layout) {
    document.getElementById('sticky-header').classList.add('hidden');
    const qList = document.getElementById('questions-list');

    // Layout label for spinner
    const layoutLabel = layout === '4col' ? '4×25' : layout === '2col' ? '2×50' : 'Auto';

    qList.innerHTML = `
      <div style="text-align:center;padding:80px 24px">
        <div style="width:88px;height:88px;margin:0 auto 20px;position:relative">
          <svg style="animation:spin 1s linear infinite;width:100%;height:100%"
               viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="44" stroke="#10b981" stroke-width="8"
                    stroke-dasharray="80 200" stroke-linecap="round"/>
          </svg>
          <i class="fa fa-dot-circle" style="color:#10b981;font-size:28px;
             position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)"></i>
        </div>
        <h2 style="font-size:22px;font-weight:900;color:#fff;margin:0 0 8px">Scanning OMR…</h2>
        <p style="font-size:13px;color:#71717a;margin:0 0 20px">
          Layout: ${layoutLabel} &nbsp;•&nbsp; No internet needed</p>
        <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap">
          ${['Warp','Greyscale','Threshold','Grid','Score'].map(s =>
            `<span style="padding:3px 10px;border-radius:99px;background:#27272a;
                          color:#71717a;font-size:10px;font-weight:700">${s}</span>`
          ).join('<span style="color:#3f3f46">→</span>')}
        </div>
      </div>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;

    try {
        if (typeof OMRProcessor === 'undefined')
            throw new Error('OMR engine not loaded — please refresh and try again.');

        const answerKey = questions.map(q => q.ans);
        const { summary, detailedResults, previewDataUrl, detectedLayout } =
            await OMRProcessor.processImage(file, answerKey, { corners, layout });

        // ── Populate userAnswers ──────────────────────────────────
        Object.keys(userAnswers).forEach(k => delete userAnswers[k]);
        detailedResults.forEach((r, i) => {
            if      (r.status === 'skipped') { /* leave undefined */ }
            else if (r.status === 'invalid') userAnswers[i] = '__invalid__';
            else                             userAnswers[i] = r.user;
        });

        // ── Result stat boxes ─────────────────────────────────────
        const totalPenalised = summary.wrong + summary.invalid;
        document.getElementById('res-correct').innerText = summary.correct;
        document.getElementById('res-wrong').innerText   = totalPenalised;
        document.getElementById('res-time').innerText    =
            summary.invalid > 0
                ? `⚠ ${summary.invalid} Invalid`
                : `${summary.skipped} Skipped`;
        document.getElementById('res-score').innerText =
            `${summary.finalScore}/${summary.totalQuestions}`;

        // Small breakdown under Wrong
        const wrongBox = document.getElementById('res-wrong').parentElement;
        if (wrongBox) {
            wrongBox.querySelector('.omr-breakdown')?.remove();
            const parts = [];
            if (summary.wrong   > 0) parts.push(`${summary.wrong} wrong`);
            if (summary.invalid > 0) parts.push(`${summary.invalid} invalid`);
            if (summary.skipped > 0) parts.push(`${summary.skipped} skip`);
            if (parts.length > 1) {
                const bp        = document.createElement('p');
                bp.className    = 'omr-breakdown';
                bp.style.cssText = 'font-size:9px;text-transform:uppercase;font-weight:700;opacity:.5;margin-top:2px';
                bp.textContent  = parts.join(' · ');
                wrongBox.appendChild(bp);
            }
        }

        // Layout badge in Speed box
        const timeEl = document.getElementById('res-time');
        if (timeEl) {
            const layoutBadge = timeEl.parentElement.querySelector('.omr-layout-badge');
            if (!layoutBadge) {
                const lb        = document.createElement('p');
                lb.className    = 'omr-layout-badge';
                lb.style.cssText = 'font-size:9px;text-transform:uppercase;font-weight:700;opacity:.5;margin-top:2px';
                lb.textContent  = detectedLayout === '4col' ? 'Layout: 4×25' : 'Layout: 2×50';
                timeEl.parentElement.appendChild(lb);
            }
        }

        document.getElementById('results-card').classList.remove('hidden');
        currentMode = 'sol';
        renderQuestions();

        // ── Yellow highlight for invalid answers ──────────────────
        if (summary.invalid > 0) {
            requestAnimationFrame(() => {
                const cards = document.querySelectorAll('#questions-list .question-card');
                detailedResults.forEach((r, i) => {
                    if (r.status === 'invalid' && cards[i]) {
                        cards[i].style.cssText +=
                            ';border-left:4px solid #eab308!important;box-shadow:0 0 0 1px rgba(234,179,8,.2)';
                        const badge = cards[i].querySelector('.status-badge');
                        if (badge) {
                            badge.style.background = 'rgba(234,179,8,.15)';
                            badge.style.color      = '#ca8a04';
                            badge.style.border     = '1px solid rgba(234,179,8,.3)';
                            badge.textContent      = `Invalid (−0.25) — ${r.user.toUpperCase()}`;
                        }
                    }
                });
            });
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
        saveResultToCloud(summary.finalScore, summary.correct, totalPenalised, 0);

    } catch (err) {
        console.error('OMR Scan Failed:', err);
        qList.innerHTML = `
          <div style="text-align:center;padding:80px 20px">
            <i class="fa fa-exclamation-triangle"
               style="font-size:52px;color:#f87171;display:block;margin-bottom:16px"></i>
            <h2 style="font-size:22px;font-weight:900;color:#fff;margin:0 0 8px">Scan Failed</h2>
            <p style="font-family:monospace;font-size:12px;color:#f87171;
               background:rgba(248,113,113,.1);padding:12px 16px;border-radius:12px;
               word-break:break-all;margin:12px 0;text-align:left">${err.message || err}</p>
            <button onclick="location.reload()"
              style="padding:12px 24px;font-weight:700;background:#ef4444;color:#fff;
                     border:none;border-radius:14px;cursor:pointer;font-size:14px">
              <i class="fa fa-redo" style="margin-right:6px"></i> Try Again
            </button>
          </div>`;
    }
}

// ── Legacy compatibility stub ──────────────────────────────────────
window.gradeAIOMR = (scannedAnswers) => {
    Object.keys(userAnswers).forEach(k => delete userAnswers[k]);
    questions.forEach((q, i) => {
        const a = scannedAnswers[(i + 1).toString()];
        if (a) userAnswers[i] = a.toLowerCase();
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
