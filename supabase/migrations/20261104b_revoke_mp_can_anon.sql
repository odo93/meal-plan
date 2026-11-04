-- mp_can تُستخدم في سياسات المسجّلين فقط؛ لا حاجة لأن يستدعيها الزائر غير المسجّل
revoke execute on function public.mp_can(uuid, text, boolean) from public, anon;
grant execute on function public.mp_can(uuid, text, boolean) to authenticated;
