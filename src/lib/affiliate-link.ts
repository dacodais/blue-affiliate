import type { AffiliateProfile } from "@/types/api";

/** Query param that carries the affiliate's slug on public links (e.g. `?affiliate=F6P78S78`). */
export const AFFILIATE_PARAM = "affiliate";

/**
 * BlueDesk still returns referral links as `https://bluecarrental.is?ref=<slug>`.
 * We publish them as `?affiliate=<slug>` instead, so rename the param in place
 * (keeping any other params and their order). Links that already use
 * `affiliate`, or that aren't valid URLs, are returned unchanged.
 */
export function toAffiliateLink(link: string): string {
  try {
    const url = new URL(link);
    if (!url.searchParams.has("ref")) return link;
    const params = new URLSearchParams();
    for (const [key, value] of url.searchParams) {
      if (key === "ref") {
        if (!params.has(AFFILIATE_PARAM)) params.set(AFFILIATE_PARAM, value);
      } else if (key !== AFFILIATE_PARAM || !params.has(AFFILIATE_PARAM)) {
        params.append(key, value);
      }
    }
    url.search = params.toString();
    return url.toString();
  } catch {
    return link;
  }
}

export function withAffiliateLink(affiliate: AffiliateProfile): AffiliateProfile {
  return { ...affiliate, affiliateLink: toAffiliateLink(affiliate.affiliateLink) };
}
