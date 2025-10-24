# 🚀 Como Rodar Sem LocalStack (Modo Simplificado)

Guia rápido para testar o sistema sem o LocalStack que está dando problemas.

---

## ⚡ Solução Rápida (3 passos)

### 1. Parar LocalStack

```bash
docker compose down
```

### 2. Iniciar Apenas Postgres

```bash
docker compose -f docker-compose.simple.yml up -d
```

### 3. Usar SQS Mock no Backend

```bash
cd backend/src/queue

# Fazer backup do original
mv sqs.service.ts sqs.service.real.ts

# Usar versão mock
mv sqs.service.mock.ts sqs.service.ts

# Voltar para raiz do backend
cd ../..

# Iniciar backend
npm run start:dev
```

---

## ✅ O Que Muda?

### Antes (com LocalStack)
```
Webhook → Banco → LocalStack SQS → Worker → Processa
```

### Agora (sem LocalStack)
```
Webhook → Banco → Fila em Memória → Worker → Processa
```

**Funciona igual, mas:**
- ✅ Mais estável
- ✅ Mais rápido
- ✅ Sem dependência do LocalStack
- ⚠️  Fila é perdida se reiniciar o backend (ok para dev)

---

## 🧪 Testar

### 1. Verificar Backend

```bash
curl http://localhost:4000
# Deve retornar: {"message":"Painel ML API is running"}
```

### 2. Verificar Logs

No terminal do backend, você deve ver:
```
⚠️  SQS MOCK MODE - Usando fila em memória
⚠️  LocalStack não é necessário neste modo
```

### 3. Testar Webhook

```bash
curl -X POST http://localhost:4000/meli/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "_id": "test-123",
    "resource": "/items/MLB123",
    "topic": "items",
    "user_id": "123",
    "application_id": "123",
    "attempts": 1,
    "sent": "2025-01-01T00:00:00Z",
    "received": "2025-01-01T00:00:00Z"
  }'
```

Deve ver nos logs:
```
📨 Mensagem adicionada à fila em memória: test-123
```

---

## 🔄 Voltar para LocalStack (Quando Corrigir)

```bash
cd backend/src/queue

# Restaurar original
mv sqs.service.ts sqs.service.mock.ts
mv sqs.service.real.ts sqs.service.ts

# Reiniciar backend
```

---

## 📊 Status dos Serviços

### Com LocalStack (Original)
- ✅ Postgres (porta 5432)
- ⚠️  LocalStack (porta 4566) - Instável
- ✅ Backend (porta 4000)
- ✅ Frontend (porta 3000)

### Sem LocalStack (Simplificado)
- ✅ Postgres (porta 5432)
- ❌ LocalStack - Não necessário
- ✅ Backend (porta 4000) - Com fila em memória
- ✅ Frontend (porta 3000)

---

## 🎯 Recomendação

**Para testar a UI agora:**
- Use o modo simplificado (sem LocalStack)
- Tudo funciona igual
- Mais estável

**Para produção:**
- Corrigir LocalStack ou
- Usar AWS SQS real ou
- Usar Redis/RabbitMQ

---

## 🐛 Se Ainda Tiver Problemas

### Erro: "Cannot find module sqs.service"

```bash
# Verificar se o arquivo existe
ls backend/src/queue/sqs.service.ts

# Se não existir, copiar o mock
cp backend/src/queue/sqs.service.mock.ts backend/src/queue/sqs.service.ts
```

### Backend não inicia

```bash
# Limpar e reinstalar
cd backend
rm -rf node_modules package-lock.json
npm install
npm run start:dev
```

### Postgres não conecta

```bash
# Verificar se está rodando
docker ps | grep postgres

# Se não estiver, iniciar
docker compose -f docker-compose.simple.yml up -d postgres

# Testar conexão
docker exec painelml-postgres pg_isready -U painelml
```

---

## ✅ Checklist

- [ ] LocalStack parado
- [ ] Postgres rodando (docker-compose.simple.yml)
- [ ] sqs.service.mock.ts renomeado para sqs.service.ts
- [ ] Backend iniciado sem erros
- [ ] Logs mostram "SQS MOCK MODE"
- [ ] Frontend rodando
- [ ] Consegue conectar conta ML
- [ ] Produtos carregam

---

**Pronto! Agora você pode testar a UI sem problemas com o LocalStack! 🎉**
