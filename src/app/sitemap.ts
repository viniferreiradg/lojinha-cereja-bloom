import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { carregarSeo } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo = await carregarSeo();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
  const { data } = await supabase.from("produtos").select("id, criado_em, foto_url").eq("ativo", true).order("ordem");

  return [
    { url: `${seo.urlSite}/`, changeFrequency: "daily", priority: 1 },
    ...(data ?? []).map((p) => ({
      url: `${seo.urlSite}/produto/${p.id}`,
      lastModified: new Date(p.criado_em as string),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: p.foto_url ? [p.foto_url as string] : undefined,
    })),
  ];
}
