# SwiftLogix

**Delivering More, Faster.** A multi-role logistics and delivery management frontend for the Nigerian market, with a public marketing site and four connected portals: customer, rider, logistics partner and super admin.

This is a **frontend-only demonstration build**. There is no backend. All data lives in a central mock data service and is persisted to the browser's `localStorage` so that every action produces a visible, lasting result across portals.

> **Security notice:** authentication, sessions and stored data in this build are for demonstration only. Passwords are stored in plain text in `localStorage`, there is no server-side validation and nothing here is production security. Replace the auth and data services before handling real users.

---

## Quick start

Requirements: Node.js 20.9 or newer (tested on Node 22) and npm 10+.

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

Type check only: `npm run typecheck`

No environment variables are required. `.env.example` lists placeholders for future map and API integration.

---

## Demo accounts

Open **/auth/login** and click a role in the demo panel, or sign in with email and password. Every demo account uses the password `demo1234`.

| Role | Email | Lands on |
| --- | --- | --- |
| Customer | customer@swiftlogix.ng | `/customer` |
| Rider | rider@swiftlogix.ng | `/rider` |
| Logistics partner | partner@swiftlogix.ng | `/partner` |
| Super admin | admin@swiftlogix.ng | `/admin` |

All roles share one dataset in your browser, so a booking made as the customer shows up in the rider's job list, the partner's incoming requests and the admin's delivery table. Reset everything from **Settings → Demo data → Reset demo data** in any portal.

---

## A 5-minute demo script

1. **Customer** books a delivery at `/customer/book` (5 steps, live price). Note the 4-digit PIN on the confirmation page.
2. **Rider** goes to **Available jobs**, accepts the new booking, then taps through *Head to pickup → Confirm pickup → Start delivery → I've arrived*.
3. The rider taps **Enter delivery PIN**. A wrong PIN is rejected; the correct PIN marks the shipment delivered and credits the rider's balance. (The PIN dialog has a "Demo: show PIN" helper.)
4. Open `/track?ref=SLX-XXXXXX` (no login needed) to see the updated timeline.
5. **Rider** requests a payout at `/rider/payouts`; **Admin** approves and pays it at `/admin/payouts`.
6. **Partner** accepts an incoming request at `/partner/deliveries`, assigns a rider at `/partner/assignments`, registers a vehicle at `/partner/fleet`.
7. **Admin** approves a pending rider or company, changes rates at `/admin/pricing` (the public estimator and booking flow use the new rates immediately), and reviews everything in **Audit logs**.

---

## What's included

### Public website
Home, About, Services, How It Works, Pricing (live estimator), Contact (validated form), Track Shipment, Login and Registration.

### Authentication and onboarding
- Login with a demo account selector
- Account-type chooser, customer registration, **multi-step** rider registration (personal details and photo, location, vehicle, documents with previews, review) and **multi-step** logistics company registration (account, CAC and business details, operating states and services, documents, review)
- Forgot password, reset password (6-digit code shown in a "demo inbox"), email verification and account verification status

### Customer portal (`/customer`)
Overview with stats and charts, 5-step booking with saved-address autofill and package photo upload, confirmation page with shareable PIN, shipments table (search, status filters, sorting, pagination, CSV export), shipment details with simulated tracking map and timeline, cancel when permitted, tracking, saved addresses (add, edit, delete, default pickup), payments with downloadable/printable receipts and payment retry, support tickets with threaded replies, notifications, profile and settings.

### Rider portal (`/rider`) — mobile first
Availability toggle (online, busy, offline), active delivery card, available jobs with location, distance and type filters, the full 8-step delivery workflow with sticky mobile action bar, call/text/navigate actions, **4-digit PIN validation** against the shipment, delivery history, earnings with weekly and 8-week charts, payouts with bank account management, document verification with re-upload, profile and settings. A bottom tab bar appears on phones.

### Logistics partner portal (`/partner`)
Overview (revenue, riders, fleet utilisation, success rate, activity), deliveries with tabs for incoming requests, pending assignment, active, completed and all, delivery details with revenue split, fleet management (register, edit, remove, set availability), rider management (add, verify, assign vehicle, suspend, profile with documents and activity), assignment board, weekly settlements, per-delivery transactions with CSV export, analytics and company profile.

### Super admin portal (`/admin`)
Overview KPIs with period deltas, revenue analytics, volume chart, status distribution, activity feed, recent deliveries/transactions/registrations. Management screens for deliveries (assign using ranked mock logic, cancel with reason), customers (profile, history, suspend/reactivate), riders (verification queue, document preview, approve/reject with reason, suspend), logistics partners (application review, documents, fleet, performance), fleet, payments (refund, re-verify), payouts (approve, reject, mark paid), **pricing configuration with a live simulator**, reports (revenue, deliveries, rider performance, customer growth, partner performance, CSV export), support tickets, notifications, audit logs and platform settings (auto-assign riders, verification requirement, job limits, maintenance banner).

---

## Architecture

```
app/
  (public)/            marketing site: home, about, services, how-it-works, pricing, contact, track
  auth/                login, register (customer | rider | partner), forgot/reset password, verify email, account verification
  customer/ rider/ partner/ admin/   role portals, each wrapped by DashboardShell(role)
components/
  branding/            Logo, LogoMark, Wordmark (full, icon, white, compact)
  layout/              DashboardShell (sidebar, top bar, search, notifications, profile menu, mobile drawer and tab bar), public header/footer
  navigation/          per-role navigation config
  ui/                  design-system primitives (Button, Input, Field, Card, Badge, Dialog, Sheet, Dropdown, Popover, Tabs, Switch, Checkbox, Progress)
  tables/              generic DataTable and ShipmentTable
  charts/              TrendChart, BarsChart, DonutChart (Recharts)
  tracking/            ShipmentTimeline, DeliveryProgress, TrackingMap (simulated), TrackingResult
  dialogs/             ConfirmDialog, AssignRiderDialog (ranked matching), DeliveryPinDialog
  dashboard/           shared portal features: shipment detail, account/settings, support, rider workflow, rider profile, vehicle dialog
  forms/               StateSelect, LgaInput, FileUpload with previews, Stepper, onboarding frame
  marketing/           hero visual, sections, estimator, contact form, content data
lib/
  mock-data/           seed.ts (deterministic seeded generator), nigeria.ts (37 states, LGAs, real addresses)
  services/            store.ts (Zustand + persist, all actions), selectors.ts, location.ts, receipt.ts
  calculations/        pricing.ts (pure pricing engine), distance.ts (simulated road distance)
  validations/         Zod schemas (Nigerian phone, CAC, plate number, NUBAN, etc.)
  constants.ts         status maps, labels and tones
  utils/               formatting (₦, dates, phone), CSV, downloads
hooks/                 use-auth, use-shipments, use-notifications, use-hydrated, use-partner-fleet
types/                 auth, shipment, rider, partner, payment, vehicle, common
```

**State.** A single Zustand store (`lib/services/store.ts`) holds every entity and exposes intention-revealing actions (`createShipment`, `acceptJob`, `advanceShipment`, `confirmDelivery`, `assignRider`, `reviewRider`, `requestPayout`, `updatePricing`, …). Actions enforce business rules (status order, PIN match, cancellation window, rider capacity, verification, plate uniqueness) and write notifications and audit logs. UI components never mutate data directly.

**Persistence.** The store is persisted under the `swiftlogix-demo-v1` key. Data-driven UI renders after hydration (`useHydrated`) to avoid server/client mismatches.

**Mock data.** `createSeedData()` generates about 270 shipments over six months, 13 customers, 26 riders, 7 partners, ~30 vehicles, transactions, payouts, tickets and audit logs using a seeded PRNG, so the data is consistent on every reset. Dashboard statistics are derived from this data, not hard-coded.

**Pricing.** `calculatePrice()` is a pure function used by booking, the public estimator, seed data and the admin simulator. Inputs: distance, intercity flag, weight × quantity, fragile, delivery type. Config is editable at `/admin/pricing`.

### Swapping in a real backend
Keep the action signatures and replace their bodies with API calls (for example with TanStack Query or server actions). Components already depend only on the store's actions and selectors. Suggested order: auth → shipments → riders/partners → payments.

### Maps and tracking
`TrackingMap` draws a polished **simulated** route and labels it "Simulated route. Not live GPS." Rider position comes from `lib/services/location.ts`, which derives progress from shipment status and elapsed time. To go live:
1. Set `NEXT_PUBLIC_MAP_PROVIDER` and the matching key in `.env.local`.
2. Replace `estimateDistanceKm` with a Distance Matrix / Directions call.
3. Replace `getRiderPosition` with a subscription to a rider-location service (WebSocket or SSE) and render the coordinates in a Google Maps or Mapbox adapter.

Rider "Navigate" buttons open Google Maps directions in a new tab; no API key is needed for that.

---

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript 5.9 · Tailwind CSS 4 · shadcn/ui-style components on Radix primitives (`radix-ui`) · Lucide icons · Recharts 3 · React Hook Form 7 + Zod 4 · Framer Motion · Zustand 5 · date-fns 4 · Sonner toasts · Plus Jakarta Sans (self-hosted via Fontsource, no network needed at build time).

## Design notes

- Brand colours are defined once as Tailwind theme tokens in `app/globals.css` (`navy`, `emerald`, `amber`, `surface`, `ink`, `muted`, `line`, `danger`, …).
- The hero scene is an SVG illustration (branded van, Lagos-style skyline with the cable-stayed bridge, live tracking card). To use photography instead, add images under `public/images/` and swap them into `components/marketing/hero-visual.tsx`.
- Tables switch to card layouts on phones; the rider and customer portals add a bottom tab bar; the rider delivery screen has a sticky primary action.
- Motion is limited to short fades and respects `prefers-reduced-motion`.

## Known limitations

- No real payments, emails, SMS or GPS. These are simulated and labelled as such in the UI.
- Uploaded images are downscaled and stored in `localStorage`; PDFs are kept as file names only.
- Data is per-browser. Clearing site data or using a private window starts from the seed data.
#   l o g i s t i c s  
 