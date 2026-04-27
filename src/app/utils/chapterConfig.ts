// Chapter (Bab) and Topic (Sub-bab) configuration

export interface ChapterConfig {
  id: string;
  name: string;
  topics: string[];
}

export const chapters: ChapterConfig[] = [
  {
    id: 'eksponen',
    name: 'Eksponen',
    topics: [
      'Sifat Eksponen Dasar',
      'Perkalian & Pembagian Eksponen',
      'Pangkat Pecahan',
      'Eksponen Negatif',
      'Bentuk Akar',
      'Aplikasi Eksponen',
      'Integrasi dengan Materi Lain'
    ]
  },
  {
    id: 'logaritma',
    name: 'Logaritma',
    topics: [
      'Pengertian Logaritma',
      'Sifat Logaritma',
      'Persamaan Logaritma',
      'Pertidaksamaan Logaritma',
      'Aplikasi Logaritma',
      'Integrasi dengan Materi Lain'
    ]
  },
  {
    id: 'spldv',
    name: 'Sistem Persamaan Linear Dua Variabel (SPLDV)',
    topics: [
      'Metode Grafik',
      'Metode Substitusi',
      'Metode Eliminasi',
      'Metode Campuran',
      'Aplikasi SPLDV',
      'Integrasi dengan Materi Lain'
    ]
  },
  {
    id: 'spltv',
    name: 'Sistem Persamaan Linear Tiga Variabel (SPLTV)',
    topics: [
      'Metode Eliminasi-Substitusi',
      'Metode Determinan (Cramer)',
      'Aplikasi SPLTV',
      'Integrasi dengan Materi Lain'
    ]
  },
  {
    id: 'sptldv',
    name: 'Sistem Pertidaksamaan Linear Dua Variabel (SPtLDV)',
    topics: [
      'Menggambar Daerah Penyelesaian',
      'Menentukan Titik Optimum',
      'Program Linear',
      'Aplikasi SPtLDV',
      'Integrasi dengan Materi Lain'
    ]
  },
  {
    id: 'lainnya',
    name: 'Materi Lainnya',
    topics: [
      'Topik Lainnya'
    ]
  }
];

// Helper function to get chapter by topic
export function getChapterByTopic(topic: string): ChapterConfig | undefined {
  // First try exact match
  for (const chapter of chapters) {
    if (chapter.topics.includes(topic)) {
      return chapter;
    }
  }

  // Then try partial match or legacy topic names
  const topicLower = topic.toLowerCase();

  if (topicLower.includes('eksponen') || topicLower.includes('akar')) {
    return chapters.find(c => c.id === 'eksponen');
  }
  if (topicLower.includes('logaritma') || topicLower.includes('log')) {
    return chapters.find(c => c.id === 'logaritma');
  }
  if (topicLower === 'spldv' || topicLower.includes('dua variabel') && topicLower.includes('persamaan')) {
    return chapters.find(c => c.id === 'spldv');
  }
  if (topicLower === 'spltv' || topicLower.includes('tiga variabel')) {
    return chapters.find(c => c.id === 'spltv');
  }
  if (topicLower === 'sptldv' || topicLower.includes('pertidaksamaan')) {
    return chapters.find(c => c.id === 'sptldv');
  }
  if (topicLower.includes('multi')) {
    return chapters.find(c => c.id === 'multi-materi');
  }

  return undefined;
}

// Helper to get chapter name
export function getChapterName(topic: string): string {
  const chapter = getChapterByTopic(topic);
  return chapter ? chapter.name : 'Lainnya';
}

// Get all chapters for a question (supports multiple chapters for multi-materi)
export function getQuestionChapters(question: { chapters?: string[]; topic: string }): string[] {
  // If question has explicit chapters array, use that
  if (question.chapters && question.chapters.length > 0) {
    return question.chapters;
  }

  // Otherwise, infer from topic (legacy support)
  const chapter = getChapterByTopic(question.topic);
  return chapter ? [chapter.name] : ['Materi Lainnya'];
}

// Check if question belongs to a specific chapter
export function questionMatchesChapter(
  question: { chapters?: string[]; topic: string },
  chapterName: string
): boolean {
  const questionChapters = getQuestionChapters(question);

  // If filtering by "Materi Lainnya", show questions with no chapters
  if (chapterName === 'Materi Lainnya') {
    return questionChapters.length === 0;
  }

  return questionChapters.includes(chapterName);
}

// Helper to group questions by chapter
// NOTE: Questions with multiple chapters will appear in multiple groups
export function groupQuestionsByChapter<T extends { chapters?: string[]; topic: string }>(
  questions: T[]
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};

  for (const question of questions) {
    const questionChapters = getQuestionChapters(question);

    // Add question to each of its chapters
    for (const chapterName of questionChapters) {
      if (!grouped[chapterName]) {
        grouped[chapterName] = [];
      }
      grouped[chapterName].push(question);
    }
  }

  return grouped;
}
