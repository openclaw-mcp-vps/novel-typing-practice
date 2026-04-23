"use client";

import { BookOpenText, CheckCircle2 } from "lucide-react";

import type { ClassicBook } from "@/lib/books";

interface BookSelectorProps {
  books: ClassicBook[];
  selectedBookId: string;
  progressByBook: Record<string, number>;
  onSelect: (bookId: string) => void;
}

export default function BookSelector({
  books,
  selectedBookId,
  progressByBook,
  onSelect
}: BookSelectorProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Pick a Book</h2>
      <div className="space-y-2">
        {books.map((book) => {
          const selected = selectedBookId === book.id;
          const completedPassages = progressByBook[book.id] ?? 0;
          const completed = completedPassages >= book.passages.length;

          return (
            <button
              key={book.id}
              className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                selected
                  ? "border-cyan-400/70 bg-cyan-500/10"
                  : "border-slate-700 bg-slate-900/50 hover:border-slate-500"
              }`}
              onClick={() => onSelect(book.id)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-100">{book.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{book.author}</p>
                  <p className="mt-2 text-xs text-slate-300">{book.shortDescription}</p>
                </div>
                {completed ? (
                  <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-400" />
                ) : (
                  <BookOpenText className="mt-1 h-5 w-5 text-slate-500" />
                )}
              </div>
              <p className="mt-3 text-xs font-medium text-slate-400">
                {Math.min(completedPassages, book.passages.length)} / {book.passages.length} passages complete
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
