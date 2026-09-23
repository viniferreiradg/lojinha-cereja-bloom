-- =====================================================================
-- Atualização 01 — tipo de venda por camiseta ("Comprar" ou "Fazer pré-venda")
-- Para quem já rodou o schema.sql antes. Rode no SQL Editor do Supabase.
-- =====================================================================

alter table produtos add column if not exists modo text not null default 'pre_venda'
  check (modo in ('compra', 'pre_venda'));
alter table itens_pedido add column if not exists modo text not null default 'pre_venda';

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
