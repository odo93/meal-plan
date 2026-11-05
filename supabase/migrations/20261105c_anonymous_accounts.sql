-- الحسابات المؤقتة (Anonymous sign-ins): تمييزها في قائمة المدير وعدّها في الإحصاءات.
-- يحتاج تفعيل «Allow anonymous sign-ins» من لوحة Supabase (Authentication). السياسات الحالية تعمل كما هي:
-- كل حساب مؤقت يملك بياناته فقط (owner = auth.uid()).
drop function if exists public.admin_accounts();
create function public.admin_accounts() returns table (id uuid, email text, phone text, confirmed boolean, anon boolean, created_at timestamptz, last_sign_in_at timestamptz, people bigint, last_update timestamptz, is_admin boolean, mode text, features jsonb)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  return query
    select a.id, a.email::text, nullif(a.raw_user_meta_data->>'phone', ''), a.email_confirmed_at is not null, coalesce(a.is_anonymous, false),
           a.created_at, a.last_sign_in_at, count(u.id), max(u.updated_at),
           exists (select 1 from public.app_admins x where x.user_id = a.id),
           ac.mode, coalesce(ac.features, '{}'::jsonb)
    from auth.users a
    left join public.mp_users u on u.owner = a.id
    left join public.mp_accounts ac on ac.owner = a.id
    group by a.id, ac.mode, ac.features order by a.created_at desc;
end $$;

create or replace function public.admin_stats() returns json
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  return json_build_object(
    'accounts',       (select count(*) from auth.users),
    'registered',     (select count(*) from auth.users where not coalesce(is_anonymous, false)),
    'anonymous',      (select count(*) from auth.users where coalesce(is_anonymous, false)),
    'active_7d',      (select count(distinct owner) from public.mp_users where updated_at > now() - interval '7 days'),
    'people',         (select count(*) from public.mp_users),
    'history_days',   (select count(*) from public.mp_history),
    'active_grants',  (select count(*) from public.mp_grants where status = 'active'),
    'pending_grants', (select count(*) from public.mp_grants where status = 'pending'));
end $$;

revoke execute on function public.admin_accounts(), public.admin_stats() from public, anon;
grant execute on function public.admin_accounts(), public.admin_stats() to authenticated;
