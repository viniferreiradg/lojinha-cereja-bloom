import { createClient } from "@/lib/supabase/server";
import type { Pedido } from "@/lib/types";

export const dynamic = "force-dynamic";

type Linha = { produto: string; cor: string; tamanhos: Map<string, { pago: number; pendente: number }> };

export default async function Resumo() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pedidos")
    .select("status, itens_pedido(produto_nome, cor, tamanho, quantidade)")
    .neq("status", "cancelado");

  const linhas = new Map<string, Linha>();
  const todosTamanhos: string[] = [];
  for (const pedido of (data ?? []) as Pick<Pedido, "status" | "itens_pedido">[]) {
    for (const item of pedido.itens_pedido) {
      const chave = `${item.produto_nome}|${item.cor}`;
      if (!linhas.has(chave)) linhas.set(chave, { produto: item.produto_nome, cor: item.cor, tamanhos: new Map() });
      const tamanhos = linhas.get(chave)!.tamanhos;
      if (!tamanhos.has(item.tamanho)) tamanhos.set(item.tamanho, { pago: 0, pendente: 0 });
      tamanhos.get(item.tamanho)![pedido.status === "pago" ? "pago" : "pendente"] += item.quantidade;
      if (!todosTamanhos.includes(item.tamanho)) todosTamanhos.push(item.tamanho);
    }
  }

  const ordem = ["PP", "P", "M", "G", "GG", "XG", "XGG", "EXG"];
  todosTamanhos.sort((a, b) => (ordem.indexOf(a) + 1 || 99) - (ordem.indexOf(b) + 1 || 99) || a.localeCompare(b));
  const lista = [...linhas.values()].sort((a, b) => a.produto.localeCompare(b.produto));
  const soma = (l: Linha, campo: "pago" | "pendente") => [...l.tamanhos.values()].reduce((s, t) => s + t[campo], 0);

  return (
    <>
      <h1 className="text-2xl font-bold">Resumo para produção</h1>
      <p className="mb-6 mt-1 text-sm text-grafite">
        Quantidade de camisetas por modelo e tamanho. O número grande são as <strong>pagas</strong>; o pequeno, as
        aguardando pagamento.
      </p>

      {lista.length === 0 ? (
        <p className="cartao p-8 text-center text-grafite">Ainda não há pedidos.</p>
      ) : (
        <div className="cartao overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr className="border-b border-linha text-xs uppercase tracking-wider text-grafite">
                <th className="p-3">Camiseta</th>
                {todosTamanhos.map((t) => (
                  <th key={t} className="p-3 text-center">
                    {t}
                  </th>
                ))}
                <th className="p-3 text-center">Total</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((l) => (
                <tr key={`${l.produto}|${l.cor}`} className="border-b border-linha last:border-0">
                  <td className="p-3">
                    <p className="font-bold">{l.produto}</p>
                    {l.cor && <p className="text-sm text-grafite">{l.cor}</p>}
                  </td>
                  {todosTamanhos.map((t) => {
                    const q = l.tamanhos.get(t);
                    return (
                      <td key={t} className="p-3 text-center">
                        <span className="text-lg font-bold">{q?.pago ?? 0}</span>
                        {q && q.pendente > 0 && <span className="ml-1 text-xs text-cereja">+{q.pendente}</span>}
                      </td>
                    );
                  })}
                  <td className="p-3 text-center">
                    <span className="text-lg font-bold">{soma(l, "pago")}</span>
                    {soma(l, "pendente") > 0 && <span className="ml-1 text-xs text-cereja">+{soma(l, "pendente")}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
