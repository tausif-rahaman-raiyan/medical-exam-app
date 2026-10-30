export interface ExamItem {
  t: string;          // Title
  c: string;          // Code (e.g. 1020325001)
  url?: string;        // Question HTML source path
  qCount: number;     // e.g. 100
  duration: number;   // Minutes, e.g. 50
  customQuestions?: Question[];
}

export interface SubjectCategory {
  cat: string;
  icon: string;
  color: string;
  items: ExamItem[];
}

export interface Question {
  id: number;
  q: string;          // Question text
  a: string;          // Option A
  b: string;          // Option B
  c: string;          // Option C
  d: string;          // Option D
  ans: 'a' | 'b' | 'c' | 'd' | string; // Correct answer
  exp: string;        // Explanation with Reference & Concept
}

export interface UserAnswerMap {
  [questionId: number]: 'a' | 'b' | 'c' | 'd';
}

export interface ExamResult {
  id: string;
  topicName: string;
  examCode: string;
  category: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  percentage: number;
  timeSpentSeconds: number;
  date: string;
  displayName: string;
  attempt: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  totalExams: number;
  avgScore: number;
  highestScore: number;
}
