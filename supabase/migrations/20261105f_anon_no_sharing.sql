-- الحساب المؤقت (anonymous) لا ينشئ دعوات مشاركة ولا يقبلها؛ المشاركة تحتاج حساباً ببريد
drop policy if exists mp_grants_owner on public.mp_grants;
create policy mp_grants_owner on public.mp_grants for all to authenticated
  using (owner = (select auth.uid()))
  with check (owner = (select auth.uid()) and not coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false));

create or replace function public.mp_accept_invite(p_code text) returns json
language plpgsql security definer set search_path = '' as $$
declare g public.mp_grants; nm text;
begin
  if (select auth.uid()) is null then raise exception 'not_signed_in'; end if;
  if coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) then raise exception 'needs_email_account'; end if;
  select * into g from public.mp_grants where code = upper(trim(p_code)) and status = 'pending' for update;
  if not found then raise exception 'invalid_code'; end if;
  if g.owner = (select auth.uid()) then raise exception 'own_invite'; end if;
  update public.mp_grants set grantee = (select auth.uid()), status = 'active', code = null, accepted_at = now() where id = g.id;
  select name into nm from public.mp_users where owner = g.owner and id = g.user_id;
  return json_build_object('owner', g.owner, 'user_id', g.user_id, 'name', nm, 'role', g.role);
end $$;
