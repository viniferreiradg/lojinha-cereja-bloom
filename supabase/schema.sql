-- =====================================================================
-- Lojinha Cereja Bloom — schema do banco
-- Rode este arquivo inteiro no Supabase: SQL Editor → New query → Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------

create table if not exists admins (
  email text primary key
);

create table if not exists configuracoes (
  id int primary key default 1 check (id = 1),
  chave_pix text not null default '',
  nome_recebedor text not null default 'CEREJA BLOOM',
  cidade text not null default 'LAGUNA',
  whatsapp_banda text not null default '',
  preco_padrao numeric(10,2) not null default 80,
  loja_aberta boolean not null default true
);
insert into configuracoes (id) values (1) on conflict do nothing;

create table if not exists produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cor text not null default '',
  estampa text not null default '',
  descricao text not null default '',
  foto_url text,
  preco numeric(10,2) not null check (preco >= 0),
  -- 'compra' = pronta entrega (botão "Comprar"); 'pre_venda' = botão "Fazer pré-venda"
  modo text not null default 'pre_venda' check (modo in ('compra', 'pre_venda')),
  ativo boolean not null default true,
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);

create table if not exists variacoes (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references produtos(id) on delete cascade,
  tamanho text not null,
  ordem int not null default 0,
  estoque int not null default 0,
  -- só o admin vê: não entram no disponível da loja
  venda_fisica int not null default 0 check (venda_fisica >= 0),
  integrantes int not null default 0 check (integrantes >= 0),
  unique (produto_id, tamanho)
);

create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  numero serial unique,
  codigo text generated always as ('CB-' || lpad(numero::text, 4, '0')) stored,
  nome text not null,
  whatsapp text not null,
  total numeric(10,2) not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'cancelado')),
  criado_em timestamptz not null default now(),
  pago_em timestamptz
);

create table if not exists itens_pedido (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos(id) on delete cascade,
  variacao_id uuid not null references variacoes(id) on delete restrict,
  produto_nome text not null,
  cor text not null,
  tamanho text not null,
  quantidade int not null check (quantidade > 0),
  preco_unitario numeric(10,2) not null,
  modo text not null default 'pre_venda'
);

create index if not exists itens_pedido_pedido_idx on itens_pedido (pedido_id);
create index if not exists itens_pedido_variacao_idx on itens_pedido (variacao_id);
create index if not exists variacoes_produto_idx on variacoes (produto_id);

-- ---------------------------------------------------------------------
-- Disponível na loja = estoque real − itens em pedidos pendentes.
-- O estoque real só baixa quando o pedido é marcado como pago.
-- ---------------------------------------------------------------------

create or replace view loja_variacoes as
select
  v.id,
  v.produto_id,
  v.tamanho,
  v.ordem,
  v.estoque,
  v.estoque - coalesce((
    select sum(i.quantidade)
    from itens_pedido i
    join pedidos p on p.id = i.pedido_id
    where i.variacao_id = v.id and p.status = 'pendente'
  ), 0)::int as disponivel
from variacoes v;

-- ---------------------------------------------------------------------
-- Permissões (RLS)
-- ---------------------------------------------------------------------

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where email = auth.jwt() ->> 'email');
$$;

alter table admins enable row level security;
alter table configuracoes enable row level security;
alter table produtos enable row level security;
alter table variacoes enable row level security;
alter table pedidos enable row level security;
alter table itens_pedido enable row level security;

drop policy if exists "admins: admin lê" on admins;
create policy "admins: admin lê" on admins for select using (is_admin());

drop policy if exists "config: todos leem" on configuracoes;
create policy "config: todos leem" on configuracoes for select using (true);
drop policy if exists "config: admin altera" on configuracoes;
create policy "config: admin altera" on configuracoes for update using (is_admin());

drop policy if exists "produtos: loja lê ativos" on produtos;
create policy "produtos: loja lê ativos" on produtos for select using (ativo or is_admin());
drop policy if exists "produtos: admin gerencia" on produtos;
create policy "produtos: admin gerencia" on produtos for all using (is_admin()) with check (is_admin());

-- a loja lê os tamanhos pela view loja_variacoes; a tabela em si fica só para o admin
drop policy if exists "variacoes: todos leem" on variacoes;
revoke select on variacoes from anon;
drop policy if exists "variacoes: admin gerencia" on variacoes;
create policy "variacoes: admin gerencia" on variacoes for all using (is_admin()) with check (is_admin());

drop policy if exists "pedidos: admin gerencia" on pedidos;
create policy "pedidos: admin gerencia" on pedidos for all using (is_admin()) with check (is_admin());

drop policy if exists "itens: admin gerencia" on itens_pedido;
create policy "itens: admin gerencia" on itens_pedido for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- Cliente cria pedido (valida estoque e calcula preço no servidor)
-- p_itens: [{"variacao_id": "...", "quantidade": 2}, ...]
-- ---------------------------------------------------------------------

create or replace function criar_pedido(p_nome text, p_whatsapp text, p_itens jsonb)
returns table (id uuid, codigo text, total numeric)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_pedido pedidos%rowtype;
  v_total numeric(10,2) := 0;
  v_item record;
  v_disponivel int;
begin
  if not (select loja_aberta from configuracoes where configuracoes.id = 1) then
    raise exception 'A Lojinha está fechada no momento.';
  end if;

  p_nome := trim(coalesce(p_nome, ''));
  p_whatsapp := regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g');
  if length(p_nome) < 2 then
    raise exception 'Informe seu nome.';
  end if;
  if length(p_whatsapp) not between 10 and 13 then
    raise exception 'Informe um WhatsApp válido com DDD.';
  end if;
  if p_itens is null or jsonb_array_length(p_itens) = 0 then
    raise exception 'Seu carrinho está vazio.';
  end if;

  -- trava as variações envolvidas para evitar vender a mesma peça duas vezes
  perform 1 from variacoes
  where variacoes.id in (select (e ->> 'variacao_id')::uuid from jsonb_array_elements(p_itens) e)
  order by variacoes.id
  for update;

  insert into pedidos (nome, whatsapp, total)
  values (p_nome, p_whatsapp, 0)
  returning * into v_pedido;

  for v_item in
    select
      (e ->> 'variacao_id')::uuid as variacao_id,
      sum((e ->> 'quantidade')::int)::int as quantidade
    from jsonb_array_elements(p_itens) e
    group by 1
  loop
    if v_item.quantidade < 1 or v_item.quantidade > 20 then
      raise exception 'Quantidade inválida.';
    end if;

    select lv.disponivel into v_disponivel
    from loja_variacoes lv
    join produtos pr on pr.id = lv.produto_id
    where lv.id = v_item.variacao_id and pr.ativo;

    if v_disponivel is null then
      raise exception 'Um dos produtos do carrinho não está mais disponível.';
    end if;

    if v_disponivel < v_item.quantidade then
      raise exception 'Estoque insuficiente de % (%) — restam %.',
        (select pr.nome from variacoes v join produtos pr on pr.id = v.produto_id where v.id = v_item.variacao_id),
        (select v.tamanho from variacoes v where v.id = v_item.variacao_id),
        greatest(v_disponivel, 0);
    end if;

    insert into itens_pedido (pedido_id, variacao_id, produto_nome, cor, tamanho, quantidade, preco_unitario, modo)
    select v_pedido.id, v.id, pr.nome, pr.cor, v.tamanho, v_item.quantidade, pr.preco, pr.modo
    from variacoes v join produtos pr on pr.id = v.produto_id
    where v.id = v_item.variacao_id;
  end loop;

  select coalesce(sum(i.quantidade * i.preco_unitario), 0) into v_total
  from itens_pedido i where i.pedido_id = v_pedido.id;

  update pedidos set total = v_total where pedidos.id = v_pedido.id;

  return query select v_pedido.id, v_pedido.codigo, v_total;
end;
$$;

-- Página de confirmação do cliente (o id do pedido é um UUID impossível de adivinhar)
create or replace function obter_pedido(p_id uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', p.id,
    'codigo', p.codigo,
    'nome', p.nome,
    'total', p.total,
    'status', p.status,
    'itens', coalesce((
      select jsonb_agg(jsonb_build_object(
        'produto_nome', i.produto_nome,
        'cor', i.cor,
        'tamanho', i.tamanho,
        'quantidade', i.quantidade,
        'preco_unitario', i.preco_unitario,
        'modo', i.modo
      ) order by i.produto_nome, i.tamanho)
      from itens_pedido i where i.pedido_id = p.id
    ), '[]'::jsonb)
  )
  from pedidos p where p.id = p_id;
$$;

-- ---------------------------------------------------------------------
-- Admin muda status do pedido. Baixa o estoque ao marcar pago e devolve
-- se o pedido deixar de estar pago.
-- ---------------------------------------------------------------------

create or replace function definir_status_pedido(p_id uuid, p_status text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_antigo text;
begin
  if not is_admin() then
    raise exception 'Sem permissão.';
  end if;
  if p_status not in ('pendente', 'pago', 'cancelado') then
    raise exception 'Status inválido.';
  end if;

  select status into v_antigo from pedidos where id = p_id for update;
  if v_antigo is null then
    raise exception 'Pedido não encontrado.';
  end if;
  if v_antigo = p_status then
    return;
  end if;

  if p_status = 'pago' then
    update variacoes v set estoque = v.estoque - i.quantidade
    from itens_pedido i where i.pedido_id = p_id and i.variacao_id = v.id;
  elsif v_antigo = 'pago' then
    update variacoes v set estoque = v.estoque + i.quantidade
    from itens_pedido i where i.pedido_id = p_id and i.variacao_id = v.id;
  end if;

  update pedidos
  set status = p_status,
      pago_em = case when p_status = 'pago' then now() else null end
  where id = p_id;
end;
$$;

revoke all on function definir_status_pedido(uuid, text) from anon;
grant execute on function criar_pedido(text, text, jsonb) to anon, authenticated;
grant execute on function obter_pedido(uuid) to anon, authenticated;
grant select on loja_variacoes to anon, authenticated;

-- ---------------------------------------------------------------------
-- Fotos dos produtos (Storage)
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do nothing;

drop policy if exists "fotos: admin envia" on storage.objects;
create policy "fotos: admin envia" on storage.objects for insert
  with check (bucket_id = 'produtos' and is_admin());
drop policy if exists "fotos: admin altera" on storage.objects;
create policy "fotos: admin altera" on storage.objects for update
  using (bucket_id = 'produtos' and is_admin());
drop policy if exists "fotos: admin apaga" on storage.objects;
create policy "fotos: admin apaga" on storage.objects for delete
  using (bucket_id = 'produtos' and is_admin());

-- ---------------------------------------------------------------------
-- Quem pode entrar no admin. Troque/adicione os e-mails aqui.
-- (O usuário também precisa ser criado em Authentication → Users.)
-- ---------------------------------------------------------------------

insert into admins (email) values ('vini@viniferreira.com.br') on conflict do nothing;
