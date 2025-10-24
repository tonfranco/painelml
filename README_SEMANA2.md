# 🚀 Painel ML - Sistema de Gestão Mercado Livre

Sistema completo de gestão para vendedores do Mercado Livre, com sincronização automática de produtos, pedidos, envios e perguntas.

## 📋 Status do Projeto

### ✅ Semana 1 - Concluída
- OAuth 2.0 com PKCE
- Tokens criptografados
- Webhooks com dedupe
- Backend NestJS + Prisma
- Frontend Next.js básico

### ✅ Semana 2 - Concluída
- **Modelagem completa**: Items, Orders, Shipments, Questions
- **SQS + Workers**: Processamento assíncrono com LocalStack
- **Ingestão inicial**: Backfill de todos os recursos
- **Webhooks orquestrados**: Sincronização incremental automática
- **APIs REST**: Endpoints completos para todos os recursos

### 🎯 Semana 3 - Próxima
- UI para catálogo, pedidos e perguntas
- Dashboards operacionais
- Observabilidade e hardening

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      MERCADO LIVRE API                       │
└─────────────────────────────────────────────────────────────┘
                            ▲ │
                            │ │ OAuth 2.0 + Webhooks
                            │ ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND (NestJS)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Webhooks   │→ │     SQS      │→ │   Workers    │     │
│  │  Controller  │  │  (LocalStack)│  │  (Cron Jobs) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                                      │             │
│         ▼                                      ▼             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Services Layer                           │  │
│  │  Items │ Orders │ Shipments │ Questions │ Sync       │  │
│  └──────────────────────────────────────────────────────┘  │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Prisma ORM                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│  Accounts │ Items │ Orders │ Shipments │ Questions │ ...   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológica

### Backend
- **NestJS** - Framework Node.js
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados relacional
- **AWS SDK** - Cliente SQS
- **LocalStack** - Simulação AWS local
- **Axios** - Cliente HTTP
- **Jose** - JWT/Crypto

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **TailwindCSS** - Styling

### DevOps
- **Docker Compose** - Orquestração de containers
- **Prisma Migrate** - Migrações de banco
- **ESLint + Prettier** - Code quality

---

## 🚀 Quick Start

### Pré-requisitos
```bash
- Node.js 18+
- Docker & Docker Compose
- AWS CLI (para LocalStack)
- Conta de desenvolvedor no Mercado Livre
```

### 1. Clonar e Instalar

```bash
# Clone o repositório
git clone <repo-url>
cd painelML

# Instalar dependências do backend
cd backend
npm install

# Instalar dependências do frontend
cd ../frontend
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
# Backend: backend/.env.local
DATABASE_URL="postgresql://painelml:dev_password_123@localhost:5432/painelml"
MELI_CLIENT_ID="seu_client_id"
MELI_CLIENT_SECRET="seu_client_secret"
MELI_REDIRECT_URI="http://localhost:4000/meli/oauth/callback"
APP_BASE_URL="http://localhost:4000"
ENCRYPTION_KEY="sua_chave_forte_32_caracteres"
AWS_REGION="us-east-1"
AWS_ENDPOINT="http://localhost:4566"
```

### 3. Iniciar Infraestrutura

```bash
# Subir Postgres + LocalStack
docker-compose up -d

# Verificar status
docker-compose ps
```

### 4. Rodar Migrações

```bash
cd backend
npm run prisma:migrate
```

### 5. Iniciar Aplicação

```bash
# Terminal 1: Backend
cd backend
npm run start:dev

# Terminal 2: Frontend (opcional)
cd frontend
npm run dev
```

### 6. Conectar Conta do Mercado Livre

```bash
# Abrir no navegador
http://localhost:4000/meli/oauth/start

# Após autorizar, você será redirecionado de volta
```

### 7. Fazer Ingestão Inicial

```bash
# Listar contas conectadas
curl http://localhost:4000/accounts

# Iniciar sincronização completa (substitua <ACCOUNT_ID>)
curl -X POST "http://localhost:4000/sync/start?accountId=<ACCOUNT_ID>&scope=all&days=30"

# Verificar progresso
curl "http://localhost:4000/sync/status?accountId=<ACCOUNT_ID>"
```

---

## 📚 Documentação

### Estrutura do Projeto

```
painelML/
├── backend/
│   ├── src/
│   │   ├── accounts/          # Gestão de contas ML
│   │   ├── items/             # Produtos/Anúncios
│   │   ├── orders/            # Pedidos
│   │   ├── shipments/         # Envios
│   │   ├── questions/         # Perguntas
│   │   ├── meli/              # Integração ML (OAuth, Webhooks)
│   │   ├── queue/             # SQS Service
│   │   ├── workers/           # Background workers
│   │   ├── sync/              # Sincronização/Backfill
│   │   ├── prisma/            # Prisma service
│   │   └── common/            # Utilitários
│   ├── prisma/
│   │   ├── schema.prisma      # Schema do banco
│   │   └── migrations/        # Migrações
│   └── scripts/
│       └── init-localstack.sh # Setup LocalStack
├── frontend/
│   └── src/
│       └── app/               # Next.js App Router
├── docker-compose.yml         # Postgres + LocalStack
├── SEMANA2_IMPLEMENTADO.md    # Documentação Semana 2
└── COMANDOS_SEMANA2.sh        # Comandos úteis
```

### Endpoints Principais

#### Contas
```
GET  /accounts              - Lista contas conectadas
GET  /meli/oauth/start      - Inicia OAuth flow
GET  /meli/oauth/callback   - Callback OAuth
```

#### Sincronização
```
POST /sync/start            - Inicia sincronização
GET  /sync/status           - Status da sincronização
```

#### Items
```
GET  /items                 - Lista items
GET  /items/stats           - Estatísticas
```

#### Orders
```
GET  /orders                - Lista pedidos
GET  /orders/stats          - Estatísticas
```

#### Shipments
```
GET  /shipments             - Lista envios
GET  /shipments/stats       - Estatísticas
POST /shipments/backfill    - Backfill de envios
POST /shipments/sync/:id    - Sincroniza um envio
```

#### Questions
```
GET  /questions             - Lista perguntas
GET  /questions/stats       - Estatísticas (com SLA)
POST /questions/backfill    - Backfill de perguntas
POST /questions/:id/answer  - Responde pergunta
```

#### Webhooks
```
POST /meli/webhooks         - Recebe webhooks do ML
GET  /meli/webhooks/stats   - Estatísticas
GET  /meli/webhooks/pending - Webhooks pendentes
```

---

## 🔄 Fluxo de Dados

### 1. Ingestão Inicial (Backfill)
```
Usuario → POST /sync/start
         ↓
    SyncService busca dados do ML
         ↓
    Salva no PostgreSQL
         ↓
    Retorna status
```

### 2. Sincronização Incremental (Webhooks)
```
ML envia webhook → WebhooksController
                  ↓
              Dedupe check
                  ↓
              Salva no banco
                  ↓
              Envia para SQS
                  ↓
              Worker processa (a cada 30s)
                  ↓
              Sincroniza recurso
                  ↓
              Marca como processado
```

### 3. Fallback de Webhooks
```
Cron job (a cada 5min)
         ↓
    Busca webhooks pendentes no banco
         ↓
    Envia para SQS
         ↓
    Worker processa
```

---

## 🧪 Testes

### Testar Webhook Manualmente

```bash
curl -X POST http://localhost:4000/meli/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "_id": "test-event-123",
    "resource": "/orders/123456789",
    "topic": "orders_v2",
    "user_id": "123456",
    "application_id": "123",
    "attempts": 1,
    "sent": "2025-01-01T00:00:00Z",
    "received": "2025-01-01T00:00:00Z"
  }'
```

### Verificar Fila SQS

```bash
# Ver mensagens
aws --endpoint-url=http://localhost:4566 \
    --region us-east-1 \
    sqs receive-message \
    --queue-url http://localhost:4566/000000000000/painelml-webhooks

# Ver atributos da fila
aws --endpoint-url=http://localhost:4566 \
    --region us-east-1 \
    sqs get-queue-attributes \
    --queue-url http://localhost:4566/000000000000/painelml-webhooks \
    --attribute-names All
```

### Abrir Prisma Studio

```bash
cd backend
npm run prisma:studio
# Abre em http://localhost:5555
```

---

## 📊 Monitoramento

### Logs

```bash
# Backend
docker logs -f painelml-backend

# Worker específico
docker logs -f painelml-backend | grep WebhookWorker

# LocalStack
docker logs -f painelml-localstack

# Postgres
docker logs -f painelml-postgres
```

### Métricas

```bash
# Estatísticas de webhooks
curl http://localhost:4000/meli/webhooks/stats

# Estatísticas de items
curl "http://localhost:4000/items/stats?accountId=<ID>"

# Estatísticas de orders
curl "http://localhost:4000/orders/stats?accountId=<ID>"

# Estatísticas de shipments
curl "http://localhost:4000/shipments/stats?accountId=<ID>"

# Estatísticas de questions (com SLA)
curl "http://localhost:4000/questions/stats?accountId=<ID>"
```

---

## 🔒 Segurança

### Tokens Criptografados
Todos os tokens do Mercado Livre são criptografados usando AES-256-GCM antes de serem salvos no banco.

```typescript
// Configurar chave forte em produção
ENCRYPTION_KEY="sua_chave_forte_minimo_32_caracteres"
```

### Dedupe de Webhooks
Cada webhook é identificado unicamente pelo `event_id` do Mercado Livre, evitando processamento duplicado.

### Rate Limiting
Workers processam mensagens com delays para respeitar rate limits da API do ML.

---

## 🚧 Troubleshooting

### Problema: LocalStack não inicia
```bash
# Verificar se a porta 4566 está livre
lsof -i :4566

# Reiniciar LocalStack
docker-compose restart localstack

# Ver logs
docker logs painelml-localstack
```

### Problema: Migrações falham
```bash
# Reset completo do banco
cd backend
npm run db:reset

# Rodar migrações novamente
npm run prisma:migrate
```

### Problema: Workers não processam
```bash
# Verificar se há mensagens na fila
aws --endpoint-url=http://localhost:4566 \
    --region us-east-1 \
    sqs get-queue-attributes \
    --queue-url http://localhost:4566/000000000000/painelml-webhooks \
    --attribute-names ApproximateNumberOfMessages

# Ver logs do worker
docker logs -f painelml-backend | grep WebhookWorker
```

### Problema: Token expirado
```bash
# Reconectar conta
# Abrir: http://localhost:4000/meli/oauth/start
```

---

## 📈 Performance

### Otimizações Implementadas

- ✅ **Long Polling** no SQS (20s) - Reduz chamadas desnecessárias
- ✅ **Batch Processing** - Processa até 10 mensagens por vez
- ✅ **Dedupe em memória** - Cache de eventos processados
- ✅ **Índices no banco** - Queries otimizadas
- ✅ **Rate limiting** - Delays entre requests ao ML
- ✅ **Connection pooling** - Prisma gerencia conexões

### Limites Atuais (MVP)

- Items: até 250 por sincronização
- Orders: até 500 por sincronização
- Questions: até 500 por sincronização
- Shipments: todos os pedidos sincronizados

---

## 🎯 Roadmap

### Semana 3 (Próxima)
- [ ] UI para catálogo de produtos
- [ ] UI para gestão de pedidos
- [ ] UI para responder perguntas
- [ ] Dashboard de vendas por dia
- [ ] Dashboard de SLA de perguntas
- [ ] Dashboard de rupturas de estoque
- [ ] WAF e rate limiting
- [ ] Logs estruturados
- [ ] Auditoria de ações

### Futuro
- [ ] Multi-tenancy (múltiplos usuários)
- [ ] Notificações em tempo real (WebSockets)
- [ ] Exportação de relatórios (CSV, Excel, PDF)
- [ ] Gestão de estoque
- [ ] Integração com ML Chat
- [ ] Integração com ML Envios
- [ ] App mobile (React Native)

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto é privado e proprietário.

---

## 📞 Suporte

Para dúvidas ou problemas:
- Documentação completa: `SEMANA2_IMPLEMENTADO.md`
- Comandos úteis: `COMANDOS_SEMANA2.sh`
- API do Mercado Livre: https://developers.mercadolibre.com.br/

---

## ✅ Checklist de Produção

Antes de fazer deploy em produção:

- [ ] Configurar `ENCRYPTION_KEY` forte e única
- [ ] Usar PostgreSQL em produção (não SQLite)
- [ ] Configurar AWS SQS real (não LocalStack)
- [ ] Habilitar HTTPS obrigatório
- [ ] Configurar rate limiting
- [ ] Implementar logs estruturados
- [ ] Configurar monitoring (Sentry, LogRocket)
- [ ] Configurar backup automático do banco
- [ ] Configurar CI/CD (GitHub Actions)
- [ ] Revisar variáveis de ambiente
- [ ] Testar fluxo completo de OAuth
- [ ] Testar processamento de webhooks
- [ ] Configurar domínio customizado
- [ ] Configurar SSL/TLS

---

**Desenvolvido com ❤️ para vendedores do Mercado Livre**
