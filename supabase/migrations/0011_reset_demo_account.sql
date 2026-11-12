-- Lets an anonymous "Try Demo" user wipe their own data before signing out.
-- Restricted to anonymous users (checked via the is_anonymous JWT claim) so
-- it can never be called against a real account, even by mistake.
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- or save as a migration file if using the Supabase CLI.

create or replace function public.reset_demo_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  is_anon boolean := coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
begin
  if uid is null or not is_anon then
    raise exception 'reset_demo_account can only be called by an anonymous demo user';
  end if;

  delete from public.session_techniques where user_id = uid;
  delete from public.sparring_log where user_id = uid;
  delete from public.sessions where user_id = uid;
  delete from public.belt_promotions where user_id = uid;
  delete from public.class_schedule where user_id = uid;
  delete from public.competition_results where user_id = uid;
  delete from public.profiles where id = uid;

  -- Only remove techniques the demo user added that no one else has logged.
  delete from public.techniques t
    where t.created_by = uid
      and not exists (
        select 1 from public.session_techniques st where st.technique_id = t.id
      );
end;
$$;

grant execute on function public.reset_demo_account() to authenticated;
