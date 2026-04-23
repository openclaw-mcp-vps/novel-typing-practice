export interface PracticeSession {
  id: number;
  email: string;
  bookId: string;
  passageIndex: number;
  wpm: number;
  accuracy: number;
  charsTyped: number;
  completedAt: string;
}

export interface BookState {
  bookId: string;
  passageIndex: number;
  updatedAt: string;
}

export interface ProgressSummary {
  totalSessions: number;
  totalWordsTyped: number;
  averageWpm: number;
  averageAccuracy: number;
  bestWpm: number;
  currentStreakDays: number;
  longestStreakDays: number;
  booksCompleted: number;
}

export interface DashboardData {
  sessions: PracticeSession[];
  bookState: BookState[];
  summary: ProgressSummary;
}
