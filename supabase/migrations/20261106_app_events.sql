-- تتبّع الاستخدام لاختبار الفكرة (docs/VALIDATION-PLAN.md):
-- أحداث قليلة محددة يرسلها التطبيق بعد موافقة المستخدم (أي بعد وجود جلسة)، والمدير وحده يقرأ مقاييسها مجمّعة.
create table if not exists public.app_events (
  id    bigint generated always as identity primary key,
  at    timestamptz not null default now(),
  day   date not null,                                   -- تاريخ الجهاز المحلي (لعدّ الأيام كما يعيشها المستخدم)
  uid   uuid not null default auth.uid(),
  ev    text not null check (ev in ('open', 'log', 'day_done', 'share', 'coach_view', 'update')),
  ver   text check (length(ver) <= 20)
);
create index if not exists app_events_uid_at_idx on public.app_events (uid, at);
create index if not exists app_events_at_idx on public.app_events (at desc);
alter table public.app_events enable row level security;
drop policy if exists app_events_insert on public.app_events;
drop policy if exists app_events_admin on public.app_events;
-- الحساب يضيف أحداثه فقط؛ الأحداث المؤجلة على الجهاز تُقبل حتى 30 يوماً
create policy app_events_insert on public.app_events for insert to authenticated
  with check (uid = (select auth.uid()) and at > now() - interval '30 days' and at < now() + interval '5 minutes'
              and day between current_date - 31 and current_date + 1);
create policy app_events_admin on public.app_events for select to authenticated
  using ((select public.is_admin()));

-- مقاييس التجربة مقابل حدود النجاح (بلا أسماء ولا بريد)
create or replace function public.admin_metrics(p_days int default 90) returns json
language plpgsql stable security definer set search_path = '' as $$
declare since timestamptz := now() - make_interval(days => greatest(7, least(coalesce(p_days, 90), 730)));
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  return (
  with firsts as (select uid, min(at) as f from public.app_events group by uid),
  cohort as (select * from firsts where f >= since),
  act as (   -- أكمل أول يوم خلال 48 ساعة من أول استخدام
    select count(*) filter (where c.f <= now() - interval '48 hours') as elig,
           count(*) filter (where c.f <= now() - interval '48 hours' and exists (
             select 1 from public.app_events e where e.uid = c.uid and e.ev = 'day_done' and e.at <= c.f + interval '48 hours')) as ok
    from cohort c),
  ret as (   -- عاد بعد 7 أيام / 30 يوماً من أول استخدام
    select count(*) filter (where c.f <= now() - interval '7 days') as e7,
           count(*) filter (where c.f <= now() - interval '7 days' and exists (select 1 from public.app_events e where e.uid = c.uid and e.at >= c.f + interval '7 days')) as r7,
           count(*) filter (where c.f <= now() - interval '30 days') as e30,
           count(*) filter (where c.f <= now() - interval '30 days' and exists (select 1 from public.app_events e where e.uid = c.uid and e.at >= c.f + interval '30 days')) as r30
    from cohort c),
  uw as (    -- لكل مستخدم في كل أسبوع نشط: عدد الأيام التي سجّل فيها أكلاً
    select uid, date_trunc('week', day) as wk, count(distinct day) filter (where ev = 'log') as logd
    from public.app_events where at >= since group by 1, 2),
  coaches as (select owner from public.mp_accounts where mode in ('coach', 'org'))
  select json_build_object(
    'users',      (select count(distinct uid) from public.app_events where at >= since),
    'new_users',  (select count(*) from cohort),
    'wau',        (select count(distinct uid) from public.app_events where at >= now() - interval '7 days'),
    'act_elig',   (select elig from act), 'act_ok', (select ok from act),
    'r7_elig',    (select e7 from ret),   'r7_ok',  (select r7 from ret),
    'r30_elig',   (select e30 from ret),  'r30_ok', (select r30 from ret),
    'log_days',   (select round(avg(logd), 1) from uw),
    'user_weeks', (select count(*) from uw),
    'coaches',    (select count(*) from coaches),
    'coach_wk',   (select count(distinct e.uid) from public.app_events e join coaches c on c.owner = e.uid where e.ev = 'coach_view' and e.at >= now() - interval '7 days'),
    'counts',     (select coalesce(json_object_agg(ev, c), '{}') from (select ev, count(*) as c from public.app_events where at >= since group by ev) x),
    'weekly',     (select coalesce(json_agg(x order by x.wk), '[]') from (
                     select to_char(w.wk, 'YYYY-MM-DD') as wk, count(*) as active,
                            count(*) filter (where date_trunc('week', f.f) = w.wk) as new_u, round(avg(w.logd), 1) as logd
                     from uw w join firsts f using (uid) group by w.wk) x)
  ));
end $$;
revoke execute on function public.admin_metrics(int) from public, anon;
grant execute on function public.admin_metrics(int) to authenticated;
