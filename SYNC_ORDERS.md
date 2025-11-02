# 📦 Sincronização de Pedidos (Orders)

## ✅ Endpoint Implementado

Foi criado um endpoint para sincronizar todos os pedidos do Mercado Livre para o banco de dados local.

---

## 🔗 Endpoint

```
POST /orders/sync?accountId={accountId}&limit={limit}&offset={offset}
```

### Parâmetros:

- **accountId** (obrigatório) - ID da conta no sistema
- **limit** (opcional) - Quantidade de pedidos por requisição (padrão: 50, máximo: 50)
- **offset** (opcional) - Offset para paginação (padrão: 0)

---

## 🚀 Como Usar

### 1. Sincronizar Todos os Pedidos

Para sincronizar todos os pedidos, você precisa fazer múltiplas requisições devido ao limite da API do ML (máximo 50 por vez):

```bash
# Primeira página (0-50)
curl -X POST "http://localhost:4000/orders/sync?accountId=cmhi1ysxp0000ytyyu7pf6t1g&limit=50&offset=0"

# Segunda página (50-100)
curl -X POST "http://localhost:4000/orders/sync?accountId=cmhi1ysxp0000ytyyu7pf6t1g&limit=50&offset=50"

# Terceira página (100-150)
curl -X POST "http://localhost:4000/orders/sync?accountId=cmhi1ysxp0000ytyyu7pf6t1g&limit=50&offset=100"

# Continue até hasMore = false
```

### 2. Resposta do Endpoint

```json
{
  "success": true,
  "message": "Synced 50 of 105 orders",
  "synced": 50,
  "errors": 0,
  "total": 105,
  "hasMore": true,
  "nextOffset": 50
}
```

**Campos:**
- `synced` - Quantidade de pedidos sincronizados nesta requisição
- `errors` - Quantidade de erros
- `total` - Total de pedidos disponíveis no ML
- `hasMore` - Se há mais pedidos para sincronizar
- `nextOffset` - Próximo offset a usar

---

## 🔄 Script de Sincronização Completa

Crie um script para sincronizar todos os pedidos automaticamente:

```bash
#!/bin/bash

ACCOUNT_ID="cmhi1ysxp0000ytyyu7pf6t1g"
LIMIT=50
OFFSET=0
HAS_MORE=true

echo "🔄 Iniciando sincronização de pedidos..."

while [ "$HAS_MORE" = "true" ]; do
  echo "📦 Sincronizando pedidos (offset: $OFFSET)..."
  
  RESPONSE=$(curl -s -X POST "http://localhost:4000/orders/sync?accountId=$ACCOUNT_ID&limit=$LIMIT&offset=$OFFSET")
  
  echo "$RESPONSE"
  
  # Verificar se há mais pedidos
  HAS_MORE=$(echo "$RESPONSE" | grep -o '"hasMore":[^,}]*' | cut -d':' -f2)
  
  if [ "$HAS_MORE" = "true" ]; then
    OFFSET=$((OFFSET + LIMIT))
    sleep 2  # Aguardar 2 segundos entre requisições
  else
    break
  fi
done

echo "✅ Sincronização concluída!"
```

Salve como `sync-all-orders.sh` e execute:

```bash
chmod +x sync-all-orders.sh
./sync-all-orders.sh
```

---

## 📊 Verificar Pedidos Sincronizados

Após a sincronização, você pode verificar os pedidos:

### Via API:

```bash
# Listar pedidos
curl "http://localhost:4000/orders?accountId=cmhi1ysxp0000ytyyu7pf6t1g"

# Estatísticas
curl "http://localhost:4000/orders/stats?accountId=cmhi1ysxp0000ytyyu7pf6t1g"
```

### Via Frontend:

Acesse: `http://localhost:3000/orders`

Os pedidos aparecerão automaticamente na interface.

---

## 🔁 Re-sincronizar Pedidos Existentes

Se você quiser atualizar os dados de pedidos que já estão no banco:

```bash
curl -X POST "http://localhost:4000/orders/resync?accountId=cmhi1ysxp0000ytyyu7pf6t1g"
```

Este endpoint re-sincroniza os primeiros 50 pedidos que já estão no banco de dados.

---

## 📝 Dados Sincronizados

Para cada pedido, o sistema armazena:

- ✅ ID do pedido no ML
- ✅ Status (paid, confirmed, cancelled, pending)
- ✅ Valor total
- ✅ Data de criação
- ✅ ID e nickname do comprador
- ✅ ID e título do produto
- ✅ Link permanente do anúncio

---

## ⚙️ Sincronização Automática via Webhooks

Após a sincronização inicial, novos pedidos serão automaticamente sincronizados via webhooks do Mercado Livre quando:

- Um novo pedido for criado
- O status de um pedido for atualizado
- Houver qualquer mudança no pedido

---

## 🎯 Resultado da Sua Sincronização

**Total de pedidos sincronizados:** 105 pedidos  
**Status:** ✅ Sucesso  
**Erros:** 0

Todos os seus pedidos do Mercado Livre agora estão disponíveis no sistema!

---

## 💡 Dicas

1. **Sincronização Periódica**: Execute a sincronização uma vez por dia para garantir que todos os dados estejam atualizados
2. **Monitorar Erros**: Se houver erros, verifique os logs do backend para mais detalhes
3. **Limite da API**: O ML limita a 50 pedidos por requisição, então sempre use paginação
4. **Rate Limiting**: Aguarde alguns segundos entre requisições para não sobrecarregar a API

---

**Pronto! 🎉** Seus pedidos estão sincronizados e disponíveis no sistema.
