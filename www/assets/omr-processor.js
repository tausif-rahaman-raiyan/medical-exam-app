// --- OMR PROCESSOR (Pure Canvas / Computer Vision — No API Key) ---
// Implements the full pipeline from the Senior CV Engineer spec:
// Image → Greyscale → Blur → Otsu Threshold → Grid Map → Bubble Detect → Score

(function (global) {
    'use strict';

    const W = 840;   // Standard normalised width  (A4 landscape equivalent)
    const H = 1190;  // Standard normalised height

    // Standard Bangladesh medical OMR layout (as fractions of sheet dimensions)
    // Two columns: left = Q1-50, right = Q51-100
    const LAYOUT = {
        cols: [
            { xStart: 0.04, xEnd: 0.47 },   // Left column
            { xStart: 0.53, xEnd: 0.96 }    // Right column
        ],
        yStart: 0.08,
        yEnd:   0.95,
        rowsPerCol: 50,
        options: 4    // a, b, c, d
    };

    // ─────────────────────────────────────────────
    //  PUBLIC API
    // ─────────────────────────────────────────────
    class OMRProcessor {

        /**
         * Process an OMR image and return scored results.
         * @param {File}   file       - Image file from <input type="file">
         * @param {Array}  answerKey  - ['a','b','c','d', …] — length = total questions
         * @returns {Promise<{summary, detailedResults, previewDataUrl}>}
         */
        static async processImage(file, answerKey) {
            const img = await _loadImage(file);

            // ── Step 1: Draw to standard canvas ──────────────────────────────
            const canvas = _makeCanvas(W, H);
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, W, H);
            ctx.drawImage(img, 0, 0, W, H);

            // ── Step 2: Greyscale via CSS filter on a second canvas (fast) ───
            const blurCanvas = _makeCanvas(W, H);
            const bCtx = blurCanvas.getContext('2d', { willReadFrequently: true });
            bCtx.filter = 'grayscale(1) blur(2px)';
            bCtx.drawImage(canvas, 0, 0, W, H);
            const rawData = bCtx.getImageData(0, 0, W, H).data;

            const gray = new Uint8Array(W * H);
            for (let i = 0; i < W * H; i++) {
                gray[i] = rawData[i * 4]; // R channel after greyscale filter = luminance
            }

            // ── Step 3: Otsu's global threshold → binary (1 = dark mark) ────
            const thresh = _otsu(gray);
            const binary = new Uint8Array(W * H);
            for (let i = 0; i < W * H; i++) {
                binary[i] = gray[i] < thresh ? 1 : 0;
            }

            // ── Step 4: Detect & score ────────────────────────────────────────
            const result = _detectAndScore(binary, answerKey);

            // Attach a thumbnail preview DataURL for optional display
            const thumb = _makeCanvas(420, 595);
            thumb.getContext('2d').drawImage(canvas, 0, 0, 420, 595);
            result.previewDataUrl = thumb.toDataURL('image/jpeg', 0.7);

            return result;
        }
    }

    // ─────────────────────────────────────────────
    //  PRIVATE HELPERS
    // ─────────────────────────────────────────────

    function _makeCanvas(w, h) {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        return c;
    }

    function _loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload  = () => { URL.revokeObjectURL(url); resolve(img); };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image failed to load')); };
            img.src = url;
        });
    }

    function _otsu(gray) {
        const hist = new Array(256).fill(0);
        for (const v of gray) hist[v]++;
        const total = gray.length;

        let sum = 0;
        for (let i = 0; i < 256; i++) sum += i * hist[i];

        let sumB = 0, wB = 0, max = 0, thresh = 128;
        for (let t = 0; t < 256; t++) {
            wB += hist[t];
            if (!wB) continue;
            const wF = total - wB;
            if (!wF) break;
            sumB += t * hist[t];
            const mB = sumB / wB;
            const mF = (sum - sumB) / wF;
            const between = wB * wF * (mB - mF) ** 2;
            if (between > max) { max = between; thresh = t; }
        }
        return thresh;
    }

    /**
     * Count dark pixels in an inner region of a cell.
     * Uses 20% padding on each side to avoid circle borders.
     */
    function _bubbleFill(binary, x1, y1, x2, y2) {
        const px = Math.max(1, Math.round((x2 - x1) * 0.20));
        const py = Math.max(1, Math.round((y2 - y1) * 0.20));
        const cx1 = x1 + px, cx2 = x2 - px;
        const cy1 = y1 + py, cy2 = y2 - py;

        let dark = 0, total = 0;
        for (let y = cy1; y < cy2; y++) {
            for (let x = cx1; x < cx2; x++) {
                dark  += binary[y * W + x];
                total ++;
            }
        }
        return total > 0 ? dark / total : 0;
    }

    function _detectAndScore(binary, answerKey) {
        const totalQ   = answerKey.length;
        const { cols, yStart: ysF, yEnd: yeF, rowsPerCol, options } = LAYOUT;

        const yStart = Math.round(ysF * H);
        const yEnd   = Math.round(yeF * H);
        const colH   = yEnd - yStart;
        const rowH   = colH / rowsPerCol;

        // ── Collect all fill ratios (for adaptive threshold) ──
        const allFills        = [];          // every bubble's fill ratio
        const questionFills   = [];          // [qIdx][optIdx] = fill ratio

        for (let col = 0; col < cols.length; col++) {
            const { xStart: xsF, xEnd: xeF } = cols[col];
            const xStart = Math.round(xsF * W);
            const xEnd   = Math.round(xeF * W);
            const bubW   = (xEnd - xStart) / options;

            for (let row = 0; row < rowsPerCol; row++) {
                const qIdx = col * rowsPerCol + row;
                if (qIdx >= totalQ) break;

                const y1 = Math.round(yStart + row * rowH);
                const y2 = Math.round(yStart + (row + 1) * rowH);

                const fills = [];
                for (let b = 0; b < options; b++) {
                    const x1 = Math.round(xStart + b * bubW);
                    const x2 = Math.round(xStart + (b + 1) * bubW);
                    const f  = _bubbleFill(binary, x1, y1, x2, y2);
                    fills.push(f);
                    allFills.push(f);
                }
                questionFills[qIdx] = fills;
            }
        }

        // ── Adaptive threshold: 25th-percentile = paper background ──
        const sorted   = [...allFills].sort((a, b) => a - b);
        const bgLevel  = sorted[Math.floor(sorted.length * 0.25)];
        // A bubble must be at least 2.5× background AND at least 12% filled
        const fillThr  = Math.max(0.12, bgLevel * 2.5);

        // ── Grade each question ────────────────────────────────────────
        const opts = ['a', 'b', 'c', 'd'];
        const detailedResults = [];
        let correct = 0, wrong = 0, invalid = 0, skipped = 0;

        for (let qIdx = 0; qIdx < totalQ; qIdx++) {
            const fills    = questionFills[qIdx] || [0, 0, 0, 0];
            const detected = fills.map(f => f >= fillThr);
            const count    = detected.filter(Boolean).length;
            const key      = answerKey[qIdx];

            let status, user;

            if (count === 0) {
                status = 'skipped';  user = null;  skipped++;
            } else if (count >= 2) {
                status  = 'invalid';
                user    = opts.filter((_, i) => detected[i]).join('');
                invalid++;
            } else {
                const detIdx = detected.indexOf(true);
                user = opts[detIdx];
                if (user === key) { status = 'correct'; correct++; }
                else              { status = 'wrong';   wrong++;   }
            }

            detailedResults.push({ q: qIdx + 1, status, user, key });
        }

        const rawScore      = correct;
        const negativeMarks = parseFloat((wrong * 0.25).toFixed(2));
        const finalScore    = parseFloat((rawScore - negativeMarks).toFixed(2));

        return {
            summary: { totalQuestions: totalQ, correct, wrong, invalid, skipped, rawScore, negativeMarks, finalScore },
            detailedResults
        };
    }

    global.OMRProcessor = OMRProcessor;

})(window);
