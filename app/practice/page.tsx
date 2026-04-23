import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Lock, ShieldCheck } from "lucide-react";

import LogoutButton from "@/components/LogoutButton";
import TypingInterface from "@/components/TypingInterface";
import UnlockForm from "@/components/UnlockForm";
import { getStripePaymentLink } from "@/lib/lemonsqueezy";

export const metadata: Metadata = {
  title: "Practice",
  description: "Retype classic literature passages and track your typing speed and accuracy.",
  robots: {
    index: false,
    follow: false
  }
};

function decodeEmail(value: string | undefined): string {
  if (!value) {
    return "";
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function PracticePage() {
  const cookieStore = await cookies();
  const hasAccess = cookieStore.get("ntp_access")?.value === "1";
  const email = decodeEmail(cookieStore.get("ntp_email")?.value);
  const paymentLink = getStripePaymentLink();

  if (!hasAccess || !email) {
    return (
      <main className="mx-auto max-w-3xl px-5 pb-16 pt-10 md:px-8">
        <Link className="text-sm text-cyan-300 transition hover:text-cyan-200" href="/">
          ← Back to Home
        </Link>

        <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 md:p-8">
          <div className="flex items-start gap-3">
            <div className="rounded-full border border-cyan-400/40 bg-cyan-500/10 p-2">
              <Lock className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-100">Practice area is member-only</h1>
              <p className="mt-2 text-sm text-slate-400">
                Subscribe to unlock full typing sessions, performance tracking, and dashboard analytics.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Step 1</p>
              <p className="mt-2 text-sm text-slate-300">Complete checkout using Stripe hosted payment page.</p>
              <a
                className="mt-4 inline-flex rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400"
                href={paymentLink}
              >
                Buy Access for $9/mo
              </a>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Step 2</p>
              <p className="mt-2 text-sm text-slate-300">
                Enter the same checkout email to verify your subscription and set your access cookie.
              </p>
              <UnlockForm className="mt-3" />
            </div>
          </div>

          <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            Access is controlled by a server-issued cookie after purchase validation.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-5 pb-16 pt-8 md:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Member Practice</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-100">Typing Lab</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 transition hover:border-slate-500"
            href="/dashboard"
          >
            Dashboard
          </Link>
          <LogoutButton />
        </div>
      </header>

      <TypingInterface email={email} />
    </main>
  );
}
