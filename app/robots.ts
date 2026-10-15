import type { MetadataRoute } from "next";

// NFR-03: tell every crawler to stay away.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
