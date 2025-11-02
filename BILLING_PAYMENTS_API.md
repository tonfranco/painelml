# 💳 API de Pagamentos de Billing - Documentação

## 📋 Novos Endpoints Implementados

Implementamos endpoints adicionais baseados na documentação oficial do Mercado Livre para obter dados mais detalhados sobre pagamentos.

---

## 🔗 Endpoints Disponíveis

### 1. **Buscar Detalhes de Pagamentos de um Período**

Retorna todos os pagamentos recebidos em um período específico.

**Endpoint:**
```
GET /billing/payments/:periodKey?accountId={accountId}
```

**Parâmetros:**
- `periodKey` (path) - Chave do período (ex: "2024-10")
- `accountId` (query) - ID da conta
- `limit` (query, opcional) - Limite de resultados (padrão: 150, máx: 1000)
- `offset` (query, opcional) - Offset para paginação (padrão: 0)
- `sortBy` (query, opcional) - Ordenar por: `ID` ou `DATE` (padrão: ID)
- `orderBy` (query, opcional) - Ordem: `ASC` ou `DESC` (padrão: ASC)

**Exemplo:**
```bash
curl -X GET "http://localhost:4000/billing/payments/2024-10?accountId=abc123&limit=10"
```

**Resposta:**
```json
{
  "payments": [
    {
      "payment_id": "111111abcde",
      "credit_note_number": null,
      "payment_date": "2024-10-15T19:43:32",
      "payment_type": "collections_forced",
      "payment_type_description": "Pagos com débito automático",
      "payment_method": "account_money",
      "payment_method_description": "Mercado Pago",
      "payment_status": "approved",
      "payment_status_description": "Aplicado",
      "payment_amount": 30000.50,
      "amount_in_this_period": 500.32,
      "amount_in_other_period": 300.18,
      "remaining_amount": 0,
      "return_amount": 200
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

**Campos de Resposta:**
- `payment_id` - Número do pagamento
- `credit_note_number` - Número da nota de crédito (se aplicável)
- `payment_date` - Data do pagamento
- `payment_type` - Tipo de pagamento
- `payment_type_description` - Descrição do tipo
- `payment_method` - Método de pagamento
- `payment_method_description` - Descrição do método
- `payment_status` - Status do pagamento
- `payment_status_description` - Descrição do status
- `payment_amount` - Valor total do pagamento
- `amount_in_this_period` - Valor aplicado neste período
- `amount_in_other_period` - Valor aplicado em outro período
- `remaining_amount` - Saldo a favor para próximas notas
- `return_amount` - Saldo a favor que o vendedor possui

---

### 2. **Buscar Charges de um Pagamento Específico**

Retorna os charges (cobranças) associados a um pagamento.

**Endpoint:**
```
GET /billing/payment/:paymentId/charges?accountId={accountId}
```

**Parâmetros:**
- `paymentId` (path) - ID do pagamento
- `accountId` (query) - ID da conta
- `limit` (query, opcional) - Limite de resultados (padrão: 150, máx: 1000)
- `offset` (query, opcional) - Offset para paginação
- `sortBy` (query, opcional) - Ordenar por: `ID` ou `DATE`
- `orderBy` (query, opcional) - Ordem: `ASC` ou `DESC`

**Exemplo:**
```bash
curl -X GET "http://localhost:4000/billing/payment/111111abcde/charges?accountId=abc123"
```

**Resposta:**
```json
{
  "charges": [
    {
      "payment_info": {
        "payment_id": "111111abcde",
        "payment_date": "2024-10-15T19:43:32",
        "association_amount": 4500,
        "payment_amount": 999999.99
      },
      "charge_info": {
        "detail_id": 999999999,
        "detail_description": "Comissão ML",
        "detail_date": "2024-10-15T19:43:32"
      }
    }
  ],
  "total": 1
}
```

---

### 3. **Sincronizar Pagamentos de um Período**

Busca e salva os detalhes de pagamentos no banco de dados.

**Endpoint:**
```
POST /billing/payments/sync?accountId={accountId}&periodKey={periodKey}
```

**Parâmetros:**
- `accountId` (query) - ID da conta
- `periodKey` (query) - Chave do período (ex: "2024-10")

**Exemplo:**
```bash
curl -X POST "http://localhost:4000/billing/payments/sync?accountId=abc123&periodKey=2024-10"
```

**Resposta:**
```json
{
  "success": true,
  "message": "Synced 5 of 5 payments",
  "synced": 5,
  "total": 5
}
```

---

## 🗄️ Modelo de Dados

### BillingPayment

Nova tabela criada para armazenar detalhes de pagamentos:

```prisma
model BillingPayment {
  id                        String   @id @default(cuid())
  periodId                  String
  accountId                 String
  
  // Identificação
  paymentId                 String
  creditNoteNumber          String?
  
  // Informações do pagamento
  paymentDate               DateTime
  paymentType               String
  paymentTypeDescription    String?
  paymentMethod             String
  paymentMethodDescription  String?
  paymentStatus             String
  paymentStatusDescription  String?
  
  // Valores
  paymentAmount             Float
  amountInThisPeriod        Float
  amountInOtherPeriod       Float
  remainingAmount           Float
  returnAmount              Float
  
  // Metadados
  rawData                   Json?
  createdAt                 DateTime
  updatedAt                 DateTime
  
  period                    BillingPeriod @relation(...)
  
  @@unique([periodId, paymentId])
}
```

---

## 🚀 Como Usar

### 1. Sincronizar Períodos de Billing (Existente)

Primeiro, sincronize os períodos:

```bash
curl -X POST "http://localhost:4000/billing/sync?accountId=YOUR_ACCOUNT_ID"
```

### 2. Sincronizar Pagamentos de um Período (NOVO)

Depois, sincronize os pagamentos de um período específico:

```bash
curl -X POST "http://localhost:4000/billing/payments/sync?accountId=YOUR_ACCOUNT_ID&periodKey=2024-10"
```

### 3. Consultar Pagamentos (NOVO)

Consulte os pagamentos salvos:

```bash
curl -X GET "http://localhost:4000/billing/payments/2024-10?accountId=YOUR_ACCOUNT_ID"
```

### 4. Ver Charges de um Pagamento (NOVO)

Veja os detalhes de charges de um pagamento:

```bash
curl -X GET "http://localhost:4000/billing/payment/111111abcde/charges?accountId=YOUR_ACCOUNT_ID"
```

---

## 📊 Casos de Uso

### 1. **Análise de Métodos de Pagamento**
Identifique quais métodos de pagamento são mais usados:
- Mercado Pago
- Débito automático
- Cartão de crédito

### 2. **Rastreamento de Pagamentos**
Acompanhe o status de cada pagamento:
- Aprovado
- Pendente
- Rejeitado

### 3. **Reconciliação Financeira**
Compare valores esperados vs recebidos:
- `amount_in_this_period` - Valor aplicado no período
- `amount_in_other_period` - Valor aplicado em outros períodos
- `remaining_amount` - Saldo a favor

### 4. **Gestão de Saldo a Favor**
Monitore créditos disponíveis:
- `return_amount` - Saldo que pode ser usado em futuras notas

---

## ⚠️ Notas Importantes

### Disponibilidade da API
- ✅ Se a API retornar **200 OK**: Dados disponíveis
- ⚠️ Se retornar **403/404**: API não disponível para sua conta
  - Isso é **normal** para a maioria das contas
  - O sistema retorna arrays vazios com mensagem explicativa

### Permissões Necessárias
- Acesso à API de Billing/Integration do Mercado Livre
- Geralmente disponível apenas para contas empresariais ou com volumes altos

### Performance
- Use paginação (`limit` e `offset`) para grandes volumes
- Recomendado: sincronizar periodicamente (ex: diariamente)
- Limite máximo: 1000 registros por requisição

---

## 🔄 Fluxo Completo de Sincronização

```bash
# 1. Sincronizar períodos de billing
curl -X POST "http://localhost:4000/billing/sync?accountId=abc123"

# 2. Listar períodos disponíveis
curl -X GET "http://localhost:4000/billing/periods?accountId=abc123"

# 3. Para cada período, sincronizar pagamentos
curl -X POST "http://localhost:4000/billing/payments/sync?accountId=abc123&periodKey=2024-10"
curl -X POST "http://localhost:4000/billing/payments/sync?accountId=abc123&periodKey=2024-09"

# 4. Consultar estatísticas financeiras (já inclui dados de pagamentos)
curl -X GET "http://localhost:4000/billing/stats?accountId=abc123&months=6"
```

---

## 📚 Referências

- [Documentação Oficial ML - Pagamentos](https://developers.mercadolivre.com.br/pt_br/pagamentos)
- [API de Billing - Períodos](https://developers.mercadolivre.com.br/pt_br/relatorios-de-faturamento)
- [OAuth 2.0 - Mercado Livre](https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao)

---

## ✅ Resumo das Melhorias

| Recurso | Antes | Depois |
|---------|-------|--------|
| Detalhes de Pagamentos | ❌ Não disponível | ✅ Endpoint implementado |
| Charges por Pagamento | ❌ Não disponível | ✅ Endpoint implementado |
| Sincronização de Pagamentos | ❌ Não disponível | ✅ Endpoint implementado |
| Métodos de Pagamento | ❌ Não rastreado | ✅ Armazenado no banco |
| Status de Pagamentos | ❌ Não rastreado | ✅ Armazenado no banco |
| Saldo a Favor | ❌ Não rastreado | ✅ Armazenado no banco |

---

**Implementação concluída! 🎉**

Agora você tem acesso completo aos dados de pagamentos do Mercado Livre, permitindo análises mais detalhadas e reconciliação financeira precisa.
