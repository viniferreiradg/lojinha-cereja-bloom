export type ModoVenda = "compra" | "pre_venda";

export const MODOS_VENDA: Record<ModoVenda, { botao: string; selo: string }> = {
  compra: { botao: "Comprar", selo: "Pronta entrega" },
  pre_venda: { botao: "Fazer pré-venda", selo: "Pré-venda" },
};

export type Categoria = { id: string; nome: string };

export type Produto = {
  id: string;
  nome: string;
  cor: string;
  estampa: string;
  descricao: string;
  foto_url: string | null;
  preco: number;
  modo: ModoVenda;
  categoria_id: string | null;
  ativo: boolean;
  ordem: number;
};

export type VariacaoLoja = {
  id: string;
  produto_id: string;
  tamanho: string;
  ordem: number;
  estoque: number;
  disponivel: number;
};

export type Configuracoes = {
  chave_pix: string;
  nome_recebedor: string;
  cidade: string;
  whatsapp_banda: string;
  preco_padrao: number;
  loja_aberta: boolean;
  seo_titulo: string;
  seo_descricao: string;
  seo_palavras_chave: string;
  seo_imagem_url: string | null;
  seo_url_site: string;
  seo_indexar: boolean;
  seo_google_verificacao: string;
  seo_google_analytics: string;
  seo_instagram: string;
};

export type StatusPedido = "pendente" | "pago" | "cancelado";

export type ItemPedido = {
  produto_nome: string;
  cor: string;
  tamanho: string;
  quantidade: number;
  preco_unitario: number;
  modo: ModoVenda;
};

export type Pedido = {
  id: string;
  codigo: string;
  nome: string;
  whatsapp: string;
  total: number;
  status: StatusPedido;
  criado_em: string;
  pago_em: string | null;
  itens_pedido: ItemPedido[];
};

export const TAMANHOS_PADRAO = ["P", "M", "G", "GG", "XG"];
