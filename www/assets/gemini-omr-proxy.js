// --- GEMINI AI OMR SCANNER (No gate — open for all users) ---

window.openHardOMRCamera = () => {
    document.getElementById('entry-modal').classList.add('hidden');
    document.getElementById('camera-modal').classList.remove('hidden');
    document.getElementById('camera-modal').classList.add('flex');
};

window.processHardOMR = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById('camera-modal').classList.add('hidden');
    document.getElementById('sticky-header').classList.add('hidden');
    const qList = document.getElementById('questions-list');
    qList.innerHTML = `
        <div class="text-center py-32">
            <i class="fa fa-spinner fa-spin text-5xl text-emerald-500 mb-4"></i>
            <h2 class="text-2xl font-black dark:text-white">AI is reading your OMR...</h2>
            <p class="opacity-60 dark:text-white mt-2">Please hold on, this takes about 4–6 seconds.</p>
        </div>`;

    const reader = new FileReader();
    reader.onloadend = async () => {
        const base64Image = reader.result.split(',')[1];
        const mimeType = file.type || 'image/jpeg';
        const promptText = 'You are an expert OMR grader for a Bangladesh Medical Admission Test. Look at this OMR sheet. There are 100 questions, each with options a, b, c, d. Identify which bubbles are filled in. Return ONLY a raw JSON object where the keys are the question numbers (1 to 100) and the values are the selected option (a, b, c, or d). Do not include Markdown formatting or any other text. Example: {"1": "c", "2": "b"}';

        // Use user's personal key first, then fall back to the app's built-in key
        const apiKey = localStorage.getItem('medicalExamApp_apiKey') || window.GEMINI_API_KEY || '';

        if (!apiKey || apiKey === '__SECRET_KEY__') {
            qList.innerHTML = `
                <div class="text-center py-24 px-6">
                    <i class="fa fa-key text-5xl text-yellow-400 mb-4"></i>
                    <h2 class="text-2xl font-black dark:text-white mb-2">API Key Needed</h2>
                    <p class="text-sm opacity-60 dark:text-zinc-400 mb-6">To use Hard OMR scanning, set a free Gemini API key once — it stays saved on your device.</p>
                    <button onclick="if(window.profileManager) window.profileManager.showApiKeyModal(); document.getElementById('sticky-header').classList.remove('hidden');"
                        class="px-8 py-3 bg-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/25 hover:bg-purple-700 transition-all active:scale-95">
                        <i class="fa fa-key mr-2"></i> Set API Key (Free)
                    </button>
                    <p class="text-[11px] mt-4 opacity-40 dark:text-zinc-500">Get a free key at <a href="https://makersuite.google.com/app/apikey" target="_blank" class="underline text-purple-400">Google AI Studio</a></p>
                </div>`;
            return;
        }

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: promptText },
                                { inline_data: { mime_type: mimeType, data: base64Image } }
                            ]
                        }]
                    })
                }
            );

            const data = await response.json();
            if (!response.ok) throw new Error(data.error?.message || 'API Error');

            let aiText = data.candidates[0].content.parts[0].text;
            aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
            const scannedAnswers = JSON.parse(aiText);

            gradeAIOMR(scannedAnswers);

        } catch (error) {
            console.error('AI Scanning Failed:', error);
            qList.innerHTML = `
                <div class="text-center py-24 px-6">
                    <i class="fa fa-exclamation-triangle text-5xl text-rose-500 mb-4"></i>
                    <h2 class="text-2xl font-black dark:text-white mb-2">Scan Failed</h2>
                    <p class="font-mono text-xs text-red-400 bg-red-900/20 p-4 rounded-xl break-words mt-4">${error.message || error}</p>
                    <button onclick="location.reload()" class="mt-6 px-6 py-3 font-bold bg-rose-500 text-white rounded-2xl hover:bg-rose-600 transition-all">
                        <i class="fa fa-redo mr-2"></i> Try Again
                    </button>
                </div>`;
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
    document.getElementById('res-time').innerText = 'AI Scanned';
    document.getElementById('res-score').innerText = finalScore + '/' + questions.length;

    document.getElementById('results-card').classList.remove('hidden');

    currentMode = 'sol';
    renderQuestions();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    saveResultToCloud(finalScore, correct, wrong, 0);
};
