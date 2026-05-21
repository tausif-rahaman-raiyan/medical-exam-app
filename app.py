import os
import json
import base64
import cv2
import numpy as np
from flask import Flask, request, jsonify, render_template_string

from omr_scanner import (
    process_omr, debug_draw_bubbles, TEMPLATE, score_omr, calibrate
)

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

HTML = r"""
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>OMR Scanner</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }

header {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  padding: 16px 32px; display: flex; align-items: center; gap: 12px;
  box-shadow: 0 4px 20px rgba(124,58,237,.4);
}
header h1 { font-size: 1.25rem; font-weight: 800; letter-spacing: .04em; }
header .badge { font-size: .72rem; opacity: .75; background: rgba(255,255,255,.18);
               padding: 2px 10px; border-radius: 99px; }

main { max-width: 1160px; margin: 0 auto; padding: 28px 20px; }

.card {
  background: #1e293b; border: 1px solid #334155;
  border-radius: 16px; padding: 26px; margin-bottom: 22px;
}
.card h2 { font-size: .95rem; font-weight: 700; color: #a78bfa; margin-bottom: 16px;
           display: flex; align-items: center; gap: 8px; }

/* ── Drop zone ── */
.drop-zone {
  border: 2px dashed #475569; border-radius: 12px; padding: 44px 20px;
  text-align: center; cursor: pointer; transition: all .2s; background: #0f172a;
}
.drop-zone:hover, .drop-zone.over { border-color: #7c3aed; background: #1e1346; }
.drop-zone input { display: none; }
.drop-zone p { color: #94a3b8; font-size: .88rem; margin-top: 8px; }
.drop-zone .icon { font-size: 2.4rem; }

/* ── Corner editor ── */
#corner-section { display: none; }

.corner-wrap {
  position: relative; display: inline-block;
  border-radius: 10px; overflow: hidden;
  border: 1px solid #334155;
  cursor: crosshair;
}
#sheet-canvas {
  display: block; max-width: 100%;
  touch-action: none;
}

.corner-legend {
  display: flex; flex-wrap: wrap; gap: 10px 20px;
  margin-top: 14px; font-size: .8rem;
}
.corner-legend span { display: flex; align-items: center; gap: 6px; }
.legend-dot {
  width: 13px; height: 13px; border-radius: 50%; flex-shrink: 0;
}

.corner-hint {
  background: rgba(124,58,237,.12); border: 1px solid rgba(124,58,237,.35);
  border-radius: 10px; padding: 11px 15px; font-size: .8rem;
  color: #c4b5fd; margin-top: 14px; display: flex; gap: 10px; align-items: flex-start;
}
.corner-hint .ico { font-size: 1rem; flex-shrink: 0; margin-top: 1px; }

.row-btns { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
.btn-sm {
  padding: 7px 16px; font-size: .8rem; font-weight: 700;
  border-radius: 8px; border: 1px solid #475569; background: #0f172a;
  color: #94a3b8; cursor: pointer; transition: all .15s;
}
.btn-sm:hover { border-color: #7c3aed; color: #c4b5fd; }

/* ── Answer key ── */
.key-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
  gap: 7px; max-height: 260px; overflow-y: auto; padding-right: 4px;
}
.key-item { display: flex; align-items: center; gap: 5px; font-size: .8rem; }
.key-item label { color: #94a3b8; min-width: 44px; }
.key-item select {
  flex: 1; background: #0f172a; border: 1px solid #475569; color: #e2e8f0;
  border-radius: 6px; padding: 4px 6px; font-size: .8rem; outline: none; cursor: pointer;
}
.key-item select:focus { border-color: #7c3aed; }

/* ── Scan button ── */
#scan-btn {
  width: 100%; padding: 15px; font-size: 1rem; font-weight: 800;
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  color: #fff; border: none; border-radius: 12px; cursor: pointer;
  letter-spacing: .04em; transition: opacity .2s, transform .15s;
  box-shadow: 0 4px 20px rgba(124,58,237,.4);
}
#scan-btn:hover  { opacity: .9; transform: translateY(-1px); }
#scan-btn:active { transform: translateY(0); }
#scan-btn:disabled { opacity: .45; cursor: not-allowed; transform: none; }

/* ── Spinner ── */
#spinner { display: none; text-align: center; padding: 40px; }
.spin { width: 46px; height: 46px; border: 5px solid #334155;
        border-top-color: #7c3aed; border-radius: 50%;
        animation: spin .8s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Results ── */
#results-section { display: none; }

.score-bar { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 22px; }
.score-chip {
  flex: 1; min-width: 110px; background: #0f172a; border-radius: 12px;
  padding: 14px; text-align: center; border: 1px solid #334155;
}
.score-chip .val { font-size: 1.9rem; font-weight: 900; }
.score-chip .lbl { font-size: .68rem; text-transform: uppercase;
                   letter-spacing: .08em; opacity: .55; margin-top: 4px; }
.correct  { color: #34d399; }
.wrong    { color: #f87171; }
.skipped  { color: #fbbf24; }
.total    { color: #a78bfa; }
.warning  { color: #fb923c; }

/* ── Warnings strip ── */
#warn-strip { display: none; }
.warn-banner {
  background: rgba(251,146,60,.1); border: 1px solid rgba(251,146,60,.4);
  border-radius: 10px; padding: 12px 16px; font-size: .82rem; color: #fdba74;
  display: flex; gap: 10px; align-items: flex-start; margin-bottom: 16px;
}
.warn-banner .ico { font-size: 1.1rem; flex-shrink: 0; }
.warn-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.warn-tag {
  background: rgba(251,146,60,.15); border: 1px solid rgba(251,146,60,.4);
  border-radius: 6px; padding: 2px 8px; font-size: .75rem; color: #fb923c;
}

/* ── Debug image ── */
.debug-img { width: 100%; border-radius: 12px; border: 1px solid #334155; }
.debug-legend {
  display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 12px;
  font-size: .78rem;
}
.dl-item { display: flex; align-items: center; gap: 6px; }
.dl-dot { width: 11px; height: 11px; border-radius: 50%; }

/* ── Answers grid ── */
.answers-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr));
  gap: 7px; max-height: 420px; overflow-y: auto;
}
.ans-chip {
  background: #0f172a; border: 1px solid #334155; border-radius: 8px;
  padding: 7px 10px; font-size: .78rem; display: flex;
  justify-content: space-between; align-items: center;
}
.ans-chip .q   { color: #94a3b8; }
.ans-chip .a   { font-weight: 800; font-size: .92rem; }
.ans-chip.ok   { border-color: #059669; background: rgba(5,150,105,.08); }
.ans-chip.bad  { border-color: #dc2626; background: rgba(220,38,38,.08); }
.ans-chip.skip { border-color: #d97706; background: rgba(217,119,6,.08); }
.ans-chip.dbl  { border-color: #ea580c; background: rgba(234,88,12,.08); }
.ans-chip .tick { font-size: .82rem; }

/* ── Tabs ── */
.tabs { display: flex; gap: 8px; margin-bottom: 16px; }
.tab-btn {
  padding: 7px 16px; border-radius: 8px; border: 1px solid #334155;
  background: #0f172a; color: #94a3b8; font-size: .8rem; font-weight: 700;
  cursor: pointer; transition: all .15s;
}
.tab-btn.active { background: #7c3aed; color: #fff; border-color: #7c3aed; }
.tab-panel { display: none; }
.tab-panel.active { display: block; }

/* ── Error box ── */
#error-box {
  display: none; background: rgba(220,38,38,.1); border: 1px solid #dc2626;
  border-radius: 10px; padding: 12px 16px; color: #f87171;
  font-size: .85rem; margin-top: 14px;
}
</style>
</head>
<body>

<header>
  <div style="width:34px;height:34px;background:rgba(255,255,255,.2);border-radius:9px;
              display:flex;align-items:center;justify-content:center;font-weight:900;font-size:.85rem">
    OMR
  </div>
  <h1>OMR Scanner</h1>
  <span class="badge">100-Question Medical Admission Sheet</span>
</header>

<main>

<!-- ① Upload -->
<div class="card">
  <h2>① Upload OMR Sheet</h2>
  <div class="drop-zone" id="drop-zone">
    <div class="icon">📄</div>
    <p><strong>Click to upload</strong> or drag &amp; drop</p>
    <p style="font-size:.75rem;margin-top:5px">JPG · PNG · WEBP — phone photos are fine</p>
    <input type="file" id="file-input" accept="image/*">
  </div>
</div>

<!-- ② Corner alignment -->
<div class="card" id="corner-section">
  <h2>② Align Sheet Corners
    <span style="font-size:.7rem;font-weight:400;color:#64748b">— drag the coloured handles to the 4 corners of your OMR sheet</span>
  </h2>

  <div class="corner-hint">
    <span class="ico">💡</span>
    <span>Each coloured handle marks one corner of the answer-grid rectangle.
    Drag them so the quadrilateral exactly frames the printed sheet boundary.
    The scanner will straighten the image automatically before reading.</span>
  </div>

  <div style="margin-top:16px; overflow-x:auto;">
    <div class="corner-wrap" id="corner-wrap">
      <canvas id="sheet-canvas"></canvas>
    </div>
  </div>

  <div class="corner-legend">
    <span><div class="legend-dot" style="background:#ef4444"></div> Top-Left</span>
    <span><div class="legend-dot" style="background:#22c55e"></div> Top-Right</span>
    <span><div class="legend-dot" style="background:#3b82f6"></div> Bottom-Right</span>
    <span><div class="legend-dot" style="background:#f59e0b"></div> Bottom-Left</span>
  </div>

  <div class="row-btns">
    <button class="btn-sm" id="reset-corners-btn">↺ Reset corners</button>
    <button class="btn-sm" id="change-img-btn">✕ Change image</button>
  </div>
</div>

<!-- ③ Answer key -->
<div class="card">
  <h2>③ Answer Key <span style="font-size:.68rem;color:#64748b;font-weight:400">(optional)</span></h2>
  <div class="key-grid" id="key-grid"></div>
</div>

<!-- Scan button -->
<button id="scan-btn" disabled>📷 &nbsp; SCAN OMR SHEET</button>
<div id="error-box"></div>

<!-- Spinner -->
<div id="spinner">
  <div class="spin"></div>
  <p style="color:#94a3b8;font-size:.88rem">Processing image…</p>
</div>

<!-- Results -->
<div id="results-section">

  <div class="card" style="margin-top:26px">
    <h2>④ Score Summary</h2>
    <div class="score-bar" id="score-bar"></div>
  </div>

  <div class="card">
    <h2>⑤ Results</h2>

    <!-- Double-mark warnings -->
    <div id="warn-strip"></div>

    <div class="tabs">
      <button class="tab-btn active" data-tab="answers">Detected Answers</button>
      <button class="tab-btn"        data-tab="debug">Debug View</button>
    </div>

    <div class="tab-panel active" id="tab-answers">
      <div class="answers-grid" id="answers-grid"></div>
    </div>

    <div class="tab-panel" id="tab-debug">
      <div class="debug-legend">
        <span class="dl-item"><div class="dl-dot" style="background:#22c55e"></div> Detected / Correct</span>
        <span class="dl-item"><div class="dl-dot" style="background:#ef4444"></div> Wrong</span>
        <span class="dl-item"><div class="dl-dot" style="background:#f97316"></div> Double-mark</span>
        <span class="dl-item"><div class="dl-dot" style="background:#555"></div> Not selected</span>
      </div>
      <img id="debug-img" class="debug-img" src="" alt="debug output">
    </div>
  </div>
</div>

</main>

<script>
// ═══════════════════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════════════════
let imgNaturalW = 0, imgNaturalH = 0;
let selectedFile = null;
const canvas  = document.getElementById('sheet-canvas');
const ctx     = canvas.getContext('2d');
let imgBitmap = null;

// Corner colours & initial positions (set after image loads)
const CORNERS = [
  { label: 'TL', color: '#ef4444' },   // 0 Top-Left
  { label: 'TR', color: '#22c55e' },   // 1 Top-Right
  { label: 'BR', color: '#3b82f6' },   // 2 Bottom-Right
  { label: 'BL', color: '#f59e0b' },   // 3 Bottom-Left
];
let handles = [];   // [{x,y},...] in CANVAS px

const HANDLE_R = 11;   // handle circle radius in canvas px
let dragging   = -1;   // index of handle being dragged

// ═══════════════════════════════════════════════════════════════════════
//  CORNER CANVAS
// ═══════════════════════════════════════════════════════════════════════
function resetHandles() {
  const p = 0.04;   // 4% inset from canvas edge
  const w = canvas.width, h = canvas.height;
  handles = [
    { x: w * p,       y: h * p      },   // TL
    { x: w * (1 - p), y: h * p      },   // TR
    { x: w * (1 - p), y: h * (1-p) },   // BR
    { x: w * p,       y: h * (1-p) },   // BL
  ];
}

function drawCanvas() {
  if (!imgBitmap) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imgBitmap, 0, 0, canvas.width, canvas.height);

  // Semi-transparent overlay outside the quad
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.moveTo(handles[0].x, handles[0].y);
  handles.forEach(h => ctx.lineTo(h.x, h.y));
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.fill('evenodd');
  ctx.restore();

  // Quad outline
  ctx.beginPath();
  ctx.moveTo(handles[0].x, handles[0].y);
  handles.forEach(h => ctx.lineTo(h.x, h.y));
  ctx.closePath();
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Handles
  handles.forEach((h, i) => {
    ctx.beginPath();
    ctx.arc(h.x, h.y, HANDLE_R, 0, Math.PI * 2);
    ctx.fillStyle   = CORNERS[i].color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(CORNERS[i].label, h.x, h.y);
  });
}

// Convert canvas coords → original image coords
function canvasToImage(cx, cy) {
  const scaleX = imgNaturalW / canvas.width;
  const scaleY = imgNaturalH / canvas.height;
  return [cx * scaleX, cy * scaleY];
}

function getCornerPayload() {
  return handles.map(h => canvasToImage(h.x, h.y));
}

// Pointer helpers
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const src = e.touches ? e.touches[0] : e;
  return {
    x: (src.clientX - rect.left) * scaleX,
    y: (src.clientY - rect.top)  * scaleY,
  };
}

function hitHandle(pos) {
  for (let i = handles.length - 1; i >= 0; i--) {
    const dx = pos.x - handles[i].x;
    const dy = pos.y - handles[i].y;
    if (Math.hypot(dx, dy) <= HANDLE_R + 8) return i;
  }
  return -1;
}

canvas.addEventListener('mousedown',  e => { dragging = hitHandle(getPos(e)); });
canvas.addEventListener('touchstart', e => { e.preventDefault(); dragging = hitHandle(getPos(e)); }, { passive: false });

canvas.addEventListener('mousemove', e => {
  if (dragging < 0) return;
  const p = getPos(e);
  handles[dragging] = { x: Math.max(0, Math.min(canvas.width, p.x)),
                        y: Math.max(0, Math.min(canvas.height, p.y)) };
  drawCanvas();
});
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (dragging < 0) return;
  const p = getPos(e);
  handles[dragging] = { x: Math.max(0, Math.min(canvas.width, p.x)),
                        y: Math.max(0, Math.min(canvas.height, p.y)) };
  drawCanvas();
}, { passive: false });

canvas.addEventListener('mouseup',  () => { dragging = -1; });
canvas.addEventListener('touchend', () => { dragging = -1; });

// ═══════════════════════════════════════════════════════════════════════
//  FILE HANDLING
// ═══════════════════════════════════════════════════════════════════════
const dropZone  = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

dropZone.addEventListener('click',     () => fileInput.click());
dropZone.addEventListener('dragover',  e  => { e.preventDefault(); dropZone.classList.add('over'); });
dropZone.addEventListener('dragleave', ()  => dropZone.classList.remove('over'));
dropZone.addEventListener('drop',      e  => {
  e.preventDefault(); dropZone.classList.remove('over');
  if (e.dataTransfer.files.length) loadFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => { if (fileInput.files.length) loadFile(fileInput.files[0]); });

function loadFile(file) {
  selectedFile = file;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    imgNaturalW = img.naturalWidth;
    imgNaturalH = img.naturalHeight;

    // Size canvas — max 680px wide, preserve aspect
    const maxW = Math.min(680, window.innerWidth - 48);
    const scale = Math.min(1, maxW / imgNaturalW);
    canvas.width  = Math.round(imgNaturalW * scale);
    canvas.height = Math.round(imgNaturalH * scale);

    createImageBitmap(img).then(bmp => {
      imgBitmap = bmp;
      resetHandles();
      drawCanvas();
    });

    document.getElementById('corner-section').style.display = 'block';
    document.getElementById('drop-zone').style.display      = 'none';
    document.getElementById('scan-btn').disabled            = false;
    document.getElementById('error-box').style.display      = 'none';
    document.getElementById('results-section').style.display = 'none';
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

document.getElementById('reset-corners-btn').addEventListener('click', () => {
  resetHandles(); drawCanvas();
});
document.getElementById('change-img-btn').addEventListener('click', () => {
  selectedFile = null; imgBitmap = null;
  document.getElementById('corner-section').style.display = 'none';
  document.getElementById('drop-zone').style.display      = 'block';
  document.getElementById('scan-btn').disabled            = true;
  fileInput.value = '';
});

// ═══════════════════════════════════════════════════════════════════════
//  ANSWER KEY
// ═══════════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════════
//  TABS
// ═══════════════════════════════════════════════════════════════════════
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn,  .tab-panel')
            .forEach(el => el.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// ═══════════════════════════════════════════════════════════════════════
//  SCAN
// ═══════════════════════════════════════════════════════════════════════
document.getElementById('scan-btn').addEventListener('click', async () => {
  if (!selectedFile) return;

  const key = {};
  for (let q = 1; q <= 100; q++) {
    const v = document.getElementById(`key-q${q}`).value;
    if (v) key[`question_${q}`] = v;
  }

  const fd = new FormData();
  fd.append('image', selectedFile);
  fd.append('answer_key', JSON.stringify(key));
  fd.append('corners', JSON.stringify(getCornerPayload()));

  document.getElementById('scan-btn').disabled = true;
  document.getElementById('spinner').style.display = 'block';
  document.getElementById('results-section').style.display = 'none';
  document.getElementById('error-box').style.display = 'none';

  try {
    const res  = await fetch('/scan', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Server error');
    renderResults(data, Object.keys(key).length > 0);
  } catch (e) {
    const eb = document.getElementById('error-box');
    eb.textContent = '✗ ' + e.message; eb.style.display = 'block';
  } finally {
    document.getElementById('scan-btn').disabled = false;
    document.getElementById('spinner').style.display = 'none';
  }
});

// ═══════════════════════════════════════════════════════════════════════
//  RENDER RESULTS
// ═══════════════════════════════════════════════════════════════════════
function renderResults(data, hasKey) {
  const warnings  = data.warnings || {};
  const answers   = data.answers  || {};
  const warnKeys  = Object.keys(warnings);
  const answered  = Object.values(answers).filter(Boolean).length;
  const skipped   = 100 - answered;

  // Score chips
  let scoreHTML = `
    <div class="score-chip total"><div class="val">${answered}</div><div class="lbl">Answered</div></div>
    <div class="score-chip skipped"><div class="val">${skipped}</div><div class="lbl">Skipped</div></div>`;

  if (hasKey && data.score) {
    const s = data.score;
    scoreHTML = `
      <div class="score-chip correct"><div class="val">${s.correct}</div><div class="lbl">Correct</div></div>
      <div class="score-chip wrong"  ><div class="val">${s.wrong}</div><div class="lbl">Wrong</div></div>
      <div class="score-chip skipped"><div class="val">${s.skipped}</div><div class="lbl">Skipped</div></div>
      <div class="score-chip total"  ><div class="val">${s.correct}/100</div><div class="lbl">Score</div></div>`;
    if (warnKeys.length)
      scoreHTML += `<div class="score-chip warning"><div class="val">${warnKeys.length}</div><div class="lbl">Double-marks</div></div>`;
  }
  document.getElementById('score-bar').innerHTML = scoreHTML;

  // Double-mark warnings
  const warnStrip = document.getElementById('warn-strip');
  if (warnKeys.length) {
    const tags = warnKeys.map(q => {
      const qn = q.replace('question_','Q');
      const dm = warnings[q].replace('double_mark:','').replace('+',' & ');
      return `<span class="warn-tag">${qn}: ${dm}</span>`;
    }).join('');
    warnStrip.innerHTML = `
      <div class="warn-banner">
        <span class="ico">⚠️</span>
        <div>
          <strong>Double-marked questions detected</strong> — two bubbles were nearly equally dark.
          The darker one was chosen, but please verify manually.
          <div class="warn-tags">${tags}</div>
        </div>
      </div>`;
    warnStrip.style.display = 'block';
  } else {
    warnStrip.style.display = 'none';
  }

  // Answer chips
  const ag = document.getElementById('answers-grid');
  ag.innerHTML = '';
  for (let q = 1; q <= 100; q++) {
    const key    = `question_${q}`;
    const det    = answers[key];
    const detail = data.score?.details?.[key];
    const isDbl  = !!warnings[key];
    let cls = det ? '' : 'skip';
    let tick = '';
    if (isDbl) { cls = 'dbl'; tick = '⚠'; }
    else if (detail) {
      cls  = detail.result === 'correct' ? 'ok' : detail.result === 'wrong' ? 'bad' : 'skip';
      tick = detail.result === 'correct' ? '✓'  : detail.result === 'wrong'  ? '✗'  : '—';
    }
    const chip = document.createElement('div');
    chip.className = `ans-chip ${cls}`;
    chip.innerHTML = `<span class="q">Q${q}</span><span class="a">${det||'—'}</span>`
                   + (tick ? `<span class="tick">${tick}</span>` : '');
    ag.appendChild(chip);
  }

  // Debug image
  document.getElementById('debug-img').src = 'data:image/jpeg;base64,' + data.debug_image;

  document.getElementById('results-section').style.display = 'block';
  document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
}
</script>
</body>
</html>
"""


@app.route("/")
def index():
    return render_template_string(HTML)


@app.route("/scan", methods=["POST"])
def scan():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided."}), 400

    file       = request.files["image"]
    key_json   = request.form.get("answer_key", "{}")
    corners_json = request.form.get("corners", "null")

    answer_key = json.loads(key_json)
    corners_raw = json.loads(corners_json)

    img_path   = os.path.join(UPLOAD_FOLDER, "scan_input.jpg")
    debug_path = os.path.join(UPLOAD_FOLDER, "scan_debug.jpg")
    file.save(img_path)

    manual_corners = None
    if corners_raw and len(corners_raw) == 4:
        manual_corners = np.array(corners_raw, dtype="float32")

    try:
        answers, warnings = process_omr(img_path, manual_corners=manual_corners)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    debug_draw_bubbles(
        img_path, answers, debug_path,
        manual_corners=manual_corners,
        warnings=warnings,
        answer_key=answer_key if answer_key else None,
    )
    with open(debug_path, "rb") as f:
        debug_b64 = base64.b64encode(f.read()).decode()

    score_result = score_omr(answers, answer_key) if answer_key else None

    return jsonify({
        "answers":     answers,
        "warnings":    warnings,
        "score":       score_result,
        "debug_image": debug_b64,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)
