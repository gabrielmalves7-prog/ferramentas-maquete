-- xTool Suite — tabelas para proporções salvas e projetos xTool
-- Execute no SQL Editor do Supabase (Project → SQL) ou aplique com a CLI.

create extension if not exists "pgcrypto";

create table if not exists public.saved_scales (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  valor_base double precision not null,
  unidade_base text not null check (unidade_base in ('m', 'cm', 'mm')),
  prop_val double precision not null,
  prop_unit text not null check (prop_unit in ('m', 'cm', 'mm')),
  created_at timestamptz not null default now()
);

create table if not exists public.xtool_projects (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ws_w double precision not null,
  ws_h double precision not null,
  pecas jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.saved_scales enable row level security;
alter table public.xtool_projects enable row level security;

-- Acesso via chave anon do front (app pessoal). Para produção com usuários, troque por policies com auth.uid().

create policy "saved_scales_select_anon" on public.saved_scales
  for select to anon using (true);
create policy "saved_scales_insert_anon" on public.saved_scales
  for insert to anon with check (true);
create policy "saved_scales_delete_anon" on public.saved_scales
  for delete to anon using (true);

create policy "xtool_projects_select_anon" on public.xtool_projects
  for select to anon using (true);
create policy "xtool_projects_insert_anon" on public.xtool_projects
  for insert to anon with check (true);
create policy "xtool_projects_update_anon" on public.xtool_projects
  for update to anon using (true) with check (true);
create policy "xtool_projects_delete_anon" on public.xtool_projects
  for delete to anon using (true);

grant select, insert, delete on table public.saved_scales to anon;
grant select, insert, update, delete on table public.xtool_projects to anon;
