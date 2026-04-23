import { NextRequest, NextResponse } from "next/server";

import {
  getSubscriptionByStripeSubscriptionId,
  updateSubscriptionByStripeSubscriptionId,
  upsertSubscription
} from "@/lib/database";
import { verifyStripeWebhookSignature } from "@/lib/lemonsqueezy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface StripeEventPayload {
  id: string;
  type: string;
  data?: {
    object?: Record<string, unknown>;
  };
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getNestedString(source: Record<string, unknown>, key: string): string | null {
  const nested = source[key];

  if (nested && typeof nested === "object") {
    const asRecord = nested as Record<string, unknown>;
    return getString(asRecord.email);
  }

  return null;
}

function toIsoStringFromUnixTimestamp(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return new Date(value * 1000).toISOString();
}

function normalizeSubscriptionStatus(status: string | null): string {
  if (!status) {
    return "active";
  }

  const lowered = status.toLowerCase();

  if (lowered === "trialing") {
    return "active";
  }

  return lowered;
}

function extractSubscriptionEmail(payloadObject: Record<string, unknown>): string | null {
  return (
    getString(payloadObject.customer_email) ??
    getNestedString(payloadObject, "customer_details") ??
    getNestedString(payloadObject, "customer")
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret is not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signatureHeader = request.headers.get("stripe-signature");

  const isValidSignature = verifyStripeWebhookSignature(rawBody, signatureHeader, webhookSecret);

  if (!isValidSignature) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  let event: StripeEventPayload;

  try {
    event = JSON.parse(rawBody) as StripeEventPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const payloadObject = event.data?.object;

  if (!payloadObject) {
    return NextResponse.json({ received: true });
  }

  const eventType = event.type;

  if (eventType === "checkout.session.completed") {
    const email = extractSubscriptionEmail(payloadObject);

    if (email) {
      upsertSubscription({
        email,
        status: "active",
        stripeCustomerId: getString(payloadObject.customer),
        stripeSubscriptionId: getString(payloadObject.subscription),
        currentPeriodEnd: null
      });
    }
  }

  if (eventType === "invoice.payment_succeeded") {
    const email = extractSubscriptionEmail(payloadObject);
    const stripeSubscriptionId = getString(payloadObject.subscription);
    const currentPeriodEnd = toIsoStringFromUnixTimestamp(payloadObject.period_end);

    if (email) {
      upsertSubscription({
        email,
        status: "active",
        stripeCustomerId: getString(payloadObject.customer),
        stripeSubscriptionId,
        currentPeriodEnd
      });
    } else if (stripeSubscriptionId) {
      updateSubscriptionByStripeSubscriptionId(stripeSubscriptionId, "active", currentPeriodEnd);
    }
  }

  if (eventType === "customer.subscription.created" || eventType === "customer.subscription.updated") {
    const email = extractSubscriptionEmail(payloadObject);
    const stripeSubscriptionId = getString(payloadObject.id);
    const normalizedStatus = normalizeSubscriptionStatus(getString(payloadObject.status));
    const currentPeriodEnd = toIsoStringFromUnixTimestamp(payloadObject.current_period_end);

    if (email) {
      upsertSubscription({
        email,
        status: normalizedStatus,
        stripeCustomerId: getString(payloadObject.customer),
        stripeSubscriptionId,
        currentPeriodEnd
      });
    } else if (stripeSubscriptionId) {
      const existing = getSubscriptionByStripeSubscriptionId(stripeSubscriptionId);

      if (existing) {
        updateSubscriptionByStripeSubscriptionId(
          stripeSubscriptionId,
          normalizedStatus,
          currentPeriodEnd ?? existing.currentPeriodEnd
        );
      }
    }
  }

  if (eventType === "customer.subscription.deleted") {
    const email = extractSubscriptionEmail(payloadObject);
    const stripeSubscriptionId = getString(payloadObject.id);

    if (email) {
      upsertSubscription({
        email,
        status: "canceled",
        stripeCustomerId: getString(payloadObject.customer),
        stripeSubscriptionId,
        currentPeriodEnd: toIsoStringFromUnixTimestamp(payloadObject.current_period_end)
      });
    } else if (stripeSubscriptionId) {
      updateSubscriptionByStripeSubscriptionId(stripeSubscriptionId, "canceled", null);
    }
  }

  return NextResponse.json({ received: true });
}
