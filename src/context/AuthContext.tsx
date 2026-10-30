import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, ExamResult } from '../types/exam';

interface AuthContextType {
  user: UserProfile;
  examHistory: ExamResult[];
  saveExamResult: (result: Omit<ExamResult, 'id' | 'date'>) => ExamResult;
  clearHistory: () => void;
  updateProfileName: (name: string) => void;
  loginAsGoogleUser: () => void;
  logout: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  uid: 'user_med_' + Math.random().toString(36).substring(2, 8),
  displayName: 'Medical Aspirant',
  email: 'aspirant@medicalsecretfiles.org',
  photoURL: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200',
  totalExams: 0,
  avgScore: 0,
  highestScore: 0
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_PROFILE = 'msf_user_profile';
const STORAGE_KEY_HISTORY = 'msf_exam_history_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PROFILE;
  });

  const [examHistory, setExamHistory] = useState<ExamResult[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(examHistory));
  }, [examHistory]);

  const saveExamResult = (data: Omit<ExamResult, 'id' | 'date'>): ExamResult => {
    const attemptsForTopic = examHistory.filter(r => r.topicName === data.topicName).length + 1;
    const newResult: ExamResult = {
      ...data,
      id: 'res_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      date: new Date().toISOString(),
      attempt: attemptsForTopic,
      displayName: user.displayName
    };

    const updatedHistory = [newResult, ...examHistory];
    setExamHistory(updatedHistory);

    // Update user stats
    const totalCount = updatedHistory.length;
    const totalScore = updatedHistory.reduce((acc, curr) => acc + curr.score, 0);
    const avgScore = Math.round((totalScore / totalCount) * 10) / 10;
    const highestScore = Math.max(...updatedHistory.map(r => r.score));

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
    setUser(prev => ({
      ...prev,
      totalExams: 0,
      avgScore: 0,
      highestScore: 0
    }));
  };

  const updateProfileName = (name: string) => {
    if (!name.trim()) return;
    setUser(prev => ({ ...prev, displayName: name.trim() }));
  };

  const loginAsGoogleUser = () => {
    setUser({
      uid: 'google_med_user_' + Date.now(),
      displayName: 'Dr. Future Candidate',
      email: 'candidate@medical.ac.bd',
      photoURL: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
      totalExams: examHistory.length,
      avgScore: user.avgScore,
      highestScore: user.highestScore
    });
  };

  const logout = () => {
    setUser(DEFAULT_PROFILE);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        examHistory,
        saveExamResult,
        clearHistory,
        updateProfileName,
        loginAsGoogleUser,
        logout
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
