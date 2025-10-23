# Setup Backend - Painel ML

## 🚀 Início Rápido

### 1. Subir PostgreSQL (Docker)

```bash
# Na raiz do projeto
docker-compose up -d
```

Verifica se está rodando:
```bash
docker ps | grep painelml-postgres
```

### 2. Configurar Variáveis de Ambiente

```bash
cd backend
cp env.example .env.local
```

Edite `.env.local` com suas credenciais do Mercado Livre.

### 3. Rodar Migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Iniciar Backend

```bash
npm run start:dev
```

## 🔐 Segurança

### Gerar Chave de Criptografia

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Cole o resultado em `ENCRYPTION_KEY` no `.env.local`.

## 📊 Prisma Studio

Visualizar dados no navegador:

```bash
npm run prisma:studio
```

Abre em: http://localhost:5555

## 🧪 Testar Webhooks

### Estatísticas
```bash
curl http://localhost:4000/meli/webhooks/stats
```

### Eventos Pendentes
```bash
curl http://localhost:4000/meli/webhooks/pending
```

## 🔄 Reset do Banco

⚠️ **CUIDADO**: Apaga todos os dados!

```bash
npm run db:reset
```

## 📝 Estrutura de Dados

- **Account**: Contas conectadas do ML
- **AccountToken**: Tokens criptografados (AES-256-GCM)
- **Item**: Produtos sincronizados
- **Order**: Pedidos sincronizados
- **WebhookEvent**: Log de webhooks com dedupe

## 🛠️ Comandos Úteis

```bash
# Gerar Prisma Client
npm run prisma:generate

# Criar nova migration
npm run prisma:migrate

# Abrir Prisma Studio
npm run prisma:studio

# Formatar código
npm run format

# Lint
npm run lint
```
