const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatarPreco(valor: number) {
  return brl.format(valor);
}

export function formatarWhatsapp(numero: string) {
  const d = numero.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return numero;
}

// Link wa.me: adiciona o 55 quando o número veio só com DDD
export function linkWhatsapp(numero: string, mensagem?: string) {
  let d = numero.replace(/\D/g, "");
  if (d.length <= 11) d = "55" + d;
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : "";
  return `https://wa.me/${d}${texto}`;
}

export function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}
