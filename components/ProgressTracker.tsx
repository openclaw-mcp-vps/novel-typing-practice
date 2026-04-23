"use client";

import { BarChart3, Flame, Gauge, Trophy } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { BookState, PracticeSession, ProgressSummary } from "@/lib/types";

interface ProgressTrackerProps {
  sessions: PracticeSession[];
  summary: ProgressSummary;
  bookState: BookState[];
}

function formatDateLabel(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

export default function ProgressTracker({
  sessions,
  summary,
  bookState
}: ProgressTrackerProps) {
  const recentSessions = sessions.slice(-20);
  const chartData = recentSessions.map((session) => ({
    date: formatDateLabel(session.completedAt),
    wpm: session.wpm,
    accuracy: session.accuracy
  }));

  if (sessions.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-xl font-semibold text-slate-100">No sessions yet</h2>
        <p className="mt-2 text-sm text-slate-400">
          Complete your first passage in the practice area to unlock WPM trends, streak tracking, and book progress.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Average WPM</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-slate-100">
            <Gauge className="h-6 w-6 text-cyan-300" />
            {summary.averageWpm}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Best WPM</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-slate-100">
            <Trophy className="h-6 w-6 text-amber-300" />
            {summary.bestWpm}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Current Streak</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-slate-100">
            <Flame className="h-6 w-6 text-rose-300" />
            {summary.currentStreakDays} days
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Books Completed</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-slate-100">
            <BarChart3 className="h-6 w-6 text-emerald-300" />
            {summary.booksCompleted}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:p-5">
        <h3 className="text-lg font-semibold text-slate-100">Recent Performance</h3>
        <p className="mt-1 text-sm text-slate-400">
          Last {recentSessions.length} sessions · {summary.averageAccuracy}% average accuracy · {summary.totalWordsTyped} words typed
        </p>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#263041" strokeDasharray="4 4" />
              <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} />
              <YAxis stroke="#94a3b8" tickLine={false} yAxisId="wpm" />
              <YAxis
                domain={[70, 100]}
                orientation="right"
                stroke="#94a3b8"
                tickLine={false}
                yAxisId="accuracy"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "0.75rem"
                }}
              />
              <Line
                dataKey="wpm"
                dot={false}
                name="WPM"
                stroke="#22d3ee"
                strokeWidth={2.5}
                type="monotone"
                yAxisId="wpm"
              />
              <Line
                dataKey="accuracy"
                dot={false}
                name="Accuracy %"
                stroke="#34d399"
                strokeWidth={2}
                type="monotone"
                yAxisId="accuracy"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:p-5">
        <h3 className="text-lg font-semibold text-slate-100">Practice Consistency</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <p className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">
            <span className="block text-xs uppercase tracking-[0.14em] text-slate-500">Sessions</span>
            <span className="mt-1 block text-xl font-semibold text-slate-100">{summary.totalSessions}</span>
          </p>
          <p className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">
            <span className="block text-xs uppercase tracking-[0.14em] text-slate-500">Words Typed</span>
            <span className="mt-1 block text-xl font-semibold text-slate-100">{summary.totalWordsTyped}</span>
          </p>
          <p className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">
            <span className="block text-xs uppercase tracking-[0.14em] text-slate-500">Longest Streak</span>
            <span className="mt-1 block text-xl font-semibold text-slate-100">
              {summary.longestStreakDays} days
            </span>
          </p>
          <p className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">
            <span className="block text-xs uppercase tracking-[0.14em] text-slate-500">Tracked Books</span>
            <span className="mt-1 block text-xl font-semibold text-slate-100">{bookState.length}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
