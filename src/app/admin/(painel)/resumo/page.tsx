import { FotoProduto } from "@/components/foto-produto";
import { createClient } from "@/lib/supabase/server";
import type { Produto, VariacaoLoja } from "@/lib/types";

export const dynamic = "force-dynamic";

// Ordem em que os quadradinhos aparecem
const TIPOS = ["vendidas", "fisicas", "integrantes", "reservadas", "disponiveis"] as const;
type Contagem = Record<(typeof TIPOS)[number], number>;

const vazio = (): Contagem => ({ vendidas: 0, fisicas: 0, integrantes: 0, reservadas: 0, disponiveis: 0 });
const somar = (a: Contagem, b: Contagem) =>
  Object.fromEntries(TIPOS.map((t) => [t, a[t] + b[t]])) as Contagem;
const total = (c: Contagem) => TIPOS.reduce((s, t) => s + c[t], 0);
// Vendida = paga pela loja + venda física
const vendidasTotal = (c: Contagem) => c.vendidas + c.fisicas;
const porcentagem = (c: Contagem) => (total(c) ? Math.round((vendidasTotal(c) / total(c)) * 100) : 0);

export default async function Resumo() {
  const supabase = await createClient();
  const [{ data: produtos }, { data: variacoes }, { data: pagos }, { data: extras }] = await Promise.all([
    supabase.from("produtos").select("*").order("ordem").order("criado_em"),
    supabase.from("loja_variacoes").select("*").order("ordem"),
    supabase.from("itens_pedido").select("variacao_id, quantidade, pedidos!inner(status)").eq("pedidos.status", "pago"),
    supabase.from("variacoes").select("id, venda_fisica, integrantes"),
  ]);
  const extra = new Map(
    ((extras ?? []) as { id: string; venda_fisica: number; integrantes: number }[]).map((e) => [e.id, e]),
  );

  // O estoque já foi baixado pelos pedidos pagos: total da grade = vendidas + estoque atual
  const vendidasPorVariacao = new Map<string, number>();
  for (const item of (pagos ?? []) as { variacao_id: string; quantidade: number }[]) {
    vendidasPorVariacao.set(item.variacao_id, (vendidasPorVariacao.get(item.variacao_id) ?? 0) + item.quantidade);
  }

  const lista = ((produtos ?? []) as Produto[]).map((p) => {
    const tamanhos = ((variacoes ?? []) as VariacaoLoja[])
      .filter((v) => v.produto_id === p.id)
      .map((v) => {
        const disponiveis = Math.max(v.disponivel, 0);
        return {
          id: v.id,
          tamanho: v.tamanho,
          contagem: {
            vendidas: vendidasPorVariacao.get(v.id) ?? 0,
            fisicas: extra.get(v.id)?.venda_fisica ?? 0,
            integrantes: extra.get(v.id)?.integrantes ?? 0,
            reservadas: Math.max(v.estoque - disponiveis, 0),
            disponiveis,
          },
        };
      });
    return { ...p, tamanhos, contagem: tamanhos.reduce((s, t) => somar(s, t.contagem), vazio()) };
  });
  const geral = lista.reduce((s, p) => somar(s, p.contagem), vazio());

  return (
    <>
      <h1 className="text-2xl font-bold">Resumo</h1>
      <p className="mt-1 text-sm text-grafite">Cada quadradinho é uma peça.</p>

      <div className="cartao mt-5 p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="rotulo text-grafite">Total vendido</p>
            <p className="mt-1 text-3xl font-bold">
              {vendidasTotal(geral)} <span className="text-lg font-medium text-grafite">de {total(geral)}</span>
            </p>
          </div>
          <Legenda />
        </div>
        <BarraProgresso contagem={geral} />
        <p className="mt-2 text-sm text-grafite">
          <strong className="text-tinta">{porcentagem(geral)}% vendido</strong> · {geral.vendidas} pela loja ·{" "}
          {geral.fisicas} venda física · {geral.integrantes} integrantes · {geral.reservadas} aguardando pagamento ·{" "}
          {geral.disponiveis} disponíveis
        </p>
      </div>

      {lista.length === 0 ? (
        <p className="cartao mt-4 p-8 text-center text-grafite">Nenhum produto cadastrado ainda.</p>
      ) : (
        <ul className="mt-4 grid gap-4 lg:grid-cols-2">
          {lista.map((p) => (
            <li key={p.id} className="cartao p-4">
              <div className="flex items-center gap-3">
                <FotoProduto src={p.foto_url} alt={p.nome} className="h-14 w-12 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold leading-tight">
                    {p.nome}
                    {!p.ativo && (
                      <span className="rotulo ml-2 rounded-full bg-linha px-2 py-0.5 align-middle text-[0.6rem]">oculto</span>
                    )}
                  </p>
                  <p className="text-sm text-grafite">
                    <strong className="text-tinta">{vendidasTotal(p.contagem)}</strong> de {total(p.contagem)} vendidas ·{" "}
                    {porcentagem(p.contagem)}%
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                {p.tamanhos.map((t) => (
                  <div key={t.id} className="flex items-start gap-3">
                    <span className="w-9 shrink-0 pt-px text-sm font-bold">{t.tamanho}</span>
                    <Quadradinhos contagem={t.contagem} />
                    <span className="ml-auto shrink-0 pl-2 text-right text-xs tabular-nums text-grafite">
                      <strong className="text-tinta">{vendidasTotal(t.contagem)}</strong>/{total(t.contagem)}
                    </span>
                  </div>
                ))}
                {p.tamanhos.length === 0 && <p className="text-sm text-grafite">Sem tamanhos cadastrados.</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

const ESTILO: Record<keyof Contagem, string> = {
  vendidas: "bg-cereja",
  fisicas: "bg-musgo",
  integrantes: "bg-mostarda",
  reservadas: "bg-cereja-clara ring-1 ring-inset ring-cereja/50",
  disponiveis: "ring-1 ring-inset ring-areia",
};

function Quadradinhos({ contagem }: { contagem: Contagem }) {
  const quadrados = TIPOS.flatMap((tipo) =>
    Array.from({ length: contagem[tipo] }, () => tipo),
  );
  if (quadrados.length === 0) return <span className="text-xs text-grafite">sem estoque</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {quadrados.map((tipo, i) => (
        <span key={i} className={`h-4 w-4 rounded-[4px] ${ESTILO[tipo]}`} />
      ))}
    </div>
  );
}

function BarraProgresso({ contagem }: { contagem: Contagem }) {
  const t = total(contagem) || 1;
  return (
    <div className="mt-4 flex h-3 overflow-hidden rounded-full ring-1 ring-inset ring-areia">
      {TIPOS.filter((tipo) => tipo !== "disponiveis").map((tipo) => (
        <div key={tipo} className={ESTILO[tipo].split(" ")[0]} style={{ width: `${(contagem[tipo] / t) * 100}%` }} />
      ))}
    </div>
  );
}

function Legenda() {
  const itens = [
    { tipo: "vendidas" as const, rotulo: "Vendida pela loja (paga)" },
    { tipo: "fisicas" as const, rotulo: "Venda física" },
    { tipo: "integrantes" as const, rotulo: "Integrantes" },
    { tipo: "reservadas" as const, rotulo: "Aguardando pagamento" },
    { tipo: "disponiveis" as const, rotulo: "Disponível na loja" },
  ];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-grafite">
      {itens.map((i) => (
        <li key={i.tipo} className="flex items-center gap-1.5">
          <span className={`h-3.5 w-3.5 rounded-[4px] ${ESTILO[i.tipo]}`} />
          {i.rotulo}
        </li>
      ))}
    </ul>
  );
}
