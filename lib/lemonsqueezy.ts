import crypto from "node:crypto";

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

const FIVE_MINUTES_IN_SECONDS = 300;

function timingSafeMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyStripeWebhookSignature(
  payload: string,
  signatureHeader: string | null,
  webhookSecret: string | undefined
): boolean {
  if (!signatureHeader || !webhookSecret) {
    return false;
  }

  const fragments = signatureHeader.split(",").map((entry) => entry.trim());
  const timestampFragment = fragments.find((entry) => entry.startsWith("t="));
  const signatureFragments = fragments.filter((entry) => entry.startsWith("v1="));

  if (!timestampFragment || signatureFragments.length === 0) {
    return false;
  }

  const timestamp = Number(timestampFragment.replace("t=", ""));

  if (!Number.isFinite(timestamp)) {
    return false;
  }

  const age = Math.floor(Date.now() / 1000) - timestamp;

  if (Math.abs(age) > FIVE_MINUTES_IN_SECONDS) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${payload}`, "utf8")
    .digest("hex");

  return signatureFragments.some((entry) => {
    const providedSignature = entry.replace("v1=", "");
    return timingSafeMatch(providedSignature, expectedSignature);
  });
}

export function getStripePaymentLink(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? "";
}
