-- قوالب وجبات عامة ينشرها المدير لكل المستخدمين (تظهر في «استبدال بوجبة جاهزة» وتُستخدم في بناء الأيام)
alter table public.app_config add column if not exists meal_templates jsonb not null default '[]'::jsonb;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'app_config_meal_templates_array') then
    alter table public.app_config add constraint app_config_meal_templates_array check (jsonb_typeof(meal_templates) = 'array');
  end if;
end $$;
