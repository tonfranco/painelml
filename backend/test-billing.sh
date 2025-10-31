#!/bin/bash

# Script para testar endpoints do módulo Billing
# Execute: chmod +x test-billing.sh && ./test-billing.sh

BASE_URL="http://localhost:4000"
ACCOUNT_ID="cmh3r4euy0000ytriw7xq545g"

echo "🧪 Testando Módulo Billing"
echo "=========================="
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Sincronizar períodos
echo -e "${BLUE}1. Sincronizando períodos de faturamento...${NC}"
curl -X POST "${BASE_URL}/billing/sync?accountId=${ACCOUNT_ID}" \
  -H "Content-Type: application/json" \
  | jq '.'
echo ""
echo "Aguardando 2 segundos..."
sleep 2
echo ""

# 2. Listar períodos
echo -e "${BLUE}2. Listando períodos de faturamento...${NC}"
curl -X GET "${BASE_URL}/billing/periods?accountId=${ACCOUNT_ID}" \
  -H "Content-Type: application/json" \
  | jq '.'
echo ""

# 3. Ver estatísticas
echo -e "${BLUE}3. Buscando estatísticas financeiras...${NC}"
curl -X GET "${BASE_URL}/billing/stats?accountId=${ACCOUNT_ID}" \
  -H "Content-Type: application/json" \
  | jq '.'
echo ""

# 4. Listar com limite
echo -e "${BLUE}4. Listando últimos 3 períodos...${NC}"
curl -X GET "${BASE_URL}/billing/periods?accountId=${ACCOUNT_ID}&limit=3" \
  -H "Content-Type: application/json" \
  | jq '.'
echo ""

echo -e "${GREEN}✅ Testes concluídos!${NC}"
echo ""
echo "💡 Dica: Para ver detalhes de um período específico:"
echo "   curl ${BASE_URL}/billing/periods/PERIOD_ID | jq '.'"
