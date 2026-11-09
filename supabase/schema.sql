-- À exécuter une fois dans Supabase : SQL Editor → New query → coller → Run.
-- Table propre à PowerPoint Dojo (ne touche pas à celle de l'Excel Dojo). Une ligne par utilisateur : sa progression en JSON.
-- Chacun ne voit et ne modifie que SA ligne.
create table if not exists public.pptdojo_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.pptdojo_progress enable row level security;

drop policy if exists "pptdojo_select_own" on public.pptdojo_progress;
drop policy if exists "pptdojo_insert_own" on public.pptdojo_progress;
drop policy if exists "pptdojo_update_own" on public.pptdojo_progress;

create policy "pptdojo_select_own" on public.pptdojo_progress for select using (auth.uid() = user_id);
create policy "pptdojo_insert_own" on public.pptdojo_progress for insert with check (auth.uid() = user_id);
create policy "pptdojo_update_own" on public.pptdojo_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
