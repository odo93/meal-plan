-- رؤى مجمّعة للمدير (بلا أسماء ولا بريد): من السجل الحالي والأرشيف معاً
create or replace function public.admin_insights(p_days int default 90) returns json
language plpgsql stable security definer set search_path = '' as $$
declare since date := current_date - greatest(7, least(coalesce(p_days, 90), 730));
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  return (
  with recs as (
      select h.date as d, h.data from public.mp_history h where h.date >= since
      union all
      select a.ref::date, a.data from public.mp_archive a where a.kind = 'history' and a.ref ~ '^\d{4}-\d{2}-\d{2}$' and a.ref::date >= since
  ),
  items as (
      select r.d, coalesce((r.data->>'dow')::int, -1) as dow, i
      from recs r, jsonb_array_elements(coalesce(r.data->'meals', '[]'::jsonb)) m, jsonb_array_elements(coalesce(m->'items', '[]'::jsonb)) i
  ),
  per_day as (
      select d, dow,
             sum(case when (i->>'e') is not null then (i->>'e')::numeric * coalesce((i->'fd'->>'k')::numeric, 0) / 100 else 0 end) as eaten,
             sum(case when coalesce((i->>'x')::boolean, false) then 0 else coalesce((i->>'g')::numeric, 0) * coalesce((i->'fd'->>'k')::numeric, 0) / 100 end) as plan,
             count(*) filter (where (i->>'e') is not null) as logged
      from items group by d, dow
  )
  select json_build_object(
    'days',        (select count(*) from per_day where logged > 0),
    'top_eaten',   (select coalesce(json_agg(x), '[]') from (select i->'fd'->>'n' as n, count(*) as c from items where coalesce((i->>'e')::numeric, 0) > 0 group by 1 order by 2 desc limit 15) x),
    'top_skipped', (select coalesce(json_agg(x), '[]') from (select i->'fd'->>'n' as n, count(*) as c from items where (i->>'e')::numeric = 0 and not coalesce((i->>'x')::boolean, false) group by 1 order by 2 desc limit 10) x),
    'extra',       (select coalesce(json_agg(x), '[]') from (select i->'fd'->>'n' as n, count(*) as c from items where coalesce((i->>'x')::boolean, false) group by 1 order by 2 desc limit 10) x),
    'by_dow',      (select coalesce(json_agg(x order by x.dow), '[]') from (select dow, round(avg(least(150, eaten / nullif(plan, 0) * 100)))::int as adh, count(*) as n from per_day where logged > 0 and plan > 0 and dow between 0 and 6 group by dow) x),
    'weekly',      (select coalesce(json_agg(x order by x.wk), '[]') from (select to_char(date_trunc('week', d), 'YYYY-MM-DD') as wk, count(*) as days from per_day where logged > 0 group by 1) x),
    'goals',       (select coalesce(json_agg(x), '[]') from (select coalesce(settings->>'goal', 'manual') as goal, count(*) as c from public.mp_users group by 1 order by 2 desc) x),
    'modes',       (select coalesce(json_agg(x), '[]') from (select coalesce(mode, 'none') as mode, count(*) as c from public.mp_accounts group by 1 order by 2 desc) x),
    'weights',     (select count(*) from public.mp_users where jsonb_array_length(coalesce(settings->'wlog', '[]'::jsonb)) >= 2)
  ));
end $$;
revoke execute on function public.admin_insights(int) from public, anon;
grant execute on function public.admin_insights(int) to authenticated;
