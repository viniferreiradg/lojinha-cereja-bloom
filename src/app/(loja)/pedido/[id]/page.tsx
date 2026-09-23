/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { formatarPreco, formatarWhatsapp, linkWhatsapp } from "@/lib/format";
import { gerarPix } from "@/lib/pix";
import { carregarConfig, createClient } from "@/lib/supabase/server";
import { MODOS_VENDA, type ItemPedido, type StatusPedido } from "@/lib/types";
import { CopiarPix } from "./copiar-pix";

export const dynamic = "force-dynamic";

// Página pessoal do cliente: fora dos buscadores
export const metadata = { title: "Seu pedido", robots: { index: false, follow: false } };

type PedidoCliente = {
  id: string;
  codigo: string;
  nome: string;
  total: number;
  status: StatusPedido;
  itens: ItemPedido[];
};

export default async function PaginaPedido({ params }: PageProps<"/pedido/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const [{ data }, config] = await Promise.all([
    supabase.rpc("obter_pedido", { p_id: id }),
    carregarConfig(),
  ]);
  const pedido = data as PedidoCliente | null;
  if (!pedido || !config) notFound();

  const pix = gerarPix({
    chave: config.chave_pix,
    nome: config.nome_recebedor,
    cidade: config.cidade,
    valor: Number(pedido.total),
    txid: pedido.codigo,
  });
  const qr = await QRCode.toDataURL(pix, { margin: 1, width: 480, color: { dark: "#1c1b1a", light: "#fffef7" } });

  const mensagem = `Oi! Segue o comprovante do pedido ${pedido.codigo} (${pedido.nome}) — ${formatarPreco(
    Number(pedido.total),
  )}`;

  return (
    <div className="mx-auto max-w-xl">
      <p className="rotulo text-cereja">Pedido {pedido.codigo}</p>
      <h1 className="titulo mt-2 text-4xl sm:text-5xl">
        {pedido.status === "pago" ? "pagamento confirmado!" : pedido.status === "cancelado" ? "pedido cancelado" : "quase lá!"}
      </h1>

      {pedido.status === "pendente" && (
        <>
          <p className="mt-3 text-lg text-grafite">
            Faça o PIX de <strong className="text-tinta">{formatarPreco(Number(pedido.total))}</strong> e envie o
            comprovante no WhatsApp da banda.
          </p>

          <ol className="mt-8 space-y-6">
            <li className="cartao p-5">
              <p className="rotulo mb-4">1 · Pague com PIX</p>
              <img
                src={qr}
                alt="QR Code do PIX"
                className="mx-auto w-56 rounded-xl border border-linha sm:w-64"
              />
              <p className="mt-4 text-center text-sm text-grafite">Escaneie o QR Code ou copie o código abaixo</p>
              <CopiarPix codigo={pix} />
              {config.chave_pix && (
                <p className="mt-3 text-center text-xs text-grafite">
                  Chave PIX: <span className="font-medium text-tinta">{config.chave_pix}</span> ·{" "}
                  {config.nome_recebedor}
                </p>
              )}
            </li>

            <li className="cartao p-5">
              <p className="rotulo mb-2">2 · Envie o comprovante</p>
              <p className="text-grafite">
                Enviar comprovante para o WhatsApp{" "}
                <strong className="text-tinta">{formatarWhatsapp(config.whatsapp_banda)}</strong>, informando o
                código <strong className="text-tinta">{pedido.codigo}</strong>.
              </p>
              <a
                href={linkWhatsapp(config.whatsapp_banda, mensagem)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primario mt-4 w-full"
              >
                Enviar comprovante no WhatsApp
              </a>
            </li>
          </ol>
        </>
      )}

      {pedido.status === "pago" && (
        <p className="mt-3 text-lg text-grafite">Recebemos seu pagamento. Valeu pelo apoio! 🍒</p>
      )}
      {pedido.status === "cancelado" && (
        <p className="mt-3 text-lg text-grafite">
          Esse pedido foi cancelado. Se achar que é um engano, fale com a gente no WhatsApp{" "}
          {formatarWhatsapp(config.whatsapp_banda)}.
        </p>
      )}

      <section className="mt-8">
        <p className="rotulo mb-3">Resumo</p>
        <ul className="divide-y divide-linha border-y border-linha">
          {pedido.itens.map((item, i) => (
            <li key={i} className="flex justify-between gap-4 py-3">
              <span>
                {item.quantidade}× {item.produto_nome}
                <span className="text-grafite">
                  {" "}
                  · {item.cor ? `${item.cor} · ` : ""}
                  {item.tamanho}
                  {item.modo === "pre_venda" && ` · ${MODOS_VENDA.pre_venda.selo}`}
                </span>
              </span>
              <span className="font-medium">{formatarPreco(item.quantidade * Number(item.preco_unitario))}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>{formatarPreco(Number(pedido.total))}</span>
        </p>
        <p className="mt-6 text-sm text-grafite">
          Guarde o link desta página para ver seu pedido de novo.
        </p>
      </section>
    </div>
  );
}
