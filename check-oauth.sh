#!/bin/bash

# Script para verificar configuração OAuth do Mercado Livre

echo "🔍 Verificando configuração OAuth do Mercado Livre..."
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar se backend/.env.local existe
if [ ! -f "backend/.env.local" ]; then
  echo -e "${RED}❌ Arquivo backend/.env.local não encontrado${NC}"
  exit 1
fi

# 2. Extrair variáveis
cd backend
MELI_CLIENT_ID=$(grep "MELI_CLIENT_ID" .env.local | cut -d'"' -f2)
MELI_REDIRECT_URI=$(grep "MELI_REDIRECT_URI" .env.local | cut -d'"' -f2)
APP_BASE_URL=$(grep "APP_BASE_URL" .env.local | cut -d'"' -f2)
FRONTEND_BASE_URL=$(grep "FRONTEND_BASE_URL" .env.local | cut -d'"' -f2)

echo "📄 Configurações encontradas:"
echo "   MELI_CLIENT_ID: $MELI_CLIENT_ID"
echo "   MELI_REDIRECT_URI: $MELI_REDIRECT_URI"
echo "   APP_BASE_URL: $APP_BASE_URL"
echo "   FRONTEND_BASE_URL: $FRONTEND_BASE_URL"
echo ""

# 3. Validar URLs
echo "✅ Validando URLs..."

# Verificar se tem https
if [[ ! $MELI_REDIRECT_URI =~ ^https:// ]]; then
  echo -e "${RED}❌ MELI_REDIRECT_URI deve começar com https://${NC}"
fi

if [[ ! $APP_BASE_URL =~ ^https:// ]]; then
  echo -e "${RED}❌ APP_BASE_URL deve começar com https://${NC}"
fi

# Verificar se tem barra no final
if [[ $APP_BASE_URL =~ /$ ]]; then
  echo -e "${YELLOW}⚠️  APP_BASE_URL não deve ter barra / no final${NC}"
fi

# Verificar se REDIRECT_URI tem o path correto
if [[ ! $MELI_REDIRECT_URI =~ /meli/oauth/callback$ ]]; then
  echo -e "${RED}❌ MELI_REDIRECT_URI deve terminar com /meli/oauth/callback${NC}"
fi

# Verificar se as URLs base são iguais
REDIRECT_BASE=$(echo $MELI_REDIRECT_URI | sed 's|/meli/oauth/callback||')
if [ "$REDIRECT_BASE" != "$APP_BASE_URL" ]; then
  echo -e "${RED}❌ Base da MELI_REDIRECT_URI ($REDIRECT_BASE) diferente de APP_BASE_URL ($APP_BASE_URL)${NC}"
else
  echo -e "${GREEN}✅ URLs estão consistentes${NC}"
fi

echo ""

# 4. Verificar túnel Cloudflare
echo "🌐 Verificando túnel Cloudflare..."
if ps aux | grep -q "[c]loudflared tunnel"; then
  echo -e "${GREEN}✅ Túnel Cloudflare está rodando${NC}"
else
  echo -e "${RED}❌ Túnel Cloudflare NÃO está rodando${NC}"
  echo "   Execute: cloudflared tunnel --url http://localhost:4000"
fi
echo ""

# 5. Verificar backend
echo "🔧 Verificando backend..."
if curl -s http://localhost:4000 > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Backend está respondendo na porta 4000${NC}"
else
  echo -e "${RED}❌ Backend NÃO está respondendo na porta 4000${NC}"
  echo "   Execute: cd backend && npm run start:dev"
fi
echo ""

# 6. Testar túnel
if [ ! -z "$APP_BASE_URL" ]; then
  echo "🧪 Testando túnel..."
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_BASE_URL" 2>/dev/null)
  
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
    echo -e "${GREEN}✅ Túnel está acessível (HTTP $HTTP_CODE)${NC}"
  else
    echo -e "${RED}❌ Túnel não está acessível (HTTP $HTTP_CODE)${NC}"
    echo "   Verifique se o túnel está rodando e se a URL está correta"
  fi
fi
echo ""

# 7. Testar endpoint OAuth
if [ ! -z "$APP_BASE_URL" ]; then
  echo "🔐 Testando endpoint OAuth..."
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_BASE_URL/meli/oauth/start" 2>/dev/null)
  
  if [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "301" ]; then
    echo -e "${GREEN}✅ Endpoint OAuth está funcionando (redirect $HTTP_CODE)${NC}"
  else
    echo -e "${RED}❌ Endpoint OAuth não está funcionando (HTTP $HTTP_CODE)${NC}"
  fi
fi
echo ""

# 8. Resumo
echo "📋 RESUMO:"
echo ""
echo "Para o OAuth funcionar, você precisa:"
echo "1. ✅ Túnel Cloudflare rodando"
echo "2. ✅ Backend rodando na porta 4000"
echo "3. ✅ URLs no .env.local corretas"
echo "4. ✅ Mesma URL configurada no painel do ML"
echo "5. ✅ Backend reiniciado após mudar .env.local"
echo ""
echo "🔗 Painel do ML: https://developers.mercadolibre.com.br/apps"
echo "   Redirect URI deve ser: $MELI_REDIRECT_URI"
echo ""
