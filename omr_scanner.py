import cv2
import numpy as np
import json


# ─────────────────────────────────────────────────────────────────────────────
#  TUNABLE PARAMETERS
# ─────────────────────────────────────────────────────────────────────────────

WARP_WIDTH  = 1000   # width of the perspective-corrected output image
WARP_HEIGHT = 1400   # height of the perspective-corrected output image

# Grid geometry (all values are in pixels on the 1000×1400 warped image)
GRID_TOP          = 480    # y of the first question row centre
GRID_BOTTOM       = 1350   # y of the last  question row centre
ROWS_PER_COLUMN   = 25     # questions per column block
ROW_SPACING       = (GRID_BOTTOM - GRID_TOP) / (ROWS_PER_COLUMN - 1)  # ≈34.5 px

# Column block base x-coordinates (leftmost bubble A of each block)
COLUMN_BASES = {
    1:  135,   # Q  1–25
    2:  365,   # Q 26–50
    3:  595,   # Q 51–75
    4:  825,   # Q 76–100
}

BUBBLE_SPACING   = 35    # horizontal pixels between A→B→C→D
BUBBLE_RADIUS    = 12    # radius (px) of the circular ROI mask

# Ignore everything above this y when scanning to skip barcodes / QR codes
SCAN_Y_CUTOFF    = 450

# Corner-square detection: squares must occupy at least this fraction of image
CORNER_MIN_AREA_RATIO = 0.0003

OPTIONS = ["A", "B", "C", "D"]


# ─────────────────────────────────────────────────────────────────────────────
#  COORDINATE GENERATOR  (replaces the hardcoded JSON template)
# ─────────────────────────────────────────────────────────────────────────────

def build_template() -> dict:
    """
    Compute bubble (x, y) centres for all 100 questions from the grid formula:

        y = GRID_TOP  + (row_index × ROW_SPACING)          row_index 0..24
        x = COLUMN_BASE + (option_index × BUBBLE_SPACING)  option_index 0..3

    Returns dict: {"question_1": {"A": [x,y], "B":..., "C":..., "D":...}, ...}
    """
    template = {}
    for q in range(1, 101):
        col_block  = ((q - 1) // ROWS_PER_COLUMN) + 1   # 1–4
        row_index  = (q - 1) % ROWS_PER_COLUMN           # 0–24
        base_x     = COLUMN_BASES[col_block]
        cy         = int(round(GRID_TOP + row_index * ROW_SPACING))
        options    = {}
        for i, letter in enumerate(OPTIONS):
            cx = base_x + i * BUBBLE_SPACING
            options[letter] = [cx, cy]
        template[f"question_{q}"] = options
    return template


TEMPLATE = build_template()


# ─────────────────────────────────────────────────────────────────────────────
#  PERSPECTIVE CORRECTION
# ─────────────────────────────────────────────────────────────────────────────

def _order_points(pts: np.ndarray) -> np.ndarray:
    """Sort four points into [TL, TR, BR, BL] order."""
    rect = np.zeros((4, 2), dtype="float32")
    s    = pts.sum(axis=1)
    diff = np.diff(pts, axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect


def _find_corner_squares(gray: np.ndarray) -> np.ndarray | None:
    """
    Locate the four black corner registration squares on the OMR sheet.
    Returns ordered (4, 2) float32 array or None on failure.
    """
    _, thresh = cv2.threshold(gray, 60, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    img_area    = gray.shape[0] * gray.shape[1]
    min_area    = img_area * CORNER_MIN_AREA_RATIO
    max_area    = img_area * 0.01   # corner squares are small

    squares = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if not (min_area < area < max_area):
            continue
        peri   = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.04 * peri, True)
        if len(approx) == 4:
            x, y, w, h = cv2.boundingRect(approx)
            aspect = w / float(h)
            if 0.6 < aspect < 1.6:    # roughly square
                cx = x + w // 2
                cy = y + h // 2
                squares.append([cx, cy])

    if len(squares) < 4:
        return None

    # Pick the four most corner-like points using convex hull
    pts   = np.array(squares, dtype="float32")
    hull  = cv2.convexHull(pts).reshape(-1, 2)
    if len(hull) < 4:
        return None

    # Among hull points pick the 4 that span the largest area
    from itertools import combinations
    best_pts  = None
    best_area = 0
    for combo in combinations(range(len(hull)), 4):
        candidate = hull[list(combo)]
        area      = cv2.contourArea(candidate)
        if area > best_area:
            best_area = area
            best_pts  = candidate

    return _order_points(best_pts) if best_pts is not None else None


def _fallback_corners(gray: np.ndarray) -> np.ndarray:
    """
    Edge-based fallback: find the largest quadrilateral in the image
    (the sheet boundary) when corner squares are not detected.
    """
    blurred  = cv2.GaussianBlur(gray, (5, 5), 0)
    edged    = cv2.Canny(blurred, 75, 200)
    contours, _ = cv2.findContours(edged, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours     = sorted(contours, key=cv2.contourArea, reverse=True)[:10]
    for cnt in contours:
        peri   = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
        if len(approx) == 4:
            return _order_points(approx.reshape(4, 2).astype("float32"))
    # Last resort: use image corners
    h, w = gray.shape
    return np.array([[0, 0], [w, 0], [w, h], [0, h]], dtype="float32")


def correct_skew(image: np.ndarray,
                 manual_corners: np.ndarray | None = None) -> np.ndarray:
    """
    Deskew and warp the photo to a fixed WARP_WIDTH × WARP_HEIGHT canvas.

    Parameters
    ----------
    image          : BGR image as returned by cv2.imread.
    manual_corners : Optional (4, 2) float32 in [TL, TR, BR, BL] order.
                     Overrides automatic detection when supplied.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    if manual_corners is not None:
        src = _order_points(manual_corners)
    else:
        src = _find_corner_squares(gray)
        if src is None:
            print("[OMR] Corner squares not found — trying edge fallback.")
            src = _fallback_corners(gray)

    dst = np.array([
        [0,              0             ],
        [WARP_WIDTH - 1, 0             ],
        [WARP_WIDTH - 1, WARP_HEIGHT - 1],
        [0,              WARP_HEIGHT - 1],
    ], dtype="float32")

    M      = cv2.getPerspectiveTransform(src, dst)
    warped = cv2.warpPerspective(image, M, (WARP_WIDTH, WARP_HEIGHT))
    return warped


# ─────────────────────────────────────────────────────────────────────────────
#  PREPROCESSING
# ─────────────────────────────────────────────────────────────────────────────

def preprocess(warped: np.ndarray) -> np.ndarray:
    """
    Convert warped BGR image to a binary (black-and-white) image where
    filled bubbles appear as WHITE regions.
    """
    gray    = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    binary  = cv2.adaptiveThreshold(
        blurred,
        maxValue=255,
        adaptiveMethod=cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        thresholdType=cv2.THRESH_BINARY_INV,   # filled = white
        blockSize=11,
        C=2
    )
    return binary


# ─────────────────────────────────────────────────────────────────────────────
#  BUBBLE SCORING  (relative comparison — darkest bubble wins)
# ─────────────────────────────────────────────────────────────────────────────

def _count_filled_pixels(binary: np.ndarray, cx: int, cy: int, radius: int) -> int:
    """Count white (filled) pixels inside a circle on the binary image."""
    mask = np.zeros(binary.shape, dtype="uint8")
    cv2.circle(mask, (cx, cy), radius, 255, -1)
    return int(cv2.countNonZero(cv2.bitwise_and(binary, binary, mask=mask)))


def score_question(binary: np.ndarray,
                   options: dict,
                   radius: int = BUBBLE_RADIUS) -> str | None:
    """
    For a single question, return the letter of the most-filled bubble.
    Uses relative comparison: whichever bubble has the most white pixels wins.
    Returns None if no bubble exceeds 10 % of the maximum possible fill
    (i.e. the question was skipped / all bubbles are empty).
    """
    max_possible = int(np.pi * radius * radius)
    counts       = {}

    for letter, (cx, cy) in options.items():
        if cy < SCAN_Y_CUTOFF:
            continue
        counts[letter] = _count_filled_pixels(binary, cx, cy, radius)

    if not counts:
        return None

    best_letter = max(counts, key=counts.__getitem__)
    best_count  = counts[best_letter]

    # Reject if even the "best" bubble is nearly empty
    if best_count < max_possible * 0.10:
        return None

    return best_letter


# ─────────────────────────────────────────────────────────────────────────────
#  MAIN ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────

def process_omr(image_path: str,
                template: dict | None = None,
                manual_corners: np.ndarray | None = None,
                bubble_radius: int = BUBBLE_RADIUS) -> dict:
    """
    Full OMR pipeline: load → deskew → threshold → score → return answers.

    Parameters
    ----------
    image_path      : Path to the scanned / photographed image.
    template        : Coordinate template dict.  Defaults to TEMPLATE (generated).
    manual_corners  : Optional (4,2) float32 corner array for manual alignment.
    bubble_radius   : Pixel radius of each bubble ROI.

    Returns
    -------
    dict  {"question_1": "B", "question_2": "A", ..., "question_100": None, ...}
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
#  SCORING HELPER
# ─────────────────────────────────────────────────────────────────────────────

def score_omr(answers: dict, answer_key: dict) -> dict:
    """
    Compare detected answers against an answer key.

    Parameters
    ----------
    answers    : Output of process_omr().
    answer_key : {"question_1": "B", "question_2": "D", ...}

    Returns
    -------
    {
        "correct": int,
        "wrong":   int,
        "skipped": int,
        "details": {"question_1": {"detected": "B", "correct": "B", "result": "correct"}, ...}
    }
    """
    correct = wrong = skipped = 0
    details = {}

    for q, key_answer in answer_key.items():
        detected = answers.get(q)
        if detected is None:
            skipped += 1
            result   = "skipped"
        elif detected == key_answer:
            correct += 1
            result   = "correct"
        else:
            wrong  += 1
            result   = "wrong"
        details[q] = {"detected": detected, "correct": key_answer, "result": result}

    return {"correct": correct, "wrong": wrong, "skipped": skipped, "details": details}


# ─────────────────────────────────────────────────────────────────────────────
#  DEBUG: draw bubble ROIs on the warped image
# ─────────────────────────────────────────────────────────────────────────────

def debug_draw_bubbles(image_path: str,
                       answers: dict,
                       output_path: str = "debug_output.jpg",
                       template: dict | None = None,
                       manual_corners: np.ndarray | None = None) -> str:
    """
    Save a annotated warped image:  green circle = selected, grey = not selected.
    Useful for verifying coordinate alignment visually.
    """
    if template is None:
        template = TEMPLATE

    image  = cv2.imread(image_path)
    warped = correct_skew(image, manual_corners)

    for question, options in template.items():
        chosen = answers.get(question)
        for letter, (cx, cy) in options.items():
            colour    = (0, 220, 0) if letter == chosen else (80, 80, 80)
            thickness = 2 if letter == chosen else 1
            cv2.circle(warped, (cx, cy), BUBBLE_RADIUS, colour, thickness)
            cv2.putText(warped, letter, (cx - 5, cy + 4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.28, colour, 1)

    cv2.imwrite(output_path, warped)
    print(f"[OMR] Debug image saved → {output_path}")
    return output_path


# ─────────────────────────────────────────────────────────────────────────────
#  QUICK CLI TEST
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    path = sys.argv[1] if len(sys.argv) > 1 else "sheet.jpg"
    print(f"[OMR] Processing: {path}")

    answers = process_omr(path)
    print(json.dumps(answers, indent=2))

    debug_draw_bubbles(path, answers, "debug_output.jpg")
    print("[OMR] Done. See debug_output.jpg for visual verification.")
