import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FotoProduto } from "@/components/foto-produto";
import { formatarPreco } from "@/lib/format";
import { carregarProdutosLoja } from "@/lib/loja";
import { carregarConfig } from "@/lib/supabase/server";
import { MODOS_VENDA } from "@/lib/types";
import { carregarSeo } from "@/lib/seo";
import { cache } from "react";
import { SeletorTamanho } from "./seletor-tamanho";

export const dynamic = "force-dynamic";

// Uma leitura só para os metadados e a página
const carregarProduto = cache(async (id: string) =>
  /^[0-9a-f-]{36}$/i.test(id) ? (await carregarProdutosLoja(id))[0] : undefined,
);

// Nome, tipo e preço primeiro; a descrição do admin completa até ~160 caracteres
function descricaoDe(p: NonNullable<Awaited<ReturnType<typeof carregarProduto>>>) {
  const detalhes = [p.cor, p.estampa].filter(Boolean).join(", ");
  const inicio = `${p.nome}${detalhes ? ` (${detalhes})` : ""}: camiseta oficial da Cereja Bloom. ${
    MODOS_VENDA[p.modo].selo
  } por ${formatarPreco(p.preco)}.`;
  const extra = p.descricao?.replace(/\s+/g, " ").trim();
  if (!extra) return inicio;
  const completa = `${inicio} ${extra}`;
  return completa.length <= 160 ? completa : `${completa.slice(0, 157).trimEnd()}…`;
}

export async function generateMetadata({ params }: PageProps<"/produto/[id]">): Promise<Metadata> {
  const { id } = await params;
  const produto = await carregarProduto(id);
  if (!produto) return {};
  const seo = await carregarSeo();
  const descricao = descricaoDe(produto);
  const imagens = produto.foto_url ? [{ url: produto.foto_url, alt: produto.nome }] : seo.imagem ? [seo.imagem] : undefined;
  return {
    title: produto.nome,
    description: descricao,
    alternates: { canonical: `/produto/${produto.id}` },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: seo.titulo,
      title: `${produto.nome} · ${seo.titulo}`,
      description: descricao,
      url: `/produto/${produto.id}`,
      images: imagens,
    },
    twitter: { card: "summary_large_image", title: produto.nome, description: descricao, images: imagens },
  };
}

export default async function PaginaProduto({ params }: PageProps<"/produto/[id]">) {
  const { id } = await params;
  const [produto, config, seo] = await Promise.all([carregarProduto(id), carregarConfig(), carregarSeo()]);
  if (!produto) notFound();

  // Dados estruturados: o Google pode mostrar preço e disponibilidade no resultado
  const temEstoque = produto.variacoes.some((v) => v.disponivel > 0);
  const dadosEstruturados = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: produto.nome,
    description: descricaoDe(produto),
    image: produto.foto_url ? [produto.foto_url] : undefined,
    color: produto.cor || undefined,
    brand: { "@type": "Brand", name: "Cereja Bloom" },
    offers: {
      "@type": "Offer",
      url: `${seo.urlSite}/produto/${produto.id}`,
      priceCurrency: "BRL",
      price: Number(produto.preco).toFixed(2),
      availability:
        config?.loja_aberta === false || !temEstoque
          ? "https://schema.org/OutOfStock"
          : produto.modo === "pre_venda"
            ? "https://schema.org/PreOrder"
            : "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dadosEstruturados).replace(/</g, "\\u003c") }}
      />
      <Link href="/" className="mb-6 inline-block text-sm font-medium text-grafite hover:text-cereja">
        ← Todos os produtos
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
