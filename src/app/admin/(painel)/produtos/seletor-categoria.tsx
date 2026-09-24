"use client";

import { useId, useRef, useState, useTransition } from "react";
import type { Categoria } from "@/lib/types";
import { criarCategoria } from "../../actions";

type Props = {
  categorias: Categoria[];
  valor: string | null;
  onChange: (id: string | null) => void;
};

const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

// Campo de busca que lista as categorias existentes e cria uma nova com o texto digitado
export function SeletorCategoria({ categorias: iniciais, valor, onChange }: Props) {
  const [categorias, setCategorias] = useState(iniciais);
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const [destaque, setDestaque] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [criando, iniciar] = useTransition();
  const campo = useRef<HTMLInputElement>(null);
  const idLista = useId();

  const selecionada = categorias.find((c) => c.id === valor) ?? null;
  const termo = normalizar(busca);
  const filtradas = categorias.filter((c) => normalizar(c.nome).includes(termo));
  const existeIgual = categorias.some((c) => normalizar(c.nome) === termo);
  const podeCriar = termo.length > 0 && !existeIgual;
  const opcoes = [...filtradas.map((c) => ({ tipo: "categoria" as const, categoria: c })), ...(podeCriar ? [{ tipo: "criar" as const }] : [])];

  function escolher(c: Categoria) {
    onChange(c.id);
    setBusca("");
    setAberto(false);
    setErro(null);
  }

  function criar() {
    const nome = busca.trim();
    if (!nome) return;
    setErro(null);
    iniciar(async () => {
      const r = await criarCategoria(nome);
      if ("erro" in r) {
        setErro(r.erro);
        return;
      }
      setCategorias((atual) =>
        atual.some((c) => c.id === r.id) ? atual : [...atual, r].sort((a, b) => a.nome.localeCompare(b.nome)),
      );
      escolher(r);
    });
  }

  function confirmar(indice: number) {
    const opcao = opcoes[indice];
    if (!opcao) return;
    if (opcao.tipo === "criar") criar();
    else escolher(opcao.categoria);
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <input
          ref={campo}
          role="combobox"
          aria-expanded={aberto}
          aria-controls={idLista}
          aria-autocomplete="list"
          className="campo"
          placeholder={selecionada ? selecionada.nome : categorias.length ? "Escolha ou crie uma categoria" : "Digite para criar a primeira categoria"}
          value={aberto ? busca : selecionada?.nome ?? ""}
          onFocus={() => {
            setAberto(true);
            setDestaque(0);
          }}
          onBlur={() => setTimeout(() => setAberto(false), 150)}
          onChange={(e) => {
            setBusca(e.target.value);
            setAberto(true);
            setDestaque(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setDestaque((d) => Math.min(d + 1, opcoes.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setDestaque((d) => Math.max(d - 1, 0));
            } else if (e.key === "Enter") {
              // Enter aqui escolhe/cria a categoria em vez de enviar o formulário
              e.preventDefault();
              confirmar(destaque);
            } else if (e.key === "Escape") {
              setAberto(false);
              campo.current?.blur();
            }
          }}
        />
        {selecionada && !aberto && (
          <button
            type="button"
            className="shrink-0 text-sm text-grafite underline hover:text-cereja"
            onClick={() => onChange(null)}
          >
            limpar
          </button>
        )}
      </div>

      {aberto && (
        <ul
          id={idLista}
          role="listbox"
          className="cartao absolute z-20 mt-1 max-h-64 w-full overflow-y-auto p-1 shadow-lg"
        >
          {opcoes.length === 0 && (
            <li className="px-3 py-2 text-sm text-grafite">Digite o nome de uma categoria para criar.</li>
          )}
          {opcoes.map((opcao, i) => (
            <li
              key={opcao.tipo === "criar" ? "__criar" : opcao.categoria.id}
              role="option"
              aria-selected={i === destaque}
              className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm ${
                i === destaque ? "bg-creme" : ""
              }`}
              onMouseEnter={() => setDestaque(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                confirmar(i);
              }}
            >
              {opcao.tipo === "criar" ? (
                <span className="font-bold text-cereja">
                  {criando ? "Criando…" : `+ Criar categoria “${busca.trim()}”`}
                </span>
              ) : (
                <>
                  <span>{opcao.categoria.nome}</span>
                  {opcao.categoria.id === valor && <span className="text-musgo">✓</span>}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {erro && <p className="mt-1 text-xs font-medium text-cereja">{erro}</p>}
    </div>
  );
}
