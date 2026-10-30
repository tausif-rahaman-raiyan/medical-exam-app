// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCeOGW02mBVV5oQAWzh9scy1xULjwPg1Ek",
  authDomain: "hazera-taju-degree-college.firebaseapp.com",
  projectId: "hazera-taju-degree-college",
  storageBucket: "hazera-taju-degree-college.firebasestorage.app",
  messagingSenderId: "110273229891",
  appId: "1:110273229891:web:28ca38967befe86a11d0f6",
  measurementId: "G-W129JR3BTP"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

if (typeof window !== 'undefined') {
  (window as any).firebaseApp = app;
  (window as any).firebaseAuth = {
    auth,
    signInWithPopup: () => signInWithPopup(auth, googleProvider),
    signOut: () => signOut(auth)
  };
  (window as any).googleProvider = googleProvider;
  (window as any).firebaseDB = db;
}
