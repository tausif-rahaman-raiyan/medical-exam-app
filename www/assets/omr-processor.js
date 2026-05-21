// ═══════════════════════════════════════════════════════════════════
//  OMR PROCESSOR  v3  —  SECRET FILES Medical Admission OMR Sheet
//  Pure Canvas / JS  •  No API Key  •  No Internet Required
//
//  Supports   : 4×25 (Q1-25 | Q26-50 | Q51-75 | Q76-100)
//               2×50 (Q1-50 | Q51-100)   ← auto-detected or user-selected
//
//  Scoring    : Correct +1 | Wrong −0.25 | Invalid (2+) −0.25 | Skipped 0
//
//  Pipeline   : Load → Greyscale → Otsu Binary → Corner Detect →
//               Perspective Warp → Layout Detect → Grid Map → Score
// ═══════════════════════════════════════════════════════════════════
(function (global) {
    'use strict';

    const OW = 840, OH = 1190;   // normalised output dimensions

    // ── Layout definitions ────────────────────────────────────────────
    const LAYOUT_4COL = {
        id: '4col',
        cols: [
            { xS: 0.060, xE: 0.265 },   // Q  1-25
            { xS: 0.308, xE: 0.513 },   // Q 26-50
            { xS: 0.558, xE: 0.763 },   // Q 51-75
            { xS: 0.808, xE: 0.985 }    // Q 76-100
        ],
        rowsPerCol: 25,
        yStart: 0.215,
        yEnd:   0.965
    };

    const LAYOUT_2COL = {
        id: '2col',
        cols: [
            { xS: 0.040, xE: 0.470 },   // Q  1-50
            { xS: 0.530, xE: 0.960 }    // Q 51-100
        ],
        rowsPerCol: 50,
        yStart: 0.080,
        yEnd:   0.950
    };

    // ── Corner marker search zones (fraction of image, one per corner) ─
    // Order: TL, TR, BL, BR
    const CORNER_BOXES = [
        { qx: [0.00, 0.10], qy: [0.06, 0.22] },
        { qx: [0.90, 1.00], qy: [0.06, 0.22] },
        { qx: [0.00, 0.10], qy: [0.84, 1.00] },
        { qx: [0.90, 1.00], qy: [0.84, 1.00] }
    ];

    // ─────────────────────────────────────────────────────────────────
    //  PUBLIC API
    // ─────────────────────────────────────────────────────────────────
    class OMRProcessor {

        /**
         * Full pipeline: scan image → return scored results.
         *
         * @param {File}   file
         * @param {Array}  answerKey  ['a','b','c','d', …]
         * @param {Object} opts
         *   opts.corners  – [[fx,fy]×4] as fractions of image, ordered TL/TR/BL/BR
         *                   If null → auto-detect from image.
         *   opts.layout   – '4col' | '2col' | 'auto'  (default 'auto')
         */
        static async processImage(file, answerKey, opts = {}) {
            const { corners: userCorners = null, layout = 'auto' } = opts;

            const img  = await _load(file);
            const srcW = img.naturalWidth;
            const srcH = img.naturalHeight;

            // Greyscale binary at source resolution
            const { data: rawData, canvas: srcCanvas } = _drawToCanvas(img, srcW, srcH);
            const gray   = _grey(rawData);
            const thresh = _otsu(gray);
            const srcBin = new Uint8Array(srcW * srcH);
            for (let i = 0; i < gray.length; i++) srcBin[i] = gray[i] < thresh ? 1 : 0;

            // Resolve corners
            const corners = userCorners || _findCorners(srcBin, srcW, srcH);

            // Warp to standard OW×OH
            const normed = corners
                ? _perspectiveWarp(srcBin, srcW, srcH, corners, OW, OH)
                : _resizeBin(srcBin, srcW, srcH, OW, OH);

            // Resolve layout
            let layoutCfg;
            if      (layout === '4col') layoutCfg = LAYOUT_4COL;
            else if (layout === '2col') layoutCfg = LAYOUT_2COL;
            else                        layoutCfg = _detectLayout(normed) === '4col' ? LAYOUT_4COL : LAYOUT_2COL;

            const result = _detectAndScore(normed, answerKey, layoutCfg);
            result.detectedLayout = layoutCfg.id;

            // Thumbnail for optional preview
            const thumb = _makeCanvas(420, 595);
            thumb.getContext('2d').drawImage(srcCanvas, 0, 0, 420, 595);
            result.previewDataUrl = thumb.toDataURL('image/jpeg', 0.72);

            return result;
        }

        /**
         * Quick analysis used by the corner-drag UI "Auto-Detect" button.
         * Returns detected corner fractions and layout without scoring.
         *
         * @param {File} file
         * @returns {Promise<{ corners: [[fx,fy]×4]|null, layout: '4col'|'2col' }>}
         */
        static async detectCornersAndLayout(file) {
            const img  = await _load(file);
            // Use half-resolution for speed
            const W = Math.min(img.naturalWidth,  840);
            const H = Math.min(img.naturalHeight, 1190);

            const { data } = _drawToCanvas(img, W, H);
            const gray   = _grey(data);
            const thresh = _otsu(gray);
            const bin    = new Uint8Array(W * H);
            for (let i = 0; i < gray.length; i++) bin[i] = gray[i] < thresh ? 1 : 0;

            const corners = _findCorners(bin, W, H);   // fractions — scale independent

            let layout;
            if (corners) {
                const warped = _perspectiveWarp(bin, W, H, corners, OW, OH);
                layout = _detectLayout(warped);
            } else {
                layout = _detectLayout(_resizeBin(bin, W, H, OW, OH));
            }

            return { corners, layout };
        }
    }

    // ─────────────────────────────────────────────────────────────────
    //  IMAGE PRIMITIVES
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
        const g = new Uint8Array(rgba.length >> 2);
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
            const d = (sumB / wB) - ((sum - sumB) / wF);
            const b = wB * wF * d * d;
            if (b > best) { best = b; t = i; }
        }
        return t;
    }

    // ─────────────────────────────────────────────────────────────────
    //  CORNER DETECTION
    //  Returns [[fx,fy]×4] as fractions of (W,H), order TL/TR/BL/BR.
    //  Returns null if any corner is missing.
    // ─────────────────────────────────────────────────────────────────
    function _findCorners(bin, W, H) {
        const pts = [];
        for (const { qx, qy } of CORNER_BOXES) {
            const x0 = Math.round(qx[0] * W), x1 = Math.round(qx[1] * W);
            const y0 = Math.round(qy[0] * H), y1 = Math.round(qy[1] * H);
            let sx = 0, sy = 0, n = 0;
            for (let y = y0; y < y1; y++)
                for (let x = x0; x < x1; x++)
                    if (bin[y * W + x]) { sx += x; sy += y; n++; }
            if (n < 15) return null;           // corner mark not found
            pts.push([sx / n / W, sy / n / H]); // store as fractions
        }
        return pts;   // [TL, TR, BL, BR]
    }

    // ─────────────────────────────────────────────────────────────────
    //  PERSPECTIVE WARP  (homography: src corners → dstW×dstH rectangle)
    // ─────────────────────────────────────────────────────────────────
    function _perspectiveWarp(srcBin, srcW, srcH, corners, dstW, dstH) {
        // corners = [[fx,fy]×4] fractions of srcW/srcH, order TL/TR/BL/BR
        const src = corners.map(([fx, fy]) => [fx * srcW, fy * srcH]);
        const dst = [[0, 0], [dstW, 0], [0, dstH], [dstW, dstH]];

        const Hinv = _homography(dst, src);   // inverse map: dst → src
        const out  = new Uint8Array(dstW * dstH);

        for (let dy = 0; dy < dstH; dy++) {
            for (let dx = 0; dx < dstW; dx++) {
                const [sx, sy] = _applyH(Hinv, dx, dy);
                const xi = Math.round(sx), yi = Math.round(sy);
                if (xi >= 0 && xi < srcW && yi >= 0 && yi < srcH)
                    out[dy * dstW + dx] = srcBin[yi * srcW + xi];
            }
        }
        return out;
    }

    function _resizeBin(srcBin, srcW, srcH, dstW, dstH) {
        const out = new Uint8Array(dstW * dstH);
        const rx = srcW / dstW, ry = srcH / dstH;
        for (let dy = 0; dy < dstH; dy++) {
            const sy = Math.min(Math.round(dy * ry), srcH - 1);
            for (let dx = 0; dx < dstW; dx++) {
                const sx = Math.min(Math.round(dx * rx), srcW - 1);
                out[dy * dstW + dx] = srcBin[sy * srcW + sx];
            }
        }
        return out;
    }

    // Gaussian elimination  (solves Ax = b, returns x)
    function _gaussElim(A, b) {
        const n = b.length;
        const M = A.map((row, i) => [...row, b[i]]);
        for (let c = 0; c < n; c++) {
            let max = c;
            for (let r = c + 1; r < n; r++)
                if (Math.abs(M[r][c]) > Math.abs(M[max][c])) max = r;
            [M[c], M[max]] = [M[max], M[c]];
            const p = M[c][c];
            if (Math.abs(p) < 1e-12) continue;
            for (let r = 0; r < n; r++) {
                if (r === c) continue;
                const f = M[r][c] / p;
                for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
            }
        }
        return M.map((row, i) => row[n] / row[i]);
    }

    function _homography(srcPts, dstPts) {
        const A = [], b = [];
        for (let i = 0; i < 4; i++) {
            const [sx, sy] = srcPts[i], [dx, dy] = dstPts[i];
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
    //  LAYOUT AUTO-DETECTION
    //  Uses horizontal projection in mid-band to count bubble column clusters.
    //  16 clusters ≈ 4 cols × 4 options → 4col;  8 ≈ 2col.
    // ─────────────────────────────────────────────────────────────────
    function _detectLayout(binary) {
        const yS = Math.round(0.35 * OH), yE = Math.round(0.65 * OH);
        const proj = new Float32Array(OW);

        for (let x = 0; x < OW; x++) {
            let s = 0;
            for (let y = yS; y < yE; y++) s += binary[y * OW + x];
            proj[x] = s / (yE - yS);
        }

        // Box-smooth (radius 5)
        const sm = new Float32Array(OW);
        const R  = 5;
        for (let x = 0; x < OW; x++) {
            let s = 0, n = 0;
            for (let d = -R; d <= R; d++) {
                if (x+d >= 0 && x+d < OW) { s += proj[x+d]; n++; }
            }
            sm[x] = s / n;
        }

        // Count rising edges above threshold
        const thr = 0.05;
        let peaks = 0, above = false;
        for (let x = 0; x < OW; x++) {
            if (sm[x] > thr && !above)       { peaks++; above = true; }
            if (sm[x] < thr * 0.4)            above = false;
        }

        return peaks > 10 ? '4col' : '2col';
    }

    // ─────────────────────────────────────────────────────────────────
    //  BUBBLE FILL RATIO  (inner 60% of cell to avoid circle borders)
    // ─────────────────────────────────────────────────────────────────
    function _fill(bin, x1, y1, x2, y2) {
        const px = Math.max(1, Math.round((x2-x1) * 0.20));
        const py = Math.max(1, Math.round((y2-y1) * 0.20));
        let dark = 0, total = 0;
        for (let y = y1+py; y < y2-py; y++)
            for (let x = x1+px; x < x2-px; x++) { dark += bin[y*OW+x]; total++; }
        return total ? dark / total : 0;
    }

    // ─────────────────────────────────────────────────────────────────
    //  DETECT & SCORE
    // ─────────────────────────────────────────────────────────────────
    function _detectAndScore(bin, answerKey, cfg) {
        const totalQ = answerKey.length;
        const yS     = Math.round(cfg.yStart * OH);
        const yE     = Math.round(cfg.yEnd   * OH);
        const rowH   = (yE - yS) / cfg.rowsPerCol;

        // ── Collect all fill ratios (for adaptive threshold) ──
        const allFills = [], qFills = [];

        for (let col = 0; col < cfg.cols.length; col++) {
            const { xS, xE } = cfg.cols[col];
            const xs = Math.round(xS * OW), xe = Math.round(xE * OW);
            const bW = (xe - xs) / 4;   // 4 options

            for (let row = 0; row < cfg.rowsPerCol; row++) {
                const qi = col * cfg.rowsPerCol + row;
                if (qi >= totalQ) break;

                const y1 = Math.round(yS + row * rowH);
                const y2 = Math.round(yS + (row + 1) * rowH);

                const fills = [];
                for (let b = 0; b < 4; b++) {
                    const x1 = Math.round(xs + b * bW);
                    const x2 = Math.round(xs + (b+1) * bW);
                    const f  = _fill(bin, x1, y1, x2, y2);
                    fills.push(f);
                    allFills.push(f);
                }
                qFills[qi] = fills;
            }
        }

        // ── Adaptive threshold: 25th-pct = blank paper baseline ──
        const sorted  = [...allFills].sort((a, b) => a - b);
        const bgLevel = sorted[Math.floor(sorted.length * 0.25)];
        const fillThr = Math.max(0.10, bgLevel * 2.5);

        // ── Grade ──────────────────────────────────────────────────
        const opts    = ['a','b','c','d'];
        const detail  = [];
        let correct=0, wrong=0, invalid=0, skipped=0;

        for (let qi = 0; qi < totalQ; qi++) {
            const fills    = qFills[qi] || [0,0,0,0];
            const detected = fills.map(f => f >= fillThr);
            const cnt      = detected.filter(Boolean).length;
            const key      = answerKey[qi];
            let status, user;

            if (cnt === 0) {
                status = 'skipped'; user = null; skipped++;
            } else if (cnt >= 2) {
                user = opts.filter((_, i) => detected[i]).join('');
                status = 'invalid'; invalid++;
            } else {
                user = opts[detected.indexOf(true)];
                if (user === key) { status = 'correct'; correct++; }
                else              { status = 'wrong';   wrong++;   }
            }

            detail.push({ q: qi+1, status, user, key });
        }

        // Correct +1, Wrong −0.25, Invalid −0.25, Skipped 0
        const negMarks   = parseFloat(((wrong + invalid) * 0.25).toFixed(2));
        const finalScore = parseFloat((correct - negMarks).toFixed(2));

        return {
            summary: { totalQuestions: totalQ, correct, wrong, invalid, skipped,
                        rawScore: correct, negativeMarks: negMarks, finalScore },
            detailedResults: detail
        };
    }

    global.OMRProcessor = OMRProcessor;

})(window);
