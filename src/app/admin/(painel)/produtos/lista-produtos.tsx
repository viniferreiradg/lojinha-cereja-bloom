"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useState, useTransition } from "react";
import { FotoProduto } from "@/components/foto-produto";
import { formatarPreco } from "@/lib/format";
import { MODOS_VENDA, type Produto, type VariacaoLoja } from "@/lib/types";
import { reordenarProdutos } from "../../actions";

type ProdutoAdmin = Produto & { variacoes: VariacaoLoja[] };

export function ListaProdutos({ produtos: inicial }: { produtos: ProdutoAdmin[] }) {
  const [produtos, setProdutos] = useState(inicial);
  const [salvando, iniciar] = useTransition();
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function soltar({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const anterior = produtos;
    const de = produtos.findIndex((p) => p.id === active.id);
    const para = produtos.findIndex((p) => p.id === over.id);
    const nova = arrayMove(produtos, de, para);
    setProdutos(nova);
    setAviso(null);
    iniciar(async () => {
      const r = await reordenarProdutos(nova.map((p) => p.id));
      if (r.erro) {
        setProdutos(anterior);
        setAviso({ tipo: "erro", texto: `Não foi possível salvar a ordem: ${r.erro}` });
      } else {
        setAviso({ tipo: "ok", texto: "✓ Ordem salva" });
      }
    });
  }

  return (
    <>
      <p className="mb-3 flex min-h-5 items-center justify-between gap-3 text-sm text-grafite">
        <span>Arraste pelo ⠿ para mudar a ordem em que as camisetas aparecem na loja.</span>
        {salvando ? (
          <span className="shrink-0">Salvando…</span>
        ) : (
          aviso && (
            <span className={`shrink-0 font-medium ${aviso.tipo === "ok" ? "text-musgo" : "text-cereja"}`}>
              {aviso.texto}
            </span>
          )
        )}
      </p>
      <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={soltar}>
        <SortableContext items={produtos.map((p) => p.id)} strategy={rectSortingStrategy}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {produtos.map((p, i) => (
              <ItemProduto key={p.id} produto={p} posicao={i + 1} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </>
  );
}

function ItemProduto({ produto: p, posicao }: { produto: ProdutoAdmin; posicao: number }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: p.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`cartao flex items-stretch ${isDragging ? "relative z-10 shadow-xl ring-2 ring-tinta" : ""}`}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Arrastar ${p.nome}`}
        className="flex w-10 shrink-0 cursor-grab touch-none flex-col items-center justify-center gap-1 rounded-l-[1.25rem] border-r border-linha text-grafite hover:bg-creme hover:text-tinta active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <span className="text-xl leading-none">⠿</span>
        <span className="text-xs font-bold">{posicao}</span>
      </button>
      <Link href={`/admin/produtos/${p.id}`} className="flex min-w-0 flex-1 gap-4 p-3 hover:bg-creme/60">
        <FotoProduto src={p.foto_url} alt={p.nome} className="h-28 w-24 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold leading-tight">{p.nome}</p>
            {!p.ativo && <span className="rotulo shrink-0 rounded-full bg-linha px-2 py-0.5 text-[0.6rem]">oculta</span>}
          </div>
          <p className="text-sm text-grafite">{[p.cor, p.estampa].filter(Boolean).join(" · ")}</p>
          <p className="text-sm">
            <strong className="text-cereja">{formatarPreco(Number(p.preco))}</strong>
            <span className="text-grafite"> · botão “{MODOS_VENDA[p.modo].botao}”</span>
          </p>
          <ul className="mt-2 flex flex-wrap gap-1">
            {p.variacoes.map((v) => (
              <li
                key={v.id}
                title={`Estoque ${v.estoque} · disponível na loja ${v.disponivel}`}
                className={`rounded-md px-1.5 py-0.5 text-xs ring-1 ${
                  v.disponivel <= 0 ? "bg-cereja-clara text-cereja-escura ring-cereja/20" : "ring-linha"
                }`}
              >
                <strong>{v.tamanho}</strong> {v.disponivel}/{v.estoque}
              </li>
            ))}
          </ul>
        </div>
      </Link>
    </li>
  );
}
