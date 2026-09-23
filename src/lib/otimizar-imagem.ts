// Redimensiona e converte a foto para WebP no navegador, antes de enviar ao Supabase.
// 1200×1500 cobre a maior exibição da loja (foto 4:5 com ~560px de largura) em telas retina.

const LARGURA_MAX = 1200;
const ALTURA_MAX = 1500;
const QUALIDADE = 0.95;

export type ImagemOtimizada = { arquivo: Blob; extensao: string; largura: number; altura: number };

function tamanhoFinal(largura: number, altura: number) {
  const escala = Math.min(1, LARGURA_MAX / largura, ALTURA_MAX / altura);
  return { largura: Math.round(largura * escala), altura: Math.round(altura * escala) };
}

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

function paraBlob(canvas: HTMLCanvasElement, tipo: string, qualidade: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, tipo, qualidade));
}

export async function otimizarImagem(arquivo: File): Promise<ImagemOtimizada> {
  // imageOrientation respeita a rotação das fotos de celular (EXIF)
  const bitmap = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
  const { largura, altura } = tamanhoFinal(bitmap.width, bitmap.height);
  const canvas = redimensionar(bitmap, bitmap.width, bitmap.height, largura, altura);
  bitmap.close();

  const webp = await paraBlob(canvas, "image/webp", QUALIDADE);
  if (webp && webp.type === "image/webp") return { arquivo: webp, extensao: "webp", largura, altura };

  // Navegadores sem codificador WebP (Safari antigo) caem para JPEG de alta qualidade
  const jpeg = await paraBlob(canvas, "image/jpeg", QUALIDADE);
  if (!jpeg) throw new Error("Não foi possível processar a imagem.");
  return { arquivo: jpeg, extensao: "jpg", largura, altura };
}

export function formatarBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
