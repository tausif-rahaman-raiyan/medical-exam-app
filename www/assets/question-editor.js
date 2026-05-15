// ============== QUESTION EDITOR FOR ALL QUESTION FILES ==============
// Include this in every question HTML file to enable editing

class QuestionEditor {
    constructor() {
        this.editMode = false;
        this.currentQuestionIndex = null;
        this.questions = window.questions || [];
        this.initializeEditor();
    }

    initializeEditor() {
        // Add edit button to sticky header
        const stickyHeader = document.getElementById('sticky-header');
        if (stickyHeader) {
            const editBtn = document.createElement('button');
            editBtn.id = 'toggle-edit-mode';
            editBtn.className = 'bg-indigo-600 text-white px-4 py-2 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all';
            editBtn.innerHTML = '<i class="fa fa-edit mr-2"></i>Edit Questions';
            editBtn.onclick = () => this.toggleEditMode();
            stickyHeader.appendChild(editBtn);
        }
    }

    toggleEditMode() {
        this.editMode = !this.editMode;
        const btn = document.getElementById('toggle-edit-mode');
        
        if (this.editMode) {
            btn.classList.add('bg-rose-600', 'hover:bg-rose-700');
            btn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
            btn.innerHTML = '<i class="fa fa-save mr-2"></i>Save Changes';
            this.enableEditing();
        } else {
            btn.classList.remove('bg-rose-600', 'hover:bg-rose-700');
            btn.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
            btn.innerHTML = '<i class="fa fa-edit mr-2"></i>Edit Questions';
            this.saveChanges();
            this.disableEditing();
        }
    }

    enableEditing() {
        const questionsList = document.getElementById('questions-list');
        const cards = questionsList.querySelectorAll('.question-card');
        
        cards.forEach((card, index) => {
            const editForm = document.createElement('div');
            editForm.className = 'edit-form mt-4 p-4 bg-indigo-900/30 rounded-lg border border-indigo-500/50 space-y-2';
            editForm.innerHTML = `
                <input type="text" placeholder="Question" value="${this.questions[index]?.q || ''}" class="question-input w-full p-2 rounded bg-zinc-800 text-white text-sm" data-index="${index}" data-field="q"/>
                <input type="text" placeholder="Option A" value="${this.questions[index]?.a || ''}" class="question-input w-full p-2 rounded bg-zinc-800 text-white text-sm" data-index="${index}" data-field="a"/>
                <input type="text" placeholder="Option B" value="${this.questions[index]?.b || ''}" class="question-input w-full p-2 rounded bg-zinc-800 text-white text-sm" data-index="${index}" data-field="b"/>
                <input type="text" placeholder="Option C" value="${this.questions[index]?.c || ''}" class="question-input w-full p-2 rounded bg-zinc-800 text-white text-sm" data-index="${index}" data-field="c"/>
                <input type="text" placeholder="Option D" value="${this.questions[index]?.d || ''}" class="question-input w-full p-2 rounded bg-zinc-800 text-white text-sm" data-index="${index}" data-field="d"/>
                <select class="question-input w-full p-2 rounded bg-zinc-800 text-white text-sm" data-index="${index}" data-field="ans">
                    <option value="">Select Correct Answer</option>
                    <option value="a" ${this.questions[index]?.ans === 'a' ? 'selected' : ''}>A</option>
                    <option value="b" ${this.questions[index]?.ans === 'b' ? 'selected' : ''}>B</option>
                    <option value="c" ${this.questions[index]?.ans === 'c' ? 'selected' : ''}>C</option>
                    <option value="d" ${this.questions[index]?.ans === 'd' ? 'selected' : ''}>D</option>
                </select>
                <textarea placeholder="Explanation" class="question-input w-full p-2 rounded bg-zinc-800 text-white text-sm" data-index="${index}" data-field="exp" rows="2">${this.questions[index]?.exp || ''}</textarea>
            `;
            card.appendChild(editForm);
        });
        
        // Add Gemini analysis button
        this.addGeminiAnalysisFeature();
    }

    disableEditing() {
        const editForms = document.querySelectorAll('.edit-form');
        editForms.forEach(form => form.remove());
    }

    saveChanges() {
        const inputs = document.querySelectorAll('.question-input');
        inputs.forEach(input => {
            const index = parseInt(input.dataset.index);
            const field = input.dataset.field;
            const value = input.value;
            
            if (!this.questions[index]) {
                this.questions[index] = {};
            }
            this.questions[index][field] = value;
        });
        
        // Update window.questions
        window.questions = this.questions;
        console.log('Questions updated:', this.questions);
    }

    addGeminiAnalysisFeature() {
        const questionsList = document.getElementById('questions-list');
        const analysisPanel = document.createElement('div');
        analysisPanel.className = 'mt-8 p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl border border-blue-500/30';
        analysisPanel.innerHTML = `
            <h3 class="text-lg font-bold mb-4 text-blue-300"><i class="fa fa-magic mr-2"></i>AI Question Analyzer (Gemini)</h3>
            <div class="space-y-3">
                <input type="number" id="analyzeQuestionIndex" placeholder="Enter question number to analyze" min="1" class="w-full p-3 rounded-lg bg-zinc-800 text-white focus:outline-none focus:border-blue-500"/>
                <button onclick="questionEditorInstance.analyzeWithGemini()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors">
                    <i class="fa fa-flask mr-2"></i>Analyze Question with AI
                </button>
                <div id="analysis-result" class="mt-4 p-4 rounded-lg bg-black/30 hidden">
                    <p id="analysis-text" class="text-sm text-zinc-300"></p>
                </div>
            </div>
        `;
        questionsList.parentNode.insertBefore(analysisPanel, questionsList.nextSibling);
    }

    async analyzeWithGemini() {
        const qIndex = parseInt(document.getElementById('analyzeQuestionIndex').value) - 1;
        
        if (qIndex < 0 || qIndex >= this.questions.length) {
            alert('Invalid question number');
            return;
        }
        
        const question = this.questions[qIndex];
        const apiKey = window.GEMINI_API_KEY;
        
        if (!apiKey || apiKey === '__SECRET_KEY__') {
            alert('Please add your Gemini API key in API Settings first');
            return;
        }
        
        const prompt = `You are an expert medical educator. Analyze this MCQ question:

Question: ${question.q}
A) ${question.a}
B) ${question.b}
C) ${question.c}
D) ${question.d}
Correct Answer: ${question.ans.toUpperCase()}

Provide:
1. Is the correct answer actually correct?
2. Are all options clear and unambiguous?
3. Common student mistakes for this question
4. Suggested improvements (if any)
5. Difficulty level (Easy/Medium/Hard)`;
        
        const resultDiv = document.getElementById('analysis-result');
        const resultText = document.getElementById('analysis-text');
        
        resultDiv.classList.remove('hidden');
        resultText.innerText = 'Analyzing...';
        
        try {
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.error?.message);
            
            resultText.innerText = data.candidates[0].content.parts[0].text;
        } catch (error) {
            resultText.innerText = 'Error: ' + error.message;
        }
    }
}

// Initialize editor globally
let questionEditorInstance;
document.addEventListener('DOMContentLoaded', () => {
    questionEditorInstance = new QuestionEditor();
});
