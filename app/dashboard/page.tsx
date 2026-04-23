import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { BarChart3 } from "lucide-react";

import DashboardPanel from "@/components/DashboardPanel";
import LogoutButton from "@/components/LogoutButton";
import UnlockForm from "@/components/UnlockForm";
import { getStripePaymentLink } from "@/lib/lemonsqueezy";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Review typing performance trends and completion progress.",
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

export default async function DashboardPage() {
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
              <BarChart3 className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-100">Dashboard is locked</h1>
              <p className="mt-2 text-sm text-slate-400">
                Subscribe to view WPM trends, streak metrics, and book completion analytics.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <a
              className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400/40"
              href={paymentLink}
            >
              Buy access with Stripe →
            </a>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-sm text-slate-300">Already paid? Verify your checkout email.</p>
              <UnlockForm className="mt-3" />
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-5 pb-16 pt-8 md:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Member Analytics</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-100">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 transition hover:border-slate-500"
            href="/practice"
          >
            Practice
          </Link>
          <LogoutButton />
        </div>
      </header>

      <DashboardPanel email={email} />
    </main>
  );
}
