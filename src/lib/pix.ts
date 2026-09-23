// Gera o "PIX copia e cola" (BR Code, padrão EMV do Banco Central) de forma estática,
// sem gateway: a chave, o valor e o código do pedido vão dentro do próprio código.

function campo(id: string, valor: string) {
  return id + valor.length.toString().padStart(2, "0") + valor;
}

function limpar(texto: string, max: number) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .toUpperCase()
    .trim()
    .slice(0, max);
}

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function gerarPix({
  chave,
  nome,
  cidade,
  valor,
  txid,
}: {
  chave: string;
  nome: string;
  cidade: string;
  valor: number;
  txid: string;
}) {
  const conta = campo("00", "br.gov.bcb.pix") + campo("01", chave.trim());
  const payload =
    campo("00", "01") +
    campo("26", conta) +
    campo("52", "0000") +
    campo("53", "986") +
    campo("54", valor.toFixed(2)) +
    campo("58", "BR") +
    campo("59", limpar(nome, 25) || "CEREJA BLOOM") +
    campo("60", limpar(cidade, 15) || "BRASIL") +
    campo("62", campo("05", txid.replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***")) +
    "6304";
  return payload + crc16(payload);
}
