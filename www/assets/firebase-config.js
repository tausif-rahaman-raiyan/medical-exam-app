/**
 * Firebase Configuration
 * Keep sensitive keys in environment variables during build
 * This prevents API key exposure in public repositories
 */

const firebaseConfig = {
    apiKey: window.FIREBASE_API_KEY || "AIzaSyCeOGW02mBVV5oQAWzh9scy1xULjwPg1Ek",
    authDomain: "hazera-taju-degree-college.firebaseapp.com",
    projectId: "hazera-taju-degree-college",
    storageBucket: "hazera-taju-degree-college.firebasestorage.app",
    messagingSenderId: "110273229891",
    appId: "1:110273229891:web:28ca38967befe86a11d0f6",
    measurementId: "G-W129JR3BTP"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references
const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

// Export for use
window.firebaseAuth = auth;
window.firebaseDB = db;
window.googleProvider = provider;

console.log("Firebase initialized successfully");
