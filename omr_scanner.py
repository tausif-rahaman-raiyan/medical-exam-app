"""
OMR Scanner — Medical Secret Files
===================================
OMRChecker-inspired pipeline:
  1. Registration-mark alignment (black anchor bars on left/right margins)
  2. Perspective warp to a fixed 1000×1400 canvas
  3. CLAHE + Gaussian blur + Otsu binarisation
  4. Morphological close (handles faint pencil marks & erasures)
  5. Relative-thresholding per row  — no global fixed threshold to tune
  6. Double-mark detection & warning
"""

import cv2
import numpy as np
import json
from itertools import combinations


# ─────────────────────────────────────────────────────────────────────────────
#  CALIBRATED GRID CONSTANTS  (1000×1400 warped canvas)
# ─────────────────────────────────────────────────────────────────────────────

WARP_WIDTH   = 1000
WARP_HEIGHT  = 1400

GRID_TOP        = 65       # y-centre of row 0  (first question row)
GRID_BOTTOM     = 1361     # y-centre of row 24 (last question row)
ROWS_PER_COL    = 25
ROW_SPACING     = (GRID_BOTTOM - GRID_TOP) / (ROWS_PER_COL - 1)   # ≈ 54 px

COLUMN_BASES = {           # x of bubble "A" in each column block
    1:  109,               # Q  1–25
    2:  357,               # Q 26–50
    3:  605,               # Q 51–75
    4:  853,               # Q 76–100
}
BUBBLE_SPACING = 40        # A→B→C→D spacing in px
BUBBLE_RADIUS  = 14        # ROI radius around each bubble centre

SCAN_Y_CUTOFF  = 50        # ignore bubbles above this (column header row)
MIN_FILL_RATIO = 0.08      # fraction of ROI area that must be filled

DOUBLE_MARK_RATIO   = 0.80  # second-best / best ratio above which = double mark
# A bubble is only "genuinely filled" when its count is at least this many
# times the ROW MEAN of all four bubbles.  Eliminates false alarms caused by
# printed circle outlines and A/B/C/D letter glyphs (which inflate every bubble's
# baseline pixel count equally).
GENUINE_FILL_FACTOR = 1.8   # bubble must be ≥ 1.8× row-mean to count as marked

OPTIONS = ["A", "B", "C", "D"]


# ─────────────────────────────────────────────────────────────────────────────
#  TEMPLATE  — precomputed bubble (x, y) for all 100 questions
# ─────────────────────────────────────────────────────────────────────────────

def build_template() -> dict:
    template = {}
    for q in range(1, 101):
        col_block  = ((q - 1) // ROWS_PER_COL) + 1
        row_index  = (q - 1) % ROWS_PER_COL
        base_x     = COLUMN_BASES[col_block]
        cy         = int(round(GRID_TOP + row_index * ROW_SPACING))
        template[f"question_{q}"] = {
            letter: [base_x + i * BUBBLE_SPACING, cy]
            for i, letter in enumerate(OPTIONS)
        }
    return template


TEMPLATE = build_template()


# ─────────────────────────────────────────────────────────────────────────────
#  PREPROCESSING
# ─────────────────────────────────────────────────────────────────────────────

def preprocess(warped: np.ndarray) -> np.ndarray:
    """
    CLAHE → Gaussian blur → Otsu binarisation → morphological close.
    Returns a binary image where filled marks are WHITE.
    """
    gray    = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY)
    clahe   = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    gray    = clahe.apply(gray)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    _, bw   = cv2.threshold(blurred, 0, 255,
                             cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    kernel  = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    bw      = cv2.morphologyEx(bw, cv2.MORPH_CLOSE, kernel, iterations=1)
    return bw


# ─────────────────────────────────────────────────────────────────────────────
#  REGISTRATION-MARK DETECTION  (OMRChecker anchor approach)
#  Detects the black horizontal bars on the left/right margins of the sheet.
#  These act as reliable anchor points even in rotated or skewed photos.
# ─────────────────────────────────────────────────────────────────────────────

def _find_registration_marks(gray: np.ndarray):
    """
    Locate black horizontal registration bars in the left and right margins.
    Returns a list of (cx, cy) centres, or [] if none found.
    """
    h, w  = gray.shape
    _, thresh = cv2.threshold(gray, 60, 255, cv2.THRESH_BINARY_INV)

    cnts, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL,
                                cv2.CHAIN_APPROX_SIMPLE)
    marks = []
    for cnt in cnts:
        area = cv2.contourArea(cnt)
        if area < 50:
            continue
        x, y, bw, bh = cv2.boundingRect(cnt)
        aspect = bw / float(bh) if bh else 0
        # Registration bars are wide, short, and in the margins
        if aspect > 3 and bh < h * 0.04:
            cx = x + bw // 2
            cy = y + bh // 2
            if cx < w * 0.18 or cx > w * 0.82:   # left or right margin
                marks.append((cx, cy))
    return marks


def _order_points(pts: np.ndarray) -> np.ndarray:
    rect = np.zeros((4, 2), dtype="float32")
    s    = pts.sum(axis=1)
    diff = np.diff(pts, axis=1)
    rect[0] = pts[np.argmin(s)]    # TL
    rect[2] = pts[np.argmax(s)]    # BR
    rect[1] = pts[np.argmin(diff)] # TR
    rect[3] = pts[np.argmax(diff)] # BL
    return rect


# ─────────────────────────────────────────────────────────────────────────────
#  CORNER-SQUARE DETECTION  (fallback when no manual corners provided)
# ─────────────────────────────────────────────────────────────────────────────

def _find_corner_squares(gray: np.ndarray) -> np.ndarray | None:
    h, w    = gray.shape
    img_area = h * w

    _, thresh = cv2.threshold(gray, 80, 255, cv2.THRESH_BINARY_INV)
    cnts, _   = cv2.findContours(thresh, cv2.RETR_EXTERNAL,
                                  cv2.CHAIN_APPROX_SIMPLE)
    candidates = []
    for cnt in cnts:
        area = cv2.contourArea(cnt)
        if not (img_area * 0.00015 < area < img_area * 0.012):
            continue
        x, y, bw, bh = cv2.boundingRect(cnt)
        aspect = bw / float(bh) if bh else 0
        if 0.45 < aspect < 2.2 and bw > 12 and bh > 12:
            candidates.append((x + bw // 2, y + bh // 2, area))

    if len(candidates) < 4:
        return None

    pts      = np.array([[c[0], c[1]] for c in candidates], dtype="float32")
    best_pts  = None
    best_area = 0
    limit     = min(len(pts), 20)
    for combo in combinations(range(limit), 4):
        cand = pts[list(combo)]
        a    = cv2.contourArea(cand)
        if a > best_area:
            best_area = a
            best_pts  = cand

    return _order_points(best_pts) if best_pts is not None else None


def _edge_fallback(gray: np.ndarray) -> np.ndarray:
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


# ─────────────────────────────────────────────────────────────────────────────
#  PERSPECTIVE WARP
# ─────────────────────────────────────────────────────────────────────────────

def correct_skew(image: np.ndarray,
                 manual_corners: np.ndarray | None = None) -> np.ndarray:
    """
    Warp the image to WARP_WIDTH × WARP_HEIGHT.

    Priority:
      1. manual_corners  (from UI drag handles)
      2. corner squares  (auto-detected black registration squares)
      3. largest quad    (edge-detection fallback)
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    if manual_corners is not None:
        src = _order_points(np.array(manual_corners, dtype="float32"))
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
#  BUBBLE SCORING  — OMRChecker-style relative thresholding
# ─────────────────────────────────────────────────────────────────────────────

def _pixel_count(binary: np.ndarray, cx: int, cy: int, r: int) -> int:
    mask = np.zeros(binary.shape, dtype="uint8")
    cv2.circle(mask, (cx, cy), r, 255, -1)
    return int(cv2.countNonZero(cv2.bitwise_and(binary, binary, mask=mask)))


def score_question(binary: np.ndarray,
                   options: dict,
                   radius: int = BUBBLE_RADIUS) -> dict:
    """
    OMRChecker relative-thresholding:
      - Count filled pixels in every bubble ROI
      - The darkest bubble wins — no global threshold
      - If the second-darkest is within DOUBLE_MARK_RATIO of the best → warn
      - Returns None if the best bubble is below MIN_FILL_RATIO (unanswered)

    Returns
    -------
    {
        "answer":      "B" | None,
        "double_mark": False | ["B","C"],
        "counts":      {"A":12, "B":87, "C":91, "D":10}
    }
    """
    max_possible = int(np.pi * radius * radius)
    counts = {}
    for letter, (cx, cy) in options.items():
        if cy < SCAN_Y_CUTOFF:
            continue
        counts[letter] = _pixel_count(binary, cx, cy, radius)

    if not counts:
        return {"answer": None, "double_mark": False, "counts": counts}

    sorted_opts  = sorted(counts, key=counts.__getitem__, reverse=True)
    best_letter  = sorted_opts[0]
    best_count   = counts[best_letter]

    # Unanswered: nothing is meaningfully filled
    if best_count < max_possible * MIN_FILL_RATIO:
        return {"answer": None, "double_mark": False, "counts": counts}

    # Double-mark check — row-relative baseline approach:
    #   A bubble is "genuinely marked" only if its count is ≥ GENUINE_FILL_FACTOR
    #   times the row mean.  This ignores the shared baseline from printed circle
    #   outlines and A/B/C/D letter glyphs (which inflate all 4 bubbles equally).
    row_mean    = sum(counts.values()) / max(len(counts), 1)
    genuine_thr = row_mean * GENUINE_FILL_FACTOR

    double_mark = False
    if len(sorted_opts) >= 2:
        second_letter  = sorted_opts[1]
        second_count   = counts[second_letter]
        # Both the best AND second-best must be genuinely-filled (above row baseline)
        best_genuine   = best_count   >= genuine_thr
        second_genuine = second_count >= genuine_thr
        if best_genuine and second_genuine and second_count >= best_count * DOUBLE_MARK_RATIO:
            double_mark = [best_letter, second_letter]

    return {"answer": best_letter, "double_mark": double_mark, "counts": counts}


# ─────────────────────────────────────────────────────────────────────────────
#  MAIN PIPELINE
# ─────────────────────────────────────────────────────────────────────────────

def process_omr(image_path: str,
                template: dict | None = None,
                manual_corners: np.ndarray | None = None,
                bubble_radius: int = BUBBLE_RADIUS) -> tuple[dict, dict]:
    """
    Full pipeline: load → warp → preprocess → score all 100 questions.

    Returns
    -------
    answers  : {"question_1": "B", "question_2": None, ...}
    warnings : {"question_7": "double_mark:B+C", ...}
    """
    if template is None:
        template = TEMPLATE

    image = cv2.imread(image_path)
    if image is None:
        raise FileNotFoundError(f"Cannot read image: {image_path}")

    warped = correct_skew(image, manual_corners)
    binary = preprocess(warped)

    answers  = {}
    warnings = {}

    for question, options in template.items():
        result   = score_question(binary, options, bubble_radius)
        answers[question] = result["answer"]
        if result["double_mark"]:
            a, b = result["double_mark"]
            warnings[question] = f"double_mark:{a}+{b}"

    return answers, warnings


# ─────────────────────────────────────────────────────────────────────────────
#  SCORING
# ─────────────────────────────────────────────────────────────────────────────

def score_omr(answers: dict, answer_key: dict) -> dict:
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
    return {"correct": correct, "wrong": wrong, "skipped": skipped,
            "details": details}


# ─────────────────────────────────────────────────────────────────────────────
#  DEBUG OVERLAY  — green = marked, red = not selected, orange = double-mark
# ─────────────────────────────────────────────────────────────────────────────

def debug_draw_bubbles(image_path: str,
                       answers: dict,
                       output_path: str = "debug_output.jpg",
                       template: dict | None = None,
                       manual_corners: np.ndarray | None = None,
                       answer_key: dict | None = None,
                       warnings: dict | None = None) -> str:
    if template is None:
        template = TEMPLATE
    if warnings is None:
        warnings = {}

    image  = cv2.imread(image_path)
    warped = correct_skew(image, manual_corners)

    for question, options in template.items():
        chosen    = answers.get(question)
        key       = answer_key.get(question) if answer_key else None
        is_double = question in warnings and "double_mark" in warnings[question]

        for letter, (cx, cy) in options.items():
            if letter == chosen:
                if is_double:
                    colour, thickness = (0, 165, 255), 2   # orange = double mark
                elif key is None:
                    colour, thickness = (0, 220, 0), 2     # green  = detected
                elif chosen == key:
                    colour, thickness = (0, 220, 0), 2     # green  = correct
                else:
                    colour, thickness = (0, 60, 255), 2    # red    = wrong
            else:
                colour, thickness = (80, 80, 80), 1        # grey   = not selected
            cv2.circle(warped, (cx, cy), BUBBLE_RADIUS, colour, thickness)
            cv2.putText(warped, letter, (cx - 5, cy + 4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.28, colour, 1)

    # Draw double-mark labels
    for question, warn_msg in warnings.items():
        if "double_mark" in warn_msg:
            opts = template[question]
            cy   = list(opts.values())[0][1]
            col_block = ((int(question.split("_")[1]) - 1) // ROWS_PER_COL) + 1
            base_x    = COLUMN_BASES[col_block]
            cv2.putText(warped, "!!", (base_x - 28, cy + 4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.32, (0, 165, 255), 1)

    cv2.imwrite(output_path, warped)
    return output_path


# ─────────────────────────────────────────────────────────────────────────────
#  CALIBRATION HELPER
# ─────────────────────────────────────────────────────────────────────────────

def calibrate(image_path: str,
              output_path: str = "calibration.jpg",
              manual_corners: np.ndarray | None = None) -> str:
    image  = cv2.imread(image_path)
    warped = correct_skew(image, manual_corners)

    for row in range(ROWS_PER_COL):
        cy = int(round(GRID_TOP + row * ROW_SPACING))
        cv2.line(warped, (0, cy), (WARP_WIDTH, cy), (255, 200, 0), 1)

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
        q_x = COLUMN_BASES[col_block] - 32
        cv2.putText(warped, str(q), (q_x, cy + 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.28, (255, 100, 0), 1)

    cv2.imwrite(output_path, warped)
    print(f"[OMR] Calibration → {output_path}")
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
    else:
        answers, warnings = process_omr(path)
        print(json.dumps({"answers": answers, "warnings": warnings}, indent=2))
        debug_draw_bubbles(path, answers, "debug_output.jpg", warnings=warnings)
