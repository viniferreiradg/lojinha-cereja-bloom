"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", rotulo: "Pedidos" },
  { href: "/admin/produtos", rotulo: "Produtos" },
  { href: "/admin/resumo", rotulo: "Resumo" },
  { href: "/admin/config", rotulo: "Configurações" },
];

export function NavAdmin() {
  const caminho = usePathname();
  return (
    <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
      {LINKS.map((l) => {
        const ativo = l.href === "/admin" ? caminho === "/admin" : caminho.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-bold ${
              ativo ? "border-cereja text-tinta" : "border-transparent text-grafite hover:text-tinta"
            }`}
          >
            {l.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
