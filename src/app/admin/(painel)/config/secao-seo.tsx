"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { formatarBytes, otimizarImagem } from "@/lib/otimizar-imagem";
import { createClient } from "@/lib/supabase/client";
import type { Configuracoes } from "@/lib/types";

type Props = { config: Configuracoes; urlPadrao: string };

function Contador({ atual, ideal }: { atual: number; ideal: number }) {
  return (
    <span className={`text-xs tabular-nums ${atual > ideal ? "font-bold text-cereja" : "text-grafite"}`}>
      {atual}/{ideal}
    </span>
  );
}

export function SecaoSeo({ config, urlPadrao }: Props) {
  const [titulo, setTitulo] = useState(config.seo_titulo ?? "");
  const [descricao, setDescricao] = useState(config.seo_descricao ?? "");
  const [url, setUrl] = useState(config.seo_url_site ?? "");
  const [imagem, setImagem] = useState(config.seo_imagem_url ?? "");
  const [enviando, setEnviando] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const dominio = (url || urlPadrao).replace(/^https?:\/\//, "").replace(/\/+$/, "");

  async function enviarImagem(arquivo: File) {
    setErro(null);
    setInfo(null);
    setEnviando(true);
    try {
      let otimizada;
      try {
        otimizada = await otimizarImagem(arquivo, { largura: 1200, altura: 630, recortar: true, formato: "jpeg" });
      } catch {
        setErro("Não consegui abrir essa imagem. Use JPG, PNG ou WebP.");
        return;
      }
      const caminho = `seo/${crypto.randomUUID()}.${otimizada.extensao}`;
      const supabase = createClient();
      const { error } = await supabase.storage
        .from("produtos")
        .upload(caminho, otimizada.arquivo, { contentType: otimizada.arquivo.type, cacheControl: "31536000" });
      if (error) {
        setErro(`Não foi possível enviar a imagem: ${error.message}`);
        return;
      }
      setImagem(supabase.storage.from("produtos").getPublicUrl(caminho).data.publicUrl);
      setInfo(`${formatarBytes(arquivo.size)} → ${formatarBytes(otimizada.arquivo.size)} · ${otimizada.largura}×${otimizada.altura}`);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="cartao space-y-5 p-5">
      <div>
        <h2 className="font-bold">SEO e compartilhamento</h2>
        <p className="text-sm text-grafite">Como a Lojinha aparece no Google e quando alguém manda o link no WhatsApp.</p>
      </div>

      <label className="block">
        <span className="mb-1 flex items-baseline justify-between text-sm font-medium">
          Título do site <Contador atual={titulo.length} ideal={60} />
        </span>
        <input name="seo_titulo" className="campo" required value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        <span className="mt-1 block text-xs text-grafite">
          Aparece na aba do navegador e no Google. Nas páginas dos produtos vira “Nome do produto · {titulo || "título"}”.
        </span>
      </label>

      <label className="block">
        <span className="mb-1 flex items-baseline justify-between text-sm font-medium">
          Descrição <Contador atual={descricao.length} ideal={160} />
        </span>
        <textarea
          name="seo_descricao"
          className="campo"
          rows={3}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <span className="mt-1 block text-xs text-grafite">O textinho embaixo do título no Google. Até 160 caracteres.</span>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Palavras-chave</span>
        <input name="seo_palavras_chave" className="campo" defaultValue={config.seo_palavras_chave} />
        <span className="mt-1 block text-xs text-grafite">Separadas por vírgula.</span>
      </label>

      <div>
        <span className="mb-1 block text-sm font-medium">Imagem de compartilhamento</span>
        <input type="hidden" name="seo_imagem_url" value={imagem} />
        <div className="overflow-hidden rounded-xl border border-linha bg-linha/40">
          {imagem ? (
            <img src={imagem} alt="" className="aspect-[1200/630] w-full object-cover" />
          ) : (
            <div className="grid aspect-[1200/630] place-items-center text-sm text-grafite">sem imagem</div>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="btn btn-contorno btn-pequeno">
            {enviando ? "Otimizando e enviando…" : imagem ? "Trocar imagem" : "Escolher imagem"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={enviando}
              onChange={(e) => {
                const arquivo = e.target.files?.[0];
                if (arquivo) enviarImagem(arquivo);
                e.target.value = "";
              }}
            />
          </label>
          {imagem && (
            <button type="button" className="text-sm text-grafite underline hover:text-cereja" onClick={() => setImagem("")}>
              remover
            </button>
          )}
        </div>
        {info && <p className="mt-1 text-xs text-musgo">✓ Imagem otimizada: {info}</p>}
        {erro && <p className="mt-1 text-xs font-medium text-cereja">{erro}</p>}
        <span className="mt-1 block text-xs text-grafite">
          Recortada no centro para 1200×630, o formato do WhatsApp, Instagram e Facebook. Nas páginas dos produtos, vale a
          foto do próprio produto.
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Endereço do site</span>
          <input
            name="seo_url_site"
            className="campo"
            inputMode="url"
            placeholder={urlPadrao}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <span className="mt-1 block text-xs text-grafite">Vazio = endereço da Vercel. Preencha se usar domínio próprio.</span>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Instagram</span>
          <input name="seo_instagram" className="campo" defaultValue={config.seo_instagram} placeholder="cerejabloom" />
        </label>
      </div>

      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          name="seo_indexar"
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#e8112f]"
          defaultChecked={config.seo_indexar ?? true}
        />
        <span>
          <span className="block font-medium">Aparecer no Google e outros buscadores</span>
          <span className="block text-xs text-grafite">
            Desmarque para esconder a Lojinha das buscas. O link continua funcionando para quem tiver.
          </span>
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Google Search Console</span>
          <input
            name="seo_google_verificacao"
            className="campo"
            defaultValue={config.seo_google_verificacao}
            placeholder="código de verificação"
          />
          <span className="mt-1 block text-xs text-grafite">Pode colar a tag &lt;meta&gt; inteira que o Google mostra.</span>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Google Analytics</span>
          <input
            name="seo_google_analytics"
            className="campo"
            defaultValue={config.seo_google_analytics}
            placeholder="G-XXXXXXXXXX"
          />
          <span className="mt-1 block text-xs text-grafite">ID de medição do GA4. Vazio = sem Analytics.</span>
        </label>
      </div>

      <div className="grid gap-4 border-t border-linha pt-5 sm:grid-cols-2">
        <div>
          <p className="rotulo mb-2 text-grafite">Prévia no Google</p>
          <div className="rounded-xl border border-linha bg-white p-3 font-[arial,sans-serif]">
            <p className="truncate text-xs text-[#4d5156]">{dominio}</p>
            <p className="line-clamp-1 text-lg leading-snug text-[#1a0dab]">{titulo || "Título do site"}</p>
            <p className="line-clamp-2 text-sm text-[#4d5156]">{descricao || "Descrição do site"}</p>
          </div>
        </div>
        <div>
          <p className="rotulo mb-2 text-grafite">Prévia no WhatsApp</p>
          <div className="overflow-hidden rounded-xl bg-[#d9fdd3] p-1.5">
            <div className="overflow-hidden rounded-lg bg-[#f0f2f5]">
              {imagem && <img src={imagem} alt="" className="aspect-[1200/630] w-full object-cover" />}
              <div className="p-2">
                <p className="line-clamp-1 text-sm font-bold text-[#111b21]">{titulo || "Título do site"}</p>
                <p className="line-clamp-2 text-xs text-[#667781]">{descricao}</p>
                <p className="mt-0.5 truncate text-xs text-[#667781]">{dominio}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
