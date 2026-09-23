"use client";

import Link from "next/link";
import { Logo } from "./logo";
import { useCarrinho } from "./carrinho";

export function CabecalhoLoja() {
  const { quantidadeTotal } = useCarrinho();

  return (
    <header className="sticky top-0 z-20 border-b border-linha bg-creme/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" aria-label="Início">
          <Logo />
        </Link>
        <Link href="/carrinho" className="btn btn-contorno btn-pequeno">
          Carrinho
          <span
            className={`grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs ${
              quantidadeTotal > 0 ? "bg-cereja text-white" : "bg-linha text-grafite"
            }`}
          >
            {quantidadeTotal}
          </span>
        </Link>
      </div>
    </header>
  );
}
