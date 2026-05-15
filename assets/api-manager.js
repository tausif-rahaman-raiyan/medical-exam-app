// ============== API KEY MANAGEMENT SYSTEM ==============

const apiModal = document.getElementById('api-modal');
const closeApiModal = document.getElementById('close-api-modal');
const apiKeyInput = document.getElementById('apiKeyInput');
const apiSettingsBtn = document.getElementById('apiSettingsBtn');
const showApiKeyBtn = document.getElementById('showApiKeyBtn');
const testApiKeyBtn = document.getElementById('testApiKeyBtn');
const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
const deleteApiKeyBtn = document.getElementById('deleteApiKeyBtn');
const apiStatus = document.getElementById('apiStatus');
const apiStatusText = document.getElementById('apiStatusText');

let apiKeyIsVisible = false;
let auth, db;

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCeOGW02mBVV5oQAWzh9scy1xULjwPg1Ek",
    authDomain: "hazera-taju-degree-college.firebaseapp.com",
    projectId: "hazera-taju-degree-college",
    storageBucket: "hazera-taju-degree-college.firebasestorage.app",
    messagingSenderId: "110273229891",
    appId: "1:110273229891:web:28ca38967befe86a11d0f6",
    measurementId: "G-W129JR3BTP"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

auth = firebase.auth();
db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

const authBtn = document.getElementById('authBtn');
const authBtnText = document.getElementById('authBtnText');
const userImg = document.getElementById('userImg');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');

// Authentication Handler
authBtn.onclick = () => {
    if (!auth.currentUser) {
        auth.signInWithPopup(provider).catch(err => console.error("Login failed:", err));
    } else {
        auth.signOut();
    }
};

// Monitor Authentication State
auth.onAuthStateChanged(async (user) => {
    if (user) {
        userImg.src = user.photoURL || 'https://ui-avatars.com/api/?name=' + user.displayName;
        userName.innerText = user.displayName;
        userEmail.innerText = user.email;
        authBtnText.innerText = "Logout";
        
        // SHOW API SETTINGS BUTTON FOR LOGGED-IN USERS
        apiSettingsBtn.classList.remove('hidden');
        
        window.activeUser = {
            name: user.displayName,
            email: user.email,
            photo: user.photoURL,
            uid: user.uid
        };
        
        // Load existing API key from Firebase
        loadUserApiKey(user.uid);
    } else {
        userImg.src = 'https://ui-avatars.com/api/?name=Guest&background=9333ea&color=fff';
        userName.innerText = "Guest User";
        userEmail.innerText = "Not signed in";
        authBtnText.innerText = "Sign in with Gmail";
        apiSettingsBtn.classList.add('hidden');
        window.activeUser = null;
    }
});

// Open API Settings Modal
apiSettingsBtn.onclick = () => {
    document.getElementById('userDropdown').classList.add('hidden');
    apiModal.classList.remove('hidden');
    apiModal.classList.add('flex');
};

// Close Modal
closeApiModal.onclick = () => {
    apiModal.classList.add('hidden');
    apiModal.classList.remove('flex');
    apiKeyInput.type = 'password';
    apiKeyIsVisible = false;
};

// Show/Hide API Key
showApiKeyBtn.onclick = () => {
    apiKeyIsVisible = !apiKeyIsVisible;
    apiKeyInput.type = apiKeyIsVisible ? 'text' : 'password';
    showApiKeyBtn.innerHTML = apiKeyIsVisible 
        ? '<i class="fa fa-eye-slash mr-2"></i>Hide Key' 
        : '<i class="fa fa-eye mr-2"></i>Show Key';
};

// Save API Key to Firebase
saveApiKeyBtn.onclick = async () => {
    if (!auth.currentUser) {
        showApiStatus('Please login first', 'error');
        return;
    }
    
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        showApiStatus('Please enter an API key', 'error');
        return;
    }
    
    saveApiKeyBtn.disabled = true;
    showApiStatus('Saving...', 'loading');
    
    try {
        await db.collection('user_api_keys').doc(auth.currentUser.uid).set({
            apiKey: apiKey,
            email: auth.currentUser.email,
            savedAt: new Date(),
            isActive: true
        });
        
        showApiStatus('✓ API key saved successfully!', 'success');
        saveApiKeyBtn.disabled = false;
        
        // Update global window variable
        window.GEMINI_API_KEY = apiKey;
        
    } catch (error) {
        showApiStatus('Error saving key: ' + error.message, 'error');
        saveApiKeyBtn.disabled = false;
    }
};

// Load API Key from Firebase
async function loadUserApiKey(uid) {
    try {
        const doc = await db.collection('user_api_keys').doc(uid).get();
        if (doc.exists) {
            const data = doc.data();
            apiKeyInput.value = data.apiKey;
            window.GEMINI_API_KEY = data.apiKey;
        }
    } catch (error) {
        console.error('Error loading API key:', error);
    }
}

// Test API Key
testApiKeyBtn.onclick = async () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        showApiStatus('Please enter an API key first', 'error');
        return;
    }
    
    testApiKeyBtn.disabled = true;
    showApiStatus('Testing API key...', 'loading');
    
    try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "test" }]
                }]
            })
        });
        
        if (response.ok) {
            showApiStatus('✓ API key is valid and working!', 'success');
        } else {
            showApiStatus('✗ Invalid API key or quota exceeded', 'error');
        }
    } catch (error) {
        showApiStatus('✗ Test failed: ' + error.message, 'error');
    }
    
    testApiKeyBtn.disabled = false;
};

// Delete API Key
deleteApiKeyBtn.onclick = async () => {
    if (!confirm('Are you sure you want to delete your API key?')) return;
    
    if (!auth.currentUser) return;
    
    deleteApiKeyBtn.disabled = true;
    showApiStatus('Deleting...', 'loading');
    
    try {
        await db.collection('user_api_keys').doc(auth.currentUser.uid).delete();
        apiKeyInput.value = '';
        window.GEMINI_API_KEY = '__SECRET_KEY__';
        showApiStatus('✓ API key deleted', 'success');
        deleteApiKeyBtn.disabled = false;
    } catch (error) {
        showApiStatus('Error deleting key: ' + error.message, 'error');
        deleteApiKeyBtn.disabled = false;
    }
};

// Helper function to show status
function showApiStatus(message, type = 'info') {
    apiStatusText.innerText = message;
    apiStatus.classList.remove('hidden');
    
    if (type === 'success') {
        apiStatus.className = 'p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm';
    } else if (type === 'error') {
        apiStatus.className = 'p-3 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-sm';
    } else {
        apiStatus.className = 'p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm';
    }
}

// Export functions for use in question files
window.ApiManager = {
    getGeminiApiKey: () => window.GEMINI_API_KEY,
    analyzeOMRWithGemini: analyzeOMRWithGemini,
    analyzeHardQuestion: analyzeHardQuestion
};

// Analyze OMR Sheet with Gemini
async function analyzeOMRWithGemini(imageBase64, questionCount = 100) {
    const apiKey = window.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === '__SECRET_KEY__') {
        alert('Please add your Gemini API key in API Settings');
        return null;
    }
    
    const prompt = `You are an expert OMR grader. Analyze this OMR sheet image with ${questionCount} questions. 
    Each question has options A, B, C, D. 
    Identify which circles are filled (marked) and which are empty (gaps).
    Return ONLY valid JSON with this exact format:
    {"1": "A", "2": "B", "3": "C", ...}
    Keys are question numbers (1-${questionCount}), values are the marked answer (A/B/C/D or null if blank).
    Return ONLY the JSON object, no other text.`;
    
    try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
                    ]
                }]
            })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "API Error");
        
        let aiText = data.candidates[0].content.parts[0].text;
        aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        return JSON.parse(aiText);
    } catch (error) {
        console.error('OMR Analysis Error:', error);
        return null;
    }
}

// Analyze Hard Questions with Gemini
async function analyzeHardQuestion(imageBase64, questionText = "") {
    const apiKey = window.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === '__SECRET_KEY__') {
        alert('Please add your Gemini API key in API Settings');
        return null;
    }
    
    const prompt = `You are an expert medical examiner. Analyze this question image.
    ${questionText ? `Question: ${questionText}` : ''}
    
    Provide:
    1. What type of question is this (MCQ, Numerical, Essay, etc)
    2. Identify the correct answer with explanation
    3. Common mistakes students make
    4. Difficulty level (Easy/Medium/Hard)
    
    Return as JSON format.`;
    
    try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
                    ]
                }]
            })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "API Error");
        
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Question Analysis Error:', error);
        return null;
    }
}
