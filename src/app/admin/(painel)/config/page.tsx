import { carregarConfig } from "@/lib/supabase/server";
import { salvarConfig } from "../../actions";

export const dynamic = "force-dynamic";

export default async function Config({ searchParams }: PageProps<"/admin/config">) {
  const [config, params] = await Promise.all([carregarConfig(), searchParams]);
  if (!config) return <p>Não foi possível carregar as configurações.</p>;

  return (
    <form action={salvarConfig} className="max-w-xl space-y-5">
      <h1 className="text-2xl font-bold">Configurações</h1>

      {params.salvo && <p className="rounded-xl bg-musgo-claro p-3 text-sm font-medium text-musgo">✓ Salvo</p>}
      {typeof params.erro === "string" && (
        <p className="rounded-xl bg-cereja-clara p-3 text-sm font-medium text-cereja-escura">{params.erro}</p>
      )}

      <div className="cartao space-y-4 p-5">
        <h2 className="font-bold">PIX</h2>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Chave PIX</span>
          <input name="chave_pix" className="campo" defaultValue={config.chave_pix} placeholder="CPF, CNPJ, e-mail, telefone (+55...) ou chave aleatória" />
          <span className="mt-1 block text-xs text-grafite">Telefone como chave precisa ir no formato +5548999999999.</span>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Nome do recebedor</span>
            <input name="nome_recebedor" className="campo" maxLength={25} defaultValue={config.nome_recebedor} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Cidade</span>
            <input name="cidade" className="campo" maxLength={15} defaultValue={config.cidade} />
          </label>
        </div>
      </div>

      <div className="cartao space-y-4 p-5">
        <h2 className="font-bold">Loja</h2>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">WhatsApp para receber comprovantes</span>
          <input name="whatsapp_banda" className="campo" inputMode="tel" defaultValue={config.whatsapp_banda} placeholder="48999999999" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Preço padrão das camisetas novas (R$)</span>
          <input name="preco_padrao" className="campo" inputMode="decimal" defaultValue={Number(config.preco_padrao).toFixed(2)} />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="loja_aberta" className="h-5 w-5 accent-[#e8112f]" defaultChecked={config.loja_aberta} />
          <span className="font-medium">Lojinha aberta (desmarque para fechar)</span>
        </label>
      </div>

      <button className="btn btn-primario">Salvar</button>
    </form>
  );
}
