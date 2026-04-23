"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookMarked,
  CheckCircle2,
  Gauge,
  RotateCcw,
  Target,
  Timer
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import BookSelector from "@/components/BookSelector";
import { books, getBookById, typingGoalWpm } from "@/lib/books";
import type { BookState } from "@/lib/types";

interface TypingInterfaceProps {
  email: string;
}

interface CompletionResult {
  wpm: number;
  accuracy: number;
  charsTyped: number;
  elapsedSeconds: number;
}

function countCorrectChars(typed: string, target: string): number {
  let correctCount = 0;

  for (let index = 0; index < typed.length; index += 1) {
    if (typed[index] === target[index]) {
      correctCount += 1;
    }
  }

  return correctCount;
}

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export default function TypingInterface({ email }: TypingInterfaceProps) {
  const [selectedBookId, setSelectedBookId] = useState(books[0]?.id ?? "");
  const [progressByBook, setProgressByBook] = useState<Record<string, number>>({});
  const [typedText, setTypedText] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completion, setCompletion] = useState<CompletionResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const completionRef = useRef(false);

  const selectedBook = useMemo(() => getBookById(selectedBookId) ?? books[0], [selectedBookId]);

  const savedBookIndex = progressByBook[selectedBook.id] ?? 0;
  const bookCompleted = savedBookIndex >= selectedBook.passages.length;
  const activePassageIndex = Math.min(savedBookIndex, selectedBook.passages.length - 1);
  const activePassage = selectedBook.passages[activePassageIndex];

  useEffect(() => {
    let canceled = false;

    async function loadProgress(): Promise<void> {
      try {
        const response = await fetch("/api/progress", {
          method: "GET"
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          bookState?: BookState[];
        };

        if (canceled || !payload.bookState) {
          return;
        }

        const mappedState: Record<string, number> = {};

        for (const state of payload.bookState) {
          mappedState[state.bookId] = state.passageIndex;
        }

        setProgressByBook((previousState) => ({
          ...previousState,
          ...mappedState
        }));
      } catch {
        // The practice experience can still run if the fetch fails.
      }
    }

    void loadProgress();

    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    if (!startedAt || completion) {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.max(1, Math.floor((Date.now() - startedAt) / 1000)));
    }, 250);

    return () => {
      window.clearInterval(timer);
    };
  }, [startedAt, completion]);

  useEffect(() => {
    setTypedText("");
    setStartedAt(null);
    setElapsedSeconds(0);
    setCompletion(null);
    completionRef.current = false;
    setSaveError("");
  }, [selectedBookId, savedBookIndex]);

  const correctChars = useMemo(
    () => countCorrectChars(typedText, activePassage.text),
    [typedText, activePassage.text]
  );

  const liveAccuracy = typedText.length > 0 ? roundOneDecimal((correctChars / typedText.length) * 100) : 100;

  const liveWpm =
    startedAt && elapsedSeconds > 0
      ? roundOneDecimal((correctChars / 5 / elapsedSeconds) * 60)
      : 0;

  const overallProgress =
    ((Math.min(savedBookIndex, selectedBook.passages.length) +
      (typedText.length / Math.max(activePassage.text.length, 1))) /
      selectedBook.passages.length) *
    100;

  const highlightedPassage = useMemo(() => {
    return activePassage.text.split("").map((character, index) => {
      let className = "text-slate-500";

      if (index < typedText.length) {
        className = typedText[index] === character ? "text-emerald-300" : "bg-rose-500/30 text-rose-100";
      }

      return (
        <span className={className} key={`char-${index.toString()}`}>
          {character}
        </span>
      );
    });
  }, [activePassage.text, typedText]);

  async function persistSession(result: CompletionResult, nextPassageIndex: number): Promise<void> {
    setIsSaving(true);
    setSaveError("");

    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "save-session",
          bookId: selectedBook.id,
          passageIndex: activePassageIndex,
          nextPassageIndex,
          wpm: result.wpm,
          accuracy: result.accuracy,
          charsTyped: result.charsTyped
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        bookState?: BookState[];
      };

      if (!response.ok) {
        setSaveError(payload.error ?? "Your results were not saved.");
        return;
      }

      if (payload.bookState && payload.bookState.length > 0) {
        const mappedState: Record<string, number> = {};

        for (const state of payload.bookState) {
          mappedState[state.bookId] = state.passageIndex;
        }

        setProgressByBook((previousState) => ({
          ...previousState,
          ...mappedState
        }));
      } else {
        setProgressByBook((previousState) => ({
          ...previousState,
          [selectedBook.id]: nextPassageIndex
        }));
      }
    } catch {
      setSaveError("Network error while saving this session. Try the passage once more.");
    } finally {
      setIsSaving(false);
    }
  }

  async function completePassage(fullText: string): Promise<void> {
    if (completionRef.current || bookCompleted) {
      return;
    }

    completionRef.current = true;

    const start = startedAt ?? Date.now();
    const elapsed = Math.max((Date.now() - start) / 1000, 1);
    const correct = countCorrectChars(fullText, activePassage.text);

    const result: CompletionResult = {
      wpm: roundOneDecimal((correct / 5 / elapsed) * 60),
      accuracy: roundOneDecimal((correct / activePassage.text.length) * 100),
      charsTyped: fullText.length,
      elapsedSeconds: Math.round(elapsed)
    };

    setCompletion(result);
    setElapsedSeconds(result.elapsedSeconds);

    const nextPassageIndex = Math.min(activePassageIndex + 1, selectedBook.passages.length);

    await persistSession(result, nextPassageIndex);
  }

  function resetCurrentPassage(): void {
    setTypedText("");
    setStartedAt(null);
    setElapsedSeconds(0);
    setCompletion(null);
    completionRef.current = false;
    setSaveError("");
  }

  function startBookAgain(): void {
    setProgressByBook((previousState) => ({
      ...previousState,
      [selectedBook.id]: 0
    }));
  }

  if (bookCompleted) {
    return (
      <div className="space-y-6 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-6">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-7 w-7 text-emerald-400" />
          <div>
            <h3 className="text-xl font-semibold text-emerald-100">You completed {selectedBook.title}</h3>
            <p className="text-sm text-emerald-200/90">
              All {selectedBook.passages.length} passages are done for this book.
            </p>
          </div>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300"
          onClick={startBookAgain}
          type="button"
        >
          <RotateCcw className="h-4 w-4" />
          Restart This Book
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <aside className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
        <BookSelector
          books={books}
          onSelect={setSelectedBookId}
          progressByBook={progressByBook}
          selectedBookId={selectedBook.id}
        />
      </aside>

      <section className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Active Session</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-100">{selectedBook.title}</h2>
            <p className="text-sm text-slate-400">
              Passage {activePassageIndex + 1} of {selectedBook.passages.length} · {activePassage.label}
            </p>
            <p className="mt-1 text-xs text-slate-500">Signed in as {email}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs font-medium text-slate-300">
            <BookMarked className="h-4 w-4 text-cyan-300" />
            {selectedBook.difficulty}
          </div>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 transition-all"
            style={{ width: `${Math.min(100, Math.max(0, overallProgress)).toFixed(1)}%` }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Live WPM</p>
            <p className="mt-1 flex items-center gap-2 text-xl font-semibold text-slate-100">
              <Gauge className="h-5 w-5 text-cyan-300" />
              {liveWpm}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Accuracy</p>
            <p className="mt-1 flex items-center gap-2 text-xl font-semibold text-slate-100">
              <Target className="h-5 w-5 text-emerald-300" />
              {liveAccuracy}%
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Elapsed</p>
            <p className="mt-1 flex items-center gap-2 text-xl font-semibold text-slate-100">
              <Timer className="h-5 w-5 text-violet-300" />
              {elapsedSeconds}s
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700/80 bg-slate-950/70 p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Original Text</p>
          <p className="min-h-44 whitespace-pre-wrap text-lg leading-8 font-[var(--font-body)]">{highlightedPassage}</p>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500" htmlFor="typing-input">
            Retype The Passage
          </label>
          <textarea
            autoFocus
            className="h-40 w-full rounded-2xl border border-slate-700 bg-slate-950/80 p-4 text-base leading-7 text-slate-100 outline-none ring-cyan-500/40 transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={Boolean(completion)}
            id="typing-input"
            onChange={(event) => {
              const nextValue = event.target.value.slice(0, activePassage.text.length);

              if (!startedAt && nextValue.length > 0) {
                setStartedAt(Date.now());
                setElapsedSeconds(0);
              }

              setTypedText(nextValue);

              if (nextValue.length === activePassage.text.length) {
                void completePassage(nextValue);
              }
            }}
            placeholder="Start typing here to begin timing..."
            spellCheck={false}
            value={typedText}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500"
            onClick={resetCurrentPassage}
            type="button"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Passage
          </button>
          <p className={`text-sm ${liveWpm >= typingGoalWpm ? "text-emerald-400" : "text-slate-400"}`}>
            Goal: {typingGoalWpm} WPM
          </p>
        </div>

        {saveError ? <p className="text-sm text-rose-400">{saveError}</p> : null}

        <AnimatePresence>
          {completion ? (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-cyan-400/40 bg-cyan-500/10 p-5"
              exit={{ opacity: 0, y: 8 }}
              initial={{ opacity: 0, y: 8 }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Passage Complete</p>
                  <h3 className="mt-1 text-lg font-semibold text-cyan-100">Strong run. Keep the momentum.</h3>
                </div>
                <button
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300"
                  onClick={resetCurrentPassage}
                  type="button"
                >
                  Next Passage
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <p className="rounded-xl border border-cyan-300/30 bg-slate-950/40 p-3 text-sm text-slate-200">
                  <span className="block text-xs uppercase tracking-[0.14em] text-slate-400">Final WPM</span>
                  <span className="mt-1 block text-lg font-semibold">{completion.wpm}</span>
                </p>
                <p className="rounded-xl border border-cyan-300/30 bg-slate-950/40 p-3 text-sm text-slate-200">
                  <span className="block text-xs uppercase tracking-[0.14em] text-slate-400">Final Accuracy</span>
                  <span className="mt-1 block text-lg font-semibold">{completion.accuracy}%</span>
                </p>
                <p className="rounded-xl border border-cyan-300/30 bg-slate-950/40 p-3 text-sm text-slate-200">
                  <span className="block text-xs uppercase tracking-[0.14em] text-slate-400">Save Status</span>
                  <span className="mt-1 block text-lg font-semibold">{isSaving ? "Saving..." : "Saved"}</span>
                </p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>
    </div>
  );
}
