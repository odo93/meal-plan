-- قائمة الحسابات للمدير: رقم الجوال (من بيانات التسجيل) وهل فُعّل البريد
drop function if exists public.admin_accounts();
create function public.admin_accounts() returns table (id uuid, email text, phone text, confirmed boolean, created_at timestamptz, last_sign_in_at timestamptz, people bigint, last_update timestamptz, is_admin boolean, mode text, features jsonb)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  return query
    select a.id, a.email::text, nullif(a.raw_user_meta_data->>'phone', ''), a.email_confirmed_at is not null,
           a.created_at, a.last_sign_in_at, count(u.id), max(u.updated_at),
           exists (select 1 from public.app_admins x where x.user_id = a.id),
           ac.mode, coalesce(ac.features, '{}'::jsonb)
    from auth.users a
    left join public.mp_users u on u.owner = a.id
    left join public.mp_accounts ac on ac.owner = a.id
    group by a.id, ac.mode, ac.features order by a.created_at desc;
end $$;
revoke execute on function public.admin_accounts() from public, anon;
grant execute on function public.admin_accounts() to authenticated;
