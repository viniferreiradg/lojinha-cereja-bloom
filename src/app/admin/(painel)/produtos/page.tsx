import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Categoria, Produto, VariacaoLoja } from "@/lib/types";
import { ListaProdutos } from "./lista-produtos";

export const dynamic = "force-dynamic";

export default async function Produtos() {
  const supabase = await createClient();
  const [{ data: produtos }, { data: variacoes }, { data: categorias }] = await Promise.all([
    supabase.from("produtos").select("*").order("ordem").order("criado_em"),
    supabase.from("loja_variacoes").select("*").order("ordem"),
    supabase.from("categorias").select("id, nome"),
  ]);
  const nomeCategoria = new Map(((categorias ?? []) as Categoria[]).map((c) => [c.id, c.nome]));

  const lista = ((produtos ?? []) as Produto[]).map((p) => ({
    ...p,
    categoria: p.categoria_id ? (nomeCategoria.get(p.categoria_id) ?? null) : null,
    variacoes: ((variacoes ?? []) as VariacaoLoja[]).filter((v) => v.produto_id === p.id),
  }));

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <Link href="/admin/produtos/novo" className="btn btn-primario btn-pequeno">
          + Novo produto
        </Link>
      </div>

      {lista.length === 0 ? (
        <p className="cartao p-8 text-center text-grafite">Nenhum produto cadastrado ainda.</p>
      ) : (
        <ListaProdutos produtos={lista} />
      )}
      <p className="mt-4 text-xs text-grafite">
        Nos tamanhos: <strong>disponível na loja / estoque</strong>. O disponível já desconta os pedidos aguardando
        pagamento; o estoque só baixa quando você marca o pedido como pago.
      </p>
    </>
  );
}
