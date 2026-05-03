import "server-only";
import { cookies } from "next/headers";
import crypto from "node:crypto";

const COOKIE_NAME = "dashboard_auth";
const COOKIE_VERSION = "v1";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 60; // 60 days

/**
 * Deterministic token derived from the configured PIN. We never store
 * the PIN in the cookie itself — instead we store this short hash, so
 * rotating DASHBOARD_PIN automatically invalidates existing sessions.
 */
function tokenFor(pin: string): string {
  return crypto
    .createHash("sha256")
    .update(`${COOKIE_VERSION}::${pin}`)
    .digest("hex")
    .slice(0, 24);
}

/** Returns the expected cookie value, or null if no PIN is configured. */
export function expectedToken(): string | null {
  const pin = process.env.DASHBOARD_PIN;
  return pin ? tokenFor(pin) : null;
}

export async function isAuthorized(): Promise<boolean> {
  const target = expectedToken();
  if (!target) return false;
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === target;
}

export async function setAuthCookie(): Promise<void> {
  const target = expectedToken();
  if (!target) return;
  const store = await cookies();
  store.set(COOKIE_NAME, target, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/dashboard",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearAuthCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
