import type { MetadataRoute } from "next";
import { carregarSeo } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await carregarSeo();
  return {
    // Com a indexação desligada no admin, nenhum buscador entra
    rules: seo.indexar
      ? { userAgent: "*", allow: "/", disallow: ["/admin", "/carrinho", "/pedido/"] }
      : { userAgent: "*", disallow: "/" },
    sitemap: `${seo.urlSite}/sitemap.xml`,
  };
}
