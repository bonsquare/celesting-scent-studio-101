-- Enable the user-approved backup master. Run in Supabase SQL Editor.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  approved boolean not null default false,
  status text not null default 'pending',
  role text not null default 'user' check (role in ('user', 'master')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists status text not null default 'pending';
update public.profiles set status = case when approved then 'approved' else coalesce(nullif(status, ''), 'pending') end;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, email, approved, status, role)
  values (new.id, lower(coalesce(new.email, '')), lower(coalesce(new.email, '')) in ('bonie.office@gmail.com','orong.rms@gmail.com'), case when lower(coalesce(new.email, '')) in ('bonie.office@gmail.com','orong.rms@gmail.com') then 'approved' else 'pending' end, case when lower(coalesce(new.email, '')) in ('bonie.office@gmail.com','orong.rms@gmail.com') then 'master' else 'user' end)
  on conflict (user_id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert or update of email on auth.users
for each row execute procedure public.handle_new_user();

insert into public.profiles (user_id, email, approved, status, role)
select id, lower(coalesce(email, '')), lower(coalesce(email, '')) in ('bonie.office@gmail.com','orong.rms@gmail.com'), case when lower(coalesce(email, '')) in ('bonie.office@gmail.com','orong.rms@gmail.com') then 'approved' else 'pending' end, case when lower(coalesce(email, '')) in ('bonie.office@gmail.com','orong.rms@gmail.com') then 'master' else 'user' end from auth.users
on conflict (user_id) do update set email = excluded.email, approved = case when excluded.role = 'master' then true else public.profiles.approved end, status = case when excluded.role = 'master' then 'approved' else public.profiles.status end, role = case when excluded.role = 'master' then 'master' else public.profiles.role end;

alter table public.profiles enable row level security;
drop policy if exists "Users can view their profile" on public.profiles;
create policy "Users can view their profile" on public.profiles for select to authenticated
using (auth.uid() = user_id or lower(coalesce(auth.jwt() ->> 'email', '')) in ('bonie.office@gmail.com','orong.rms@gmail.com'));
drop policy if exists "Master can update approvals" on public.profiles;
create policy "Master can update approvals" on public.profiles for update to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) in ('bonie.office@gmail.com','orong.rms@gmail.com'))
with check (lower(coalesce(auth.jwt() ->> 'email', '')) in ('bonie.office@gmail.com','orong.rms@gmail.com'));

create table if not exists public.app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "Users can read their workspace" on public.app_state;
create policy "Users can read their workspace"
on public.app_state for select
to authenticated
using (auth.uid() = user_id and exists (select 1 from public.profiles where profiles.user_id = auth.uid() and profiles.approved));

drop policy if exists "Users can create their workspace" on public.app_state;
create policy "Users can create their workspace"
on public.app_state for insert
to authenticated
with check (auth.uid() = user_id and exists (select 1 from public.profiles where profiles.user_id = auth.uid() and profiles.approved));

drop policy if exists "Users can update their workspace" on public.app_state;
create policy "Users can update their workspace"
on public.app_state for update
to authenticated
using (auth.uid() = user_id and exists (select 1 from public.profiles where profiles.user_id = auth.uid() and profiles.approved))
with check (auth.uid() = user_id and exists (select 1 from public.profiles where profiles.user_id = auth.uid() and profiles.approved));

-- One shared Celestine workspace. Every approved user reads and writes the same
-- formulation, material, batch, costing, and pricing data.
create table if not exists public.shared_workspace (
  workspace_id text primary key default 'celestine',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.shared_workspace enable row level security;

drop policy if exists "Approved users can read shared workspace" on public.shared_workspace;
create policy "Approved users can read shared workspace"
on public.shared_workspace for select
to authenticated
using (exists (select 1 from public.profiles where profiles.user_id = auth.uid() and profiles.approved));

drop policy if exists "Approved users can create shared workspace" on public.shared_workspace;
create policy "Approved users can create shared workspace"
on public.shared_workspace for insert
to authenticated
with check (workspace_id = 'celestine' and exists (select 1 from public.profiles where profiles.user_id = auth.uid() and profiles.approved));

drop policy if exists "Approved users can update shared workspace" on public.shared_workspace;
create policy "Approved users can update shared workspace"
on public.shared_workspace for update
to authenticated
using (workspace_id = 'celestine' and exists (select 1 from public.profiles where profiles.user_id = auth.uid() and profiles.approved))
with check (workspace_id = 'celestine' and exists (select 1 from public.profiles where profiles.user_id = auth.uid() and profiles.approved));

-- Run once in the Supabase SQL Editor. Requires schema.sql first.
create extension if not exists pgcrypto with schema extensions;
create table if not exists public.pin_credentials (
 user_id uuid primary key references auth.users(id) on delete cascade,
 pin_hash text,
 attempts integer not null default 0,
 locked boolean not null default false,
 reset_requested boolean not null default false,
 must_change boolean not null default false,
 verified_session text
);
alter table public.pin_credentials enable row level security;
revoke all on public.pin_credentials from anon, authenticated;

create or replace function public.pin_action(action text, supplied_pin text default null)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare
 uid uuid := auth.uid();
 credential public.pin_credentials;
 sid text := auth.jwt()->>'session_id';
begin
 if uid is null or sid is null then raise exception 'Sign in first'; end if;
 if not exists(select 1 from public.profiles p where p.user_id=uid and p.approved) then raise exception 'Master approval required'; end if;
 insert into public.pin_credentials(user_id) values(uid) on conflict do nothing;
 select * into credential from public.pin_credentials where user_id=uid for update;
 if action='request_reset' then
  if not credential.locked then raise exception 'Account is not locked'; end if;
  update public.pin_credentials set reset_requested=true where user_id=uid;
  return jsonb_build_object('status','reset_requested');
 end if;
 if credential.locked then return jsonb_build_object('status','locked','attempts',credential.attempts,'requested',credential.reset_requested); end if;
 if action='status' then
  return jsonb_build_object('status',case when credential.pin_hash is null then 'setup' when credential.must_change then 'temporary_pin' else 'enter_pin' end,'attempts',credential.attempts);
 end if;
 if supplied_pin is null or supplied_pin !~ '^[0-9]{4}$' then raise exception 'Enter four digits'; end if;
 if action='set_pin' then
  if credential.pin_hash is not null and (not credential.must_change or credential.verified_session is distinct from sid) then raise exception 'Verify temporary PIN first'; end if;
  if supplied_pin='0000' then raise exception 'Choose a PIN different from 0000'; end if;
  update public.pin_credentials set pin_hash=crypt(supplied_pin,gen_salt('bf')),attempts=0,must_change=false,verified_session=null where user_id=uid;
  return jsonb_build_object('status','unlocked');
 end if;
 if action<>'verify' or credential.pin_hash is null then raise exception 'Set up a PIN first'; end if;
 if crypt(supplied_pin,credential.pin_hash)<>credential.pin_hash then
  update public.pin_credentials set attempts=attempts+1,locked=(attempts+1>=5),verified_session=null where user_id=uid;
  return jsonb_build_object('status',case when credential.attempts+1>=5 then 'locked' else 'incorrect' end,'attempts',credential.attempts+1);
 end if;
 update public.pin_credentials set attempts=0,verified_session=case when must_change then sid else null end where user_id=uid;
 return jsonb_build_object('status',case when credential.must_change then 'new_pin' else 'unlocked' end);
end;
$$;

create or replace function public.master_pin_requests()
returns table(user_id uuid,email text) language plpgsql security definer set search_path=public as $$
begin
 if lower(coalesce(auth.jwt()->>'email',''))not in ('bonie.office@gmail.com','orong.rms@gmail.com') then raise exception 'Master only'; end if;
 return query select p.user_id,p.email from public.profiles p join public.pin_credentials c on c.user_id=p.user_id where c.reset_requested;
end;
$$;
create or replace function public.approve_pin_reset(target_user uuid)
returns void language plpgsql security definer set search_path=public,extensions as $$
begin
 if lower(coalesce(auth.jwt()->>'email',''))not in ('bonie.office@gmail.com','orong.rms@gmail.com') then raise exception 'Master only'; end if;
 update public.pin_credentials set pin_hash=crypt('0000',gen_salt('bf')),attempts=0,locked=false,reset_requested=false,must_change=true,verified_session=null where user_id=target_user and reset_requested;
 if not found then raise exception 'No pending PIN reset request'; end if;
end;
$$;
revoke all on function public.pin_action(text,text),public.master_pin_requests(),public.approve_pin_reset(uuid) from public,anon;
grant execute on function public.pin_action(text,text),public.master_pin_requests(),public.approve_pin_reset(uuid) to authenticated;

