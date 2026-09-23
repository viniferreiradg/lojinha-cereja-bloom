import { createClient } from "@/lib/supabase/server";
import type { Produto, VariacaoLoja } from "@/lib/types";

export type ProdutoLoja = Produto & { variacoes: VariacaoLoja[] };

export async function carregarProdutosLoja(produtoId?: string): Promise<ProdutoLoja[]> {
  const supabase = await createClient();

  let consultaProdutos = supabase
    .from("produtos")
    .select("*")
    .eq("ativo", true)
    .order("ordem")
    .order("criado_em");
  let consultaVariacoes = supabase.from("loja_variacoes").select("*").order("ordem");
  if (produtoId) {
    consultaProdutos = consultaProdutos.eq("id", produtoId);
    consultaVariacoes = consultaVariacoes.eq("produto_id", produtoId);
  }

  const [{ data: produtos }, { data: variacoes }] = await Promise.all([consultaProdutos, consultaVariacoes]);

  return ((produtos ?? []) as Produto[]).map((p) => ({
    ...p,
    variacoes: ((variacoes ?? []) as VariacaoLoja[]).filter((v) => v.produto_id === p.id),
  }));
}
