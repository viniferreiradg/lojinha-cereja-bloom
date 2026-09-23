import Link from "next/link";
import { notFound } from "next/navigation";
import { FotoProduto } from "@/components/foto-produto";
import { formatarPreco } from "@/lib/format";
import { carregarProdutosLoja } from "@/lib/loja";
import { carregarConfig } from "@/lib/supabase/server";
import { MODOS_VENDA } from "@/lib/types";
import { SeletorTamanho } from "./seletor-tamanho";

export const dynamic = "force-dynamic";

export default async function PaginaProduto({ params }: PageProps<"/produto/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [[produto], config] = await Promise.all([carregarProdutosLoja(id), carregarConfig()]);
  if (!produto) notFound();

  return (
    <>
      <Link href="/" className="mb-6 inline-block text-sm font-medium text-grafite hover:text-cereja">
        ← Todas as camisetas
      </Link>
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <div className="overflow-hidden rounded-3xl border border-linha">
          <FotoProduto src={produto.foto_url} alt={produto.nome} className="aspect-[4/5] w-full" />
        </div>
        <div>
          <p className="rotulo text-cereja">
            {[MODOS_VENDA[produto.modo].selo, produto.cor, produto.estampa].filter(Boolean).join(" · ")}
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{produto.nome}</h1>
          <p className="mt-3 text-2xl font-bold">{formatarPreco(produto.preco)}</p>
          {produto.descricao && <p className="mt-4 whitespace-pre-line text-grafite">{produto.descricao}</p>}
          <SeletorTamanho produto={produto} lojaAberta={config?.loja_aberta ?? true} />
        </div>
      </div>
    </>
  );
}
