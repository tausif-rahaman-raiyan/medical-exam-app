/**
 * Medical Secret Files - Firebase Configuration & Auth Initializer
 * Dynamically retrieves configuration securely from backend environment
 */

(function () {
    const defaultFallback = {
        apiKey: window.FIREBASE_API_KEY || "AIzaSyCeOGW02mBVV5oQAWzh9scy1xULjwPg1Ek",
        authDomain: "hazera-taju-degree-college.firebaseapp.com",
        projectId: "hazera-taju-degree-college",
        storageBucket: "hazera-taju-degree-college.firebasestorage.app",
        messagingSenderId: "110273229891",
        appId: "1:110273229891:web:28ca38967befe86a11d0f6",
        measurementId: "G-W129JR3BTP"
    };

    function initFirebaseWithConfig(config) {
        if (!window.firebase || window.firebase.apps.length > 0) return;

        try {
            const app = firebase.initializeApp(config);
            const auth = firebase.auth();
            const db = firebase.firestore();
            const provider = new firebase.auth.GoogleAuthProvider();

            window.firebaseApp = app;
            window.firebaseAuth = auth;
            window.firebaseDB = db;
            window.googleProvider = provider;

            console.log("Firebase initialized successfully for Medical Secret Files");
        } catch (e) {
            console.warn("Firebase initialization note:", e);
        }
    }

    // Try fetching from server-side proxy route first to keep environment variables secured
    if (window.location.protocol.startsWith('http')) {
        fetch('/api/firebase-config')
            .then(res => res.ok ? res.json() : defaultFallback)
            .then(config => initFirebaseWithConfig(config))
            .catch(() => initFirebaseWithConfig(defaultFallback));
    } else {
        // Desktop / local file mode fallback
        initFirebaseWithConfig(defaultFallback);
    }
})();
