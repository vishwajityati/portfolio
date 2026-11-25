import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security-headers";

const noStoreHeaders = [
  { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
  { key: "Pragma", value: "no-cache" }
];

const nextConfig: NextConfig = {
  agentRules: false,
  poweredByHeader: false,

  // The app does not use next/image. Disabling the optimizer removes the
  // /_next/image attack surface entirely (including SVG-processing CVEs).
  images: {
    unoptimized: true,
    dangerouslyAllowSVG: false
  },

  allowedDevOrigins: [
    "*.trycloudflare.com",
  ],

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders.map(({ key, value }) => ({ key, value }))
      },
      {
        // The dashboard must never be indexed or cached.
        source: "/cms-panel/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
          ...noStoreHeaders
        ]
      },
      {
        // HTML pages must never be cached by a proxy or CDN.
        source: "/:path*",
        headers: [
          ...noStoreHeaders,
          { key: "X-Robots-Tag", value: "noarchive" }
        ]
      },
      {
        // Auth and mutation responses must never be cached by a proxy or CDN.
        source: "/api/:path*",
        headers: noStoreHeaders
      }
    ];
  },

  async redirects() {
    return [
      { source: "/admin", destination: "/", permanent: false },
      { source: "/admin/", destination: "/", permanent: false },
      { source: "/admin-dashboard", destination: "/", permanent: false },
      { source: "/admin-dashboard/", destination: "/", permanent: false }
    ];
  }
};

export default nextConfig;
