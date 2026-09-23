"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ModoVenda, StatusPedido } from "@/lib/types";

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function definirStatus(pedidoId: string, status: StatusPedido) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("definir_status_pedido", { p_id: pedidoId, p_status: status });
  if (error) return { erro: error.message };
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export type VariacaoForm = { id?: string; tamanho: string; estoque: number };
export type ProdutoForm = {
  id?: string;
  nome: string;
  cor: string;
  estampa: string;
  descricao: string;
  foto_url: string | null;
  preco: number;
  modo: ModoVenda;
  ativo: boolean;
  ordem: number;
  variacoes: VariacaoForm[];
};

export async function salvarProduto(form: ProdutoForm): Promise<{ erro: string } | { id: string }> {
  const supabase = await createClient();
  // A ordem só muda arrastando na lista de camisetas
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { variacoes, id, ordem: _ordem, ...dados } = form;

  if (!dados.nome.trim()) return { erro: "Dê um nome para a camiseta." };
  const tamanhos = variacoes.map((v) => v.tamanho.trim().toUpperCase());
  if (tamanhos.some((t) => !t)) return { erro: "Preencha todos os tamanhos." };
  if (new Set(tamanhos).size !== tamanhos.length) return { erro: "Há tamanhos repetidos." };

  let produtoId = id;
  if (produtoId) {
    const { error } = await supabase.from("produtos").update(dados).eq("id", produtoId);
    if (error) return { erro: error.message };
  } else {
    // Camiseta nova entra no fim da vitrine
    const { data: ultima } = await supabase
      .from("produtos")
      .select("ordem")
      .order("ordem", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data, error } = await supabase
      .from("produtos")
      .insert({ ...dados, ordem: (ultima?.ordem ?? -1) + 1 })
      .select("id")
      .single();
    if (error) return { erro: error.message };
    produtoId = data.id as string;
  }

  // Remove tamanhos apagados no formulário
  const { data: existentes } = await supabase.from("variacoes").select("id").eq("produto_id", produtoId);
  const manter = new Set(variacoes.filter((v) => v.id).map((v) => v.id));
  const remover = (existentes ?? []).map((v) => v.id as string).filter((vid) => !manter.has(vid));
  if (remover.length) {
    const { error } = await supabase.from("variacoes").delete().in("id", remover);
    if (error) {
      return {
        erro:
          error.code === "23503"
            ? "Não dá para apagar um tamanho que já tem pedidos. Zere o estoque dele em vez de apagar."
            : error.message,
      };
    }
  }

  // Temporariamente renomeia para permitir trocar tamanhos entre linhas sem violar o "unique"
  const atualizar = variacoes.filter((v) => v.id);
  for (const v of atualizar) {
    await supabase.from("variacoes").update({ tamanho: `__${v.id}` }).eq("id", v.id!);
  }
  for (const [ordem, v] of variacoes.entries()) {
    const linha = {
      produto_id: produtoId,
      tamanho: v.tamanho.trim().toUpperCase(),
      estoque: Math.trunc(v.estoque) || 0,
      ordem,
    };
    const { error } = v.id
      ? await supabase.from("variacoes").update(linha).eq("id", v.id)
      : await supabase.from("variacoes").insert(linha);
    if (error) return { erro: error.message };
  }

  revalidatePath("/", "layout");
  return { id: produtoId };
}

// Grava a ordem da vitrine a partir da lista arrastada no admin
export async function reordenarProdutos(ids: string[]): Promise<{ erro?: string }> {
  const supabase = await createClient();
  const resultados = await Promise.all(
    ids.map((id, ordem) => supabase.from("produtos").update({ ordem }).eq("id", id)),
  );
  const falha = resultados.find((r) => r.error);
  if (falha?.error) return { erro: falha.error.message };
  revalidatePath("/", "layout");
  return {};
}

export async function excluirProduto(produtoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("produtos").delete().eq("id", produtoId);
  if (error) {
    return {
      erro:
        error.code === "23503"
          ? "Essa camiseta já tem pedidos, então não pode ser excluída. Desative ela para sumir da loja."
          : error.message,
    };
  }
  revalidatePath("/", "layout");
  redirect("/admin/produtos");
}

export async function salvarConfig(formData: FormData) {
  const supabase = await createClient();
  const texto = (campo: string) => String(formData.get(campo) ?? "").trim();
  const { error } = await supabase
    .from("configuracoes")
    .update({
      chave_pix: texto("chave_pix"),
      nome_recebedor: texto("nome_recebedor"),
      cidade: texto("cidade"),
      whatsapp_banda: texto("whatsapp_banda").replace(/\D/g, ""),
      preco_padrao: Number(texto("preco_padrao").replace(",", ".")) || 0,
      loja_aberta: formData.get("loja_aberta") === "on",
    })
    .eq("id", 1);
  if (error) redirect(`/admin/config?erro=${encodeURIComponent(error.message)}`);
  revalidatePath("/", "layout");
  redirect("/admin/config?salvo=1");
}
