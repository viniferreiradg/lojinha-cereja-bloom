import Link from "next/link";
import { FotoProduto } from "@/components/foto-produto";
import { formatarPreco } from "@/lib/format";
import { carregarProdutosLoja } from "@/lib/loja";
import { carregarSeo } from "@/lib/seo";
import { carregarConfig } from "@/lib/supabase/server";
import { MODOS_VENDA } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { alternates: { canonical: "/" } };

export default async function Vitrine() {
  const [produtos, config, seo] = await Promise.all([carregarProdutosLoja(), carregarConfig(), carregarSeo()]);
  // Liga a Lojinha ao site e ao Instagram da banda no Google
  const dadosEstruturados = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: seo.titulo,
    description: seo.descricao,
    url: seo.urlSite,
    logo: `${seo.urlSite}/web-app-manifest-512x512.png`,
    sameAs: ["https://www.cerejabloom.com.br", ...(seo.instagram ? [`https://www.instagram.com/${seo.instagram}`] : [])],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dadosEstruturados).replace(/</g, "\\u003c") }}
      />
      <section className="mb-10 sm:mb-14">
        <p className="rotulo mb-3 text-cereja">Cereja Bloom</p>
        <h1 className="titulo text-5xl leading-none sm:text-7xl">lojinha</h1>
        <div className="mt-4 max-w-xl space-y-3 text-lg text-grafite">
          <p>
            Escolha seus produtos e as opções (tamanho, cor), adicione ao carrinho, faça o Pix e mande o comprovante
            pra gente.
          </p>
          <p>
            Ficou com alguma dúvida?{" "}
            <a
              href="https://api.whatsapp.com/send/?phone=5548999450235"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-cereja underline underline-offset-2 hover:text-cereja-escura"
            >
              Chama no zap
            </a>
            .
          </p>
          <p>Fique à vontade!</p>
        </div>
      </section>

      {config && !config.loja_aberta && (
        <div className="cartao mb-8 border-cereja/30 bg-cereja-clara p-5 font-medium">
          A Lojinha está fechada no momento. Obrigado a todo mundo que garantiu a sua! 🍒
        </div>
      )}

      {produtos.length === 0 ? (
        <p className="text-grafite">Nenhuma camiseta disponível ainda. Volte em breve!</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
          {produtos.map((p) => {
            const esgotado = p.variacoes.every((v) => v.disponivel <= 0);
            return (
              <li key={p.id}>
                <Link href={`/produto/${p.id}`} className="group block">
                  <div className="relative overflow-hidden rounded-2xl border border-linha">
                    <FotoProduto
                      src={p.foto_url}
                      alt={p.nome}
                      className="aspect-[4/5] w-full transition duration-300 group-hover:scale-[1.03]"
                    />
                    <span
                      className={`rotulo absolute left-3 top-3 rounded-full px-3 py-1 ${
                        esgotado ? "bg-tinta text-creme" : p.modo === "pre_venda" ? "bg-cereja text-white" : "bg-papel text-tinta"
                      }`}
                    >
                      {esgotado ? "Esgotado" : MODOS_VENDA[p.modo].selo}
                    </span>
                  </div>
                  <div className="mt-3">
                    <h2 className="font-bold leading-tight group-hover:text-cereja sm:text-lg">{p.nome}</h2>
                    <p className="text-sm text-grafite">{[p.cor, p.estampa].filter(Boolean).join(" · ")}</p>
                    {p.variacoes.length > 0 && (
                      <ul className="mt-1.5 flex flex-wrap gap-1" aria-label="Tamanhos">
                        {p.variacoes.map((v) => {
                          const acabou = v.disponivel <= 0;
                          return (
                            <li
                              key={v.id}
                              title={acabou ? `${v.tamanho} esgotado` : `${v.tamanho} disponível`}
                              className={`min-w-7 rounded-md px-1.5 py-0.5 text-center text-xs font-bold ring-1 ring-inset ${
                                acabou ? "text-areia line-through ring-linha" : "bg-papel text-tinta ring-areia"
                              }`}
                            >
                              {v.tamanho}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    <p className="mt-1.5 font-bold text-cereja">{formatarPreco(p.preco)}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
