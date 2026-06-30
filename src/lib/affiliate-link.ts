// ⚠️ TEMPORARY — REVERT BEFORE GO-LIVE.
// The affiliate program isn't live on production yet, so affiliate links are
// rewritten to point at the dev3 staging host instead of the real public host.
// To go live: make `withDevHost` return `link` unchanged (or delete it and pass
// the raw affiliate link at the call sites — LinkCustomizer, Sidebar, Navbar).
const DEV_HOST_OVERRIDE = "dev3.bluecarrental.is";

/** Temporary: rewrites the public bluecarrental.is host to the dev3 staging host. */
export function withDevHost(link: string): string {
  try {
    const url = new URL(link);
    if (url.hostname === "bluecarrental.is" || url.hostname === "www.bluecarrental.is") {
      url.hostname = DEV_HOST_OVERRIDE;
    }
    return url.toString();
  } catch {
    return link;
  }
}
