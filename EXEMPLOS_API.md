# 🔌 Exemplos de Uso da API - Semana 2

Guia prático com exemplos reais de uso da API do Painel ML.

---

## 🚀 Setup Inicial

### 1. Conectar Conta do Mercado Livre

```bash
# Abrir no navegador
open http://localhost:4000/meli/oauth/start

# Você será redirecionado para o ML, autorize a aplicação
# Após autorizar, será redirecionado de volta
```

### 2. Listar Contas Conectadas

```bash
curl http://localhost:4000/accounts | jq
```

**Resposta:**
```json
[
  {
    "id": "clx123abc",
    "sellerId": "123456789",
    "nickname": "MINHA_LOJA",
    "siteId": "MLB",
    "createdAt": "2025-01-20T10:00:00.000Z",
    "updatedAt": "2025-01-20T10:00:00.000Z"
  }
]
```

**💡 Dica:** Salve o `id` da conta, você vai usar em todas as requisições!

---

## 📥 Ingestão Inicial

### Sincronizar Tudo

```bash
# Substitua <ACCOUNT_ID> pelo ID da sua conta
ACCOUNT_ID="clx123abc"

curl -X POST "http://localhost:4000/sync/start?accountId=${ACCOUNT_ID}&scope=all&days=30" | jq
```

**Resposta:**
```json
{
  "message": "Sync started",
  "accountId": "clx123abc",
  "scope": "all",
  "days": 30
}
```

### Verificar Progresso

```bash
curl "http://localhost:4000/sync/status?accountId=${ACCOUNT_ID}" | jq
```

**Resposta (em andamento):**
```json
{
  "running": true,
  "startedAt": 1706011200000,
  "itemsProcessed": 45,
  "ordersProcessed": 12,
  "shipmentsProcessed": 10,
  "questionsProcessed": 23,
  "errors": []
}
```

**Resposta (concluído):**
```json
{
  "running": false,
  "startedAt": 1706011200000,
  "finishedAt": 1706011500000,
  "itemsProcessed": 150,
  "ordersProcessed": 45,
  "shipmentsProcessed": 40,
  "questionsProcessed": 120,
  "errors": []
}
```

### Sincronizar Apenas Items

```bash
curl -X POST "http://localhost:4000/sync/start?accountId=${ACCOUNT_ID}&scope=items&days=30" | jq
```

### Sincronizar Apenas Questions

```bash
curl -X POST "http://localhost:4000/sync/start?accountId=${ACCOUNT_ID}&scope=questions&days=30" | jq
```

---

## 📦 Items (Produtos)

### Listar Todos os Items

```bash
curl "http://localhost:4000/items?accountId=${ACCOUNT_ID}" | jq
```

**Resposta:**
```json
{
  "items": [
    {
      "id": "clx456def",
      "meliItemId": "MLB123456789",
      "title": "Notebook Dell Inspiron 15",
      "status": "active",
      "price": 2999.90,
      "available": 5,
      "thumbnail": "http://http2.mlstatic.com/D_123456-MLA.jpg",
      "updatedAt": "2025-01-20T10:30:00.000Z",
      "createdAt": "2025-01-20T10:00:00.000Z"
    },
    {
      "id": "clx789ghi",
      "meliItemId": "MLB987654321",
      "title": "Mouse Logitech MX Master 3",
      "status": "paused",
      "price": 499.90,
      "available": 0,
      "thumbnail": "http://http2.mlstatic.com/D_654321-MLA.jpg",
      "updatedAt": "2025-01-20T11:00:00.000Z",
      "createdAt": "2025-01-20T10:00:00.000Z"
    }
  ]
}
```

### Ver Estatísticas de Items

```bash
curl "http://localhost:4000/items/stats?accountId=${ACCOUNT_ID}" | jq
```

**Resposta:**
```json
{
  "total": 150,
  "active": 120,
  "paused": 20,
  "closed": 10
}
```

---

## 🛒 Orders (Pedidos)

### Listar Pedidos dos Últimos 30 Dias

```bash
curl "http://localhost:4000/orders?accountId=${ACCOUNT_ID}&days=30" | jq
```

**Resposta:**
```json
{
  "items": [
    {
      "id": "clx111aaa",
      "meliOrderId": "2000001234567890",
      "status": "paid",
      "totalAmount": 3499.80,
      "dateCreated": "2025-01-19T14:30:00.000Z",
      "buyerId": "987654321",
      "updatedAt": "2025-01-19T14:35:00.000Z",
      "createdAt": "2025-01-19T14:30:00.000Z"
    },
    {
      "id": "clx222bbb",
      "meliOrderId": "2000001234567891",
      "status": "confirmed",
      "totalAmount": 999.90,
      "dateCreated": "2025-01-18T10:15:00.000Z",
      "buyerId": "123456789",
      "updatedAt": "2025-01-18T10:20:00.000Z",
      "createdAt": "2025-01-18T10:15:00.000Z"
    }
  ]
}
```

### Ver Estatísticas de Pedidos

```bash
curl "http://localhost:4000/orders/stats?accountId=${ACCOUNT_ID}&days=30" | jq
```

**Resposta:**
```json
{
  "total": 45,
  "paid": 30,
  "confirmed": 10,
  "cancelled": 3,
  "pending": 2,
  "totalAmount": 67498.50
}
```

---

## 📮 Shipments (Envios)

### Listar Todos os Envios

```bash
curl "http://localhost:4000/shipments?accountId=${ACCOUNT_ID}" | jq
```

**Resposta:**
```json
[
  {
    "id": "clx333ccc",
    "meliShipmentId": "43123456789",
    "orderId": "2000001234567890",
    "mode": "me2",
    "status": "shipped",
    "substatus": "in_transit",
    "trackingNumber": "BR123456789BR",
    "trackingMethod": "correios",
    "estimatedDelivery": "2025-01-25T23:59:59.000Z",
    "shippedDate": "2025-01-20T08:00:00.000Z",
    "deliveredDate": null,
    "cost": 25.50,
    "updatedAt": "2025-01-20T12:00:00.000Z",
    "createdAt": "2025-01-19T14:30:00.000Z"
  },
  {
    "id": "clx444ddd",
    "meliShipmentId": "43987654321",
    "orderId": "2000001234567891",
    "mode": "me2",
    "status": "delivered",
    "substatus": null,
    "trackingNumber": "BR987654321BR",
    "trackingMethod": "correios",
    "estimatedDelivery": "2025-01-22T23:59:59.000Z",
    "shippedDate": "2025-01-18T09:00:00.000Z",
    "deliveredDate": "2025-01-21T14:30:00.000Z",
    "cost": 28.90,
    "updatedAt": "2025-01-21T14:30:00.000Z",
    "createdAt": "2025-01-18T10:15:00.000Z"
  }
]
```

### Ver Estatísticas de Envios

```bash
curl "http://localhost:4000/shipments/stats?accountId=${ACCOUNT_ID}" | jq
```

**Resposta:**
```json
{
  "total": 40,
  "pending": 5,
  "shipped": 25,
  "delivered": 10
}
```

### Fazer Backfill de Envios

```bash
curl -X POST "http://localhost:4000/shipments/backfill?accountId=${ACCOUNT_ID}" | jq
```

**Resposta:**
```json
{
  "syncedCount": 35,
  "errorCount": 0
}
```

### Sincronizar um Envio Específico

```bash
SHIPMENT_ID="43123456789"

curl -X POST "http://localhost:4000/shipments/sync/${SHIPMENT_ID}?accountId=${ACCOUNT_ID}" | jq
```

**Resposta:**
```json
{
  "id": "clx333ccc",
  "meliShipmentId": "43123456789",
  "status": "shipped",
  "trackingNumber": "BR123456789BR"
}
```

---

## ❓ Questions (Perguntas)

### Listar Todas as Perguntas

```bash
curl "http://localhost:4000/questions?accountId=${ACCOUNT_ID}" | jq
```

**Resposta:**
```json
[
  {
    "id": "clx555eee",
    "meliQuestionId": "12345678901",
    "itemId": "MLB123456789",
    "text": "Tem nota fiscal?",
    "status": "ANSWERED",
    "answer": "Sim, emitimos nota fiscal para todos os pedidos.",
    "dateCreated": "2025-01-19T16:00:00.000Z",
    "dateAnswered": "2025-01-19T16:15:00.000Z",
    "fromId": "987654321",
    "updatedAt": "2025-01-19T16:15:00.000Z",
    "createdAt": "2025-01-19T16:00:00.000Z"
  },
  {
    "id": "clx666fff",
    "meliQuestionId": "12345678902",
    "itemId": "MLB987654321",
    "text": "Qual o prazo de entrega para São Paulo?",
    "status": "UNANSWERED",
    "answer": null,
    "dateCreated": "2025-01-20T10:00:00.000Z",
    "dateAnswered": null,
    "fromId": "123456789",
    "updatedAt": "2025-01-20T10:00:00.000Z",
    "createdAt": "2025-01-20T10:00:00.000Z"
  }
]
```

### Listar Apenas Perguntas Não Respondidas

```bash
curl "http://localhost:4000/questions?accountId=${ACCOUNT_ID}&status=UNANSWERED" | jq
```

### Ver Estatísticas com SLA

```bash
curl "http://localhost:4000/questions/stats?accountId=${ACCOUNT_ID}" | jq
```

**Resposta:**
```json
{
  "total": 120,
  "unanswered": 15,
  "answered": 105,
  "overdueSLA": 3
}
```

**💡 Nota:** `overdueSLA` mostra perguntas não respondidas há mais de 24 horas.

### Responder uma Pergunta

```bash
QUESTION_ID="12345678902"

curl -X POST "http://localhost:4000/questions/${QUESTION_ID}/answer?accountId=${ACCOUNT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "answer": "Para São Paulo capital, o prazo é de 2-3 dias úteis."
  }' | jq
```

**Resposta:**
```json
{
  "id": "clx666fff",
  "meliQuestionId": "12345678902",
  "status": "ANSWERED",
  "answer": "Para São Paulo capital, o prazo é de 2-3 dias úteis.",
  "dateAnswered": "2025-01-20T12:30:00.000Z"
}
```

### Fazer Backfill de Perguntas

```bash
curl -X POST "http://localhost:4000/questions/backfill?accountId=${ACCOUNT_ID}" | jq
```

**Resposta:**
```json
{
  "syncedCount": 115,
  "errorCount": 0
}
```

---

## 🔔 Webhooks

### Ver Estatísticas de Webhooks

```bash
curl "http://localhost:4000/meli/webhooks/stats" | jq
```

**Resposta:**
```json
{
  "total": 234,
  "processed": 220,
  "pending": 14,
  "byTopic": [
    { "topic": "orders", "count": 120 },
    { "topic": "items", "count": 80 },
    { "topic": "questions", "count": 25 },
    { "topic": "shipments", "count": 9 }
  ]
}
```

### Ver Webhooks Pendentes

```bash
curl "http://localhost:4000/meli/webhooks/pending" | jq
```

**Resposta:**
```json
[
  {
    "id": "clx777ggg",
    "eventId": "event-123456",
    "topic": "orders",
    "resource": "/orders/2000001234567892",
    "userId": "123456789",
    "attempts": 1,
    "processed": false,
    "receivedAt": "2025-01-20T12:00:00.000Z"
  }
]
```

### Simular um Webhook (Teste)

```bash
curl -X POST http://localhost:4000/meli/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "_id": "test-event-123",
    "resource": "/orders/2000001234567890",
    "topic": "orders_v2",
    "user_id": "123456789",
    "application_id": "123",
    "attempts": 1,
    "sent": "2025-01-20T12:00:00Z",
    "received": "2025-01-20T12:00:00Z"
  }' | jq
```

**Resposta:**
```json
{
  "status": "ok",
  "topic": "orders_v2",
  "resource": "/orders/2000001234567890",
  "correlation_id": "abc-123-def"
}
```

---

## 🔍 Casos de Uso Práticos

### 1. Dashboard de Vendas

```bash
#!/bin/bash

ACCOUNT_ID="clx123abc"

echo "📊 Dashboard de Vendas"
echo "====================="

# Estatísticas de pedidos
echo -e "\n📦 Pedidos (últimos 30 dias):"
curl -s "http://localhost:4000/orders/stats?accountId=${ACCOUNT_ID}&days=30" | jq '{
  total: .total,
  faturamento: .totalAmount,
  taxa_conversao: ((.paid / .total * 100) | round)
}'

# Estatísticas de items
echo -e "\n🏷️  Produtos:"
curl -s "http://localhost:4000/items/stats?accountId=${ACCOUNT_ID}" | jq

# Estatísticas de envios
echo -e "\n📮 Envios:"
curl -s "http://localhost:4000/shipments/stats?accountId=${ACCOUNT_ID}" | jq
```

### 2. Monitorar SLA de Perguntas

```bash
#!/bin/bash

ACCOUNT_ID="clx123abc"

echo "⏰ Monitoramento de SLA"
echo "====================="

# Buscar estatísticas
STATS=$(curl -s "http://localhost:4000/questions/stats?accountId=${ACCOUNT_ID}")

OVERDUE=$(echo $STATS | jq -r '.overdueSLA')
UNANSWERED=$(echo $STATS | jq -r '.unanswered')

echo "Perguntas não respondidas: $UNANSWERED"
echo "Perguntas fora do SLA (>24h): $OVERDUE"

if [ "$OVERDUE" -gt 0 ]; then
  echo "⚠️  ALERTA: Existem perguntas fora do SLA!"
  
  # Listar perguntas não respondidas
  curl -s "http://localhost:4000/questions?accountId=${ACCOUNT_ID}&status=UNANSWERED" | \
    jq -r '.[] | "- [\(.meliQuestionId)] \(.text)"'
fi
```

### 3. Verificar Rupturas de Estoque

```bash
#!/bin/bash

ACCOUNT_ID="clx123abc"

echo "📉 Rupturas de Estoque"
echo "====================="

# Buscar items com estoque zero
curl -s "http://localhost:4000/items?accountId=${ACCOUNT_ID}" | \
  jq -r '.items[] | select(.available == 0) | "⚠️  \(.title) - Estoque: \(.available)"'
```

### 4. Rastrear Envios Atrasados

```bash
#!/bin/bash

ACCOUNT_ID="clx123abc"

echo "🚚 Envios Atrasados"
echo "==================="

# Data atual
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Buscar envios com entrega estimada vencida
curl -s "http://localhost:4000/shipments?accountId=${ACCOUNT_ID}" | \
  jq --arg now "$NOW" -r '
    .[] | 
    select(.status != "delivered" and .estimatedDelivery < $now) | 
    "⚠️  Pedido \(.orderId) - Tracking: \(.trackingNumber) - Estimado: \(.estimatedDelivery)"
  '
```

---

## 🔧 Troubleshooting

### Verificar se o Backend está Rodando

```bash
curl http://localhost:4000/
```

**Resposta esperada:**
```json
{
  "message": "Painel ML API is running"
}
```

### Verificar Fila SQS

```bash
aws --endpoint-url=http://localhost:4566 \
    --region us-east-1 \
    sqs get-queue-attributes \
    --queue-url http://localhost:4566/000000000000/painelml-webhooks \
    --attribute-names ApproximateNumberOfMessages | jq
```

### Ver Logs do Worker

```bash
docker logs -f painelml-backend 2>&1 | grep WebhookWorker
```

---

## 📚 Recursos Adicionais

- **Documentação Completa:** `SEMANA2_IMPLEMENTADO.md`
- **Comandos Úteis:** `COMANDOS_SEMANA2.sh`
- **Sumário Executivo:** `SUMARIO_SEMANA2.md`
- **API do ML:** https://developers.mercadolibre.com.br/

---

**💡 Dica Final:** Use `jq` para formatar as respostas JSON e facilitar a leitura!

```bash
# Instalar jq (se não tiver)
brew install jq  # macOS
apt install jq   # Ubuntu/Debian
```
