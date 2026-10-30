import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CatalogView } from './components/CatalogView';
import { CustomMcqCreator } from './components/CustomMcqCreator';
import { ExamEngine } from './components/ExamEngine';
import { PreviewModal } from './components/PreviewModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ResultsModal } from './components/ResultsModal';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { ExamItem, Question, UserAnswerMap, ExamResult } from './types/exam';

const MainAppContent: React.FC = () => {
  const { saveExamResult } = useAuth();

  const [activeTab, setActiveTab] = useState<'catalog' | 'custom' | 'history'>('catalog');
  const [activeExam, setActiveExam] = useState<ExamItem | null>(null);
  const [previewExam, setPreviewExam] = useState<ExamItem | null>(null);
  const [leaderboardOpen, setLeaderboardOpen] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Active exam completion results state
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [activeUserAnswers, setActiveUserAnswers] = useState<UserAnswerMap>({});

  const handleStartExam = (exam: ExamItem) => {
    setActiveExam(exam);
    setExamResult(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleFinishExam = (
    resultData: Omit<ExamResult, 'id' | 'date'>,
    questions: Question[],
    userAnswers: UserAnswerMap
  ) => {
    const savedResult = saveExamResult(resultData);
    const finalResult: ExamResult = savedResult || {
      ...resultData,
      id: 'session_' + Date.now(),
      date: new Date().toISOString(),
      displayName: 'Guest Candidate',
      attempt: 1
    };
    setExamResult(finalResult);
    setActiveQuestions(questions);
    setActiveUserAnswers(userAnswers);
    setActiveExam(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleExitExam = () => {
    setActiveExam(null);
  };

  const handleRetakeExam = () => {
    if (activeExam) {
      handleStartExam(activeExam);
    } else if (examResult) {
      // Re-create exam item from result
      const retakeItem: ExamItem = {
        t: examResult.topicName,
        c: examResult.examCode,
        qCount: examResult.totalQuestions,
        duration: 50,
        customQuestions: activeQuestions
      };
      handleStartExam(retakeItem);
    }
  };

  const handleBackToCatalog = () => {
    setExamResult(null);
    setActiveExam(null);
    setActiveTab('catalog');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col font-sans">
      
      {/* 1. Active Exam Screen (Full viewport) */}
      {activeExam ? (
        <ExamEngine
          examItem={activeExam}
          onFinishExam={(res, qs, ans) => handleFinishExam(res, qs, ans)}
          onExit={handleExitExam}
        />
      ) : examResult ? (
        /* 2. Exam Results & Solution Review Screen */
        <div className="flex-1 pb-16">
          <Header
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            openLeaderboardModal={() => setLeaderboardOpen(true)}
            openSidebar={() => setSidebarOpen(true)}
          />
          <ResultsModal
            questions={activeQuestions}
            userAnswers={activeUserAnswers}
            examResult={examResult}
            onRetake={handleRetakeExam}
            onBackToCatalog={handleBackToCatalog}
          />
          <Footer />
        </div>
      ) : (
        /* 3. Main Catalog / Builder Dashboard */
        <div className="flex-1 flex flex-col pb-16 md:pb-0">
          <Header
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            openLeaderboardModal={() => setLeaderboardOpen(true)}
            openSidebar={() => setSidebarOpen(true)}
          />

          <main className="flex-1">
            {activeTab === 'catalog' && (
              <CatalogView
                onStartExam={handleStartExam}
                onPreviewExam={(item) => setPreviewExam(item)}
              />
            )}

            {activeTab === 'custom' && (
              <CustomMcqCreator onStartCustomExam={handleStartExam} />
            )}
          </main>

          <Footer />

          {/* Mobile Bottom Navigation Bar */}
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            openLeaderboardModal={() => setLeaderboardOpen(true)}
          />
        </div>
      )}

      {/* Modals & AI Studio Sidebar Console */}
      {previewExam && (
        <PreviewModal
          examItem={previewExam}
          onClose={() => setPreviewExam(null)}
          onStartExam={(exam) => {
            setPreviewExam(null);
            handleStartExam(exam);
          }}
        />
      )}

      <LeaderboardModal
        isOpen={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openLeaderboardModal={() => setLeaderboardOpen(true)}
      />

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
};

export default App;
