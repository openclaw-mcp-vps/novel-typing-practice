import "server-only";

import fs from "node:fs";
import path from "node:path";
import BetterSqlite3 from "better-sqlite3";

import { books } from "@/lib/books";
import type { BookState, DashboardData, PracticeSession, ProgressSummary } from "@/lib/types";

const dataDirectory = path.join(process.cwd(), "data");
const databasePath = path.join(dataDirectory, "novel-typing-practice.db");

if (!fs.existsSync(dataDirectory)) {
  fs.mkdirSync(dataDirectory, { recursive: true });
}

type SqliteDb = BetterSqlite3.Database;

const globalForDatabase = globalThis as unknown as {
  novelTypingDatabase: SqliteDb | undefined;
};

function createDatabase(): SqliteDb {
  const db = new BetterSqlite3(databasePath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS practice_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      book_id TEXT NOT NULL,
      passage_index INTEGER NOT NULL,
      wpm REAL NOT NULL,
      accuracy REAL NOT NULL,
      chars_typed INTEGER NOT NULL,
      completed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS book_state (
      email TEXT NOT NULL,
      book_id TEXT NOT NULL,
      passage_index INTEGER NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (email, book_id)
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      email TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT UNIQUE,
      current_period_end TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_email_date
      ON practice_sessions (email, completed_at DESC);

    CREATE INDEX IF NOT EXISTS idx_subscriptions_status
      ON subscriptions (status);

    CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription
      ON subscriptions (stripe_subscription_id);
  `);

  return db;
}

const db = globalForDatabase.novelTypingDatabase ?? createDatabase();

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.novelTypingDatabase = db;
}

interface SavePracticeInput {
  email: string;
  bookId: string;
  passageIndex: number;
  nextPassageIndex: number;
  wpm: number;
  accuracy: number;
  charsTyped: number;
}

interface UpsertSubscriptionInput {
  email: string;
  status: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  currentPeriodEnd?: string | null;
}

const insertPracticeSession = db.prepare(
  `INSERT INTO practice_sessions
    (email, book_id, passage_index, wpm, accuracy, chars_typed, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`
);

const upsertBookStateStatement = db.prepare(
  `INSERT INTO book_state (email, book_id, passage_index, updated_at)
   VALUES (?, ?, ?, ?)
   ON CONFLICT(email, book_id)
   DO UPDATE SET
     passage_index = excluded.passage_index,
     updated_at = excluded.updated_at`
);

const selectSessionsByEmail = db.prepare(
  `SELECT id, email, book_id, passage_index, wpm, accuracy, chars_typed, completed_at
   FROM practice_sessions
   WHERE email = ?
   ORDER BY completed_at ASC`
);

const selectBookStateByEmail = db.prepare(
  `SELECT book_id, passage_index, updated_at
   FROM book_state
   WHERE email = ?`
);

const upsertSubscriptionStatement = db.prepare(
  `INSERT INTO subscriptions
   (email, status, stripe_customer_id, stripe_subscription_id, current_period_end, updated_at)
   VALUES (?, ?, ?, ?, ?, ?)
   ON CONFLICT(email)
   DO UPDATE SET
     status = excluded.status,
     stripe_customer_id = COALESCE(excluded.stripe_customer_id, subscriptions.stripe_customer_id),
     stripe_subscription_id = COALESCE(excluded.stripe_subscription_id, subscriptions.stripe_subscription_id),
     current_period_end = COALESCE(excluded.current_period_end, subscriptions.current_period_end),
     updated_at = excluded.updated_at`
);

const selectSubscriptionByEmail = db.prepare(
  `SELECT email, status, stripe_customer_id, stripe_subscription_id, current_period_end, updated_at
   FROM subscriptions
   WHERE email = ?`
);

const selectSubscriptionByStripeSubscription = db.prepare(
  `SELECT email, status, stripe_customer_id, stripe_subscription_id, current_period_end, updated_at
   FROM subscriptions
   WHERE stripe_subscription_id = ?`
);

const updateSubscriptionByStripeSubscriptionStatement = db.prepare(
  `UPDATE subscriptions
   SET status = ?, current_period_end = ?, updated_at = ?
   WHERE stripe_subscription_id = ?`
);

function toPracticeSession(row: Record<string, unknown>): PracticeSession {
  return {
    id: Number(row.id),
    email: String(row.email),
    bookId: String(row.book_id),
    passageIndex: Number(row.passage_index),
    wpm: Number(row.wpm),
    accuracy: Number(row.accuracy),
    charsTyped: Number(row.chars_typed),
    completedAt: String(row.completed_at)
  };
}

function toBookState(row: Record<string, unknown>): BookState {
  return {
    bookId: String(row.book_id),
    passageIndex: Number(row.passage_index),
    updatedAt: String(row.updated_at)
  };
}

function getUniqueSessionDays(sessions: PracticeSession[]): string[] {
  const days = new Set<string>();

  for (const session of sessions) {
    days.add(session.completedAt.slice(0, 10));
  }

  return Array.from(days).sort();
}

function calculateStreaks(sessions: PracticeSession[]): {
  currentStreakDays: number;
  longestStreakDays: number;
} {
  const days = getUniqueSessionDays(sessions);

  if (days.length === 0) {
    return { currentStreakDays: 0, longestStreakDays: 0 };
  }

  let longest = 1;
  let currentRun = 1;

  for (let index = 1; index < days.length; index += 1) {
    const previous = new Date(`${days[index - 1]}T00:00:00.000Z`);
    const current = new Date(`${days[index]}T00:00:00.000Z`);
    const delta = (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);

    if (delta === 1) {
      currentRun += 1;
      longest = Math.max(longest, currentRun);
    } else {
      currentRun = 1;
    }
  }

  let currentStreak = 0;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const mostRecentDay = new Date(`${days[days.length - 1]}T00:00:00.000Z`);
  const dayGap = (today.getTime() - mostRecentDay.getTime()) / (1000 * 60 * 60 * 24);

  if (dayGap === 0 || dayGap === 1) {
    currentStreak = 1;

    for (let index = days.length - 2; index >= 0; index -= 1) {
      const later = new Date(`${days[index + 1]}T00:00:00.000Z`);
      const earlier = new Date(`${days[index]}T00:00:00.000Z`);
      const delta = (later.getTime() - earlier.getTime()) / (1000 * 60 * 60 * 24);

      if (delta === 1) {
        currentStreak += 1;
      } else {
        break;
      }
    }
  }

  return {
    currentStreakDays: currentStreak,
    longestStreakDays: longest
  };
}

function countCompletedBooks(bookState: BookState[]): number {
  return bookState.reduce((count, state) => {
    const book = books.find((entry) => entry.id === state.bookId);

    if (!book) {
      return count;
    }

    return state.passageIndex >= book.passages.length ? count + 1 : count;
  }, 0);
}

function calculateSummary(sessions: PracticeSession[], bookState: BookState[]): ProgressSummary {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalWordsTyped: 0,
      averageWpm: 0,
      averageAccuracy: 0,
      bestWpm: 0,
      currentStreakDays: 0,
      longestStreakDays: 0,
      booksCompleted: 0
    };
  }

  const totalWordsTyped = sessions.reduce((sum, session) => sum + session.charsTyped / 5, 0);
  const totalWpm = sessions.reduce((sum, session) => sum + session.wpm, 0);
  const totalAccuracy = sessions.reduce((sum, session) => sum + session.accuracy, 0);
  const bestWpm = sessions.reduce((best, session) => Math.max(best, session.wpm), 0);
  const streaks = calculateStreaks(sessions);

  return {
    totalSessions: sessions.length,
    totalWordsTyped: Math.round(totalWordsTyped),
    averageWpm: Math.round((totalWpm / sessions.length) * 10) / 10,
    averageAccuracy: Math.round((totalAccuracy / sessions.length) * 10) / 10,
    bestWpm: Math.round(bestWpm * 10) / 10,
    currentStreakDays: streaks.currentStreakDays,
    longestStreakDays: streaks.longestStreakDays,
    booksCompleted: countCompletedBooks(bookState)
  };
}

export function savePracticeSession(input: SavePracticeInput): void {
  const timestamp = new Date().toISOString();

  const transaction = db.transaction(() => {
    insertPracticeSession.run(
      input.email,
      input.bookId,
      input.passageIndex,
      input.wpm,
      input.accuracy,
      input.charsTyped,
      timestamp
    );

    upsertBookStateStatement.run(input.email, input.bookId, input.nextPassageIndex, timestamp);
  });

  transaction();
}

export function getDashboardData(email: string): DashboardData {
  const sessionRows = selectSessionsByEmail.all(email) as Array<Record<string, unknown>>;
  const bookStateRows = selectBookStateByEmail.all(email) as Array<Record<string, unknown>>;

  const sessions = sessionRows.map(toPracticeSession);
  const bookState = bookStateRows.map(toBookState);

  return {
    sessions,
    bookState,
    summary: calculateSummary(sessions, bookState)
  };
}

export function upsertSubscription(input: UpsertSubscriptionInput): void {
  const normalizedEmail = input.email.trim().toLowerCase();
  if (!normalizedEmail) {
    return;
  }

  upsertSubscriptionStatement.run(
    normalizedEmail,
    input.status,
    input.stripeCustomerId ?? null,
    input.stripeSubscriptionId ?? null,
    input.currentPeriodEnd ?? null,
    new Date().toISOString()
  );
}

export function updateSubscriptionByStripeSubscriptionId(
  stripeSubscriptionId: string,
  status: string,
  currentPeriodEnd: string | null
): void {
  if (!stripeSubscriptionId) {
    return;
  }

  updateSubscriptionByStripeSubscriptionStatement.run(
    status,
    currentPeriodEnd,
    new Date().toISOString(),
    stripeSubscriptionId
  );
}

export function getSubscriptionByStripeSubscriptionId(stripeSubscriptionId: string): {
  email: string;
  status: string;
  currentPeriodEnd: string | null;
} | null {
  const row = selectSubscriptionByStripeSubscription.get(stripeSubscriptionId) as
    | Record<string, unknown>
    | undefined;

  if (!row) {
    return null;
  }

  return {
    email: String(row.email),
    status: String(row.status),
    currentPeriodEnd: row.current_period_end ? String(row.current_period_end) : null
  };
}

export function hasActiveSubscription(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return false;
  }

  const row = selectSubscriptionByEmail.get(normalizedEmail) as Record<string, unknown> | undefined;

  if (!row) {
    return false;
  }

  const status = String(row.status).toLowerCase();
  const activeStatuses = new Set(["active", "trialing", "paid", "one_time"]);

  if (!activeStatuses.has(status)) {
    return false;
  }

  const periodEnd = row.current_period_end ? String(row.current_period_end) : null;

  if (!periodEnd) {
    return true;
  }

  return new Date(periodEnd).getTime() > Date.now();
}
