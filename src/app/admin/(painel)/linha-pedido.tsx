"use client";

import { useState, useTransition } from "react";
import { formatarData, formatarPreco, formatarWhatsapp, linkWhatsapp } from "@/lib/format";
import type { Pedido, StatusPedido } from "@/lib/types";
import { definirStatus } from "../actions";

export function LinhaPedido({ pedido }: { pedido: Pedido }) {
  const [salvando, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const pago = pedido.status === "pago";
  const cancelado = pedido.status === "cancelado";

  function mudar(status: StatusPedido, confirmacao?: string) {
    if (confirmacao && !confirm(confirmacao)) return;
    setErro(null);
    iniciar(async () => {
      const r = await definirStatus(pedido.id, status);
      if ("erro" in r && r.erro) setErro(r.erro);
    });
  }

  return (
    <li
      className={`cartao flex flex-col gap-3 p-4 sm:flex-row sm:items-center ${cancelado ? "opacity-60" : ""} ${
        salvando ? "animate-pulse" : ""
      }`}
    >
      <label
        className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3 py-2 font-bold ring-1 sm:w-32 ${
          pago ? "bg-musgo-claro text-musgo ring-musgo/30" : "ring-linha"
        } ${cancelado ? "cursor-not-allowed" : ""}`}
      >
        <input
          type="checkbox"
          className="h-5 w-5 accent-[#2f7a4b]"
          checked={pago}
          disabled={cancelado || salvando}
          onChange={(e) => mudar(e.target.checked ? "pago" : "pendente")}
        />
        {pago ? "Pago" : "Pago?"}
      </label>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <span className="font-mono text-sm font-bold text-cereja">{pedido.codigo}</span>
          <span className="font-bold">{pedido.nome}</span>
          <a
            href={linkWhatsapp(pedido.whatsapp, `Oi ${pedido.nome.split(" ")[0]}! Sobre seu pedido ${pedido.codigo} da Cereja Bloom:`)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-grafite underline hover:text-cereja"
          >
            {formatarWhatsapp(pedido.whatsapp)}
          </a>
          <span className="text-xs text-grafite">{formatarData(pedido.criado_em)}</span>
        </div>
        <ul className="mt-1 flex flex-wrap gap-1.5">
          {pedido.itens_pedido.map((i, n) => (
            <li key={n} className="rounded-lg bg-creme px-2 py-0.5 text-sm ring-1 ring-linha">
              {i.quantidade}× {i.produto_nome}
              {i.cor && <span className="text-grafite"> · {i.cor}</span>} · <strong>{i.tamanho}</strong>
              {i.modo === "pre_venda" && <span className="ml-1 text-xs font-bold text-cereja">pré-venda</span>}
            </li>
          ))}
        </ul>
        {erro && <p className="mt-1 text-sm text-cereja">{erro}</p>}
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <span className="text-lg font-bold">{formatarPreco(Number(pedido.total))}</span>
        {cancelado ? (
          <button className="text-sm text-grafite underline hover:text-tinta" onClick={() => mudar("pendente")}>
            reativar
          </button>
        ) : (
          <button
            className="text-sm text-grafite underline hover:text-cereja"
            onClick={() =>
              mudar(
                "cancelado",
                pago
                  ? `Cancelar ${pedido.codigo}? Ele está marcado como pago — as peças voltam para o estoque.`
                  : `Cancelar ${pedido.codigo}? As peças voltam a ficar disponíveis na loja.`,
              )
            }
          >
            cancelar
          </button>
        )}
      </div>
    </li>
  );
}
