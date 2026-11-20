import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Receives Content-Security-Policy violation reports from the browser.
 *
 * When a resource is blocked by CSP, the browser POSTs a JSON report here.
 * This lets you detect attempted XSS attacks and misconfigured policies.
 *
 * Reports are logged to the server console. In production, forward these
 * to a log aggregation service (Datadog, Loki, etc.) for monitoring.
 */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (typeof body === "object" && body !== null && "csp-report" in body) {
      const report = body["csp-report"] as Record<string, unknown>;
      const blockedUri = typeof report["blocked-uri"] === "string" ? report["blocked-uri"] : "unknown";
      const violatedDirective = typeof report["violated-directive"] === "string" ? report["violated-directive"] : "unknown";
      const documentUri = typeof report["document-uri"] === "string" ? report["document-uri"] : "unknown";

      console.warn(
        `[security] CSP violation at ${new Date().toISOString()}: ` +
        `${violatedDirective} blocked ${blockedUri} on ${documentUri}`
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    // Invalid JSON — ignore malformed reports.
    return new NextResponse(null, { status: 204 });
  }
}
