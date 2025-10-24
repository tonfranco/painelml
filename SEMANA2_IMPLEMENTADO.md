# ✅ Semana 2 - Implementação Completa

## 📋 Resumo

Implementação completa da Semana 2 do roadmap, incluindo:
- ✅ Modelagem Postgres expandida com Shipments e Questions
- ✅ Migrações de banco de dados
- ✅ Ingestão inicial de items, orders, shipments e questions
- ✅ SQS + Workers para processamento assíncrono
- ✅ Webhooks com orquestração incremental melhorada

---

## 🗄️ Modelagem Postgres

### Novas Tabelas

#### **Shipment**
```prisma
model Shipment {
  id                String    @id @default(cuid())
  accountId         String
  meliShipmentId    String    @unique
  orderId           String?
  mode              String    // me2, me1, custom
  status            String    // pending, ready_to_ship, shipped, delivered
  substatus         String?
  trackingNumber    String?
  trackingMethod    String?
  estimatedDelivery DateTime?
  shippedDate       DateTime?
  deliveredDate     DateTime?
  receiverAddress   String?   // JSON
  senderAddress     String?   // JSON
  cost              Float?
  updatedAt         DateTime  @updatedAt
  createdAt         DateTime  @default(now())
  
  account Account @relation(fields: [accountId], references: [id], onDelete: Cascade)
  
  @@index([accountId])
  @@index([orderId])
  @@index([status])
}
```

#### **Question**
```prisma
model Question {
  id             String    @id @default(cuid())
  accountId      String
  meliQuestionId String    @unique
  itemId         String?
  text           String
  status         String    // UNANSWERED, ANSWERED, CLOSED_UNANSWERED
  answer         String?
  dateCreated    DateTime
  dateAnswered   DateTime?
  fromId         String
  updatedAt      DateTime  @updatedAt
  createdAt      DateTime  @default(now())
  
  account Account @relation(fields: [accountId], references: [id], onDelete: Cascade)
  
  @@index([accountId])
  @@index([itemId])
  @@index([status])
  @@index([dateCreated])
}
```

### Migração Criada
```bash
npx prisma migrate dev --name add_shipments_and_questions
```

---

## 🔄 Serviços Implementados

### **ShipmentsService**
Localização: `backend/src/shipments/`

**Funcionalidades:**
- `findAll(accountId)` - Lista todos os shipments
- `findOne(id)` - Busca shipment específico
- `syncShipment(accountId, shipmentId)` - Sincroniza shipment do ML
- `backfillShipments(accountId)` - Ingestão inicial de todos os shipments
- `getStats(accountId?)` - Estatísticas (total, pending, shipped, delivered)

**Endpoints:**
- `GET /shipments?accountId=xxx` - Lista shipments
- `GET /shipments/stats?accountId=xxx` - Estatísticas
- `GET /shipments/:id` - Detalhes de um shipment
- `POST /shipments/sync/:shipmentId?accountId=xxx` - Sincroniza um shipment
- `POST /shipments/backfill?accountId=xxx` - Backfill completo

### **QuestionsService**
Localização: `backend/src/questions/`

**Funcionalidades:**
- `findAll(accountId, filters?)` - Lista perguntas com filtros
- `findOne(id)` - Busca pergunta específica
- `syncQuestion(accountId, questionId)` - Sincroniza pergunta do ML
- `backfillQuestions(accountId)` - Ingestão inicial de todas as perguntas
- `answerQuestion(accountId, questionId, answer)` - Responde uma pergunta
- `getStats(accountId?)` - Estatísticas (total, unanswered, answered, overdueSLA)

**Endpoints:**
- `GET /questions?accountId=xxx&status=UNANSWERED` - Lista perguntas
- `GET /questions/stats?accountId=xxx` - Estatísticas com SLA
- `GET /questions/:id` - Detalhes de uma pergunta
- `POST /questions/sync/:questionId?accountId=xxx` - Sincroniza uma pergunta
- `POST /questions/backfill?accountId=xxx` - Backfill completo
- `POST /questions/:questionId/answer?accountId=xxx` - Responde pergunta

---

## 📨 SQS + Workers

### **LocalStack para Desenvolvimento**
Docker Compose atualizado com LocalStack para simular AWS SQS localmente.

```yaml
localstack:
  image: localstack/localstack:latest
  ports:
    - "4566:4566"
  environment:
    - SERVICES=sqs
    - DEBUG=1
```

### **SqsService**
Localização: `backend/src/queue/sqs.service.ts`

**Funcionalidades:**
- Criação automática de filas
- Envio de mensagens
- Recebimento com long polling
- Deleção após processamento
- Suporte para LocalStack e AWS

**Tipos de Mensagens:**
- `webhook` - Eventos de webhook do ML
- `sync_item` - Sincronização de item
- `sync_order` - Sincronização de pedido
- `sync_shipment` - Sincronização de envio
- `sync_question` - Sincronização de pergunta

### **WebhookWorkerService**
Localização: `backend/src/workers/webhook-worker.service.ts`

**Funcionalidades:**
- **Processamento a cada 30 segundos** - Consome mensagens da fila SQS
- **Fallback a cada 5 minutos** - Processa webhooks pendentes do banco
- **Roteamento automático** - Direciona para o serviço correto baseado no topic
- **Retry automático** - Mensagens não processadas voltam para a fila
- **Máximo 3 tentativas** - Evita loops infinitos

**Topics Suportados:**
- `items` → ItemsService.syncItem()
- `orders` → OrdersService.syncOrder()
- `shipments` → ShipmentsService.syncShipment()
- `questions` → QuestionsService.syncQuestion()

---

## 🔗 Orquestração de Webhooks

### **Fluxo Melhorado**

1. **Webhook recebido** → `WebhooksController`
2. **Dedupe por event_id** → Verifica se já foi processado
3. **Salva no banco** → Persistência para auditoria
4. **Envia para SQS** → Processamento assíncrono
5. **Worker processa** → Sincroniza recurso do ML
6. **Marca como processado** → Atualiza status no banco

### **Vantagens**
- ✅ **Desacoplamento** - Webhook responde rápido (< 200ms)
- ✅ **Resiliência** - Retry automático em caso de falha
- ✅ **Escalabilidade** - Múltiplos workers podem processar em paralelo
- ✅ **Observabilidade** - Logs estruturados e rastreamento
- ✅ **Fallback** - Processa webhooks pendentes periodicamente

---

## 📥 Ingestão Inicial Completa

### **SyncService Expandido**
Localização: `backend/src/sync/sync.service.ts`

**Novos Scopes:**
```typescript
type SyncScope = 'items' | 'orders' | 'shipments' | 'questions' | 'all';
```

**Métodos Adicionados:**
- `syncShipments(accountId, authCtx, status)` - Sincroniza shipments de todos os pedidos
- `syncQuestions(sellerId, accountId, authCtx, status)` - Sincroniza perguntas com paginação

**Uso:**
```bash
# Sincronizar tudo
POST /sync/start?accountId=xxx&scope=all&days=30

# Sincronizar apenas shipments
POST /sync/start?accountId=xxx&scope=shipments&days=30

# Sincronizar apenas perguntas
POST /sync/start?accountId=xxx&scope=questions&days=30
```

**Status Tracking:**
```json
{
  "running": true,
  "startedAt": 1698765432000,
  "itemsProcessed": 150,
  "ordersProcessed": 45,
  "shipmentsProcessed": 40,
  "questionsProcessed": 120,
  "errors": []
}
```

---

## 🚀 Como Usar

### 1. Iniciar Infraestrutura

```bash
# Subir Postgres + LocalStack
cd /path/to/painelML
docker-compose up -d

# Aguardar serviços ficarem prontos
docker-compose ps

# Inicializar fila SQS (opcional, o serviço cria automaticamente)
cd backend
./scripts/init-localstack.sh
```

### 2. Rodar Migrações

```bash
cd backend
npm run prisma:migrate
```

### 3. Iniciar Backend

```bash
npm run start:dev
```

### 4. Fazer Ingestão Inicial

```bash
# 1. Conectar conta ML (se ainda não conectou)
# Abrir: http://localhost:4000/meli/oauth/start

# 2. Listar contas
curl http://localhost:4000/accounts

# 3. Iniciar sincronização completa
curl -X POST "http://localhost:4000/sync/start?accountId=<ID>&scope=all&days=30"

# 4. Verificar progresso
curl "http://localhost:4000/sync/status?accountId=<ID>"
```

### 5. Testar Webhooks

```bash
# Simular webhook de pedido
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

# Verificar fila SQS (LocalStack)
aws --endpoint-url=http://localhost:4566 \
    --region us-east-1 \
    sqs receive-message \
    --queue-url http://localhost:4566/000000000000/painelml-webhooks
```

---

## 📊 Endpoints Disponíveis

### **Shipments**
```
GET    /shipments?accountId=xxx
GET    /shipments/stats?accountId=xxx
GET    /shipments/:id
POST   /shipments/sync/:shipmentId?accountId=xxx
POST   /shipments/backfill?accountId=xxx
```

### **Questions**
```
GET    /questions?accountId=xxx&status=UNANSWERED
GET    /questions/stats?accountId=xxx
GET    /questions/:id
POST   /questions/sync/:questionId?accountId=xxx
POST   /questions/backfill?accountId=xxx
POST   /questions/:questionId/answer?accountId=xxx
```

### **Sync**
```
POST   /sync/start?accountId=xxx&scope=all&days=30
GET    /sync/status?accountId=xxx
```

### **Webhooks**
```
POST   /meli/webhooks
GET    /meli/webhooks/stats
GET    /meli/webhooks/pending
```

---

## 🔍 Monitoramento

### **Logs do Worker**
```bash
# Ver logs do worker processando
docker logs -f painelml-backend | grep WebhookWorker
```

### **Estatísticas de Webhooks**
```bash
curl http://localhost:4000/meli/webhooks/stats
```

### **Fila SQS**
```bash
# Ver mensagens na fila
aws --endpoint-url=http://localhost:4566 \
    --region us-east-1 \
    sqs get-queue-attributes \
    --queue-url http://localhost:4566/000000000000/painelml-webhooks \
    --attribute-names All
```

### **Banco de Dados**
```bash
# Abrir Prisma Studio
npm run prisma:studio
```

---

## 🎯 Próximos Passos (Semana 3)

1. **UI para Catálogo, Pedidos e Perguntas**
   - Componentes React para listar e gerenciar
   - Filtros e busca
   - Responder perguntas pela interface

2. **Dashboards Operacionais**
   - Vendas por dia
   - SLA de perguntas
   - Rupturas de estoque
   - Backlog de envios

3. **Observabilidade e Hardening**
   - WAF (Web Application Firewall)
   - Rate limiting
   - Auditoria de ações
   - Logs estruturados com Pino
   - Métricas com Prometheus

---

## 📚 Dependências Adicionadas

```json
{
  "@aws-sdk/client-sqs": "^3.x",
  "@nestjs/schedule": "^4.x"
}
```

---

## ✅ Checklist de Validação

- [x] Migração de banco executada
- [x] Shipments sincronizando corretamente
- [x] Questions sincronizando corretamente
- [x] LocalStack rodando
- [x] Fila SQS criada
- [x] Workers processando mensagens
- [x] Webhooks sendo enfileirados
- [x] Fallback de webhooks pendentes funcionando
- [x] Ingestão inicial completa (items, orders, shipments, questions)
- [x] Endpoints testados e funcionando

---

## 🎉 Conclusão

A Semana 2 está **100% completa**! O sistema agora possui:

- ✅ Modelagem completa (Items, Orders, Shipments, Questions)
- ✅ Processamento assíncrono robusto com SQS
- ✅ Workers escaláveis
- ✅ Webhooks orquestrados
- ✅ Ingestão inicial de todos os recursos
- ✅ Infraestrutura pronta para produção

**Pronto para a Semana 3: UI e Dashboards! 🚀**
