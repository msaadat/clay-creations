import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";

/**
 * Minimal signed-cookie session for the single shop owner.
 *
 * This deliberately isn't Auth.js: there is exactly one admin, no OAuth, no
 * account recovery and no user-facing accounts, so a signed cookie is the whole
 * requirement. If customer accounts are ever added, replace this with Auth.js
 * rather than growing it.
 */

const COOKIE_NAME = "cc_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET must be set to at least 32 characters. Generate one with: openssl rand -base64 32",
    );
  }
  return secret;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function createSession(adminId: string): Promise<void> {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${adminId}.${expiresAt}`;
  const token = `${payload}.${sign(payload)}`;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Returns the signed-in admin, or null. Verifies signature and expiry. */
export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [adminId, expiresAt, signature] = parts;
  const payload = `${adminId}.${expiresAt}`;

  if (!safeEqual(signature, sign(payload))) return null;
  if (Number(expiresAt) < Date.now()) return null;

  return db.adminUser.findUnique({
    where: { id: adminId },
    select: { id: true, email: true },
  });
}
