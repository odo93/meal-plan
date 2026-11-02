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
