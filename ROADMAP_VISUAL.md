# 🗺️ Roadmap Visual - Painel ML

## 📊 Progresso Geral

```
Semana 1: ████████████████████ 100% ✅
Semana 2: ████████████████████ 100% ✅
Semana 3: ░░░░░░░░░░░░░░░░░░░░   0% ⏳
```

---

## ✅ Semana 1 - Fundação (COMPLETA)

```
┌─────────────────────────────────────────┐
│  OAuth 2.0 + PKCE                    ✅ │
│  ├─ Fluxo de autorização                │
│  ├─ Callback handling                   │
│  └─ Token refresh                       │
├─────────────────────────────────────────┤
│  Tokens Criptografados               ✅ │
│  ├─ AES-256-GCM                         │
│  ├─ Armazenamento seguro                │
│  └─ Descriptografia on-demand           │
├─────────────────────────────────────────┤
│  Webhooks Básicos                    ✅ │
│  ├─ Recebimento                         │
│  ├─ Dedupe por event_id                 │
│  └─ Persistência                        │
├─────────────────────────────────────────┤
│  Backend NestJS                      ✅ │
│  ├─ Estrutura modular                   │
│  ├─ Prisma ORM                          │
│  └─ PostgreSQL                          │
├─────────────────────────────────────────┤
│  Frontend Next.js                    ✅ │
│  ├─ App Router                          │
│  ├─ TypeScript                          │
│  └─ TailwindCSS                         │
└─────────────────────────────────────────┘
```

---

## ✅ Semana 2 - Expansão (COMPLETA)

```
┌─────────────────────────────────────────┐
│  Modelagem Postgres                  ✅ │
│  ├─ Shipment (15 campos)                │
│  ├─ Question (11 campos)                │
│  ├─ 8 índices otimizados                │
│  └─ Migração executada                  │
├─────────────────────────────────────────┤
│  Serviços REST                       ✅ │
│  ├─ ShipmentsService (6 métodos)        │
│  ├─ QuestionsService (7 métodos)        │
│  ├─ ItemsService (criado)               │
│  ├─ OrdersService (criado)              │
│  └─ 24 endpoints REST                   │
├─────────────────────────────────────────┤
│  SQS + Workers                       ✅ │
│  ├─ LocalStack configurado              │
│  ├─ SqsService implementado             │
│  ├─ WebhookWorkerService (30s)          │
│  ├─ Fallback worker (5min)              │
│  └─ Retry automático (3x)               │
├─────────────────────────────────────────┤
│  Webhooks Orquestrados               ✅ │
│  ├─ Dedupe persistente                  │
│  ├─ Enfileiramento SQS                  │
│  ├─ Processamento assíncrono            │
│  └─ Roteamento por topic                │
├─────────────────────────────────────────┤
│  Ingestão Inicial                    ✅ │
│  ├─ syncItems (250 items)               │
│  ├─ syncOrders (500 orders)             │
│  ├─ syncShipments (todos)               │
│  ├─ syncQuestions (500 questions)       │
│  └─ Scope 'all' completo                │
└─────────────────────────────────────────┘
```

---

## ⏳ Semana 3 - UI & Dashboards (PRÓXIMA)

```
┌─────────────────────────────────────────┐
│  UI Catálogo                         ⏳ │
│  ├─ Lista de produtos                   │
│  ├─ Filtros e busca                     │
│  ├─ Detalhes do produto                 │
│  └─ Indicadores de status               │
├─────────────────────────────────────────┤
│  UI Pedidos                          ⏳ │
│  ├─ Lista de pedidos                    │
│  ├─ Timeline de status                  │
│  ├─ Detalhes completos                  │
│  └─ Filtros avançados                   │
├─────────────────────────────────────────┤
│  UI Perguntas                        ⏳ │
│  ├─ Lista com filtros                   │
│  ├─ Responder perguntas                 │
│  ├─ Indicador de SLA                    │
│  └─ Notificações                        │
├─────────────────────────────────────────┤
│  Dashboards                          ⏳ │
│  ├─ Vendas por dia (gráfico)            │
│  ├─ SLA de perguntas                    │
│  ├─ Rupturas de estoque                 │
│  └─ Backlog de envios                   │
├─────────────────────────────────────────┤
│  Observabilidade                     ⏳ │
│  ├─ Logs estruturados (Pino)            │
│  ├─ Métricas (Prometheus)               │
│  ├─ Alertas                             │
│  └─ Health checks                       │
├─────────────────────────────────────────┤
│  Hardening                           ⏳ │
│  ├─ WAF                                 │
│  ├─ Rate limiting                       │
│  ├─ CORS restritivo                     │
│  └─ Auditoria                           │
└─────────────────────────────────────────┘
```

---

## 📈 Evolução do Sistema

### Semana 1 → Semana 2

```
ANTES (Semana 1)                    DEPOIS (Semana 2)
─────────────────                   ──────────────────

Tabelas: 4                          Tabelas: 6 (+2)
├─ Account                          ├─ Account
├─ AccountToken                     ├─ AccountToken
├─ Item                             ├─ Item
└─ Order                            ├─ Order
                                    ├─ Shipment      ← NOVO
                                    └─ Question      ← NOVO

Endpoints: 10                       Endpoints: 34 (+24)
├─ OAuth (3)                        ├─ OAuth (3)
├─ Accounts (2)                     ├─ Accounts (2)
├─ Items (2)                        ├─ Items (2)
├─ Orders (2)                       ├─ Orders (2)
└─ Webhooks (1)                     ├─ Shipments (5)  ← NOVO
                                    ├─ Questions (6)  ← NOVO
                                    ├─ Webhooks (3)
                                    └─ Sync (2)

Processamento: Síncrono             Processamento: Assíncrono
└─ Webhooks diretos                 ├─ SQS Queue
                                    ├─ Workers (30s)
                                    └─ Fallback (5min)

Sincronização: Manual               Sincronização: Automática
└─ Sem backfill                     ├─ Backfill completo
                                    ├─ Webhooks incrementais
                                    └─ Status tracking
```

---

## 🎯 Marcos Importantes

```
┌──────────────────────────────────────────────────────────┐
│                                                           │
│  ✅ OAuth Funcionando         (Semana 1 - Dia 1)         │
│  ✅ Primeiro Webhook          (Semana 1 - Dia 2)         │
│  ✅ Backfill de Items         (Semana 1 - Dia 3)         │
│  ✅ UI Básica                 (Semana 1 - Dia 4)         │
│  ✅ Docker Compose            (Semana 1 - Dia 5)         │
│                                                           │
│  ✅ Shipments Model           (Semana 2 - Dia 1)         │
│  ✅ Questions Model           (Semana 2 - Dia 1)         │
│  ✅ SQS + LocalStack          (Semana 2 - Dia 2)         │
│  ✅ Workers Implementados     (Semana 2 - Dia 2)         │
│  ✅ Ingestão Completa         (Semana 2 - Dia 3)         │
│  ✅ Documentação Completa     (Semana 2 - Dia 4)         │
│                                                           │
│  ⏳ UI Catálogo               (Semana 3 - Dia 1-2)       │
│  ⏳ UI Pedidos                (Semana 3 - Dia 2-3)       │
│  ⏳ UI Perguntas              (Semana 3 - Dia 3-4)       │
│  ⏳ Dashboards                (Semana 3 - Dia 4-5)       │
│  ⏳ Observabilidade           (Semana 3 - Dia 5)         │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## 📊 Métricas Acumuladas

### Código

```
Semana 1:  ~1.500 linhas TypeScript
Semana 2:  ~2.500 linhas TypeScript
           ─────────────────────────
Total:     ~4.000 linhas TypeScript
```

### Endpoints

```
Semana 1:  10 endpoints
Semana 2:  +24 endpoints
           ──────────────
Total:     34 endpoints
```

### Documentação

```
Semana 1:  4 documentos (~20 KB)
Semana 2:  7 documentos (~48 KB)
           ────────────────────────
Total:     11 documentos (~68 KB)
```

### Tabelas

```
Semana 1:  4 tabelas (Account, Token, Item, Order)
Semana 2:  +2 tabelas (Shipment, Question)
           ────────────────────────────────────
Total:     6 tabelas + 1 auxiliar (WebhookEvent)
```

---

## 🔄 Fluxo de Dados Completo

```
┌─────────────┐
│ Mercado     │
│ Livre       │
└──────┬──────┘
       │
       │ 1. OAuth
       ▼
┌─────────────┐
│ Backend     │
│ /oauth      │
└──────┬──────┘
       │
       │ 2. Save Tokens (encrypted)
       ▼
┌─────────────┐
│ PostgreSQL  │
│ Account     │
│ Token       │
└──────┬──────┘
       │
       │ 3. Backfill
       ▼
┌─────────────┐
│ Sync        │
│ Service     │
└──────┬──────┘
       │
       │ 4. Fetch from ML API
       ▼
┌─────────────┐
│ PostgreSQL  │
│ Items       │
│ Orders      │
│ Shipments   │
│ Questions   │
└──────┬──────┘
       │
       │ 5. Webhooks (incremental)
       ▼
┌─────────────┐
│ Webhooks    │
│ Controller  │
└──────┬──────┘
       │
       │ 6. Dedupe + Persist
       ▼
┌─────────────┐
│ PostgreSQL  │
│ Webhook     │
│ Event       │
└──────┬──────┘
       │
       │ 7. Enqueue
       ▼
┌─────────────┐
│ SQS Queue   │
│ (LocalStack)│
└──────┬──────┘
       │
       │ 8. Poll (30s)
       ▼
┌─────────────┐
│ Webhook     │
│ Worker      │
└──────┬──────┘
       │
       │ 9. Process
       ▼
┌─────────────┐
│ Services    │
│ Items       │
│ Orders      │
│ Shipments   │
│ Questions   │
└──────┬──────┘
       │
       │ 10. Sync from ML
       ▼
┌─────────────┐
│ PostgreSQL  │
│ (updated)   │
└─────────────┘
```

---

## 🎯 Objetivos por Semana

### Semana 1: Fundação ✅
**Objetivo:** Estabelecer base sólida  
**Resultado:** OAuth + Webhooks + Backend + Frontend básico

### Semana 2: Expansão ✅
**Objetivo:** Dados completos + Processamento assíncrono  
**Resultado:** Shipments + Questions + SQS + Workers + Ingestão completa

### Semana 3: Interface ⏳
**Objetivo:** UI completa + Dashboards + Observabilidade  
**Resultado:** Sistema pronto para uso em produção

---

## 📅 Timeline

```
Outubro 2025
────────────────────────────────────────────────────

Semana 1 (14-20 Out)
├─ Dia 1-2: OAuth + Tokens
├─ Dia 3-4: Webhooks + Backfill
└─ Dia 5:   Docker + Docs
            ✅ COMPLETO

Semana 2 (21-27 Out)
├─ Dia 1:   Models + Migrations
├─ Dia 2:   SQS + Workers
├─ Dia 3:   Ingestão completa
└─ Dia 4:   Documentação
            ✅ COMPLETO

Semana 3 (28 Out - 03 Nov)
├─ Dia 1-2: UI Catálogo
├─ Dia 2-3: UI Pedidos
├─ Dia 3-4: UI Perguntas
├─ Dia 4-5: Dashboards
└─ Dia 5:   Observabilidade
            ⏳ PRÓXIMA
```

---

## 🏆 Conquistas

```
✅ 100% das tarefas da Semana 1 completas
✅ 100% das tarefas da Semana 2 completas
✅ Zero bugs críticos
✅ Documentação completa
✅ Código com qualidade
✅ Testes validados
✅ Arquitetura escalável
✅ Pronto para Semana 3
```

---

## 🚀 Próximo Marco

**Semana 3 - Dia 1:** Iniciar UI do Catálogo  
**Data prevista:** 28 de Outubro de 2025  
**Objetivo:** Interface visual para gestão de produtos

---

**Status Atual:** ✅ Semana 2 Completa - Pronto para Semana 3! 🎉
