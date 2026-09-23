"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FotoProduto } from "@/components/foto-produto";
import { formatarBytes, otimizarImagem } from "@/lib/otimizar-imagem";
import { createClient } from "@/lib/supabase/client";
import { MODOS_VENDA, type ModoVenda } from "@/lib/types";
import { excluirProduto, salvarProduto, type ProdutoForm } from "../../actions";

export function FormProduto({
  inicial,
  reservados = {},
}: {
  inicial: ProdutoForm;
  reservados?: Record<string, number>;
}) {
  const router = useRouter();
  const [form, setForm] = useState(inicial);
  const [erro, setErro] = useState<string | null>(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [infoFoto, setInfoFoto] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();

  const set = <K extends keyof ProdutoForm>(campo: K, valor: ProdutoForm[K]) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  function setVariacao(indice: number, mudanca: Partial<ProdutoForm["variacoes"][number]>) {
    setForm((f) => ({
      ...f,
      variacoes: f.variacoes.map((v, i) => (i === indice ? { ...v, ...mudanca } : v)),
    }));
  }

  async function enviarFoto(arquivo: File) {
    setErro(null);
    setInfoFoto(null);
    setEnviandoFoto(true);
    try {
      let otimizada;
      try {
        otimizada = await otimizarImagem(arquivo);
      } catch {
        setErro("Não consegui abrir essa imagem. Use JPG, PNG ou WebP (fotos HEIC do iPhone precisam ser convertidas antes).");
        return;
      }
      const caminho = `${crypto.randomUUID()}.${otimizada.extensao}`;
      const supabase = createClient();
      const { error } = await supabase.storage
        .from("produtos")
        .upload(caminho, otimizada.arquivo, { contentType: otimizada.arquivo.type, cacheControl: "31536000" });
      if (error) {
        setErro(`Não foi possível enviar a foto: ${error.message}`);
        return;
      }
      set("foto_url", supabase.storage.from("produtos").getPublicUrl(caminho).data.publicUrl);
      setInfoFoto(
        `${formatarBytes(arquivo.size)} → ${formatarBytes(otimizada.arquivo.size)} · ${otimizada.largura}×${otimizada.altura} · ${otimizada.extensao.toUpperCase()}`,
      );
    } finally {
      setEnviandoFoto(false);
    }
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    iniciar(async () => {
      const r = await salvarProduto(form);
      if ("erro" in r) {
        setErro(r.erro);
        return;
      }
      router.push("/admin/produtos");
      router.refresh();
    });
  }

  function excluir() {
    if (!form.id || !confirm(`Excluir "${form.nome}"? Isso não pode ser desfeito.`)) return;
    iniciar(async () => {
      const r = await excluirProduto(form.id!);
      if (r?.erro) setErro(r.erro);
    });
  }

  const estoqueTotal = form.variacoes.reduce((s, v) => s + (Number(v.estoque) || 0), 0);

  return (
    <form onSubmit={salvar} className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="space-y-3">
        <FotoProduto src={form.foto_url} alt={form.nome} className="aspect-[4/5] w-full rounded-2xl border border-linha" />
        <label className="btn btn-contorno btn-pequeno w-full">
          {enviandoFoto ? "Otimizando e enviando…" : form.foto_url ? "Trocar foto" : "Escolher foto"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={enviandoFoto}
            onChange={(e) => {
              const arquivo = e.target.files?.[0];
              if (arquivo) enviarFoto(arquivo);
              e.target.value = "";
            }}
          />
        </label>
        {infoFoto && <p className="text-center text-xs text-musgo">✓ Foto otimizada: {infoFoto}</p>}
      </div>

      <div className="space-y-5">
        <div className="cartao grid gap-4 p-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium">Nome da camiseta</span>
            <input className="campo" required value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex.: Camiseta Souvenir" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Cor</span>
            <input className="campo" value={form.cor} onChange={(e) => set("cor", e.target.value)} placeholder="Ex.: Preta" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Estampa</span>
            <input className="campo" value={form.estampa} onChange={(e) => set("estampa", e.target.value)} placeholder="Ex.: Logo vermelho" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Preço (R$)</span>
            <input
              className="campo"
              type="number"
              min={0}
              step="0.01"
              required
              value={form.preco}
              onChange={(e) => set("preco", Number(e.target.value))}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium">Descrição (opcional)</span>
            <textarea
              className="campo"
              rows={3}
              value={form.descricao}
              onChange={(e) => set("descricao", e.target.value)}
              placeholder="Tecido, modelagem, detalhes da estampa…"
            />
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="mb-1 block text-sm font-medium">Botão de compra na loja</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(MODOS_VENDA) as ModoVenda[]).map((modo) => (
                <label
                  key={modo}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 ${
                    form.modo === modo ? "border-tinta bg-creme" : "border-linha"
                  }`}
                >
                  <input
                    type="radio"
                    name="modo"
                    className="h-4 w-4 accent-[#e8112f]"
                    checked={form.modo === modo}
                    onChange={() => set("modo", modo)}
                  />
                  <span>
                    <span className="block font-bold">“{MODOS_VENDA[modo].botao}”</span>
                    <span className="block text-xs text-grafite">
                      {modo === "compra" ? "Peça pronta para entrega" : "Produção depois da venda"}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" className="h-5 w-5 accent-[#e8112f]" checked={form.ativo} onChange={(e) => set("ativo", e.target.checked)} />
            <span className="font-medium">Mostrar na loja</span>
          </label>
        </div>

        <div className="cartao p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-bold">Tamanhos e estoque</h2>
            <span className="text-sm text-grafite">{estoqueTotal} peças</span>
          </div>
          <div className="mb-2 grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-bold uppercase tracking-wider text-grafite">
            <span>Tamanho</span>
            <span>Estoque</span>
            <span className="w-16" />
          </div>
          <ul className="space-y-2">
            {form.variacoes.map((v, i) => {
              const reservado = v.id ? reservados[v.id] ?? 0 : 0;
              return (
                <li key={v.id ?? `nova-${i}`}>
                  <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                    <input
                      className="campo py-2 uppercase"
                      required
                      value={v.tamanho}
                      onChange={(e) => setVariacao(i, { tamanho: e.target.value })}
                    />
                    <input
                      className="campo py-2"
                      type="number"
                      required
                      value={v.estoque}
                      onChange={(e) => setVariacao(i, { estoque: Number(e.target.value) })}
                    />
                    <button
                      type="button"
                      className="w-16 text-sm text-grafite underline hover:text-cereja"
                      onClick={() => set("variacoes", form.variacoes.filter((_, j) => j !== i))}
                    >
                      remover
                    </button>
                  </div>
                  {reservado > 0 && (
                    <p className="mt-0.5 text-xs text-grafite">
                      {reservado} reservada(s) em pedidos aguardando pagamento → {v.estoque - reservado} disponível(is) na loja
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            className="mt-3 text-sm font-bold text-cereja hover:underline"
            onClick={() => set("variacoes", [...form.variacoes, { tamanho: "", estoque: 0 }])}
          >
            + Adicionar tamanho
          </button>
        </div>

        {erro && <p className="rounded-xl bg-cereja-clara p-3 text-sm font-medium text-cereja-escura">{erro}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-primario" disabled={salvando || enviandoFoto}>
            {salvando ? "Salvando…" : "Salvar"}
          </button>
          <Link href="/admin/produtos" className="btn btn-contorno">
            Voltar
          </Link>
          {form.id && (
            <button type="button" onClick={excluir} className="ml-auto text-sm text-grafite underline hover:text-cereja">
              excluir camiseta
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
