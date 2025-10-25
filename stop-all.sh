#!/bin/bash

# 🛑 Script para parar todos os serviços

echo "🛑 Parando todos os serviços..."
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Parar túnel Cloudflare
if [ -f tunnel.pid ]; then
    TUNNEL_PID=$(cat tunnel.pid)
    if ps -p $TUNNEL_PID > /dev/null 2>&1; then
        echo "🌐 Parando Cloudflare Tunnel (PID: $TUNNEL_PID)..."
        kill $TUNNEL_PID
        rm tunnel.pid
        echo -e "${GREEN}✅ Túnel parado${NC}"
    else
        echo -e "${YELLOW}⚠️  Túnel já estava parado${NC}"
        rm tunnel.pid
    fi
else
    # Tentar parar qualquer cloudflared rodando
    if pgrep -f cloudflared > /dev/null; then
        echo "🌐 Parando Cloudflare Tunnel..."
        pkill -f cloudflared
        echo -e "${GREEN}✅ Túnel parado${NC}"
    else
        echo -e "${YELLOW}⚠️  Nenhum túnel rodando${NC}"
    fi
fi
echo ""

# 2. Parar backend (NestJS)
echo "🔧 Parando backend..."
if pgrep -f "nest start" > /dev/null || pgrep -f "ts-node.*main.ts" > /dev/null; then
    pkill -f "nest start"
    pkill -f "ts-node.*main.ts"
    echo -e "${GREEN}✅ Backend parado${NC}"
else
    echo -e "${YELLOW}⚠️  Backend já estava parado${NC}"
fi
echo ""

# 3. Parar frontend (Next.js)
echo "🎨 Parando frontend..."
if pgrep -f "next dev" > /dev/null; then
    pkill -f "next dev"
    echo -e "${GREEN}✅ Frontend parado${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend já estava parado${NC}"
fi
echo ""

# 4. Opcional: Parar Docker
read -p "Parar Docker também? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Parando Docker..."
    docker compose down
    echo -e "${GREEN}✅ Docker parado${NC}"
fi
echo ""

echo -e "${GREEN}✅ Todos os serviços foram parados!${NC}"
