-- Run after pin-auth.sql. Deploy the matching app first, then run this transaction.
begin;
create table if not exists public.pin_sessions (
 user_id uuid not null references auth.users(id) on delete cascade,
 session_id text not null,
 expires_at timestamptz not null,
 primary key(user_id,session_id)
);
alter table public.pin_sessions enable row level security;
revoke all on public.pin_sessions from public,anon,authenticated;

create or replace function public.pin_session_active()
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.pin_sessions s join public.pin_credentials c using(user_id)
 join public.profiles p using(user_id)
 where s.user_id=auth.uid() and s.session_id=auth.jwt()->>'session_id'
 and s.expires_at>now() and not c.locked and not c.must_change and p.approved);
$$;

-- Preserve the reviewed PIN verification function behind a private wrapper.
do $$ begin
 if to_regprocedure('public.pin_action_core(text,text)') is null then
  alter function public.pin_action(text,text) rename to pin_action_core;
 end if;
end $$;
revoke all on function public.pin_action_core(text,text) from public,anon,authenticated;
create or replace function public.pin_action(action text,supplied_pin text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb; sid text:=auth.jwt()->>'session_id';
begin
 if auth.uid() is null or sid is null then raise exception 'Sign in first'; end if;
 if action='lock' then
  delete from public.pin_sessions where user_id=auth.uid() and session_id=sid;
  return jsonb_build_object('status','enter_pin');
 elsif action='touch' then
  if not public.pin_session_active() then return jsonb_build_object('status','enter_pin'); end if;
  update public.pin_sessions set expires_at=now()+interval '5 minutes' where user_id=auth.uid() and session_id=sid;
  return jsonb_build_object('status','unlocked');
 end if;
 result:=public.pin_action_core(action,supplied_pin);
 if result->>'status'='unlocked' and action in ('verify','set_pin') then
  insert into public.pin_sessions values(auth.uid(),sid,now()+interval '5 minutes')
  on conflict(user_id,session_id) do update set expires_at=excluded.expires_at;
 elsif result->>'status' in ('locked','reset_requested','new_pin','temporary_pin','setup') then
  delete from public.pin_sessions where user_id=auth.uid();
 elsif action='status' and result->>'status'='enter_pin' and public.pin_session_active() then
  result:=jsonb_build_object('status','unlocked','attempts',0);
 end if;
 return result;
end;
$$;
revoke all on function public.pin_action(text,text),public.pin_session_active() from public,anon;
grant execute on function public.pin_action(text,text),public.pin_session_active() to authenticated;

-- Restrictive policies also constrain existing permissive approval policies.
drop policy if exists "Require PIN session" on public.shared_workspace;
create policy "Require PIN session" on public.shared_workspace as restrictive for all to authenticated
 using(public.pin_session_active()) with check(public.pin_session_active());
drop policy if exists "Require PIN session" on public.app_state;
create policy "Require PIN session" on public.app_state as restrictive for all to authenticated
 using(public.pin_session_active()) with check(public.pin_session_active());
drop policy if exists "Require PIN for approvals" on public.profiles;
create policy "Require PIN for approvals" on public.profiles as restrictive for update to authenticated
 using(public.pin_session_active()) with check(public.pin_session_active());
do $$ begin
 if to_regprocedure('public.master_pin_requests_core()') is null then
  alter function public.master_pin_requests() rename to master_pin_requests_core;
  alter function public.approve_pin_reset(uuid) rename to approve_pin_reset_core;
 end if;
end $$;
revoke all on function public.master_pin_requests_core(),public.approve_pin_reset_core(uuid) from public,anon,authenticated;
create or replace function public.master_pin_requests()
returns table(user_id uuid,email text) language plpgsql security definer set search_path=public as $$
begin
 if not public.pin_session_active() then raise exception 'Unlock with your PIN first'; end if;
 return query select * from public.master_pin_requests_core();
end;
$$;
create or replace function public.approve_pin_reset(target_user uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.pin_session_active() then raise exception 'Unlock with your PIN first'; end if;
 perform public.approve_pin_reset_core(target_user);
 delete from public.pin_sessions where user_id=target_user;
end;
$$;
revoke all on function public.master_pin_requests(),public.approve_pin_reset(uuid) from public,anon;
grant execute on function public.master_pin_requests(),public.approve_pin_reset(uuid) to authenticated;
commit;
