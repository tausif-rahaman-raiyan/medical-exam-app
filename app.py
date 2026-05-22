import os
import json
import base64
import cv2
import numpy as np
from flask import Flask, request, jsonify, render_template_string, send_from_directory

from omr_scanner import (
    process_omr, debug_draw_bubbles, TEMPLATE, score_omr,
    _find_corner_squares, _edge_fallback, _order_points, correct_skew
)

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

OMR_HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>OMR Scanner — Medical Secret Files</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }

header {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  padding: 16px 24px; display: flex; align-items: center; gap: 12px;
  box-shadow: 0 4px 20px rgba(124,58,237,.4);
}
header .logo { width:36px;height:36px;background:rgba(255,255,255,.2);border-radius:10px;
               display:flex;align-items:center;justify-content:center;font-weight:900;font-size:.9rem; }
header h1 { font-size:1.2rem;font-weight:800;letter-spacing:.04em; }
header .badge { font-size:.7rem;opacity:.7;background:rgba(255,255,255,.18);padding:3px 10px;border-radius:99px; }
header .back-link { margin-left:auto;color:rgba(255,255,255,.75);text-decoration:none;font-size:.8rem;
                    display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;
                    border:1px solid rgba(255,255,255,.25);transition:all .2s; }
header .back-link:hover { background:rgba(255,255,255,.15);color:#fff; }

main { max-width:980px;margin:0 auto;padding:28px 18px; }

.card {
  background:#1e293b;border:1px solid #334155;
  border-radius:16px;padding:24px;margin-bottom:20px;
}
.card h2 { font-size:.9rem;font-weight:700;color:#a78bfa;margin-bottom:14px;
           display:flex;align-items:center;gap:8px; }

/* Drop zone */
.drop-zone {
  border:2px dashed #475569;border-radius:14px;padding:52px 20px;
  text-align:center;cursor:pointer;transition:all .2s;background:#0f172a;
  position:relative;
}
.drop-zone:hover,.drop-zone.over { border-color:#7c3aed;background:#1a1040; }
.drop-zone input { display:none; }
.drop-zone .icon { font-size:2.6rem;margin-bottom:10px; }
.drop-zone .hint { color:#94a3b8;font-size:.85rem;margin-top:6px; }
.drop-zone strong { color:#c4b5fd; }

/* Detection preview */
#detect-section { display:none; }
.detect-wrap { position:relative;border-radius:12px;overflow:hidden;border:1px solid #334155; }
.detect-wrap img { width:100%;display:block;border-radius:12px; }

.detect-status {
  display:flex;align-items:center;gap:10px;padding:12px 16px;
  border-radius:10px;margin-top:14px;font-size:.85rem;font-weight:600;
}
.detect-ok  { background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.35);color:#4ade80; }
.detect-warn { background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.35);color:#fcd34d; }
.detect-dot { width:9px;height:9px;border-radius:50%;flex-shrink:0; }
.dot-green { background:#22c55e; } .dot-yellow { background:#fbbf24; }

.row-btns { display:flex;gap:10px;margin-top:14px;flex-wrap:wrap; }
.btn-sm {
  padding:7px 16px;font-size:.78rem;font-weight:700;border-radius:8px;
  border:1px solid #475569;background:#0f172a;color:#94a3b8;cursor:pointer;transition:all .15s;
}
.btn-sm:hover { border-color:#7c3aed;color:#c4b5fd; }

/* Answer key */
.key-grid {
  display:grid;grid-template-columns:repeat(auto-fill,minmax(108px,1fr));
  gap:7px;max-height:260px;overflow-y:auto;padding-right:4px;
}
.key-item { display:flex;align-items:center;gap:5px;font-size:.8rem; }
.key-item label { color:#94a3b8;min-width:44px; }
.key-item select {
  flex:1;background:#0f172a;border:1px solid #475569;color:#e2e8f0;
  border-radius:6px;padding:4px 6px;font-size:.8rem;outline:none;cursor:pointer;
}
.key-item select:focus { border-color:#7c3aed; }

/* Spinner */
#spinner { display:none;text-align:center;padding:44px; }
.spin { width:46px;height:46px;border:5px solid #334155;
        border-top-color:#7c3aed;border-radius:50%;
        animation:spin .8s linear infinite;margin:0 auto 14px; }
@keyframes spin { to { transform:rotate(360deg); } }
#spinner p { color:#94a3b8;font-size:.88rem; }

/* Results */
#results-section { display:none; }
.score-bar { display:flex;gap:12px;flex-wrap:wrap;margin-bottom:22px; }
.score-chip {
  flex:1;min-width:110px;background:#0f172a;border-radius:12px;
  padding:14px;text-align:center;border:1px solid #334155;
}
.score-chip .val { font-size:1.9rem;font-weight:900; }
.score-chip .lbl { font-size:.65rem;text-transform:uppercase;letter-spacing:.08em;opacity:.5;margin-top:4px; }
.correct{color:#34d399}.wrong{color:#f87171}.skipped{color:#fbbf24}.total{color:#a78bfa}

/* Warn strip */
#warn-strip { display:none; }
.warn-banner {
  background:rgba(251,146,60,.1);border:1px solid rgba(251,146,60,.4);
  border-radius:10px;padding:12px 16px;font-size:.82rem;color:#fdba74;
  display:flex;gap:10px;align-items:flex-start;margin-bottom:16px;
}
.warn-tags { display:flex;flex-wrap:wrap;gap:6px;margin-top:8px; }
.warn-tag {
  background:rgba(251,146,60,.15);border:1px solid rgba(251,146,60,.4);
  border-radius:6px;padding:2px 8px;font-size:.75rem;color:#fb923c;
}

/* Debug image */
.debug-img { width:100%;border-radius:12px;border:1px solid #334155; }
.debug-legend { display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;font-size:.78rem; }
.dl-item { display:flex;align-items:center;gap:6px; }
.dl-dot { width:11px;height:11px;border-radius:50%; }

/* Answer grid */
.answers-grid {
  display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));
  gap:7px;max-height:420px;overflow-y:auto;
}
.ans-chip {
  background:#0f172a;border:1px solid #334155;border-radius:8px;
  padding:7px 10px;font-size:.78rem;display:flex;justify-content:space-between;align-items:center;
}
.ans-chip .q { color:#94a3b8; }
.ans-chip .a { font-weight:800;font-size:.92rem; }
.ans-chip.ok  { border-color:#059669;background:rgba(5,150,105,.08); }
.ans-chip.bad { border-color:#dc2626;background:rgba(220,38,38,.08); }
.ans-chip.skip{ border-color:#d97706;background:rgba(217,119,6,.08); }
.ans-chip.dbl { border-color:#ea580c;background:rgba(234,88,12,.08); }

/* Tabs */
.tabs { display:flex;gap:8px;margin-bottom:16px; }
.tab-btn {
  padding:7px 16px;border-radius:8px;border:1px solid #334155;
  background:#0f172a;color:#94a3b8;font-size:.8rem;font-weight:700;cursor:pointer;transition:all .15s;
}
.tab-btn.active { background:#7c3aed;color:#fff;border-color:#7c3aed; }
.tab-panel { display:none; }
.tab-panel.active { display:block; }

/* Error */
#error-box {
  display:none;background:rgba(220,38,38,.1);border:1px solid #dc2626;
  border-radius:10px;padding:12px 16px;color:#f87171;font-size:.85rem;margin-top:14px;
}

/* Step indicator */
.steps { display:flex;align-items:center;gap:0;margin-bottom:24px; }
.step { display:flex;align-items:center;gap:8px;font-size:.78rem;font-weight:700; }
.step-num {
  width:24px;height:24px;border-radius:50%;display:flex;align-items:center;
  justify-content:center;font-size:.72rem;font-weight:900;flex-shrink:0;
}
.step.done .step-num { background:#7c3aed;color:#fff; }
.step.active .step-num { background:#a78bfa;color:#fff;box-shadow:0 0 0 3px rgba(167,139,250,.25); }
.step.idle .step-num { background:#334155;color:#64748b; }
.step.done .step-label,.step.active .step-label { color:#e2e8f0; }
.step.idle .step-label { color:#475569; }
.step-sep { flex:1;height:2px;background:#334155;margin:0 8px; }
.step-sep.done { background:#7c3aed; }
</style>
</head>
<body>

<header>
  <div class="logo">OMR</div>
  <h1>OMR Scanner</h1>
  <span class="badge">Medical Admission Sheet · 100 Questions</span>
  <a class="back-link" href="/">
    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
    </svg>
    Back to App
  </a>
</header>

<main>

<!-- Step indicators -->
<div class="steps" id="steps-bar">
  <div class="step active" id="step1"><div class="step-num">1</div><span class="step-label">Upload Sheet</span></div>
  <div class="step-sep" id="sep1"></div>
  <div class="step idle"  id="step2"><div class="step-num">2</div><span class="step-label">Detect Corners</span></div>
  <div class="step-sep" id="sep2"></div>
  <div class="step idle"  id="step3"><div class="step-num">3</div><span class="step-label">Scan Bubbles</span></div>
  <div class="step-sep" id="sep3"></div>
  <div class="step idle"  id="step4"><div class="step-num">4</div><span class="step-label">Results</span></div>
</div>

<!-- ① Upload -->
<div class="card" id="upload-card">
  <h2>📄 Upload Your OMR Sheet</h2>
  <div class="drop-zone" id="drop-zone">
    <div class="icon">📸</div>
    <p><strong>Tap or click to upload</strong> · or drag &amp; drop</p>
    <p class="hint">JPG · PNG · WEBP — phone photos work great</p>
    <input type="file" id="file-input" accept="image/*" capture="environment">
  </div>
  <div id="error-box"></div>
</div>

<!-- ② Detection preview (auto-shown after upload) -->
<div class="card" id="detect-section">
  <h2>🎯 Corner Detection</h2>
  <div class="detect-wrap">
    <img id="detect-img" src="" alt="Detected sheet">
  </div>
  <div id="detect-status-bar" class="detect-status detect-ok">
    <div class="detect-dot dot-green"></div>
    <span id="detect-msg">4 corner markers detected — sheet aligned ✓</span>
  </div>
  <div class="row-btns">
    <button class="btn-sm" id="change-img-btn">✕ Change image</button>
  </div>
</div>

<!-- ③ Answer Key (always visible once image uploaded) -->
<div class="card" id="key-card" style="display:none">
  <h2>🗝️ Answer Key <span style="font-size:.68rem;color:#64748b;font-weight:400">(optional — leave blank to just read answers)</span></h2>
  <div class="key-grid" id="key-grid"></div>
</div>

<!-- Spinner -->
<div id="spinner">
  <div class="spin"></div>
  <p id="spinner-msg">Detecting sheet corners…</p>
</div>

<!-- Results -->
<div id="results-section">

  <div class="card">
    <h2>📊 Score Summary</h2>
    <div class="score-bar" id="score-bar"></div>
  </div>

  <div class="card">
    <h2>📋 Results</h2>
    <div id="warn-strip"></div>
    <div class="tabs">
      <button class="tab-btn active" data-tab="answers">Detected Answers</button>
      <button class="tab-btn" data-tab="debug">Debug View</button>
    </div>
    <div class="tab-panel active" id="tab-answers">
      <div class="answers-grid" id="answers-grid"></div>
    </div>
    <div class="tab-panel" id="tab-debug">
      <div class="debug-legend">
        <span class="dl-item"><div class="dl-dot" style="background:#22c55e"></div>Detected / Correct</span>
        <span class="dl-item"><div class="dl-dot" style="background:#ef4444"></div>Wrong</span>
        <span class="dl-item"><div class="dl-dot" style="background:#f97316"></div>Double-mark</span>
        <span class="dl-item"><div class="dl-dot" style="background:#555"></div>Not selected</span>
      </div>
      <img id="debug-img" class="debug-img" src="" alt="debug output">
    </div>
  </div>

  <div class="row-btns" style="margin-top:0">
    <button class="btn-sm" id="scan-again-btn">🔄 Scan another sheet</button>
  </div>

</div>

</main>

<script>
// ═══════════════════════════════════════
//  STATE
// ═══════════════════════════════════════
let selectedFile   = null;
let detectedCorners = null;   // [[x,y],[x,y],[x,y],[x,y]] from server

// ═══════════════════════════════════════
//  STEPS
// ═══════════════════════════════════════
function setStep(n) {
  [1,2,3,4].forEach(i => {
    const el = document.getElementById('step'+i);
    const sep = document.getElementById('sep'+i);
    el.className = 'step ' + (i < n ? 'done' : i === n ? 'active' : 'idle');
    if (sep) sep.className = 'step-sep' + (i < n ? ' done' : '');
  });
}

// ═══════════════════════════════════════
//  DROP ZONE
// ═══════════════════════════════════════
const dropZone  = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

dropZone.addEventListener('click',     () => fileInput.click());
dropZone.addEventListener('dragover',  e  => { e.preventDefault(); dropZone.classList.add('over'); });
dropZone.addEventListener('dragleave', ()  => dropZone.classList.remove('over'));
dropZone.addEventListener('drop',      e  => {
  e.preventDefault(); dropZone.classList.remove('over');
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => { if (fileInput.files.length) handleFile(fileInput.files[0]); });

// ═══════════════════════════════════════
//  MAIN FLOW: upload → detect → scan
// ═══════════════════════════════════════
async function handleFile(file) {
  selectedFile = file;
  document.getElementById('error-box').style.display = 'none';

  // Show spinner (detecting phase)
  document.getElementById('upload-card').style.display     = 'none';
  document.getElementById('detect-section').style.display  = 'none';
  document.getElementById('key-card').style.display        = 'none';
  document.getElementById('results-section').style.display = 'none';
  document.getElementById('spinner').style.display         = 'block';
  document.getElementById('spinner-msg').textContent       = 'Detecting sheet corners…';
  setStep(2);

  // ── Step 1: detect corners ──────────────────────────
  let detectData;
  try {
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch('/api/detect', { method: 'POST', body: fd });
    detectData = await res.json();
    if (!res.ok) throw new Error(detectData.error || 'Detection failed');
  } catch (e) {
    showError(e.message); return;
  }

  detectedCorners = detectData.corners;

  // Show detection preview
  document.getElementById('spinner').style.display   = 'none';
  document.getElementById('detect-section').style.display = 'block';
  document.getElementById('detect-img').src = detectData.preview;

  const statusBar = document.getElementById('detect-status-bar');
  const msg       = document.getElementById('detect-msg');
  if (detectData.detected) {
    statusBar.className = 'detect-status detect-ok';
    statusBar.querySelector('.detect-dot').className = 'detect-dot dot-green';
    msg.textContent = '4 corner markers detected — sheet auto-aligned ✓';
  } else {
    statusBar.className = 'detect-status detect-warn';
    statusBar.querySelector('.detect-dot').className = 'detect-dot dot-yellow';
    msg.textContent = 'Corners estimated via edge detection — check preview';
  }

  // Show answer key
  document.getElementById('key-card').style.display = 'block';
  setStep(3);

  // ── Step 2: scan immediately ────────────────────────
  document.getElementById('spinner').style.display   = 'block';
  document.getElementById('spinner-msg').textContent = 'Reading bubble marks…';

  const key = {};
  for (let q = 1; q <= 100; q++) {
    const sel = document.getElementById('key-q'+q);
    if (sel && sel.value) key['question_'+q] = sel.value;
  }

  try {
    const fd2 = new FormData();
    fd2.append('image',      file);
    fd2.append('answer_key', JSON.stringify(key));
    fd2.append('corners',    JSON.stringify(detectedCorners));

    const res2  = await fetch('/scan', { method:'POST', body: fd2 });
    const data2 = await res2.json();
    if (!res2.ok) throw new Error(data2.error || 'Scan failed');
    renderResults(data2, Object.keys(key).length > 0);
  } catch (e) {
    showError(e.message);
  } finally {
    document.getElementById('spinner').style.display = 'none';
  }
}

// ═══════════════════════════════════════
//  BUILD ANSWER KEY UI
// ═══════════════════════════════════════
const keyGrid = document.getElementById('key-grid');
for (let q = 1; q <= 100; q++) {
  const div = document.createElement('div');
  div.className = 'key-item';
  div.innerHTML = `<label>Q ${String(q).padStart(2,' ')}</label>
    <select id="key-q${q}">
      <option value="">—</option>
      <option>A</option><option>B</option>
      <option>C</option><option>D</option>
    </select>`;
  keyGrid.appendChild(div);
}

// ═══════════════════════════════════════
//  TABS
// ═══════════════════════════════════════
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn,.tab-panel').forEach(el => el.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-'+btn.dataset.tab).classList.add('active');
  });
});

// ═══════════════════════════════════════
//  CHANGE IMAGE
// ═══════════════════════════════════════
document.getElementById('change-img-btn').addEventListener('click', resetUI);
document.getElementById('scan-again-btn').addEventListener('click', resetUI);

function resetUI() {
  selectedFile = null; detectedCorners = null;
  document.getElementById('upload-card').style.display     = 'block';
  document.getElementById('detect-section').style.display  = 'none';
  document.getElementById('key-card').style.display        = 'none';
  document.getElementById('results-section').style.display = 'none';
  document.getElementById('spinner').style.display         = 'none';
  document.getElementById('error-box').style.display       = 'none';
  fileInput.value = '';
  setStep(1);
}

// ═══════════════════════════════════════
//  RENDER RESULTS
// ═══════════════════════════════════════
function renderResults(data, hasKey) {
  document.getElementById('spinner').style.display         = 'none';
  document.getElementById('results-section').style.display = 'block';
  setStep(4);

  const warnings = data.warnings || {};
  const answers  = data.answers  || {};
  const warnKeys = Object.keys(warnings);
  const answered = Object.values(answers).filter(Boolean).length;
  const skipped  = 100 - answered;

  let scoreHTML = `
    <div class="score-chip total"><div class="val">${answered}</div><div class="lbl">Answered</div></div>
    <div class="score-chip skipped"><div class="val">${skipped}</div><div class="lbl">Skipped</div></div>`;

  if (hasKey && data.score) {
    const s = data.score;
    scoreHTML = `
      <div class="score-chip correct"><div class="val">${s.correct}</div><div class="lbl">Correct</div></div>
      <div class="score-chip wrong"><div class="val">${s.wrong}</div><div class="lbl">Wrong</div></div>
      <div class="score-chip skipped"><div class="val">${s.skipped}</div><div class="lbl">Skipped</div></div>
      <div class="score-chip total"><div class="val">${s.correct - Math.floor(s.wrong/4)}</div><div class="lbl">Net Score</div></div>`;
  }
  document.getElementById('score-bar').innerHTML = scoreHTML;

  // Warnings
  const warnStrip = document.getElementById('warn-strip');
  if (warnKeys.length) {
    warnStrip.style.display = 'block';
    warnStrip.innerHTML = `<div class="warn-banner">
      <span style="font-size:1.1rem;flex-shrink:0">⚠️</span>
      <div>
        <strong>Double-mark detected on ${warnKeys.length} question(s)</strong>
        <div class="warn-tags">${warnKeys.map(q => `<span class="warn-tag">${q.replace('question_','Q')} · ${warnings[q].split(':')[1]}</span>`).join('')}</div>
      </div>
    </div>`;
  } else {
    warnStrip.style.display = 'none';
  }

  // Answers grid
  const grid = document.getElementById('answers-grid');
  grid.innerHTML = '';
  for (let q = 1; q <= 100; q++) {
    const key_q  = 'question_' + q;
    const ans    = answers[key_q];
    const isDbl  = key_q in warnings;
    let cls = 'ans-chip', tick = '';

    if (isDbl)       { cls += ' dbl'; tick = '⚠'; }
    else if (!ans)   { cls += ' skip'; }
    else if (hasKey && data.score) {
      const det = data.score.details?.[key_q];
      if (det) { cls += det.result === 'correct' ? ' ok' : ' bad'; tick = det.result === 'correct' ? '✓' : '✗'; }
    }

    const chip = document.createElement('div');
    chip.className = cls;
    chip.innerHTML = `<span class="q">Q${q}</span><span class="a">${ans || '—'}</span><span class="tick">${tick}</span>`;
    grid.appendChild(chip);
  }

  // Debug image
  if (data.debug_image) {
    document.getElementById('debug-img').src = data.debug_image;
  }
}

// ═══════════════════════════════════════
//  ERROR
// ═══════════════════════════════════════
function showError(msg) {
  document.getElementById('spinner').style.display     = 'none';
  document.getElementById('upload-card').style.display = 'block';
  const eb = document.getElementById('error-box');
  eb.textContent = '✗ ' + msg; eb.style.display = 'block';
  setStep(1);
}
</script>
</body>
</html>"""


# ─── Static file serving (serves www/ directory) ──────────────────────────────

@app.route('/')
def root():
    return send_from_directory('www', 'index.html')

@app.route('/omr')
def omr_scanner():
    return render_template_string(OMR_HTML)

@app.route('/<path:path>')
def serve_static(path):
    try:
        return send_from_directory('www', path)
    except Exception:
        return send_from_directory('www', 'index.html'), 404


# ─── Corner Detection API ──────────────────────────────────────────────────────

def _draw_filled_rect(canvas, x1, y1, x2, y2, color_bgr, alpha=0.35, label=None,
                      label_color=(255, 255, 255), font_scale=0.7, thickness=2):
    """Draw a semi-transparent filled rectangle with optional label."""
    x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
    roi = canvas[y1:y2, x1:x2]
    if roi.size == 0:
        return
    filled = np.full_like(roi, color_bgr)
    cv2.addWeighted(filled, alpha, roi, 1 - alpha, 0, roi)
    canvas[y1:y2, x1:x2] = roi
    cv2.rectangle(canvas, (x1, y1), (x2, y2), color_bgr, thickness)
    if label:
        fs = font_scale
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, fs, 2)
        tx = x1 + (x2 - x1 - tw) // 2
        ty = y1 + (y2 - y1 + th) // 2
        cv2.putText(canvas, label, (tx, ty),
                    cv2.FONT_HERSHEY_SIMPLEX, fs, (0, 0, 0), 4)
        cv2.putText(canvas, label, (tx, ty),
                    cv2.FONT_HERSHEY_SIMPLEX, fs, label_color, 2)


def _lerp_point(p1, p2, t):
    """Linearly interpolate between two (x,y) points."""
    return (int(p1[0] + t * (p2[0] - p1[0])),
            int(p1[1] + t * (p2[1] - p1[1])))


@app.route('/api/detect', methods=['POST'])
def detect_corners():
    file = request.files.get('image')
    if not file:
        return jsonify({'error': 'No image uploaded'}), 400

    filename = 'detect_upload.jpg'
    path     = os.path.join(UPLOAD_FOLDER, filename)
    file.save(path)

    image = cv2.imread(path)
    if image is None:
        return jsonify({'error': 'Could not decode image'}), 400

    img_h, img_w = image.shape[:2]
    gray     = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    corners  = _find_corner_squares(gray)
    detected = corners is not None
    if corners is None:
        corners = _edge_fallback(gray)

    # corners order after _order_points: TL, TR, BR, BL
    tl = corners[0].astype(int)
    tr = corners[1].astype(int)
    br = corners[2].astype(int)
    bl = corners[3].astype(int)

    # ── Derived measurements ──────────────────────────────────────────
    grid_top    = int(min(tl[1], tr[1]))
    grid_left   = int(min(tl[0], bl[0]))
    grid_right  = int(max(tr[0], br[0]))
    grid_width  = grid_right - grid_left
    header_h    = grid_top          # height of header above the answer grid

    # Roll No.: top-left of header (approx 23% of grid width, same left edge)
    roll_x1 = grid_left
    roll_x2 = grid_left + int(grid_width * 0.23)
    roll_y1 = max(0, int(header_h * 0.05))
    roll_y2 = int(header_h * 0.80)

    # Reg No.: top-right of header (symmetric)
    reg_x2  = grid_right
    reg_x1  = grid_right - int(grid_width * 0.23)
    reg_y1  = roll_y1
    reg_y2  = roll_y2

    # ── Build overlay ─────────────────────────────────────────────────
    overlay = image.copy()

    # 1. Roll No. region — blue
    _draw_filled_rect(overlay, roll_x1, roll_y1, roll_x2, roll_y2,
                      (180, 80, 0), alpha=0.40, label='ROLL NO.',
                      font_scale=max(0.5, grid_width / 1800))

    # 2. Reg No. region — orange/amber
    _draw_filled_rect(overlay, reg_x1, reg_y1, reg_x2, reg_y2,
                      (0, 140, 220), alpha=0.40, label='REG NO.',
                      font_scale=max(0.5, grid_width / 1800))

    # 3. Answer grid outline — bright green quad
    pts_draw = np.array([tl, tr, br, bl], dtype=np.int32)
    cv2.polylines(overlay, [pts_draw.reshape(-1, 1, 2)], True, (0, 230, 60), 3)

    # 4. Column dividers inside the answer grid using perspective-correct lerp
    #    WARP column boundaries (0-1000 scale): edges between blocks
    #    COLUMN_BASES: {1:109, 2:357, 3:605, 4:853}; BUBBLE_SPACING=40; 4 bubbles
    col_info = [
        ('Q 1–25',   109,  109 + 3*40),   # base_x, base_x + 3*spacing
        ('Q 26–50',  357,  357 + 3*40),
        ('Q 51–75',  605,  605 + 3*40),
        ('Q 76–100', 853,  853 + 3*40),
    ]
    col_colors = [
        (60, 180, 60),    # green
        (60, 120, 220),   # blue
        (200, 100, 20),   # orange
        (160, 40, 200),   # purple
    ]

    for i, (label, bx_left, bx_right) in enumerate(col_info):
        # Normalise warp x to 0-1 fraction within the answer grid width
        t_left  = bx_left  / 1000.0
        t_right = bx_right / 1000.0
        pad     = (t_right - t_left) * 0.3   # small outward pad
        t_left  = max(0, t_left - pad)
        t_right = min(1, t_right + pad)

        # Perspective-correct top & bottom points for this column
        top_l = _lerp_point(tl, tr, t_left)
        top_r = _lerp_point(tl, tr, t_right)
        bot_l = _lerp_point(bl, br, t_left)
        bot_r = _lerp_point(bl, br, t_right)

        col_quad = np.array([top_l, top_r, bot_r, bot_l], dtype=np.int32)
        color    = col_colors[i]

        # Semi-transparent fill
        mask_layer = overlay.copy()
        cv2.fillPoly(mask_layer, [col_quad], color)
        cv2.addWeighted(mask_layer, 0.18, overlay, 0.82, 0, overlay)

        # Outline
        cv2.polylines(overlay, [col_quad.reshape(-1, 1, 2)], True, color, 2)

        # Label at top of column
        mid_x = (top_l[0] + top_r[0]) // 2
        mid_y = top_l[1] + int((bot_l[1] - top_l[1]) * 0.05)
        fs    = max(0.38, grid_width / 3200)
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, fs, 2)
        cv2.putText(overlay, label, (mid_x - tw // 2, mid_y + th),
                    cv2.FONT_HERSHEY_SIMPLEX, fs, (0, 0, 0), 3)
        cv2.putText(overlay, label, (mid_x - tw // 2, mid_y + th),
                    cv2.FONT_HERSHEY_SIMPLEX, fs, (255, 255, 255), 1)

    # 5. Corner squares: coloured dots on the black registration marks
    CORNER_COLORS = [(0, 50, 230), (0, 210, 0), (210, 60, 0), (0, 120, 255)]
    CORNER_LABELS = ['TL', 'TR', 'BR', 'BL']
    for i, (px, py) in enumerate([tl, tr, br, bl]):
        r = max(14, int(grid_width * 0.018))
        cv2.circle(overlay, (px, py), r, CORNER_COLORS[i], -1)
        cv2.circle(overlay, (px, py), r, (255, 255, 255), 2)
        fs = max(0.4, grid_width / 2800)
        (tw, th), _ = cv2.getTextSize(CORNER_LABELS[i],
                                       cv2.FONT_HERSHEY_SIMPLEX, fs, 2)
        cv2.putText(overlay, CORNER_LABELS[i],
                    (px - tw // 2, py + th // 2),
                    cv2.FONT_HERSHEY_SIMPLEX, fs, (255, 255, 255), 2)

    # 6. Legend bar at the very top of the image
    legend_h = max(32, int(img_h * 0.025))
    cv2.rectangle(overlay, (0, 0), (img_w, legend_h), (20, 20, 30), -1)
    items = [
        ('■ ROLL NO.', (180, 80, 0)),
        ('■ REG NO.',  (0, 140, 220)),
        ('■ Q1-25',   (60, 180, 60)),
        ('■ Q26-50',  (60, 120, 220)),
        ('■ Q51-75',  (200, 100, 20)),
        ('■ Q76-100', (160, 40, 200)),
    ]
    lfs = max(0.3, img_w / 4000)
    lx  = 6
    for text, color in items:
        (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, lfs, 1)
        if lx + tw > img_w - 4:
            break
        cv2.putText(overlay, text, (lx, legend_h - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, lfs, color, 1)
        lx += tw + 10

    # ── Encode preview ────────────────────────────────────────────────
    _, buf      = cv2.imencode('.jpg', overlay, [cv2.IMWRITE_JPEG_QUALITY, 90])
    preview_b64 = 'data:image/jpeg;base64,' + base64.b64encode(buf).decode()

    regions = {
        'answer_grid': {'tl': tl.tolist(), 'tr': tr.tolist(),
                        'br': br.tolist(), 'bl': bl.tolist()},
        'roll_no':  [roll_x1, roll_y1, roll_x2, roll_y2],
        'reg_no':   [reg_x1,  reg_y1,  reg_x2,  reg_y2],
    }

    return jsonify({
        'preview':  preview_b64,
        'corners':  corners.tolist(),
        'detected': detected,
        'regions':  regions,
    })


# ─── Scan API ─────────────────────────────────────────────────────────────────

@app.route('/scan', methods=['POST'])
def scan():
    file = request.files.get('image')
    if not file:
        return jsonify({'error': 'No image uploaded'}), 400

    filename = 'omr_upload.jpg'
    path     = os.path.join(UPLOAD_FOLDER, filename)
    file.save(path)

    raw_key  = request.form.get('answer_key', '{}')
    raw_corn = request.form.get('corners', 'null')

    try:
        answer_key = json.loads(raw_key)
    except Exception:
        answer_key = {}

    manual_corners = None
    try:
        corn_list = json.loads(raw_corn)
        if corn_list and len(corn_list) == 4:
            manual_corners = np.array(corn_list, dtype='float32')
    except Exception:
        pass

    try:
        answers, warnings = process_omr(path, manual_corners=manual_corners)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    score_result = score_omr(answers, answer_key) if answer_key else None

    # Debug overlay
    debug_path = os.path.join(UPLOAD_FOLDER, 'debug_output.jpg')
    try:
        debug_draw_bubbles(
            path, answers, debug_path,
            manual_corners=manual_corners,
            answer_key=answer_key or None,
            warnings=warnings
        )
        with open(debug_path, 'rb') as f:
            debug_b64 = 'data:image/jpeg;base64,' + base64.b64encode(f.read()).decode()
    except Exception:
        debug_b64 = ''

    return jsonify({
        'answers':     answers,
        'warnings':    warnings,
        'score':       score_result,
        'debug_image': debug_b64,
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
