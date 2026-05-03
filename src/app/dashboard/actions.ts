"use server";

import { redirect } from "next/navigation";
import { clearAuthCookie, setAuthCookie } from "./auth";

export type VerifyResult = { ok: false; error: string };

/**
 * Verifies the submitted PIN against the configured DASHBOARD_PIN.
 * On success: sets the cookie and redirects (this function never
 * returns in that case). On failure: returns an error so the form
 * can render it inline.
 */
export async function verifyPinAction(pin: string): Promise<VerifyResult> {
  const target = process.env.DASHBOARD_PIN;
  if (!target) {
    return {
      ok: false,
      error:
        "Dashboard PIN is not configured. Set DASHBOARD_PIN in .env.local (and Vercel) before using this view.",
    };
  }
  if (pin.trim() !== target) {
    return { ok: false, error: "Wrong PIN." };
  }
  await setAuthCookie();
  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  await clearAuthCookie();
  redirect("/dashboard");
}
