-- =====================================================================
-- Atualização 02 — venda física e camisetas dos integrantes, por tamanho
-- Só o admin vê esses números; eles não entram no disponível da loja.
-- Rode no SQL Editor do Supabase.
-- =====================================================================

alter table variacoes add column if not exists venda_fisica int not null default 0 check (venda_fisica >= 0);
alter table variacoes add column if not exists integrantes int not null default 0 check (integrantes >= 0);

-- A loja lê os tamanhos pela view loja_variacoes; a tabela em si fica só para o admin
drop policy if exists "variacoes: todos leem" on variacoes;
revoke select on variacoes from anon;
