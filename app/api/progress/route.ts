import { NextRequest, NextResponse } from "next/server";

import { getDashboardData, hasActiveSubscription, savePracticeSession } from "@/lib/database";

const ACCESS_COOKIE_NAME = "ntp_access";
const EMAIL_COOKIE_NAME = "ntp_email";
const ACCESS_COOKIE_TTL_DAYS = 31;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function setAccessCookies(response: NextResponse, email: string): void {
  const expires = new Date(Date.now() + ACCESS_COOKIE_TTL_DAYS * 24 * 60 * 60 * 1000);

  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: "1",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires
  });

  response.cookies.set({
    name: EMAIL_COOKIE_NAME,
    value: encodeURIComponent(email),
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires
  });
}

function clearAccessCookies(response: NextResponse): void {
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: "",
    path: "/",
    expires: new Date(0)
  });

  response.cookies.set({
    name: EMAIL_COOKIE_NAME,
    value: "",
    path: "/",
    expires: new Date(0)
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const hasAccess = request.cookies.get(ACCESS_COOKIE_NAME)?.value === "1";
  const email = decodeEmail(request.cookies.get(EMAIL_COOKIE_NAME)?.value);

  if (!hasAccess || !email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dashboardData = getDashboardData(email);
  return NextResponse.json(dashboardData);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let payload: Record<string, unknown>;

  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const action = payload.action;

  if (action === "unlock") {
    const email = normalizeEmail(payload.email);

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "A valid checkout email is required." }, { status: 400 });
    }

    if (!hasActiveSubscription(email)) {
      return NextResponse.json(
        {
          error:
            "No active subscription found for that email yet. If you just paid, wait for webhook processing and try again."
        },
        { status: 403 }
      );
    }

    const response = NextResponse.json({ ok: true, email });
    setAccessCookies(response, email);
    return response;
  }

  if (action === "logout") {
    const response = NextResponse.json({ ok: true });
    clearAccessCookies(response);
    return response;
  }

  if (action === "save-session") {
    const hasAccess = request.cookies.get(ACCESS_COOKIE_NAME)?.value === "1";
    const email = decodeEmail(request.cookies.get(EMAIL_COOKIE_NAME)?.value);

    if (!hasAccess || !email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookId = typeof payload.bookId === "string" ? payload.bookId : "";
    const passageIndex = Number(payload.passageIndex);
    const nextPassageIndex = Number(payload.nextPassageIndex);
    const wpm = Number(payload.wpm);
    const accuracy = Number(payload.accuracy);
    const charsTyped = Number(payload.charsTyped);

    const numbersAreValid = [passageIndex, nextPassageIndex, wpm, accuracy, charsTyped].every((value) =>
      Number.isFinite(value)
    );

    if (!bookId || !numbersAreValid) {
      return NextResponse.json({ error: "Missing or invalid session data" }, { status: 400 });
    }

    if (wpm < 0 || wpm > 300 || accuracy < 0 || accuracy > 100 || charsTyped < 1) {
      return NextResponse.json({ error: "Session metrics out of bounds" }, { status: 400 });
    }

    savePracticeSession({
      email,
      bookId,
      passageIndex,
      nextPassageIndex,
      wpm,
      accuracy,
      charsTyped
    });

    const dashboardData = getDashboardData(email);
    return NextResponse.json({ ok: true, ...dashboardData });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
