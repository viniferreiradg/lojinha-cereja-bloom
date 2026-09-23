"use client";

import Link from "next/link";
import { useState } from "react";
import { useCarrinho } from "@/components/carrinho";
import type { ProdutoLoja } from "@/lib/loja";
import { MODOS_VENDA } from "@/lib/types";

export function SeletorTamanho({ produto, lojaAberta }: { produto: ProdutoLoja; lojaAberta: boolean }) {
  const { itens, adicionar } = useCarrinho();
  const [tamanhoId, setTamanhoId] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [adicionado, setAdicionado] = useState(false);

  const variacao = produto.variacoes.find((v) => v.id === tamanhoId);
  const noCarrinho = (id: string) => itens.find((i) => i.variacaoId === id)?.quantidade ?? 0;
  const restante = variacao ? variacao.disponivel - noCarrinho(variacao.id) : 0;

  function escolher(id: string) {
    setTamanhoId(id);
    setQuantidade(1);
    setAdicionado(false);
  }

  function adicionarAoCarrinho() {
    if (!variacao) return;
    adicionar(
      {
        variacaoId: variacao.id,
        produtoId: produto.id,
        nome: produto.nome,
        cor: produto.cor,
        tamanho: variacao.tamanho,
        preco: produto.preco,
        modo: produto.modo,
        foto: produto.foto_url,
      },
      quantidade,
    );
    setAdicionado(true);
    setQuantidade(1);
  }

  if (!lojaAberta) {
    return <p className="cartao mt-8 bg-cereja-clara p-4 font-medium">A Lojinha está fechada no momento.</p>;
  }

  return (
    <div className="mt-8">
      <p className="rotulo mb-3">Tamanho</p>
      <div className="flex flex-wrap gap-2">
        {produto.variacoes.map((v) => {
          const esgotado = v.disponivel <= 0;
          const ativo = v.id === tamanhoId;
          return (
            <button
              key={v.id}
              type="button"
              disabled={esgotado}
              onClick={() => escolher(v.id)}
              className={`flex min-w-16 flex-col items-center rounded-xl border-2 px-3 py-2 transition ${
                ativo
                  ? "border-tinta bg-tinta text-creme"
                  : esgotado
                    ? "cursor-not-allowed border-linha text-areia"
                    : "border-linha bg-papel hover:border-tinta"
              }`}
            >
              <span className={`text-lg font-bold ${esgotado ? "line-through" : ""}`}>{v.tamanho}</span>
              <span
                className={`text-xs ${
                  ativo ? "text-creme/80" : esgotado ? "" : v.disponivel <= 5 ? "font-bold text-cereja" : "text-grafite"
                }`}
              >
                {esgotado ? "esgotado" : `${v.disponivel} ${v.disponivel === 1 ? "restante" : "restantes"}`}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full border-2 border-linha bg-papel">
          <button
            type="button"
            aria-label="Diminuir"
            className="h-11 w-11 text-xl disabled:text-areia"
            disabled={quantidade <= 1}
            onClick={() => setQuantidade((q) => q - 1)}
          >
            −
          </button>
          <span className="w-8 text-center font-bold">{quantidade}</span>
          <button
            type="button"
            aria-label="Aumentar"
            className="h-11 w-11 text-xl disabled:text-areia"
            disabled={!variacao || quantidade >= restante}
            onClick={() => setQuantidade((q) => q + 1)}
          >
            +
          </button>
        </div>
        <button
          type="button"
          className="btn btn-primario flex-1 sm:flex-none"
          disabled={!variacao || restante < quantidade}
          onClick={adicionarAoCarrinho}
        >
          {variacao ? MODOS_VENDA[produto.modo].botao : "Escolha um tamanho"}
        </button>
      </div>

      {variacao && restante <= 0 && !adicionado && (
        <p className="mt-3 text-sm text-grafite">Você já colocou todas as unidades desse tamanho no carrinho.</p>
      )}

      {adicionado && (
        <div className="cartao mt-5 flex flex-wrap items-center justify-between gap-3 border-musgo/30 bg-musgo-claro p-4">
          <span className="font-medium text-musgo">✓ Adicionado ao carrinho</span>
          <Link href="/carrinho" className="btn btn-contorno btn-pequeno">
            Ver carrinho
          </Link>
        </div>
      )}
    </div>
  );
}
