import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Produto, VariacaoLoja } from "@/lib/types";
import { FormProduto } from "../form-produto";

export const dynamic = "force-dynamic";

export default async function EditarProduto({ params }: PageProps<"/admin/produtos/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const [{ data: produto }, { data: variacoes }] = await Promise.all([
    supabase.from("produtos").select("*").eq("id", id).single(),
    supabase.from("loja_variacoes").select("*").eq("produto_id", id).order("ordem"),
  ]);
  if (!produto) notFound();

  const p = produto as Produto;
  const vs = (variacoes ?? []) as VariacaoLoja[];

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Editar camiseta</h1>
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
          variacoes: vs.map((v) => ({ id: v.id, tamanho: v.tamanho, estoque: v.estoque })),
        }}
        reservados={Object.fromEntries(vs.map((v) => [v.id, v.estoque - v.disponivel]))}
      />
    </>
  );
}
