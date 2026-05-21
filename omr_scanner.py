import cv2
import numpy as np
import json
from itertools import combinations


# ─────────────────────────────────────────────────────────────────────────────
#  TUNABLE PARAMETERS  — calibrated against the Medical Secret Files sheet
# ─────────────────────────────────────────────────────────────────────────────

WARP_WIDTH  = 1000   # output canvas width  (px) — match coordinate space
WARP_HEIGHT = 1400   # output canvas height (px)

# ── Grid geometry (all values are pixels on the 1000×1400 warped canvas) ─────
GRID_TOP        = 65     # y-centre of question-1 row
GRID_BOTTOM     = 1361   # y-centre of question-25 row  (65 + 24 × 54)
ROWS_PER_COL    = 25     # questions per column block
ROW_SPACING     = (GRID_BOTTOM - GRID_TOP) / (ROWS_PER_COL - 1)   # ≈ 54 px

# Base x of the first bubble (option A) in each column block
COLUMN_BASES = {
    1:  109,   # Q  1–25
    2:  357,   # Q 26–50
    3:  605,   # Q 51–75
    4:  853,   # Q 76–100
}
BUBBLE_SPACING = 40     # px between adjacent bubbles (A→B→C→D)
BUBBLE_RADIUS  = 14     # px radius of the ROI mask around each bubble centre

# Ignore bubbles whose centre falls above this y (skips column-header row)
SCAN_Y_CUTOFF  = 50

# Fraction of max-possible filled pixels a bubble must reach to be "answered"
# (guards against all-empty questions / skipped rows)
MIN_FILL_RATIO = 0.08

OPTIONS = ["A", "B", "C", "D"]


# ─────────────────────────────────────────────────────────────────────────────
#  COORDINATE GENERATOR
# ─────────────────────────────────────────────────────────────────────────────

def build_template() -> dict:
    """
    Compute bubble (x, y) centres for all 100 questions.

        y = GRID_TOP  + row_index × ROW_SPACING        (row_index 0..24)
        x = COLUMN_BASE + option_index × BUBBLE_SPACING (option_index 0..3)
    """
    template = {}
    for q in range(1, 101):
        col_block = ((q - 1) // ROWS_PER_COL) + 1    # 1–4
        row_index = (q - 1) % ROWS_PER_COL             # 0–24
        base_x    = COLUMN_BASES[col_block]
        cy        = int(round(GRID_TOP + row_index * ROW_SPACING))
        options   = {}
        for i, letter in enumerate(OPTIONS):
            options[letter] = [base_x + i * BUBBLE_SPACING, cy]
        template[f"question_{q}"] = options
    return template


TEMPLATE = build_template()


# ─────────────────────────────────────────────────────────────────────────────
#  PREPROCESSING  — handles blurry, tilted, and low-light phone photos
# ─────────────────────────────────────────────────────────────────────────────

def preprocess(warped: np.ndarray) -> np.ndarray:
    """
    Convert a warped BGR image to a clean binary where filled bubbles = WHITE.

    Pipeline
    --------
    1. Grayscale
    2. CLAHE  — normalises uneven lighting across the sheet
    3. Gaussian blur — suppresses grain / JPEG artefacts
    4. Otsu's binarisation — automatic global threshold (adapts to scan quality)
    5. Morphological close — fills tiny gaps in bubble marks
    """
    gray    = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY)

    # CLAHE: corrects shadows / hotspots from phone cameras
    clahe   = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    gray    = clahe.apply(gray)

    # Gaussian blur: reduces high-frequency noise from grainy/low-res shots
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Otsu's thresholding: auto-selects best threshold for the scan's histogram
    _, binary = cv2.threshold(
        blurred, 0, 255,
        cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
    )

    # Morphological close: joins broken bubble marks without merging bubbles
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=1)

    return binary


# ─────────────────────────────────────────────────────────────────────────────
#  PERSPECTIVE CORRECTION  — straightens tilted phone photos
# ─────────────────────────────────────────────────────────────────────────────

def _order_points(pts: np.ndarray) -> np.ndarray:
    """Sort four corner points into [TL, TR, BR, BL] order."""
    rect = np.zeros((4, 2), dtype="float32")
    s, diff = pts.sum(axis=1), np.diff(pts, axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect


def _find_corner_squares(gray: np.ndarray) -> np.ndarray | None:
    """
    Locate the four black corner registration squares on the OMR sheet.
    Uses a two-pass approach:
      Pass 1 — strict:  pure square contours with ~1:1 aspect
      Pass 2 — relaxed: any compact dark blob near the image corners

    Returns ordered (4, 2) float32 in [TL, TR, BR, BL] order, or None.
    """
    h, w    = gray.shape
    img_area = h * w

    # Low threshold to catch dark (but not pitch-black) marks on cream paper
    _, thresh = cv2.threshold(gray, 80, 255, cv2.THRESH_BINARY_INV)

    contours, _ = cv2.findContours(
        thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    candidates = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if not (img_area * 0.00015 < area < img_area * 0.012):
            continue
        x, y, bw, bh = cv2.boundingRect(cnt)
        aspect = bw / float(bh)
        if 0.45 < aspect < 2.2 and bw > 12 and bh > 12:
            candidates.append((x + bw // 2, y + bh // 2, area))

    if len(candidates) < 4:
        return None

    # Among all candidates pick the 4-point subset that spans the largest area
    pts      = np.array([[c[0], c[1]] for c in candidates], dtype="float32")
    best_pts  = None
    best_area = 0

    limit = min(len(pts), 20)   # cap iterations for speed
    for combo in combinations(range(limit), 4):
        cand = pts[list(combo)]
        a    = cv2.contourArea(cand)
        if a > best_area:
            best_area = a
            best_pts  = cand

    return _order_points(best_pts) if best_pts is not None else None


def _edge_fallback(gray: np.ndarray) -> np.ndarray:
    """Largest quadrilateral in the image (sheet boundary)."""
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged   = cv2.Canny(blurred, 75, 200)
    cnts, _ = cv2.findContours(edged, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    cnts    = sorted(cnts, key=cv2.contourArea, reverse=True)[:10]
    for cnt in cnts:
        peri   = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
        if len(approx) == 4:
            return _order_points(approx.reshape(4, 2).astype("float32"))
    h, w = gray.shape
    return np.array([[0, 0], [w, 0], [w, h], [0, h]], dtype="float32")


def correct_skew(image: np.ndarray,
                 manual_corners: np.ndarray | None = None) -> np.ndarray:
    """
    Deskew and warp the photo to a fixed WARP_WIDTH × WARP_HEIGHT canvas.

    Parameters
    ----------
    image          : BGR image from cv2.imread.
    manual_corners : Optional (4, 2) float32 [TL, TR, BR, BL] — overrides
                     automatic detection.  Pass None for auto.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    if manual_corners is not None:
        src = _order_points(manual_corners.astype("float32"))
    else:
        src = _find_corner_squares(gray)
        if src is None:
            print("[OMR] Corner squares not found — using edge fallback.")
            src = _edge_fallback(gray)

    dst = np.array([
        [0,              0              ],
        [WARP_WIDTH - 1, 0              ],
        [WARP_WIDTH - 1, WARP_HEIGHT - 1],
        [0,              WARP_HEIGHT - 1],
    ], dtype="float32")

    M      = cv2.getPerspectiveTransform(src, dst)
    warped = cv2.warpPerspective(image, M, (WARP_WIDTH, WARP_HEIGHT))
    return warped


# ─────────────────────────────────────────────────────────────────────────────
#  BUBBLE SCORING  — relative comparison: darkest bubble in a row wins
# ─────────────────────────────────────────────────────────────────────────────

def _pixel_count(binary: np.ndarray, cx: int, cy: int, r: int) -> int:
    """Count white (filled-mark) pixels inside a circular ROI."""
    mask = np.zeros(binary.shape, dtype="uint8")
    cv2.circle(mask, (cx, cy), r, 255, -1)
    return int(cv2.countNonZero(cv2.bitwise_and(binary, binary, mask=mask)))


def score_question(binary: np.ndarray,
                   options: dict,
                   radius: int = BUBBLE_RADIUS) -> str | None:
    """
    Return the most-filled option letter for a single question.
    Uses relative comparison — no fixed threshold to tune.
    Returns None if the question appears unanswered.
    """
    max_possible = int(np.pi * radius * radius)
    counts = {}

    for letter, (cx, cy) in options.items():
        if cy < SCAN_Y_CUTOFF:
            continue
        counts[letter] = _pixel_count(binary, cx, cy, radius)

    if not counts:
        return None

    best_letter = max(counts, key=counts.__getitem__)
    best_count  = counts[best_letter]

    if best_count < max_possible * MIN_FILL_RATIO:
        return None    # no bubble was meaningfully marked

    return best_letter


# ─────────────────────────────────────────────────────────────────────────────
#  MAIN PIPELINE
# ─────────────────────────────────────────────────────────────────────────────

def process_omr(image_path: str,
                template: dict | None = None,
                manual_corners: np.ndarray | None = None,
                bubble_radius: int = BUBBLE_RADIUS) -> dict:
    """
    Full OMR pipeline: load → deskew → preprocess → score.

    Parameters
    ----------
    image_path      : Path to the scanned / photographed image.
    template        : Bubble coordinate dict. Defaults to computed TEMPLATE.
    manual_corners  : Optional (4, 2) float32 corner array for manual warp.
    bubble_radius   : Pixel radius of each bubble ROI.

    Returns
    -------
    {"question_1": "B", "question_2": "A", ..., "question_100": None, ...}
    """
    if template is None:
        template = TEMPLATE

    image = cv2.imread(image_path)
    if image is None:
        raise FileNotFoundError(f"Cannot read image: {image_path}")

    warped = correct_skew(image, manual_corners)
    binary = preprocess(warped)

    results = {}
    for question, options in template.items():
        results[question] = score_question(binary, options, bubble_radius)

    return results


# ─────────────────────────────────────────────────────────────────────────────
#  SCORING
# ─────────────────────────────────────────────────────────────────────────────

def score_omr(answers: dict, answer_key: dict) -> dict:
    """
    Compare detected answers against a provided answer key.

    Returns
    -------
    {
        "correct": int,
        "wrong":   int,
        "skipped": int,
        "details": {"question_1": {"detected": "B", "correct": "B",
                                   "result": "correct"}, ...}
    }
    """
    correct = wrong = skipped = 0
    details = {}
    for q, key_ans in answer_key.items():
        detected = answers.get(q)
        if detected is None:
            skipped += 1; result = "skipped"
        elif detected == key_ans:
            correct += 1; result = "correct"
        else:
            wrong   += 1; result = "wrong"
        details[q] = {"detected": detected, "correct": key_ans, "result": result}
    return {"correct": correct, "wrong": wrong, "skipped": skipped, "details": details}


# ─────────────────────────────────────────────────────────────────────────────
#  DEBUG OVERLAY
# ─────────────────────────────────────────────────────────────────────────────

def debug_draw_bubbles(image_path: str,
                       answers: dict,
                       output_path: str = "debug_output.jpg",
                       template: dict | None = None,
                       manual_corners: np.ndarray | None = None,
                       answer_key: dict | None = None) -> str:
    """
    Save an annotated warped image for visual alignment verification.

    Colour coding
    -------------
    Green  — detected answer (or correct when answer_key provided)
    Red    — wrong answer
    Grey   — not selected
    """
    if template is None:
        template = TEMPLATE

    image  = cv2.imread(image_path)
    warped = correct_skew(image, manual_corners)

    for question, options in template.items():
        chosen = answers.get(question)
        key    = answer_key.get(question) if answer_key else None
        for letter, (cx, cy) in options.items():
            if letter == chosen:
                if key is None:
                    colour, thickness = (0, 220, 0), 2
                elif chosen == key:
                    colour, thickness = (0, 220, 0), 2   # correct
                else:
                    colour, thickness = (0, 60, 255), 2  # wrong
            else:
                colour, thickness = (80, 80, 80), 1
            cv2.circle(warped, (cx, cy), BUBBLE_RADIUS, colour, thickness)
            cv2.putText(warped, letter, (cx - 5, cy + 4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.28, colour, 1)

    cv2.imwrite(output_path, warped)
    print(f"[OMR] Debug image saved → {output_path}")
    return output_path


# ─────────────────────────────────────────────────────────────────────────────
#  CALIBRATION HELPER
#  Run once with a blank (unanswered) sheet to verify coordinate alignment.
#  It draws every bubble ROI circle on the warped image so you can check
#  that each circle lands inside a printed bubble.
# ─────────────────────────────────────────────────────────────────────────────

def calibrate(image_path: str,
              output_path: str = "calibration.jpg",
              manual_corners: np.ndarray | None = None) -> str:
    """
    Overlay the full bubble grid on the warped image — no scoring.
    Use this to visually check / fine-tune COLUMN_BASES, GRID_TOP, ROW_SPACING.
    """
    image  = cv2.imread(image_path)
    warped = correct_skew(image, manual_corners)

    # Draw row centres (horizontal guide lines)
    for row in range(ROWS_PER_COL):
        cy = int(round(GRID_TOP + row * ROW_SPACING))
        cv2.line(warped, (0, cy), (WARP_WIDTH, cy), (255, 200, 0), 1)

    # Draw every bubble circle
    for q in range(1, 101):
        col_block = ((q - 1) // ROWS_PER_COL) + 1
        row_index = (q - 1) % ROWS_PER_COL
        base_x    = COLUMN_BASES[col_block]
        cy        = int(round(GRID_TOP + row_index * ROW_SPACING))
        for i, letter in enumerate(OPTIONS):
            cx = base_x + i * BUBBLE_SPACING
            cv2.circle(warped, (cx, cy), BUBBLE_RADIUS, (0, 255, 255), 1)
            cv2.putText(warped, letter, (cx - 5, cy + 4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.26, (0, 200, 255), 1)

        # Question number label
        q_x = COLUMN_BASES[col_block] - 32
        cv2.putText(warped, str(q), (q_x, cy + 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.28, (255, 100, 0), 1)

    cv2.imwrite(output_path, warped)
    print(f"[OMR] Calibration image saved → {output_path}")
    print(f"      Grid: TOP={GRID_TOP}  BOTTOM={GRID_BOTTOM}  SPACING={ROW_SPACING:.1f}")
    print(f"      Columns: {COLUMN_BASES}  Bubble spacing: {BUBBLE_SPACING}")
    return output_path


# ─────────────────────────────────────────────────────────────────────────────
#  CLI
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    mode = sys.argv[1] if len(sys.argv) > 1 else "scan"
    path = sys.argv[2] if len(sys.argv) > 2 else "sheet.jpg"

    if mode == "calibrate":
        calibrate(path, "calibration.jpg")
        print("[OMR] Open calibration.jpg and check circles land on bubbles.")
        print("      Adjust GRID_TOP, ROW_SPACING, COLUMN_BASES, BUBBLE_SPACING if needed.")
    else:
        print(f"[OMR] Scanning: {path}")
        answers = process_omr(path)
        print(json.dumps(answers, indent=2))
        debug_draw_bubbles(path, answers, "debug_output.jpg")
        print("[OMR] See debug_output.jpg for visual verification.")
