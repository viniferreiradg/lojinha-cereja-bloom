"use client";

import type { ModoVenda } from "@/lib/types";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ItemCarrinho = {
  variacaoId: string;
  produtoId: string;
  nome: string;
  cor: string;
  tamanho: string;
  preco: number;
  modo: ModoVenda;
  foto: string | null;
  quantidade: number;
};

type Carrinho = {
  itens: ItemCarrinho[];
  quantidadeTotal: number;
  total: number;
  adicionar: (item: Omit<ItemCarrinho, "quantidade">, quantidade: number) => void;
  alterarQuantidade: (variacaoId: string, quantidade: number) => void;
  remover: (variacaoId: string) => void;
  limpar: () => void;
};

const CHAVE = "cereja-bloom-carrinho";
const CarrinhoContext = createContext<Carrinho | null>(null);

export function CarrinhoProvider({ children }: { children: React.ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lê o carrinho salvo só depois de montar, para não quebrar a hidratação
      if (salvo) setItens(JSON.parse(salvo));
    } catch {}
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (!carregado) return;
    try {
      localStorage.setItem(CHAVE, JSON.stringify(itens));
    } catch {}
  }, [itens, carregado]);

  const adicionar = useCallback((item: Omit<ItemCarrinho, "quantidade">, quantidade: number) => {
    setItens((atual) => {
      const existente = atual.find((i) => i.variacaoId === item.variacaoId);
      if (existente) {
        return atual.map((i) =>
          i.variacaoId === item.variacaoId ? { ...i, ...item, quantidade: i.quantidade + quantidade } : i,
        );
      }
      return [...atual, { ...item, quantidade }];
    });
  }, []);

  const alterarQuantidade = useCallback((variacaoId: string, quantidade: number) => {
    setItens((atual) =>
      quantidade <= 0
        ? atual.filter((i) => i.variacaoId !== variacaoId)
        : atual.map((i) => (i.variacaoId === variacaoId ? { ...i, quantidade } : i)),
    );
  }, []);

  const remover = useCallback((variacaoId: string) => {
    setItens((atual) => atual.filter((i) => i.variacaoId !== variacaoId));
  }, []);

  const limpar = useCallback(() => setItens([]), []);

  const valor = useMemo(
    () => ({
      itens,
      quantidadeTotal: itens.reduce((s, i) => s + i.quantidade, 0),
      total: itens.reduce((s, i) => s + i.quantidade * i.preco, 0),
      adicionar,
      alterarQuantidade,
      remover,
      limpar,
    }),
    [itens, adicionar, alterarQuantidade, remover, limpar],
  );

  return <CarrinhoContext.Provider value={valor}>{children}</CarrinhoContext.Provider>;
}

export function useCarrinho() {
  const ctx = useContext(CarrinhoContext);
  if (!ctx) throw new Error("useCarrinho precisa estar dentro de CarrinhoProvider");
  return ctx;
}
