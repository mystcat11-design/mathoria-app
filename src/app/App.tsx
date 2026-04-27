import { useState, useEffect } from 'react';
import { QuizInterface } from './components/QuizInterface';
import { EssayQuizInterface } from './components/EssayQuizInterface';
import { Leaderboard } from './components/Leaderboard';
import { Dashboard } from './components/Dashboard';
import { LoginScreen } from './components/LoginScreen';
import { AchievementNotification } from './components/AchievementNotification';
import { TutorialModal } from './components/TutorialModal';
import { Profile } from './components/Profile';
import { TeacherDashboard } from './components/TeacherDashboard';
import { Trophy, Home, User, HelpCircle } from 'lucide-react';
import { checkBadges } from './utils/badgeChecker';
import { questionBank, Question } from './utils/irtEngine';
import * as supabaseClient from './utils/supabaseClient';
import { toast } from 'sonner@2.0.3';
import { Toaster } from './components/ui/sonner';

export interface Student {
  id: string;
  name: string;
  totalScore: number;
  testsCompleted: number;
  averageAbility: number;
  badges: string[];
  lastActive: string;
  completedLevels: number[];
  profilePhoto?: string;
  coverPhoto?: string;
  bio?: string;
  xp?: number;
  level?: number;
  hintsUsed?: number;
  correctAnswersByTopic?: {
    Eksponen: number;
    Logaritma: number;
    SPLDV: number;
    SPLTV: number;
    SPtLDV: number;
  };
  topicAnswerCounts?: {
    Eksponen: number;
    Logaritma: number;
    SPLDV: number;
    SPLTV: number;
    SPtLDV: number;
  };
  highestScore?: number;
  hardQuestionCorrect?: number;
  totalQuestionsAnswered?: number;
  totalCorrectAnswers?: number;
  currentStreak?: number;
  bestStreak?: number;
  triedLevels?: number[];
  perfectLevels?: number[];
  highLevelAttempts?: number;
  scoreHistory?: {
    date: string;
    score: number;
    level: number;
  }[];
  abilityHistory?: {
    date: string;
    ability: number;
  }[];
}

export interface QuizResult {
  studentId: string;
  score: number;
  ability: number;
  correctAnswers: number;
  totalQuestions: number;
  timestamp: string;
  level: number;
  xpEarned?: number;
  hintsUsed?: number;
  answerDetails?: {
    questionId: string;
    topic: string;
    pisaLevel: number;
    isCorrect: boolean;
  }[];
}

export default function App() {
  console.log('🔄 APP LOADED - FRESH BUILD');

  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'quiz' | 'leaderboard' | 'profile'>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isTeacherMode, setIsTeacherMode] = useState(false);
  const [questions, setQuestions] = useState<Question[]>(questionBank);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedStudents = localStorage.getItem('mathIRT_students');
        if (savedStudents) {
          const parsedStudents = JSON.parse(savedStudents).map((s: Student) => ({
            ...s,
            completedLevels: s.completedLevels || []
          }));
          setStudents(parsedStudents);
        }

        const savedCurrentStudent = localStorage.getItem('mathIRT_currentStudent');
        if (savedCurrentStudent) {
          const parsedStudent = JSON.parse(savedCurrentStudent);
          setCurrentStudent({
            ...parsedStudent,
            completedLevels: parsedStudent.completedLevels || []
          });
        }

        const savedQuestions = localStorage.getItem('mathIRT_questions');
        if (savedQuestions) {
          setQuestions(JSON.parse(savedQuestions));
        } else {
          setQuestions(questionBank);
          localStorage.setItem('mathIRT_questions', JSON.stringify(questionBank));
        }

        try {
          const cloudData = await supabaseClient.syncCloudToLocal();

          if (cloudData.students.length > 0) {
            setStudents(cloudData.students);
          }

          if (cloudData.questions.length > 0) {
            setQuestions(cloudData.questions);
          } else if (questions.length > 0) {
            await supabaseClient.saveQuestions(questionBank);
          }
        } catch (syncError) {
          // Cloud sync failed - continue with local data
        }
        
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Terjadi kesalahan saat memuat data.');
      }
      
      setTimeout(() => setIsLoading(false), 200);
    };
    
    loadData();
  }, []);

  useEffect(() => {
    if (currentStudent) {
      const tutorialKey = `mathIRT_tutorial_${currentStudent.id}`;
      const hasSeenTutorial = localStorage.getItem(tutorialKey);
      
      if (!hasSeenTutorial) {
        const timer = setTimeout(() => setShowTutorial(true), 500);
        return () => clearTimeout(timer);
      }
    }
  }, [currentStudent]);

  const handleCloseTutorial = () => {
    if (currentStudent) {
      const tutorialKey = `mathIRT_tutorial_${currentStudent.id}`;
      localStorage.setItem(tutorialKey, 'true');
    }
    setShowTutorial(false);
  };

  const handleLogin = (name: string) => {
    if (name.toLowerCase() === 'saya guru') {
      setIsTeacherMode(true);
      const teacherUser: Student = {
        id: 'teacher',
        name: 'Saya Guru',
        totalScore: 0,
        testsCompleted: 0,
        averageAbility: 0,
        badges: [],
        lastActive: new Date().toISOString(),
        completedLevels: []
      };
      setCurrentStudent(teacherUser);
      return;
    }
    
    const existingStudent = students.find(s => s.name.toLowerCase() === name.toLowerCase());
    
    if (existingStudent) {
      const updatedStudent = { 
        ...existingStudent, 
        lastActive: new Date().toISOString(),
        completedLevels: existingStudent.completedLevels || []
      };
      setCurrentStudent(updatedStudent);
      localStorage.setItem('mathIRT_currentStudent', JSON.stringify(updatedStudent));
      
      const updatedStudents = students.map(s => 
        s.id === existingStudent.id ? updatedStudent : s
      );
      setStudents(updatedStudents);
      localStorage.setItem('mathIRT_students', JSON.stringify(updatedStudents));
      
      supabaseClient.saveStudent(updatedStudent);
    } else {
      const newStudent: Student = {
        id: Date.now().toString(),
        name,
        totalScore: 0,
        testsCompleted: 0,
        averageAbility: 0,
        badges: [],
        lastActive: new Date().toISOString(),
        completedLevels: [],
        xp: 0,
        level: 1,
        hintsUsed: 0,
        scoreHistory: [],
        abilityHistory: [],
        correctAnswersByTopic: {
          Eksponen: 0,
          Logaritma: 0,
          SPLDV: 0,
          SPLTV: 0,
          SPtLDV: 0
        },
        topicAnswerCounts: {
          Eksponen: 0,
          Logaritma: 0,
          SPLDV: 0,
          SPLTV: 0,
          SPtLDV: 0
        },
        highestScore: 0,
        hardQuestionCorrect: 0,
        totalQuestionsAnswered: 0,
        totalCorrectAnswers: 0,
        currentStreak: 0,
        bestStreak: 0,
        triedLevels: [],
        perfectLevels: [],
        highLevelAttempts: 0
      };
      
      setCurrentStudent(newStudent);
      const updatedStudents = [...students, newStudent];
      setStudents(updatedStudents);
      
      localStorage.setItem('mathIRT_currentStudent', JSON.stringify(newStudent));
      localStorage.setItem('mathIRT_students', JSON.stringify(updatedStudents));
      
      supabaseClient.saveStudent(newStudent);
    }
  };

  const handleQuizComplete = (result: QuizResult) => {
    console.log('✅ QUIZ COMPLETE - MINIMAL VERSION');

    if (!currentStudent) {
      console.log('No student, going to dashboard');
      setActiveView('dashboard');
      setSelectedLevel(null);
      return;
    }

    console.log('Student:', currentStudent.name, 'Level:', result.level);

    let completedLevels = [];
    try {
      completedLevels = Array.isArray(currentStudent.completedLevels)
        ? [...currentStudent.completedLevels]
        : [];
    } catch (e) {
      console.error('Error with completedLevels:', e);
      completedLevels = [];
    }

    if (result.level && result.level > 0 && !completedLevels.includes(result.level)) {
      completedLevels.push(result.level);
      console.log('Added level', result.level, 'New array:', completedLevels);
    }

    // Check for badges with proper parameters
    const badgeResult = checkBadges(currentStudent, result, completedLevels);
    console.log('Badge check result:', badgeResult.earnedBadges);

    // Calculate new XP and level
    const newXP = (currentStudent.xp || 0) + (result.xpEarned || 0);
    const newLevel = Math.floor(newXP / 100) + 1; // 100 XP per level

    // Update topic/chapter statistics
    const updatedCorrectByTopic = { ...(currentStudent.correctAnswersByTopic || {}) };
    const updatedAnswerCounts = { ...(currentStudent.topicAnswerCounts || {}) };

    if (result.answerDetails) {
      result.answerDetails.forEach(detail => {
        const topicKey = detail.topic || 'Lainnya';

        // Initialize if not exists
        if (!updatedAnswerCounts[topicKey]) updatedAnswerCounts[topicKey] = 0;
        if (!updatedCorrectByTopic[topicKey]) updatedCorrectByTopic[topicKey] = 0;

        // Increment counters
        updatedAnswerCounts[topicKey]++;
        if (detail.isCorrect) {
          updatedCorrectByTopic[topicKey]++;
        }
      });
    }

    const updatedStudent = {
      ...currentStudent,
      completedLevels: completedLevels,
      totalScore: (currentStudent.totalScore || 0) + (result.score || 0),
      testsCompleted: (currentStudent.testsCompleted || 0) + 1,
      averageAbility: result.ability || currentStudent.averageAbility || 0,
      xp: newXP,
      level: newLevel,
      correctAnswersByTopic: updatedCorrectByTopic,
      topicAnswerCounts: updatedAnswerCounts,
      badges: [...currentStudent.badges, ...badgeResult.earnedBadges],
      ...badgeResult.updatedStats,
      lastActive: new Date().toISOString()
    };

    console.log('Saving with completedLevels:', updatedStudent.completedLevels);
    console.log('New badges:', badgeResult.earnedBadges);

    try {
      setCurrentStudent(updatedStudent);

      const updatedStudents = students.map(s =>
        s.id === currentStudent.id ? updatedStudent : s
      );
      setStudents(updatedStudents);

      localStorage.setItem('mathIRT_currentStudent', JSON.stringify(updatedStudent));
      localStorage.setItem('mathIRT_students', JSON.stringify(updatedStudents));

      // Show badge notifications
      if (badgeResult.earnedBadges.length > 0) {
        setNewBadges(badgeResult.earnedBadges);
      }

      console.log('Saved successfully!');
    } catch (saveError) {
      console.error('Save error:', saveError);
    }

    console.log('Navigating to dashboard...');
    setActiveView('dashboard');
    setSelectedLevel(null);
    console.log('Done!');
  };

  const handleLogout = () => {
    setCurrentStudent(null);
    setIsTeacherMode(false);
    localStorage.removeItem('mathIRT_currentStudent');
    setActiveView('dashboard');
  };

  const handleDeleteAccount = async () => {
    if (!currentStudent) return;
    
    const confirmText = `HAPUS ${currentStudent.name}`;
    const userInput = prompt(
      `⚠️ PERINGATAN: Tindakan ini akan menghapus akun Anda secara permanen!\n\n` +
      `Semua data termasuk:\n` +
      `• Progres dan skor (${currentStudent.testsCompleted} tes)\n` +
      `• ${currentStudent.badges.length} badge yang telah diraih\n` +
      `• ${currentStudent.completedLevels.length} level yang diselesaikan\n` +
      `• Semua essay yang pernah dikumpulkan\n\n` +
      `Ketik "${confirmText}" untuk mengkonfirmasi:`
    );
    
    if (userInput !== confirmText) {
      if (userInput !== null) {
        toast.error('Penghapusan akun dibatalkan. Teks konfirmasi tidak sesuai.');
      }
      return;
    }
    
    try {
      try {
        await supabaseClient.deleteStudent(currentStudent.id);
        console.log('✅ Account deleted from cloud');
      } catch (cloudError) {
        console.warn('⚠️ Could not delete from cloud, deleting locally only:', cloudError);
      }
      
      const allStudents = students.filter(s => s.id !== currentStudent.id);
      setStudents(allStudents);
      localStorage.setItem('mathIRT_students', JSON.stringify(allStudents));
      localStorage.removeItem('mathIRT_currentStudent');
      
      setCurrentStudent(null);
      setActiveView('dashboard');
      
      toast.success('Akun berhasil dihapus. Terima kasih telah menggunakan Mathoria!');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Terjadi kesalahan saat menghapus akun.');
    }
  };

  const handleUpdateQuestions = (updatedQuestions: Question[]) => {
    setQuestions(updatedQuestions);
    localStorage.setItem('mathIRT_questions', JSON.stringify(updatedQuestions));
    supabaseClient.saveQuestions(updatedQuestions);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 font-medium">Memuat Mathoria...</p>
        </div>
      </div>
    );
  }

  if (!currentStudent) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (isTeacherMode) {
    return (
      <TeacherDashboard
        students={students}
        onLogout={handleLogout}
        questions={questions}
        onUpdateQuestions={handleUpdateQuestions}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Toaster position="top-right" richColors />
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Mathoria</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Halo, <span className="font-semibold text-gray-900">{currentStudent.name}</span></span>
              <button
                onClick={() => setShowTutorial(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                title="Lihat Panduan"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Panduan</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${
                activeView === 'dashboard'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <Home className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveView('leaderboard')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${
                activeView === 'leaderboard'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <Trophy className="w-4 h-4" />
              Leaderboard
            </button>
            <button
              onClick={() => setActiveView('profile')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${
                activeView === 'profile'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <User className="w-4 h-4" />
              Profil
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'dashboard' && (
          <Dashboard 
            student={currentStudent} 
            onStartQuiz={(level: number) => {
              setSelectedLevel(level);
              setActiveView('quiz');
            }}
          />
        )}
        {activeView === 'quiz' && selectedLevel !== null && (() => {
          const filteredQuestions = questions.filter(q => q.pisaLevel === selectedLevel);

          if (filteredQuestions.length === 0) {
            return (
              <div className="bg-white rounded-xl p-8 shadow-md text-center">
                <p className="text-red-600 font-semibold mb-2">⚠️ Tidak ada soal untuk Level {selectedLevel}</p>
                <p className="text-gray-600 mb-4">Silakan hubungi guru untuk menambahkan soal.</p>
                <button
                  onClick={() => {
                    setActiveView('dashboard');
                    setSelectedLevel(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Kembali ke Dashboard
                </button>
              </div>
            );
          }

          return selectedLevel === 6 ? (
            <EssayQuizInterface
              student={currentStudent}
              selectedLevel={selectedLevel}
              onComplete={(result) => {
                handleQuizComplete(result);
                toast.success('Jawaban Level 6 telah dikirim untuk direview guru!');
              }}
              onCancel={() => {
                setActiveView('dashboard');
                setSelectedLevel(null);
              }}
              questions={filteredQuestions}
            />
          ) : (
            <QuizInterface
              student={currentStudent}
              selectedLevel={selectedLevel}
              onComplete={handleQuizComplete}
              onCancel={() => {
                setActiveView('dashboard');
                setSelectedLevel(null);
              }}
              questions={filteredQuestions}
            />
          );
        })()}
        {activeView === 'leaderboard' && (
          <Leaderboard 
            students={students}
            currentStudentId={currentStudent.id}
          />
        )}
        {activeView === 'profile' && (
          <Profile 
            student={currentStudent}
            onUpdateProfile={(updates) => {
              const updatedStudent = { ...currentStudent, ...updates };
              setCurrentStudent(updatedStudent);
              
              const updatedStudents = students.map(s => 
                s.id === currentStudent.id ? updatedStudent : s
              );
              setStudents(updatedStudents);
              
              localStorage.setItem('mathIRT_currentStudent', JSON.stringify(updatedStudent));
              localStorage.setItem('mathIRT_students', JSON.stringify(updatedStudents));
              
              supabaseClient.saveStudent(updatedStudent);
            }}
            onDeleteAccount={handleDeleteAccount}
          />
        )}
      </main>

      {newBadges.length > 0 && (
        <AchievementNotification 
          badges={newBadges}
          onClose={() => setNewBadges([])}
        />
      )}

      {showTutorial && (
        <TutorialModal 
          onClose={handleCloseTutorial}
        />
      )}
    </div>
  );
}
