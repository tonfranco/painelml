#!/bin/bash

# 🚀 Comandos Rápidos - Semana 2
# Sistema de Gestão Mercado Livre

echo "🎯 Comandos Rápidos - Semana 2"
echo "================================"

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ========================================
# 1. INFRAESTRUTURA
# ========================================

echo -e "\n${BLUE}📦 1. INFRAESTRUTURA${NC}"

# Subir serviços
alias infra-up='docker-compose up -d'
echo "  infra-up          - Subir Postgres + LocalStack"

# Parar serviços
alias infra-down='docker-compose down'
echo "  infra-down        - Parar serviços"

# Ver logs
alias infra-logs='docker-compose logs -f'
echo "  infra-logs        - Ver logs dos containers"

# Status
alias infra-status='docker-compose ps'
echo "  infra-status      - Ver status dos serviços"

# ========================================
# 2. BANCO DE DADOS
# ========================================

echo -e "\n${BLUE}🗄️  2. BANCO DE DADOS${NC}"

# Rodar migrações
alias db-migrate='cd backend && npm run prisma:migrate'
echo "  db-migrate        - Rodar migrações"

# Abrir Prisma Studio
alias db-studio='cd backend && npm run prisma:studio'
echo "  db-studio         - Abrir Prisma Studio (GUI)"

# Reset do banco
alias db-reset='cd backend && npm run db:reset'
echo "  db-reset          - Reset completo do banco"

# ========================================
# 3. BACKEND
# ========================================

echo -e "\n${BLUE}⚙️  3. BACKEND${NC}"

# Iniciar backend
alias backend-start='cd backend && npm run start:dev'
echo "  backend-start     - Iniciar backend (dev mode)"

# Build
alias backend-build='cd backend && npm run build'
echo "  backend-build     - Build do backend"

# Testes
alias backend-test='cd backend && npm test'
echo "  backend-test      - Rodar testes"

# ========================================
# 4. LOCALSTACK (SQS)
# ========================================

echo -e "\n${BLUE}📨 4. LOCALSTACK (SQS)${NC}"

# Inicializar fila
alias sqs-init='cd backend && ./scripts/init-localstack.sh'
echo "  sqs-init          - Inicializar fila SQS"

# Listar filas
alias sqs-list='aws --endpoint-url=http://localhost:4566 --region us-east-1 sqs list-queues'
echo "  sqs-list          - Listar filas"

# Ver mensagens
alias sqs-receive='aws --endpoint-url=http://localhost:4566 --region us-east-1 sqs receive-message --queue-url http://localhost:4566/000000000000/painelml-webhooks'
echo "  sqs-receive       - Ver mensagens na fila"

# Atributos da fila
alias sqs-attrs='aws --endpoint-url=http://localhost:4566 --region us-east-1 sqs get-queue-attributes --queue-url http://localhost:4566/000000000000/painelml-webhooks --attribute-names All'
echo "  sqs-attrs         - Ver atributos da fila"

# ========================================
# 5. API - CONTAS
# ========================================

echo -e "\n${BLUE}👤 5. API - CONTAS${NC}"

# Listar contas
echo "  curl http://localhost:4000/accounts"

# Conectar nova conta
echo "  # Abrir no browser: http://localhost:4000/meli/oauth/start"

# ========================================
# 6. API - SINCRONIZAÇÃO
# ========================================

echo -e "\n${BLUE}🔄 6. API - SINCRONIZAÇÃO${NC}"

# Sincronizar tudo
echo '  curl -X POST "http://localhost:4000/sync/start?accountId=<ID>&scope=all&days=30"'

# Sincronizar apenas items
echo '  curl -X POST "http://localhost:4000/sync/start?accountId=<ID>&scope=items&days=30"'

# Sincronizar apenas orders
echo '  curl -X POST "http://localhost:4000/sync/start?accountId=<ID>&scope=orders&days=30"'

# Sincronizar apenas shipments
echo '  curl -X POST "http://localhost:4000/sync/start?accountId=<ID>&scope=shipments&days=30"'

# Sincronizar apenas questions
echo '  curl -X POST "http://localhost:4000/sync/start?accountId=<ID>&scope=questions&days=30"'

# Ver status
echo '  curl "http://localhost:4000/sync/status?accountId=<ID>"'

# ========================================
# 7. API - ITEMS
# ========================================

echo -e "\n${BLUE}📦 7. API - ITEMS${NC}"

# Listar items
echo '  curl "http://localhost:4000/items?accountId=<ID>"'

# Estatísticas
echo '  curl "http://localhost:4000/items/stats?accountId=<ID>"'

# ========================================
# 8. API - ORDERS
# ========================================

echo -e "\n${BLUE}🛒 8. API - ORDERS${NC}"

# Listar orders
echo '  curl "http://localhost:4000/orders?accountId=<ID>&days=30"'

# Estatísticas
echo '  curl "http://localhost:4000/orders/stats?accountId=<ID>&days=30"'

# ========================================
# 9. API - SHIPMENTS
# ========================================

echo -e "\n${BLUE}📮 9. API - SHIPMENTS${NC}"

# Listar shipments
echo '  curl "http://localhost:4000/shipments?accountId=<ID>"'

# Estatísticas
echo '  curl "http://localhost:4000/shipments/stats?accountId=<ID>"'

# Backfill
echo '  curl -X POST "http://localhost:4000/shipments/backfill?accountId=<ID>"'

# Sincronizar um shipment
echo '  curl -X POST "http://localhost:4000/shipments/sync/<SHIPMENT_ID>?accountId=<ID>"'

# ========================================
# 10. API - QUESTIONS
# ========================================

echo -e "\n${BLUE}❓ 10. API - QUESTIONS${NC}"

# Listar questions
echo '  curl "http://localhost:4000/questions?accountId=<ID>"'

# Listar não respondidas
echo '  curl "http://localhost:4000/questions?accountId=<ID>&status=UNANSWERED"'

# Estatísticas (com SLA)
echo '  curl "http://localhost:4000/questions/stats?accountId=<ID>"'

# Backfill
echo '  curl -X POST "http://localhost:4000/questions/backfill?accountId=<ID>"'

# Responder pergunta
echo '  curl -X POST "http://localhost:4000/questions/<QUESTION_ID>/answer?accountId=<ID>" \'
echo '       -H "Content-Type: application/json" \'
echo '       -d '"'"'{"answer": "Sua resposta aqui"}'"'"

# ========================================
# 11. API - WEBHOOKS
# ========================================

echo -e "\n${BLUE}🔔 11. API - WEBHOOKS${NC}"

# Estatísticas
echo '  curl "http://localhost:4000/meli/webhooks/stats"'

# Webhooks pendentes
echo '  curl "http://localhost:4000/meli/webhooks/pending"'

# Simular webhook
echo '  curl -X POST http://localhost:4000/meli/webhooks \'
echo '       -H "Content-Type: application/json" \'
echo '       -d '"'"'{
         "_id": "test-123",
         "resource": "/orders/123456789",
         "topic": "orders_v2",
         "user_id": "123456",
         "application_id": "123",
         "attempts": 1,
         "sent": "2025-01-01T00:00:00Z",
         "received": "2025-01-01T00:00:00Z"
       }'"'"

# ========================================
# 12. MONITORAMENTO
# ========================================

echo -e "\n${BLUE}📊 12. MONITORAMENTO${NC}"

# Logs do worker
echo '  docker logs -f painelml-backend | grep WebhookWorker'

# Logs do LocalStack
echo '  docker logs -f painelml-localstack'

# Logs do Postgres
echo '  docker logs -f painelml-postgres'

# ========================================
# 13. FLUXO COMPLETO
# ========================================

echo -e "\n${YELLOW}🎯 13. FLUXO COMPLETO DE SETUP${NC}"
echo ""
echo "  # 1. Subir infraestrutura"
echo "  docker-compose up -d"
echo ""
echo "  # 2. Aguardar serviços ficarem prontos"
echo "  docker-compose ps"
echo ""
echo "  # 3. Rodar migrações"
echo "  cd backend && npm run prisma:migrate"
echo ""
echo "  # 4. Iniciar backend"
echo "  npm run start:dev"
echo ""
echo "  # 5. Conectar conta ML (abrir no browser)"
echo "  http://localhost:4000/meli/oauth/start"
echo ""
echo "  # 6. Listar contas e pegar ID"
echo "  curl http://localhost:4000/accounts"
echo ""
echo "  # 7. Fazer ingestão inicial completa"
echo '  curl -X POST "http://localhost:4000/sync/start?accountId=<ID>&scope=all&days=30"'
echo ""
echo "  # 8. Verificar progresso"
echo '  curl "http://localhost:4000/sync/status?accountId=<ID>"'
echo ""
echo "  # 9. Ver dados sincronizados"
echo "  npm run prisma:studio"
echo ""

echo -e "\n${GREEN}✅ Comandos carregados! Use os aliases acima.${NC}"
echo -e "${GREEN}📖 Documentação completa: SEMANA2_IMPLEMENTADO.md${NC}\n"
