// Redimensiona e converte a foto no navegador, antes de enviar ao Supabase.
// Padrão (fotos das camisetas): até 1200×1500 em WebP, que cobre a maior exibição da loja em telas retina.

const QUALIDADE = 0.95;

type Opcoes = {
  largura?: number;
  altura?: number;
  // true: corta o centro para ficar exatamente largura×altura (ex.: imagem de compartilhamento)
  recortar?: boolean;
  formato?: "webp" | "jpeg";
};

export type ImagemOtimizada = { arquivo: Blob; extensao: string; largura: number; altura: number };

// Reduz pela metade várias vezes antes do tamanho final: evita o serrilhado de um redimensionamento grande de uma vez só
function redimensionar(origem: CanvasImageSource, largura: number, altura: number, destinoL: number, destinoA: number) {
  let atual: CanvasImageSource = origem;
  let l = largura;
  let a = altura;
  while (l / 2 > destinoL && a / 2 > destinoA) {
    l = Math.round(l / 2);
    a = Math.round(a / 2);
    atual = desenhar(atual, l, a);
  }
  return desenhar(atual, destinoL, destinoA);
}

function desenhar(origem: CanvasImageSource, largura: number, altura: number) {
  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(origem, 0, 0, largura, altura);
  return canvas;
}

function recortarCentro(origem: ImageBitmap, proporcao: number) {
  let l = origem.width;
  let a = origem.height;
  if (l / a > proporcao) l = Math.round(a * proporcao);
  else a = Math.round(l / proporcao);
  const canvas = document.createElement("canvas");
  canvas.width = l;
  canvas.height = a;
  canvas.getContext("2d")!.drawImage(origem, (origem.width - l) / 2, (origem.height - a) / 2, l, a, 0, 0, l, a);
  return canvas;
}

function paraBlob(canvas: HTMLCanvasElement, tipo: string, qualidade: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, tipo, qualidade));
}

export async function otimizarImagem(arquivo: File, opcoes: Opcoes = {}): Promise<ImagemOtimizada> {
  const { largura: larguraMax = 1200, altura: alturaMax = 1500, recortar = false, formato = "webp" } = opcoes;

  // imageOrientation respeita a rotação das fotos de celular (EXIF)
  const bitmap = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
  const origem: ImageBitmap | HTMLCanvasElement = recortar ? recortarCentro(bitmap, larguraMax / alturaMax) : bitmap;
  const escala = Math.min(1, larguraMax / origem.width, alturaMax / origem.height);
  const largura = Math.round(origem.width * escala);
  const altura = Math.round(origem.height * escala);
  const canvas = redimensionar(origem, origem.width, origem.height, largura, altura);
  bitmap.close();

  if (formato === "webp") {
    const webp = await paraBlob(canvas, "image/webp", QUALIDADE);
    if (webp && webp.type === "image/webp") return { arquivo: webp, extensao: "webp", largura, altura };
  }

  // JPEG: pedido explicitamente ou navegador sem codificador WebP (Safari antigo)
  const jpeg = await paraBlob(canvas, "image/jpeg", QUALIDADE);
  if (!jpeg) throw new Error("Não foi possível processar a imagem.");
  return { arquivo: jpeg, extensao: "jpg", largura, altura };
}

export function formatarBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
