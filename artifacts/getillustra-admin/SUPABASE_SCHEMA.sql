-- =========================================================================
-- GetIllustra Admin — Supabase Schema
-- =========================================================================
-- Paste this entire file into the Supabase SQL Editor and run it once
-- against an empty project. It will create all tables, RLS policies,
-- the auth.users -> profiles trigger, and the analytics RPC functions
-- the admin UI relies on.
--
-- It is idempotent: re-running drops & recreates the helper functions and
-- views; tables and policies are guarded with IF NOT EXISTS where possible.
-- =========================================================================

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------------------
-- Tables
-- -------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.styles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  cover_image text,
  status text not null default 'draft',
  featured boolean not null default false,
  category_id uuid references public.categories(id) on delete set null,
  view_count integer not null default 0,
  download_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_styles (
  project_id uuid not null references public.projects(id) on delete cascade,
  style_id uuid not null references public.styles(id) on delete cascade,
  primary key (project_id, style_id)
);

create table if not exists public.project_tags (
  project_id uuid not null references public.projects(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (project_id, tag_id)
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  is_premium boolean not null default false,
  sort_order integer not null default 0,
  file_type text,
  file_size integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.downloads (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.view_history (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  site_name text not null default 'GetIllustra',
  logo_url text,
  contact_email text,
  featured_items_count integer not null default 6,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed exactly one settings row.
insert into public.settings (site_name)
select 'GetIllustra'
where not exists (select 1 from public.settings);

-- -------------------------------------------------------------------------
-- updated_at triggers
-- -------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  for t in select unnest(array[
    'profiles','categories','styles','tags','projects',
    'assets','settings'
  ]) loop
    execute format('drop trigger if exists trg_set_updated_at on public.%I', t);
    execute format(
      'create trigger trg_set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()', t);
  end loop;
end$$;

-- -------------------------------------------------------------------------
-- auth.users -> profiles trigger
-- -------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any existing auth.users.
insert into public.profiles (id, email, full_name)
select u.id, coalesce(u.email, ''), u.raw_user_meta_data->>'full_name'
from auth.users u
on conflict (id) do nothing;

-- -------------------------------------------------------------------------
-- Row Level Security
-- -------------------------------------------------------------------------
do $$
declare t text;
begin
  for t in select unnest(array[
    'profiles','categories','styles','tags','projects','project_styles',
    'project_tags','assets','downloads','view_history','saved_items','settings'
  ]) loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "auth_all" on public.%I', t);
    execute format(
      'create policy "auth_all" on public.%I
         for all to authenticated using (true) with check (true)', t);
  end loop;
end$$;

-- -------------------------------------------------------------------------
-- Analytics RPCs
-- -------------------------------------------------------------------------
create or replace function public.upload_trend(days integer default 30)
returns table(date date, value integer)
language sql stable as $$
  select date_trunc('day', created_at)::date as date,
         count(*)::int as value
  from public.projects
  where created_at >= now() - (days || ' days')::interval
  group by 1
  order by 1;
$$;

create or replace function public.user_growth(days integer default 90)
returns table(date date, value integer)
language sql stable as $$
  select date_trunc('day', created_at)::date as date,
         count(*)::int as value
  from public.profiles
  where created_at >= now() - (days || ' days')::interval
  group by 1
  order by 1;
$$;

create or replace function public.saves_trend(days integer default 90)
returns table(date date, value integer)
language sql stable as $$
  select date_trunc('day', created_at)::date as date,
         count(*)::int as value
  from public.saved_items
  where created_at >= now() - (days || ' days')::interval
  group by 1
  order by 1;
$$;

create or replace function public.most_downloaded_assets(lim integer default 10)
returns table(id uuid, name text, project_title text, download_count integer)
language sql stable as $$
  select a.id, a.name, p.title as project_title,
         count(d.id)::int as download_count
  from public.assets a
  left join public.downloads d on d.asset_id = a.id
  left join public.projects p on p.id = a.project_id
  group by a.id, p.title
  order by count(d.id) desc
  limit lim;
$$;

create or replace function public.top_categories(lim integer default 8)
returns table(id uuid, name text, count integer)
language sql stable as $$
  select c.id, c.name, count(p.id)::int as count
  from public.categories c
  left join public.projects p on p.category_id = c.id
  group by c.id, c.name
  order by count(p.id) desc
  limit lim;
$$;

create or replace function public.dashboard_stats()
returns table(
  total_projects integer,
  total_assets integer,
  published_projects integer,
  total_users integer,
  downloads_this_month integer
)
language sql stable as $$
  select
    (select count(*) from public.projects)::int,
    (select count(*) from public.assets)::int,
    (select count(*) from public.projects where status = 'published')::int,
    (select count(*) from public.profiles)::int,
    (select count(*) from public.downloads
       where created_at >= date_trunc('month', now()))::int;
$$;

create or replace function public.recent_activity()
returns table(
  id text,
  type text,
  description text,
  timestamp timestamptz,
  user_id uuid,
  user_name text
)
language sql stable as $$
  with proj as (
    select 'proj-' || id::text as id,
           case
             when abs(extract(epoch from (updated_at - created_at))) < 5 then 'upload'
             when status = 'published' then 'publish'
             else 'edit'
           end as type,
           case
             when abs(extract(epoch from (updated_at - created_at))) < 5
               then 'New project "' || title || '" uploaded'
             when status = 'published'
               then 'Project "' || title || '" published'
             else 'Project "' || title || '" updated'
           end as description,
           updated_at as timestamp,
           null::uuid as user_id,
           null::text as user_name
    from public.projects
    order by updated_at desc
    limit 5
  ),
  usr as (
    select 'user-' || id::text as id,
           'new_user' as type,
           'New user ' || coalesce(full_name, email) || ' joined' as description,
           created_at as timestamp,
           id as user_id,
           coalesce(full_name, email) as user_name
    from public.profiles
    order by created_at desc
    limit 3
  )
  select * from proj
  union all
  select * from usr
  order by timestamp desc
  limit 10;
$$;

-- -------------------------------------------------------------------------
-- Storage bucket for asset uploads
-- -------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do update set public = true;

drop policy if exists "assets_public_read" on storage.objects;
create policy "assets_public_read" on storage.objects
  for select to public using (bucket_id = 'assets');

drop policy if exists "assets_auth_write" on storage.objects;
create policy "assets_auth_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'assets');

drop policy if exists "assets_auth_update" on storage.objects;
create policy "assets_auth_update" on storage.objects
  for update to authenticated using (bucket_id = 'assets');

drop policy if exists "assets_auth_delete" on storage.objects;
create policy "assets_auth_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'assets');
