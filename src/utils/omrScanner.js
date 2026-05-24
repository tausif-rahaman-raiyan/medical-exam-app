/* global cv */

export function scanOMRSheet(canvasId, optionsPerQuestion = 4) {
    if (typeof cv === 'undefined') {
        throw new Error("OpenCV.js is not loaded yet.");
    }

    let src = cv.imread(canvasId);
    let gray = new cv.Mat();
    let blurred = new cv.Mat();
    let thresh = new cv.Mat();
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    // 1. Preprocess
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
    cv.threshold(blurred, thresh, 0, 255, cv.THRESH_BINARY_INV | cv.THRESH_OTSU);

    // 2. Find Contours
    cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let bubbles = [];
    for (let i = 0; i < contours.size(); ++i) {
        let cnt = contours.get(i);
        let rect = cv.boundingRect(cnt);
        let aspectRatio = rect.width / rect.height;

        if (aspectRatio >= 0.8 && aspectRatio <= 1.2 && rect.width >= 15 && rect.height >= 15) {
            bubbles.push({ contour: cnt.clone(), rect: rect });
        }
        // No need to delete cnt here if we clone it for bubbles
    }

    // 3. Sort Top-to-Bottom
    bubbles.sort((a, b) => a.rect.y - b.rect.y);

    let results = [];
    const MIN_PIXEL_THRESHOLD = 150; // Adjust based on your canvas size

    // 4. Group into rows
    for (let i = 0; i < bubbles.length; i += optionsPerQuestion) {
        let rowBubbles = bubbles.slice(i, i + optionsPerQuestion);
        rowBubbles.sort((a, b) => a.rect.x - b.rect.x);

        let markedOption = null;
        let maxPixels = 0;

        for (let j = 0; j < rowBubbles.length; j++) {
            let mask = cv.Mat.zeros(thresh.rows, thresh.cols, cv.CV_8UC1);
            let currentContourVec = new cv.MatVector();
            currentContourVec.push_back(rowBubbles[j].contour);

            cv.drawContours(mask, currentContourVec, 0, new cv.Scalar(255), -1, cv.LINE_8, hierarchy, 0);

            let maskedData = new cv.Mat();
            cv.bitwise_and(thresh, thresh, maskedData, mask);
            let totalPixels = cv.countNonZero(maskedData);

            if (totalPixels > maxPixels && totalPixels > MIN_PIXEL_THRESHOLD) {
                maxPixels = totalPixels;
                markedOption = j;
            }

            mask.delete();
            currentContourVec.delete();
            maskedData.delete();
        }

        const optionMap = ['a', 'b', 'c', 'd', 'e'];
        results.push(markedOption !== null ? optionMap[markedOption] : "skipped");
    }

    // 5. Cleanup
    src.delete(); gray.delete(); blurred.delete(); thresh.delete(); 
    hierarchy.delete(); contours.delete();
    bubbles.forEach(b => b.contour.delete());

    return results;
}
