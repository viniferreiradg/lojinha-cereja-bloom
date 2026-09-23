"use server";

import { createClient } from "@/lib/supabase/server";

export async function criarPedido(
  nome: string,
  whatsapp: string,
  itens: { variacao_id: string; quantidade: number }[],
): Promise<{ id: string } | { erro: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("criar_pedido", { p_nome: nome, p_whatsapp: whatsapp, p_itens: itens })
    .single<{ id: string }>();

  if (error || !data) {
    // Mensagens de validação vêm do próprio banco (raise exception)
    return { erro: error?.code === "P0001" ? error.message : "Não foi possível criar o pedido. Tente de novo." };
  }
  return { id: data.id };
}
