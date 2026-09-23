"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useCarrinho } from "@/components/carrinho";
import { FotoProduto } from "@/components/foto-produto";
import { formatarPreco } from "@/lib/format";
import { MODOS_VENDA } from "@/lib/types";
import { criarPedido } from "./actions";

function mascaraWhatsapp(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function PaginaCarrinho() {
  const { itens, total, alterarQuantidade, remover, limpar } = useCarrinho();
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  function finalizar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    iniciar(async () => {
      const resultado = await criarPedido(
        nome,
        whatsapp,
        itens.map((i) => ({ variacao_id: i.variacaoId, quantidade: i.quantidade })),
      );
      if ("erro" in resultado) {
        setErro(resultado.erro);
        return;
      }
      limpar();
      router.push(`/pedido/${resultado.id}`);
    });
  }

  if (itens.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="titulo text-4xl">carrinho vazio</h1>
        <p className="mt-3 text-grafite">Escolha uma camiseta para começar.</p>
        <Link href="/" className="btn btn-primario mt-8">
          Ver camisetas
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <section>
        <h1 className="titulo mb-6 text-4xl sm:text-5xl">carrinho</h1>
        <ul className="space-y-3">
          {itens.map((item) => (
            <li key={item.variacaoId} className="cartao flex gap-4 p-3">
              <FotoProduto src={item.foto} alt={item.nome} className="h-24 w-20 shrink-0 rounded-xl" />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold leading-tight">{item.nome}</p>
                    <p className="text-sm text-grafite">
                      {item.cor ? `${item.cor} · ` : ""}Tamanho {item.tamanho}
                    </p>
                    {item.modo && <p className="rotulo mt-0.5 text-[0.65rem] text-cereja">{MODOS_VENDA[item.modo].selo}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => remover(item.variacaoId)}
                    className="text-sm text-grafite underline hover:text-cereja"
                  >
                    remover
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-full border border-linha">
                    <button
                      type="button"
                      aria-label="Diminuir"
                      className="h-8 w-8"
                      onClick={() => alterarQuantidade(item.variacaoId, item.quantidade - 1)}
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{item.quantidade}</span>
                    <button
                      type="button"
                      aria-label="Aumentar"
                      className="h-8 w-8"
                      onClick={() => alterarQuantidade(item.variacaoId, item.quantidade + 1)}
                    >
                      +
                    </button>
                  </div>
                  <span className="font-bold">{formatarPreco(item.preco * item.quantidade)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={finalizar} className="cartao h-fit space-y-4 p-5 lg:sticky lg:top-24">
        <h2 className="text-xl font-bold">Seus dados</h2>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Nome</span>
          <input
            className="campo"
            required
            minLength={2}
            autoComplete="name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">WhatsApp com DDD</span>
          <input
            className="campo"
            required
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="(48) 99999-9999"
            pattern="\(\d{2}\) \d{4,5}-\d{4}"
            title="Digite o número com DDD"
            value={whatsapp}
            onChange={(e) => setWhatsapp(mascaraWhatsapp(e.target.value))}
          />
        </label>

        <div className="flex items-baseline justify-between border-t border-linha pt-4">
          <span className="font-medium">Total</span>
          <span className="text-2xl font-bold text-cereja">{formatarPreco(total)}</span>
        </div>

        {erro && <p className="rounded-xl bg-cereja-clara p-3 text-sm font-medium text-cereja-escura">{erro}</p>}

        <button type="submit" className="btn btn-primario w-full" disabled={enviando}>
          {enviando ? "Criando pedido…" : "Finalizar e pagar com PIX"}
        </button>
        <p className="text-center text-xs text-grafite">
          Na próxima tela aparece o código PIX. Seu pedido fica reservado até a gente confirmar o pagamento.
        </p>
      </form>
    </div>
  );
}
