-- كل حذف من التطبيق يُحفظ في أرشيف داخل قاعدة البيانات للاستفادة منه (إحصاءات وتحليل)،
-- مع إزالة ما يعرّف الشخص: لا اسم ولا صورة، وعند حذف الحساب نفسه يُفصل الأرشيف عن الحساب (owner = null).
-- الأرشيف لا يقرؤه إلا المدير؛ المستخدم لا يرى ما حذفه.

create table if not exists public.mp_archive (
  id          bigint generated always as identity primary key,
  kind        text not null check (kind in ('person', 'day', 'history', 'account')),
  owner       uuid,                 -- صاحب الحساب ما دام موجوداً؛ null بعد حذف الحساب
  anon_key    uuid,                 -- يربط سجلات حساب محذوف ببعضها دون أن يعرّفه
  user_id     text,                 -- الشخص داخل الحساب
  ref         text,                 -- رقم اليوم (0–6) أو التاريخ
  data        jsonb not null default '{}'::jsonb,
  reason      text not null default 'deleted',
  archived_at timestamptz not null default now()
);
create index if not exists mp_archive_owner_idx on public.mp_archive (owner);
create index if not exists mp_archive_kind_idx  on public.mp_archive (kind, archived_at);
alter table public.mp_archive enable row level security;
drop policy if exists mp_archive_admin_read on public.mp_archive;
create policy mp_archive_admin_read on public.mp_archive for select to authenticated using ((select public.is_admin()));

-- يعمل قبل كل حذف (ومنه الحذف المتسلسل عند حذف شخص أو حساب)
create or replace function public.mp_archive_row() returns trigger
language plpgsql security definer set search_path = '' as $$
declare why text := coalesce(nullif(current_setting('mp.reason', true), ''), 'deleted');
begin
  if tg_table_name = 'mp_users' then
    insert into public.mp_archive (kind, owner, user_id, data, reason)
    values ('person', old.owner, old.id,
            jsonb_build_object('settings', coalesce(old.settings, '{}'::jsonb) - 'pic', 'foods', old.foods), why);
  elsif tg_table_name = 'mp_days' then
    insert into public.mp_archive (kind, owner, user_id, ref, data, reason) values ('day', old.owner, old.user_id, old.idx::text, old.data, why);
  elsif tg_table_name = 'mp_history' then
    insert into public.mp_archive (kind, owner, user_id, ref, data, reason) values ('history', old.owner, old.user_id, old.date::text, old.data, why);
  end if;
  return old;
end $$;
revoke execute on function public.mp_archive_row() from public, anon, authenticated;

drop trigger if exists mp_users_archive on public.mp_users;
drop trigger if exists mp_days_archive on public.mp_days;
drop trigger if exists mp_history_archive on public.mp_history;
create trigger mp_users_archive   before delete on public.mp_users   for each row execute function public.mp_archive_row();
create trigger mp_days_archive    before delete on public.mp_days    for each row execute function public.mp_archive_row();
create trigger mp_history_archive before delete on public.mp_history for each row execute function public.mp_archive_row();

-- حذف الحساب من داخل التطبيق: يُؤرشف كل شيء، يُحذف الحساب (البريد والجوال وتسجيل الدخول)، ويُفصل الأرشيف عنه
create or replace function public.mp_delete_account() returns json
language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); k uuid := gen_random_uuid(); n int;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  if exists (select 1 from public.app_admins where user_id = uid) then raise exception 'admin_account'; end if;
  perform set_config('mp.reason', 'account_deleted', true);
  insert into public.mp_archive (kind, owner, data, reason)
    select 'account', uid, jsonb_build_object('mode', a.mode, 'created_at', u.created_at, 'anonymous', coalesce(u.is_anonymous, false)), 'account_deleted'
    from auth.users u left join public.mp_accounts a on a.owner = u.id where u.id = uid;
  delete from public.mp_users where owner = uid;      -- يتسلسل إلى الأيام والسجل فتُؤرشف
  delete from auth.users where id = uid;              -- يتسلسل إلى الحساب والمشاركات
  update public.mp_archive set owner = null, anon_key = k where owner = uid;
  get diagnostics n = row_count;
  return json_build_object('archived', n);
end $$;
revoke execute on function public.mp_delete_account() from public, anon;
grant execute on function public.mp_delete_account() to authenticated;

-- إحصاءات المدير: الأرشيف
create or replace function public.admin_stats() returns json
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  return json_build_object(
    'accounts',         (select count(*) from auth.users),
    'registered',       (select count(*) from auth.users where not coalesce(is_anonymous, false)),
    'anonymous',        (select count(*) from auth.users where coalesce(is_anonymous, false)),
    'active_7d',        (select count(distinct owner) from public.mp_users where updated_at > now() - interval '7 days'),
    'people',           (select count(*) from public.mp_users),
    'history_days',     (select count(*) from public.mp_history),
    'active_grants',    (select count(*) from public.mp_grants where status = 'active'),
    'pending_grants',   (select count(*) from public.mp_grants where status = 'pending'),
    'archived_days',    (select count(*) from public.mp_archive where kind = 'history'),
    'deleted_accounts', (select count(*) from public.mp_archive where kind = 'account'));
end $$;
revoke execute on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;
