# 🔧 Alternativa: Rodar Sem LocalStack

Se o LocalStack está dando problemas, você pode desabilitar temporariamente o sistema de filas e processar webhooks de forma síncrona.

---

## 📝 Opção 1: Desabilitar LocalStack (Recomendado para Testes)

### 1. Parar LocalStack

```bash
docker compose stop localstack
```

### 2. Modificar Backend para Modo Síncrono

Edite `backend/src/queue/sqs.service.ts`:

```typescript
async onModuleInit() {
  // Comentar a criação da fila
  // await this.ensureQueueExists();
  console.log('⚠️  SQS desabilitado - modo síncrono');
}

async sendMessage(message: WebhookMessage): Promise<void> {
  // Processar diretamente ao invés de enfileirar
  console.log('⚠️  Processando webhook diretamente (sem fila)');
  // Aqui você pode chamar o processamento diretamente
  return Promise.resolve();
}
```

### 3. Desabilitar Workers

Edite `backend/src/workers/webhook-worker.service.ts`:

```typescript
@Cron('*/30 * * * * *')
async processQueue() {
  // Comentar o processamento
  // console.log('⚠️  Worker desabilitado');
  return;
}
```

---

## 📝 Opção 2: Usar Docker Compose Simplificado

### 1. Criar docker-compose.dev.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: painelml-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: painelml
      POSTGRES_PASSWORD: dev_password_123
      POSTGRES_DB: painelml
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U painelml"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### 2. Usar Apenas Postgres

```bash
docker compose -f docker-compose.dev.yml up -d
```

---

## 📝 Opção 3: Processar Webhooks Diretamente (Mais Simples)

### Modificar WebhooksService

Edite `backend/src/meli/webhooks.service.ts`:

```typescript
async handleWebhook(webhook: any) {
  // Salvar no banco
  const savedWebhook = await this.saveWebhook(webhook);
  
  // OPÇÃO A: Enfileirar (com LocalStack)
  // await this.sqsService.sendMessage({...});
  
  // OPÇÃO B: Processar diretamente (sem LocalStack)
  await this.processWebhookDirectly(savedWebhook);
  
  return { status: 'ok' };
}

private async processWebhookDirectly(webhook: any) {
  try {
    // Processar baseado no tópico
    switch (webhook.topic) {
      case 'items':
        await this.itemsService.syncItem(webhook.resource);
        break;
      case 'orders_v2':
        await this.ordersService.syncOrder(webhook.resource);
        break;
      // ... outros casos
    }
    
    // Marcar como processado
    await this.markAsProcessed(webhook.id);
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
  }
}
```

---

## 🎯 Qual Opção Escolher?

### Para Testar a UI (Recomendado)

**Opção 2 + Opção 3**
- Rode apenas Postgres
- Processe webhooks diretamente
- Mais simples e estável

```bash
# 1. Parar tudo
docker compose down

# 2. Criar docker-compose.dev.yml (sem LocalStack)

# 3. Iniciar apenas Postgres
docker compose -f docker-compose.dev.yml up -d

# 4. Modificar código para processar diretamente

# 5. Iniciar backend
cd backend && npm run start:dev
```

### Para Produção

**Manter LocalStack ou usar AWS SQS real**
- Sistema assíncrono é melhor
- Mas precisa funcionar corretamente

---

## 🔍 Diagnosticar Problema do LocalStack

Se quiser tentar corrigir o LocalStack:

### 1. Ver Logs

```bash
docker logs painelml-localstack --tail 100
```

### 2. Verificar Recursos

```bash
# Memória e CPU
docker stats painelml-localstack

# Se estiver usando muita memória, pode ser o problema
```

### 3. Limpar e Recriar

```bash
# Parar e remover
docker compose down -v

# Recriar
docker compose up -d

# Aguardar 60 segundos
sleep 60

# Verificar
curl http://localhost:4566/_localstack/health
```

### 4. Versão Específica

Tente usar uma versão mais antiga e estável:

```yaml
localstack:
  image: localstack/localstack:2.3.2  # Versão estável
```

---

## ✅ Recomendação para Agora

**Para continuar testando a UI:**

1. **Pare o LocalStack:**
   ```bash
   docker compose stop localstack
   ```

2. **Comente o código do SQS no backend:**
   - Em `sqs.service.ts` → comentar `ensureQueueExists()`
   - Em `webhook-worker.service.ts` → comentar `processQueue()`

3. **Inicie o backend:**
   ```bash
   cd backend && npm run start:dev
   ```

4. **Teste a UI normalmente**

**Depois, quando precisar do sistema de filas:**
- Investigar logs do LocalStack
- Ou usar AWS SQS real
- Ou usar alternativa (Redis, RabbitMQ)

---

## 🚀 Alternativas ao LocalStack

Se o problema persistir, considere:

### 1. **Redis + Bull Queue**
```bash
npm install @nestjs/bull bull
```
Mais leve e estável que LocalStack

### 2. **RabbitMQ**
```yaml
rabbitmq:
  image: rabbitmq:3-management
  ports:
    - "5672:5672"
    - "15672:15672"
```

### 3. **Processar Diretamente**
Para desenvolvimento, processar webhooks de forma síncrona é aceitável

---

**Qual opção você prefere tentar primeiro?**
