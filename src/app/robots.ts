import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/resume"],
        disallow: ["/cms-panel", "/cms-panel/", "/admin", "/admin-dashboard", "/api/"]
      }
    ],
    sitemap: undefined
  };
}
