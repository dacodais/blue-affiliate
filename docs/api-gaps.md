# Blue Desk API — Affiliate Portal Gaps

This doc tracks the changes the affiliate portal (`blue-affiliate`) needs from the Blue Desk API. Each section follows the same structure:

- **What** — the endpoint or field.
- **Why** — what the portal does with it.
- **Shape** — request / response with concrete examples.
- **Current behavior** — the placeholder or fallback the portal renders today.

## Quick reference

| # | Area | Change | Status |
|---|---|---|---|
| 1 | Auth — forgot password | New endpoint | ✅ Shipped (2026-06-30) |
| 2 | Auth — reset password | New endpoint | ✅ Shipped (2026-06-30) |
| 3 | Affiliate profile | Add `commissionPercent` | ✅ Shipped |
| 4 | Dashboard summary | Make change-percent fields required | ✅ Shipped |
| 5 | Total Clicks — conversion rate | Add `conversionChangePercent` | ✅ Shipped |
| 6 | Payouts summary | Add `pendingAmount`, `confirmedMonths` | ✅ Shipped |
| 7 | Bank account | New endpoint pair | ✅ Shipped |
| 8 | Notifications | New endpoint set | ✅ Shipped |
| 9 | Sub-ID performance | New endpoint | ✅ Shipped |
| — | Commission months | New endpoint | ✅ Shipped |
| — | Payout request body | Updated body | ✅ Shipped |

> **Items 1 & 2 (password reset) shipped 2026-06-30.** BlueDesk added `POST /auth/forgot-password`
> and `POST /auth/reset-password` (confirmed at affiliate-api-docs.bluedesk.is). blue-api now proxies
> both (`src/adapters/blue-desk/auth.ts`, `src/routes/v1/affiliate/auth.ts`), and the portal consumes
> them: the login page's "Forgot password?" form calls `api.forgotPassword`, and the new
> `src/app/(auth)/reset-password/page.tsx` (link target `/reset-password?token=…`) calls
> `api.resetPassword`. Forgot-password returns a generic message (no account-existence leak);
> reset-password requires a new password of min 8 chars and surfaces invalid/expired tokens as 400.
>
> **Items 7, 8, 9 wiring (2026-06-22):** blue-api now proxies the BlueDesk bank-account,
> notifications, and sub-id endpoints (`src/adapters/blue-desk/{bank-account,notifications,performance}.ts`,
> routes under `src/routes/v1/affiliate/`), and the portal consumes them (`src/lib/api.ts` +
> `BankAccount.tsx`, `Navbar.tsx`, `performance/page.tsx`, `account/page.tsx`). Note: the spec
> returns `bookings`/`conversionPercent`/`revenue` as **null** for sub-ids until booking
> attribution ships — the table renders `—` for those.

Conventions throughout:

- All endpoints are under `/v1/affiliate/` and return the existing `{ data: ... }` envelope unless stated otherwise.
- Currency amounts are integer ISK, exclusive of VAT, with no thousands separator.
- Dates are ISO 8601 (`YYYY-MM-DD`); timestamps are ISO 8601 with timezone (`YYYY-MM-DDTHH:mm:ssZ`).

---

## 1. Forgot password

**What.** `POST /v1/affiliate/auth/forgot-password`

**Why.** The login page has a "Forgot password?" link that opens a reset-request form ([src/app/(auth)/login/page.tsx](../src/app/(auth)/login/page.tsx)).

**Shape.**

```http
POST /v1/affiliate/auth/forgot-password
{ "email": "jon@example.com" }

→ 200 OK   (always, even when no account matches — don't leak account existence)
```

If a matching account exists, the server should send an email containing a reset link. The link should land on a portal route that calls the reset endpoint below.

**Current behavior.** The submit handler is stubbed — it shows the "Check your email" view after a 400 ms delay without sending anything. Look for the `TODO` in the login page.

---

## 2. Reset password

**What.** `POST /v1/affiliate/auth/reset-password`

**Why.** Pairs with #1 — completes the password reset when the user clicks the email link.

**Shape.**

```http
POST /v1/affiliate/auth/reset-password
{ "token": "<one-time-token-from-email>", "newPassword": "..." }

→ 200 OK            on success
→ 400 Bad Request   if token is invalid / expired (return descriptive error.message)
```

**Current behavior.** No reset page exists yet. The portal will add one once this endpoint and the email template are ready.

---

## 3. Affiliate profile — `commissionPercent`

**What.** Add `commissionPercent: number` to the `AffiliateProfile` object returned by `POST /v1/affiliate/auth/login` (and any future profile-refresh endpoint).

**Why.** Several places in the portal show "Your commission is X%":

- The top stat card on the FAQ page.
- The Commission Tier card on the Account page.

**Shape.**

```ts
// AffiliateProfile, returned in LoginResponse.affiliate
{
  id: string;
  name: string;
  email: string;
  affiliateLink: string;
  commissionPercent: number;  // NEW — e.g. 5 (meaning 5%)
}
```

**Current behavior.** The portal renders the literal string `X%` everywhere this is referenced.

---

## 4. Dashboard summary — required change-percent fields

**What.** `GET /v1/affiliate/dashboard/?from=…&to=…`

The dashboard cards show "+X% from last month" on **every** card (Total Bookings, Total Revenue, Expected Commission, Total Clicks — and the Total Deliveries / Total Commission variants on the delivery tab). Today only `totalBookings.changePercent` is required; the rest are optional and frequently missing.

**Why.** The portal needs the change-percent line on every card to render the design correctly. When the value is missing the card shows `+0% from last month`, which is misleading.

**Shape.** Make the following fields **required** (signed integer or float, sign handled by the client):

```ts
{
  totalRevenue.changePercent: number;        // currently optional
  expectedCommission.changePercent: number;  // currently optional
  totalClicks.changePercent: number;         // currently optional
  totalBookings.changePercent: number;       // already required, no change
}
```

Convention matches the existing `totalBookings.changePercent`.

**Current behavior.** The portal falls back to `0` and renders `+0% from last month` (in muted gray), which is indistinguishable from a real "no change" reading.

---

## 5. Total Clicks — `conversionChangePercent`

**What.** Add `totalClicks.conversionChangePercent: number` to the dashboard response.

**Why.** The Performance page has an "Avg Conversion Rate" stat card that uses `totalClicks.conversionPercent` as the value. The card also needs a month-over-month change underneath it ("±X.X% vs last month"), and there's no field for that today.

**Shape.**

```ts
{
  totalClicks: {
    value: number;
    conversionPercent: number;        // existing — keep
    changePercent: number;            // existing (see #4) — clicks change MoM
    conversionChangePercent: number;  // NEW — conversion rate change MoM, signed
  }
}
```

**Current behavior.** The card shows `+0.0% vs last month` as a placeholder.

---

## 6. Payouts summary — `pendingAmount` and `confirmedMonths`

**What.** Add two fields to the `GET /v1/affiliate/payouts/` response.

**Why.** The Request Payout page has two summary cards above the months table:

- **Available for Payout** — currently uses `availableBalance` (no change).
- **Pending Confirmation** — currently has nothing to render and shows `-`.

The Available card also displays "{N} confirmed months" as a subtitle.

**Shape.**

```ts
{
  availableBalance: number;            // existing
  pendingAmount: number;               // NEW — total commission from bookings whose deliveries
                                       //       are still outstanding (sum of pending months).
  confirmedMonths: number;             // NEW — count of months with all deliveries closed
                                       //       contributing to availableBalance.
  history: PayoutRecord[];             // existing
}
```

**Current behavior.** Both fields are typed as optional on the client; missing values render `-` for pending and `0 confirmed months` for the count.

---

## 7. Affiliate bank account

**What.** Two new endpoints for the affiliate's payout bank account.

**Why.** Two places in the portal show this data:

- The sidebar **Bank Account** card on the Request Payout page (read + edit).
- The **Bank Account Details** card on the Account page (read-only).

**Shape.**

```http
GET /v1/affiliate/bank-account/
→ {
    "holderName": "Jón Sigurðsson",
    "bankName": "Landsbankinn",
    "iban": "0133-26-654321",
    "swift": "NBIIISREXXX" | null   // optional; null when not provided
  }

PUT /v1/affiliate/bank-account/
{
  "holderName": string,
  "bankName": string,
  "iban": string,
  "swift": string | null
}
→ 200 OK with the updated record (same shape as GET).
```

Validation: server is the source of truth for IBAN format / required fields — return 400 with descriptive `error.message` on validation failures so the client can surface it directly.

**Current behavior.** The sidebar uses fake defaults and the Save Changes button is a no-op. The Account page card uses hardcoded values. Look for the `// FAKE DATA` comment in [src/components/BankAccount.tsx](../src/components/BankAccount.tsx).

---

## 8. Notifications

**What.** A new endpoint set for in-app notifications.

**Why.** The bell icon in the navbar opens a notifications popover. Today it renders hardcoded sample data.

**Shape.**

```http
GET /v1/affiliate/notifications/
→ [
    {
      "id": string,
      "title": string,
      "body": string,
      "createdAt": "2026-04-12T09:30:00Z",   // ISO timestamp; client formats "3h ago"
      "read": boolean
    },
    …
  ]

POST /v1/affiliate/notifications/mark-all-read
→ 200 OK

POST /v1/affiliate/notifications/:id/read     (optional; nice-to-have)
→ 200 OK
```

Event types currently shown in the design (for reference — the portal treats them as plain titles and bodies, but the backend may want discriminated event types internally):

- Payout approvals
- Commission milestones
- New marketing material
- Commission confirmations

**Current behavior.** The portal renders hardcoded sample notifications in [src/components/Navbar.tsx](../src/components/Navbar.tsx) — `initialNotifications`.

---

## 9. Sub-ID performance

**What.** `GET /v1/affiliate/performance/sub-ids/?from=YYYY-MM-DD&to=YYYY-MM-DD`

**Why.** The Performance page has a "Performance by Sub-ID" table showing how each tracking tag (`?sub=…`) is performing, broken out by UTM source / medium / campaign. Today the table renders hardcoded sample rows.

**Shape.**

```ts
[
  {
    subId: string;            // the tag the affiliate used (?sub=<value>)
    source: string;           // utm_source captured at click time
    medium: string;           // utm_medium
    campaign: string;         // utm_campaign
    clicks: number;
    bookings: number;
    conversionPercent: number; // bookings / clicks × 100
    revenue: number;           // total revenue attributed in the range, integer ISK
  },
  …
]
```

Sort server-side by revenue descending (or whatever's most useful — the client lets the user re-sort by any column anyway).

**Current behavior.** Hardcoded sample rows in [src/app/(dashboard)/performance/page.tsx](../src/app/(dashboard)/performance/page.tsx) — `sampleSubIdRows`.

---

## ✅ Already shipped

For reference — these landed recently and the portal is fully wired up to them. Listed here so they don't get re-implemented or rolled back accidentally.

### Commission months table

`GET /v1/affiliate/payouts/months` returns `{ months: CommissionMonth[] }`.

- Sorted newest-first.
- Confirmed months embed inline `rentals` (sorted by `startDate` ascending).
- Pending months omit `rentals`.
- A month is `confirmed` iff `deliveriesClosed === deliveriesTotal && deliveriesTotal > 0`.

Wired up in [src/app/(dashboard)/payout/page.tsx](../src/app/(dashboard)/payout/page.tsx) via `api.getPayoutMonths()`.

### Payout request body

`POST /v1/affiliate/payouts/request` accepts `{ monthIds: string[] }`. Server validates that:

- All `monthIds` belong to the affiliate's eligible set.
- All referenced months are confirmed.
- Summed commission ≥ 50,000 ISK (constant in `src/domain/services/affiliate.ts`).

Returns 400 with a client-surfaceable `error.message` on violations.

### Login — `rememberMe`

`POST /v1/affiliate/auth/login` accepts an optional `rememberMe: boolean` (default `false`) and adjusts the JWT TTL: 8 hours if false / unset, 30 days if true.

---

## Temporarily disabled UI

### Booking Types Distribution (dashboard) — DISABLED 2026-07-01

The "Booking Types Distribution" card on the dashboard Booking Data tab is
**commented out** in [src/app/(dashboard)/page.tsx](../src/app/(dashboard)/page.tsx).

**Why:** the Standard/Premium/Luxury buckets are a keyword heuristic on Caren's
vehicle class names (`Vehicle.Class` contains "luxury"/"premium"/etc.), which may
misclassify — we're not confident how it should be categorised yet. The API still
returns `bookingTypeDistribution`, so re-enabling is just uncommenting the block
(and its import / skeleton are still present).

**To re-enable:** uncomment the `<BookingTypesDistribution>` block once the
classification is agreed.
