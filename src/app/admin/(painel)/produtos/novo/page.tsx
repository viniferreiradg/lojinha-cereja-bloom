import { carregarConfig, createClient } from "@/lib/supabase/server";
import { TAMANHOS_PADRAO, type Categoria } from "@/lib/types";
import { FormProduto } from "../form-produto";

export default async function NovoProduto() {
  const supabase = await createClient();
  const [config, { data: categorias }] = await Promise.all([
    carregarConfig(),
    supabase.from("categorias").select("id, nome").order("nome"),
  ]);
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Novo produto</h1>
      <FormProduto
        inicial={{
          nome: "",
          cor: "",
          estampa: "",
          descricao: "",
          foto_url: null,
          preco: Number(config?.preco_padrao ?? 0),
          modo: "pre_venda",
          categoria_id: null,
          ativo: true,
          ordem: 0,
          variacoes: TAMANHOS_PADRAO.map((tamanho) => ({ tamanho, estoque: 0, venda_fisica: 0, integrantes: 0 })),
        }}
        categorias={(categorias ?? []) as Categoria[]}
      />
    </>
  );
}
