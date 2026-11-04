-- نظام الوجبات الأسبوعي — مخطط Supabase (Postgres) مع أمان على مستوى الصف (RLS)
-- التنفيذ: Supabase ← SQL Editor ← الصق الملف كاملاً ← Run
-- كل صف يخص صاحبه فقط (owner = auth.uid())؛ لا أحد يرى بيانات غيره.

create table if not exists public.mp_users (
  owner      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id         text not null,
  name       text not null,
  settings   jsonb not null,           -- الأهداف والمعادلات والإعدادات
  foods      jsonb not null,           -- قاعدة أصناف المستخدم
  updated_at timestamptz not null default now(),
  primary key (owner, id)
);

create table if not exists public.mp_days (        -- خطة الأسبوع: 7 صفوف لكل مستخدم
  owner      uuid not null default auth.uid(),
  user_id    text not null,
  idx        smallint not null check (idx between 0 and 6),
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (owner, user_id, idx),
  foreign key (owner, user_id) references public.mp_users(owner, id) on delete cascade
);

create table if not exists public.mp_history (     -- سجل الفعلي لكل تاريخ
  owner      uuid not null default auth.uid(),
  user_id    text not null,
  date       date not null,
  data       jsonb not null,           -- {date,dow,name,mode,tg,meals[{items[{fd,g,e,em,x}]}]}
  updated_at timestamptz not null default now(),
  primary key (owner, user_id, date),
  foreign key (owner, user_id) references public.mp_users(owner, id) on delete cascade
);
create index if not exists mp_history_date_idx on public.mp_history (owner, date desc);

alter table public.mp_users   enable row level security;
alter table public.mp_days    enable row level security;
alter table public.mp_history enable row level security;

drop policy if exists mp_users_own   on public.mp_users;
drop policy if exists mp_days_own    on public.mp_days;
drop policy if exists mp_history_own on public.mp_history;
create policy mp_users_own   on public.mp_users   for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
create policy mp_days_own    on public.mp_days    for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
create policy mp_history_own on public.mp_history for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());

-- مثال لاستعلام تحليلي مستقبلي: عدد الأيام المسجلة وأصناف كل يوم
-- select date, jsonb_array_length(data->'meals') as meals from public.mp_history where user_id = '...' order by date desc;

-- ===== إضافات 2026-11-04: الإدارة والمشاركة (نفس supabase/migrations/20261104_admin_sharing.sql) =====
-- المرحلة 3 + مشاركة الأشخاص: لوحة الإدارة، إعدادات التطبيق، الإعلانات، الأصناف المشتركة، والصلاحيات بين الحسابات
-- لا يغيّر بيانات موجودة. سياسات «المالك فقط» تبقى كما هي، وتُضاف سياسات للمشاركة فوقها.

-- ---------- مدير التطبيق ----------
create table if not exists public.app_admins (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table public.app_admins enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.app_admins where user_id = (select auth.uid()))
$$;

drop policy if exists app_admins_read on public.app_admins;
create policy app_admins_read on public.app_admins for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- ---------- إعدادات التطبيق (صف واحد) ----------
create table if not exists public.app_config (
  id             smallint primary key default 1 check (id = 1),
  latest_version text  not null default '2.1',
  min_version    text  not null default '2.0',   -- أقل من هذا: «تحديث مطلوب»
  features       jsonb not null default '{}'::jsonb,
  updated_at     timestamptz not null default now()
);
insert into public.app_config (id) values (1) on conflict (id) do nothing;
alter table public.app_config enable row level security;
drop policy if exists app_config_read on public.app_config;
drop policy if exists app_config_admin on public.app_config;
create policy app_config_read  on public.app_config for select to anon, authenticated using (true);
create policy app_config_admin on public.app_config for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- الإعلانات ----------
create table if not exists public.announcements (
  id         bigint generated always as identity primary key,
  title      text not null,
  body       text not null default '',
  level      text not null default 'info' check (level in ('info', 'warn')),
  active     boolean not null default true,
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz,
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
drop policy if exists announcements_read on public.announcements;
drop policy if exists announcements_admin on public.announcements;
create policy announcements_read on public.announcements for select to anon, authenticated
  using ((active and starts_at <= now() and (ends_at is null or ends_at > now())) or (select public.is_admin()));
create policy announcements_admin on public.announcements for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- الأصناف المشتركة (تُضاف إلى القاعدة الجاهزة في التطبيق) ----------
create table if not exists public.shared_foods (
  id         text primary key,
  n          text not null,
  grp        text not null check (grp in ('pro', 'dairy', 'carb', 'fruit', 'fat', 'veg')),
  k          numeric not null check (k >= 0),
  p          numeric not null default 0,
  c          numeric not null default 0,
  f          numeric not null default 0,
  u          text,
  ug         numeric,
  active     boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.shared_foods enable row level security;
drop policy if exists shared_foods_read on public.shared_foods;
drop policy if exists shared_foods_admin on public.shared_foods;
create policy shared_foods_read  on public.shared_foods for select to anon, authenticated using (active or (select public.is_admin()));
create policy shared_foods_admin on public.shared_foods for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- مشاركة شخص مع حساب آخر (عائلة / مدرب) ----------
-- المالك ينشئ دعوة بكود، والطرف الآخر يقبلها بالكود. المالك وحده يلغيها أو يحذفها، والطرف الآخر يستطيع المغادرة.
create table if not exists public.mp_grants (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  user_id     text not null,
  grantee     uuid references auth.users(id) on delete cascade,
  role        text not null check (role in ('viewer', 'editor', 'coach')),
  code        text unique,
  status      text not null default 'pending' check (status in ('pending', 'active', 'revoked')),
  created_at  timestamptz not null default now(),
  accepted_at timestamptz,
  foreign key (owner, user_id) references public.mp_users(owner, id) on delete cascade
);
create index if not exists mp_grants_grantee_idx on public.mp_grants (grantee) where status = 'active';
create index if not exists mp_grants_person_idx  on public.mp_grants (owner, user_id);
alter table public.mp_grants enable row level security;
drop policy if exists mp_grants_owner on public.mp_grants;
drop policy if exists mp_grants_grantee_read on public.mp_grants;
drop policy if exists mp_grants_grantee_leave on public.mp_grants;
create policy mp_grants_owner on public.mp_grants for all to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy mp_grants_grantee_read  on public.mp_grants for select to authenticated using (grantee = (select auth.uid()));
create policy mp_grants_grantee_leave on public.mp_grants for delete to authenticated using (grantee = (select auth.uid()));

-- هل للحساب الحالي وصول إلى هذا الشخص؟ (write = تعديل الخطة والأهداف)
create or replace function public.mp_can(p_owner uuid, p_user text, p_write boolean) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_owner = (select auth.uid()) or exists (
    select 1 from public.mp_grants g
    where g.owner = p_owner and g.user_id = p_user and g.grantee = (select auth.uid())
      and g.status = 'active' and (not p_write or g.role in ('editor', 'coach')))
$$;

-- قبول دعوة بالكود: يربطها بالحساب الحالي ويرجع بيانات الشخص
create or replace function public.mp_accept_invite(p_code text) returns json
language plpgsql security definer set search_path = '' as $$
declare g public.mp_grants; nm text;
begin
  if (select auth.uid()) is null then raise exception 'not_signed_in'; end if;
  select * into g from public.mp_grants where code = upper(trim(p_code)) and status = 'pending' for update;
  if not found then raise exception 'invalid_code'; end if;
  if g.owner = (select auth.uid()) then raise exception 'own_invite'; end if;
  update public.mp_grants set grantee = (select auth.uid()), status = 'active', code = null, accepted_at = now() where id = g.id;
  select name into nm from public.mp_users where owner = g.owner and id = g.user_id;
  return json_build_object('owner', g.owner, 'user_id', g.user_id, 'name', nm, 'role', g.role);
end $$;

-- الأشخاص المشاركون معي، مع بريد المالك ليعرف المستخدم من شاركه
create or replace function public.mp_shared_with_me() returns table (owner uuid, user_id text, name text, role text, owner_email text, updated_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select g.owner, g.user_id, u.name, g.role, a.email::text, u.updated_at
  from public.mp_grants g
  join public.mp_users u on u.owner = g.owner and u.id = g.user_id
  join auth.users a on a.id = g.owner
  where g.grantee = (select auth.uid()) and g.status = 'active'
  order by u.name
$$;

-- من له وصول إلى أشخاصي (للمالك)
create or replace function public.mp_my_grants() returns table (id uuid, user_id text, role text, status text, code text, grantee_email text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select g.id, g.user_id, g.role, g.status, g.code, a.email::text, g.created_at
  from public.mp_grants g left join auth.users a on a.id = g.grantee
  where g.owner = (select auth.uid()) and g.status <> 'revoked'
  order by g.created_at desc
$$;

-- سياسات المشاركة على بيانات الأشخاص (تُضاف إلى سياسات المالك الموجودة)
drop policy if exists mp_users_shared_read  on public.mp_users;
drop policy if exists mp_users_shared_write on public.mp_users;
drop policy if exists mp_days_shared_read   on public.mp_days;
drop policy if exists mp_days_shared_write  on public.mp_days;
drop policy if exists mp_history_shared_read on public.mp_history;
create policy mp_users_shared_read  on public.mp_users for select to authenticated using ((select public.mp_can(owner, id, false)));
create policy mp_users_shared_write on public.mp_users for update to authenticated
  using ((select public.mp_can(owner, id, true))) with check ((select public.mp_can(owner, id, true)));
create policy mp_days_shared_read   on public.mp_days  for select to authenticated using ((select public.mp_can(owner, user_id, false)));
create policy mp_days_shared_write  on public.mp_days  for update to authenticated
  using ((select public.mp_can(owner, user_id, true))) with check ((select public.mp_can(owner, user_id, true)));
create policy mp_history_shared_read on public.mp_history for select to authenticated using ((select public.mp_can(owner, user_id, false)));
-- لا سياسة كتابة على السجل لغير المالك: المتدرب وحده يسجّل ما أكل.

-- ---------- إحصاءات لوحة الإدارة ----------
create or replace function public.admin_stats() returns json
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  return json_build_object(
    'accounts',       (select count(*) from auth.users),
    'active_7d',      (select count(distinct owner) from public.mp_users where updated_at > now() - interval '7 days'),
    'people',         (select count(*) from public.mp_users),
    'history_days',   (select count(*) from public.mp_history),
    'active_grants',  (select count(*) from public.mp_grants where status = 'active'),
    'pending_grants', (select count(*) from public.mp_grants where status = 'pending'));
end $$;

create or replace function public.admin_accounts() returns table (email text, created_at timestamptz, last_sign_in_at timestamptz, people bigint, last_update timestamptz, is_admin boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  return query
    select a.email::text, a.created_at, a.last_sign_in_at, count(u.id), max(u.updated_at),
           exists (select 1 from public.app_admins x where x.user_id = a.id)
    from auth.users a left join public.mp_users u on u.owner = a.id
    group by a.id order by a.created_at desc;
end $$;

-- الدوال تُستدعى من المسجّلين فقط
revoke execute on function public.mp_accept_invite(text), public.mp_shared_with_me(), public.mp_my_grants(),
  public.admin_stats(), public.admin_accounts() from public, anon;
grant execute on function public.mp_accept_invite(text), public.mp_shared_with_me(), public.mp_my_grants(),
  public.admin_stats(), public.admin_accounts() to authenticated;

-- أول مدير: صاحب التطبيق
insert into public.app_admins (user_id)
  select id from auth.users where lower(email) = 'mahmoud.gomma93@gmail.com'
on conflict do nothing;
