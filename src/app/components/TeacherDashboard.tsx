import { useState, useMemo } from 'react';
import * as React from 'react';
import { Student } from '../App';
import { Users, TrendingUp, Award, BookOpen, BarChart3, Activity, Trophy, Star, ChevronDown, ChevronUp, X, Download, Upload, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getBadgeInfo, BADGE_ORDER, BADGE_INFO } from '../utils/badgeInfo';
import { Question } from '../utils/irtEngine';
import { QuestionBankEditor } from './QuestionBankEditor';
import { EssayReviewPanel } from './EssayReviewPanel';
import { ErrorBoundary } from './ErrorBoundary';
import { chapters } from '../utils/chapterConfig';
import { BadgeManager, CustomBadge } from './BadgeManager';
import { toast } from 'sonner';

interface TeacherDashboardProps {
  students: Student[];
  onLogout: () => void;
  questions: Question[];
  onUpdateQuestions: (questions: Question[]) => void;
}

export function TeacherDashboard({ students, onLogout, questions, onUpdateQuestions }: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'essays' | 'questions'>('overview');
  const [sortField, setSortField] = useState<'name' | 'theta' | 'score' | 'level' | 'badges'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [editingBadgesStudent, setEditingBadgesStudent] = useState<Student | null>(null);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [showBadgeManager, setShowBadgeManager] = useState(false);
  const [customBadges, setCustomBadges] = useState<CustomBadge[]>([]);

  React.useEffect(() => {
    const saved = localStorage.getItem('mathIRT_customBadges');
    if (saved) {
      setCustomBadges(JSON.parse(saved));
    }
  }, []);

  const handleRefreshTheta = () => {
    const confirmed = window.confirm(
      'Refresh nilai Theta (θ) untuk semua siswa?\n\n' +
      'Ini akan:\n' +
      '• Menggunakan nilai theta dari riwayat quiz siswa\n' +
      '• Memberikan nilai default (0.5) untuk siswa yang belum pernah quiz\n' +
      '• Tidak menghapus data apapun\n\n' +
      'Lanjutkan?'
    );

    if (confirmed) {
      const savedStudents = localStorage.getItem('mathIRT_students');
      if (savedStudents) {
        const studentsList: Student[] = JSON.parse(savedStudents);

        const updatedStudents = studentsList.map(student => {
          let newTheta = student.averageAbility;

          if (newTheta === 0 && student.abilityHistory && student.abilityHistory.length > 0) {
            newTheta = student.abilityHistory[student.abilityHistory.length - 1].ability;
          } else if (newTheta === 0 && student.testsCompleted > 0) {
            newTheta = 0.5;
          }

          return {
            ...student,
            averageAbility: newTheta
          };
        });

        localStorage.setItem('mathIRT_students', JSON.stringify(updatedStudents));
        window.location.reload();
      }
    }
  };

  const handleEditBadges = (student: Student) => {
    setEditingBadgesStudent(student);
    setSelectedBadges([...student.badges]);
  };

  const handleSaveBadges = () => {
    if (!editingBadgesStudent) return;

    const savedStudents = localStorage.getItem('mathIRT_students');
    if (savedStudents) {
      const studentsList: Student[] = JSON.parse(savedStudents);

      const updatedStudents = studentsList.map(s =>
        s.id === editingBadgesStudent.id
          ? { ...s, badges: selectedBadges }
          : s
      );

      localStorage.setItem('mathIRT_students', JSON.stringify(updatedStudents));

      const updatedStudent = updatedStudents.find(s => s.id === editingBadgesStudent.id);
      if (updatedStudent) {
        import('../utils/supabaseClient').then(({ updateStudent }) => {
          updateStudent(updatedStudent.id, { badges: selectedBadges });
        });
      }

      window.location.reload();
    }
  };

  const toggleBadge = (badgeName: string) => {
    if (selectedBadges.includes(badgeName)) {
      setSelectedBadges(selectedBadges.filter(b => b !== badgeName));
    } else {
      setSelectedBadges([...selectedBadges, badgeName]);
    }
  };

  const getBadgeInfoWithCustom = (badgeName: string) => {
    const customBadge = customBadges.find(b => b.name === badgeName);
    if (customBadge) {
      return customBadge;
    }
    return getBadgeInfo(badgeName);
  };

  // Export ALL data to JSON file
  const handleExportData = () => {
    try {
      const studentsData = localStorage.getItem('mathIRT_students') || '[]';
      const questionsData = localStorage.getItem('mathIRT_questions') || '[]';
      const essaysData = localStorage.getItem('mathIRT_essays') || '[]';
      const customBadgesData = localStorage.getItem('mathIRT_customBadges') || '[]';

      const exportData = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        students: JSON.parse(studentsData),
        questions: JSON.parse(questionsData),
        essays: JSON.parse(essaysData),
        customBadges: JSON.parse(customBadgesData)
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mathIRT_backup_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(`✅ Data berhasil di-export!\n${exportData.students.length} siswa, ${exportData.questions.length} soal, ${exportData.essays.length} essay`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('❌ Gagal export data: ' + error);
    }
  };

  // Import data from JSON file - supports both old and new format
  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const rawData = JSON.parse(event.target?.result as string);

          // Detect and normalize format
          let normalizedData: any = {};

          // OLD FORMAT: has "timestamp" and stringified data
          if (rawData.timestamp && typeof rawData.students === 'string') {
            console.log('📦 Detected OLD backup format - converting...');
            normalizedData = {
              exportedAt: rawData.timestamp,
              version: '1.0-legacy',
              students: rawData.students ? JSON.parse(rawData.students) : [],
              questions: rawData.questions ? JSON.parse(rawData.questions) : [],
              essays: [],
              customBadges: []
            };
          }
          // NEW FORMAT: has "exportedAt" and array data
          else {
            console.log('📦 Detected NEW backup format');
            normalizedData = rawData;
          }

          const studentsCount = normalizedData.students?.length || 0;
          const questionsCount = normalizedData.questions?.length || 0;
          const essaysCount = normalizedData.essays?.length || 0;
          const badgesCount = normalizedData.customBadges?.length || 0;

          const confirmed = window.confirm(
            `Import data backup?\n\n` +
            `File: ${file.name}\n` +
            `Backup date: ${new Date(normalizedData.exportedAt).toLocaleString('id-ID')}\n\n` +
            `Data yang akan di-import:\n` +
            `• ${studentsCount} siswa\n` +
            `• ${questionsCount} soal\n` +
            `• ${essaysCount} essay\n` +
            `• ${badgesCount} custom badges\n\n` +
            `⚠️ PERINGATAN: Data saat ini akan DIGABUNG dengan data import.\n` +
            `Data yang sudah ada TIDAK AKAN DIHAPUS.\n\n` +
            `Lanjutkan?`
          );

          if (!confirmed) return;

          let importedCounts = { students: 0, questions: 0, essays: 0, badges: 0 };

          // Merge with existing data (don't overwrite)
          if (normalizedData.students && Array.isArray(normalizedData.students)) {
            const existing = JSON.parse(localStorage.getItem('mathIRT_students') || '[]');
            const existingIds = new Set(existing.map((s: Student) => s.id));
            const newStudents = normalizedData.students.filter((s: Student) => !existingIds.has(s.id));
            const merged = [...existing, ...newStudents];
            localStorage.setItem('mathIRT_students', JSON.stringify(merged));
            importedCounts.students = newStudents.length;
            console.log(`✅ Imported ${newStudents.length} new students (${existing.length} already existed)`);
          }

          if (normalizedData.questions && Array.isArray(normalizedData.questions)) {
            const existing = JSON.parse(localStorage.getItem('mathIRT_questions') || '[]');
            const existingIds = new Set(existing.map((q: Question) => q.id));
            const newQuestions = normalizedData.questions.filter((q: Question) => !existingIds.has(q.id));
            const merged = [...existing, ...newQuestions];
            localStorage.setItem('mathIRT_questions', JSON.stringify(merged));
            importedCounts.questions = newQuestions.length;
            console.log(`✅ Imported ${newQuestions.length} new questions (${existing.length} already existed)`);
          }

          if (normalizedData.essays && Array.isArray(normalizedData.essays)) {
            const existing = JSON.parse(localStorage.getItem('mathIRT_essays') || '[]');
            const existingIds = new Set(existing.map((e: any) => e.id));
            const newEssays = normalizedData.essays.filter((e: any) => !existingIds.has(e.id));
            const merged = [...existing, ...newEssays];
            localStorage.setItem('mathIRT_essays', JSON.stringify(merged));
            importedCounts.essays = newEssays.length;
            console.log(`✅ Imported ${newEssays.length} new essays (${existing.length} already existed)`);
          }

          if (normalizedData.customBadges && Array.isArray(normalizedData.customBadges)) {
            const existing = JSON.parse(localStorage.getItem('mathIRT_customBadges') || '[]');
            const existingNames = new Set(existing.map((b: CustomBadge) => b.name));
            const newBadges = normalizedData.customBadges.filter((b: CustomBadge) => !existingNames.has(b.name));
            const merged = [...existing, ...newBadges];
            localStorage.setItem('mathIRT_customBadges', JSON.stringify(merged));
            importedCounts.badges = newBadges.length;
            console.log(`✅ Imported ${newBadges.length} new badges (${existing.length} already existed)`);
          }

          toast.success(
            `✅ Import berhasil!\n` +
            `${importedCounts.students} siswa, ${importedCounts.questions} soal, ` +
            `${importedCounts.essays} essay, ${importedCounts.badges} badges baru ditambahkan.\n` +
            `Halaman akan di-refresh...`
          );
          setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
          console.error('❌ Import error:', error);
          toast.error('❌ Gagal import data: ' + error);
        }
      };

      reader.readAsText(file);
    };

    input.click();
  };

  const stats = useMemo(() => {
    const totalStudents = students.length;
    const avgTheta = students.reduce((sum, s) => sum + s.averageAbility, 0) / totalStudents || 0;
    const totalTests = students.reduce((sum, s) => sum + s.testsCompleted, 0);
    const totalBadges = students.reduce((sum, s) => sum + s.badges.length, 0);

    return {
      totalStudents,
      avgTheta: avgTheta.toFixed(2),
      totalTests,
      totalBadges,
      avgTestsPerStudent: (totalTests / totalStudents || 0).toFixed(1)
    };
  }, [students]);

  const thetaDistribution = useMemo(() => {
    const ranges = [
      { range: '< -3.0', min: -Infinity, max: -3.0, count: 0 },
      { range: '-3.0 to -2.5', min: -3.0, max: -2.5, count: 0 },
      { range: '-2.5 to -2.0', min: -2.5, max: -2.0, count: 0 },
      { range: '-2.0 to -1.5', min: -2.0, max: -1.5, count: 0 },
      { range: '-1.5 to -1.0', min: -1.5, max: -1.0, count: 0 },
      { range: '-1.0 to -0.5', min: -1.0, max: -0.5, count: 0 },
      { range: '-0.5 to 0', min: -0.5, max: 0, count: 0 },
      { range: '0 to 0.5', min: 0, max: 0.5, count: 0 },
      { range: '0.5 to 1.0', min: 0.5, max: 1.0, count: 0 },
      { range: '1.0 to 1.5', min: 1.0, max: 1.5, count: 0 },
      { range: '1.5 to 2.0', min: 1.5, max: 2.0, count: 0 },
      { range: '2.0 to 2.5', min: 2.0, max: 2.5, count: 0 },
      { range: '2.5 to 3.0', min: 2.5, max: 3.0, count: 0 },
      { range: '> 3.0', min: 3.0, max: Infinity, count: 0 }
    ];

    students.forEach(student => {
      const theta = student.averageAbility;
      const range = ranges.find(r => theta >= r.min && theta < r.max);
      if (range) range.count++;
    });

    return ranges.map((r, idx) => ({ id: `theta-${idx}`, name: r.range, siswa: r.count }));
  }, [students]);

  const levelCompletion = useMemo(() => {
    const levels = [1, 2, 3, 4, 5, 6];
    return levels.map(level => ({
      id: `level-${level}`,
      level: `Level ${level}`,
      completed: students.filter(s => s.completedLevels?.includes(level)).length,
      total: students.length
    }));
  }, [students]);

  const badgeDistribution = useMemo(() => {
    const badgeCounts: Record<string, number> = {};
    students.forEach(student => {
      student.badges.forEach(badge => {
        badgeCounts[badge] = (badgeCounts[badge] || 0) + 1;
      });
    });

    return Object.entries(badgeCounts)
      .map(([name, count], index) => ({ id: `badge-${index}`, name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [students]);

  const topPerformers = useMemo(() => {
    return [...students]
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 5);
  }, [students]);

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'theta':
          aVal = a.averageAbility;
          bVal = b.averageAbility;
          break;
        case 'score':
          aVal = a.totalScore;
          bVal = b.totalScore;
          break;
        case 'level':
          aVal = Math.max(...(a.completedLevels || [0]));
          bVal = Math.max(...(b.completedLevels || [0]));
          break;
        case 'badges':
          aVal = a.badges.length;
          bVal = b.badges.length;
          break;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [students, sortField, sortOrder]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dashboard Guru</h1>
                <p className="text-xs text-gray-500">Mathoria Management System</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg">
                <Trophy className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-semibold text-purple-700">Guru</span>
              </div>

              {/* Data Backup Controls */}
              <button
                onClick={handleExportData}
                className="px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium flex items-center gap-2"
                title="Export semua data (siswa, soal, essay) ke file JSON"
              >
                <Download className="w-4 h-4" />
                Backup Data
              </button>
              <button
                onClick={handleImportData}
                className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium flex items-center gap-2"
                title="Import data dari file JSON backup"
              >
                <Upload className="w-4 h-4" />
                Restore Data
              </button>

              <button
                onClick={() => setShowBadgeManager(true)}
                className="px-4 py-2 text-sm bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors font-medium flex items-center gap-2"
                title="Kelola badge custom"
              >
                <Award className="w-4 h-4" />
                Kelola Badge
              </button>
              <button
                onClick={handleRefreshTheta}
                className="px-4 py-2 text-sm bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors font-medium"
                title="Refresh nilai theta untuk semua siswa"
              >
                Refresh Theta
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Siswa</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rata-rata θ</p>
                <p className="text-3xl font-bold text-gray-900">{stats.avgTheta}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tes</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalTests}</p>
              </div>
              <BookOpen className="w-10 h-10 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Badge</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalBadges}</p>
              </div>
              <Award className="w-10 h-10 text-amber-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Tes/Siswa</p>
                <p className="text-3xl font-bold text-gray-900">{stats.avgTestsPerStudent}</p>
              </div>
              <Activity className="w-10 h-10 text-indigo-500" />
            </div>
          </div>
        </div>

        {/* Data Warning Banner */}
        {(students.length === 0 || questions.length === 0) && (
          <div className="mb-6 bg-orange-50 border-2 border-orange-300 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-orange-900 mb-2">⚠️ Peringatan: Data Kosong atau Minimal</h3>
                <p className="text-sm text-orange-800 mb-3">
                  {students.length === 0 && questions.length === 0 && "Tidak ada data siswa dan soal. "}
                  {students.length === 0 && questions.length > 0 && "Tidak ada data siswa. "}
                  {students.length > 0 && questions.length === 0 && "Tidak ada data soal. "}
                  Untuk mencegah kehilangan data:
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExportData}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Backup Data Sekarang
                  </button>
                  {students.length === 0 || questions.length === 0 ? (
                    <button
                      onClick={handleImportData}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Restore dari Backup
                    </button>
                  ) : null}
                  <span className="text-xs text-orange-700">
                    💡 Backup data secara berkala untuk keamanan maksimal
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Status Info - when data exists */}
        {students.length > 0 && questions.length > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-900">
                  📊 Data tersimpan: <strong>{students.length} siswa</strong>, <strong>{questions.length} soal</strong>
                </span>
              </div>
              <button
                onClick={handleExportData}
                className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs font-medium flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                Backup Sekarang
              </button>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-semibold ${
                activeTab === 'overview' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
              } rounded-lg transition-colors`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('essays')}
              className={`px-4 py-2 text-sm font-semibold ${
                activeTab === 'essays' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
              } rounded-lg transition-colors`}
            >
              Review Esai
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-4 py-2 text-sm font-semibold ${
                activeTab === 'questions' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
              } rounded-lg transition-colors`}
            >
              Bank Soal
            </button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <h2 className="font-bold text-gray-900">Distribusi Kemampuan (θ)</h2>
                </div>
                {students.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={thetaDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        label={{ value: 'Rentang Kemampuan (θ)', position: 'insideBottom', offset: -5, style: { fontSize: 12, fontWeight: 'bold' } }}
                      />
                      <YAxis
                        allowDecimals={false}
                        label={{ value: 'Jumlah Siswa', angle: -90, position: 'insideLeft', style: { fontSize: 12, fontWeight: 'bold' } }}
                      />
                      <Tooltip />
                      <Bar dataKey="siswa" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-400">
                    <p>Belum ada data siswa</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h2 className="font-bold text-gray-900">Progress per Level</h2>
                </div>
                {students.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={levelCompletion}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="level"
                        label={{ value: 'Level PISA', position: 'insideBottom', offset: -5, style: { fontSize: 12, fontWeight: 'bold' } }}
                      />
                      <YAxis
                        allowDecimals={false}
                        label={{ value: 'Jumlah Siswa yang Menyelesaikan', angle: -90, position: 'insideLeft', style: { fontSize: 12, fontWeight: 'bold' } }}
                      />
                      <Tooltip />
                      <Bar dataKey="completed" fill="#10B981" name="Selesai" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-400">
                    <p>Belum ada data siswa</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-amber-600" />
                  <h2 className="font-bold text-gray-900">Top 5 Performers</h2>
                </div>
                {topPerformers.length > 0 ? (
                  <div className="space-y-3">
                    {topPerformers.map((student, idx) => (
                      <div key={student.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-blue-500'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-600">θ: {student.averageAbility.toFixed(2)} | Badge: {student.badges.length}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">{student.totalScore}</p>
                          <p className="text-xs text-gray-500">poin</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-400">
                    <p>Belum ada data siswa</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-purple-600" />
                  <h2 className="font-bold text-gray-900">Top 10 Badge</h2>
                </div>
                {badgeDistribution.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                          <th className="px-4 py-3 text-left text-sm font-semibold w-16">Rank</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Nama Badge</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold w-32">Penerima</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {badgeDistribution.map((badge, index) => {
                          const badgeInfo = getBadgeInfoWithCustom(badge.name);
                          const totalStudents = students.length;
                          const isTopThree = index < 3;

                          return (
                            <tr
                              key={badge.id}
                              className={`transition-colors hover:bg-purple-50 ${
                                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                              }`}
                            >
                              <td className="px-4 py-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                  isTopThree
                                    ? index === 0
                                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg'
                                      : index === 1
                                      ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-md'
                                      : 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {index + 1}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">{badgeInfo.icon}</span>
                                  <div>
                                    <p className="font-semibold text-gray-900">{badge.name}</p>
                                    <p className="text-xs text-gray-500">{badgeInfo.description}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 border-2 border-purple-300 font-bold text-purple-700">
                                    {badge.count}/{totalStudents}
                                  </span>
                                  <span className="text-xs text-gray-500">siswa</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Belum ada badge yang diraih</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <h2 className="font-bold text-gray-900">Monitoring Siswa ({students.length})</h2>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        No
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          Nama Siswa
                          <SortIcon field="name" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('theta')}
                      >
                        <div className="flex items-center gap-1">
                          Kemampuan (θ)
                          <SortIcon field="theta" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('score')}
                      >
                        <div className="flex items-center gap-1">
                          Total Skor
                          <SortIcon field="score" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('level')}
                      >
                        <div className="flex items-center gap-1">
                          Level Tertinggi
                          <SortIcon field="level" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('badges')}
                      >
                        <div className="flex items-center gap-1">
                          Badge
                          <SortIcon field="badges" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Total Soal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Detail
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedStudents.map((student, idx) => (
                      <React.Fragment key={student.id}>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {idx + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {student.profilePhoto ? (
                                <img
                                  src={student.profilePhoto}
                                  alt={student.name}
                                  className="w-8 h-8 rounded-full object-cover border-2 border-blue-200"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                                  {student.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-gray-900">{student.name}</p>
                                <p className="text-xs text-gray-500">{student.testsCompleted} tes selesai</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              student.averageAbility > 1 ? 'bg-green-100 text-green-800' :
                              student.averageAbility > 0 ? 'bg-blue-100 text-blue-800' :
                              student.averageAbility > -1 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {student.averageAbility.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                            {student.totalScore}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                              Level {Math.max(...(student.completedLevels || [0]))}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Award className="w-4 h-4 text-amber-500" />
                              <span className="font-semibold text-gray-900">{student.badges.length}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {student.totalQuestionsAnswered || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              {expandedStudent === student.id ? 'Tutup' : 'Lihat'}
                            </button>
                          </td>
                        </tr>
                        {expandedStudent === student.id && (
                          <tr>
                            <td colSpan={8} className="px-6 py-4 bg-gray-50">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-2">Level Selesai</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {[1, 2, 3, 4, 5, 6].map(level => (
                                      <span
                                        key={level}
                                        className={`px-2 py-1 rounded text-xs font-medium ${
                                          student.completedLevels?.includes(level)
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-200 text-gray-500'
                                        }`}
                                      >
                                        L{level}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-2">Akurasi per Bab</h4>
                                  <div className="space-y-1 text-xs">
                                    {student.correctAnswersByTopic && student.topicAnswerCounts && (
                                      <>
                                        {chapters.map(chapter => {
                                          let totalCorrect = 0;
                                          let totalAnswered = 0;

                                          const allTopicKeys = Object.keys(student.topicAnswerCounts || {});
                                          allTopicKeys.forEach(topicKey => {
                                            const topicLower = topicKey.toLowerCase();
                                            const chapterIdLower = chapter.id;
                                            const isMatch = topicKey === chapter.name ||
                                                           topicLower.includes(chapterIdLower) ||
                                                           chapter.topics.includes(topicKey);

                                            if (isMatch) {
                                              totalCorrect += student.correctAnswersByTopic?.[topicKey as keyof typeof student.correctAnswersByTopic] || 0;
                                              totalAnswered += student.topicAnswerCounts?.[topicKey as keyof typeof student.topicAnswerCounts] || 0;
                                            }
                                          });

                                          if (totalAnswered === 0) return null;

                                          const percentage = totalAnswered > 0 ? ((totalCorrect / totalAnswered) * 100).toFixed(0) : '0';

                                          return (
                                            <div key={chapter.id} className="flex justify-between">
                                              <span className="text-gray-600">{chapter.name}:</span>
                                              <span className="font-semibold text-gray-900">{totalCorrect}/{totalAnswered} ({percentage}%)</span>
                                            </div>
                                          );
                                        })}
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-gray-900">Badge Diraih ({student.badges.length})</h4>
                                    <button
                                      onClick={() => handleEditBadges(student)}
                                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors"
                                    >
                                      Edit Badge
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2">
                                    {student.badges.length > 0 ? (
                                      student.badges.map(badge => {
                                        const badgeInfo = getBadgeInfoWithCustom(badge);
                                        return (
                                          <div
                                            key={badge}
                                            className={`${badgeInfo.color} border-2 rounded-lg px-3 py-2 transition-transform hover:scale-105 cursor-pointer shadow-sm`}
                                            title={badgeInfo.description}
                                          >
                                            <div className="flex items-center gap-2">
                                              <span className="text-lg">{badgeInfo.icon}</span>
                                              <span className="text-xs font-semibold leading-tight">{badge}</span>
                                            </div>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <p className="text-gray-500 text-xs col-span-2">Belum ada badge</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'essays' && (
          <EssayReviewPanel />
        )}

        {activeTab === 'questions' && (
          <ErrorBoundary>
            <QuestionBankEditor
              questions={questions}
              onUpdateQuestions={onUpdateQuestions}
            />
          </ErrorBoundary>
        )}
      </main>

      {showBadgeManager && (
        <BadgeManager
          onClose={() => {
            setShowBadgeManager(false);
            const saved = localStorage.getItem('mathIRT_customBadges');
            if (saved) {
              setCustomBadges(JSON.parse(saved));
            }
          }}
        />
      )}

      {editingBadgesStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingBadgesStudent(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Edit Badge</h2>
                  <p className="text-purple-100 mt-1">{editingBadgesStudent.name}</p>
                </div>
                <button onClick={() => setEditingBadgesStudent(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Petunjuk:</strong> Klik badge untuk menambah/menghapus dari siswa. Badge yang dipilih akan ditandai dengan ✓
                </p>
              </div>

              {customBadges.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-purple-900 mb-2 text-sm">Badge Custom ({customBadges.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {customBadges.map(badge => {
                      const isSelected = selectedBadges.includes(badge.name);
                      return (
                        <button
                          key={badge.name}
                          onClick={() => toggleBadge(badge.name)}
                          className={`${badge.color} border-2 rounded-lg px-4 py-3 transition-all hover:scale-105 text-left relative ${isSelected ? 'ring-4 ring-purple-500 shadow-lg' : 'opacity-60 hover:opacity-100'}`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-bold">✓</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{badge.icon}</span>
                            <span className="text-sm font-semibold">{badge.name}</span>
                          </div>
                          <p className="text-xs opacity-80">{badge.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">Badge Default ({BADGE_ORDER.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {BADGE_ORDER.map(badgeName => {
                    const badgeInfo = BADGE_INFO[badgeName];
                    if (!badgeInfo) return null;
                    const isSelected = selectedBadges.includes(badgeName);
                    return (
                      <button
                        key={badgeName}
                        onClick={() => toggleBadge(badgeName)}
                        className={`${badgeInfo.color} border-2 rounded-lg px-4 py-3 transition-all hover:scale-105 text-left relative ${isSelected ? 'ring-4 ring-purple-500 shadow-lg' : 'opacity-60 hover:opacity-100'}`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">✓</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{badgeInfo.icon}</span>
                          <span className="text-sm font-semibold">{badgeName}</span>
                        </div>
                        <p className="text-xs opacity-80">{badgeInfo.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-2xl flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <strong>{selectedBadges.length}</strong> badge dipilih dari <strong>{BADGE_ORDER.length + customBadges.length}</strong> tersedia
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditingBadgesStudent(null)} className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors">
                  Batal
                </button>
                <button onClick={handleSaveBadges} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
