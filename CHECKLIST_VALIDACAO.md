# ✅ Checklist de Validação - Semana 2

Use este checklist para validar que toda a implementação da Semana 2 está funcionando corretamente.

---

## 🏗️ Infraestrutura

### Docker Compose

- [ ] **Postgres está rodando**
  ```bash
  docker ps | grep painelml-postgres
  # Deve mostrar: Up X minutes (healthy)
  ```

- [ ] **LocalStack está rodando**
  ```bash
  docker ps | grep painelml-localstack
  # Deve mostrar: Up X minutes (healthy)
  ```

- [ ] **Postgres está acessível**
  ```bash
  docker exec painelml-postgres pg_isready -U painelml
  # Deve retornar: painelml:5432 - accepting connections
  ```

- [ ] **LocalStack está acessível**
  ```bash
  curl -s http://localhost:4566/_localstack/health | jq '.services.sqs'
  # Deve retornar: "running"
  ```

---

## 🗄️ Banco de Dados

### Migrações

- [ ] **Migração executada**
  ```bash
  cd backend
  ls prisma/migrations/ | grep add_shipments_and_questions
  # Deve listar a pasta da migração
  ```

- [ ] **Tabelas criadas**
  ```bash
  # Abrir Prisma Studio
  npm run prisma:studio
  # Verificar se existem as tabelas:
  # - Account
  # - AccountToken
  # - Item
  # - Order
  # - Shipment
  # - Question
  # - WebhookEvent
  ```

- [ ] **Índices criados**
  ```sql
  -- Conectar ao banco e executar:
  \d shipment
  \d question
  # Verificar se os índices estão listados
  ```

---

## ⚙️ Backend

### Compilação

- [ ] **Backend compila sem erros**
  ```bash
  cd backend
  npm run build
  # Não deve ter erros de TypeScript
  ```

- [ ] **Backend inicia corretamente**
  ```bash
  npm run start:dev
  # Deve mostrar: Application is running on: http://localhost:4000
  ```

- [ ] **Endpoint raiz responde**
  ```bash
  curl http://localhost:4000/
  # Deve retornar JSON com mensagem
  ```

---

## 📨 SQS + Workers

### Fila SQS

- [ ] **Fila foi criada**
  ```bash
  aws --endpoint-url=http://localhost:4566 \
      --region us-east-1 \
      sqs list-queues
  # Deve listar: painelml-webhooks
  ```

- [ ] **Fila está acessível**
  ```bash
  aws --endpoint-url=http://localhost:4566 \
      --region us-east-1 \
      sqs get-queue-attributes \
      --queue-url http://localhost:4566/000000000000/painelml-webhooks \
      --attribute-names ApproximateNumberOfMessages
  # Deve retornar atributos da fila
  ```

### Workers

- [ ] **Worker está rodando**
  ```bash
  docker logs painelml-backend 2>&1 | grep "WebhookWorkerService"
  # Deve mostrar logs do worker processando
  ```

- [ ] **Worker processa mensagens**
  ```bash
  # 1. Enviar webhook de teste
  curl -X POST http://localhost:4000/meli/webhooks \
    -H "Content-Type: application/json" \
    -d '{
      "_id": "test-123",
      "resource": "/orders/123",
      "topic": "orders_v2",
      "user_id": "123",
      "application_id": "123",
      "attempts": 1,
      "sent": "2025-01-01T00:00:00Z",
      "received": "2025-01-01T00:00:00Z"
    }'
  
  # 2. Aguardar 30 segundos
  sleep 30
  
  # 3. Verificar logs
  docker logs painelml-backend 2>&1 | grep "test-123"
  # Deve mostrar que o webhook foi processado
  ```

---

## 🔌 Endpoints API

### Accounts

- [ ] **GET /accounts**
  ```bash
  curl http://localhost:4000/accounts | jq
  # Deve retornar array (vazio ou com contas)
  ```

### Items

- [ ] **GET /items (sem conta)**
  ```bash
  curl "http://localhost:4000/items" | jq
  # Deve retornar array vazio ou erro
  ```

- [ ] **GET /items/stats**
  ```bash
  curl "http://localhost:4000/items/stats" | jq
  # Deve retornar objeto com estatísticas
  ```

### Orders

- [ ] **GET /orders**
  ```bash
  curl "http://localhost:4000/orders" | jq
  # Deve retornar objeto com items
  ```

- [ ] **GET /orders/stats**
  ```bash
  curl "http://localhost:4000/orders/stats" | jq
  # Deve retornar objeto com estatísticas
  ```

### Shipments

- [ ] **GET /shipments**
  ```bash
  curl "http://localhost:4000/shipments?accountId=test" | jq
  # Deve retornar array
  ```

- [ ] **GET /shipments/stats**
  ```bash
  curl "http://localhost:4000/shipments/stats" | jq
  # Deve retornar objeto com estatísticas
  ```

### Questions

- [ ] **GET /questions**
  ```bash
  curl "http://localhost:4000/questions?accountId=test" | jq
  # Deve retornar array
  ```

- [ ] **GET /questions/stats**
  ```bash
  curl "http://localhost:4000/questions/stats" | jq
  # Deve retornar objeto com estatísticas (incluindo overdueSLA)
  ```

### Webhooks

- [ ] **POST /meli/webhooks**
  ```bash
  curl -X POST http://localhost:4000/meli/webhooks \
    -H "Content-Type: application/json" \
    -d '{
      "_id": "test-456",
      "resource": "/items/MLB123",
      "topic": "items",
      "user_id": "123",
      "application_id": "123",
      "attempts": 1,
      "sent": "2025-01-01T00:00:00Z",
      "received": "2025-01-01T00:00:00Z"
    }' | jq
  # Deve retornar: {"status": "ok"}
  ```

- [ ] **GET /meli/webhooks/stats**
  ```bash
  curl "http://localhost:4000/meli/webhooks/stats" | jq
  # Deve retornar estatísticas
  ```

- [ ] **GET /meli/webhooks/pending**
  ```bash
  curl "http://localhost:4000/meli/webhooks/pending" | jq
  # Deve retornar array de webhooks pendentes
  ```

### Sync

- [ ] **POST /sync/start**
  ```bash
  # Requer conta conectada
  curl -X POST "http://localhost:4000/sync/start?accountId=<ID>&scope=items&days=30" | jq
  # Deve retornar: {"message": "Sync started"}
  ```

- [ ] **GET /sync/status**
  ```bash
  curl "http://localhost:4000/sync/status?accountId=<ID>" | jq
  # Deve retornar status da sincronização
  ```

---

## 🔄 Fluxos Completos

### Fluxo 1: OAuth + Ingestão

- [ ] **1. Conectar conta**
  ```bash
  # Abrir no navegador
  open http://localhost:4000/meli/oauth/start
  # Autorizar no ML
  ```

- [ ] **2. Verificar conta salva**
  ```bash
  curl http://localhost:4000/accounts | jq
  # Deve listar a conta conectada
  ```

- [ ] **3. Iniciar sincronização**
  ```bash
  ACCOUNT_ID="<pegar_do_passo_2>"
  curl -X POST "http://localhost:4000/sync/start?accountId=${ACCOUNT_ID}&scope=all&days=30" | jq
  ```

- [ ] **4. Verificar progresso**
  ```bash
  curl "http://localhost:4000/sync/status?accountId=${ACCOUNT_ID}" | jq
  # Deve mostrar running: true e contadores aumentando
  ```

- [ ] **5. Aguardar conclusão**
  ```bash
  # Aguardar alguns minutos
  curl "http://localhost:4000/sync/status?accountId=${ACCOUNT_ID}" | jq
  # Deve mostrar running: false e finishedAt preenchido
  ```

- [ ] **6. Verificar dados no banco**
  ```bash
  npm run prisma:studio
  # Verificar se há registros em:
  # - Item
  # - Order
  # - Shipment
  # - Question
  ```

### Fluxo 2: Webhook → Worker → Sync

- [ ] **1. Enviar webhook**
  ```bash
  curl -X POST http://localhost:4000/meli/webhooks \
    -H "Content-Type: application/json" \
    -d '{
      "_id": "test-webhook-789",
      "resource": "/orders/2000001234567890",
      "topic": "orders_v2",
      "user_id": "<SEU_SELLER_ID>",
      "application_id": "123",
      "attempts": 1,
      "sent": "2025-01-20T12:00:00Z",
      "received": "2025-01-20T12:00:00Z"
    }' | jq
  ```

- [ ] **2. Verificar webhook salvo no banco**
  ```bash
  # Prisma Studio → WebhookEvent
  # Deve ter registro com eventId: test-webhook-789
  # processed: false
  ```

- [ ] **3. Verificar mensagem na fila**
  ```bash
  aws --endpoint-url=http://localhost:4566 \
      --region us-east-1 \
      sqs get-queue-attributes \
      --queue-url http://localhost:4566/000000000000/painelml-webhooks \
      --attribute-names ApproximateNumberOfMessages | jq
  # ApproximateNumberOfMessages deve ser > 0
  ```

- [ ] **4. Aguardar worker processar (30s)**
  ```bash
  sleep 30
  ```

- [ ] **5. Verificar logs do worker**
  ```bash
  docker logs painelml-backend 2>&1 | grep "test-webhook-789"
  # Deve mostrar: Processing message: webhook - test-webhook-789
  ```

- [ ] **6. Verificar webhook marcado como processado**
  ```bash
  # Prisma Studio → WebhookEvent
  # processed: true
  # processedAt: <timestamp>
  ```

### Fluxo 3: Fallback de Webhooks Pendentes

- [ ] **1. Criar webhook pendente manualmente**
  ```bash
  # Prisma Studio → WebhookEvent → Add Record
  # eventId: test-fallback-123
  # topic: items
  # resource: /items/MLB123
  # userId: <SEU_SELLER_ID>
  # processed: false
  # attempts: 0
  ```

- [ ] **2. Aguardar cron job (5 minutos)**
  ```bash
  # Ou reiniciar backend para forçar execução
  ```

- [ ] **3. Verificar logs**
  ```bash
  docker logs painelml-backend 2>&1 | grep "Processing pending webhooks"
  # Deve mostrar: Found X pending webhooks
  ```

- [ ] **4. Verificar webhook processado**
  ```bash
  # Prisma Studio → WebhookEvent
  # test-fallback-123 deve estar processed: true
  ```

---

## 🧪 Testes de Integração

### Shipments

- [ ] **Backfill funciona**
  ```bash
  curl -X POST "http://localhost:4000/shipments/backfill?accountId=<ID>" | jq
  # Deve retornar: {"syncedCount": X, "errorCount": Y}
  ```

- [ ] **Sync individual funciona**
  ```bash
  curl -X POST "http://localhost:4000/shipments/sync/43123456789?accountId=<ID>" | jq
  # Deve retornar dados do shipment
  ```

### Questions

- [ ] **Backfill funciona**
  ```bash
  curl -X POST "http://localhost:4000/questions/backfill?accountId=<ID>" | jq
  # Deve retornar: {"syncedCount": X, "errorCount": Y}
  ```

- [ ] **Responder pergunta funciona**
  ```bash
  curl -X POST "http://localhost:4000/questions/<QUESTION_ID>/answer?accountId=<ID>" \
    -H "Content-Type: application/json" \
    -d '{"answer": "Teste de resposta"}' | jq
  # Deve retornar pergunta com status: ANSWERED
  ```

- [ ] **SLA é calculado corretamente**
  ```bash
  curl "http://localhost:4000/questions/stats?accountId=<ID>" | jq '.overdueSLA'
  # Deve retornar número de perguntas > 24h sem resposta
  ```

---

## 📊 Validação de Dados

### Integridade

- [ ] **Todos os shipments têm orderId**
  ```sql
  SELECT COUNT(*) FROM "Shipment" WHERE "orderId" IS NULL;
  -- Deve retornar 0 ou número baixo
  ```

- [ ] **Todas as questions têm itemId**
  ```sql
  SELECT COUNT(*) FROM "Question" WHERE "itemId" IS NULL;
  -- Pode ter alguns NULL (perguntas gerais)
  ```

- [ ] **Todos os webhooks têm eventId único**
  ```sql
  SELECT "eventId", COUNT(*) 
  FROM "WebhookEvent" 
  GROUP BY "eventId" 
  HAVING COUNT(*) > 1;
  -- Deve retornar 0 linhas (sem duplicatas)
  ```

### Consistência

- [ ] **Timestamps estão corretos**
  ```sql
  SELECT * FROM "Order" WHERE "dateCreated" > NOW();
  -- Deve retornar 0 linhas (sem datas futuras)
  ```

- [ ] **Status são válidos**
  ```sql
  SELECT DISTINCT status FROM "Shipment";
  -- Deve retornar apenas: pending, ready_to_ship, shipped, delivered, etc.
  ```

---

## 🔒 Segurança

- [ ] **Tokens estão criptografados**
  ```sql
  SELECT "accessToken" FROM "AccountToken" LIMIT 1;
  -- Deve retornar string criptografada (não legível)
  ```

- [ ] **ENCRYPTION_KEY está configurada**
  ```bash
  grep ENCRYPTION_KEY backend/.env.local
  # Deve retornar chave configurada (não dev-key-change-in-prod)
  ```

- [ ] **Dedupe funciona**
  ```bash
  # Enviar mesmo webhook 2 vezes
  curl -X POST http://localhost:4000/meli/webhooks \
    -H "Content-Type: application/json" \
    -d '{"_id": "dup-test", "resource": "/orders/123", "topic": "orders_v2", "user_id": "123", "application_id": "123", "attempts": 1, "sent": "2025-01-01T00:00:00Z", "received": "2025-01-01T00:00:00Z"}'
  
  curl -X POST http://localhost:4000/meli/webhooks \
    -H "Content-Type: application/json" \
    -d '{"_id": "dup-test", "resource": "/orders/123", "topic": "orders_v2", "user_id": "123", "application_id": "123", "attempts": 1, "sent": "2025-01-01T00:00:00Z", "received": "2025-01-01T00:00:00Z"}'
  
  # Verificar no banco: deve ter apenas 1 registro com eventId: dup-test
  ```

---

## 📝 Documentação

- [ ] **SEMANA2_IMPLEMENTADO.md existe**
- [ ] **README_SEMANA2.md existe**
- [ ] **SUMARIO_SEMANA2.md existe**
- [ ] **EXEMPLOS_API.md existe**
- [ ] **COMANDOS_SEMANA2.sh existe**
- [ ] **CHECKLIST_VALIDACAO.md existe (este arquivo)**

---

## ✅ Resultado Final

**Total de itens:** 70+

**Mínimo para aprovar:** 90% (63 itens)

### Contagem

- Infraestrutura: __ / 4
- Banco de Dados: __ / 3
- Backend: __ / 3
- SQS + Workers: __ / 5
- Endpoints API: __ / 13
- Fluxos Completos: __ / 18
- Testes de Integração: __ / 5
- Validação de Dados: __ / 5
- Segurança: __ / 3
- Documentação: __ / 6

**TOTAL: __ / 65**

---

## 🎯 Próximos Passos

Se todos os itens estão ✅:
- **Semana 2 está completa!**
- **Pronto para iniciar Semana 3**

Se algum item falhou:
1. Verificar logs de erro
2. Consultar documentação
3. Revisar código
4. Executar novamente

---

**Boa validação! 🚀**
