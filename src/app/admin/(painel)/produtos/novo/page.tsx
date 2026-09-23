import { carregarConfig } from "@/lib/supabase/server";
import { TAMANHOS_PADRAO } from "@/lib/types";
import { FormProduto } from "../form-produto";

export default async function NovoProduto() {
  const config = await carregarConfig();
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Nova camiseta</h1>
      <FormProduto
        inicial={{
          nome: "",
          cor: "",
          estampa: "",
          descricao: "",
          foto_url: null,
          preco: Number(config?.preco_padrao ?? 0),
          modo: "pre_venda",
          ativo: true,
          ordem: 0,
          variacoes: TAMANHOS_PADRAO.map((tamanho) => ({ tamanho, estoque: 0, venda_fisica: 0, integrantes: 0 })),
        }}
      />
    </>
  );
}
