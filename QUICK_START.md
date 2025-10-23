# 🚀 Quick Start - Painel ML

## Setup Inicial (5 minutos)

### 1. PostgreSQL
```bash
# Instalar Docker Desktop: https://www.docker.com/products/docker-desktop/
# Ou usar: brew install --cask docker

# Subir banco
docker compose up -d
```

### 2. Backend
```bash
cd backend

# Copiar variáveis de ambiente
cp env.example .env.local

# Editar .env.local com suas credenciais do ML
# Gerar ENCRYPTION_KEY:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Instalar dependências (se necessário)
npm install

# Gerar Prisma Client e rodar migrations
npm run prisma:generate
npm run prisma:migrate

# Iniciar backend
npm run start:dev
```

### 3. Conectar Conta ML
```bash
# Abrir no navegador
open http://localhost:4000/meli/oauth/start
```

### 4. Verificar
```bash
# Ver contas conectadas
curl http://localhost:4000/accounts

# Abrir Prisma Studio
npm run prisma:studio
```

## Comandos Úteis

### Backend
```bash
cd backend

# Dev
npm run start:dev

# Build
npm run build

# Prod
npm run start:prod

# Prisma Studio (GUI do banco)
npm run prisma:studio
```

### Docker
```bash
# Subir
docker compose up -d

# Parar
docker compose down

# Ver logs
docker logs painelml-postgres

# Resetar (CUIDADO: apaga dados)
docker compose down -v
```

### Prisma
```bash
cd backend

# Gerar client
npm run prisma:generate

# Criar migration
npm run prisma:migrate

# Reset banco (CUIDADO)
npm run db:reset

# Studio
npm run prisma:studio
```

## Testar Funcionalidades

### OAuth
```bash
open http://localhost:4000/meli/oauth/start
```

### Webhooks
```bash
# Stats
curl http://localhost:4000/meli/webhooks/stats

# Pending
curl http://localhost:4000/meli/webhooks/pending
```

### Sync/Backfill
```bash
# Listar contas
curl http://localhost:4000/accounts

# Iniciar sync (substitua ACCOUNT_ID)
curl -X POST http://localhost:4000/sync/start \
  -H "Content-Type: application/json" \
  -d '{"accountId": "ACCOUNT_ID", "scope": "all", "days": 30}'

# Status
curl http://localhost:4000/sync/status/ACCOUNT_ID
```

## Estrutura do Projeto

```
painelML/
├── docker-compose.yml          # PostgreSQL
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Modelos do banco
│   ├── src/
│   │   ├── accounts/           # Gestão de contas
│   │   ├── common/             # CryptoService
│   │   ├── meli/               # OAuth + Webhooks
│   │   ├── sync/               # Backfill
│   │   └── prisma/             # PrismaService
│   ├── .env.local              # Variáveis (gitignored)
│   └── env.example             # Template
└── frontend/                   # Next.js (próxima fase)
```

## Próximos Passos

1. ✅ Testar OAuth e ver tokens criptografados no Prisma Studio
2. ✅ Rodar backfill para sincronizar itens e pedidos
3. ✅ Configurar webhooks no painel do ML
4. 🔜 Desenvolver UI básica no frontend

## Documentação Completa

- `FASE2_IMPLEMENTADO.md` - Detalhes da implementação
- `backend/SETUP.md` - Setup detalhado
- `backend/DOCKER_INSTALL.md` - Instalação do Docker

## Suporte

Problemas? Veja `FASE2_IMPLEMENTADO.md` seção "Troubleshooting"
