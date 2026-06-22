import type { MetadataRoute } from "next";

// Private, invite-only affiliate portal — disallow all crawling.
// The authoritative "do not index" signal is the `robots` meta tag set in the
// root layout; this is the complementary crawl-level signal.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
