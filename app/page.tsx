"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChartNoAxesCombined, Keyboard, LockKeyhole, Target } from "lucide-react";

const problemPoints = [
  {
    title: "Most typing drills are repetitive",
    detail:
      "Random words and disconnected sentences train mechanics, but they do not build sustained focus for real writing sessions."
  },
  {
    title: "Progress is often hidden",
    detail:
      "Without visible streaks, trend lines, and completion milestones, learners stop practicing before habits form."
  },
  {
    title: "Quality text matters",
    detail:
      "Public-domain novels offer richer syntax and stronger pacing than generic typing passages."
  }
];

const solutionPoints = [
  {
    title: "Classic literature sessions",
    detail: "Retype curated excerpts from Austen, Conan Doyle, and Melville with progressive difficulty."
  },
  {
    title: "Live performance feedback",
    detail: "Track real-time WPM, accuracy, and elapsed time while you type each passage."
  },
  {
    title: "Goal-driven dashboard",
    detail: "Review average speed, best run, streaks, and book-by-book completion to stay consistent."
  },
  {
    title: "Simple paid unlock",
    detail:
      "Hosted Stripe checkout, then a secure cookie unlock flow tied to your purchase email and webhook validation."
  }
];

const faqItems = [
  {
    question: "Who is this for?",
    answer:
      "Students preparing essays, professionals who type all day, and homeschool families that want measurable keyboarding practice with real prose."
  },
  {
    question: "What do I get for $9/month?",
    answer:
      "Unlimited practice sessions, all included books, progress analytics, WPM trend charts, and account unlock across devices after verification."
  },
  {
    question: "How does access work after payment?",
    answer:
      "Stripe sends a webhook when checkout completes. Enter the same checkout email in the unlock form and the app sets your access cookie."
  },
  {
    question: "Do I need to install anything?",
    answer: "No. It runs in the browser on desktop and mobile."
  }
];

export default function LandingPage() {
  const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;
  const paymentLinkMissing = !paymentLink;

  return (
    <main className="relative">
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-8 md:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link className="text-lg font-semibold tracking-wide text-cyan-300" href="/">
            Novel Typing Practice
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
              href="/practice"
            >
              Practice
            </Link>
            <Link
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
              href="/dashboard"
            >
              Dashboard
            </Link>
            <a
              aria-disabled={paymentLinkMissing}
              className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                paymentLinkMissing
                  ? "pointer-events-none bg-slate-700 text-slate-400"
                  : "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
              }`}
              href={paymentLink}
            >
              Start $9/mo
            </a>
          </nav>
        </header>

        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"
          initial={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.45 }}
        >
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Learn typing by retyping classic literature
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight text-slate-100 md:text-5xl">
              Build typing speed with text that is worth reading.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-300">
              Novel Typing Practice turns public-domain classics into structured typing workouts. Improve WPM,
              raise accuracy, and finish entire books while your dashboard tracks measurable progress.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                aria-disabled={paymentLinkMissing}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                  paymentLinkMissing
                    ? "pointer-events-none bg-slate-700 text-slate-400"
                    : "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                }`}
                href={paymentLink}
              >
                Start Subscription
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
                href="/practice"
              >
                Explore Practice Flow
              </Link>
            </div>
            {paymentLinkMissing ? (
              <p className="mt-3 text-sm text-amber-300">
                Add <code>NEXT_PUBLIC_STRIPE_PAYMENT_LINK</code> to enable checkout.
              </p>
            ) : null}
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Live WPM</p>
                <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-slate-100">
                  <Target className="h-6 w-6 text-cyan-300" />
                  52.4
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Accuracy</p>
                <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-slate-100">
                  <Keyboard className="h-6 w-6 text-emerald-300" />
                  96.1%
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Streak</p>
                <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-slate-100">
                  <ChartNoAxesCombined className="h-6 w-6 text-violet-300" />
                  7 days
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Access</p>
                <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-slate-100">
                  <LockKeyhole className="h-6 w-6 text-amber-300" />
                  Verified
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              The workflow is simple: checkout, verify with your purchase email, and start your first tracked session.
            </p>
          </div>
        </motion.section>

        <section className="mt-20">
          <h2 className="text-2xl font-semibold text-slate-100 md:text-3xl">Why most typing tools fail learners</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {problemPoints.map((item) => (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5" key={item.title}>
                <h3 className="text-lg font-semibold text-slate-100">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-2xl font-semibold text-slate-100 md:text-3xl">A focused solution for deliberate practice</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {solutionPoints.map((item) => (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5" key={item.title}>
                <h3 className="text-lg font-semibold text-slate-100">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-slate-100 md:text-3xl">Simple pricing for consistent improvement</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              One plan, no feature gating. Build daily typing momentum with all books and full analytics.
            </p>
            <div className="mt-6 flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-950/60 p-5">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-cyan-300">Novel Typing Practice</p>
                <p className="mt-1 text-4xl font-semibold text-slate-100">
                  $9<span className="text-lg text-slate-400">/month</span>
                </p>
                <ul className="mt-3 space-y-1 text-sm text-slate-300">
                  <li>Unlimited typing sessions</li>
                  <li>Progress dashboard + WPM trend chart</li>
                  <li>Book completion and streak tracking</li>
                  <li>Mobile and desktop access</li>
                </ul>
              </div>
              <a
                aria-disabled={paymentLinkMissing}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                  paymentLinkMissing
                    ? "pointer-events-none bg-slate-700 text-slate-400"
                    : "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                }`}
                href={paymentLink}
              >
                Buy Access
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-2xl font-semibold text-slate-100 md:text-3xl">FAQ</h2>
          <div className="mt-6 space-y-3">
            {faqItems.map((item) => (
              <details className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5" key={item.question}>
                <summary className="cursor-pointer text-lg font-semibold text-slate-100">{item.question}</summary>
                <p className="mt-2 text-sm text-slate-400">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="mt-20 border-t border-slate-800 pt-6 text-sm text-slate-500">
          © {new Date().getFullYear()} Novel Typing Practice · Built for students, professionals, and homeschool learning.
        </footer>
      </div>
    </main>
  );
}
