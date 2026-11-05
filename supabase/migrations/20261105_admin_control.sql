-- تحكّم لوحة الإدارة في التطبيق: نوع استخدام كل حساب، ميزات حسب النوع، استثناءات لكل حساب، وإعدادات افتراضية للأشخاص الجدد.
-- لا يغيّر بيانات موجودة.
--
-- app_config.features : {"<ميزة>": {"self":bool,"family":bool,"coach":bool,"org":bool}}  — غياب القيمة = مفعّلة
-- mp_accounts.features: {"<ميزة>": bool} استثناء يضعه المدير لحساب بعينه ويتقدّم على إعداد النوع
-- app_config.defaults : {"goal":"cut","act":1.55,"g":{"cut":{"val":0.75,"pr":2.2,"fat":25},...}} للأشخاص الجدد فقط
-- الميزات للعرض فقط (تُخفي أزراراً في التطبيق)؛ حماية البيانات تبقى في سياسات RLS.

-- ---------- حساب: نوع الاستخدام + استثناءات الميزات ----------
create table if not exists public.mp_accounts (
  owner      uuid primary key references auth.users(id) on delete cascade,
  mode       text check (mode in ('self', 'family', 'coach', 'org')),
  features   jsonb not null default '{}'::jsonb check (jsonb_typeof(features) = 'object'),
  updated_at timestamptz not null default now()
);
alter table public.mp_accounts enable row level security;
drop policy if exists mp_accounts_read on public.mp_accounts;
create policy mp_accounts_read on public.mp_accounts for select to authenticated
  using (owner = (select auth.uid()) or (select public.is_admin()));
-- لا سياسات كتابة مباشرة: المستخدم يغيّر نوعه فقط عبر mp_set_mode، والمدير عبر admin_set_account.

create or replace function public.mp_set_mode(p_mode text) returns json
language plpgsql security definer set search_path = '' as $$
declare r public.mp_accounts;
begin
  if (select auth.uid()) is null then raise exception 'not_signed_in'; end if;
  if p_mode not in ('self', 'family', 'coach', 'org') then raise exception 'bad_mode'; end if;
  insert into public.mp_accounts (owner, mode) values ((select auth.uid()), p_mode)
  on conflict (owner) do update set mode = excluded.mode, updated_at = now()
  returning * into r;
  return json_build_object('mode', r.mode, 'features', r.features);
end $$;

-- ---------- إعدادات افتراضية للأشخاص الجدد ----------
alter table public.app_config add column if not exists defaults jsonb not null default '{}'::jsonb;

-- ---------- المدير: تعديل نوع حساب واستثناءاته ----------
create or replace function public.admin_set_account(p_owner uuid, p_mode text, p_features jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  if p_mode is not null and p_mode not in ('self', 'family', 'coach', 'org') then raise exception 'bad_mode'; end if;
  if p_features is null or jsonb_typeof(p_features) <> 'object'
     or exists (select 1 from jsonb_each(p_features) e where jsonb_typeof(e.value) <> 'boolean') then
    raise exception 'bad_features';
  end if;
  insert into public.mp_accounts (owner, mode, features) values (p_owner, p_mode, p_features)
  on conflict (owner) do update set mode = coalesce(excluded.mode, public.mp_accounts.mode), features = excluded.features, updated_at = now();
end $$;

-- قائمة الحسابات مع النوع والاستثناءات (يتغيّر شكل النتيجة، فتُحذف الدالة القديمة أولاً)
drop function if exists public.admin_accounts();
create function public.admin_accounts() returns table (id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz, people bigint, last_update timestamptz, is_admin boolean, mode text, features jsonb)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  return query
    select a.id, a.email::text, a.created_at, a.last_sign_in_at, count(u.id), max(u.updated_at),
           exists (select 1 from public.app_admins x where x.user_id = a.id),
           ac.mode, coalesce(ac.features, '{}'::jsonb)
    from auth.users a
    left join public.mp_users u on u.owner = a.id
    left join public.mp_accounts ac on ac.owner = a.id
    group by a.id, ac.mode, ac.features order by a.created_at desc;
end $$;

revoke execute on function public.mp_set_mode(text), public.admin_set_account(uuid, text, jsonb), public.admin_accounts() from public, anon;
grant execute on function public.mp_set_mode(text), public.admin_set_account(uuid, text, jsonb), public.admin_accounts() to authenticated;
