"use client";

import { Loader2, Unlock } from "lucide-react";
import { useState, type FormEvent } from "react";

interface UnlockFormProps {
  className?: string;
}

function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export default function UnlockForm({ className = "" }: UnlockFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const normalized = normalizeEmail(email);
    if (!normalized) {
      setError("Enter the email address you used at checkout.");
      setMessage("");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "unlock",
          email: normalized
        })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Unable to validate purchase yet.");
        return;
      }

      setMessage("Access granted. Loading your practice workspace...");
      window.location.reload();
    } catch {
      setError("Could not verify your purchase. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={`space-y-3 ${className}`} onSubmit={onSubmit}>
      <label className="block text-sm text-slate-300" htmlFor="unlock-email">
        Checkout email address
      </label>
      <input
        autoComplete="email"
        className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 outline-none ring-cyan-500/40 transition focus:ring-2"
        id="unlock-email"
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        required
        type="email"
        value={email}
      />
      <button
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={loading}
        type="submit"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
        Verify Purchase & Unlock
      </button>
      {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      <p className="text-xs text-slate-500">
        If you completed checkout in the last minute, wait for Stripe webhook processing then try again.
      </p>
    </form>
  );
}
