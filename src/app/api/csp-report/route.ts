import { NextRequest, NextResponse } from "next/server";
import { exceedsDeclaredSize, exceedsSerializedSize } from "@/lib/security";

export const dynamic = "force-dynamic";

const MAX_REPORT_BYTES = 16_000;
const MAX_LOG_VALUE_LENGTH = 300;

/**
 * Receives Content-Security-Policy violation reports from the browser.
 *
 * Reports are logged to the server console. In production, forward these to a
 * log aggregation service (Datadog, Loki, etc.) for monitoring. Reports are
 * untrusted input: size is capped and log fields are sanitised before use.
 */
function logValue(value: unknown): string {
  if (typeof value !== "string") return "unknown";
  const sanitized = value.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  return sanitized ? sanitized.slice(0, MAX_LOG_VALUE_LENGTH) : "unknown";
}

export async function POST(request: NextRequest) {
  try {
    if (exceedsDeclaredSize(request, MAX_REPORT_BYTES)) {
      return new NextResponse(null, { status: 204 });
    }

    const body: unknown = await request.json();
    if (exceedsSerializedSize(body, MAX_REPORT_BYTES)) {
      return new NextResponse(null, { status: 204 });
    }

    const reportContainer = typeof body === "object" && body !== null && "csp-report" in body
      ? body["csp-report"]
      : null;
    if (typeof reportContainer === "object" && reportContainer !== null && !Array.isArray(reportContainer)) {
      const report = reportContainer as Record<string, unknown>;
      const blockedUri = logValue(report["blocked-uri"]);
      const violatedDirective = logValue(report["violated-directive"]);
      const documentUri = logValue(report["document-uri"]);

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
