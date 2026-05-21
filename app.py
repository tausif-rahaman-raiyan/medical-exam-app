import os
import json
import base64
import cv2
import numpy as np
from flask import Flask, request, jsonify, render_template_string

from omr_scanner import process_omr, debug_draw_bubbles, TEMPLATE, score_omr

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

HTML = """
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
    padding: 18px 32px;
    display: flex; align-items: center; gap: 12px;
    box-shadow: 0 4px 20px rgba(124,58,237,.4);
  }
  header h1 { font-size: 1.3rem; font-weight: 800; letter-spacing: .04em; }
  header span { font-size: .75rem; opacity: .7; background: rgba(255,255,255,.15);
                padding: 2px 10px; border-radius: 99px; }

  main { max-width: 1100px; margin: 0 auto; padding: 32px 20px; }

  .card {
    background: #1e293b; border: 1px solid #334155;
    border-radius: 16px; padding: 28px; margin-bottom: 24px;
  }
  .card h2 { font-size: 1rem; font-weight: 700; color: #a78bfa; margin-bottom: 18px;
             display: flex; align-items: center; gap: 8px; }

  /* Upload zone */
  .drop-zone {
    border: 2px dashed #475569; border-radius: 12px; padding: 48px 20px;
    text-align: center; cursor: pointer; transition: all .2s;
    background: #0f172a;
  }
  .drop-zone:hover, .drop-zone.over { border-color: #7c3aed; background: #1e1346; }
  .drop-zone input { display: none; }
  .drop-zone p  { color: #94a3b8; font-size: .9rem; margin-top: 8px; }
  .drop-zone .icon { font-size: 2.5rem; }

  #preview-wrap { display: none; margin-top: 16px; text-align: center; }
  #preview-wrap img { max-height: 280px; border-radius: 10px;
                      border: 2px solid #334155; }

  /* Answer key */
  .key-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 8px; max-height: 280px; overflow-y: auto; padding-right: 4px;
  }
  .key-item { display: flex; align-items: center; gap: 6px; font-size: .82rem; }
  .key-item label { color: #94a3b8; min-width: 72px; }
  .key-item select {
    flex: 1; background: #0f172a; border: 1px solid #475569; color: #e2e8f0;
    border-radius: 6px; padding: 4px 6px; font-size: .82rem; outline: none;
    cursor: pointer;
  }
  .key-item select:focus { border-color: #7c3aed; }

  /* Scan button */
  #scan-btn {
    width: 100%; padding: 15px; font-size: 1rem; font-weight: 800;
    background: linear-gradient(135deg, #7c3aed, #5b21b6);
    color: #fff; border: none; border-radius: 12px; cursor: pointer;
    letter-spacing: .04em; transition: opacity .2s, transform .15s;
    box-shadow: 0 4px 20px rgba(124,58,237,.4);
  }
  #scan-btn:hover  { opacity: .9; transform: translateY(-1px); }
  #scan-btn:active { transform: translateY(0); }
  #scan-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }

  /* Spinner */
  #spinner { display: none; text-align: center; padding: 40px; }
  .spin { width: 48px; height: 48px; border: 5px solid #334155;
          border-top-color: #7c3aed; border-radius: 50%;
          animation: spin .8s linear infinite; margin: 0 auto 12px; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Results */
  #results-section { display: none; }

  .score-bar {
    display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 24px;
  }
  .score-chip {
    flex: 1; min-width: 120px; background: #0f172a; border-radius: 12px;
    padding: 16px; text-align: center; border: 1px solid #334155;
  }
  .score-chip .val { font-size: 2rem; font-weight: 900; }
  .score-chip .lbl { font-size: .7rem; text-transform: uppercase;
                     letter-spacing: .08em; opacity: .6; margin-top: 4px; }
  .correct  { color: #34d399; }
  .wrong    { color: #f87171; }
  .skipped  { color: #fbbf24; }
  .total    { color: #a78bfa; }

  .debug-img { width: 100%; border-radius: 12px; border: 1px solid #334155; }

  .answers-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px; max-height: 420px; overflow-y: auto;
  }
  .ans-chip {
    background: #0f172a; border: 1px solid #334155; border-radius: 8px;
    padding: 8px 10px; font-size: .8rem; display: flex;
    justify-content: space-between; align-items: center;
  }
  .ans-chip .q    { color: #94a3b8; }
  .ans-chip .a    { font-weight: 800; font-size: .95rem; }
  .ans-chip.ok    { border-color: #059669; background: rgba(5,150,105,.08); }
  .ans-chip.bad   { border-color: #dc2626; background: rgba(220,38,38,.08); }
  .ans-chip.skip  { border-color: #d97706; background: rgba(217,119,6,.08); }
  .ans-chip .tick { font-size: .85rem; }

  /* Tab toggle */
  .tabs { display: flex; gap: 8px; margin-bottom: 18px; }
  .tab-btn {
    padding: 7px 18px; border-radius: 8px; border: 1px solid #334155;
    background: #0f172a; color: #94a3b8; font-size: .82rem; font-weight: 700;
    cursor: pointer; transition: all .15s;
  }
  .tab-btn.active { background: #7c3aed; color: #fff; border-color: #7c3aed; }

  .tab-panel { display: none; }
  .tab-panel.active { display: block; }

  /* Error */
  #error-box {
    display: none; background: rgba(220,38,38,.1); border: 1px solid #dc2626;
    border-radius: 10px; padding: 14px 18px; color: #f87171;
    font-size: .875rem; margin-top: 16px;
  }
</style>
</head>
<body>

<header>
  <div style="width:36px;height:36px;background:rgba(255,255,255,.2);border-radius:10px;
              display:flex;align-items:center;justify-content:center;font-weight:900">
    OMR
  </div>
  <h1>OMR Scanner</h1>
  <span>100-Question Medical Admission Sheet</span>
</header>

<main>

  <!-- Upload -->
  <div class="card">
    <h2>① Upload OMR Sheet</h2>
    <div class="drop-zone" id="drop-zone">
      <div class="icon">📄</div>
      <p><strong>Click to upload</strong> or drag &amp; drop</p>
      <p style="font-size:.78rem;margin-top:6px">JPG, PNG, WEBP — phone photos are fine</p>
      <input type="file" id="file-input" accept="image/*">
    </div>
    <div id="preview-wrap">
      <img id="preview-img" src="" alt="preview">
      <p style="font-size:.78rem;color:#64748b;margin-top:6px" id="file-name"></p>
    </div>
  </div>

  <!-- Answer key (optional) -->
  <div class="card">
    <h2>② Answer Key <span style="font-size:.7rem;color:#64748b;font-weight:400">(optional — leave blank to skip scoring)</span></h2>
    <div class="key-grid" id="key-grid"></div>
  </div>

  <!-- Scan -->
  <button id="scan-btn" disabled>📷 &nbsp; SCAN OMR SHEET</button>
  <div id="error-box"></div>

  <!-- Spinner -->
  <div id="spinner">
    <div class="spin"></div>
    <p style="color:#94a3b8;font-size:.9rem">Processing image…</p>
  </div>

  <!-- Results -->
  <div id="results-section">

    <div class="card" style="margin-top:28px">
      <h2>③ Score Summary</h2>
      <div class="score-bar" id="score-bar"></div>
    </div>

    <div class="card">
      <h2>④ Results</h2>
      <div class="tabs">
        <button class="tab-btn active" data-tab="answers">Detected Answers</button>
        <button class="tab-btn"        data-tab="debug">Debug View</button>
      </div>

      <div class="tab-panel active" id="tab-answers">
        <div class="answers-grid" id="answers-grid"></div>
      </div>

      <div class="tab-panel" id="tab-debug">
        <p style="font-size:.8rem;color:#64748b;margin-bottom:12px">
          Green circles = detected answer &nbsp;•&nbsp; Grey = not selected
        </p>
        <img id="debug-img" class="debug-img" src="" alt="debug output">
      </div>
    </div>
  </div>

</main>

<script>
const dropZone  = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const scanBtn   = document.getElementById('scan-btn');
const keyGrid   = document.getElementById('key-grid');
const errBox    = document.getElementById('error-box');

let selectedFile = null;

// ── Build answer-key dropdowns ───────────────────────────────────────────────
for (let q = 1; q <= 100; q++) {
  const div = document.createElement('div');
  div.className = 'key-item';
  div.innerHTML = `
    <label>Q ${q}</label>
    <select id="key-q${q}">
      <option value="">—</option>
      <option value="A">A</option>
      <option value="B">B</option>
      <option value="C">C</option>
      <option value="D">D</option>
    </select>`;
  keyGrid.appendChild(div);
}

// ── File handling ────────────────────────────────────────────────────────────
dropZone.addEventListener('click',      () => fileInput.click());
dropZone.addEventListener('dragover',   e  => { e.preventDefault(); dropZone.classList.add('over'); });
dropZone.addEventListener('dragleave',  ()  => dropZone.classList.remove('over'));
dropZone.addEventListener('drop',       e  => {
  e.preventDefault(); dropZone.classList.remove('over');
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => { if (fileInput.files.length) handleFile(fileInput.files[0]); });

function handleFile(file) {
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('preview-img').src = e.target.result;
    document.getElementById('preview-wrap').style.display = 'block';
    document.getElementById('file-name').textContent = file.name;
    scanBtn.disabled = false;
    errBox.style.display = 'none';
    document.getElementById('results-section').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

// ── Tab toggle ────────────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b  => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// ── Scan ──────────────────────────────────────────────────────────────────────
scanBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  // Collect answer key
  const key = {};
  for (let q = 1; q <= 100; q++) {
    const v = document.getElementById(`key-q${q}`).value;
    if (v) key[`question_${q}`] = v;
  }

  const fd = new FormData();
  fd.append('image', selectedFile);
  fd.append('answer_key', JSON.stringify(key));

  scanBtn.disabled = true;
  document.getElementById('spinner').style.display = 'block';
  document.getElementById('results-section').style.display = 'none';
  errBox.style.display = 'none';

  try {
    const res  = await fetch('/scan', { method: 'POST', body: fd });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Unknown server error');

    renderResults(data, Object.keys(key).length > 0);
  } catch (e) {
    errBox.textContent = '✗ ' + e.message;
    errBox.style.display = 'block';
  } finally {
    scanBtn.disabled = false;
    document.getElementById('spinner').style.display = 'none';
  }
});

// ── Render results ────────────────────────────────────────────────────────────
function renderResults(data, hasKey) {
  const scoreBar     = document.getElementById('score-bar');
  const answersGrid  = document.getElementById('answers-grid');

  // Score chips
  const answered = Object.values(data.answers).filter(Boolean).length;
  const skipped  = 100 - answered;

  let scoreHTML = `
    <div class="score-chip total"><div class="val">${answered}</div><div class="lbl">Answered</div></div>
    <div class="score-chip skipped"><div class="val">${skipped}</div><div class="lbl">Skipped</div></div>`;

  if (hasKey && data.score) {
    scoreHTML = `
      <div class="score-chip correct"><div class="val">${data.score.correct}</div><div class="lbl">Correct</div></div>
      <div class="score-chip wrong"><div class="val">${data.score.wrong}</div><div class="lbl">Wrong</div></div>
      <div class="score-chip skipped"><div class="val">${data.score.skipped}</div><div class="lbl">Skipped</div></div>
      <div class="score-chip total"><div class="val">${data.score.correct}</div><div class="lbl">Score / 100</div></div>`;
  }
  scoreBar.innerHTML = scoreHTML;

  // Answer chips
  answersGrid.innerHTML = '';
  for (let q = 1; q <= 100; q++) {
    const key     = `question_${q}`;
    const det     = data.answers[key];
    const detail  = data.score?.details?.[key];
    let   cls     = det ? '' : 'skip';
    let   tick    = '';
    if (detail) {
      cls  = detail.result === 'correct' ? 'ok' : detail.result === 'wrong' ? 'bad' : 'skip';
      tick = detail.result === 'correct' ? '✓' : detail.result === 'wrong' ? '✗' : '—';
    }
    const chip = document.createElement('div');
    chip.className = `ans-chip ${cls}`;
    chip.innerHTML = `
      <span class="q">Q${q}</span>
      <span class="a">${det || '—'}</span>
      ${tick ? `<span class="tick">${tick}</span>` : ''}`;
    answersGrid.appendChild(chip);
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
    answer_key = json.loads(key_json)

    # Save upload
    img_path    = os.path.join(UPLOAD_FOLDER, "scan_input.jpg")
    debug_path  = os.path.join(UPLOAD_FOLDER, "scan_debug.jpg")
    file.save(img_path)

    try:
        answers = process_omr(img_path, template=TEMPLATE)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # Debug annotated image
    debug_draw_bubbles(img_path, answers, debug_path, template=TEMPLATE)
    with open(debug_path, "rb") as f:
        debug_b64 = base64.b64encode(f.read()).decode()

    # Optional scoring
    score_result = None
    if answer_key:
        score_result = score_omr(answers, answer_key)
        del score_result["details"]   # keep response lean; details in answers
        # re-attach details for the UI
        full_score = score_omr(answers, answer_key)
        score_result = full_score

    return jsonify({
        "answers":     answers,
        "score":       score_result,
        "debug_image": debug_b64,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)
