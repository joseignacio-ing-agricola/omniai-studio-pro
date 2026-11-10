-- Run in Supabase SQL Editor. Enable Email auth in Supabase Auth settings.
create extension if not exists pgcrypto;
create table if not exists public.projects(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,title text not null check(char_length(title) between 1 and 120),created_at timestamptz not null default now());
create table if not exists public.messages(id uuid primary key default gen_random_uuid(),project_id uuid not null references public.projects(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,role text not null check(role in ('user','assistant')),content text not null check(char_length(content) between 1 and 100000),provider text,created_at timestamptz not null default now());
create index if not exists projects_user_idx on public.projects(user_id,created_at desc);
create index if not exists messages_project_idx on public.messages(project_id,created_at,id);
alter table public.projects enable row level security;
alter table public.messages enable row level security;
create policy "project owner read" on public.projects for select to authenticated using(user_id=(select auth.uid()));
create policy "project owner insert" on public.projects for insert to authenticated with check(user_id=(select auth.uid()));
create policy "project owner update" on public.projects for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "project owner delete" on public.projects for delete to authenticated using(user_id=(select auth.uid()));
create policy "message owner read" on public.messages for select to authenticated using(user_id=(select auth.uid()) and exists(select 1 from public.projects p where p.id=project_id and p.user_id=(select auth.uid())));
create policy "message owner insert" on public.messages for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.projects p where p.id=project_id and p.user_id=(select auth.uid())));
-- No direct update/delete for messages; keep immutable history.