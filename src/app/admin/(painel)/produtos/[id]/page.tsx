import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Produto, VariacaoLoja } from "@/lib/types";
import { FormProduto } from "../form-produto";

export const dynamic = "force-dynamic";

export default async function EditarProduto({ params }: PageProps<"/admin/produtos/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const [{ data: produto }, { data: variacoes }, { data: extras }] = await Promise.all([
    supabase.from("produtos").select("*").eq("id", id).single(),
    supabase.from("loja_variacoes").select("*").eq("produto_id", id).order("ordem"),
    supabase.from("variacoes").select("id, venda_fisica, integrantes").eq("produto_id", id),
  ]);
  if (!produto) notFound();

  const p = produto as Produto;
  const vs = (variacoes ?? []) as VariacaoLoja[];
  const extra = new Map((extras ?? []).map((e) => [e.id as string, e as { venda_fisica: number; integrantes: number }]));

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Editar produto</h1>
      <FormProduto
        inicial={{
          id: p.id,
          nome: p.nome,
          cor: p.cor,
          estampa: p.estampa,
          descricao: p.descricao,
          foto_url: p.foto_url,
          preco: Number(p.preco),
          modo: p.modo,
          ativo: p.ativo,
          ordem: p.ordem,
          variacoes: vs.map((v) => ({
            id: v.id,
            tamanho: v.tamanho,
            estoque: v.estoque,
            venda_fisica: extra.get(v.id)?.venda_fisica ?? 0,
            integrantes: extra.get(v.id)?.integrantes ?? 0,
          })),
        }}
        reservados={Object.fromEntries(vs.map((v) => [v.id, v.estoque - v.disponivel]))}
      />
    </>
  );
}
