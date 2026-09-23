-- =====================================================================
-- Atualização 03 — configurações de SEO
-- Rode no SQL Editor do Supabase.
-- =====================================================================

alter table configuracoes add column if not exists seo_titulo text not null default 'Lojinha da Cereja Bloom';
alter table configuracoes add column if not exists seo_descricao text not null default 'Camisetas oficiais da Cereja Bloom, banda de indie rock de Laguna (SC). Compre ou garanta a sua na pré-venda.';
alter table configuracoes add column if not exists seo_palavras_chave text not null default 'cereja bloom, camiseta, merch, banda, indie rock, laguna';
alter table configuracoes add column if not exists seo_imagem_url text;
alter table configuracoes add column if not exists seo_url_site text not null default '';
alter table configuracoes add column if not exists seo_indexar boolean not null default true;
alter table configuracoes add column if not exists seo_google_verificacao text not null default '';
alter table configuracoes add column if not exists seo_google_analytics text not null default '';
alter table configuracoes add column if not exists seo_instagram text not null default 'cerejabloom';
