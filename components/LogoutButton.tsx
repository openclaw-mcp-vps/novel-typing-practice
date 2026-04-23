"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function onLogout(): Promise<void> {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "logout" })
      });
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <button
      className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
      onClick={onLogout}
      type="button"
    >
      <LogOut className="h-4 w-4" />
      {loading ? "Signing Out" : "Sign Out"}
    </button>
  );
}
