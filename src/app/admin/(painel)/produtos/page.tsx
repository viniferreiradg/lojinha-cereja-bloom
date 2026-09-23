import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Produto, VariacaoLoja } from "@/lib/types";
import { ListaProdutos } from "./lista-produtos";

export const dynamic = "force-dynamic";

export default async function Produtos() {
  const supabase = await createClient();
  const [{ data: produtos }, { data: variacoes }] = await Promise.all([
    supabase.from("produtos").select("*").order("ordem").order("criado_em"),
    supabase.from("loja_variacoes").select("*").order("ordem"),
  ]);

  const lista = ((produtos ?? []) as Produto[]).map((p) => ({
    ...p,
    variacoes: ((variacoes ?? []) as VariacaoLoja[]).filter((v) => v.produto_id === p.id),
  }));

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Camisetas</h1>
        <Link href="/admin/produtos/novo" className="btn btn-primario btn-pequeno">
          + Nova camiseta
        </Link>
      </div>

      {lista.length === 0 ? (
        <p className="cartao p-8 text-center text-grafite">Nenhuma camiseta cadastrada ainda.</p>
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
