-- =====================================================================
-- SWIFT MEDS — COMPLETE SUPABASE SCHEMA
-- Pharmacy system for real-time medication availability & fast dispensing
-- Yaoundé, Cameroon — aligned with DPML / ONPC / Law 2010/012 requirements
-- =====================================================================
-- Run this file in the Supabase SQL Editor (or via `supabase db push`).
-- It is idempotent: safe to re-run on a fresh project.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. EXTENSIONS
-- ---------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "postgis";

-- ---------------------------------------------------------------------
-- 1. ENUM TYPES
-- ---------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('client', 'pharmacist', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type pharmacy_status as enum ('pending', 'approved', 'suspended', 'rejected', 'deleted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type reservation_status as enum (
    'created', 'pending', 'confirmed', 'ready', 'collected', 'expired', 'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'successful', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('mtn_momo', 'orange_money', 'campay', 'card');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum (
    'reservation', 'payment', 'pharmacy_approval', 'inventory', 'review', 'general'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_plan as enum ('monthly', 'yearly');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 2. CORE TABLE: USERS
-- Mirrors auth.users (1:1). A row is auto-created by a trigger on signup.
-- ---------------------------------------------------------------------
create table if not exists public.users (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  full_name      text not null,
  email          text not null unique,
  phone_number   text,
  address        text,
  date_of_birth  date,
  role           user_role not null default 'client',
  avatar_url     text,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.users is 'Profile data mirroring auth.users, one row per account regardless of role.';

-- ---------------------------------------------------------------------
-- 3. ROLE TABLES
-- ---------------------------------------------------------------------
create table if not exists public.clients (
  client_id      uuid primary key default uuid_generate_v4(),
  user_id        uuid not null unique references public.users(user_id) on delete cascade,
  is_premium     boolean not null default false,
  created_at     timestamptz not null default now()
);

create table if not exists public.pharmacies (
  pharmacy_id      uuid primary key default uuid_generate_v4(),
  name             text not null,
  address          text not null,
  contact_info     text,
  phone            text,
  email            text,
  license_number   text not null,                  -- DPML operating license
  latitude         double precision,
  longitude        double precision,
  location         geography(Point, 4326),          -- PostGIS point, synced via trigger
  opening_hours    jsonb default '{}'::jsonb,        -- {"monday": {"open":"08:00","close":"20:00"}, ...}
  is_24h           boolean not null default false,
  average_rating   numeric(2,1) default 0,
  status           pharmacy_status not null default 'pending',
  is_approved      boolean not null default false,
  rejection_reason text,
  license_doc_url  text,                             -- uploaded proof of DPML license
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.pharmacists (
  pharmacist_id    uuid primary key default uuid_generate_v4(),
  user_id          uuid not null unique references public.users(user_id) on delete cascade,
  pharmacy_id      uuid references public.pharmacies(pharmacy_id) on delete set null,
  license_number   text not null,                    -- ONPC registration number
  is_owner         boolean not null default true,
  created_at       timestamptz not null default now()
);

create table if not exists public.admins (
  admin_id     uuid primary key default uuid_generate_v4(),
  user_id      uuid not null unique references public.users(user_id) on delete cascade,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. CATALOG: CATEGORIES & MEDICATIONS
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  category_id   uuid primary key default uuid_generate_v4(),
  name          text not null unique,
  description   text
);

create table if not exists public.medications (
  medication_id      uuid primary key default uuid_generate_v4(),
  name               text not null,
  generic_name       text,
  description        text,
  dosage             text,
  price              numeric(10,2) not null default 0,
  category_id        uuid references public.categories(category_id) on delete set null,
  requires_prescription boolean not null default false,   -- DPML restricted-drug flag
  is_controlled      boolean not null default false,       -- extra verification layer
  image_url          text,
  created_at         timestamptz not null default now()
);

create index if not exists idx_medications_name_trgm on public.medications using gin (name gin_trgm_ops);
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------
-- 5. INVENTORY (per-pharmacy stock of a medication)
-- ---------------------------------------------------------------------
create table if not exists public.inventory (
  inventory_id    uuid primary key default uuid_generate_v4(),
  pharmacy_id     uuid not null references public.pharmacies(pharmacy_id) on delete cascade,
  medication_id   uuid not null references public.medications(medication_id) on delete cascade,
  quantity        integer not null default 0 check (quantity >= 0),
  low_stock_alert integer not null default 5,
  last_updated    timestamptz not null default now(),
  unique (pharmacy_id, medication_id)
);

create index if not exists idx_inventory_pharmacy on public.inventory (pharmacy_id);
create index if not exists idx_inventory_medication on public.inventory (medication_id);

-- ---------------------------------------------------------------------
-- 6. RESERVATIONS
-- State machine: created -> pending -> confirmed -> ready -> collected
--                                 \-> expired   pending -> cancelled
-- ---------------------------------------------------------------------
create table if not exists public.reservations (
  reservation_id     uuid primary key default uuid_generate_v4(),
  client_id          uuid not null references public.clients(client_id) on delete cascade,
  pharmacy_id        uuid not null references public.pharmacies(pharmacy_id) on delete cascade,
  medication_id      uuid not null references public.medications(medication_id) on delete cascade,
  patient_name       text,
  quantity           integer not null check (quantity > 0),
  total_amount       numeric(10,2) not null default 0,
  status             reservation_status not null default 'created',
  prescription_url   text,                      -- required if medication.requires_prescription
  pickup_code        text,                       -- short code shown at pharmacy counter
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  expires_at         timestamptz
);

create index if not exists idx_reservations_client on public.reservations (client_id);
create index if not exists idx_reservations_pharmacy on public.reservations (pharmacy_id);
create index if not exists idx_reservations_status on public.reservations (status);

-- ---------------------------------------------------------------------
-- 7. PAYMENTS (Campay / mobile money)
-- ---------------------------------------------------------------------
create table if not exists public.payments (
  payment_id              uuid primary key default uuid_generate_v4(),
  reservation_id          uuid not null references public.reservations(reservation_id) on delete cascade,
  amount                  numeric(10,2) not null,
  currency                text not null default 'XAF',
  payment_method          payment_method not null default 'campay',
  status                  payment_status not null default 'pending',
  transaction_reference   text,         -- Campay reference
  external_reference      text,         -- our own idempotency key
  phone_number            text,
  timestamp               timestamptz not null default now()
);

create index if not exists idx_payments_reservation on public.payments (reservation_id);

-- ---------------------------------------------------------------------
-- 8. REVIEWS
-- ---------------------------------------------------------------------
create table if not exists public.reviews (
  review_id     uuid primary key default uuid_generate_v4(),
  client_id     uuid not null references public.clients(client_id) on delete cascade,
  pharmacy_id   uuid not null references public.pharmacies(pharmacy_id) on delete cascade,
  rating        integer not null check (rating between 1 and 5),
  comment       text,
  date          timestamptz not null default now(),
  unique (client_id, pharmacy_id)
);

create index if not exists idx_reviews_pharmacy on public.reviews (pharmacy_id);

-- ---------------------------------------------------------------------
-- 9. NOTIFICATIONS
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  notification_id     uuid primary key default uuid_generate_v4(),
  user_id              uuid not null references public.users(user_id) on delete cascade,
  title                text not null,
  message              text not null,
  notification_type    notification_type not null default 'general',
  is_read              boolean not null default false,
  related_id           uuid,        -- e.g. reservation_id, pharmacy_id
  sent_at              timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications (user_id, is_read);

-- ---------------------------------------------------------------------
-- 10. PREMIUM SUBSCRIPTIONS (client perk tier)
-- ---------------------------------------------------------------------
create table if not exists public.premium_subscriptions (
  subscription_id   uuid primary key default uuid_generate_v4(),
  client_id         uuid not null references public.clients(client_id) on delete cascade,
  plan_type         subscription_plan not null default 'monthly',
  start_date        timestamptz not null default now(),
  end_date          timestamptz not null,
  is_active         boolean not null default true
);

-- ---------------------------------------------------------------------
-- 11. AUDIT LOG (non-repudiation / CIANA compliance)
-- ---------------------------------------------------------------------
create table if not exists public.audit_logs (
  audit_id      uuid primary key default uuid_generate_v4(),
  actor_user_id uuid references public.users(user_id) on delete set null,
  action        text not null,            -- e.g. 'reservation.create', 'pharmacy.approve'
  entity_table  text not null,
  entity_id     uuid,
  metadata      jsonb,
  created_at    timestamptz not null default now()
);

-- =====================================================================
-- 12. TRIGGERS
-- =====================================================================

-- 12.1 updated_at auto-touch
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_users_updated on public.users;
create trigger trg_users_updated before update on public.users
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_pharmacies_updated on public.pharmacies;
create trigger trg_pharmacies_updated before update on public.pharmacies
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_reservations_updated on public.reservations;
create trigger trg_reservations_updated before update on public.reservations
  for each row execute function public.touch_updated_at();

-- 12.2 Auto-create public.users row + role table row when a new auth user signs up.
-- Expects raw_user_meta_data: { full_name, role, phone_number, license_number, pharmacy_name, address }
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role user_role;
  v_pharmacy_id uuid;
begin
  v_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'client');

  insert into public.users (user_id, full_name, email, phone_number, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.email,
    new.raw_user_meta_data->>'phone_number',
    v_role
  );

  if v_role = 'client' then
    insert into public.clients (user_id) values (new.id);

  elsif v_role = 'pharmacist' then
    insert into public.pharmacies (name, address, license_number, phone, status)
    values (
      coalesce(new.raw_user_meta_data->>'pharmacy_name', 'Unnamed Pharmacy'),
      coalesce(new.raw_user_meta_data->>'address', ''),
      coalesce(new.raw_user_meta_data->>'pharmacy_license_number', ''),
      new.raw_user_meta_data->>'phone_number',
      'pending'
    )
    returning pharmacy_id into v_pharmacy_id;

    insert into public.pharmacists (user_id, pharmacy_id, license_number)
    values (new.id, v_pharmacy_id, coalesce(new.raw_user_meta_data->>'license_number',''));

  elsif v_role = 'admin' then
    insert into public.admins (user_id) values (new.id);
  end if;

  return new;
end; $$;

drop trigger if exists trg_handle_new_auth_user on auth.users;
create trigger trg_handle_new_auth_user
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- 12.3 Keep PostGIS `location` in sync with latitude/longitude
create or replace function public.sync_pharmacy_location()
returns trigger language plpgsql as $$
begin
  if new.latitude is not null and new.longitude is not null then
    new.location := ST_SetSRID(ST_MakePoint(new.longitude, new.latitude), 4326)::geography;
  end if;
  return new;
end; $$;

drop trigger if exists trg_sync_pharmacy_location on public.pharmacies;
create trigger trg_sync_pharmacy_location before insert or update of latitude, longitude on public.pharmacies
  for each row execute function public.sync_pharmacy_location();

-- 12.4 Recompute pharmacy.average_rating when a review changes
create or replace function public.refresh_pharmacy_rating()
returns trigger language plpgsql as $$
declare
  v_pharmacy_id uuid;
begin
  v_pharmacy_id := coalesce(new.pharmacy_id, old.pharmacy_id);
  update public.pharmacies
  set average_rating = (
    select round(avg(rating)::numeric, 1) from public.reviews where pharmacy_id = v_pharmacy_id
  )
  where pharmacy_id = v_pharmacy_id;
  return null;
end; $$;

drop trigger if exists trg_reviews_rating on public.reviews;
create trigger trg_reviews_rating after insert or update or delete on public.reviews
  for each row execute function public.refresh_pharmacy_rating();

-- 12.5 Audit logging for sensitive tables
create or replace function public.write_audit_log()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (actor_user_id, action, entity_table, entity_id, metadata)
  values (
    auth.uid(),
    tg_op || '.' || tg_table_name,
    tg_table_name,
    coalesce(new.reservation_id, new.pharmacy_id, old.reservation_id, old.pharmacy_id),
    case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );
  return coalesce(new, old);
end; $$;

drop trigger if exists trg_audit_reservations on public.reservations;
create trigger trg_audit_reservations after insert or update or delete on public.reservations
  for each row execute function public.write_audit_log();

drop trigger if exists trg_audit_pharmacies on public.pharmacies;
create trigger trg_audit_pharmacies after insert or update or delete on public.pharmacies
  for each row execute function public.write_audit_log();

-- =====================================================================
-- 13. BUSINESS-LOGIC FUNCTIONS (RPC)
-- =====================================================================

-- 13.1 Geolocation search — pharmacies within radius, optionally filtered by medication name
create or replace function public.nearby_pharmacies(
  user_lat double precision,
  user_lng double precision,
  radius_meters integer default 10000,
  medication_query text default null
)
returns table (
  pharmacy_id uuid,
  name text,
  address text,
  phone text,
  latitude double precision,
  longitude double precision,
  opening_hours jsonb,
  is_24h boolean,
  average_rating numeric,
  distance_meters double precision,
  matching_medication_id uuid,
  matching_medication_name text,
  matching_price numeric,
  matching_quantity integer
)
language sql stable as $$
  select
    p.pharmacy_id, p.name, p.address, p.phone, p.latitude, p.longitude,
    p.opening_hours, p.is_24h, p.average_rating,
    ST_Distance(p.location, ST_SetSRID(ST_MakePoint(user_lng, user_lat),4326)::geography) as distance_meters,
    m.medication_id, m.name, m.price, i.quantity
  from public.pharmacies p
  left join lateral (
    select i.*, med.name, med.price, med.medication_id
    from public.inventory i
    join public.medications med on med.medication_id = i.medication_id
    where i.pharmacy_id = p.pharmacy_id
      and i.quantity > 0
      and (medication_query is null or med.name ilike '%' || medication_query || '%' or med.generic_name ilike '%' || medication_query || '%')
    order by i.quantity desc
    limit 1
  ) as m(inventory_id, pharmacy_id2, medication_id2, quantity, low_stock_alert, last_updated, name, price, medication_id) on true
  where p.status = 'approved'
    and p.location is not null
    and ST_DWithin(p.location, ST_SetSRID(ST_MakePoint(user_lng, user_lat),4326)::geography, radius_meters)
    and (medication_query is null or m.medication_id is not null)
  order by distance_meters asc;
$$;

-- 13.2 Atomic reservation creation: checks stock, decrements inventory, creates reservation row
create or replace function public.create_reservation(
  p_client_id uuid,
  p_pharmacy_id uuid,
  p_medication_id uuid,
  p_quantity integer,
  p_patient_name text default null,
  p_prescription_url text default null
)
returns public.reservations
language plpgsql security definer set search_path = public as $$
declare
  v_inventory public.inventory;
  v_medication public.medications;
  v_reservation public.reservations;
  v_unit_price numeric;
begin
  select * into v_medication from public.medications where medication_id = p_medication_id;
  if v_medication is null then
    raise exception 'Medication not found';
  end if;

  if v_medication.requires_prescription and p_prescription_url is null then
    raise exception 'A prescription upload is required for this medication';
  end if;

  select * into v_inventory from public.inventory
    where pharmacy_id = p_pharmacy_id and medication_id = p_medication_id
    for update;

  if v_inventory is null or v_inventory.quantity < p_quantity then
    raise exception 'Insufficient stock at this pharmacy';
  end if;

  update public.inventory
    set quantity = quantity - p_quantity, last_updated = now()
    where inventory_id = v_inventory.inventory_id;

  v_unit_price := v_medication.price;

  insert into public.reservations (
    client_id, pharmacy_id, medication_id, patient_name, quantity,
    total_amount, status, prescription_url, expires_at
  ) values (
    p_client_id, p_pharmacy_id, p_medication_id, p_patient_name, p_quantity,
    v_unit_price * p_quantity, 'pending', p_prescription_url, now() + interval '2 hours'
  ) returning * into v_reservation;

  insert into public.notifications (user_id, title, message, notification_type, related_id)
  select ph.user_id, 'New reservation', v_medication.name || ' x' || p_quantity || ' reserved.', 'reservation', v_reservation.reservation_id
  from public.pharmacists ph where ph.pharmacy_id = p_pharmacy_id;

  return v_reservation;
end; $$;

-- 13.3 Cancel reservation — restocks inventory
create or replace function public.cancel_reservation(p_reservation_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_res public.reservations;
begin
  select * into v_res from public.reservations where reservation_id = p_reservation_id for update;
  if v_res is null then raise exception 'Reservation not found'; end if;
  if v_res.status in ('collected','cancelled') then
    raise exception 'Reservation cannot be cancelled in its current state';
  end if;

  update public.inventory set quantity = quantity + v_res.quantity, last_updated = now()
    where pharmacy_id = v_res.pharmacy_id and medication_id = v_res.medication_id;

  update public.reservations set status = 'cancelled' where reservation_id = p_reservation_id;
end; $$;

-- 13.4 Expire stale reservations (call via pg_cron every few minutes)
create or replace function public.expire_stale_reservations()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.inventory i
  set quantity = i.quantity + r.quantity, last_updated = now()
  from public.reservations r
  where r.pharmacy_id = i.pharmacy_id and r.medication_id = i.medication_id
    and r.status = 'pending' and r.expires_at < now();

  update public.reservations
  set status = 'expired'
  where status = 'pending' and expires_at < now();
end; $$;

-- 13.5 Admin dashboard KPIs
create or replace function public.admin_stats()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'total_users', (select count(*) from public.users),
    'total_clients', (select count(*) from public.clients),
    'total_pharmacies', (select count(*) from public.pharmacies),
    'pending_pharmacies', (select count(*) from public.pharmacies where status = 'pending'),
    'approved_pharmacies', (select count(*) from public.pharmacies where status = 'approved'),
    'total_reservations', (select count(*) from public.reservations),
    'successful_reservations', (select count(*) from public.reservations where status = 'collected'),
    'total_revenue_xaf', (select coalesce(sum(amount),0) from public.payments where status = 'successful')
  );
$$;

-- 13.6 Pharmacy dashboard KPIs
create or replace function public.pharmacy_stats(p_pharmacy_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'total_reservations', (select count(*) from public.reservations where pharmacy_id = p_pharmacy_id),
    'pending_reservations', (select count(*) from public.reservations where pharmacy_id = p_pharmacy_id and status = 'pending'),
    'confirmed_reservations', (select count(*) from public.reservations where pharmacy_id = p_pharmacy_id and status in ('confirmed','ready')),
    'inventory_items', (select count(*) from public.inventory where pharmacy_id = p_pharmacy_id),
    'low_stock_items', (select count(*) from public.inventory where pharmacy_id = p_pharmacy_id and quantity <= low_stock_alert),
    'revenue_xaf', (select coalesce(sum(pay.amount),0) from public.payments pay
                     join public.reservations res on res.reservation_id = pay.reservation_id
                     where res.pharmacy_id = p_pharmacy_id and pay.status = 'successful')
  );
$$;

-- =====================================================================
-- 14. ROW LEVEL SECURITY
-- =====================================================================
alter table public.users                 enable row level security;
alter table public.clients               enable row level security;
alter table public.pharmacists           enable row level security;
alter table public.admins                enable row level security;
alter table public.pharmacies            enable row level security;
alter table public.medications           enable row level security;
alter table public.categories            enable row level security;
alter table public.inventory             enable row level security;
alter table public.reservations          enable row level security;
alter table public.payments              enable row level security;
alter table public.reviews               enable row level security;
alter table public.notifications         enable row level security;
alter table public.premium_subscriptions enable row level security;
alter table public.audit_logs            enable row level security;

-- Helper: current user's role
create or replace function public.current_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.users where user_id = auth.uid();
$$;

create or replace function public.current_pharmacy_id()
returns uuid language sql stable security definer set search_path = public as $$
  select pharmacy_id from public.pharmacists where user_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---- users ----
drop policy if exists "users_select_own_or_admin" on public.users;
create policy "users_select_own_or_admin" on public.users for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users for update
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "users_admin_manage" on public.users;
create policy "users_admin_manage" on public.users for all
  using (public.is_admin());

-- ---- clients ----
drop policy if exists "clients_self" on public.clients;
create policy "clients_self" on public.clients for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "clients_self_update" on public.clients;
create policy "clients_self_update" on public.clients for update using (user_id = auth.uid());

-- ---- pharmacists ----
drop policy if exists "pharmacists_self_or_admin" on public.pharmacists;
create policy "pharmacists_self_or_admin" on public.pharmacists for select
  using (user_id = auth.uid() or public.is_admin());

-- ---- admins ----
drop policy if exists "admins_self" on public.admins;
create policy "admins_self" on public.admins for select using (user_id = auth.uid());

-- ---- pharmacies: public can read approved; owners & admin manage all ----
drop policy if exists "pharmacies_public_read_approved" on public.pharmacies;
create policy "pharmacies_public_read_approved" on public.pharmacies for select
  using (status = 'approved' or pharmacy_id = public.current_pharmacy_id() or public.is_admin());

drop policy if exists "pharmacies_owner_update" on public.pharmacies;
create policy "pharmacies_owner_update" on public.pharmacies for update
  using (pharmacy_id = public.current_pharmacy_id() or public.is_admin());

drop policy if exists "pharmacies_admin_insert" on public.pharmacies;
create policy "pharmacies_admin_insert" on public.pharmacies for insert
  with check (public.is_admin());

drop policy if exists "pharmacies_admin_delete" on public.pharmacies;
create policy "pharmacies_admin_delete" on public.pharmacies for delete
  using (public.is_admin());

-- ---- categories & medications: public read, pharmacist/admin write ----
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories for select using (true);
drop policy if exists "categories_write" on public.categories;
create policy "categories_write" on public.categories for all
  using (public.current_role() in ('pharmacist','admin'));

drop policy if exists "medications_public_read" on public.medications;
create policy "medications_public_read" on public.medications for select using (true);
drop policy if exists "medications_write" on public.medications;
create policy "medications_write" on public.medications for all
  using (public.current_role() in ('pharmacist','admin'));

-- ---- inventory: public read (for search), pharmacist manages own pharmacy ----
drop policy if exists "inventory_public_read" on public.inventory;
create policy "inventory_public_read" on public.inventory for select using (true);
drop policy if exists "inventory_pharmacist_write" on public.inventory;
create policy "inventory_pharmacist_write" on public.inventory for all
  using (pharmacy_id = public.current_pharmacy_id() or public.is_admin());

-- ---- reservations: client sees own, pharmacist sees own pharmacy's, admin sees all ----
drop policy if exists "reservations_select" on public.reservations;
create policy "reservations_select" on public.reservations for select
  using (
    client_id in (select client_id from public.clients where user_id = auth.uid())
    or pharmacy_id = public.current_pharmacy_id()
    or public.is_admin()
  );

drop policy if exists "reservations_client_insert" on public.reservations;
create policy "reservations_client_insert" on public.reservations for insert
  with check (client_id in (select client_id from public.clients where user_id = auth.uid()));

drop policy if exists "reservations_update" on public.reservations;
create policy "reservations_update" on public.reservations for update
  using (
    client_id in (select client_id from public.clients where user_id = auth.uid())
    or pharmacy_id = public.current_pharmacy_id()
    or public.is_admin()
  );

-- ---- payments: visible to the reservation's client / pharmacy / admin ----
drop policy if exists "payments_select" on public.payments;
create policy "payments_select" on public.payments for select
  using (
    reservation_id in (
      select reservation_id from public.reservations r
      where r.client_id in (select client_id from public.clients where user_id = auth.uid())
         or r.pharmacy_id = public.current_pharmacy_id()
    ) or public.is_admin()
  );

drop policy if exists "payments_insert" on public.payments;
create policy "payments_insert" on public.payments for insert
  with check (
    reservation_id in (
      select reservation_id from public.reservations r
      where r.client_id in (select client_id from public.clients where user_id = auth.uid())
    )
  );

-- ---- reviews: public read, client writes own ----
drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read" on public.reviews for select using (true);
drop policy if exists "reviews_client_write" on public.reviews;
create policy "reviews_client_write" on public.reviews for insert
  with check (client_id in (select client_id from public.clients where user_id = auth.uid()));
drop policy if exists "reviews_client_update" on public.reviews;
create policy "reviews_client_update" on public.reviews for update
  using (client_id in (select client_id from public.clients where user_id = auth.uid()));

-- ---- notifications: only the owner ----
drop policy if exists "notifications_owner" on public.notifications;
create policy "notifications_owner" on public.notifications for select using (user_id = auth.uid());
drop policy if exists "notifications_owner_update" on public.notifications;
create policy "notifications_owner_update" on public.notifications for update using (user_id = auth.uid());

-- ---- premium_subscriptions ----
drop policy if exists "premium_self" on public.premium_subscriptions;
create policy "premium_self" on public.premium_subscriptions for select
  using (client_id in (select client_id from public.clients where user_id = auth.uid()) or public.is_admin());

-- ---- audit_logs: admin only ----
drop policy if exists "audit_admin_only" on public.audit_logs;
create policy "audit_admin_only" on public.audit_logs for select using (public.is_admin());

-- =====================================================================
-- 15. STORAGE BUCKETS (run once)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('prescriptions', 'prescriptions', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('pharmacy-licenses', 'pharmacy-licenses', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('medication-images', 'medication-images', true)
on conflict (id) do nothing;

-- Storage policies
drop policy if exists "prescriptions_owner_rw" on storage.objects;
create policy "prescriptions_owner_rw" on storage.objects for all
  using (bucket_id = 'prescriptions' and (auth.uid())::text = (storage.foldername(name))[1])
  with check (bucket_id = 'prescriptions' and (auth.uid())::text = (storage.foldername(name))[1]);

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "avatars_owner_write" on storage.objects;
create policy "avatars_owner_write" on storage.objects for insert
  with check (bucket_id = 'avatars' and (auth.uid())::text = (storage.foldername(name))[1]);

drop policy if exists "medication_images_public_read" on storage.objects;
create policy "medication_images_public_read" on storage.objects for select using (bucket_id = 'medication-images');

-- =====================================================================
-- 16. SEED DATA (categories — extend as needed)
-- =====================================================================
insert into public.categories (name, description) values
  ('Analgesics', 'Pain relief medication'),
  ('Antibiotics', 'Bacterial infection treatment'),
  ('Antimalarials', 'Malaria prevention and treatment'),
  ('Antihypertensives', 'Blood pressure management'),
  ('Antidiabetics', 'Diabetes management'),
  ('Vitamins & Supplements', 'Nutritional supplements'),
  ('Respiratory', 'Asthma and respiratory conditions'),
  ('Dermatological', 'Skin conditions'),
  ('Gastrointestinal', 'Digestive conditions'),
  ('Pediatric', 'Medication formulated for children')
on conflict (name) do nothing;

-- =====================================================================
-- END OF SCHEMA
-- =====================================================================
