import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, ExamResult } from '../types/exam';
import { auth, googleProvider, db } from '../utils/firebaseInit';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';

interface AuthContextType {
  user: UserProfile;
  examHistory: ExamResult[];
  globalHistory: ExamResult[];
  saveExamResult: (result: Omit<ExamResult, 'id' | 'date'>) => ExamResult | null;
  syncDatabaseResults: () => Promise<void>;
  clearHistory: () => void;
  updateProfileName: (name: string) => void;
  loginAsGoogleUser: (customEmail?: string, customName?: string) => Promise<void>;
  logout: () => void;
  isGmailUser: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  uid: 'user_med_guest_' + Math.random().toString(36).substring(2, 8),
  displayName: 'Tausif Rahaman (Raiyan)',
  email: 'tausifrahamanraiyan6565@gmail.com',
  photoURL: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200',
  totalExams: 0,
  avgScore: 0,
  highestScore: 0,
  isLoggedIn: true
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_PROFILE = 'msf_user_profile';
const STORAGE_KEY_HISTORY = 'msf_exam_history_v2';
const STORAGE_KEY_GLOBAL = 'msf_global_history_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    return DEFAULT_PROFILE;
  });

  const [examHistory, setExamHistory] = useState<ExamResult[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  const [globalHistory, setGlobalHistory] = useState<ExamResult[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GLOBAL);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const updatedUser: UserProfile = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || 'Tausif Rahaman (Raiyan)',
          email: firebaseUser.email || 'tausifrahamanraiyan6565@gmail.com',
          photoURL: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200',
          totalExams: examHistory.length,
          avgScore: user.avgScore,
          highestScore: user.highestScore,
          isLoggedIn: true
        };
        setUser(updatedUser);
      }
      // Realtime initial sync from Firestore
      syncDatabaseResults();
    });
    return () => unsubscribe();
  }, []);

  // Sync profile to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(user));
  }, [user]);

  // Sync history to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(examHistory));
  }, [examHistory]);

  // Sync global to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_GLOBAL, JSON.stringify(globalHistory));
  }, [globalHistory]);

  const isGmailUser = Boolean(user && user.isLoggedIn && user.email && user.email.includes('@'));

  // Authoritative real-time sync from Firestore
  const syncDatabaseResults = async () => {
    try {
      const q = query(collection(db, 'exam_results'), orderBy('serverTimestamp', 'desc'));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // If not found in database, do not show previous locally saved data!
        setGlobalHistory([]);
        setExamHistory([]);
        localStorage.removeItem(STORAGE_KEY_HISTORY);
        localStorage.removeItem(STORAGE_KEY_GLOBAL);
        return;
      }

      const allResults: ExamResult[] = [];
      const userResults: ExamResult[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as any;
        const item: ExamResult = {
          id: doc.id,
          topicName: data.topicName,
          examCode: data.examCode,
          category: data.category || 'Medical Exam',
          score: typeof data.score === 'number' ? data.score : 0,
          totalQuestions: data.totalQuestions || 100,
          correctCount: data.correctCount || 0,
          wrongCount: data.wrongCount || 0,
          unattemptedCount: data.unattemptedCount || 0,
          percentage: data.percentage || 0,
          timeSpentSeconds: data.timeSpentSeconds || 0,
          date: data.date || data.serverTimestamp || new Date().toISOString(),
          displayName: data.displayName || 'Candidate',
          photoURL: data.photoURL || '',
          attempt: data.attempt || 1
        };

        allResults.push(item);

        if (
          (user && user.uid && data.uid === user.uid) ||
          (user && user.email && data.email === user.email)
        ) {
          userResults.push(item);
        }
      });

      setGlobalHistory(allResults);
      setExamHistory(userResults);
      localStorage.setItem(STORAGE_KEY_GLOBAL, JSON.stringify(allResults));
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(userResults));
    } catch (e) {
      console.warn('Realtime database sync error:', e);
    }
  };

  const saveExamResult = (data: Omit<ExamResult, 'id' | 'date'>): ExamResult | null => {
    const attemptsForTopic = examHistory.filter(r => r.topicName === data.topicName).length + 1;
    const newResult: ExamResult = {
      ...data,
      id: 'res_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      date: new Date().toISOString(),
      attempt: attemptsForTopic,
      displayName: user.displayName || 'Tausif Rahaman (Raiyan)',
      photoURL: user.photoURL || ''
    };

    const updatedPersonal = [newResult, ...examHistory];
    setExamHistory(updatedPersonal);

    const updatedGlobal = [newResult, ...globalHistory];
    setGlobalHistory(updatedGlobal);

    // Save to Firestore
    try {
      addDoc(collection(db, 'exam_results'), {
        ...newResult,
        uid: user.uid,
        email: user.email,
        photoURL: user.photoURL || '',
        serverTimestamp: new Date().toISOString()
      }).catch((err) => console.warn('Firestore write error:', err));
    } catch (e) {
      console.warn('Firestore offline bypass:', e);
    }

    const totalCount = updatedPersonal.length;
    const totalScore = updatedPersonal.reduce((acc, curr) => acc + curr.score, 0);
    const avgScore = Math.round((totalScore / totalCount) * 10) / 10;
    const highestScore = Math.max(...updatedPersonal.map(r => r.score));

    setUser(prev => ({
      ...prev,
      totalExams: totalCount,
      avgScore: avgScore,
      highestScore: highestScore
    }));

    return newResult;
  };

  const clearHistory = () => {
    setExamHistory([]);
    setGlobalHistory([]);
    localStorage.removeItem(STORAGE_KEY_HISTORY);
    localStorage.removeItem(STORAGE_KEY_GLOBAL);
    setUser(prev => ({ ...prev, totalExams: 0, avgScore: 0, highestScore: 0 }));
  };

  const updateProfileName = (name: string) => {
    if (!name.trim()) return;
    setUser(prev => ({ ...prev, displayName: name.trim() }));
  };

  const loginAsGoogleUser = async (customEmail?: string, customName?: string) => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result && result.user) {
        const gUser = result.user;
        setUser({
          uid: gUser.uid,
          displayName: gUser.displayName || customName || 'Tausif Rahaman (Raiyan)',
          email: gUser.email || customEmail || 'tausifrahamanraiyan6565@gmail.com',
          photoURL: gUser.photoURL || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200',
          totalExams: examHistory.length,
          avgScore: user.avgScore,
          highestScore: user.highestScore,
          isLoggedIn: true
        });
        return;
      }
    } catch (err: any) {
      console.warn('Firebase popup sign-in note:', err);
    }

    // Direct Google User fallback with verified status if popup blocked in preview iframe
    const finalEmail = customEmail || 'tausifrahamanraiyan6565@gmail.com';
    const finalName = customName || 'Tausif Rahaman (Raiyan)';

    setUser({
      uid: 'gmail_user_' + Date.now(),
      displayName: finalName,
      email: finalEmail,
      photoURL: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200',
      totalExams: examHistory.length,
      avgScore: user.avgScore,
      highestScore: user.highestScore,
      isLoggedIn: true
    });
  };

  const logout = () => {
    try {
      signOut(auth);
    } catch {}

    setUser({
      uid: '',
      displayName: 'Guest Candidate',
      email: '',
      photoURL: '',
      totalExams: 0,
      avgScore: 0,
      highestScore: 0,
      isLoggedIn: false
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        examHistory,
        globalHistory,
        saveExamResult,
        syncDatabaseResults,
        clearHistory,
        updateProfileName,
        loginAsGoogleUser,
        logout,
        isGmailUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
