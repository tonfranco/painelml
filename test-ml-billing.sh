#!/bin/bash

# Script para testar API de Billing do Mercado Livre

echo "🚀 Testando API de Billing do Mercado Livre"
echo ""

# Verificar se está no diretório correto
if [ ! -f "backend/prisma/schema.prisma" ]; then
    echo "❌ Execute este script na raiz do projeto painelml"
    exit 1
fi

cd backend

# Obter o token e executar o teste
echo "1️⃣  Obtendo access token do banco de dados..."
echo ""

node ../get-token.js > /tmp/ml-token-output.txt 2>&1

if [ $? -ne 0 ]; then
    cat /tmp/ml-token-output.txt
    exit 1
fi

# Extrair o token do output
TOKEN=$(cat /tmp/ml-token-output.txt | grep 'ML_ACCESS_TOKEN=' | cut -d'"' -f2)

if [ -z "$TOKEN" ]; then
    echo "❌ Não foi possível obter o access token"
    cat /tmp/ml-token-output.txt
    exit 1
fi

echo "✅ Token obtido com sucesso!"
echo ""
echo "2️⃣  Testando APIs de Billing..."
echo ""

# Executar o teste
ML_ACCESS_TOKEN="$TOKEN" node ../test-billing-api.js

# Limpar arquivo temporário
rm -f /tmp/ml-token-output.txt
