"use client";

import Link from "next/link";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import ProgressTracker from "@/components/ProgressTracker";
import { books, typingGoalWpm } from "@/lib/books";
import type { DashboardData } from "@/lib/types";

interface DashboardPanelProps {
  email: string;
}

const emptyDashboardData: DashboardData = {
  sessions: [],
  bookState: [],
  summary: {
    totalSessions: 0,
    totalWordsTyped: 0,
    averageWpm: 0,
    averageAccuracy: 0,
    bestWpm: 0,
    currentStreakDays: 0,
    longestStreakDays: 0,
    booksCompleted: 0
  }
};

export default function DashboardPanel({ email }: DashboardPanelProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData>(emptyDashboardData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboardData(): Promise<void> {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/progress", {
        method: "GET"
      });

      const payload = (await response.json()) as DashboardData & { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Could not load your dashboard right now.");
        return;
      }

      setDashboardData(payload);
    } catch {
      setError("Network error while loading your progress.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const bookProgress = useMemo(() => {
    const map = new Map<string, number>();

    for (const state of dashboardData.bookState) {
      map.set(state.bookId, state.passageIndex);
    }

    return books.map((book) => {
      const completedPassages = map.get(book.id) ?? 0;
      const percent = Math.min(100, Math.round((completedPassages / book.passages.length) * 100));

      return {
        id: book.id,
        title: book.title,
        author: book.author,
        completedPassages: Math.min(completedPassages, book.passages.length),
        totalPassages: book.passages.length,
        percent
      };
    });
  }, [dashboardData.bookState]);

  const currentGoalDelta = typingGoalWpm - dashboardData.summary.averageWpm;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Account</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-100">Progress Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">Tracking data for {email}</p>
          </div>
          <Link
            className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            href="/practice"
          >
            Continue Practice
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-300">
          {currentGoalDelta <= 0
            ? `You are averaging ${Math.abs(currentGoalDelta).toFixed(1)} WPM above your ${typingGoalWpm} WPM goal.`
            : `You are ${currentGoalDelta.toFixed(1)} WPM away from your ${typingGoalWpm} WPM goal.`}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/60 p-10">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-rose-300" />
            <p className="font-medium text-rose-100">{error}</p>
          </div>
          <button
            className="mt-4 rounded-lg border border-rose-300/40 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20"
            onClick={() => {
              void loadDashboardData();
            }}
            type="button"
          >
            Try Again
          </button>
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          <ProgressTracker
            bookState={dashboardData.bookState}
            sessions={dashboardData.sessions}
            summary={dashboardData.summary}
          />

          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 md:p-6">
            <h2 className="text-xl font-semibold text-slate-100">Book-by-Book Completion</h2>
            <div className="mt-4 space-y-4">
              {bookProgress.map((entry) => (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4" key={entry.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-slate-200">{entry.title}</p>
                    <p className="text-xs text-slate-500">{entry.author}</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                      style={{ width: `${entry.percent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    {entry.completedPassages}/{entry.totalPassages} passages complete ({entry.percent}%)
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
