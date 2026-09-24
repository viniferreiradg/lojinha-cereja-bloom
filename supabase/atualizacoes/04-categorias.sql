-- =====================================================================
-- Atualização 04 — categorias de produto (só para o admin organizar)
-- Rode no SQL Editor do Supabase.
-- =====================================================================

create table if not exists categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(trim(nome)) > 0),
  criado_em timestamptz not null default now()
);
create unique index if not exists categorias_nome_unico on categorias (lower(trim(nome)));

alter table produtos add column if not exists categoria_id uuid references categorias(id) on delete set null;

alter table categorias enable row level security;
drop policy if exists "categorias: admin gerencia" on categorias;
create policy "categorias: admin gerencia" on categorias for all using (is_admin()) with check (is_admin());
