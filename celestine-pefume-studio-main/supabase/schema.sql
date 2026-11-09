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
  values (new.id, lower(coalesce(new.email, '')), lower(coalesce(new.email, '')) = 'bonie.office@gmail.com', case when lower(coalesce(new.email, '')) = 'bonie.office@gmail.com' then 'approved' else 'pending' end, case when lower(coalesce(new.email, '')) = 'bonie.office@gmail.com' then 'master' else 'user' end)
  on conflict (user_id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert or update of email on auth.users
for each row execute procedure public.handle_new_user();

insert into public.profiles (user_id, email, approved, status, role)
select id, lower(coalesce(email, '')), lower(coalesce(email, '')) = 'bonie.office@gmail.com', case when lower(coalesce(email, '')) = 'bonie.office@gmail.com' then 'approved' else 'pending' end, case when lower(coalesce(email, '')) = 'bonie.office@gmail.com' then 'master' else 'user' end from auth.users
on conflict (user_id) do update set email = excluded.email, approved = case when excluded.role = 'master' then true else public.profiles.approved end, status = case when excluded.role = 'master' then 'approved' else public.profiles.status end, role = case when excluded.role = 'master' then 'master' else public.profiles.role end;

alter table public.profiles enable row level security;
drop policy if exists "Users can view their profile" on public.profiles;
create policy "Users can view their profile" on public.profiles for select to authenticated
using (auth.uid() = user_id or lower(coalesce(auth.jwt() ->> 'email', '')) = 'bonie.office@gmail.com');
drop policy if exists "Master can update approvals" on public.profiles;
create policy "Master can update approvals" on public.profiles for update to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'bonie.office@gmail.com')
with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'bonie.office@gmail.com');

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
