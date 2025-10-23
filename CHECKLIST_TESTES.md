# ✅ Checklist de Testes - Painel ML

## 🔧 Setup Inicial

- [ ] Docker instalado e rodando
- [ ] PostgreSQL iniciado (`docker compose up -d`)
- [ ] Backend: dependências instaladas (`npm install`)
- [ ] Backend: `.env.local` configurado
- [ ] Backend: `ENCRYPTION_KEY` gerada
- [ ] Backend: Prisma Client gerado (`npm run prisma:generate`)
- [ ] Backend: Migrations rodadas (`npm run prisma:migrate`)
- [ ] Frontend: dependências instaladas (`npm install`)
- [ ] Cloudflare Tunnel ativo (se necessário)

## 🔐 OAuth & Autenticação

- [ ] Backend rodando em `http://localhost:4000`
- [ ] Acessar `http://localhost:4000/meli/oauth/start`
- [ ] Redirecionado para Mercado Livre
- [ ] Autorização concedida
- [ ] Redirecionado de volta com sucesso
- [ ] Ver conta em `GET /accounts`
- [ ] Abrir Prisma Studio (`npm run prisma:studio`)
- [ ] Verificar registro em `Account`
- [ ] Verificar registro em `AccountToken`
- [ ] Token `accessToken` está criptografado (não legível)
- [ ] Token `refreshToken` está criptografado (não legível)

## 🔄 Criptografia

- [ ] Tokens salvos como Base64 no banco
- [ ] Não é possível ler tokens diretamente
- [ ] `AccountsService.getTokensForSeller()` retorna tokens descriptografados
- [ ] Refresh de token mantém criptografia

## 📨 Webhooks

- [ ] Endpoint `POST /meli/webhooks` acessível
- [ ] Enviar webhook de teste (ver `API_EXAMPLES.http`)
- [ ] Webhook salvo em `WebhookEvent`
- [ ] `event_id` único registrado
- [ ] Enviar mesmo webhook novamente
- [ ] Segundo envio retorna `status: "duplicate"`
- [ ] Ver estatísticas em `GET /meli/webhooks/stats`
- [ ] Ver eventos pendentes em `GET /meli/webhooks/pending`

## 🔄 Backfill / Sync

- [ ] Obter `accountId` de `GET /accounts`
- [ ] Iniciar sync: `POST /sync/start` com `scope: "all"`
- [ ] Ver status: `GET /sync/status/:accountId`
- [ ] `running: true` enquanto processa
- [ ] Aguardar conclusão
- [ ] `running: false` ao terminar
- [ ] `itemsProcessed > 0` (se houver itens)
- [ ] `ordersProcessed > 0` (se houver pedidos)
- [ ] `errors: []` (sem erros)
- [ ] Verificar tabela `Item` no Prisma Studio
- [ ] Verificar tabela `Order` no Prisma Studio

## 📦 API de Itens

- [ ] `GET /items` retorna lista
- [ ] Itens têm `meliItemId`, `title`, `price`, `status`
- [ ] `GET /items/stats` retorna contadores
- [ ] Stats mostram `total`, `active`, `paused`, `closed`
- [ ] Filtrar por conta: `GET /items?accountId=xxx`

## 📋 API de Pedidos

- [ ] `GET /orders` retorna lista
- [ ] Pedidos têm `meliOrderId`, `status`, `totalAmount`
- [ ] `GET /orders/stats` retorna contadores
- [ ] Stats mostram `total`, `paid`, `confirmed`, etc.
- [ ] Filtrar por dias: `GET /orders?days=7`
- [ ] Filtrar por conta: `GET /orders?accountId=xxx`

## 🎨 Frontend - Home

- [ ] Frontend rodando em `http://localhost:3000`
- [ ] Página carrega sem erros
- [ ] Botão "Conectar conta Mercado Livre" visível
- [ ] Clicar no botão redireciona para OAuth
- [ ] Link "Ver contas conectadas" visível
- [ ] Dark mode funciona

## 👥 Frontend - Contas

- [ ] Acessar `http://localhost:3000/accounts`
- [ ] Navegação superior visível
- [ ] Lista de contas carrega
- [ ] Mostra `sellerId`, `nickname`, `siteId`, `createdAt`
- [ ] Contador de contas correto
- [ ] Se vazio, mostra mensagem + botão "Conectar conta"
- [ ] Hover nas linhas funciona
- [ ] Dark mode funciona

## 🏷️ Frontend - Catálogo

- [ ] Acessar `http://localhost:3000/catalog`
- [ ] Navegação superior visível
- [ ] Grid de produtos carrega
- [ ] Cada card mostra: imagem, título, preço, status, disponível
- [ ] Contador de itens correto
- [ ] Status com cores (green=active, yellow=paused, red=closed)
- [ ] Se vazio, mostra mensagem
- [ ] Hover nos cards funciona
- [ ] Dark mode funciona

## 📦 Frontend - Pedidos

- [ ] Acessar `http://localhost:3000/orders`
- [ ] Navegação superior visível
- [ ] Tabela de pedidos carrega
- [ ] Colunas: Order ID, Status, Valor, Data, Comprador
- [ ] Contador de pedidos correto
- [ ] Status com badges coloridos
- [ ] Data formatada em pt-BR
- [ ] Valor formatado como moeda
- [ ] Se vazio, mostra mensagem
- [ ] Hover nas linhas funciona
- [ ] Dark mode funciona

## 🔄 Navegação

- [ ] Clicar em "Home" vai para `/`
- [ ] Clicar em "Contas" vai para `/accounts`
- [ ] Clicar em "Catálogo" vai para `/catalog`
- [ ] Clicar em "Pedidos" vai para `/orders`
- [ ] Link ativo destacado em cada página
- [ ] Navegação consistente em todas as páginas

## 🛠️ Prisma Studio

- [ ] Abrir: `npm run prisma:studio`
- [ ] Acessível em `http://localhost:5555`
- [ ] Ver tabela `Account`
- [ ] Ver tabela `AccountToken`
- [ ] Ver tabela `Item`
- [ ] Ver tabela `Order`
- [ ] Ver tabela `WebhookEvent`
- [ ] Consegue editar registros (se necessário)

## 🔍 Logs & Debugging

- [ ] Backend mostra logs estruturados
- [ ] Logs de OAuth com ✅ ou ❌
- [ ] Logs de webhooks com 📨
- [ ] Logs de sync com progresso
- [ ] Erros mostram stack trace
- [ ] Correlation IDs nos logs

## 🚨 Tratamento de Erros

- [ ] Backend retorna erro 400 para requisições inválidas
- [ ] Backend retorna erro 404 para recursos não encontrados
- [ ] Backend retorna erro 500 para erros internos
- [ ] Frontend mostra mensagens de erro amigáveis
- [ ] Frontend não quebra em caso de API offline
- [ ] Webhooks duplicados são ignorados
- [ ] Tokens expirados são renovados automaticamente

## 🔒 Segurança

- [ ] Tokens nunca aparecem em logs
- [ ] Tokens criptografados no banco
- [ ] `ENCRYPTION_KEY` não está hardcoded
- [ ] Cookies são `httpOnly` e `signed`
- [ ] CORS configurado corretamente
- [ ] Secrets no `.env.local` (gitignored)

## 📊 Performance

- [ ] Sync processa itens em batch
- [ ] Rate limiting respeitado (sleep entre requests)
- [ ] Queries Prisma otimizadas (select específico)
- [ ] Frontend carrega rápido (<2s)
- [ ] Imagens de produtos carregam lazy

## 🧹 Limpeza

- [ ] Rodar `npm run db:reset` (CUIDADO!)
- [ ] Banco resetado com sucesso
- [ ] Rodar migrations novamente
- [ ] Reconectar conta ML
- [ ] Rodar sync novamente
- [ ] Tudo funciona após reset

## ✅ Checklist Final

- [ ] Todos os testes acima passaram
- [ ] Documentação lida e compreendida
- [ ] `.env.local` configurado corretamente
- [ ] Pronto para usar em produção (com ajustes de segurança)

---

## 📝 Notas

- **Erros de lint** sobre `Property 'account' does not exist` são normais antes de rodar `prisma generate`
- **Docker** deve estar rodando antes de iniciar o backend
- **Cloudflare Tunnel** é necessário apenas para receber webhooks do ML
- **Prisma Studio** é útil para debug mas não deve ser exposto em produção

## 🎉 Conclusão

Se todos os itens estão marcados, **parabéns!** 🎊

Seu Painel ML está funcionando perfeitamente e pronto para:
- Conectar múltiplas contas
- Receber webhooks em tempo real
- Sincronizar produtos e pedidos
- Visualizar dados na interface web

**Próximo passo**: Configurar webhooks no painel do Mercado Livre apontando para seu túnel Cloudflare!
