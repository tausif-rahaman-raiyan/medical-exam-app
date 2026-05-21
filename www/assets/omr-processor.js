// ═══════════════════════════════════════════════════════════════════
//  OMR PROCESSOR  —  SECRET FILES Medical Admission OMR Sheet
//  Pure Canvas / JS  •  No API Key  •  No Internet Required
//
//  Sheet layout  : 4 columns × 25 rows  (Q1-25 | Q26-50 | Q51-75 | Q76-100)
//  Scoring       : Correct +1 | Wrong −0.25 | Invalid (2+) −0.25 | Skipped 0
//  Pipeline      : Load → Greyscale → Otsu → Corner Detect →
//                  Perspective Warp → Grid Map → Bubble Fill → Score
// ═══════════════════════════════════════════════════════════════════
(function (global) {
    'use strict';

    // ── Output canvas dimensions (standard A4 portrait) ───────────────
    const OW = 840;
    const OH = 1190;

    // ── SECRET FILES OMR layout  (fractions of OW × OH) ──────────────
    //  The sheet has 4 groups, each with a narrow Q-NO column + 4 bubbles.
    //  Measured from the actual sheet photo.
    const COLS = [
        { xS: 0.060, xE: 0.265 },   // Q 1 – 25   (A B C D)
        { xS: 0.308, xE: 0.513 },   // Q 26 – 50
        { xS: 0.558, xE: 0.763 },   // Q 51 – 75
        { xS: 0.808, xE: 0.985 }    // Q 76 – 100
    ];
    const ROWS_PER_COL = 25;
    const Y_START      = 0.215;   // below header / SET CODE / barcode
    const Y_END        = 0.965;
    const OPTIONS      = 4;       // A, B, C, D

    // ── Corner marker search boxes  (fraction of image, per corner) ───
    //  We look for the big black squares printed at the sheet edges.
    const CORNERS = [
        { qx: [0.00, 0.10], qy: [0.08, 0.20], name: 'TL' },   // top-left
        { qx: [0.90, 1.00], qy: [0.08, 0.20], name: 'TR' },   // top-right
        { qx: [0.00, 0.10], qy: [0.88, 1.00], name: 'BL' },   // bottom-left
        { qx: [0.90, 1.00], qy: [0.88, 1.00], name: 'BR' }    // bottom-right
    ];

    // ─────────────────────────────────────────────────────────────────
    //  PUBLIC API
    // ─────────────────────────────────────────────────────────────────
    class OMRProcessor {
        /**
         * @param {File}  file       Image file from <input>
         * @param {Array} answerKey  ['a','b','c','d', …]  length = total questions
         * @returns {Promise<{summary, detailedResults, previewDataUrl}>}
         */
        static async processImage(file, answerKey) {
            // 1. Load & draw to working canvas
            const img = await _load(file);
            const raw = _drawToCanvas(img, OW, OH);          // raw 840×1190

            // 2. Greyscale + Otsu binary  (1 = dark mark)
            const gray   = _grey(raw.data);
            const thresh = _otsu(gray);
            const binary = new Uint8Array(OW * OH);
            for (let i = 0; i < gray.length; i++) binary[i] = gray[i] < thresh ? 1 : 0;

            // 3. Detect corner markers → perspective-corrected binary
            const corners  = _findCorners(binary, OW, OH);
            const corrected = corners
                ? _perspectiveWarp(binary, OW, OH, corners)
                : binary;   // fall-back: use as-is

            // 4. Grid map → bubble fill ratios → score
            const result = _detectAndScore(corrected, answerKey);

            // 5. Thumbnail preview
            const thumb = _makeCanvas(420, 595);
            thumb.getContext('2d').drawImage(raw.canvas, 0, 0, 420, 595);
            result.previewDataUrl = thumb.toDataURL('image/jpeg', 0.7);

            return result;
        }
    }

    // ─────────────────────────────────────────────────────────────────
    //  IMAGE HELPERS
    // ─────────────────────────────────────────────────────────────────
    function _load(file) {
        return new Promise((res, rej) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload  = () => { URL.revokeObjectURL(url); res(img); };
            img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Image load failed')); };
            img.src = url;
        });
    }

    function _makeCanvas(w, h) {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        return c;
    }

    function _drawToCanvas(img, w, h) {
        const canvas = _makeCanvas(w, h);
        const ctx    = canvas.getContext('2d', { willReadFrequently: true });
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        return { canvas, data: ctx.getImageData(0, 0, w, h).data };
    }

    function _grey(rgba) {
        const g = new Uint8Array(rgba.length / 4);
        for (let i = 0; i < g.length; i++)
            g[i] = Math.round(0.299 * rgba[i*4] + 0.587 * rgba[i*4+1] + 0.114 * rgba[i*4+2]);
        return g;
    }

    function _otsu(g) {
        const hist = new Array(256).fill(0);
        for (const v of g) hist[v]++;
        const N = g.length;
        let sum = 0;
        for (let i = 0; i < 256; i++) sum += i * hist[i];
        let sumB = 0, wB = 0, best = 0, t = 128;
        for (let i = 0; i < 256; i++) {
            wB += hist[i]; if (!wB) continue;
            const wF = N - wB; if (!wF) break;
            sumB += i * hist[i];
            const d = (sumB/wB) - ((sum-sumB)/wF);
            const b = wB * wF * d * d;
            if (b > best) { best = b; t = i; }
        }
        return t;
    }

    // ─────────────────────────────────────────────────────────────────
    //  CORNER MARKER DETECTION
    //  Finds the centroid of the darkest cluster in each corner box.
    // ─────────────────────────────────────────────────────────────────
    function _findCorners(bin, W, H) {
        const pts = [];
        for (const { qx, qy } of CORNERS) {
            const x0 = Math.round(qx[0] * W), x1 = Math.round(qx[1] * W);
            const y0 = Math.round(qy[0] * H), y1 = Math.round(qy[1] * H);
            let sx = 0, sy = 0, n = 0;
            for (let y = y0; y < y1; y++)
                for (let x = x0; x < x1; x++)
                    if (bin[y * W + x]) { sx += x; sy += y; n++; }
            if (n < 20) return null;   // corner mark not found
            pts.push([sx / n, sy / n]);
        }
        return pts;   // [TL, TR, BL, BR]
    }

    // ─────────────────────────────────────────────────────────────────
    //  PERSPECTIVE WARP  (inverse-map homography, per-pixel)
    //  src corners → standard OW×OH rectangle.
    // ─────────────────────────────────────────────────────────────────
    function _perspectiveWarp(srcBin, W, H, corners) {
        // corners: [TL, TR, BL, BR] in source pixels
        const [tl, tr, bl, br] = corners;

        // Destination points = full 840×1190
        const dst = [[0,0],[OW,0],[0,OH],[OW,OH]];
        const src = [tl, tr, bl, br];

        // Compute H: src → dst, then Hinv for inverse mapping
        const H    = _homography(src, dst);
        const Hinv = _homography(dst, src);

        const out = new Uint8Array(OW * OH);
        for (let dy = 0; dy < OH; dy++) {
            for (let dx = 0; dx < OW; dx++) {
                const [sx, sy] = _applyH(Hinv, dx, dy);
                const xi = Math.round(sx), yi = Math.round(sy);
                if (xi >= 0 && xi < W && yi >= 0 && yi < H)
                    out[dy * OW + dx] = srcBin[yi * W + xi];
            }
        }
        return out;
    }

    // Solve Ax = b using Gaussian elimination (returns solution vector)
    function _gaussElim(A, b) {
        const n  = b.length;
        const M  = A.map((row, i) => [...row, b[i]]);
        for (let col = 0; col < n; col++) {
            let maxR = col;
            for (let r = col+1; r < n; r++)
                if (Math.abs(M[r][col]) > Math.abs(M[maxR][col])) maxR = r;
            [M[col], M[maxR]] = [M[maxR], M[col]];
            const piv = M[col][col];
            if (Math.abs(piv) < 1e-10) continue;
            for (let r = 0; r < n; r++) {
                if (r === col) continue;
                const f = M[r][col] / piv;
                for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
            }
        }
        return M.map((row, i) => row[n] / row[i]);
    }

    function _homography(srcPts, dstPts) {
        const A = [], b = [];
        for (let i = 0; i < 4; i++) {
            const [sx, sy] = srcPts[i];
            const [dx, dy] = dstPts[i];
            A.push([sx, sy, 1, 0,  0,  0, -dx*sx, -dx*sy]); b.push(dx);
            A.push([0,  0,  0, sx, sy, 1, -dy*sx, -dy*sy]); b.push(dy);
        }
        const h = _gaussElim(A, b);
        return [[h[0],h[1],h[2]],[h[3],h[4],h[5]],[h[6],h[7],1]];
    }

    function _applyH(H, x, y) {
        const w = H[2][0]*x + H[2][1]*y + H[2][2];
        return [(H[0][0]*x + H[0][1]*y + H[0][2]) / w,
                (H[1][0]*x + H[1][1]*y + H[1][2]) / w];
    }

    // ─────────────────────────────────────────────────────────────────
    //  BUBBLE FILL RATIO  (inner 60% of cell to avoid circle borders)
    // ─────────────────────────────────────────────────────────────────
    function _fill(bin, x1, y1, x2, y2) {
        const px = Math.max(1, Math.round((x2-x1)*0.20));
        const py = Math.max(1, Math.round((y2-y1)*0.20));
        let dark = 0, total = 0;
        for (let y = y1+py; y < y2-py; y++)
            for (let x = x1+px; x < x2-px; x++) { dark += bin[y*OW+x]; total++; }
        return total ? dark/total : 0;
    }

    // ─────────────────────────────────────────────────────────────────
    //  DETECT  &  SCORE
    // ─────────────────────────────────────────────────────────────────
    function _detectAndScore(bin, answerKey) {
        const totalQ  = answerKey.length;
        const yStart  = Math.round(Y_START * OH);
        const yEnd    = Math.round(Y_END   * OH);
        const rowH    = (yEnd - yStart) / ROWS_PER_COL;

        // ── Collect all fill ratios for adaptive threshold ──
        const allFills    = [];
        const qFills      = [];   // [qIdx][optIdx]

        for (let col = 0; col < COLS.length; col++) {
            const { xS, xE } = COLS[col];
            const xs  = Math.round(xS * OW);
            const xe  = Math.round(xE * OW);
            const bW  = (xe - xs) / OPTIONS;

            for (let row = 0; row < ROWS_PER_COL; row++) {
                const qIdx = col * ROWS_PER_COL + row;
                if (qIdx >= totalQ) break;

                const y1 = Math.round(yStart + row * rowH);
                const y2 = Math.round(yStart + (row+1) * rowH);

                const fills = [];
                for (let b = 0; b < OPTIONS; b++) {
                    const x1 = Math.round(xs + b * bW);
                    const x2 = Math.round(xs + (b+1) * bW);
                    const f  = _fill(bin, x1, y1, x2, y2);
                    fills.push(f);
                    allFills.push(f);
                }
                qFills[qIdx] = fills;
            }
        }

        // ── Adaptive threshold  (25th-pct = blank paper baseline) ──
        const sorted  = [...allFills].sort((a,b) => a-b);
        const bgLevel = sorted[Math.floor(sorted.length * 0.25)];
        const fillThr = Math.max(0.10, bgLevel * 2.5);   // bubble must be 2.5× background

        // ── Grade ──────────────────────────────────────────────────
        const optLetters = ['a','b','c','d'];
        const detail     = [];
        let correct=0, wrong=0, invalid=0, skipped=0;

        for (let qi = 0; qi < totalQ; qi++) {
            const fills    = qFills[qi] || [0,0,0,0];
            const detected = fills.map(f => f >= fillThr);
            const cnt      = detected.filter(Boolean).length;
            const key      = answerKey[qi];

            let status, user;

            if (cnt === 0) {
                // Skipped — no mark
                status = 'skipped'; user = null; skipped++;

            } else if (cnt >= 2) {
                // Invalid — multiple marks → −0.25 (same penalty as wrong)
                user   = optLetters.filter((_,i) => detected[i]).join('');
                status = 'invalid'; invalid++;
                wrong += 0;   // counted separately; penalty applied in score

            } else {
                // Exactly one mark
                user = optLetters[detected.indexOf(true)];
                if (user === key) { status='correct'; correct++; }
                else              { status='wrong';   wrong++;   }
            }

            detail.push({ q: qi+1, status, user, key });
        }

        // Scoring: correct +1, wrong −0.25, invalid −0.25, skipped 0
        const negMarks   = parseFloat(((wrong + invalid) * 0.25).toFixed(2));
        const finalScore = parseFloat((correct - negMarks).toFixed(2));

        return {
            summary: {
                totalQuestions: totalQ,
                correct, wrong, invalid, skipped,
                rawScore: correct,
                negativeMarks: negMarks,
                finalScore
            },
            detailedResults: detail
        };
    }

    global.OMRProcessor = OMRProcessor;

})(window);
