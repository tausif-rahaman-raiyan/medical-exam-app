import cv2
import numpy as np
import json


# ─────────────────────────────────────────────────────────────────────────────
#  TUNABLE PARAMETERS
#  Adjust these to match your specific OMR sheet and scan conditions.
# ─────────────────────────────────────────────────────────────────────────────

# A bubble whose average pixel intensity is BELOW this value is considered
# "marked" (filled/dark). Range: 0–255.
# Lower  → only very dark fills are detected (less sensitive).
# Higher → lighter fills are also detected (more sensitive).
FILL_THRESHOLD = 120

# Radius (in pixels) of the circular ROI extracted around each bubble centre.
# Should be roughly half the bubble diameter on the warped (output) image.
BUBBLE_RADIUS = 12

# Output size of the perspective-corrected image.
# Must match the canvas size used to define the bubble coordinates.
# Your JavaScript OMR system uses an 840×1190 canvas — keep these in sync.
WARP_WIDTH  = 840
WARP_HEIGHT = 1190


# ─────────────────────────────────────────────────────────────────────────────
#  HELPER: find the four corner points of the OMR sheet in the photo
# ─────────────────────────────────────────────────────────────────────────────

def _order_points(pts: np.ndarray) -> np.ndarray:
    """
    Sort four corner points into [top-left, top-right, bottom-right, bottom-left]
    order so that getPerspectiveTransform maps them correctly.
    """
    rect = np.zeros((4, 2), dtype="float32")
    s    = pts.sum(axis=1)
    diff = np.diff(pts, axis=1)

    rect[0] = pts[np.argmin(s)]     # top-left     (smallest x+y)
    rect[2] = pts[np.argmax(s)]     # bottom-right (largest  x+y)
    rect[1] = pts[np.argmin(diff)]  # top-right    (smallest x-y)
    rect[3] = pts[np.argmax(diff)]  # bottom-left  (largest  x-y)
    return rect


def _find_sheet_corners(gray: np.ndarray) -> np.ndarray | None:
    """
    Attempt to locate the four corners of the OMR sheet automatically.
    Returns a (4, 2) float32 array or None if detection fails.
    """
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged   = cv2.Canny(blurred, 75, 200)

    contours, _ = cv2.findContours(edged, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours     = sorted(contours, key=cv2.contourArea, reverse=True)[:10]

    for cnt in contours:
        peri   = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
        if len(approx) == 4:
            return _order_points(approx.reshape(4, 2).astype("float32"))

    return None


# ─────────────────────────────────────────────────────────────────────────────
#  HELPER: apply perspective warp so the sheet fills the output canvas
# ─────────────────────────────────────────────────────────────────────────────

def _correct_skew(image: np.ndarray,
                  corners: np.ndarray | None = None) -> np.ndarray:
    """
    Deskew the image using a four-point perspective transform.

    Parameters
    ----------
    image   : BGR image as returned by cv2.imread.
    corners : (4, 2) float32 array in [TL, TR, BR, BL] order.
              If None, auto-detection is attempted; if that also fails the
              original image is returned unchanged.

    Returns
    -------
    Warped BGR image of size (WARP_WIDTH × WARP_HEIGHT).
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    if corners is None:
        corners = _find_sheet_corners(gray)

    if corners is None:
        # Could not find sheet boundary — return image resized to target canvas.
        print("[OMR] Warning: sheet corners not found; skipping perspective warp.")
        return cv2.resize(image, (WARP_WIDTH, WARP_HEIGHT))

    dst = np.array([
        [0,              0             ],
        [WARP_WIDTH - 1, 0             ],
        [WARP_WIDTH - 1, WARP_HEIGHT - 1],
        [0,              WARP_HEIGHT - 1],
    ], dtype="float32")

    M       = cv2.getPerspectiveTransform(corners, dst)
    warped  = cv2.warpPerspective(image, M, (WARP_WIDTH, WARP_HEIGHT))
    return warped


# ─────────────────────────────────────────────────────────────────────────────
#  MAIN FUNCTION
# ─────────────────────────────────────────────────────────────────────────────

def process_omr(image_path: str,
                template_json: dict,
                corners: np.ndarray | None = None,
                fill_threshold: int = FILL_THRESHOLD,
                bubble_radius:  int = BUBBLE_RADIUS) -> dict:
    """
    Scan an OMR answer sheet and return the selected option for every question.

    Parameters
    ----------
    image_path    : Path to the scanned / photographed OMR sheet image.
    template_json : Dict mapping question names to option coordinates, e.g.
                    {"question_1": {"A": [106, 535], "B": [144, 535], ...}, ...}
    corners       : Optional (4, 2) float32 array of sheet corner points in
                    [TL, TR, BR, BL] order for manual perspective correction.
                    Pass None to use automatic corner detection.
    fill_threshold: Pixel intensity below which a bubble is "marked". (0–255)
    bubble_radius : Pixel radius of the ROI extracted around each bubble centre.

    Returns
    -------
    Dict mapping each question key to the chosen option letter, e.g.
    {"question_1": "B", "question_2": "A", ...}
    Questions with no clearly marked bubble are mapped to None.
    """

    # ── 1. Load image ─────────────────────────────────────────────────────────
    image = cv2.imread(image_path)
    if image is None:
        raise FileNotFoundError(f"Could not read image at: {image_path}")

    # ── 2. Perspective correction (deskew) ────────────────────────────────────
    warped = _correct_skew(image, corners)

    # ── 3. Greyscale + adaptive threshold (clean black-and-white) ─────────────
    gray   = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY)

    # Adaptive threshold handles uneven lighting across the sheet.
    binary = cv2.adaptiveThreshold(
        gray,
        maxValue=255,
        adaptiveMethod=cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        thresholdType=cv2.THRESH_BINARY_INV,   # filled bubbles become WHITE
        blockSize=11,
        C=2
    )

    # ── 4. Iterate questions and score each bubble ─────────────────────────────
    results = {}

    for question, options in template_json.items():
        best_option    = None
        best_intensity = -1   # highest "whiteness" on the inverted binary image

        for option_letter, (cx, cy) in options.items():
            # Build a circular mask for this bubble
            mask = np.zeros(binary.shape, dtype="uint8")
            cv2.circle(mask, (cx, cy), bubble_radius, 255, thickness=-1)

            # Average pixel value inside the circle on the inverted binary image.
            # A marked bubble has many white pixels → high mean.
            mean_val = cv2.mean(binary, mask=mask)[0]

            if mean_val > best_intensity:
                best_intensity = mean_val
                best_option    = option_letter

        # Only accept the best option if it crosses the fill threshold.
        # On the inverted binary image the threshold is compared against
        # the fraction of white pixels (scaled to 0–255).
        if best_intensity < fill_threshold:
            best_option = None   # no bubble was clearly marked

        results[question] = best_option

    return results


# ─────────────────────────────────────────────────────────────────────────────
#  COORDINATE TEMPLATE  (all 100 questions from your JSON)
# ─────────────────────────────────────────────────────────────────────────────

TEMPLATE = {
    "question_1":   {"A": [106, 535],  "B": [144, 535],  "C": [181, 535],  "D": [219, 535]},
    "question_2":   {"A": [106, 574],  "B": [144, 574],  "C": [181, 574],  "D": [219, 574]},
    "question_3":   {"A": [106, 612],  "B": [144, 612],  "C": [181, 612],  "D": [219, 612]},
    "question_4":   {"A": [106, 651],  "B": [144, 651],  "C": [181, 651],  "D": [219, 651]},
    "question_5":   {"A": [106, 689],  "B": [144, 689],  "C": [181, 689],  "D": [219, 689]},
    "question_6":   {"A": [106, 728],  "B": [144, 728],  "C": [181, 728],  "D": [219, 728]},
    "question_7":   {"A": [106, 766],  "B": [144, 766],  "C": [181, 766],  "D": [219, 766]},
    "question_8":   {"A": [106, 805],  "B": [144, 805],  "C": [181, 805],  "D": [219, 805]},
    "question_9":   {"A": [106, 843],  "B": [144, 843],  "C": [181, 843],  "D": [219, 843]},
    "question_10":  {"A": [106, 882],  "B": [144, 882],  "C": [181, 882],  "D": [219, 882]},
    "question_11":  {"A": [106, 920],  "B": [144, 920],  "C": [181, 920],  "D": [219, 920]},
    "question_12":  {"A": [106, 959],  "B": [144, 959],  "C": [181, 959],  "D": [219, 959]},
    "question_13":  {"A": [106, 997],  "B": [144, 997],  "C": [181, 997],  "D": [219, 997]},
    "question_14":  {"A": [106, 1036], "B": [144, 1036], "C": [181, 1036], "D": [219, 1036]},
    "question_15":  {"A": [106, 1074], "B": [144, 1074], "C": [181, 1074], "D": [219, 1074]},
    "question_16":  {"A": [106, 1113], "B": [144, 1113], "C": [181, 1113], "D": [219, 1113]},
    "question_17":  {"A": [106, 1151], "B": [144, 1151], "C": [181, 1151], "D": [219, 1151]},
    "question_18":  {"A": [106, 1190], "B": [144, 1190], "C": [181, 1190], "D": [219, 1190]},
    "question_19":  {"A": [106, 1228], "B": [144, 1228], "C": [181, 1228], "D": [219, 1228]},
    "question_20":  {"A": [106, 1267], "B": [144, 1267], "C": [181, 1267], "D": [219, 1267]},
    "question_21":  {"A": [106, 1305], "B": [144, 1305], "C": [181, 1305], "D": [219, 1305]},
    "question_22":  {"A": [106, 1344], "B": [144, 1344], "C": [181, 1344], "D": [219, 1344]},
    "question_23":  {"A": [106, 1382], "B": [144, 1382], "C": [181, 1382], "D": [219, 1382]},
    "question_24":  {"A": [106, 1421], "B": [144, 1421], "C": [181, 1421], "D": [219, 1421]},
    "question_25":  {"A": [106, 1459], "B": [144, 1459], "C": [181, 1459], "D": [219, 1459]},

    "question_26":  {"A": [348, 535],  "B": [386, 535],  "C": [423, 535],  "D": [461, 535]},
    "question_27":  {"A": [348, 574],  "B": [386, 574],  "C": [423, 574],  "D": [461, 574]},
    "question_28":  {"A": [348, 612],  "B": [386, 612],  "C": [423, 612],  "D": [461, 612]},
    "question_29":  {"A": [348, 651],  "B": [386, 651],  "C": [423, 651],  "D": [461, 651]},
    "question_30":  {"A": [348, 689],  "B": [386, 689],  "C": [423, 689],  "D": [461, 689]},
    "question_31":  {"A": [348, 728],  "B": [386, 728],  "C": [423, 728],  "D": [461, 728]},
    "question_32":  {"A": [348, 766],  "B": [386, 766],  "C": [423, 766],  "D": [461, 766]},
    "question_33":  {"A": [348, 805],  "B": [386, 805],  "C": [423, 805],  "D": [461, 805]},
    "question_34":  {"A": [348, 843],  "B": [386, 843],  "C": [423, 843],  "D": [461, 843]},
    "question_35":  {"A": [348, 882],  "B": [386, 882],  "C": [423, 882],  "D": [461, 882]},
    "question_36":  {"A": [348, 920],  "B": [386, 920],  "C": [423, 920],  "D": [461, 920]},
    "question_37":  {"A": [348, 959],  "B": [386, 959],  "C": [423, 959],  "D": [461, 959]},
    "question_38":  {"A": [348, 997],  "B": [386, 997],  "C": [423, 997],  "D": [461, 997]},
    "question_39":  {"A": [348, 1036], "B": [386, 1036], "C": [423, 1036], "D": [461, 1036]},
    "question_40":  {"A": [348, 1074], "B": [386, 1074], "C": [423, 1074], "D": [461, 1074]},
    "question_41":  {"A": [348, 1113], "B": [386, 1113], "C": [423, 1113], "D": [461, 1113]},
    "question_42":  {"A": [348, 1151], "B": [386, 1151], "C": [423, 1151], "D": [461, 1151]},
    "question_43":  {"A": [348, 1190], "B": [386, 1190], "C": [423, 1190], "D": [461, 1190]},
    "question_44":  {"A": [348, 1228], "B": [386, 1228], "C": [423, 1228], "D": [461, 1228]},
    "question_45":  {"A": [348, 1267], "B": [386, 1267], "C": [423, 1267], "D": [461, 1267]},
    "question_46":  {"A": [348, 1305], "B": [386, 1305], "C": [423, 1305], "D": [461, 1305]},
    "question_47":  {"A": [348, 1344], "B": [386, 1344], "C": [423, 1344], "D": [461, 1344]},
    "question_48":  {"A": [348, 1382], "B": [386, 1382], "C": [423, 1382], "D": [461, 1382]},
    "question_49":  {"A": [348, 1421], "B": [386, 1421], "C": [423, 1421], "D": [461, 1421]},
    "question_50":  {"A": [348, 1459], "B": [386, 1459], "C": [423, 1459], "D": [461, 1459]},

    "question_51":  {"A": [590, 535],  "B": [627, 535],  "C": [665, 535],  "D": [702, 535]},
    "question_52":  {"A": [590, 574],  "B": [627, 574],  "C": [665, 574],  "D": [702, 574]},
    "question_53":  {"A": [590, 612],  "B": [627, 612],  "C": [665, 612],  "D": [702, 612]},
    "question_54":  {"A": [590, 651],  "B": [627, 651],  "C": [665, 651],  "D": [702, 651]},
    "question_55":  {"A": [590, 689],  "B": [627, 689],  "C": [665, 689],  "D": [702, 689]},
    "question_56":  {"A": [590, 728],  "B": [627, 728],  "C": [665, 728],  "D": [702, 728]},
    "question_57":  {"A": [590, 766],  "B": [627, 766],  "C": [665, 766],  "D": [702, 766]},
    "question_58":  {"A": [590, 805],  "B": [627, 805],  "C": [665, 805],  "D": [702, 805]},
    "question_59":  {"A": [590, 843],  "B": [627, 843],  "C": [665, 843],  "D": [702, 843]},
    "question_60":  {"A": [590, 882],  "B": [627, 882],  "C": [665, 882],  "D": [702, 882]},
    "question_61":  {"A": [590, 920],  "B": [627, 920],  "C": [665, 920],  "D": [702, 920]},
    "question_62":  {"A": [590, 959],  "B": [627, 959],  "C": [665, 959],  "D": [702, 959]},
    "question_63":  {"A": [590, 997],  "B": [627, 997],  "C": [665, 997],  "D": [702, 997]},
    "question_64":  {"A": [590, 1036], "B": [627, 1036], "C": [665, 1036], "D": [702, 1036]},
    "question_65":  {"A": [590, 1074], "B": [627, 1074], "C": [665, 1074], "D": [702, 1074]},
    "question_66":  {"A": [590, 1113], "B": [627, 1113], "C": [665, 1113], "D": [702, 1113]},
    "question_67":  {"A": [590, 1151], "B": [627, 1151], "C": [665, 1151], "D": [702, 1151]},
    "question_68":  {"A": [590, 1190], "B": [627, 1190], "C": [665, 1190], "D": [702, 1190]},
    "question_69":  {"A": [590, 1228], "B": [627, 1228], "C": [665, 1228], "D": [702, 1228]},
    "question_70":  {"A": [590, 1267], "B": [627, 1267], "C": [665, 1267], "D": [702, 1267]},
    "question_71":  {"A": [590, 1305], "B": [627, 1305], "C": [665, 1305], "D": [702, 1305]},
    "question_72":  {"A": [590, 1344], "B": [627, 1344], "C": [665, 1344], "D": [702, 1344]},
    "question_73":  {"A": [590, 1382], "B": [627, 1382], "C": [665, 1382], "D": [702, 1382]},
    "question_74":  {"A": [590, 1421], "B": [627, 1421], "C": [665, 1421], "D": [702, 1421]},
    "question_75":  {"A": [590, 1459], "B": [627, 1459], "C": [665, 1459], "D": [702, 1459]},

    "question_76":  {"A": [798, 535],  "B": [836, 535],  "C": [873, 535],  "D": [911, 535]},
    "question_77":  {"A": [798, 574],  "B": [836, 574],  "C": [873, 574],  "D": [911, 574]},
    "question_78":  {"A": [798, 612],  "B": [836, 612],  "C": [873, 612],  "D": [911, 612]},
    "question_79":  {"A": [798, 651],  "B": [836, 651],  "C": [873, 651],  "D": [911, 651]},
    "question_80":  {"A": [798, 689],  "B": [836, 689],  "C": [873, 689],  "D": [911, 689]},
    "question_81":  {"A": [798, 728],  "B": [836, 728],  "C": [873, 728],  "D": [911, 728]},
    "question_82":  {"A": [798, 766],  "B": [836, 766],  "C": [873, 766],  "D": [911, 766]},
    "question_83":  {"A": [798, 805],  "B": [836, 805],  "C": [873, 805],  "D": [911, 805]},
    "question_84":  {"A": [798, 843],  "B": [836, 843],  "C": [873, 843],  "D": [911, 843]},
    "question_85":  {"A": [798, 882],  "B": [836, 882],  "C": [873, 882],  "D": [911, 882]},
    "question_86":  {"A": [798, 920],  "B": [836, 920],  "C": [873, 920],  "D": [911, 920]},
    "question_87":  {"A": [798, 959],  "B": [836, 959],  "C": [873, 959],  "D": [911, 959]},
    "question_88":  {"A": [798, 997],  "B": [836, 997],  "C": [873, 997],  "D": [911, 997]},
    "question_89":  {"A": [798, 1036], "B": [836, 1036], "C": [873, 1036], "D": [911, 1036]},
    "question_90":  {"A": [798, 1074], "B": [836, 1074], "C": [873, 1074], "D": [911, 1074]},
    "question_91":  {"A": [798, 1113], "B": [836, 1113], "C": [873, 1113], "D": [911, 1113]},
    "question_92":  {"A": [798, 1151], "B": [836, 1151], "C": [873, 1151], "D": [911, 1151]},
    "question_93":  {"A": [798, 1190], "B": [836, 1190], "C": [873, 1190], "D": [911, 1190]},
    "question_94":  {"A": [798, 1228], "B": [836, 1228], "C": [873, 1228], "D": [911, 1228]},
    "question_95":  {"A": [798, 1267], "B": [836, 1267], "C": [873, 1267], "D": [911, 1267]},
    "question_96":  {"A": [798, 1305], "B": [836, 1305], "C": [873, 1305], "D": [911, 1305]},
    "question_97":  {"A": [798, 1344], "B": [836, 1344], "C": [873, 1344], "D": [911, 1344]},
    "question_98":  {"A": [798, 1382], "B": [836, 1382], "C": [873, 1382], "D": [911, 1382]},
    "question_99":  {"A": [798, 1421], "B": [836, 1421], "C": [873, 1421], "D": [911, 1421]},
    "question_100": {"A": [798, 1459], "B": [836, 1459], "C": [873, 1459], "D": [911, 1459]},
}


# ─────────────────────────────────────────────────────────────────────────────
#  OPTIONAL: DEBUG — draw bubble ROIs onto the warped image for visual checking
# ─────────────────────────────────────────────────────────────────────────────

def debug_draw_bubbles(image_path: str,
                       template_json: dict,
                       results: dict,
                       output_path: str = "debug_output.jpg",
                       corners: np.ndarray | None = None) -> None:
    """
    Save a copy of the warped image with every bubble circle drawn on it.
    Marked bubbles are drawn GREEN, unmarked ones GREY.
    Useful for verifying coordinate alignment before deploying.
    """
    image  = cv2.imread(image_path)
    warped = _correct_skew(image, corners)

    for question, options in template_json.items():
        chosen = results.get(question)
        for letter, (cx, cy) in options.items():
            colour = (0, 200, 0) if letter == chosen else (100, 100, 100)
            cv2.circle(warped, (cx, cy), BUBBLE_RADIUS, colour, 2)
            cv2.putText(warped, letter, (cx - 5, cy + 4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.3, colour, 1)

    cv2.imwrite(output_path, warped)
    print(f"[OMR] Debug image saved to: {output_path}")


# ─────────────────────────────────────────────────────────────────────────────
#  USAGE EXAMPLE
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # ── Basic usage (auto corner detection) ──────────────────────────────────
    answers = process_omr("sheet.jpg", TEMPLATE)
    print(json.dumps(answers, indent=2))

    # ── Manual corner supply (more reliable if auto-detect fails) ─────────────
    # Provide the four corner pixel coordinates of the sheet IN THE ORIGINAL PHOTO
    # in [top-left, top-right, bottom-right, bottom-left] order.
    #
    # manual_corners = np.array([
    #     [  52,  48],   # top-left
    #     [1018,  35],   # top-right
    #     [1031, 1552],  # bottom-right
    #     [  39, 1560],  # bottom-left
    # ], dtype="float32")
    #
    # answers = process_omr("sheet.jpg", TEMPLATE, corners=manual_corners)
    # print(json.dumps(answers, indent=2))

    # ── Tune the threshold ────────────────────────────────────────────────────
    # answers = process_omr("sheet.jpg", TEMPLATE, fill_threshold=90)  # stricter
    # answers = process_omr("sheet.jpg", TEMPLATE, fill_threshold=150) # more lenient

    # ── Visual debug ──────────────────────────────────────────────────────────
    # debug_draw_bubbles("sheet.jpg", TEMPLATE, answers, "debug_output.jpg")
