# 🚀 Painel ML - Integração Mercado Livre

Sistema completo de integração com Mercado Livre usando OAuth 2.0 (PKCE), webhooks, sincronização de dados e interface web.

## ✨ Funcionalidades Implementadas

### Backend (NestJS + PostgreSQL)
- ✅ **OAuth 2.0 com PKCE**: Autenticação segura com ML
- ✅ **Criptografia AES-256-GCM**: Tokens salvos criptografados
- ✅ **Webhooks com Dedupe**: Processamento idempotente por `event_id`
- ✅ **Backfill Assíncrono**: Sincronização de itens e pedidos
- ✅ **Refresh Automático**: Tokens renovados automaticamente
- ✅ **API RESTful**: Endpoints para contas, itens, pedidos e webhooks

### Frontend (Next.js 16 + Tailwind CSS)
- ✅ **Página Home**: Botão de conexão com ML
- ✅ **Contas Conectadas**: Lista de sellers autorizados
- ✅ **Catálogo**: Grid de produtos sincronizados
- ✅ **Pedidos**: Tabela de orders recentes
- ✅ **Navegação**: Menu consistente entre páginas
- ✅ **Dark Mode**: Suporte completo

## 🏗️ Arquitetura

```
painelML/
├── backend/                    # NestJS API
│   ├── prisma/
│   │   └── schema.prisma       # PostgreSQL schema
│   ├── src/
│   │   ├── accounts/           # Gestão de contas + criptografia
│   │   ├── common/             # CryptoService
│   │   ├── items/              # Endpoints de produtos
│   │   ├── meli/               # OAuth + Webhooks
│   │   ├── orders/             # Endpoints de pedidos
│   │   ├── sync/               # Backfill worker
│   │   └── prisma/             # PrismaService
│   └── .env.local              # Variáveis (gitignored)
├── frontend/                   # Next.js App
│   └── src/app/
│       ├── accounts/           # Página de contas
│       ├── catalog/            # Página de produtos
│       ├── orders/             # Página de pedidos
│       └── page.tsx            # Home
└── docker-compose.yml          # PostgreSQL

```

## 🚀 Quick Start

### 1. Instalar Docker
```bash
# macOS
brew install --cask docker
# Ou baixar: https://www.docker.com/products/docker-desktop/
```

### 2. Subir PostgreSQL
```bash
docker compose up -d
```

### 3. Configurar Backend
```bash
cd backend

# Copiar .env
cp env.example .env.local

# Editar .env.local com suas credenciais do ML
# Gerar ENCRYPTION_KEY:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Instalar dependências
npm install

# Rodar migrations
npm run prisma:generate
npm run prisma:migrate

# Iniciar
npm run start:dev
```

### 4. Configurar Frontend
```bash
cd frontend

# Instalar dependências
npm install

# Iniciar
npm run dev
```

### 5. Conectar Conta ML
```bash
# Abrir no navegador
open http://localhost:3000
```

Clique em "Conectar conta Mercado Livre" e autorize.

## 📊 Endpoints API

### Contas
- `GET /accounts` - Listar contas
- `GET /accounts/:sellerId/status` - Status de tokens

### OAuth
- `GET /meli/oauth/start` - Iniciar OAuth
- `GET /meli/oauth/callback` - Callback OAuth

### Webhooks
- `POST /meli/webhooks` - Receber webhook
- `GET /meli/webhooks/stats` - Estatísticas
- `GET /meli/webhooks/pending` - Eventos pendentes

### Itens
- `GET /items` - Listar produtos
- `GET /items/stats` - Estatísticas

### Pedidos
- `GET /orders` - Listar pedidos
- `GET /orders/stats` - Estatísticas

### Sync
- `POST /sync/start` - Iniciar backfill
- `GET /sync/status/:accountId` - Status

## 🔐 Segurança

### Criptografia de Tokens
- **Algoritmo**: AES-256-GCM
- **Derivação de chave**: scrypt
- **Salt único** por token
- **Authentication tag** para integridade

### Formato
```
salt(16) + iv(16) + tag(16) + ciphertext → Base64
```

## 📚 Documentação

- **[QUICK_START.md](./QUICK_START.md)** - Guia rápido
- **[FASE2_IMPLEMENTADO.md](./FASE2_IMPLEMENTADO.md)** - Detalhes da implementação
- **[backend/SETUP.md](./backend/SETUP.md)** - Setup detalhado do backend
- **[backend/API_EXAMPLES.http](./backend/API_EXAMPLES.http)** - Exemplos de API
- **[backend/DOCKER_INSTALL.md](./backend/DOCKER_INSTALL.md)** - Instalação do Docker

## 🛠️ Comandos Úteis

### Backend
```bash
cd backend

# Dev
npm run start:dev

# Prisma Studio (GUI do banco)
npm run prisma:studio

# Migrations
npm run prisma:migrate

# Gerar client
npm run prisma:generate
```

### Frontend
```bash
cd frontend

# Dev
npm run dev

# Build
npm run build

# Prod
npm run start
```

### Docker
```bash
# Subir
docker compose up -d

# Parar
docker compose down

# Logs
docker logs painelml-postgres
```

## 🧪 Testar

### 1. OAuth
```bash
open http://localhost:3000
# Clicar em "Conectar conta Mercado Livre"
```

### 2. Verificar Tokens Criptografados
```bash
cd backend
npm run prisma:studio
# Abrir tabela AccountToken
```

### 3. Backfill
```bash
# Listar contas
curl http://localhost:4000/accounts

# Iniciar sync (substitua ACCOUNT_ID)
curl -X POST http://localhost:4000/sync/start \
  -H "Content-Type: application/json" \
  -d '{"accountId": "ACCOUNT_ID", "scope": "all", "days": 30}'

# Ver status
curl http://localhost:4000/sync/status/ACCOUNT_ID
```

### 4. Ver Dados no Frontend
```bash
open http://localhost:3000/accounts
open http://localhost:3000/catalog
open http://localhost:3000/orders
```

## 🎨 Stack Tecnológico

### Backend
- **NestJS** 11 - Framework Node.js
- **Prisma** 6 - ORM
- **PostgreSQL** 15 - Banco de dados
- **Axios** - HTTP client
- **Jose** - JWT/PKCE
- **Pino** - Logging

### Frontend
- **Next.js** 16 - React framework
- **React** 19 - UI library
- **Tailwind CSS** 4 - Styling
- **TypeScript** 5 - Type safety

### Infraestrutura
- **Docker** - Containerização
- **Cloudflare Tunnel** - Exposição HTTPS

## 📈 Próximos Passos (Fase 3)

### Backend
- [ ] Worker para processar webhooks pendentes
- [ ] Rate limiting inteligente (429 handling)
- [ ] Retry exponencial com DLQ
- [ ] Métricas e observabilidade
- [ ] Testes automatizados

### Frontend
- [ ] Dashboard com gráficos
- [ ] Filtros e busca
- [ ] Paginação
- [ ] Detalhes de item/pedido
- [ ] Notificações em tempo real

### Integrações
- [ ] Envio de mensagens (ML Chat)
- [ ] Gestão de estoque
- [ ] Relatórios financeiros
- [ ] Exportação de dados

## 🐛 Troubleshooting

### Docker não instalado
Ver: `backend/DOCKER_INSTALL.md`

### Erro "Property 'account' does not exist"
```bash
cd backend
npm run prisma:generate
```

### Tokens não descriptografam
Verifique se `ENCRYPTION_KEY` é a mesma usada para criptografar.

### Backend não conecta no PostgreSQL
```bash
# Verificar se está rodando
docker ps | grep postgres

# Ver logs
docker logs painelml-postgres

# Reiniciar
docker compose restart
```

## 📝 Variáveis de Ambiente

### Backend (.env.local)
```env
DATABASE_URL="postgresql://painelml:dev_password_123@localhost:5432/painelml"
ENCRYPTION_KEY="sua-chave-de-32-chars-ou-mais"
MELI_CLIENT_ID="seu_client_id"
MELI_CLIENT_SECRET="seu_client_secret"
MELI_REDIRECT_URI="https://seu-tunnel.trycloudflare.com/meli/oauth/callback"
APP_BASE_URL="https://seu-tunnel.trycloudflare.com"
FRONTEND_BASE_URL="http://localhost:3000"
COOKIE_SECRET="seu_cookie_secret"
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:4000"
```

## 📄 Licença

MIT

## 👤 Autor

Desenvolvido para integração com Mercado Livre.

---

**Status**: ✅ Fase 2 Completa - Pronto para produção!
