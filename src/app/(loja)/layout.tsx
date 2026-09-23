import { CabecalhoLoja } from "@/components/cabecalho-loja";
import { CarrinhoProvider } from "@/components/carrinho";

export default function LojaLayout({ children }: LayoutProps<"/">) {
  return (
    <CarrinhoProvider>
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
