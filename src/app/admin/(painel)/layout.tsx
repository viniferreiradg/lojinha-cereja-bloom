import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";
import { sair } from "../actions";
import { NavAdmin } from "./nav-admin";

export default async function PainelLayout({ children }: LayoutProps<"/admin">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: admin } = await supabase.rpc("is_admin");
  if (!admin) {
    return (
      <main className="grid flex-1 place-items-center px-4">
        <div className="cartao max-w-sm p-6 text-center">
          <p className="font-bold">Sem acesso</p>
          <p className="mt-2 text-sm text-grafite">
            O e-mail {user.email} não está na lista de admins da Lojinha.
          </p>
          <form action={sair} className="mt-4">
            <button className="btn btn-contorno btn-pequeno">Sair</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <>
      <header className="border-b border-linha bg-papel">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Logo className="h-9" />
            </Link>
            <span className="rotulo rounded-full bg-tinta px-2 py-0.5 text-[0.65rem] text-creme">admin</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" target="_blank" className="text-grafite hover:text-cereja">
              Ver loja ↗
            </Link>
            <form action={sair}>
              <button className="text-grafite hover:text-cereja">Sair</button>
            </form>
          </div>
        </div>
        <NavAdmin />
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>
    </>
  );
}
