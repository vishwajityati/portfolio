import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

const windowMs = 15 * 60 * 1000;
const maxAttempts = 10;
const contactMaxAttempts = 5;
/** Contact-form ceiling shared by every client, including spoofed addresses. */
const contactGlobalMaxAttempts = 100;

/**
 * Ceiling shared by every client. The per-address key can be spoofed by rotating
 * `X-Forwarded-For` when the app is reached directly, so this global bucket bounds
 * total brute-force throughput no matter how many fake addresses are supplied.
 */
const globalMaxAttempts = 200;
const transactionMaxWaitMs = 10_000;

function rateLimitKey(ipAddress: string, scope = "login"): string {
  return createHash("sha256")
    .update(`${process.env.SESSION_SECRET}:${scope}:${ipAddress}`)
    .digest("hex");
}

async function checkRateLimit(key: string, maxAttempts: number): Promise<boolean> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  return prisma.$transaction(async (transaction) => {
    const attempt = await transaction.loginAttempt.findUnique({ where: { key } });
    if (!attempt || attempt.resetAt <= now) {
      await transaction.loginAttempt.upsert({
        where: { key },
        create: { key, count: 0, resetAt },
        update: { count: 0, resetAt }
      });
      return true;
    }
    return attempt.count < maxAttempts;
  }, { maxWait: transactionMaxWaitMs });
}

async function recordAttempt(key: string): Promise<void> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  await prisma.$transaction(async (transaction) => {
    const attempt = await transaction.loginAttempt.findUnique({ where: { key } });
    if (!attempt || attempt.resetAt <= now) {
      await transaction.loginAttempt.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt }
      });
      return;
    }
    await transaction.loginAttempt.update({
      where: { key },
      data: { count: { increment: 1 } }
    });
  }, { maxWait: transactionMaxWaitMs });
}

export async function checkLoginRateLimit(ipAddress: string): Promise<boolean> {
  const [addressAllowed, globalAllowed] = await Promise.all([
    checkRateLimit(rateLimitKey(ipAddress, "login"), maxAttempts),
    checkRateLimit(rateLimitKey("global", "login-global"), globalMaxAttempts)
  ]);
  return addressAllowed && globalAllowed;
}

export async function recordFailedLogin(ipAddress: string): Promise<void> {
  // Log failed login attempt for security monitoring.
  // The IP is hashed in the log to avoid storing raw PII.
  const hashedIp = createHash("sha256")
    .update(`${process.env.SESSION_SECRET}:${ipAddress}`)
    .digest("hex")
    .slice(0, 16);
  console.warn(
    `[security] Failed login attempt at ${new Date().toISOString()} from ${hashedIp}`
  );

  // Increment both the per-address bucket and the shared ceiling. Without the
  // global increment the 200-attempt ceiling was never reached, so a client
  // rotating X-Forwarded-For could bypass throttling entirely.
  await Promise.all([
    recordAttempt(rateLimitKey(ipAddress)),
    recordAttempt(rateLimitKey("global", "login-global"))
  ]);
}

export async function consumeContactMessageRateLimit(ipAddress: string): Promise<boolean> {
  const addressKey = rateLimitKey(ipAddress, "contact-message");
  const globalKey = rateLimitKey("global", "contact-message-global");
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  return prisma.$transaction(async (transaction) => {
    const [addressAttempt, globalAttempt] = await Promise.all([
      transaction.loginAttempt.findUnique({ where: { key: addressKey } }),
      transaction.loginAttempt.findUnique({ where: { key: globalKey } })
    ]);

    const addressCount = !addressAttempt || addressAttempt.resetAt <= now ? 0 : addressAttempt.count;
    const globalCount = !globalAttempt || globalAttempt.resetAt <= now ? 0 : globalAttempt.count;
    if (addressCount >= contactMaxAttempts || globalCount >= contactGlobalMaxAttempts) {
      return false;
    }

    await Promise.all([
      transaction.loginAttempt.upsert({
        where: { key: addressKey },
        create: { key: addressKey, count: addressCount + 1, resetAt },
        update: { count: addressCount + 1, resetAt }
      }),
      transaction.loginAttempt.upsert({
        where: { key: globalKey },
        create: { key: globalKey, count: globalCount + 1, resetAt },
        update: { count: globalCount + 1, resetAt }
      })
    ]);
    return true;
  }, { maxWait: transactionMaxWaitMs });
}

export interface RateLimitSnapshot {
  windowMinutes: number;
  loginMaxAttempts: number;
  globalMaxAttempts: number;
  contactMaxAttempts: number;
  /** Distinct client buckets recorded, excluding the shared global bucket. */
  trackedAddresses: number;
  /** Buckets whose current window has not expired yet. */
  activeWindows: number;
  /** Buckets at or over the sign-in threshold and therefore currently locked out. */
  throttledAddresses: number;
  recordedFailures: number;
  lastAttemptAt: string | null;
}

/**
 * Live rate-limit state read straight from the LoginAttempt table. Keys are hashed, so
 * the shared global bucket is excluded by recomputing its key rather than by pattern.
 */
export async function getRateLimitSnapshot(): Promise<RateLimitSnapshot> {
  const now = new Date();
  const globalKeys = [
    rateLimitKey("global", "login-global"),
    rateLimitKey("global", "contact-message-global")
  ];
  const clientBuckets = { key: { notIn: globalKeys } };

  const [trackedAddresses, activeWindows, throttledAddresses, totals] = await Promise.all([
    prisma.loginAttempt.count({ where: clientBuckets }),
    prisma.loginAttempt.count({ where: { ...clientBuckets, resetAt: { gt: now } } }),
    prisma.loginAttempt.count({ where: { ...clientBuckets, resetAt: { gt: now }, count: { gte: maxAttempts } } }),
    prisma.loginAttempt.aggregate({
      where: clientBuckets,
      _sum: { count: true },
      _max: { updatedAt: true }
    })
  ]);

  return {
    windowMinutes: Math.round(windowMs / 60_000),
    loginMaxAttempts: maxAttempts,
    globalMaxAttempts,
    contactMaxAttempts,
    trackedAddresses,
    activeWindows,
    throttledAddresses,
    recordedFailures: totals._sum.count ?? 0,
    lastAttemptAt: totals._max.updatedAt?.toISOString() ?? null
  };
}
