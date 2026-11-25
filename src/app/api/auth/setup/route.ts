import { createHash, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { checkLoginRateLimit, recordFailedLogin } from "@/lib/auth-rate-limit";
import {
  AUTH_BODY_MAX_BYTES,
  exceedsDeclaredSize,
  exceedsSerializedSize,
  getClientAddress,
  hasSameOrigin,
  isIpAllowed
} from "@/lib/security";
import { getAccessCodePolicyError, normalizeAccessCode } from "@/lib/access-code";
import { prisma } from "@/lib/prisma";

/** Compares secrets as fixed-length hashes so length and content cannot be probed. */
function setupTokenMatches(provided: string): boolean {
  const expected = process.env.ADMIN_SETUP_TOKEN?.trim();
  if (!expected || expected.length < 32 || provided.length > 512) return false;

  const providedHash = createHash("sha256").update(provided).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(providedHash, expectedHash);
}

function setupTokenIsConfigured(): boolean {
  const token = process.env.ADMIN_SETUP_TOKEN?.trim();
  return Boolean(token && token.length >= 32);
}

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  if (!isIpAllowed(request)) {
    return NextResponse.json({ error: "Access denied from this network." }, { status: 403 });
  }

  try {
    const clientAddress = getClientAddress(request);

    // Check this before any expensive work: once setup is complete this endpoint
    // must not perform bcrypt hashing or attempt a database write.
    const existingAdmin = await prisma.admin.findUnique({
      where: { id: 1 },
      select: { id: true }
    });
    if (existingAdmin) {
      return NextResponse.json({ error: "Admin setup is already complete. Please sign in." }, { status: 409 });
    }

    if (!setupTokenIsConfigured()) {
      return NextResponse.json(
        { error: "Admin setup is disabled. Set ADMIN_SETUP_TOKEN on the server to enable it." },
        { status: 503 }
      );
    }

    if (!(await checkLoginRateLimit(clientAddress))) {
      return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
    }

    if (exceedsDeclaredSize(request, AUTH_BODY_MAX_BYTES)) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }

    const body: unknown = await request.json();
    if (exceedsSerializedSize(body, AUTH_BODY_MAX_BYTES)) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }

    const token = typeof body === "object" && body !== null && "setupToken" in body && typeof body.setupToken === "string"
      ? body.setupToken
      : "";
    if (!setupTokenMatches(token)) {
      await recordFailedLogin(clientAddress);
      return NextResponse.json({ error: "Setup token is not valid." }, { status: 403 });
    }

    const code = typeof body === "object" && body !== null && "code" in body && typeof body.code === "string"
      ? normalizeAccessCode(body.code)
      : "";

    const policyError = getAccessCodePolicyError(code);
    if (policyError) {
      return NextResponse.json({ error: policyError }, { status: 400 });
    }

    const admin = await prisma.admin.create({
      data: { id: 1, accessCodeHash: await bcrypt.hash(code, 12) }
    }).catch((error: unknown) => {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") return null;
      throw error;
    });

    if (!admin) {
      await recordFailedLogin(clientAddress);
      return NextResponse.json({ error: "Admin setup is already complete. Please sign in." }, { status: 409 });
    }

    const session = await getAdminSession();
    session.adminId = 1;
    session.sessionVersion = admin.sessionVersion;
    await session.save();
    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error("Failed to set up admin account:", error);
    return NextResponse.json({ error: "Admin account could not be set up." }, { status: 500 });
  }
}
