# Affiliate Commission Calculation — spec & status

The authoritative formula (from the legacy `affiliate-dashboard.cshtml` + Blue's clarification on road tax).

## Formula

```
per reservation:
  base = TotalPrice − AdditionalChargesPrice − roadTax
         where roadTax = sum of the Extras items with Id 2102, 1662 or 1663

revenue    = round( base ÷ 1.24 )                  // strip 24% VAT
commission = round( revenue × ratePercent / 100 )   // then apply rate
```

- **Exclude `Cancelled` reservations** (legacy counts only `StatusText === "Reservation"`).
- Attribute a reservation to the month of its **dropoff** (`DateTo`).
- "Confirmed" month = all deliveries closed (Caren `EndedDate` is set on every reservation).
- Min payout threshold: **50,000 ISK**.

## Where each value comes from in Caren

| Value | Source |
|---|---|
| `TotalPrice` (all-in) | reservation `getlist` **and** `getitem` |
| `AdditionalChargesPrice` | rentalapi `getlist` (per legacy). **Not** present in the vehicleapi `getitem` type we have — needs confirming for whichever endpoint we use. |
| Road tax (Extra 2102) | reservation **`getitem`** → `Extras: Array<{ Id; Name; Quantity?; TotalPrice? }>` → item with `Id === 2102`, take `TotalPrice` |
| `Guid` (needed to call `getitem`) | rentalapi `getlist` has it; the **vehicleapi `getlist` we currently use does not** |

## ✅ Implemented — rentalapi-only (blue-api, 2026-06-23)

Decisions settled: **we** own the amount; **strip 24% VAT**; **rentalapi is the single Caren source** for the whole affiliate path (vehicleapi dropped); "finished/confirmed" = Caren **`EndedDate`** (was an odometer check until 2026-08-26 — see below).

The rentalapi `getlist` payload carries everything in the list itself — `TotalPrice`, `AdditionalChargesPrice` (nullable), per-line-item `Extras` (road tax = `Id 2102`), `OdometerBefore`/`OdometerAfter`, `Guid`, `StatusText`/`CancelledDate`, `Vehicle.Class`, dates. So **no `getitem` calls, no vehicleapi, no merge.**

Implementation (`src/domain/services/affiliate.ts`):
- `getAffiliateRentalReservations` (rentalapi `getlist`, `Affiliate` filter + pagination) → cached via `getCachedRentalReservations`. The **only** Caren call on the affiliate path — read-only.
- `revenueOf(r) = round((TotalPrice − (AdditionalChargesPrice?.TotalPrice ?? 0) − Σ Extras[Id ∈ {2102, 1662, 1663}].TotalPrice) ÷ 1.24)` — **ex-VAT**.
- **Road tax ids (2026-08-26):** `2102` "Road Tax (Government tax)" is current; `1662`/`1663` "Road Tax" are the retired ids it replaced around Dec 2025 and still appear on older bookings, which remain in scope while the rolling 12-month window reaches back that far. All matching lines are summed — a booking can carry both. Blue has not yet confirmed whether Caren exposes a category we could key on instead of hardcoded ids; until then this list needs updating whenever Caren retires or adds a road-tax extra.
- `commissionFor(revenue, rate) = round(revenue × rate/100)`.
- **VAT is stripped in `revenueOf`, not in `commissionFor` (2026-08-26).** The payout table shows revenue, rate and commission side by side, so `revenue × rate% = commission` must hold exactly; previously revenue was reported VAT-inclusive against a VAT-stripped commission and 265 of 266 rows did not add up. Effect on commission paid: ≤1 ISK per reservation.
- **`isFinished(r) = EndedDate != null`** (2026-08-26) — Caren added `EndedDate` for exactly this. Replaced the odometer pair, which Caren fills in unreliably: 7 of 200 closed rentals had a null or transposed reading and so never became collectible. Drives `deliveriesClosed`/confirmed + `allRentalsEnded`.
- **`cancelledReservationIds`** (`StatusText === "Cancelled"` or `CancelledDate`) excluded from every figure — matches the legacy's keep-only-`"Reservation"`.
- **Dropoff bucketing:** query window widened by 2 months (`widenQueryStart`, since the rentalapi filters by *start* date) and filtered by `DateTo` — matches the legacy's `DateTo` attribution.
- Applied in `computeDashboardMetrics`, `buildCommissionMonth` (→ payout amount), and `getEngagementData`/`getRentalsData`. `Total Revenue` = Σ revenue ex-VAT (excl. additional + road tax) — so it reconciles with `expectedCommission`.

## Resolved during testing (2026-06-23)

- ✅ **Caren filters by affiliate NAME, not id.** All Caren-touching paths (`getDashboardSummary`, `getCommissionMonths`/payouts, `getEngagementData`, `getRentalsData`) now pass `affiliate.name`; Blue Desk calls (clicks, balance/history, commission rate, payout submit) still pass `affiliateId`. Verified with real data (affiliate "Jeannie").
- ✅ **Caren session-invalid handling.** Caren returns an expired/invalid session as **HTTP 200 + `{ Success:false, Code:4003 }`** (not a 401). `rental-client.ts` now detects `Code 4003`, invalidates the cached session, and retries — previously this silently collapsed to an empty list (all-zeros dashboard).

## ⚠️ Caveats

1. **Road tax is a deliberate divergence from the legacy** — the legacy includes road tax in commission; per Blue we exclude it. So the two pages should differ on road-tax bookings (confirmed by user).
2. **Commission rate source:** BlueDesk `GET /commission-rate` currently **404s → blue-api falls back to a 10% stub** (seen in logs). Until Blue ships that endpoint, commission uses 10%, not the affiliate's real CMS `_24` rate — account for this when comparing to the legacy.
3. **`CAREN_BASE_URL`** must point at the same Caren environment whose data you're comparing against (legacy reads prod `booking.caren.is`).

## Confirmed facts
- Road tax = Caren Extra **id 2102**; additional charges do **not** include it (separate buckets).
- `getitem` returns `Extras: Array<{ Id: number; Name: string; Quantity?: number; TotalPrice?: number }>`.
