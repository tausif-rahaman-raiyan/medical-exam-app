// --- SECURE GEMINI AI OMR SCANNER ---
// Frontend no longer stores API key - all requests go through secure backend proxy

window.openHardOMRCamera = () => {
    document.getElementById('entry-modal').classList.add('hidden');
    document.getElementById('camera-modal').classList.remove('hidden');
};

window.processHardOMR = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    document.getElementById('camera-modal').classList.add('hidden');
    document.getElementById('sticky-header').classList.add('hidden');
    const qList = document.getElementById('questions-list');
    qList.innerHTML = '<div class="text-center py-32"><i class="fa fa-spinner fa-spin text-5xl text-emerald-500 mb-4"></i><h2 class="text-2xl font-black dark:text-white">AI is reading your OMR...</h2></div>';

    const reader = new FileReader();
    reader.onloadend = async () => {
        const base64Image = reader.result.split(',')[1];
        const promptText = "You are an expert OMR grader for a Bangladesh Medical Admission Test. Look at this OMR sheet. There are 100 questions, each with options a, b, c, d. Identify which bubbles are filled and return ONLY valid JSON with question numbers as keys and answers (a/b/c/d) as values.";

        try {
            // Call secure backend proxy instead of direct Gemini API
            const response = await fetch(
                window.location.origin.includes('github.io') 
                    ? 'https://medical-exam-api.vercel.app/api/scan-omr'
                    : '/api/scan-omr',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image: base64Image,
                        prompt: promptText
                    })
                }
            );

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Backend error");

            gradeAIOMR(data.result);

        } catch (error) {
            console.error("AI Scanning Failed:", error);
            qList.innerHTML = '<div class="text-center py-32"><i class="fa fa-exclamation-triangle text-5xl text-rose-500 mb-4"></i><h2 class="text-2xl font-black dark:text-white">Scan Failed</h2><p class="text-red-400 mt-2">' + error.message + '</p></div>';
        }
    };
    reader.readAsDataURL(file);
};

window.gradeAIOMR = (scannedAnswers) => {
    questions.forEach((q, i) => {
        const qNum = (i + 1).toString();
        if (scannedAnswers[qNum]) {
            userAnswers[i] = scannedAnswers[qNum].toLowerCase();
        }
    });

    let correct = 0;
    let wrong = 0;
    questions.forEach((q, i) => {
        if (userAnswers[i] === q.ans) correct++;
        else if (userAnswers[i] !== undefined) wrong++;
    });

    const finalScore = (correct - (wrong * 0.25)).toFixed(2);
    
    document.getElementById('res-correct').innerText = correct;
    document.getElementById('res-wrong').innerText = wrong;
    document.getElementById('res-time').innerText = "AI Scanned";
    document.getElementById('res-score').innerText = finalScore + "/" + questions.length;
    
    document.getElementById('results-card').classList.remove('hidden');
    
    currentMode = 'sol'; 
    renderQuestions();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    saveResultToCloud(finalScore, correct, wrong, 0); 
};
