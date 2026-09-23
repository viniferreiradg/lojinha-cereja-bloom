# Lojinha · Cereja Bloom

Loja de camisetas da banda com carrinho, pagamento por PIX (copia e cola + QR Code) e painel admin
para cadastrar camisetas e marcar pedidos como pagos.

**Stack:** Next.js 16 · Tailwind 4 · Supabase (banco, login e fotos) · Vercel

## Tipo de venda

Cada camiseta tem um tipo, escolhido no cadastro do admin:
- **Comprar**: peça pronta para entrega. Selo "Pronta entrega" na vitrine.
- **Fazer pré-venda**: produção depois da venda. Selo "Pré-venda" na vitrine.

O tipo aparece no botão da loja, no carrinho, na confirmação e nos pedidos do admin.

## Como o estoque funciona

- **Estoque** é a quantidade real de peças de cada tamanho. Só baixa quando o admin marca o pedido como **pago**.
- **Disponível na loja** = estoque − peças em pedidos aguardando pagamento. Assim ninguém compra uma peça já reservada.
- **Cancelar** um pedido libera as peças (e devolve ao estoque se ele estava pago).

## Configuração (uma vez só)

### 1. Supabase
1. Crie uma conta em [supabase.com](https://supabase.com) e um projeto novo (região São Paulo).
2. Em **SQL Editor → New query**, cole todo o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**.
   - Se você já tinha rodado o `schema.sql` antes, rode também os arquivos de [`supabase/atualizacoes/`](supabase/atualizacoes) em ordem.
   - No final do arquivo fica o e-mail de quem pode entrar no admin. Troque/adicione antes de rodar se precisar.
3. Em **Authentication → Users → Add user → Create new user**, crie o usuário admin com o mesmo e-mail e uma senha
   (marque *Auto Confirm User*).
4. Em **Authentication → Sign In / Providers**, desligue **Allow new users to sign up**.
5. Em **Project Settings → API Keys**, copie a *Publishable key*; em **Data API**, copie a *Project URL*.

### 2. Rodar no computador
```bash
cp .env.example .env.local   # e cole a URL e a chave do Supabase
npm install
npm run dev                  # abre em http://localhost:3000
```
Entre em `/admin`, vá em **Configurações** e preencha a chave PIX e o WhatsApp da banda.

### 3. Publicar na Vercel
1. Suba este projeto para um repositório no GitHub.
2. Em [vercel.com](https://vercel.com), **Add New → Project**, importe o repositório.
3. Em **Environment Variables**, adicione `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. **Deploy**. A cada `git push` o site atualiza sozinho.

## Páginas

| Rota | O que é |
|---|---|
| `/` | Vitrine |
| `/produto/[id]` | Escolha de tamanho e quantidade |
| `/carrinho` | Carrinho + nome e WhatsApp |
| `/pedido/[id]` | Código do pedido, PIX e botão de enviar comprovante |
| `/admin` | Pedidos (marcar pago / cancelar) |
| `/admin/produtos` | Cadastro de camisetas, fotos, preço e estoque por tamanho |
| `/admin/resumo` | Quantidades por modelo e tamanho, para mandar pra estamparia |
| `/admin/config` | Chave PIX, WhatsApp, preço padrão, abrir/fechar a Lojinha |
