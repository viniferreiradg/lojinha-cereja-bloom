export type ModoVenda = "compra" | "pre_venda";

export const MODOS_VENDA: Record<ModoVenda, { botao: string; selo: string }> = {
  compra: { botao: "Comprar", selo: "Pronta entrega" },
  pre_venda: { botao: "Fazer pré-venda", selo: "Pré-venda" },
};

export type Produto = {
  id: string;
  nome: string;
  cor: string;
  estampa: string;
  descricao: string;
  foto_url: string | null;
  preco: number;
  modo: ModoVenda;
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
