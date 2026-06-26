# Swift Meds

Real-time medication availability and fast dispensing for Yaoundé, Cameroon.
A Next.js 14 (App Router) web app on top of Supabase (Postgres + PostGIS + Realtime + Storage),
with Google Maps geolocation and Campay (MTN MoMo / Orange Money) payments.

## 1. Stack

- **Frontend/Backend**: Next.js 14 App Router, TypeScript, Tailwind CSS
- **Database/Auth/Storage/Realtime**: Supabase
- **Maps**: Google Maps JavaScript API (`@react-google-maps/api`)
- **Payments**: Campay (Cameroon mobile money aggregator)

## 2. Project structure

```
swift-meds/
├── app/                          # Routes (App Router)
│   ├── (auth)/                   # signin, signup, signup/pharmacy, forgot/reset password, verify
│   ├── search/                   # Medication search + Google Map
│   ├── pharmacy/[pharmacyId]/    # Public pharmacy profile
│   ├── reserve/[pharmacyId]/[medicationId]/   # Reservation + payment form
│   ├── reservation/[reservationId]/           # Reservation status / pickup code
│   ├── dashboard/
│   │   ├── client/               # Client dashboard (overview, reservations, profile)
│   │   ├── pharmacist/           # Pharmacist dashboard (overview, inventory, reservations)
│   │   └── admin/                # Admin dashboard (overview, pharmacies, users)
│   └── api/
│       ├── payments/campay/initiate/route.ts   # Starts a Campay USSD collection
│       ├── payments/campay/webhook/route.ts    # Receives Campay payment confirmations
│       └── notifications/route.ts
├── src/
│   ├── components/                # ui/, layout/, home/, search/, pharmacy/, reservation/, dashboard/*, notifications/
│   ├── hooks/                     # useGeolocation, useDebounce, useUser
│   ├── lib/                       # supabase/{client,server,middleware}.ts, campay.ts, utils.ts, validations.ts
│   └── types/database.types.ts    # Mirrors the SQL schema
├── supabase/schema.sql            # Full DB schema — run this in the Supabase SQL editor
├── middleware.ts                  # Session refresh + role-gated route protection
└── tailwind.config.ts             # White/green pharmacy design system
```

## 3. Setup

### 3.1 Supabase

1. Create a project at https://supabase.com.
2. Open the SQL Editor and run the entire contents of `supabase/schema.sql`. This creates:
   - All enums and tables (users, clients, pharmacists, admins, pharmacies, medications,
     categories, inventory, reservations, payments, reviews, notifications,
     premium_subscriptions, audit_logs).
   - PostGIS-backed `pharmacies.location` kept in sync via trigger.
   - A trigger on `auth.users` that auto-creates the matching `public.users` row (and
     `clients`/`pharmacies`+`pharmacists`/`admins` row) based on `role` in signup metadata.
   - RPC functions: `nearby_pharmacies`, `create_reservation`, `cancel_reservation`,
     `expire_stale_reservations`, `admin_stats`, `pharmacy_stats`.
   - Full Row Level Security policies per role.
   - Storage buckets: `prescriptions` (private), `pharmacy-licenses` (private),
     `avatars` (public), `medication-images` (public).
   - Seed data for 10 medication categories.
3. (Optional, recommended) Schedule `select expire_stale_reservations();` via `pg_cron`
   every 5 minutes to auto-release stock from abandoned reservations:
   ```sql
   select cron.schedule('expire-reservations', '*/5 * * * *', 'select public.expire_stale_reservations();');
   ```
4. To create your first **admin** account: sign up normally, then in the SQL editor run:
   ```sql
   update public.users set role = 'admin' where email = 'you@example.com';
   insert into public.admins (user_id) select user_id from public.users where email = 'you@example.com';
   ```
5. Copy your Project URL, anon key, and service role key into `.env.local` (see `.env.example`).

### 3.2 Google Maps

1. Enable the **Maps JavaScript API** in Google Cloud Console.
2. Create an API key, restrict it to your domain(s), and set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

### 3.3 Campay

1. Create an account at https://www.campay.net and get your `username`/`password` (collection app credentials).
2. Set `CAMPAY_USERNAME`, `CAMPAY_PASSWORD` in `.env.local`.
3. In your Campay dashboard, set the webhook URL to
   `https://yourdomain.com/api/payments/campay/webhook` and configure `CAMPAY_WEBHOOK_SECRET`
   to match.

### 3.4 Run locally

```bash
npm install
cp .env.example .env.local   # then fill in your keys
npm run dev
```

Visit http://localhost:3000.

## 4. Reservation lifecycle (state machine)

```
created → pending → confirmed → ready → collected
              ↘ cancelled            (client/pharmacist initiated)
              ↘ expired              (payment not completed within 2h — auto-released)
```

- `create_reservation()` atomically checks stock, decrements `inventory.quantity`, and inserts
  the reservation with `status = 'pending'` and a 2-hour `expires_at`.
- A successful Campay webhook moves the reservation to `confirmed` and generates a `pickup_code`.
- A failed webhook calls `cancel_reservation()`, which restocks inventory.
- `expire_stale_reservations()` (run on a schedule) restocks and expires anything left pending.

## 5. Pharmacy approval workflow

```
pending → approved → suspended ⇄ approved
              ↘ rejected            (admin decision, with rejection_reason)
              ↘ deleted
```

New pharmacist signups create a `pharmacies` row with `status = 'pending'`. Only `approved`
pharmacies are visible in `/search` and `nearby_pharmacies()` (enforced both by RLS and by the
RPC's `where p.status = 'approved'` filter). Admins approve/suspend/reject from
`/dashboard/admin/pharmacies`.

## 6. Regulatory compliance notes (Cameroon)

- Pharmacy onboarding captures `license_number` (DPML operating license) and the
  pharmacist's ONPC registration number; both are reviewed by an admin before the listing
  goes live.
- Medications flagged `requires_prescription` force a document upload (private
  `prescriptions` storage bucket, access restricted to the uploading user) before a
  reservation can be created.
- `audit_logs` records every insert/update/delete on `reservations` and `pharmacies` for
  non-repudiation (CIANA compliance, Law N°2010/012).
- Footer and reservation flow carry an explicit disclaimer: Swift Meds facilitates
  reservation and pickup only — it does not dispense medication itself.

## 7. Notes on the previous Vite/Express version

The original Back-end/ (Express + custom JWT) and Front-end/ (Vite + React) implementation
shipped earlier in this project's history is superseded by this Next.js app. Supabase Auth
+ RLS replaces the hand-rolled `bcrypt`/JWT auth in `Back-end/services/AuthService.js`, and
Next.js Route Handlers replace the Express routes — the table names, statuses, and business
logic (reservation/payment/inventory flows) were carried over 1:1 from the original models.
