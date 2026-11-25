import "server-only";
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface AdminSession {
  adminId?: number;
  pendingAdminId?: number;
  pendingTotpUntil?: number;
  /** Admin.sessionVersion at the time this session was authenticated. */
  sessionVersion?: number;
}

/** Rejects missing, short, and documented placeholder secrets before they can be used. */
export function isSessionSecretStrong(secret: string | undefined): boolean {
  if (!secret || secret.length < 32) return false;
  const normalized = secret.trim().toLowerCase();
  const placeholders = ["replace", "changeme", "example", "placeholder", "your-"];
  return !placeholders.some((marker) => normalized.includes(marker));
}

export const sessionOptions: SessionOptions = {
  cookieName: "portfolio.sid",
  password: process.env.SESSION_SECRET ?? "",
  ttl: 60 * 60 * 8,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/"
  }
};

export async function getAdminSession() {
  if (typeof sessionOptions.password !== "string" || !isSessionSecretStrong(sessionOptions.password)) {
    throw new Error("Set SESSION_SECRET to a random value of at least 32 characters.");
  }
  return getIronSession<AdminSession>(await cookies(), sessionOptions);
}
