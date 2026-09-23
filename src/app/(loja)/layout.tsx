import Script from "next/script";
import { CabecalhoLoja } from "@/components/cabecalho-loja";
import { CarrinhoProvider } from "@/components/carrinho";
import { carregarSeo } from "@/lib/seo";

export default async function LojaLayout({ children }: LayoutProps<"/">) {
  const { googleAnalytics } = await carregarSeo();
  // Só aceita um ID no formato do GA4 (G-XXXXXXX) antes de colocar no script
  const ga = /^G-[A-Z0-9]+$/i.test(googleAnalytics) ? googleAnalytics : null;

  return (
    <CarrinhoProvider>
      {ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="google-analytics" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`}
          </Script>
        </>
      )}
      <CabecalhoLoja />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-12">{children}</main>
      <footer className="border-t border-linha py-6 text-center text-sm text-grafite">
        Cereja Bloom · indie rock de Laguna, SC ·{" "}
        <a href="https://www.cerejabloom.com.br" className="underline hover:text-cereja">
          cerejabloom.com.br
        </a>
      </footer>
    </CarrinhoProvider>
  );
}
