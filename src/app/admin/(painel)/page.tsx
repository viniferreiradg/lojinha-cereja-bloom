import Link from "next/link";
import { formatarPreco } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Pedido, StatusPedido } from "@/lib/types";
import { LinhaPedido } from "./linha-pedido";

export const dynamic = "force-dynamic";

const FILTROS: { valor: StatusPedido | "todos"; rotulo: string }[] = [
  { valor: "pendente", rotulo: "Aguardando pagamento" },
  { valor: "pago", rotulo: "Pagos" },
  { valor: "cancelado", rotulo: "Cancelados" },
  { valor: "todos", rotulo: "Todos" },
];

export default async function Pedidos({ searchParams }: PageProps<"/admin">) {
  const params = await searchParams;
  const status = (typeof params.status === "string" ? params.status : "pendente") as StatusPedido | "todos";
  const busca = typeof params.q === "string" ? params.q.trim() : "";

  const supabase = await createClient();
  const { data } = await supabase
    .from("pedidos")
    .select("*, itens_pedido(produto_nome, cor, tamanho, quantidade, preco_unitario, modo)")
    .order("numero", { ascending: false });
  const todos = (data ?? []) as Pedido[];

  const contagem = (s: StatusPedido | "todos") => (s === "todos" ? todos.length : todos.filter((p) => p.status === s).length);
  const termo = busca.toLowerCase();
  const soDigitos = busca.replace(/\D/g, "");
  const pedidos = todos
    .filter((p) => status === "todos" || p.status === status)
    .filter(
      (p) =>
        !termo ||
        p.nome.toLowerCase().includes(termo) ||
        p.codigo.toLowerCase().includes(termo) ||
        (soDigitos.length >= 3 && p.whatsapp.includes(soDigitos)),
    );

  const recebido = todos.filter((p) => p.status === "pago").reduce((s, p) => s + Number(p.total), 0);
  const aReceber = todos.filter((p) => p.status === "pendente").reduce((s, p) => s + Number(p.total), 0);

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="cartao p-4">
          <p className="rotulo text-grafite">Recebido</p>
          <p className="mt-1 text-2xl font-bold text-musgo">{formatarPreco(recebido)}</p>
        </div>
        <div className="cartao p-4">
          <p className="rotulo text-grafite">A receber</p>
          <p className="mt-1 text-2xl font-bold text-cereja">{formatarPreco(aReceber)}</p>
        </div>
        <div className="cartao col-span-2 p-4 sm:col-span-1">
          <p className="rotulo text-grafite">Pedidos pagos</p>
          <p className="mt-1 text-2xl font-bold">
            {contagem("pago")} <span className="text-base font-medium text-grafite">de {todos.length - contagem("cancelado")}</span>
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <Link
              key={f.valor}
              href={{ query: { status: f.valor, ...(busca && { q: busca }) } }}
              className={`rounded-full px-3 py-1.5 text-sm font-bold ${
                status === f.valor ? "bg-tinta text-creme" : "bg-papel text-grafite ring-1 ring-linha hover:text-tinta"
              }`}
            >
              {f.rotulo} <span className="opacity-60">{contagem(f.valor)}</span>
            </Link>
          ))}
        </div>
        <form className="w-full sm:w-64">
          <input type="hidden" name="status" value={status} />
          <input name="q" defaultValue={busca} placeholder="Buscar nome, código ou número" className="campo py-2 text-sm" />
        </form>
      </div>

      {pedidos.length === 0 ? (
        <p className="cartao p-8 text-center text-grafite">Nenhum pedido aqui.</p>
      ) : (
        <ul className="space-y-2">
          {pedidos.map((p) => (
            <LinhaPedido key={p.id} pedido={p} />
          ))}
        </ul>
      )}
    </>
  );
}
