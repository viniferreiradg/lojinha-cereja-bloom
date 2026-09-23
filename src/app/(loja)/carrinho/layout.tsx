import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Carrinho",
  robots: { index: false, follow: false },
};

export default function CarrinhoLayout({ children }: LayoutProps<"/carrinho">) {
  return children;
}
