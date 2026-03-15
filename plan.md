# Job Pricing Engine + Stripe Connect Payment Flow

## Overview

Shippers set a price when posting a job (guided by a smart suggestion). Platform collects payment, deducts the driver's tier-based platform fee (Free=12%, Standard=6%, Pro=0%), and pays the driver via Stripe Connect.

---

## Phase 1: Pricing Engine + Schema

### 1a. Database Changes (`prisma/schema.prisma`)

Add to **Job** model:
- `priceCents Int` — shipper-set price in cents
- `suggestedPriceCents Int?` — platform suggestion for analytics
- `platformFeeCents Int?` — fee deducted
- `driverPayoutCents Int?` — net to driver
- `platformFeePercent Float?` — fee % applied (12, 6, or 0)
- `pricingBreakdown Json?` — full breakdown for auditing
- `paymentIntentId String?` — Stripe PaymentIntent ID
- `paymentStatus String?` — pending | captured | transferred | refunded
- `transferId String?` — Stripe Transfer ID

Add to **Driver** model:
- `stripeConnectAccountId String? @unique`
- `stripeConnectOnboarded Boolean @default(false)`

New **Payment** model for detailed ledger tracking (jobId, amounts, Stripe IDs, status, timestamps).

### 1b. Pricing Algorithm (`lib/pricing.ts` — NEW)

**Layered multiplier model**, not a naive base+per-mile formula:

```
suggestedPrice = baseCost(distance, duration)
                 × packageMultiplier
                 × urgencyMultiplier
                 × timeOfDayMultiplier
                 × routeComplexityFactor
                 × regionMultiplier
```

**Base cost curve (non-linear):**
- `baseCost = MINIMUM_FARE + distance^0.85 × BASE_RATE_PER_KM + duration × TIME_COST_PER_MIN`
- The 0.85 exponent means short trips cost more per-km (driver still commutes to pickup), long trips taper — reflects real economics
- `MINIMUM_FARE` (~$5) ensures short trips are worth the driver's time
- Duration component captures traffic-heavy routes where km is short but time is long

**Package multiplier:**
- ENVELOPE/SMALL: 1.0 | MEDIUM: 1.15 | LARGE: 1.40 | PALLET: 1.80

**Urgency multiplier:**
- STANDARD: 1.0 | EXPRESS: 1.45 | CRITICAL: 2.0

**Time-of-day / day-of-week:**
- Weekday rush (7-9a, 5-7p): 1.20
- Evening (7-10p): 1.10
- Late night (10p-6a): 1.30 (fewer drivers)
- Weekend day: 1.10 | Weekend night: 1.25
- Normal hours: 1.0

**Route complexity factor:**
- Ratio of actual route distance to haversine straight-line distance
- Ratio > 1.6 (dense urban): 1.15
- Ratio > 1.4: 1.08
- Ratio ≤ 1.3 (highway): 1.0
- Captures "10 km on I-95" vs "10 km through downtown Manhattan"

**Region multiplier:**
- Lat/lng bounding-box lookup table for metro areas
- NYC/SF/LA: 1.20–1.35 | Mid-tier metros: 1.05–1.15 | Default: 1.0
- Config constant, easy to adjust without code changes

**Output:**
```typescript
interface PriceSuggestion {
  suggestedPrice: number;          // cents, rounded to nearest 50¢
  breakdown: { baseCost, packageMult, urgencyMult, timeMult, complexityFactor, regionMult };
  priceRange: { min: number; max: number };  // 70%–140% of suggested
}
```

### 1c. Price Estimate Endpoint (`app/api/jobs/price-estimate/route.ts` — NEW)

- Accepts pickup/dropoff coords, package size, urgency
- Calls `optimizeRoute()` (Terra API — already integrated) for distance/duration
- Runs pricing engine
- Returns suggestion + breakdown + acceptable range

### 1d. Job Validation Update (`lib/validations/job.ts`)

- Add `priceCents` (required Int) to `createJobSchema`
- Add `priceEstimateSchema` for the estimate endpoint

### 1e. Job Creation Update (`app/api/jobs/route.ts`)

- Accept `priceCents` in POST body
- Store `priceCents`, `suggestedPriceCents`, `pricingBreakdown` on Job
- Create Stripe PaymentIntent with `capture_method: 'manual'` (authorize only)
- Store `paymentIntentId`, set `paymentStatus = 'authorized'`

---

## Phase 2: Stripe Connect Integration

### 2a. Stripe Helpers (`lib/stripe.ts`)

Add:
- `PLATFORM_FEE_PERCENT` map: `{ FREE: 12, STANDARD: 6, PRO: 0 }`
- `createConnectAccount(email, name)` — Express account
- `createAccountLink(accountId, refreshUrl, returnUrl)` — onboarding link
- `createJobPaymentIntent(customerId, amountCents, jobId)` — manual-capture PI
- `captureJobPayment(paymentIntentId)` — capture authorized payment
- `transferToDriver(amountCents, connectAccountId, jobId)` — transfer payout
- `cancelJobPayment(paymentIntentId)` — cancel on job cancellation

### 2b. Connect Onboarding Endpoints (NEW)

- `POST /api/stripe/connect/onboard` — creates Express account, returns onboarding URL
- `GET /api/stripe/connect/status` — checks onboarding completion

### 2c. Webhook Updates (`app/api/webhooks/stripe/route.ts`)

Handle new events:
- `account.updated` — mark driver as `stripeConnectOnboarded: true`
- Payment lifecycle events for logging

---

## Phase 3: Payment Flow in Job Lifecycle

### 3a. Dispatch Match (`app/api/jobs/[id]/dispatch/route.ts`)

After matching a driver:
- Look up driver's `subscriptionTier`
- Calculate: `platformFeeCents = priceCents × feePercent / 100`
- Calculate: `driverPayoutCents = priceCents - platformFeeCents`
- Store both on the Job record
- Filter out drivers without `stripeConnectOnboarded: true`

### 3b. Job Status Transitions (`app/api/jobs/[id]/route.ts`)

On **DELIVERED**:
- `stripe.paymentIntents.capture(paymentIntentId)` — charge shipper
- `stripe.transfers.create({ amount: driverPayoutCents, destination: connectAccountId })` — pay driver
- Update Payment record → `transferred`

On **CANCELLED**:
- `stripe.paymentIntents.cancel(paymentIntentId)` — release hold
- Update Payment record → `cancelled`

---

## Phase 4: UI Changes

### 4a. Job Post Form (`components/jobs/job-post-form.tsx`)

Extend from 5 steps to 6: Pickup → Dropoff → Package → Urgency → **Pricing** → Review

New Pricing step:
- Fires `POST /api/jobs/price-estimate` when reached
- Shows: "Suggested Price: $XX.XX" with breakdown
- Editable price input pre-filled with suggestion
- Range indicator: "Drivers typically accept $XX – $XX for this route"
- Warning if shipper's price is below min range

### 4b. Job Card (`components/jobs/job-card.tsx`)

- Shippers see: job price they set
- Drivers see: net payout after platform fee

### 4c. Driver Job Detail (`app/driver/jobs/[id]/page.tsx`)

Add payout breakdown:
- "Job Price: $XX.XX"
- "Platform Fee (X%): −$X.XX"
- "Your Payout: $XX.XX"

### 4d. Driver Earnings Page (`app/driver/earnings/page.tsx`)

Replace "payments handled directly" notice with real earnings:
- Weekly / Monthly / All-time totals in dollars
- Earnings column in job history table
- New API: `GET /api/drivers/earnings` aggregating `driverPayoutCents`

### 4e. Driver Onboarding (`app/driver/onboarding/page.tsx`)

Add Stripe Connect setup step — driver links bank account before receiving dispatches.

### 4f. Shipper Job Detail (`app/shipper/jobs/[id]/page.tsx`)

Show payment status: Authorized → Captured → Transferred

---

## Phase 5: Supporting Infrastructure

- `app/api/drivers/earnings/route.ts` — NEW — earnings summary endpoint
- `lib/validations/stripe.ts` — add Connect onboarding schemas

---

## Key Design Decisions

1. **All prices in cents (integers)** — no floating-point rounding issues
2. **Manual-capture PaymentIntent** — shipper's card authorized at job post, charged only on delivery. Protects both sides.
3. **Fee calculated at match time** — because it depends on which driver (and their tier) gets matched. Shipper sees total; driver sees net.
4. **Separate Charges and Transfers** (not Destination Charges) — platform collects full amount, transfers driver's portion. Full control over refunds.
5. **Connect onboarding as dispatch prerequisite** — unboarded drivers filtered out of matching.
6. **Pricing algo is server-side only** — clients see suggested price + readable breakdown, never raw multipliers.
7. **Authorization window** — Stripe authorizes for 7 days (extendable to 31). Jobs unmatched past this window need re-authorization.

---

## Files Changed/Created (in order)

| # | File | Action |
|---|------|--------|
| 1 | `lib/pricing.ts` | CREATE — pricing engine |
| 2 | `prisma/schema.prisma` | MODIFY — Job pricing fields, Payment model, Driver Connect fields |
| 3 | `lib/validations/job.ts` | MODIFY — add priceCents, price estimate schema |
| 4 | `app/api/jobs/price-estimate/route.ts` | CREATE — suggestion endpoint |
| 5 | `components/jobs/job-post-form.tsx` | MODIFY — add Pricing step |
| 6 | `app/api/jobs/route.ts` | MODIFY — accept price, create PaymentIntent |
| 7 | `lib/stripe.ts` | MODIFY — Connect helpers, PI helpers, fee constants |
| 8 | `lib/validations/stripe.ts` | MODIFY — Connect schemas |
| 9 | `app/api/stripe/connect/onboard/route.ts` | CREATE |
| 10 | `app/api/stripe/connect/status/route.ts` | CREATE |
| 11 | `app/api/webhooks/stripe/route.ts` | MODIFY — new event handlers |
| 12 | `app/api/jobs/[id]/route.ts` | MODIFY — capture/transfer on delivery, cancel on cancel |
| 13 | `app/api/jobs/[id]/dispatch/route.ts` | MODIFY — fee calc, Connect filter |
| 14 | `components/jobs/job-card.tsx` | MODIFY — price display |
| 15 | `app/driver/jobs/[id]/page.tsx` | MODIFY — payout breakdown |
| 16 | `app/driver/jobs/page.tsx` | MODIFY — payout on cards |
| 17 | `app/driver/earnings/page.tsx` | MODIFY — real earnings |
| 18 | `app/driver/onboarding/page.tsx` | MODIFY — Connect setup step |
| 19 | `app/shipper/jobs/[id]/page.tsx` | MODIFY — payment status |
| 20 | `app/shipper/post/page.tsx` | MODIFY — handle price from form |
| 21 | `app/api/drivers/earnings/route.ts` | CREATE — earnings aggregation |
