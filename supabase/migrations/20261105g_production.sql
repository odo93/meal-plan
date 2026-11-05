-- تجهيز الإنتاج: تسجيل أخطاء التطبيق من أجهزة المستخدمين، ومفتاح CAPTCHA العام في الإعدادات

-- أخطاء التطبيق: أي زائر يضيف (بحدود طول)، والمدير وحده يقرأ ويمسح
create table if not exists public.app_errors (
  id    bigint generated always as identity primary key,
  at    timestamptz not null default now(),
  ver   text check (length(ver) <= 20),
  msg   text not null check (length(msg) <= 500),
  src   text check (length(src) <= 300),
  line  int,
  path  text check (length(path) <= 200),
  ua    text check (length(ua) <= 300),
  uid   uuid default auth.uid()
);
create index if not exists app_errors_at_idx on public.app_errors (at desc);
alter table public.app_errors enable row level security;
drop policy if exists app_errors_insert on public.app_errors;
drop policy if exists app_errors_admin on public.app_errors;
create policy app_errors_insert on public.app_errors for insert to anon, authenticated
  with check (uid is not distinct from auth.uid() and at > now() - interval '1 minute');
create policy app_errors_admin on public.app_errors for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- مفتاح Cloudflare Turnstile العام (site key) — عام بطبيعته؛ المفتاح السري يُدخل في Supabase فقط
alter table public.app_config add column if not exists captcha_site_key text;
