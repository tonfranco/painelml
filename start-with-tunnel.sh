#!/bin/bash

# 🚀 Script para iniciar o sistema com Cloudflare Tunnel
# Atualiza automaticamente as URLs no .env.local

set -e

echo "🚀 Iniciando Painel ML com Cloudflare Tunnel..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar se Docker está rodando
echo "📦 Verificando Docker..."
if ! docker compose ps | grep -q "postgres.*Up"; then
    echo -e "${YELLOW}⚠️  Postgres não está rodando. Iniciando...${NC}"
    docker compose up -d postgres
    sleep 3
fi
echo -e "${GREEN}✅ Docker OK${NC}"
echo ""

# 2. Iniciar Cloudflare Tunnel em background
echo "🌐 Iniciando Cloudflare Tunnel..."
rm -f tunnel.log
cloudflared tunnel --url http://localhost:4000 > tunnel.log 2>&1 &
TUNNEL_PID=$!
echo "   PID do túnel: $TUNNEL_PID"

# Aguardar URL ser gerada
echo "   Aguardando URL do túnel..."
MAX_ATTEMPTS=20
ATTEMPT=0
TUNNEL_URL=""

while [ $ATTEMPT -lt $MAX_ATTEMPTS ] && [ -z "$TUNNEL_URL" ]; do
    sleep 1
    TUNNEL_URL=$(grep -o 'https://[^[:space:]]*\.trycloudflare\.com' tunnel.log 2>/dev/null | head -1)
    ATTEMPT=$((ATTEMPT + 1))
    echo -n "."
done
echo ""

if [ -z "$TUNNEL_URL" ]; then
    echo -e "${RED}❌ Erro: Não foi possível obter URL do túnel${NC}"
    echo "   Verifique o log: cat tunnel.log"
    kill $TUNNEL_PID 2>/dev/null || true
    exit 1
fi

echo -e "${GREEN}✅ Túnel iniciado: $TUNNEL_URL${NC}"
echo ""

# 3. Atualizar .env.local
echo "📝 Atualizando backend/.env.local..."
cd backend

# Backup do .env.local atual
if [ -f .env.local ]; then
    cp .env.local .env.local.backup
fi

# Criar/atualizar .env.local
cat > .env.local << EOF
# Database
DATABASE_URL="postgresql://painelml:dev_password_123@localhost:5432/painelml?schema=public"

# Encryption
ENCRYPTION_KEY="669b6ec3b9bcce0061a18ac3cf5e805d65c23559d9982f6cb8fc2ff9871a2670"

# Mercado Livre OAuth
MELI_CLIENT_ID="8780271440058520"
MELI_CLIENT_SECRET="5SZaA9RU5d33iFVU2tCIBdatIJO3qOKv"
MELI_REDIRECT_URI="${TUNNEL_URL}/meli/oauth/callback"

# App URLs
APP_BASE_URL="${TUNNEL_URL}"
FRONTEND_BASE_URL="http://localhost:3000"

# Cookie Secret
COOKIE_SECRET="your-random-secret-for-cookies"

# AWS SQS / LocalStack
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="test"
AWS_SECRET_ACCESS_KEY="test"
SQS_ENDPOINT="http://localhost:4566"
SQS_QUEUE_NAME="painelml-webhooks"
EOF

echo -e "${GREEN}✅ .env.local atualizado${NC}"
echo ""

# 4. Gerar Prisma Client (se necessário)
echo "🔧 Verificando Prisma Client..."
if ! npx prisma validate > /dev/null 2>&1; then
    echo "   Gerando Prisma Client..."
    npx prisma generate > /dev/null 2>&1
fi
echo -e "${GREEN}✅ Prisma OK${NC}"
echo ""

# 5. Mostrar informações importantes
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Sistema configurado com sucesso!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Informações importantes:"
echo ""
echo "   🌐 URL do Túnel: $TUNNEL_URL"
echo "   🔗 Redirect URI: ${TUNNEL_URL}/meli/oauth/callback"
echo "   📝 PID do Túnel: $TUNNEL_PID"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}⚠️  AÇÃO NECESSÁRIA:${NC}"
echo ""
echo "   1. Acesse: https://developers.mercadolibre.com.br/apps"
echo "   2. Selecione sua aplicação"
echo "   3. Atualize o Redirect URI para:"
echo ""
echo -e "      ${GREEN}${TUNNEL_URL}/meli/oauth/callback${NC}"
echo ""
echo "   4. Salve as alterações"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Próximos passos:"
echo ""
echo "   Terminal 1 (este): npm run start:dev"
echo "   Terminal 2: cd ../frontend && npm run dev"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Dica: Salve o PID do túnel para parar depois:"
echo "   kill $TUNNEL_PID"
echo ""
echo "📝 Logs do túnel: tail -f ../tunnel.log"
echo ""

# Salvar PID do túnel para referência
echo $TUNNEL_PID > ../tunnel.pid
echo "   PID salvo em: ../tunnel.pid"
echo ""

# Perguntar se quer iniciar o backend agora
read -p "Iniciar backend agora? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔧 Iniciando backend..."
    npm run start:dev
else
    echo ""
    echo "✅ Configuração completa!"
    echo "   Execute: npm run start:dev (quando estiver pronto)"
fi
